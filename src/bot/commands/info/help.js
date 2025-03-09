const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('../../../../logger');

// Command cache with expiration time
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let commandCache = {
	commands: [],
	timestamp: 0
};

// Command usage tracking
const commandUsage = new Map();

// Category emoji mapping
const CATEGORY_EMOJIS = {
	'admin': '⚙️',
	'fun': '🎲',
	'games': '🎮',
	'info': 'ℹ️',
	'moderation': '🛡️',
	'roles': '👑',
	'setup': '🔧',
	'utility': '🛠️',
	'media': '🎬'
};

// Constants
const EMBED_COLOR = '#3498db';
const MAX_FIELD_LENGTH = 1024;
const MAX_FIELDS_PER_EMBED = 25;
const PAGINATION_TIMEOUT = 300000; // 5 minutes

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help information for bot commands')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Get detailed info about a specific command')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('search')
				.setDescription('Search for commands by keyword')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('category')
				.setDescription('Filter commands by category')
				.setRequired(false)
				.addChoices(
					...Object.entries(CATEGORY_EMOJIS).map(([category, emoji]) => ({
						name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
						value: category
					}))
				)
		),
	description_full: 'Displays comprehensive help information for all bot commands. You can view all commands grouped by category, get detailed information about specific commands, search for commands using keywords, or filter commands by category.',
	usage: '/help [command:command_name] [search:keyword] [category:category_name]',
	examples: [
		'/help',
		'/help command:ping',
		'/help search:user',
		'/help category:moderation'
	],

	async execute(interaction) {
		const commandName = interaction.options.getString('command');
		const searchQuery = interaction.options.getString('search');
		const categoryFilter = interaction.options.getString('category');

		// Track command usage
		this.trackUsage('help');

		// Get all commands from command folders
		const commands = await getAllCommands();

		if (commandName) {
			this.trackUsage('help_command_details');
			return handleCommandDetails(interaction, commandName, commands);
		} else if (searchQuery) {
			this.trackUsage('help_search');
			return handleSearchQuery(interaction, searchQuery, commands);
		} else if (categoryFilter) {
			this.trackUsage('help_category');
			return handleCategoryFilter(interaction, categoryFilter, commands);
		} else {
			this.trackUsage('help_overview');
			return handleGeneralHelp(interaction, commands);
		}
	},

	/**
	 * Track command usage
	 * @param {string} subCommand - The help subcommand used
	 */
	trackUsage(subCommand) {
		// Global usage counter
		const currentCount = commandUsage.get(subCommand) || 0;
		commandUsage.set(subCommand, currentCount + 1);
	},

	/**
	 * Get usage statistics
	 * @returns {Object} Usage statistics
	 */
	getUsageStats() {
		return Object.fromEntries(commandUsage);
	}
};

// Get all commands recursively from the commands directory
async function getAllCommands() {
	// Check if cache is valid (not expired)
	const now = Date.now();
	if (commandCache.commands.length > 0 && now - commandCache.timestamp < CACHE_LIFETIME) {
		Logger.log('HELP', `Using cached commands (${commandCache.commands.length} commands)`, 'info');
		return commandCache.commands;
	}

	Logger.log('HELP', 'Cache expired or empty, loading commands from disk', 'info');
	const commands = [];
	const commandsPath = path.join(__dirname, '..');

	try {
		const categories = fs.readdirSync(commandsPath)
			.filter(dir => {
				try {
					return fs.statSync(path.join(commandsPath, dir)).isDirectory();
				} catch (error) {
					Logger.log('HELP', `Error checking if ${dir} is a directory: ${error.message}`, 'error');
					return false;
				}
			});

		for (const category of categories) {
			const categoryPath = path.join(commandsPath, category);
			try {
				const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

				for (const file of commandFiles) {
					try {
						const filePath = path.join(categoryPath, file);
						// Use require with cache clearing to ensure we get fresh data
						delete require.cache[require.resolve(filePath)];
						const command = require(filePath);
						if (command.data && command.execute) {
							command.category = category;
							commands.push(command);
						}
					} catch (error) {
						Logger.log('HELP', `Error loading command file ${file}: ${error.message}`, 'error');
					}
				}
			} catch (error) {
				Logger.log('HELP', `Error reading category directory ${category}: ${error.message}`, 'error');
			}
		}
	} catch (error) {
		Logger.log('HELP', `Error reading commands directory: ${error.message}`, 'error');
	}

	// Update cache
	commandCache.commands = commands;
	commandCache.timestamp = now;
	Logger.log('HELP', `Cached ${commands.length} commands`, 'info');

	return commands;
}

