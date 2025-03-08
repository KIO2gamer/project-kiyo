const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Category emoji mapping
const CATEGORY_EMOJIS = {
	'admin': '⚙️',
	'fun': '🎲',
	'games': '🎮',
	'info': 'ℹ️',
	'moderation': '🛡️',
	'roles': '👑',
	'setup': '🔧',
	'utility': '🛠️'
};

// Constants
const EMBED_COLOR = '#3498db';
const MAX_FIELD_LENGTH = 1024;
const MAX_FIELDS_PER_EMBED = 25;
const PAGINATION_TIMEOUT = 180000; // 3 minutes

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

		// Get all commands from command folders
		const commands = await getAllCommands();

		if (commandName) {
			return handleCommandDetails(interaction, commandName, commands);
		} else if (searchQuery) {
			return handleSearchQuery(interaction, searchQuery, commands);
		} else if (categoryFilter) {
			return handleCategoryFilter(interaction, categoryFilter, commands);
		} else {
			return handleGeneralHelp(interaction, commands);
		}
	}
};

// Get all commands recursively from the commands directory
async function getAllCommands() {
	const commands = [];
	const commandsPath = path.join(__dirname, '..');

	try {
		const categories = fs.readdirSync(commandsPath)
			.filter(dir => {
				try {
					return fs.statSync(path.join(commandsPath, dir)).isDirectory();
				} catch (error) {
					console.error(`Error checking if ${dir} is a directory:`, error);
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
						const command = require(filePath);
						if (command.data && command.execute) {
							command.category = category;
							commands.push(command);
						}
					} catch (error) {
						console.error(`Error loading command file ${file}:`, error);
					}
				}
			} catch (error) {
				console.error(`Error reading category directory ${category}:`, error);
			}
		}
	} catch (error) {
		console.error('Error reading commands directory:', error);
	}

	return commands;
}

async function handleCommandDetails(interaction, commandName, commands) {
	const command = commands.find(cmd => cmd.data.name === commandName);

	if (!command) {
		return interaction.reply({
			content: `Command \`${commandName}\` not found.`,
			flags: 64
		});
	}

	const embed = new EmbedBuilder()
		.setTitle(`Command: /${command.data.name}`)
		.setDescription(command.description_full || command.data.description || 'No description available')
		.setColor(EMBED_COLOR);

	// Add command options if they exist
	if (command.data.options && command.data.options.length > 0) {
		let optionsText = '';
		command.data.options.forEach(option => {
			const required = option.required ? '(required)' : '(optional)';
			optionsText += `• **${option.name}** ${required}: ${option.description}\n`;
		});

		embed.addFields({ name: 'Options', value: optionsText });
	}

	// Add usage if it exists
	if (command.usage) {
		embed.addFields({ name: 'Usage', value: command.usage });
	}

	// Add examples if they exist
	if (command.examples) {
		embed.addFields({
			name: 'Examples',
			value: command.examples.join('\n')
		});
	}

	// Add category information with emoji
	const categoryEmoji = CATEGORY_EMOJIS[command.category?.toLowerCase()] || '📁';
	embed.addFields({
		name: 'Category',
		value: `${categoryEmoji} ${command.category || 'Uncategorized'}`
	});

	// Find similar commands (in the same category)
	const similarCommands = commands
		.filter(cmd => cmd.category === command.category && cmd.data.name !== command.data.name)
		.slice(0, 5)
		.map(cmd => `\`/${cmd.data.name}\``);

	if (similarCommands.length > 0) {
		embed.addFields({
			name: 'Similar Commands',
			value: similarCommands.join(', ')
		});
	}

	return interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleSearchQuery(interaction, searchQuery, commands) {
	const results = commands.filter(cmd => {
		// Search in command name
		if (cmd.data.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;

		// Search in command description
		if (cmd.data.description && cmd.data.description.toLowerCase().includes(searchQuery.toLowerCase())) return true;

		// Search in command options
		if (cmd.data.options) {
			return cmd.data.options.some(opt =>
				opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				opt.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return false;
	});

	if (results.length === 0) {
		return interaction.reply({
			content: `No commands found matching '${searchQuery}'.`,
			flags: 64
		});
	}

	// Group results by category
	const groupedResults = {};
	results.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedResults[category]) {
			groupedResults[category] = [];
		}
		groupedResults[category].push(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
	});

	// Create pages for pagination
	const pages = [];
	const categoriesPerPage = 3; // Number of categories to show per page
	const categories = Object.entries(groupedResults);

	// Create pages with a maximum of 3 categories per page
	for (let i = 0; i < categories.length; i += categoriesPerPage) {
		const embed = new EmbedBuilder()
			.setTitle(`Search Results: "${searchQuery}"`)
			.setDescription(`Found ${results.length} command(s)`)
			.setColor(EMBED_COLOR)
			.setFooter({
				text: `Page ${Math.floor(i / categoriesPerPage) + 1} of ${Math.ceil(categories.length / categoriesPerPage)}`
			});

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

		pages.push(embed);
	}

	await sendPagination(interaction, pages);
}

async function handleCategoryFilter(interaction, categoryFilter, commands) {
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
			flags: 64
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
			.setDescription(`${categoryCommands.length} command(s) available`)
			.setColor(EMBED_COLOR)
			.setFooter({
				text: `Page ${Math.floor(i / commandsPerPage) + 1} of ${Math.ceil(categoryCommands.length / commandsPerPage)}`
			});

		const commandList = pageCommands.map(cmd =>
			`\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`
		).join('\n');

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
			.setColor(EMBED_COLOR);

		embed.addFields({
			name: 'Commands',
			value: 'No commands available in this category.'
		});

		pages.push(embed);
	}

	await sendPagination(interaction, pages);
}

async function handleGeneralHelp(interaction, commands) {
	// Calculate uptime based on client uptime
	const uptime = formatUptime(interaction.client.uptime);

	// Calculate key statistics
	const totalCommands = commands.length;
	const serverCount = interaction.client.guilds.cache.size;

	// Group commands by category for pagination
	const groupedCommands = {};
	commands.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedCommands[category]) {
			groupedCommands[category] = [];
		}
		groupedCommands[category].push(cmd);
	});

	// Create first page (overview)
	const overviewEmbed = new EmbedBuilder()
		.setTitle('Kiyo Help Center')
		.setDescription('Welcome to the interactive help menu! Here you can explore all available\ncommands and features.')
		.setColor(EMBED_COLOR)
		.addFields(
			{
				name: 'Key Statistics:',
				value: `• Commands: ${totalCommands} commands across ${Object.keys(groupedCommands).length} categories\n• Servers: Currently serving ${serverCount} Discord servers\n• Uptime: ${uptime}`,
				inline: false
			}
		);

	// Add categories with their command counts
	const categoriesField = Object.entries(groupedCommands)
		.map(([category, cmds]) => {
			const emoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';
			return `${emoji} ${category} (${cmds.length} commands)`;
		})
		.join('\n');

	overviewEmbed.addFields({
		name: '📑 Available Categories',
		value: categoriesField,
		inline: false
	});

	overviewEmbed.addFields({
		name: '🔍 Navigation Help',
		value: 'Use the buttons below to navigate through pages of categories and commands.\nYou can also use `/help command:[name]`, `/help search:[keyword]`, or `/help category:[name]` for more specific information.',
		inline: false
	});

	overviewEmbed.setFooter({
		text: 'Page 1 - Overview'
	});

	// Create category pages (one page per category)
	const categoryPages = [];
	categoryPages.push(overviewEmbed); // First page is overview

	Object.entries(groupedCommands).forEach(([category, cmds]) => {
		const categoryEmoji = CATEGORY_EMOJIS[category.toLowerCase()] || '📁';

		const embed = new EmbedBuilder()
			.setTitle(`${categoryEmoji} ${category} Commands`)
			.setDescription(`${cmds.length} commands available in this category`)
			.setColor(EMBED_COLOR);

		// Split commands into chunks if needed
		const commandList = cmds.map(cmd =>
			`\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`
		);

		const chunks = splitIntoChunks(commandList.join('\n'), MAX_FIELD_LENGTH);

		for (let i = 0; i < chunks.length; i++) {
			embed.addFields({
				name: i === 0 ? 'Commands' : 'Commands (continued)',
				value: chunks[i]
			});
		}

		embed.setFooter({
			text: `Page ${categoryPages.length + 1} - ${category}`
		});

		categoryPages.push(embed);
	});

	await sendPagination(interaction, categoryPages);
}

