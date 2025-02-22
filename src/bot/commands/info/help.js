const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');
const EMBED_COLOR = '#5865F2';
const BOT_ICON_URL = 'https://i.imgur.com/0X4O7f3.png';
const cooldowns = new Map();

// Helper function to handle pagination (no changes needed here)
function paginate(items, itemsPerPage, page) {
	const totalPages = Math.ceil(items.length / itemsPerPage);
	const slicedItems = items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
	return { slicedItems, totalPages };
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows help menu with guides and commands')
		.addStringOption((option) =>
			option
				.setName('search')
				.setDescription('Search for a specific command or topic')
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('Show detailed info for a specific command')
				.setRequired(false),
		),
	description_full:
		'Displays an interactive help menu with commands and important links. Navigate through different sections using the buttons provided.',
	usage: '/help [search] [command]',
	examples: ['/help', '/help search:music', '/help command:ban'],
	category: 'info',

	async execute(interaction) {
		try {
			const searchQuery = interaction.options.getString('search');
			const commandQuery = interaction.options.getString('command');

			const allCommands = interaction.client.commands;
			const commands = Array.from(allCommands.values());

			if (commandQuery) {
				// ... (Command Query Logic - No changes needed here) ...
				const command = commands.find(
					(cmd) =>
						cmd.data.name.toLowerCase() === commandQuery.toLowerCase(),
				);

				if (!command) {
					return interaction.reply({
						content: `❌ Command \`${commandQuery}\` not found. Please check the command name and try again.`,
						ephemeral: true,
					});
				}

				const commandEmbed = new EmbedBuilder()
					.setColor(EMBED_COLOR)
					.setThumbnail(interaction.client.user.displayAvatarURL())
					.setTitle(`/${command.data.name} Command Help`)
					.setDescription(
						command.description_full || '*No detailed description provided for this command.*',
					)
					.addFields(
						{ name: 'Category', value: command.category || 'General', inline: true },
						{ name: 'Usage', value: `\`${command.usage}\``, inline: true },
						{
							name: 'Examples',
							value:
								command.examples?.map((ex) => `\`${ex}\``).join('\n') ||
								'*No examples available.*',
						},
					)
					.setFooter({
						text: 'Tip: Use /help to see the main menu or /help [search:keyword] to find commands.',
						iconURL: interaction.client.user.displayAvatarURL(),
					})
					.setTimestamp();

				return interaction.reply({ embeds: [commandEmbed] });
			}

			if (searchQuery) {
				const filteredCommands = commands.filter(
					(cmd) =>
						cmd.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(cmd.data.description &&
							cmd.data.description
								.toLowerCase()
								.includes(searchQuery.toLowerCase())),
				);

				if (filteredCommands.length === 0) {
					return interaction.reply({
						content: `🔍 No commands found matching your search for \`${searchQuery}\`.`,
						ephemeral: true,
					});
				}

				const ITEMS_PER_PAGE = 10;
				const pages = [];
				for (let i = 0; i < filteredCommands.length; i += ITEMS_PER_PAGE) {
					const pageCommands = filteredCommands.slice(i, i + ITEMS_PER_PAGE);
					// **Improved Search Embed Output:**
					const commandList = pageCommands
						.map(cmd => {
							const commandName = `/${cmd.data.name}`;
							const description = cmd.data.description || '*No description available.*';
							return `> \`${commandName}\` - ${description}`; // List format in description
						})
						.join('\n');

					const searchEmbed = new EmbedBuilder()
						.setColor(EMBED_COLOR)
						.setThumbnail(interaction.client.user.displayAvatarURL())
						.setTitle(`🔍 Search Results for "${searchQuery}" (Page ${pages.length + 1})`)
						.setDescription(`Here are the commands matching your search query:\n${commandList}`) // Use the formatted command list in description
						// Removed addFields as we are using setDescription for command listing
						.setFooter({
							text: `Page ${pages.length + 1} of ${Math.ceil(filteredCommands.length / ITEMS_PER_PAGE)}`,
							iconURL: interaction.client.user.displayAvatarURL(),
						})
						.setTimestamp();

					pages.push(searchEmbed);
				}

				let currentPage = 0;
				const getNavigationRow = () =>
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId('prev')
							.setLabel('Previous')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⬅️')
							.setDisabled(currentPage === 0),
						new ButtonBuilder()
							.setCustomId('next')
							.setLabel('Next')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('➡️')
							.setDisabled(currentPage === pages.length - 1),
					);

				await interaction.reply({
					embeds: [pages[currentPage]],
					components: [getNavigationRow()],
				});

				const collector =
					interaction.channel.createMessageComponentCollector({
						filter: (i) => i.user.id === interaction.user.id,
						time: 300000,
					});

				collector.on('collect', async (i) => {
					if (i.customId === 'next') {
						currentPage++;
						await i.update({
							embeds: [pages[currentPage]],
							components: [getNavigationRow()],
						});
					} else if (i.customId === 'prev') {
						currentPage--;
						await i.update({
							embeds: [pages[currentPage]],
							components: [getNavigationRow()],
						});
					}
				});

				collector.on('end', async () => {
					try {
						await interaction.editReply({
							components: [],
							content: '⏰ Search results expired.',
							embeds: [],
						});
					} catch (error) {
						console.error('Error ending help collector:', error);
					}
				});
				return;
			}

			// Main help menu (No changes needed here)
			const mainEmbed = new EmbedBuilder()
				.setColor(EMBED_COLOR)
				.setThumbnail(interaction.client.user.displayAvatarURL())
				.setTitle('📖 Welcome to the Help Menu!')
				.setDescription(
					'Need assistance or want to know what I can do? Explore the options below:\n\n' +
					'**> 📜 Commands:** View a list of all available commands.\n' +
					'**> 🔗 Support Server:** Get direct support, suggest features, or report bugs.',
				)
				.addFields({
					name: 'Quick Navigation',
					value: 'Use the buttons below to navigate the help menu. For command-specific help, use `/help command:[command name]`. To search commands, use `/help search:[keyword]`.',
				})
				.setTimestamp();

			const buttonRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('commands')
					.setLabel('Commands List')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('📜'),
				new ButtonBuilder()
					.setLabel('Support Server')
					.setStyle(ButtonStyle.Link)
					.setURL('https://discord.gg/y3GvzeZVJ3')
					.setEmoji('🔗'),
			);

			await interaction.reply({
				embeds: [mainEmbed],
				components: [buttonRow],
			});

			// **NEW: Interaction Collector for Main Menu Buttons** (No changes needed here)
			const mainMenuCollector = interaction.channel.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: 300000, // 5 minutes timeout for main menu interaction as well
			});

			mainMenuCollector.on('collect', async (i) => {
				if (i.customId === 'commands') {
					// ... (Command List Logic - No changes needed here) ...
					const ITEMS_PER_PAGE_COMMANDS = 10; // Items per page for command list
					const commandListPages = [];
					for (let j = 0; j < commands.length; j += ITEMS_PER_PAGE_COMMANDS) {
						const pageCommands = commands.slice(j, j + ITEMS_PER_PAGE_COMMANDS);
						const commandListEmbed = new EmbedBuilder()
							.setColor(EMBED_COLOR)
							.setThumbnail(i.client.user.displayAvatarURL())
							.setTitle('📜 Command List')
							.setDescription('Here is a list of all available commands:')
							.addFields(
								pageCommands.map((cmd) => ({
									name: `/${cmd.data.name}`,
									value: cmd.data.description || '*No description available.*',
								})),
							)
							.setFooter({
								text: `Page ${commandListPages.length + 1} of ${Math.ceil(commands.length / ITEMS_PER_PAGE_COMMANDS)}`,
								iconURL: i.client.user.displayAvatarURL(),
							})
							.setTimestamp();
						commandListPages.push(commandListEmbed);
					}

					let currentCommandListPage = 0;
					const getCommandListNavigationRow = () =>
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('cmd_prev') // Different customId to avoid conflict with search pagination
								.setLabel('Previous')
								.setStyle(ButtonStyle.Secondary)
								.setEmoji('⬅️')
								.setDisabled(currentCommandListPage === 0),
							new ButtonBuilder()
								.setCustomId('cmd_next') // Different customId
								.setLabel('Next')
								.setStyle(ButtonStyle.Secondary)
								.setEmoji('➡️')
								.setDisabled(currentCommandListPage === commandListPages.length - 1),
						);

					await i.update({ // Use i.update to edit the original main menu message
						embeds: [commandListPages[currentCommandListPage]],
						components: [getCommandListNavigationRow()],
					});

					const commandListPaginator = i.channel.createMessageComponentCollector({ // Create a *new* collector for command list pagination
						filter: (btn_i) => btn_i.user.id === i.user.id,
						time: 300000,
					});

					commandListPaginator.on('collect', async (btn_i) => {
						if (btn_i.customId === 'cmd_next') {
							currentCommandListPage++;
							await btn_i.update({
								embeds: [commandListPages[currentCommandListPage]],
								components: [getCommandListNavigationRow()],
							});
						} else if (btn_i.customId === 'cmd_prev') {
							currentCommandListPage--;
							await btn_i.update({
								embeds: [commandListPages[currentCommandListPage]],
								components: [getCommandListNavigationRow()],
							});
						}
					});

					commandListPaginator.on('end', async () => {
						try {
							await i.editReply({ // Edit the command list message on timeout
								components: [],
								content: '⏰ Command list expired.',
								embeds: [],
							});
						} catch (error) {
							console.error('Error ending command list collector:', error);
						}
					});
					mainMenuCollector.stop(); // Stop the main menu collector after "commands" is clicked and command list is shown
					return; // Important to return to prevent further main menu collector logic
				}
				// You can add more button handlers here if you add more buttons to the main menu
				// For example, if you add a "Guides" button:
				// else if (i.customId === 'guides') {
				//     // Logic to display guides
				// }
			});

			mainMenuCollector.on('end', collected => {
				if (collected.size === 0) { // Only edit if no interaction happened within timeout for main menu itself (not command list)
					interaction.editReply({
						components: [],
						content: '⏰ Help menu expired due to inactivity.',
					}).catch(error => console.error("Error editing reply on main menu timeout:", error));
				}
			});


		} catch (error) {
			console.error('Error executing help command:', error);
			await handleError(interaction, error);
		}
	},
};