async function handleCommandDetails(interaction, commandName, commands) {
	try {
		const command = commands.find(cmd =>
			cmd.data.name.toLowerCase() === commandName.toLowerCase()
		);

		if (!command) {
			// Find similar command names to suggest
			const similarCommands = commands
				.filter(cmd => cmd.data.name.includes(commandName) || commandName.includes(cmd.data.name))
				.slice(0, 5)
				.map(cmd => `\`/${cmd.data.name}\``);

			const suggestion = similarCommands.length > 0
				? `\nDid you mean: ${similarCommands.join(', ')}?`
				: '';

			return interaction.reply({
				content: `Command \`${commandName}\` not found.${suggestion}`,
				ephemeral: true
			});
		}

		const categoryEmoji = CATEGORY_EMOJIS[command.category?.toLowerCase()] || '📁';

		const embed = new EmbedBuilder()
			.setTitle(`Command: /${command.data.name}`)
			.setDescription(command.description_full || command.data.description || 'No description available')
			.setColor(EMBED_COLOR)
			.setAuthor({
				name: `${categoryEmoji} ${command.category || 'Uncategorized'} Category`,
			})
			.setTimestamp();

		// Add command options if they exist
		if (command.data.options && command.data.options.length > 0) {
			let optionsText = '';
			command.data.options.forEach(option => {
				const required = option.required ? '`Required`' : '`Optional`';
				optionsText += `• **${option.name}** ${required}: ${option.description}\n`;

				// Add choices if available
				if (option.choices && option.choices.length > 0) {
					optionsText += `  Choices: ${option.choices.map(c => `\`${c.name}\``).join(', ')}\n`;
				}
			});

			embed.addFields({ name: '🔧 Options', value: optionsText || 'No options' });
		}

		// Add usage if it exists
		if (command.usage) {
			embed.addFields({ name: '💻 Usage', value: `\`\`\`${command.usage}\`\`\`` });
		}

		// Add cooldown if it exists
		if (command.cooldown) {
			const cooldownSeconds = typeof command.cooldown === 'number' ? command.cooldown : 0;
			if (cooldownSeconds > 0) {
				embed.addFields({
					name: '⏱️ Cooldown',
					value: `${cooldownSeconds} second${cooldownSeconds === 1 ? '' : 's'}`,
					inline: true
				});
			}
		}

		// Add permissions if they exist
		if (command.permissions && command.permissions.length > 0) {
			embed.addFields({
				name: '🔒 Required Permissions',
				value: command.permissions.join(', '),
				inline: true
			});
		}

		// Add examples if they exist
		if (command.examples && command.examples.length > 0) {
			embed.addFields({
				name: '📝 Examples',
				value: command.examples.map(ex => `\`${ex}\``).join('\n')
			});
		}

		// Find similar commands (in the same category)
		const similarCommands = commands
			.filter(cmd => cmd.category === command.category && cmd.data.name !== command.data.name)
			.slice(0, 5)
			.map(cmd => `\`/${cmd.data.name}\``);

		if (similarCommands.length > 0) {
			embed.addFields({
				name: '🔍 Related Commands',
				value: similarCommands.join(', ')
			});
		}

		// Add footer with tip
		embed.setFooter({
			text: 'Tip: Use the up arrow key to re-use commands in Discord'
		});

		// Create a button to view all commands in this category
		const viewCategoryButton = new ButtonBuilder()
			.setCustomId(`help_view_category_${command.category}`)
			.setLabel(`View All ${command.category} Commands`)
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(viewCategoryButton);

		const response = await interaction.reply({
			embeds: [embed],
			components: [row],
			ephemeral: true,
			fetchReply: true
		});

		// Set up collector for the view category button
		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: PAGINATION_TIMEOUT,
			filter: i => i.user.id === interaction.user.id && i.customId === `help_view_category_${command.category}`
		});

		collector.on('collect', async (i) => {
			if (i.customId === `help_view_category_${command.category}`) {
				try {
					// Handle viewing the category when button is clicked
					await handleCategoryFilter(i, command.category, commands);
				} catch (error) {
					Logger.log('HELP', `Error handling category view: ${error.message}`, 'error');
					await i.reply({
						content: 'Error viewing category. Please try again with `/help category:' + command.category + '`',
						ephemeral: true
					}).catch(() => { });
				}
			}
		});

		collector.on('end', async (collected, reason) => {
			if (reason === 'time') {
				try {
					await response.edit({ components: [] }).catch(() => { });
				} catch (error) {
					Logger.log('HELP', `Error removing buttons after timeout: ${error.message}`, 'error');
				}
			}
		});
	} catch (error) {
		Logger.log('HELP', `Error in command details: ${error.message}`, 'error');
		await interaction.reply({
			content: 'An error occurred while displaying command details. Please try again.',
			ephemeral: true
		}).catch(() => { });
	}
}

