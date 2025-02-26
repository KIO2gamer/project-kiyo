const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');

// Theme configuration
const THEME = {
	COLOR: '#9B59B6',  // Purple instead of Discord blue
	ICON: 'https://i.imgur.com/0X4O7f3.png',
	TIMEOUT_MS: 180000, // 3 minutes instead of 5
	ITEMS_PER_PAGE: 8,  // 8 instead of 10
};

// Category emoji mapping
const CATEGORY_EMOJIS = {
	admin: '👑',
	channels: '📺',
	customs: '🎨',
	fun: '🎪',
	games: '🎮',
	info: '📊',
	moderation: '🛡️',
	roles: '🏷️',
	setup: '⚙️',
	tickets: '🎟️',
	utility: '🧰',
	youtube: '▶️',
	general: '📌',
};

// Helper class for pagination
class PaginatedMenu {
	constructor(interaction, pages, options = {}) {
		this.interaction = interaction;
		this.pages = pages;
		this.currentPage = 0;
		this.timeout = options.timeout || THEME.TIMEOUT_MS;
		this.extraButtons = options.extraButtons || [];
		this.onEnd = options.onEnd;
		this.idPrefix = options.idPrefix || 'page';
	}

	getNavigationRow() {
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`${this.idPrefix}_first`)
				.setLabel('First')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('⏮️')
				.setDisabled(this.currentPage === 0),

			new ButtonBuilder()
				.setCustomId(`${this.idPrefix}_prev`)
				.setLabel('Previous')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('◀️')
				.setDisabled(this.currentPage === 0),

			new ButtonBuilder()
				.setCustomId(`${this.idPrefix}_indicator`)
				.setLabel(`${this.currentPage + 1}/${this.pages.length}`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true),

			new ButtonBuilder()
				.setCustomId(`${this.idPrefix}_next`)
				.setLabel('Next')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('▶️')
				.setDisabled(this.currentPage === this.pages.length - 1),

			new ButtonBuilder()
				.setCustomId(`${this.idPrefix}_last`)
				.setLabel('Last')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('⏭️')
				.setDisabled(this.currentPage === this.pages.length - 1),
		);

		return row;
	}

	getComponents() {
		const components = [this.getNavigationRow()];

		if (this.extraButtons.length > 0) {
			const extraRow = new ActionRowBuilder().addComponents(...this.extraButtons);
			components.push(extraRow);
		}

		return components;
	}

	async start(isReply = true) {
		if (this.pages.length === 0) return;

		const payload = {
			embeds: [this.pages[this.currentPage]],
			components: this.getComponents(),
		};

		// Fix the deprecated fetchReply
		let message;
		if (isReply) {
			await this.interaction.reply(payload);
			message = await this.interaction.fetchReply();
		} else {
			await this.interaction.update(payload);
			message = await this.interaction.message;
		}

		const collector = message.createMessageComponentCollector({
			filter: i => i.user.id === this.interaction.user.id,
			time: this.timeout
		});

		collector.on('collect', async i => {
			const id = i.customId;

			if (id === `${this.idPrefix}_prev`) {
				this.currentPage--;
			} else if (id === `${this.idPrefix}_next`) {
				this.currentPage++;
			} else if (id === `${this.idPrefix}_first`) {
				this.currentPage = 0;
			} else if (id === `${this.idPrefix}_last`) {
				this.currentPage = this.pages.length - 1;
			} else if (id.startsWith(`${this.idPrefix}_`)) {
				// Handle any additional custom buttons
				return;
			}

			await i.update({
				embeds: [this.pages[this.currentPage]],
				components: this.getComponents(),
			});
		});

		collector.on('end', async () => {
			if (this.onEnd) {
				await this.onEnd(message);
			} else {
				try {
					await message.edit({
						components: [],
						content: '⏰ This menu has expired.',
						embeds: [this.pages[this.currentPage]],
					});
				} catch (err) {
					handleError('Error updating expired help menu:', err);
				}
			}
		});

		return collector;
	}
}

// Helper functions
function getCategoryEmoji(category = 'general') {
	return CATEGORY_EMOJIS[category.toLowerCase()] || '📌';
}