// Helper function to handle pagination with buttons
async function sendPagination(interaction, pages) {
	if (pages.length === 1) {
		// If there's only one page, just send it without buttons
		return interaction.reply({
			embeds: [pages[0]],
			flags: 64
		});
	}

	let currentPage = 0;

	// Create buttons for navigation
	const createButtons = (currentPage) => {
		const firstButton = new ButtonBuilder()
			.setCustomId('first')
			.setLabel('First')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage === 0);

		const prevButton = new ButtonBuilder()
			.setCustomId('prev')
			.setLabel('◀')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === 0);

		const pageInfoButton = new ButtonBuilder()
			.setCustomId('info')
			.setLabel(`${currentPage + 1} / ${pages.length}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);

		const nextButton = new ButtonBuilder()
			.setCustomId('next')
			.setLabel('▶')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === pages.length - 1);

		const lastButton = new ButtonBuilder()
			.setCustomId('last')
			.setLabel('Last')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage === pages.length - 1);

		const closeButton = new ButtonBuilder()
			.setCustomId('close')
			.setLabel('Close')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(firstButton, prevButton, pageInfoButton, nextButton, lastButton);

		const closeRow = new ActionRowBuilder()
			.addComponents(closeButton);

		return [row, closeRow];
	};

	// Send initial message with buttons
	const message = await interaction.reply({
		embeds: [pages[currentPage]],
		components: createButtons(currentPage),
		flags: 64,
		withResponse: true
	});

	// Create collector for button interactions
	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: PAGINATION_TIMEOUT
	});

	collector.on('collect', async (i) => {
		// Handle user's button press
		switch (i.customId) {
			case 'first':
				currentPage = 0;
				break;
			case 'prev':
				currentPage = Math.max(0, currentPage - 1);
				break;
			case 'next':
				currentPage = Math.min(pages.length - 1, currentPage + 1);
				break;
			case 'last':
				currentPage = pages.length - 1;
				break;
			case 'close':
				collector.stop('closed');
				return;
		}

		// Update the message with new page and buttons
		await i.update({
			embeds: [pages[currentPage]],
			components: createButtons(currentPage)
		});
	});

	collector.on('end', async (collected, reason) => {
		// When timeout or manually closed, remove buttons
		if (reason === 'time' || reason === 'closed') {
			try {
				await message.edit({
					components: [],
					embeds: [
						pages[currentPage].setFooter({
							text: `${pages[currentPage].data.footer?.text || ''} • Pagination expired`
						})
					]
				});
			} catch (error) {
				console.error('Error updating message after pagination ended:', error);
			}
		}
	});
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