async function handleSearchQuery(interaction, searchQuery, commands) {
	// Normalize search query
	const normalizedQuery = searchQuery.toLowerCase().trim();

	if (normalizedQuery.length < 2) {
		return interaction.reply({
			content: 'Please provide a search term with at least 2 characters.',
			ephemeral: true
		});
	}

	// Score-based search system
	const scoredResults = commands.map(cmd => {
		let score = 0;

		// Score points for matches in different areas
		// Direct name match is highest priority
		if (cmd.data.name.toLowerCase() === normalizedQuery) {
			score += 100;
		} else if (cmd.data.name.toLowerCase().startsWith(normalizedQuery)) {
			score += 50;
		} else if (cmd.data.name.toLowerCase().includes(normalizedQuery)) {
			score += 25;
		}

		// Description matches
		if (cmd.data.description) {
			const descriptionLower = cmd.data.description.toLowerCase();
			if (descriptionLower.includes(normalizedQuery)) {
				score += 15;

				// More points for more relevant descriptions
				const count = (descriptionLower.match(new RegExp(normalizedQuery, 'g')) || []).length;
				score += count * 2;
			}
		}

		// Full description matches
		if (cmd.description_full) {
			if (cmd.description_full.toLowerCase().includes(normalizedQuery)) {
				score += 10;
			}
		}

		// Option matches
		if (cmd.data.options) {
			cmd.data.options.forEach(opt => {
				if (opt.name.toLowerCase().includes(normalizedQuery)) {
					score += 10;
				}
				if (opt.description.toLowerCase().includes(normalizedQuery)) {
					score += 5;
				}
			});
		}

		// Examples matches
		if (cmd.examples && Array.isArray(cmd.examples)) {
			cmd.examples.forEach(example => {
				if (example.toLowerCase().includes(normalizedQuery)) {
					score += 5;
				}
			});
		}

		return { command: cmd, score };
	});

	// Filter commands that had at least some match and sort by score
	const results = scoredResults
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.map(item => item.command);

	if (results.length === 0) {
		return interaction.reply({
			content: `No commands found matching '${searchQuery}'. Try a different search term or use \`/help\` to see all commands.`,
			ephemeral: true
		});
	}

	// Group results by category with improved display
	const groupedResults = {};
	results.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedResults[category]) {
			groupedResults[category] = [];
		}

		// Highlight the search term in the description if it exists
		let description = cmd.data.description || 'No description';
		if (normalizedQuery.length > 2) { // Only highlight for meaningful terms
			const highlightedDesc = description.replace(
				new RegExp(normalizedQuery, 'gi'),
				match => `**${match}**`
			);
			// Only use highlighted version if it's different
			if (highlightedDesc !== description) {
				description = highlightedDesc;
			}
		}

		groupedResults[category].push(`\`/${cmd.data.name}\` - ${description}`);
	});

	// Create pages for pagination
	const pages = [];
	const categoriesPerPage = 3; // Number of categories to show per page
	const categories = Object.entries(groupedResults);

	// Create pages with a maximum of 3 categories per page
	for (let i = 0; i < categories.length; i += categoriesPerPage) {
		const embed = new EmbedBuilder()
			.setTitle(`Search Results: "${searchQuery}"`)
			.setDescription(`Found ${results.length} command${results.length === 1 ? '' : 's'} matching your search.`)
			.setColor(EMBED_COLOR)
			.setFooter({
				text: `Page ${Math.floor(i / categoriesPerPage) + 1} of ${Math.ceil(categories.length / categoriesPerPage)} • ${results.length} results`
			})
			.setTimestamp();

		const pageCategories = categories.slice(i, i + categoriesPerPage);

		for (const [category, cmds] of pageCategories) {
			const categoryEmoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';

			// Split commands into chunks to avoid exceeding Discord's character limit
			const chunks = splitIntoChunks(cmds.join('\n'), MAX_FIELD_LENGTH);

			for (let j = 0; j < chunks.length; j++) {
				const fieldName = j === 0 ?
					`${categoryEmoji} ${category}` :
					`${categoryEmoji} ${category} (continued)`;

				embed.addFields({
					name: fieldName,
					value: chunks[j] || 'No commands available'
				});
			}
		}

		// Add tip on first page
		if (i === 0) {
			embed.addFields({
				name: '💡 Tip',
				value: 'You can get detailed information about any command with `/help command:name`'
			});
		}

		pages.push(embed);
	}

	// Add quick access buttons for top commands
	const buttons = [];

	// Add up to 5 buttons for the top results
	const topCommands = results.slice(0, 5);
	for (const cmd of topCommands) {
		buttons.push(
			new ButtonBuilder()
				.setCustomId(`help_view_command_${cmd.data.name}`)
				.setLabel(`/${cmd.data.name}`)
				.setStyle(ButtonStyle.Secondary)
		);
	}

	const quickAccessRow = buttons.length > 0 ?
		new ActionRowBuilder().addComponents(...buttons) : null;

	// Send pagination with optional quick access buttons
	await sendPagination(interaction, pages, quickAccessRow ? [quickAccessRow] : []);

	// Set up collector for the command detail buttons if created
	if (quickAccessRow) {
		const message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: PAGINATION_TIMEOUT,
			filter: i => i.user.id === interaction.user.id && i.customId.startsWith('help_view_command_')
		});

		collector.on('collect', async (i) => {
			const customId = i.customId;
			if (customId.startsWith('help_view_command_')) {
				const commandName = customId.replace('help_view_command_', '');
				await handleCommandDetails(i, commandName, commands);
			}
		});
	}
}