function createCommandEmbed(command, client) {
	const cooldown = command.cooldown ? `${command.cooldown} seconds` : 'None';
	const permissions = command.permissions?.join(', ') || 'None required';

	const embed = new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setAuthor({
			name: `Command: /${command.data.name}`,
			iconURL: client.user.displayAvatarURL()
		})
		.setDescription(command.description_full || command.data.description || '*No description provided.*')
		.addFields([
			{
				name: '📋 Usage',
				value: `\`${command.usage || `/${command.data.name}`}\``,
			},
			{
				name: `${getCategoryEmoji(command.category)} Category`,
				value: command.category ?
					`${command.category.charAt(0).toUpperCase() + command.category.slice(1)}` :
					'General',
				inline: true
			},
			{
				name: '⏱️ Cooldown',
				value: cooldown,
				inline: true
			},
			{
				name: '🔑 Permissions',
				value: permissions,
				inline: true
			}
		])
		.setFooter({
			text: `Type /help to return to help menu`,
			iconURL: client.user.displayAvatarURL()
		});

	// Add examples if available
	if (command.examples && command.examples.length > 0) {
		const examplesValue = command.examples.map(ex => `\`${ex}\``).join('\n');
		embed.addFields({ name: '💡 Examples', value: examplesValue });
	}

	return embed;
}

function organizeCommandsByCategory(commands) {
	const categories = {};

	commands.forEach(cmd => {
		const category = cmd.category?.toLowerCase() || 'general';
		if (!categories[category]) {
			categories[category] = [];
		}
		categories[category].push(cmd);
	});

	return categories;
}

