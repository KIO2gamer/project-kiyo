const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
	StringSelectMenuBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleError } = require('../../utils/errorHandler');
const Logger = require('../../../../logger').default;
const { MessageFlags } = require('discord.js');

// Command cache with expiration time
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let commandCache = {
	commands: [],
	timestamp: 0,
};

// Command usage tracking
const commandUsage = new Map();

// Category emoji mapping
const CATEGORY_EMOJIS = {
	admin: '⚙️',
	fun: '🎲',
	games: '🎮',
	info: 'ℹ️',
	moderation: '🛡️',
	roles: '👑',
	setup: '🔧',
	utility: '🛠️',
	media: '🎬',
};

// Constants
const EMBED_COLOR = '#3498db';
const MAX_FIELD_LENGTH = 1024;
const MAX_FIELDS_PER_EMBED = 25;
const PAGINATION_TIMEOUT = 300000; // 5 minutes

module.exports = {
	description_full:
		'Displays comprehensive help information for all bot commands. You can view all commands grouped by category, get detailed information about specific commands, search for commands using keywords, or filter commands by category.',
	usage: '/help [command:command_name] [search:keyword] [category:category_name]',
	examples: ['/help', '/help command:ping', '/help search:user', '/help category:moderation'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help information for bot commands')
		.addStringOption(option =>
			option
				.setName('command')
				.setDescription('Get detailed info about a specific command')
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('search')
				.setDescription('Search for commands by keyword')
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('category')
				.setDescription('Filter commands by category')
				.setRequired(false)
				.addChoices(
					...Object.entries(CATEGORY_EMOJIS).map(([category, emoji]) => ({
						name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
						value: category,
					})),
				),
		),

	async execute(interaction) {
		try {
			await interaction.deferReply();

			const commandName = interaction.options.getString('command');
			const searchQuery = interaction.options.getString('search');
			const categoryFilter = interaction.options.getString('category');

			// Track command usage
			this.trackUsage('help');

			try {
				// Get all commands from command folders
				const commands = await getAllCommands();

				if (commandName) {
					this.trackUsage('help_command_details');
					await handleCommandDetails(interaction, commandName, commands);
				} else if (searchQuery) {
					this.trackUsage('help_search');
					await handleSearchQuery(interaction, searchQuery, commands);
				} else if (categoryFilter) {
					this.trackUsage('help_category');
					await handleCategoryFilter(interaction, categoryFilter, commands);
				} else {
					this.trackUsage('help_overview');
					await handleGeneralHelp(interaction, commands);
				}
			} catch (error) {
				if (error.code === 50001) {
					await handleError(
						interaction,
						error,
						'PERMISSION',
						'I do not have permission to view or manage commands in this server.',
					);
				} else if (error.code === 'ENOENT') {
					await handleError(
						interaction,
						error,
						'FILE_SYSTEM',
						'Failed to read command files. Please contact the bot administrator.',
					);
				} else {
					await handleError(
						interaction,
						error,
						'DATA_FETCH',
						'Failed to fetch command information. Please try again later.',
					);
				}
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while processing the help command.',
			);
		}
	},

	trackUsage(subCommand) {
		const currentCount = commandUsage.get(subCommand) || 0;
		commandUsage.set(subCommand, currentCount + 1);
	},

	getUsageStats() {
		return Object.fromEntries(commandUsage);
	},
};

// Get all commands recursively from the commands directory
async function getAllCommands() {
	try {
		// Check if cache is valid
		const now = Date.now();
		if (commandCache.commands.length > 0 && now - commandCache.timestamp < CACHE_LIFETIME) {
			Logger.log(
				'HELP',
				`Using cached commands (${commandCache.commands.length} commands)`,
				'info',
			);
			return commandCache.commands;
		}

		Logger.log('HELP', 'Cache expired or empty, loading commands from disk', 'info');
		const commands = [];
		const commandsPath = path.join(__dirname, '..');

		// Read and validate command directories
		const categories = await fs.promises.readdir(commandsPath).then(dirs =>
			dirs.filter(async dir => {
				try {
					const stat = await fs.promises.stat(path.join(commandsPath, dir));
					return stat.isDirectory();
				} catch (error) {
					Logger.log(
						'HELP',
						`Error checking directory ${dir}: ${error.message}`,
						'error',
					);
					return false;
				}
			}),
		);

		// Process each category
		for (const category of categories) {
			const categoryPath = path.join(commandsPath, category);
			try {
				const files = await fs.promises.readdir(categoryPath);
				const commandFiles = files.filter(file => file.endsWith('.js'));

				for (const file of commandFiles) {
					try {
						const filePath = path.join(categoryPath, file);
						// Clear require cache to ensure fresh data
						delete require.cache[require.resolve(filePath)];
						const command = require(filePath);

						// Validate command structure
						if (!command.data || !command.execute) {
							Logger.log('HELP', `Invalid command structure in ${file}`, 'warn');
							continue;
						}

						command.category = category;
						commands.push(command);
						Logger.log('HELP', `Loaded command: ${command.data.name}`, 'debug');
					} catch (error) {
						Logger.log(
							'HELP',
							`Error loading command ${file}: ${error.message}`,
							'error',
						);
						// Continue loading other commands
						continue;
					}
				}
			} catch (error) {
				Logger.log('HELP', `Error reading category ${category}: ${error.message}`, 'error');
				// Continue with other categories
				continue;
			}
		}

		if (commands.length === 0) {
			throw new Error('No valid commands found');
		}

		// Update cache
		commandCache.commands = commands;
		commandCache.timestamp = now;
		Logger.log('HELP', `Successfully cached ${commands.length} commands`, 'info');

		return commands;
	} catch (error) {
		Logger.log('HELP', `Failed to load commands: ${error.message}`, 'error');
		throw new Error(`Failed to load commands: ${error.message}`);
	}
}

async function handleCommandDetails(interaction, commandName, commands) {
	try {
		// Find exact command match first
		const command = commands.find(
			cmd => cmd.data.name.toLowerCase() === commandName.toLowerCase(),
		);

		if (!command) {
			// Find similar commands using more sophisticated matching
			const similarCommands = commands
				.map(cmd => ({
					command: cmd,
					similarity: calculateSimilarity(
						cmd.data.name.toLowerCase(),
						commandName.toLowerCase(),
					),
				}))
				.filter(result => result.similarity > 0.4) // Minimum similarity threshold
				.sort((a, b) => b.similarity - a.similarity)
				.slice(0, 3)
				.map(result => ({
					name: result.command.data.name,
					category: result.command.category,
					similarity: result.similarity,
				}));

			const suggestionText =
				similarCommands.length > 0
					? [
							'Did you mean:',
							...similarCommands.map(
								cmd =>
									`• \`/${cmd.name}\` (${CATEGORY_EMOJIS[cmd.category.toLowerCase()] || '📁'} ${cmd.category})`,
							),
						].join('\n')
					: "No similar commands found. Try using `/help search:keyword` to find what you're looking for.";

			await handleError(
				interaction,
				new Error('Command not found'),
				'NOT_FOUND',
				`Command \`${commandName}\` not found.\n\n${suggestionText}`,
			);
			return;
		}

		// Create embed with command details
		const categoryEmoji = CATEGORY_EMOJIS[command.category?.toLowerCase()] || '📁';
		const embed = new EmbedBuilder()
			.setTitle(`Command: /${command.data.name}`)
			.setDescription(
				command.description_full || command.data.description || 'No description available',
			)
			.setColor(EMBED_COLOR)
			.setAuthor({
				name: `${categoryEmoji} ${command.category || 'Uncategorized'} Category`,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setTimestamp();

		// Add command options with better formatting
		if (command.data.options?.length > 0) {
			const optionsText = command.data.options
				.map(option => {
					const required = option.required ? '`Required`' : '`Optional`';
					let text = `• **${option.name}** ${required}\n  ${option.description}`;

					if (option.choices?.length > 0) {
						text += `\n  Choices: ${option.choices.map(c => `\`${c.name}\``).join(', ')}`;
					}

					// Add type-specific information
					if (option.type) {
						const typeInfo = getOptionTypeInfo(option);
						if (typeInfo) {
							text += `\n  ${typeInfo}`;
						}
					}

					return text;
				})
				.join('\n\n');

			embed.addFields({
				name: '🔧 Options',
				value: optionsText || 'No options available',
			});
		}

		// Add usage examples with better formatting
		if (command.usage) {
			embed.addFields({
				name: '💻 Usage',
				value: `\`\`\`\n${command.usage}\n\`\`\``,
			});
		}

		// Add examples with better formatting
		if (command.examples?.length > 0) {
			embed.addFields({
				name: '📝 Examples',
				value: command.examples.map(ex => `• \`${ex}\``).join('\n'),
			});
		}

		// Add permissions with better formatting
		if (command.permissions?.length > 0) {
			embed.addFields({
				name: '🔒 Required Permissions',
				value: command.permissions
					.map(perm => `• \`${formatPermission(perm)}\``)
					.join('\n'),
			});
		}

		// Add cooldown if present
		if (command.cooldown) {
			embed.addFields({
				name: '⏱️ Cooldown',
				value: formatCooldown(command.cooldown),
				inline: true,
			});
		}

		// Add related commands with better context
		const relatedCommands = findRelatedCommands(command, commands);
		if (relatedCommands.length > 0) {
			embed.addFields({
				name: '🔗 Related Commands',
				value: relatedCommands
					.map(cmd => `• \`/${cmd.data.name}\` - ${cmd.data.description}`)
					.join('\n'),
			});
		}

		// Add navigation buttons
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('overview')
				.setLabel('Back to Overview')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('📚'),
			new ButtonBuilder()
				.setCustomId('category')
				.setLabel(`View ${command.category} Commands`)
				.setStyle(ButtonStyle.Primary)
				.setEmoji(CATEGORY_EMOJIS[command.category?.toLowerCase()] || '📁'),
		);

		await interaction.editReply({
			embeds: [embed],
			components: [row],
		});

		// Handle button interactions
		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: PAGINATION_TIMEOUT,
		});

		collector.on('collect', async i => {
			try {
				if (i.customId === 'overview') {
					await handleGeneralHelp(interaction, commands, true);
				} else if (i.customId === 'category') {
					await handleCategoryFilter(interaction, command.category, commands, true);
				}
			} catch (error) {
				await handleError(
					interaction,
					error,
					'NAVIGATION',
					'Failed to navigate to the selected page.',
				);
			}
		});

		collector.on('end', () => {
			row.components.forEach(button => button.setDisabled(true));
			interaction.editReply({ components: [row] }).catch(() => {});
		});
	} catch (error) {
		await handleError(
			interaction,
			error,
			'COMMAND_DETAILS',
			'Failed to display command details.',
		);
	}
}