async function handleCategoryFilter(interaction, categoryFilter, commands) {
	try {
		const categories = [...new Set(commands.map(cmd => cmd.category || 'Uncategorized'))];

		// Find the closest category match
		const category = categories.find(cat =>
			cat.toLowerCase() === categoryFilter.toLowerCase()
		) || categories.find(cat =>
			cat.toLowerCase().includes(categoryFilter.toLowerCase())
		);

		if (!category) {
			return interaction.reply({
				content: `Category "${categoryFilter}" not found. Available categories: ${categories.join(', ')}`,
				ephemeral: true
			});
		}

		const categoryCommands = commands.filter(cmd =>
			(cmd.category || 'Uncategorized') === category
		);

		const categoryEmoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';

		// Create pages (10 commands per page)
		const pages = [];
		const commandsPerPage = 10;

		for (let i = 0; i < categoryCommands.length; i += commandsPerPage) {
			const pageCommands = categoryCommands.slice(i, i + commandsPerPage);

			const embed = new EmbedBuilder()
				.setTitle(`${categoryEmoji} Commands in category: ${category}`)
				.setDescription(`${categoryCommands.length} command${categoryCommands.length === 1 ? '' : 's'} available`)
				.setColor(EMBED_COLOR)
				.setFooter({
					text: `Page ${Math.floor(i / commandsPerPage) + 1} of ${Math.ceil(categoryCommands.length / commandsPerPage)}`
				})
				.setTimestamp();

			const commandList = pageCommands.map(cmd => {
				// Add aliases if available
				const aliases = cmd.data.aliases ? ` (${cmd.data.aliases.map(a => `\`${a}\``).join(', ')})` : '';
				// Add required permissions indication
				const permRequired = cmd.permissions && cmd.permissions.length > 0 ? ' 🔒' : '';

				return `\`/${cmd.data.name}\`${permRequired}${aliases} - ${cmd.data.description || 'No description'}`;
			}).join('\n');

			embed.addFields({
				name: 'Commands',
				value: commandList || 'No commands available in this category.'
			});

			pages.push(embed);
		}

		// If there are no pages, create one empty page
		if (pages.length === 0) {
			const embed = new EmbedBuilder()
				.setTitle(`${categoryEmoji} Commands in category: ${category}`)
				.setDescription('0 commands available')
				.setColor(EMBED_COLOR)
				.setTimestamp();

			embed.addFields({
				name: 'Commands',
				value: 'No commands available in this category.'
			});

			pages.push(embed);
		}

		// If there are commands, create quick-access button row
		const quickAccessButtons = [];

		// Add buttons for the first 5 commands in this category
		const featuredCommands = categoryCommands.slice(0, 5);
		for (const cmd of featuredCommands) {
			quickAccessButtons.push(
				new ButtonBuilder()
					.setCustomId(`help_cmd_${cmd.data.name}`)
					.setLabel(`/${cmd.data.name}`)
					.setStyle(ButtonStyle.Secondary)
			);
		}

		const quickAccessRow = quickAccessButtons.length > 0 ?
			new ActionRowBuilder().addComponents(...quickAccessButtons) : null;

		// Send pagination with optional quick access buttons
		await sendPagination(interaction, pages, quickAccessRow ? [quickAccessRow] : []);

		// Set up collector for the command detail buttons if created
		if (quickAccessRow) {
			const message = await interaction.fetchReply();
			const collector = message.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: PAGINATION_TIMEOUT,
				filter: i => i.user.id === interaction.user.id && i.customId.startsWith('help_cmd_')
			});

			collector.on('collect', async (i) => {
				try {
					const customId = i.customId;
					if (customId.startsWith('help_cmd_')) {
						const commandName = customId.replace('help_cmd_', '');
						await handleCommandDetails(i, commandName, commands);
					}
				} catch (error) {
					Logger.log('HELP', `Error handling command button: ${error.message}`, 'error');
					await i.reply({
						content: 'Error displaying command details. Please try again.',
						ephemeral: true
					}).catch(() => { });
				}
			});
		}
	} catch (error) {
		Logger.log('HELP', `Error in category filter: ${error.message}`, 'error');
		await interaction.reply({
			content: 'An error occurred while fetching category commands. Please try again.',
			ephemeral: true
		}).catch(() => { });
	}
}

