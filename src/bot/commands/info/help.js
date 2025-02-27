const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { handleError } = require('../../utils/errorHandler.js'); // Assuming you still want to use this

// Theme configuration - You can adjust these as needed
const THEME = {
	COLOR: '#3498db', // Discord blue
	ICON: 'https://cdn.discordapp.com/embed/avatars/0.png', // Default Discord avatar
	TIMEOUT_MS: 120000, // 2 minutes timeout for menus
	ITEMS_PER_PAGE: 10,
};

// Base emoji mapping for common categories
const CATEGORY_EMOJIS = {
	admin: '🛠️',
	channels: '📚',
	customs: '🎨',
	fun: '🎉',
	games: '🎮',
	info: 'ℹ️',
	moderation: '🛡️',
	roles: '👑',
	setup: '⚙️',
	tickets: '🎫',
	utility: '🧰',
	youtube: '🎥',
	others: '📌'
};

// Function to ensure all categories have an emoji
function updateCategoryEmojis(categories) {
	// Add any missing categories with default emoji
	categories.forEach(category => {
		if (!CATEGORY_EMOJIS[category.toLowerCase()]) {
			CATEGORY_EMOJIS[category.toLowerCase()] = '📌'; // Default emoji
		}
	});
	return CATEGORY_EMOJIS;
}

// Function to get category emoji
function getCategoryEmoji(category = 'general') {
	return CATEGORY_EMOJIS[category.toLowerCase()] || '📌';
}

// Helper function to organize commands by category
function organizeCommandsByCategory(commands) {
	const categories = {};
	for (const command of commands.values()) {
		const category = command.category?.toLowerCase() || 'general';
		if (!categories[category]) {
			categories[category] = [];
		}
		categories[category].push(command);
	}
	return categories;
}

// Function to create a paginated menu (simplified for this example)
async function createPaginatedMenu(interaction, pages) {
	if (!pages || pages.length === 0) {
		return interaction.reply({ content: 'No pages to display.', ephemeral: true });
	}

	let currentPage = 0;
	const menuMessage = await interaction.reply({
		embeds: [pages[currentPage]],
		components: pages.length > 1 ? [createNavigationRow(currentPage, pages.length)] : [],
		withResponse: true,
	});

	if (pages.length <= 1) return; // No need for collector if only one page

	const collector = menuMessage.createMessageComponentCollector({
		filter: i => i.user.id === interaction.user.id,
		time: THEME.TIMEOUT_MS,
	});

	collector.on('collect', async i => {
		if (i.customId === 'prev') {
			currentPage = Math.max(0, currentPage - 1);
		} else if (i.customId === 'next') {
			currentPage = Math.min(pages.length - 1, currentPage + 1);
		}
		await i.update({
			embeds: [pages[currentPage]],
			components: [createNavigationRow(currentPage, pages.length)],
		});
	});

	collector.on('end', () => {
		if (menuMessage.editable) {
			menuMessage.edit({ components: [] }); // Remove buttons on timeout
		}
	});
}

// Helper function to create navigation row for pagination
function createNavigationRow(currentPage, totalPages) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('prev')
			.setEmoji('◀️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === 0),
		new ButtonBuilder()
			.setCustomId('page_indicator')
			.setLabel(`Page ${currentPage + 1} of ${totalPages}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder()
			.setCustomId('next')
			.setEmoji('▶️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === totalPages - 1),
	);
}

// Function to create main help embed
function createMainHelpEmbed(client, organizedCommands) {
	const totalCommands = Array.from(client.commands.values()).length;
	const categories = Object.keys(organizedCommands);

	return new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setAuthor({ name: `${client.user.username} Help System`, iconURL: client.user.displayAvatarURL() })
		.setDescription(
			`Welcome to the help center! Here you can explore all available commands.\n\n` +
			`**Total Commands:** ${totalCommands}\n` +
			`**Categories:** ${categories.length}\n\n` +
			`Use the options below to explore commands or get details.`
		)
		.addFields({
			name: 'Available Categories',
			value: categories.map(category =>
				`${getCategoryEmoji(category)} **${category.charAt(0).toUpperCase() + category.slice(1)}**`
			).join(' • '),
			inline: false
		})
		.setFooter({ text: 'For command specific help, use `/help command:[command name]`' });
}

// Function to create embeds for category command listing
function createCategoryCommandEmbeds(categoryName, categoryCommands, client) {
	const pages = [];
	const itemsPerPage = THEME.ITEMS_PER_PAGE;
	const emoji = getCategoryEmoji(categoryName);
	const categoryTitle = `${emoji} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Commands`;

	for (let i = 0; i < categoryCommands.length; i += itemsPerPage) {
		const pageCommands = categoryCommands.slice(i, i + itemsPerPage);
		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle(categoryTitle)
			.setDescription(`Here are the commands in the ${categoryTitle} category:`)
			.setThumbnail(client.user.displayAvatarURL())
			.addFields({
				name: 'Commands',
				value: pageCommands
					.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`)
					.join('\n') || 'No commands in this category.', // Handle empty category
			})
			.setFooter({ text: `Page ${pages.length + 1}` });
		pages.push(embed);
	}
	return pages;
}