// Helper function to format permissions
function formatPermission(permission) {
	return permission
		.replace(/([A-Z])/g, ' $1')
		.trim()
		.toLowerCase()
		.replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format cooldown
function formatCooldown(seconds) {
	if (seconds < 60) {
		return `${seconds} second${seconds === 1 ? '' : 's'}`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		return `${minutes} minute${minutes === 1 ? '' : 's'}`;
	} else {
		const hours = Math.floor(seconds / 3600);
		return `${hours} hour${hours === 1 ? '' : 's'}`;
	}
}

// Helper function to get option type information
function getOptionTypeInfo(option) {
	const typeMap = {
		3: 'Type: String',
		4: 'Type: Integer',
		5: 'Type: Boolean',
		6: 'Type: User',
		7: 'Type: Channel',
		8: 'Type: Role',
		9: 'Type: Mentionable',
		10: 'Type: Number',
		11: 'Type: Attachment',
	};

	let info = typeMap[option.type];

	if (option.minValue !== undefined || option.maxValue !== undefined) {
		info += ' (';
		if (option.minValue !== undefined) info += `Min: ${option.minValue}`;
		if (option.minValue !== undefined && option.maxValue !== undefined) info += ', ';
		if (option.maxValue !== undefined) info += `Max: ${option.maxValue}`;
		info += ')';
	}

	return info;
}

async function handleSearchQuery(interaction, searchQuery, commands) {
	try {
		// Normalize search query and prepare search terms
		const normalizedQuery = searchQuery.toLowerCase().trim();
		const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 1);

		if (searchTerms.length === 0) {
			await handleError(
				interaction,
				new Error('Invalid search query'),
				'SEARCH',
				'Please provide a valid search term with at least 2 characters.',
			);
			return;
		}

		// Search in commands with scoring
		const searchResults = commands
			.map(cmd => {
				let score = 0;
				const searchableText = [
					cmd.data.name,
					cmd.data.description,
					cmd.description_full || '',
					...(cmd.examples || []),
					...(cmd.data.options?.map(opt => `${opt.name} ${opt.description}`) || []),
					cmd.category || '',
				]
					.join(' ')
					.toLowerCase();

				// Calculate score based on different factors
				for (const term of searchTerms) {
					// Exact matches in name (highest priority)
					if (cmd.data.name.toLowerCase() === term) score += 100;
					else if (cmd.data.name.toLowerCase().includes(term)) score += 50;

					// Matches in description
					if (cmd.data.description.toLowerCase().includes(term)) score += 30;

					// Matches in full description
					if (cmd.description_full?.toLowerCase().includes(term)) score += 20;

					// Matches in examples
					if (cmd.examples?.some(ex => ex.toLowerCase().includes(term))) score += 15;

					// Matches in options
					if (
						cmd.data.options?.some(
							opt =>
								opt.name.toLowerCase().includes(term) ||
								opt.description.toLowerCase().includes(term),
						)
					)
						score += 10;

					// Matches in category
					if (cmd.category?.toLowerCase().includes(term)) score += 5;

					// Partial matches
					if (searchableText.includes(term)) score += 5;
				}

				return { command: cmd, score };
			})
			.filter(result => result.score > 0)
			.sort((a, b) => b.score - a.score);

		if (searchResults.length === 0) {
			// Provide helpful suggestions when no results are found
			const categories = [...new Set(commands.map(cmd => cmd.category))];
			const categoryList = categories
				.map(cat => `• ${CATEGORY_EMOJIS[cat.toLowerCase()] || '📁'} ${cat}`)
				.join('\n');

			await handleError(
				interaction,
				new Error('No results found'),
				'SEARCH',
				`No commands found matching "${searchQuery}".\n\n` +
					'Try:\n' +
					'• Using different keywords\n' +
					'• Checking for typos\n' +
					'• Searching by category\n\n' +
					'Available categories:\n' +
					categoryList,
			);
			return;
		}

		// Create results embed
		const embed = new EmbedBuilder()
			.setTitle(`Search Results: "${searchQuery}"`)
			.setColor(EMBED_COLOR)
			.setAuthor({
				name: 'Command Search',
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setDescription(
				`Found ${searchResults.length} command${searchResults.length === 1 ? '' : 's'} matching your search.`,
			)
			.setTimestamp();

		// Group results by category for better organization
		const groupedResults = {};
		for (const { command } of searchResults) {
			const category = command.category || 'Uncategorized';
			if (!groupedResults[category]) {
				groupedResults[category] = [];
			}
			groupedResults[category].push(command);
		}

		// Add fields for each category
		for (const [category, categoryCommands] of Object.entries(groupedResults)) {
			const emoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';
			const commandList = categoryCommands
				.map(cmd => {
					const description =
						cmd.data.description.length > 100
							? cmd.data.description.substring(0, 97) + '...'
							: cmd.data.description;
					return `• \`/${cmd.data.name}\` - ${description}`;
				})
				.join('\n');

			embed.addFields({
				name: `${emoji} ${category}`,
				value: commandList,
			});
		}

		// Add navigation buttons
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('overview')
				.setLabel('Back to Overview')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('📚'),
		);

		// Add category filter buttons if there are multiple categories
		if (Object.keys(groupedResults).length > 1) {
			Object.keys(groupedResults).forEach((category, index) => {
				if (index < 4) {
					// Maximum of 4 category buttons (5 total buttons including overview)
					row.addComponents(
						new ButtonBuilder()
							.setCustomId(`category_${category}`)
							.setLabel(category)
							.setStyle(ButtonStyle.Primary)
							.setEmoji(CATEGORY_EMOJIS[category.toLowerCase()] || '📁'),
					);
				}
			});
		}

		await interaction.editReply({
			embeds: [embed],
			components: [row],
		});

		// Handle button interactions
		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: PAGINATION_TIMEOUT,
		});

		collector.on('collect', async i => {
			try {
				if (i.customId === 'overview') {
					await handleGeneralHelp(interaction, commands, true);
				} else if (i.customId.startsWith('category_')) {
					const category = i.customId.replace('category_', '');
					await handleCategoryFilter(interaction, category, commands, true);
				}
			} catch (error) {
				await handleError(
					interaction,
					error,
					'NAVIGATION',
					'Failed to navigate to the selected page.',
				);
			}
		});

		collector.on('end', () => {
			row.components.forEach(button => button.setDisabled(true));
			interaction.editReply({ components: [row] }).catch(() => {});
		});
	} catch (error) {
		await handleError(
			interaction,
			error,
			'SEARCH',
			'An error occurred while searching for commands.',
		);
	}
}