async function handleGeneralHelp(interaction, commands) {
	// Get client information
	const { client } = interaction;

	// Calculate uptime based on client uptime
	const uptime = formatUptime(client.uptime);

	// Calculate key statistics
	const totalCommands = commands.length;
	const serverCount = client.guilds.cache.size;
	const userCount = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);

	// Group commands by category
	const groupedCommands = {};
	commands.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedCommands[category]) {
			groupedCommands[category] = [];
		}
		groupedCommands[category].push(cmd);
	});

	// Find recent commands (based on file creation date if new)
	const recentCommands = commands
		.filter(cmd => cmd.isNew || cmd.recentlyUpdated) // If we mark commands as new
		.slice(0, 3) // Show max 3 recent commands
		.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`);

	// Highlight popular commands (if usage stats are available in client)
	// Real implementation would use actual usage stats from your bot
	let popularCommands = [];

	// Try to get usage stats from client if available
	if (client.commandUsage) {
		// Get top used commands from client usage tracking
		const commandStats = Array.from(client.commandUsage.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		popularCommands = commandStats
			.map(([cmdName, count]) => {
				const cmd = commands.find(c => c.data.name === cmdName);
				if (cmd) {
					return `\`/${cmd.data.name}\` - Used ${count} times`;
				}
				return null;
			})
			.filter(Boolean);
	}

	// If no usage stats or not enough popular commands, use curated list
	if (popularCommands.length < 3) {
		// Curated popular commands as fallback
		const curatedPopular = [
			'help', 'ping', 'server', 'userinfo'
		];

		// Add curated popular commands that exist
		for (const cmdName of curatedPopular) {
			const cmd = commands.find(c => c.data.name === cmdName);
			if (cmd && popularCommands.length < 5) {
				popularCommands.push(`\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`);
			}
		}
	}

	// Create first page (overview)
	const overviewEmbed = new EmbedBuilder()
		.setTitle('Kiyo Help Center')
		.setDescription(`👋 Welcome to Kiyo Bot's help system! Below you'll find all available commands organized by category.`)
		.setColor(EMBED_COLOR)
		.setTimestamp();

	// Add bot info if avatar is available
	if (client.user.displayAvatarURL()) {
		overviewEmbed.setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
	}

	overviewEmbed.addFields(
		{
			name: '📊 Bot Statistics',
			value: `• **${totalCommands}** commands across **${Object.keys(groupedCommands).length}** categories\n• Serving **${serverCount.toLocaleString()}** servers with **${userCount.toLocaleString()}** users\n• Online for **${uptime}**`
		}
	);

	// Add popular commands if available
	if (popularCommands.length > 0) {
		overviewEmbed.addFields({
			name: '🔥 Popular Commands',
			value: popularCommands.join('\n')
		});
	}

	// Add recent commands if available
	if (recentCommands.length > 0) {
		overviewEmbed.addFields({
			name: '✨ New Commands',
			value: recentCommands.join('\n')
		});
	}

	// Add categories with their command counts
	const categories = Object.entries(groupedCommands)
		.sort((a, b) => b[1].length - a[1].length) // Sort by number of commands (most first)
		.map(([category, cmds]) => {
			const emoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';
			const commandCount = cmds.length;
			return { name: category, emoji, commandCount };
		});

	// Split categories into columns for better display
	const leftCategories = categories.slice(0, Math.ceil(categories.length / 2));
	const rightCategories = categories.slice(Math.ceil(categories.length / 2));

	// Format the category lists
	const formatCategoryList = (cats) => cats
		.map(cat => `${cat.emoji} **${cat.name}**: ${cat.commandCount} command${cat.commandCount === 1 ? '' : 's'}`)
		.join('\n');

	overviewEmbed.addFields(
		{
			name: '📑 Categories',
			value: formatCategoryList(leftCategories),
			inline: true
		}
	);

	// Add the right column if there are categories for it
	if (rightCategories.length > 0) {
		overviewEmbed.addFields(
			{
				name: '\u200B', // Invisible character for right column alignment
				value: formatCategoryList(rightCategories),
				inline: true
			}
		);
	}

	// Add usage guide
	overviewEmbed.addFields({
		name: '🔍 How to Use the Help Command',
		value: `• \`/help\` - Show this overview\n• \`/help command:name\` - Get detailed info about a specific command\n• \`/help search:keyword\` - Search for commands by keyword\n• \`/help category:name\` - View all commands in a category`
	});

	overviewEmbed.setFooter({
		text: 'Use the buttons below to navigate through categories'
	});

	// Create category pages (one page per category)
	const categoryPages = [];
	categoryPages.push(overviewEmbed); // First page is overview

	// Sort categories alphabetically for subsequent pages
	Object.entries(groupedCommands)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.forEach(([category, cmds]) => {
			const categoryEmoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';

			const embed = new EmbedBuilder()
				.setTitle(`${categoryEmoji} ${category} Commands`)
				.setDescription(`${cmds.length} command${cmds.length === 1 ? '' : 's'} available in this category`)
				.setColor(EMBED_COLOR)
				.setTimestamp();

			// Sort commands alphabetically
			cmds.sort((a, b) => a.data.name.localeCompare(b.data.name));

			// Create command list with formatting
			const commandList = cmds.map(cmd => {
				// Add aliases if available
				const aliases = cmd.data.aliases ? ` (${cmd.data.aliases.map(a => `\`${a}\``).join(', ')})` : '';
				// Add required permissions indication
				const permRequired = cmd.permissions && cmd.permissions.length > 0 ? ' 🔒' : '';

				return `\`/${cmd.data.name}\`${permRequired}${aliases} - ${cmd.data.description || 'No description'}`;
			});

			// Split commands into chunks if needed
			const chunks = splitIntoChunks(commandList.join('\n'), MAX_FIELD_LENGTH);

			for (let i = 0; i < chunks.length; i++) {
				embed.addFields({
					name: i === 0 ? '📝 Commands' : '📝 Commands (continued)',
					value: chunks[i]
				});
			}

			// Add a tip field for permissions indicator
			embed.addFields({
				name: '💡 Legend',
				value: '🔒 - Command requires specific permissions'
			});

			embed.setFooter({
				text: `Page ${categoryPages.length + 1} - Navigate through categories using the buttons below`
			});

			categoryPages.push(embed);
		});

	// Create category selection dropdown for quick navigation
	const categoryOptions = Object.entries(groupedCommands)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.slice(0, 25) // Discord dropdown max is 25 options
		.map(([category, _], index) => {
			// Skip the overview
			const pageIndex = index + 1; // +1 because overview is first page
			const emoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';

			return {
				label: category,
				description: `View ${category} commands`,
				value: `${pageIndex}`, // Use page index as value
				emoji: emoji
			};
		});

	// Add "Overview" option at the beginning
	categoryOptions.unshift({
		label: 'Overview',
		description: 'Return to main help page',
		value: '0',
		emoji: '🏠'
	});

	// Create the dropdown menu
	const categoryDropdown = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('help_category_select')
				.setPlaceholder('Quick navigation - Select a category')
				.addOptions(categoryOptions)
		);

	// Send pagination with category selection dropdown
	await sendPagination(interaction, categoryPages, [categoryDropdown]);
}