function createCategoryPages(organizedCommands, client) {
	const pages = [];

	// Create a page for each category
	for (const [category, commands] of Object.entries(organizedCommands)) {
		const emoji = getCategoryEmoji(category);
		const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle(`${emoji} ${formattedCategory} Commands`)
			.setDescription(`Here are all commands in the ${formattedCategory} category:`)
			.setThumbnail(client.user.displayAvatarURL())
			.setFooter({
				text: `Use /help command:[name] for detailed information`,
				iconURL: client.user.displayAvatarURL()
			});

		// Add commands to embed
		const commandList = commands
			.sort((a, b) => a.data.name.localeCompare(b.data.name))
			.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`)
			.join('\n');

		embed.addFields({ name: 'Available Commands', value: commandList });
		pages.push(embed);
	}

	return pages;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get help with commands and features')
		.addStringOption((option) =>
			option
				.setName('search')
				.setDescription('Search for specific commands')
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('Get details for a specific command')
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName('category')
				.setDescription('View commands in a specific category')
				.setRequired(false)
				.addChoices(
					{ name: 'Info', value: 'info' },
					{ name: 'Moderation', value: 'moderation' },
					{ name: 'Fun', value: 'fun' },
					{ name: 'Utility', value: 'utility' },
					{ name: 'Music', value: 'music' },
					{ name: 'Admin', value: 'admin' },
					{ name: 'Economy', value: 'economy' },
					{ name: 'General', value: 'general' }
				)
		),
	description_full: 'Browse through all of the bot\'s features and commands with our interactive help system. Search for specific commands, view detailed information, or explore commands by category.',
	usage: '/help [search:keyword] [command:name] [category:name]',
	examples: ['/help', '/help search:play', '/help command:ban', '/help category:moderation'],
	category: 'info',
	cooldown: 5,

	async execute(interaction) {
		try {
			const { client } = interaction;
			const searchQuery = interaction.options.getString('search')?.toLowerCase();
			const commandQuery = interaction.options.getString('command')?.toLowerCase();
			const categoryQuery = interaction.options.getString('category')?.toLowerCase();

			const commands = Array.from(client.commands.values());

			// COMMAND DETAILS
			if (commandQuery) {
				const command = commands.find(cmd => cmd.data.name.toLowerCase() === commandQuery);

				if (!command) {
					return interaction.reply({
						content: `❌ Command \`${commandQuery}\` not found. Try \`/help\` to see all available commands.`,
						ephemeral: true,
					});
				}

				const embed = createCommandEmbed(command, client);

				// Add a button to go back to main help menu
				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('return_to_help')
						.setLabel('Return to Help Menu')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🔙')
				);

				await interaction.reply({
					embeds: [embed],
					components: [row]
				});

				const response = await interaction.fetchReply();

				const collector = response.createMessageComponentCollector({
					filter: i => i.user.id === interaction.user.id,
					time: THEME.TIMEOUT_MS
				});

				collector.on('collect', async i => {
					if (i.customId === 'return_to_help') {
						collector.stop();
						// Execute the help command again with no parameters
						// Fix: Ensure client reference is preserved
						await this.execute(interaction);
					}
				});

				collector.on('end', async collected => {
					if (collected.size === 0) {
						await interaction.editReply({ components: [] });
					}
				});

				return;
			}

			// CATEGORY VIEW
			if (categoryQuery) {
				const categoryCommands = commands.filter(cmd =>
					(cmd.category || 'general').toLowerCase() === categoryQuery
				);

				if (categoryCommands.length === 0) {
					return interaction.reply({
						content: `❌ No commands found in the \`${categoryQuery}\` category.`,
						ephemeral: true
					});
				}

				const pages = [];
				const itemsPerPage = THEME.ITEMS_PER_PAGE;

				// Split commands into pages
				for (let i = 0; i < categoryCommands.length; i += itemsPerPage) {
					const pageCommands = categoryCommands.slice(i, i + itemsPerPage);

					const embed = new EmbedBuilder()
						.setColor(THEME.COLOR)
						.setTitle(`${getCategoryEmoji(categoryQuery)} ${categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1)} Commands`)
						.setDescription(`Here are all commands in this category:`)
						.setThumbnail(client.user.displayAvatarURL());

					const commandsText = pageCommands
						.map(cmd => `**/${cmd.data.name}** - ${cmd.data.description || 'No description'}`)
						.join('\n\n');

					embed.addFields({ name: 'Commands', value: commandsText });

					embed.setFooter({
						text: `Page ${pages.length + 1} • Use /help command:[name] for details`,
						iconURL: client.user.displayAvatarURL()
					});

					pages.push(embed);
				}

				// Return button
				const returnButton = new ButtonBuilder()
					.setCustomId('return_to_help_menu')
					.setLabel('Back to Main Menu')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('🏠');

				const paginator = new PaginatedMenu(interaction, pages, {
					idPrefix: 'category',
					extraButtons: [returnButton],
					onEnd: async () => {
						await interaction.editReply({
							content: '⏰ Category view expired',
							components: [],
							embeds: []
						});
					}
				});

				const collector = await paginator.start();

				collector.on('collect', async i => {
					if (i.customId === 'return_to_help_menu') {
						collector.stop();
						// Execute the help command again with no parameters
						await this.execute(interaction);
					}
				});

				return;
			}

			// SEARCH
			if (searchQuery) {
				const filteredCommands = commands.filter(cmd =>
					cmd.data.name.toLowerCase().includes(searchQuery) ||
					cmd.data.description?.toLowerCase().includes(searchQuery) ||
					cmd.description_full?.toLowerCase().includes(searchQuery)
				);

				if (filteredCommands.length === 0) {
					return interaction.reply({
						content: `🔍 No commands found matching \`${searchQuery}\`. Try a different search term.`,
						ephemeral: true
					});
				}

				const pages = [];
				const itemsPerPage = THEME.ITEMS_PER_PAGE;

				for (let i = 0; i < filteredCommands.length; i += itemsPerPage) {
					const pageCommands = filteredCommands.slice(i, i + itemsPerPage);

					const embed = new EmbedBuilder()
						.setColor(THEME.COLOR)
						.setTitle(`🔍 Search Results for "${searchQuery}"`)
						.setDescription(`Found **${filteredCommands.length}** commands matching your search.`)
						.setThumbnail(client.user.displayAvatarURL());

					pageCommands.forEach(cmd => {
						const emoji = getCategoryEmoji(cmd.category);
						embed.addFields({
							name: `${emoji} /${cmd.data.name}`,
							value: `${cmd.data.description || 'No description'}\n*Use \`/help command:${cmd.data.name}\` for details*`
						});
					});

					embed.setFooter({
						text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(filteredCommands.length / itemsPerPage)}`,
						iconURL: client.user.displayAvatarURL()
					});

					pages.push(embed);
				}

				// Return button
				const returnButton = new ButtonBuilder()
					.setCustomId('return_to_main')
					.setLabel('Back to Main Menu')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('🏠');

				const paginator = new PaginatedMenu(interaction, pages, {
					idPrefix: 'search',
					extraButtons: [returnButton]
				});

				const collector = await paginator.start();

				collector.on('collect', async i => {
					if (i.customId === 'return_to_main') {
						collector.stop();
						// Execute the help command again with no parameters
						await this.execute(interaction);
					}
				});

				return;
			}

			// MAIN HELP MENU
			const organizedCommands = organizeCommandsByCategory(commands);

			const mainEmbed = new EmbedBuilder()
				.setColor(THEME.COLOR)
				.setAuthor({
					name: `${client.user.username} Help System`,
					iconURL: client.user.displayAvatarURL()
				})
				.setDescription(
					`Welcome to the help center! Here you can find information about all my commands and features.\n\n` +
					`**Total Commands:** ${commands.length}\n` +
					`**Categories:** ${Object.keys(organizedCommands).length}\n\n` +
					`Use the select menu below to browse command categories or the buttons for other options.`
				)
				.setThumbnail(client.user.displayAvatarURL())
				.addFields([
					{
						name: '📝 Quick Tips',
						value:
							`• Use \`/help command:[name]\` to get detailed help on a specific command\n` +
							`• Use \`/help search:[keyword]\` to search for commands\n` +
							`• Use \`/help category:[name]\` to browse commands by category`
					},
					{
						name: '📚 Categories',
						value: Object.keys(organizedCommands)
							.map(cat => `${getCategoryEmoji(cat)} **${cat.charAt(0).toUpperCase() + cat.slice(1)}** (${organizedCommands[cat].length})`)
							.join(' • ')
					}
				])
				.setFooter({
					text: `Bot Version 1.0.0 • Made with ❤️`,
					iconURL: client.user.displayAvatarURL()
				});

			// Create category selection menu
			const categoryOptions = Object.keys(organizedCommands).map(category => {
				return new StringSelectMenuOptionBuilder()
					.setLabel(`${category.charAt(0).toUpperCase() + category.slice(1)}`)
					.setDescription(`View ${organizedCommands[category].length} commands in this category`)
					.setEmoji(getCategoryEmoji(category))
					.setValue(category);
			});

			const categorySelect = new StringSelectMenuBuilder()
				.setCustomId('category_select')
				.setPlaceholder('Select a command category...')
				.addOptions(categoryOptions);

			const selectRow = new ActionRowBuilder().addComponents(categorySelect);

			// Action buttons row
			const buttonRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('all_commands')
					.setLabel('All Commands')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('📜'),
				new ButtonBuilder()
					.setCustomId('search_commands')
					.setLabel('Search')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('🔍'),
				new ButtonBuilder()
					.setLabel('Support Server')
					.setStyle(ButtonStyle.Link)
					.setURL('https://discord.gg/y3GvzeZVJ3')
					.setEmoji('🔗')
			);

			await interaction.reply({
				embeds: [mainEmbed],
				components: [selectRow, buttonRow]
			});

			const response = await interaction.fetchReply();

			const collector = response.createMessageComponentCollector({
				filter: i => i.user.id === interaction.user.id,
				time: THEME.TIMEOUT_MS
			});

			collector.on('collect', async i => {
				// Handle category select menu
				if (i.customId === 'category_select') {
					const category = i.values[0];
					collector.stop();

					// Execute the help command with the selected category
					await this.execute({
						...interaction,
						client: interaction.client, // Add this line
						options: {
							getString: (name) => name === 'category' ? category : null
						},
						replied: true,
						editReply: interaction.editReply.bind(interaction)
					});
					return;
				}

				// Handle all commands button
				if (i.customId === 'all_commands') {
					const pages = createCategoryPages(organizedCommands, client);

					const paginator = new PaginatedMenu(i, pages, {
						idPrefix: 'allcmds',
						onEnd: async () => {
							try {
								await interaction.editReply({
									content: '⏰ Command list view expired',
									components: [],
									embeds: []
								});
							} catch (err) {
								handleError('Error updating expired command list:', err);
							}
						}
					});

					await paginator.start(false);
					collector.stop();
					return;
				}

				// Handle search button
				if (i.customId === 'search_commands') {
					await i.reply({
						content: 'Please use `/help search:keyword` to search for commands.',
						ephemeral: true
					});
				}
			});

			collector.on('end', async collected => {
				if (collected.size === 0) {
					try {
						await interaction.editReply({
							content: '⏰ Help menu expired due to inactivity.',
							components: [],
							embeds: []
						});
					} catch (error) {
						handleError('Error updating expired help menu:', error);
					}
				}
			});

		} catch (error) {
			handleError('Error executing help command:', error);
			await handleError(interaction, error);
		}
	},
};