async function handleCategoryFilter(interaction, category, commands, isEdit = false) {
	try {
		// Validate and normalize category
		const normalizedCategory = category.toLowerCase();
		const categoryCommands = commands.filter(
			cmd => cmd.category?.toLowerCase() === normalizedCategory,
		);

		if (categoryCommands.length === 0) {
			// Suggest similar categories
			const categories = [...new Set(commands.map(cmd => cmd.category))];
			const similarCategories = categories
				.map(cat => ({
					name: cat,
					similarity: calculateSimilarity(cat.toLowerCase(), normalizedCategory),
				}))
				.filter(result => result.similarity > 0.3)
				.sort((a, b) => b.similarity - a.similarity)
				.slice(0, 3);

			const suggestionText =
				similarCategories.length > 0
					? '\nDid you mean:\n' +
						similarCategories
							.map(
								cat =>
									`• ${CATEGORY_EMOJIS[cat.name.toLowerCase()] || '📁'} ${cat.name}`,
							)
							.join('\n')
					: '';

			await handleError(
				interaction,
				new Error('Category not found'),
				'CATEGORY',
				`No commands found in the "${category}" category.${suggestionText}\n\n` +
					'Use `/help` to see all available categories.',
			);
			return;
		}

		const emoji = CATEGORY_EMOJIS[normalizedCategory] || '📁';
		const embed = new EmbedBuilder()
			.setTitle(`${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
			.setColor(EMBED_COLOR)
			.setAuthor({
				name: `${categoryCommands.length} commands available`,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setDescription(
				[
					`Browse all commands in the ${category} category:`,
					'',
					'**Quick Tips:**',
					'• Click on a command name to view its details',
					'• Use the dropdown menu to filter by subcategory',
					'• Use the buttons below to navigate',
				].join('\n'),
			)
			.setTimestamp();

		// Group commands by subcategory with improved organization
		const groupedCommands = categoryCommands.reduce((acc, cmd) => {
			const subcategory = cmd.subcategory || 'General';
			if (!acc[subcategory]) {
				acc[subcategory] = {
					commands: [],
					description: cmd.subcategory_description || '',
				};
			}
			acc[subcategory].commands.push(cmd);
			return acc;
		}, {});

		// Sort subcategories by priority and name
		const sortedSubcategories = Object.entries(groupedCommands).sort(([a], [b]) => {
			if (a === 'General') return -1;
			if (b === 'General') return 1;
			return a.localeCompare(b);
		});

		// Add fields for each subcategory with improved formatting
		for (const [
			subcategory,
			{ commands: subcatCommands, description },
		] of sortedSubcategories) {
			const commandList = subcatCommands
				.sort((a, b) => a.data.name.localeCompare(b.data.name))
				.map(cmd => {
					const cooldown = cmd.cooldown ? ` (${formatCooldown(cmd.cooldown)})` : '';
					const permissions = cmd.permissions?.length
						? ` (🔒 ${cmd.permissions.length} permission${cmd.permissions.length === 1 ? '' : 's'})`
						: '';
					return `• \`/${cmd.data.name}\`${cooldown}${permissions}\n  ${cmd.data.description}`;
				})
				.join('\n\n');

			embed.addFields({
				name: `${subcategory}${description ? ` - ${description}` : ''}`,
				value: commandList,
			});
		}

		// Create navigation components
		const components = [];

		// Add subcategory filter if there are multiple subcategories
		if (sortedSubcategories.length > 1) {
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('subcategory_select')
				.setPlaceholder('Filter by subcategory')
				.addOptions([
					{
						label: 'All Subcategories',
						description: `View all ${categoryCommands.length} commands`,
						value: 'all',
						emoji: '📋',
					},
					...sortedSubcategories.map(([subcat, { commands: subcatCommands }]) => ({
						label: subcat,
						description: `View ${subcatCommands.length} command${subcatCommands.length === 1 ? '' : 's'}`,
						value: subcat,
						emoji: subcat === 'General' ? '⚡' : '��',
					})),
				]);

			components.push(new ActionRowBuilder().addComponents(selectMenu));
		}

		// Add navigation buttons
		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('overview')
				.setLabel('Back to Overview')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('📚'),
		);

		// Add category navigation buttons if there are other categories
		const otherCategories = [...new Set(commands.map(cmd => cmd.category))].filter(
			cat => cat.toLowerCase() !== normalizedCategory,
		);

		if (otherCategories.length > 0) {
			const currentIndex = otherCategories.indexOf(category);
			const prevCategory =
				otherCategories[
					(currentIndex - 1 + otherCategories.length) % otherCategories.length
				];
			const nextCategory = otherCategories[(currentIndex + 1) % otherCategories.length];

			buttonRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`category_${prevCategory}`)
					.setLabel(prevCategory)
					.setStyle(ButtonStyle.Primary)
					.setEmoji(CATEGORY_EMOJIS[prevCategory.toLowerCase()] || '📁'),
				new ButtonBuilder()
					.setCustomId(`category_${nextCategory}`)
					.setLabel(nextCategory)
					.setStyle(ButtonStyle.Primary)
					.setEmoji(CATEGORY_EMOJIS[nextCategory.toLowerCase()] || '📁'),
			);
		}

		components.push(buttonRow);

		const replyOptions = {
			embeds: [embed],
			components: components,
		};

		if (isEdit) {
			await interaction.editReply(replyOptions);
		} else {
			await interaction.editReply(replyOptions);
		}

		// Handle component interactions
		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: PAGINATION_TIMEOUT,
		});

		collector.on('collect', async i => {
			try {
				if (i.customId === 'overview') {
					await handleGeneralHelp(interaction, commands, true);
				} else if (i.customId === 'subcategory_select') {
					const selectedSubcategory = i.values[0];
					if (selectedSubcategory === 'all') {
						await handleCategoryFilter(interaction, category, commands, true);
					} else {
						// Filter commands by subcategory
						const filteredCommands = commands.filter(
							cmd =>
								cmd.category?.toLowerCase() === normalizedCategory &&
								(cmd.subcategory || 'General') === selectedSubcategory,
						);
						await handleCategoryFilter(interaction, category, filteredCommands, true);
					}
				} else if (i.customId.startsWith('category_')) {
					const newCategory = i.customId.replace('category_', '');
					await handleCategoryFilter(interaction, newCategory, commands, true);
				}
			} catch (error) {
				await handleError(
					interaction,
					error,
					'NAVIGATION',
					'Failed to navigate to the selected view.',
				);
			}
		});

		collector.on('end', () => {
			components.forEach(row =>
				row.components.forEach(component => component.setDisabled(true)),
			);
			interaction.editReply({ components: components }).catch(() => {});
		});
	} catch (error) {
		await handleError(interaction, error, 'CATEGORY', 'Failed to display category commands.');
	}
}