// Helper function to handle pagination with buttons
async function sendPagination(interaction, pages, extraRows = []) {
	if (pages.length === 0) {
		return interaction.reply({
			content: "No information to display.",
			ephemeral: true
		});
	}

	if (pages.length === 1) {
		// If there's only one page, just send it without navigation buttons
		// but with any extra buttons
		return interaction.reply({
			embeds: [pages[0]],
			components: extraRows.length > 0 ? extraRows : [],
			ephemeral: true
		});
	}

	let currentPage = 0;

	// Create buttons for navigation
	const createButtons = (currentPage) => {
		const firstButton = new ButtonBuilder()
			.setCustomId('help_first')
			.setEmoji('⏮️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage === 0);

		const prevButton = new ButtonBuilder()
			.setCustomId('help_prev')
			.setEmoji('◀️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === 0);

		const pageInfoButton = new ButtonBuilder()
			.setCustomId('help_info')
			.setLabel(`Page ${currentPage + 1} of ${pages.length}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);

		const nextButton = new ButtonBuilder()
			.setCustomId('help_next')
			.setEmoji('▶️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === pages.length - 1);

		const lastButton = new ButtonBuilder()
			.setCustomId('help_last')
			.setEmoji('⏭️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage === pages.length - 1);

		const row = new ActionRowBuilder()
			.addComponents(firstButton, prevButton, pageInfoButton, nextButton, lastButton);

		const closeButton = new ButtonBuilder()
			.setCustomId('help_close')
			.setLabel('Close')
			.setStyle(ButtonStyle.Danger);

		const refreshButton = new ButtonBuilder()
			.setCustomId('help_refresh')
			.setEmoji('🔄')
			.setStyle(ButtonStyle.Success);

		const controlRow = new ActionRowBuilder()
			.addComponents(refreshButton, closeButton);

		// Combine navigation row, extra rows, and control row
		return [row, ...extraRows.map(row => {
			// Update custom IDs in extra rows to add 'help_' prefix
			if (row.components && row.components.length > 0) {
				const newComponents = row.components.map(component => {
					if (component.data && component.data.custom_id) {
						// Only prefix if not already prefixed
						if (!component.data.custom_id.startsWith('help_')) {
							component.data.custom_id = `help_${component.data.custom_id}`;
						}
					}
					return component;
				});

				return new ActionRowBuilder().addComponents(newComponents);
			}
			return row;
		}), controlRow];
	};

	try {
		// Send initial message with buttons
		const message = await interaction.reply({
			embeds: [pages[currentPage]],
			components: createButtons(currentPage),
			ephemeral: true,
			fetchReply: true
		});

		// Check if we got a valid message object with the collector method
		if (!message || typeof message.createMessageComponentCollector !== 'function') {
			Logger.log('HELP', 'Failed to get a valid message object with collector methods. Falling back to channel collector.', 'warning');

			// Fallback to using the channel collector 
			// This is less ideal but works as a fallback
			const channelCollector = interaction.channel.createMessageComponentCollector({
				time: PAGINATION_TIMEOUT,
				filter: i =>
					i.user.id === interaction.user.id &&
					i.customId.startsWith('help_') &&
					i.message.interaction?.id === interaction.id
			});

			channelCollector.on('collect', async (i) => {
				// ... same code as the normal collector ...
				try {
					// Handle button interactions
					if (i.isButton()) {
						// Handle basic navigation buttons
						if (i.customId === 'help_first') {
							currentPage = 0;
						} else if (i.customId === 'help_prev') {
							currentPage = Math.max(0, currentPage - 1);
						} else if (i.customId === 'help_next') {
							currentPage = Math.min(pages.length - 1, currentPage + 1);
						} else if (i.customId === 'help_last') {
							currentPage = pages.length - 1;
						} else if (i.customId === 'help_close') {
							channelCollector.stop('closed');
							await i.update({
								embeds: [pages[currentPage]],
								components: []
							});
							return;
						} else if (i.customId === 'help_refresh') {
							// Refresh the command data
							try {
								// Clear the cache to force refresh
								commandCache.timestamp = 0;
								await getAllCommands();

								// Indicate refreshing
								await i.update({
									content: 'Refreshing command data...',
									embeds: [],
									components: []
								});

								// Execute the command again with a slight delay
								setTimeout(() => {
									module.exports.execute(interaction).catch(err => {
										Logger.log('HELP', `Error re-executing help command: ${err.message}`, 'error');
									});
								}, 1000);

								channelCollector.stop('refreshed');
								return;
							} catch (error) {
								Logger.log('HELP', `Error refreshing command data: ${error.message}`, 'error');
								await i.update({
									content: 'Failed to refresh command data. Please try again.',
									embeds: [pages[currentPage]],
									components: createButtons(currentPage)
								});
								return;
							}
						}

						// Handle the button press by updating the message
						await i.update({
							embeds: [pages[currentPage]],
							components: createButtons(currentPage)
						});
					}
					// Handle select menu interactions
					else if (i.isStringSelectMenu()) {
						if (i.customId === 'help_category_select') {
							// Get the selected page index from the value
							const selectedPage = parseInt(i.values[0]);

							// Validate the page index
							if (selectedPage >= 0 && selectedPage < pages.length) {
								currentPage = selectedPage;

								// Update the message with the new page
								await i.update({
									embeds: [pages[currentPage]],
									components: createButtons(currentPage)
								});
							} else {
								// Handle invalid selection
								await i.update({
									content: 'Invalid selection. Please try again.',
									embeds: [pages[currentPage]],
									components: createButtons(currentPage)
								});
							}
						}
					}
				} catch (error) {
					Logger.log('HELP', `Error handling interaction: ${error.message}`, 'error');
					// Try to handle the error gracefully
					try {
						await i.update({
							content: 'An error occurred. Please try using the command again.',
							embeds: [pages[currentPage]],
							components: createButtons(currentPage)
						}).catch(() => { });
					} catch (updateError) {
						// If we can't update, try to reply instead
						try {
							await i.reply({
								content: 'Error updating help menu. Please try the command again.',
								ephemeral: true
							}).catch(() => { });
						} catch (replyError) {
							// If all else fails, just log the error
							Logger.log('HELP', 'Failed to respond to interaction error', 'error');
						}
					}
				}
			});

			channelCollector.on('end', async (collected, reason) => {
				if (reason === 'time') {
					try {
						// Try to find the last message and edit it
						const latestMessages = await interaction.channel.messages.fetch({ limit: 5 });
						const interactionMessage = latestMessages.find(
							msg => msg.interaction?.id === interaction.id
						);

						if (interactionMessage) {
							await interactionMessage.edit({
								components: [],
								embeds: [
									pages[currentPage].setFooter({
										text: `${pages[currentPage].data.footer?.text || ''} • Pagination expired`
									})
								]
							}).catch(() => { });
						}
					} catch (error) {
						Logger.log('HELP', `Error updating message after pagination ended: ${error.message}`, 'error');
					}
				}
			});

			return; // Exit early since we're using the channel collector
		}

		// If we have a valid message object, use it for the collector
		const collector = message.createMessageComponentCollector({
			time: PAGINATION_TIMEOUT,
			filter: i => i.user.id === interaction.user.id && i.customId.startsWith('help_')
		});

		collector.on('collect', async (i) => {
			try {
				// Handle button interactions
				if (i.isButton()) {
					// Handle basic navigation buttons
					if (i.customId === 'help_first') {
						currentPage = 0;
					} else if (i.customId === 'help_prev') {
						currentPage = Math.max(0, currentPage - 1);
					} else if (i.customId === 'help_next') {
						currentPage = Math.min(pages.length - 1, currentPage + 1);
					} else if (i.customId === 'help_last') {
						currentPage = pages.length - 1;
					} else if (i.customId === 'help_close') {
						collector.stop('closed');
						await i.update({
							embeds: [pages[currentPage]],
							components: []
						});
						return;
					} else if (i.customId === 'help_refresh') {
						// Refresh the command data
						try {
							// Clear the cache to force refresh
							commandCache.timestamp = 0;
							await getAllCommands();

							// Indicate refreshing
							await i.update({
								content: 'Refreshing command data...',
								embeds: [],
								components: []
							});

							// Execute the command again with a slight delay
							setTimeout(() => {
								module.exports.execute(interaction).catch(err => {
									Logger.log('HELP', `Error re-executing help command: ${err.message}`, 'error');
								});
							}, 1000);

							collector.stop('refreshed');
							return;
						} catch (error) {
							Logger.log('HELP', `Error refreshing command data: ${error.message}`, 'error');
							await i.update({
								content: 'Failed to refresh command data. Please try again.',
								embeds: [pages[currentPage]],
								components: createButtons(currentPage)
							});
							return;
						}
					}

					// Handle the button press by updating the message
					await i.update({
						embeds: [pages[currentPage]],
						components: createButtons(currentPage)
					});
				}
				// Handle select menu interactions
				else if (i.isStringSelectMenu()) {
					if (i.customId === 'help_category_select') {
						// Get the selected page index from the value
						const selectedPage = parseInt(i.values[0]);

						// Validate the page index
						if (selectedPage >= 0 && selectedPage < pages.length) {
							currentPage = selectedPage;

							// Update the message with the new page
							await i.update({
								embeds: [pages[currentPage]],
								components: createButtons(currentPage)
							});
						} else {
							// Handle invalid selection
							await i.update({
								content: 'Invalid selection. Please try again.',
								embeds: [pages[currentPage]],
								components: createButtons(currentPage)
							});
						}
					}
				}
			} catch (error) {
				Logger.log('HELP', `Error handling interaction: ${error.message}`, 'error');
				// Try to handle the error gracefully
				try {
					await i.update({
						content: 'An error occurred. Please try using the command again.',
						embeds: [pages[currentPage]],
						components: createButtons(currentPage)
					}).catch(() => { });
				} catch (updateError) {
					// If we can't update, try to reply instead
					try {
						await i.reply({
							content: 'Error updating help menu. Please try the command again.',
							ephemeral: true
						}).catch(() => { });
					} catch (replyError) {
						// If all else fails, just log the error
						Logger.log('HELP', 'Failed to respond to interaction error', 'error');
					}
				}
			}
		});

		collector.on('end', async (collected, reason) => {
			// When timeout or manually closed, remove buttons
			if (reason === 'time') {
				try {
					await message.edit({
						components: [],
						embeds: [
							pages[currentPage].setFooter({
								text: `${pages[currentPage].data.footer?.text || ''} • Pagination expired`
							})
						]
					}).catch(() => { }); // Ignore errors if edit fails
				} catch (error) {
					Logger.log('HELP', `Error updating message after pagination ended: ${error.message}`, 'error');
				}
			}
		});
	} catch (error) {
		// If initial reply fails, handle gracefully
		Logger.log('HELP', `Error starting pagination: ${error.message}`, 'error');
		await interaction.followUp({
			content: 'There was an error displaying the help menu. Please try again.',
			ephemeral: true
		}).catch(() => { });
	}
}

// Helper to format milliseconds to a readable uptime string
function formatUptime(ms) {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
	const days = Math.floor(ms / (1000 * 60 * 60 * 24));

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds > 0) parts.push(`${seconds}s`);

	return parts.join(' ') || '0s';
}

// Helper to split text into chunks that fit within Discord's limits
function splitIntoChunks(text, maxLength) {
	const chunks = [];
	let currentChunk = '';

	const lines = text.split('\n');
	for (const line of lines) {
		if (currentChunk.length + line.length + 1 > maxLength) {
			chunks.push(currentChunk);
			currentChunk = line;
		} else {
			currentChunk += (currentChunk ? '\n' : '') + line;
		}
	}

	if (currentChunk) {
		chunks.push(currentChunk);
	}

	return chunks;
}