// Function to create embed for command details
function createCommandDetailEmbed(command, client) {
	const embed = new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setTitle(`\`/${command.data.name}\` Command Details`)
		.setDescription(command.description_full || command.data.description || '*No detailed description provided.*')
		.addFields([
			{ name: 'Category', value: command.category ? `${getCategoryEmoji(command.category)} ${command.category}` : 'Others', inline: true },
			{ name: 'Usage', value: `\`${command.usage || `/${command.data.name}`}\``, inline: true },
			{ name: 'Permissions', value: command.permissions ? `Required: ${command.permissions.join(', ')}` : 'None', inline: true },
		])
		.setFooter({ text: 'Example usage might be available below.' });

	if (command.examples && command.examples.length > 0) {
		embed.addFields({ name: 'Examples', value: command.examples.map(ex => `\`${ex}\``).join('\n') });
	}

	return embed;
}

// Function to create embeds for search results
function createSearchEmbeds(results, searchQuery, client) {
	const pages = [];
	const itemsPerPage = THEME.ITEMS_PER_PAGE;

	for (let i = 0; i < results.length; i += itemsPerPage) {
		const pageResults = results.slice(i, i + itemsPerPage);
		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle(`Search Results for "${searchQuery}"`)
			.setDescription(`Found ${results.length} commands matching "${searchQuery}".`)
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				pageResults.map(cmd => ({
					name: `\`/${cmd.data.name}\` ${getCategoryEmoji(cmd.category || 'others')}`,
					value: cmd.data.description || 'No description.',
				}))
			)
			.setFooter({ text: `Page ${pages.length + 1}` });
		pages.push(embed);
	}
	return pages;
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays help information for bot commands.')
		.addStringOption(option => option.setName('command').setDescription('Get details for a specific command.'))
		.addStringOption(option =>
			option.setName('category').setDescription('View commands within a specific category.')
				.setRequired(false) // category option is no longer required
				.addChoices( // We will leave addChoices here, but it will be populated dynamically in execute
					[] // Initially empty choices - they will be set dynamically
				)
		)
		.addStringOption(option => option.setName('search').setDescription('Search for commands by keyword.')),

	category: 'info',
	usage: '/help [command:command-name] [category:category-name] [search:keyword]',
	description_full: 'The help command provides information about all available commands in the bot. You can view all commands, filter by category, search for specific commands, or get detailed information about a particular command. The interactive help menu makes it easy to navigate through commands and categories.',
	examples: [
		'/help',
		'/help command:ping',
		'/help category:fun',
		'/help search:roles'
	],

	async execute(interaction) {
		try {
			const { client } = interaction;
			const commandName = interaction.options.getString('command');
			const categoryName = interaction.options.getString('category');
			const searchQuery = interaction.options.getString('search');

			const commands = client.commands; // Now client.commands is available

			// Get all categories and update emoji mapping
			const organizedCategories = organizeCommandsByCategory(commands);
			updateCategoryEmojis(Object.keys(organizedCategories));

			// Now generate category choices using the updated emojis
			const categoryChoices = Object.keys(organizedCategories)
				.filter(category => organizedCategories[category].length > 0) // Only include categories with commands
				.map(category => ({
					name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
					value: category,
				}));

			// **Update the choices for the 'category' option dynamically**:
			module.exports.data.options.find(option => option.name === 'category').choices = categoryChoices;


			if (commandName) {
				const command = commands.get(commandName.toLowerCase());
				if (!command) {
					return interaction.reply({ content: `Command \`${commandName}\` not found.`, ephemeral: true });
				}
				const detailEmbed = createCommandDetailEmbed(command, client);
				return interaction.reply({ embeds: [detailEmbed] });
			}

			if (categoryName) {
				const organizedCommands = organizeCommandsByCategory(commands);
				const categoryCommands = organizedCommands[categoryName.toLowerCase()];
				if (!categoryCommands || categoryCommands.length === 0) {
					return interaction.reply({ content: `No commands found in the \`${categoryName}\` category.`, ephemeral: true });
				}
				const categoryPages = createCategoryCommandEmbeds(categoryName, categoryCommands, client);
				return createPaginatedMenu(interaction, categoryPages);
			}

			if (searchQuery) {
				const searchResults = commands.filter(cmd =>
					cmd.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(cmd.data.description && cmd.data.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
					(cmd.description_full && cmd.description_full.toLowerCase().includes(searchQuery.toLowerCase()))
				).map(cmd => cmd); // Convert to array
				if (searchResults.length === 0) {
					return interaction.reply({ content: `No commands found matching "${searchQuery}".`, ephemeral: true });
				}
				const searchPages = createSearchEmbeds(searchResults, searchQuery, client);
				return createPaginatedMenu(interaction, searchPages);
			}

			// Default Help Menu (No options provided)
			const organizedCommands = organizeCommandsByCategory(commands);
			const mainHelpEmbed = createMainHelpEmbed(client, organizedCommands);
			interaction.reply({ embeds: [mainHelpEmbed] });


		} catch (error) {
			console.error('Error executing help command:', error);
			handleError(interaction, error); // Use your error handler
		}
	},
};