async function handleGeneralHelp(interaction, commands, isEdit = false) {
	try {
		// Group commands by category with metadata
		const categorizedCommands = commands.reduce((acc, cmd) => {
			const category = cmd.category || 'Uncategorized';
			if (!acc[category]) {
				acc[category] = {
					commands: [],
					subcategories: new Set(),
					totalPermissions: 0,
				};
			}
			acc[category].commands.push(cmd);
			if (cmd.subcategory) {
				acc[category].subcategories.add(cmd.subcategory);
			}
			acc[category].totalPermissions += cmd.permissions?.length || 0;
			return acc;
		}, {});

		// Sort categories by priority and name
		const sortedCategories = Object.entries(categorizedCommands).sort(([a], [b]) => {
			const priorities = {
				info: 1,
				utility: 2,
				admin: 3,
				moderation: 4,
			};
			const priorityA = priorities[a.toLowerCase()] || 99;
			const priorityB = priorities[b.toLowerCase()] || 99;
			return priorityA - priorityB || a.localeCompare(b);
		});

		const embed = new EmbedBuilder()
			.setTitle('📚 Command Help')
			.setColor(EMBED_COLOR)
			.setAuthor({
				name: `${commands.length} Commands Available`,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setDescription(
				[
					'Welcome to the help menu! Here are all available commands grouped by category.',
					'',
					'**Quick Navigation:**',
					'• Use the dropdown menu below to jump to a category',
					'• Click on a category name to see all its commands',
					'• Use `/help command:name` for detailed command info',
					'• Use `/help search:keyword` to search commands',
					'',
					'**Categories Overview:**',
				].join('\n'),
			)
			.setTimestamp();

		// Add category summaries with improved information
		for (const [category, data] of sortedCategories) {
			const emoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';
			const subcategoryCount = data.subcategories.size;
			const permissionCount = data.totalPermissions;

			const summary = [
				`${data.commands.length} command${data.commands.length === 1 ? '' : 's'}`,
				subcategoryCount > 0
					? `${subcategoryCount} subcategor${subcategoryCount === 1 ? 'y' : 'ies'}`
					: null,
				permissionCount > 0
					? `${permissionCount} permission${permissionCount === 1 ? '' : 's'} required`
					: null,
			]
				.filter(Boolean)
				.join(' • ');

			const previewCommands = data.commands
				.sort((a, b) => {
					// Sort by usage count if available, then alphabetically
					const usageA = commandUsage.get(a.data.name) || 0;
					const usageB = commandUsage.get(b.data.name) || 0;
					return usageB - usageA || a.data.name.localeCompare(b.data.name);
				})
				.slice(0, 3)
				.map(cmd => {
					const usage = commandUsage.get(cmd.data.name);
					const usageText = usage ? ` (${usage} use${usage === 1 ? '' : 's'})` : '';
					return `• \`/${cmd.data.name}\`${usageText}\n  ${cmd.data.description}`;
				})
				.join('\n\n');

			embed.addFields({
				name: `${emoji} ${category}`,
				value: [
					summary,
					'',
					'**Popular Commands:**',
					previewCommands,
					data.commands.length > 3
						? `\n*...and ${data.commands.length - 3} more commands*`
						: '',
				].join('\n'),
			});
		}

		// Create navigation components
		const components = [];

		// Category select menu
		const categorySelect = new StringSelectMenuBuilder()
			.setCustomId('category_select')
			.setPlaceholder('Select a category to view')
			.addOptions(
				sortedCategories.map(([category, data]) => ({
					label: category,
					description: `${data.commands.length} command${data.commands.length === 1 ? '' : 's'}`,
					value: category.toLowerCase(),
					emoji: CATEGORY_EMOJIS[category.toLowerCase()] || '📁',
				})),
			);

		components.push(new ActionRowBuilder().addComponents(categorySelect));

		// Quick action buttons
		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('refresh')
				.setLabel('Refresh')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('🔄'),
			new ButtonBuilder()
				.setCustomId('search')
				.setLabel('Search Commands')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('🔍'),
		);

		components.push(buttonRow);

		const replyOptions = {
			embeds: [embed],
			components: components,
		};

		if (isEdit) {
			await interaction.editReply(replyOptions);
		} else {
			await interaction.editReply(replyOptions);
		}

		// Handle component interactions
		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: PAGINATION_TIMEOUT,
		});

		collector.on('collect', async i => {
			try {
				if (i.customId === 'category_select') {
					await handleCategoryFilter(interaction, i.values[0], commands, true);
				} else if (i.customId === 'refresh') {
					// Clear command cache and reload
					commandCache.timestamp = 0;
					const freshCommands = await getAllCommands();
					await handleGeneralHelp(interaction, freshCommands, true);
				} else if (i.customId === 'search') {
					// Show search modal
					const modal = new ModalBuilder()
						.setCustomId('search_modal')
						.setTitle('Search Commands')
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId('search_query')
									.setLabel('Enter search term')
									.setStyle(TextInputStyle.Short)
									.setPlaceholder('e.g., role, user, channel')
									.setRequired(true),
							),
						);

					await i.showModal(modal);
				}
			} catch (error) {
				await handleError(
					interaction,
					error,
					'NAVIGATION',
					'Failed to navigate to the selected view.',
				);
			}
		});

		// Handle modal submit
		const modalCollector = interaction.channel.createMessageComponentCollector({
			filter: i => i.customId === 'search_modal' && i.user.id === interaction.user.id,
			time: PAGINATION_TIMEOUT,
		});

		modalCollector.on('collect', async i => {
			try {
				const query = i.fields.getTextInputValue('search_query');
				await handleSearchQuery(interaction, query, commands, true);
			} catch (error) {
				await handleError(interaction, error, 'SEARCH', 'Failed to process search query.');
			}
		});

		collector.on('end', () => {
			components.forEach(row =>
				row.components.forEach(component => component.setDisabled(true)),
			);
			interaction.editReply({ components: components }).catch(() => {});
		});
	} catch (error) {
		await handleError(interaction, error, 'OVERVIEW', 'Failed to display help overview.');
	}
}

// Helper function to calculate string similarity (Levenshtein distance)
function calculateSimilarity(str1, str2) {
	const track = Array(str2.length + 1)
		.fill(null)
		.map(() => Array(str1.length + 1).fill(null));
	for (let i = 0; i <= str1.length; i += 1) {
		track[0][i] = i;
	}
	for (let j = 0; j <= str2.length; j += 1) {
		track[j][0] = j;
	}
	for (let j = 1; j <= str2.length; j += 1) {
		for (let i = 1; i <= str1.length; i += 1) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
			track[j][i] = Math.min(
				track[j][i - 1] + 1,
				track[j - 1][i] + 1,
				track[j - 1][i - 1] + indicator,
			);
		}
	}
	return 1 - track[str2.length][str1.length] / Math.max(str1.length, str2.length);
}

// Helper function to find related commands
function findRelatedCommands(command, allCommands) {
	return allCommands
		.filter(cmd => cmd.category === command.category && cmd.data.name !== command.data.name)
		.slice(0, 3);
}
