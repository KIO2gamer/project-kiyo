const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');
const EMBED_COLOR = '#00AAFF';
const cooldowns = new Map();

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
		'Displays an interactive help menu with guides, commands, FAQs, and important links. Navigate through different sections using the buttons provided.',
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
				const command = commands.find(
					(cmd) =>
						cmd.data.name.toLowerCase() ===
						commandQuery.toLowerCase(),
				);

				if (!command) {
					return interaction.editReply({
						content: `❌ No command found with the name \`${commandQuery}\`.`,
					});
				}

				const commandEmbed = new EmbedBuilder()
					.setColor(EMBED_COLOR)
					.setTitle(`✨ Command: /${command.data.name}`)
					.setDescription(
						command.description_full || 'No description available.',
					)
					.addFields(
						{ name: 'Usage', value: `\`${command.usage}\`` },
						{
							name: 'Examples',
							value:
								command.examples.join('\n') ||
								'No examples available.',
						},
					)
					.setFooter({
						text: 'Use /help to return to the main menu.',
						iconURL: interaction.client.user.displayAvatarURL(),
					})
					.setTimestamp();

				return interaction.editReply({ embeds: [commandEmbed] });
			}

			if (searchQuery) {
				const filteredCommands = commands.filter(
					(cmd) =>
						cmd.data.name
							.toLowerCase()
							.includes(searchQuery.toLowerCase()) ||
						(cmd.data.description &&
							cmd.data.description
								.toLowerCase()
								.includes(searchQuery.toLowerCase())),
				);

				if (filteredCommands.length === 0) {
					return interaction.editReply({
						content: `❌ No commands found matching \`${searchQuery}\`.`,
					});
				}

				const ITEMS_PER_PAGE = 10;
				const pages = [];
				for (
					let i = 0;
					i < filteredCommands.length;
					i += ITEMS_PER_PAGE
				) {
					const pageCommands = filteredCommands.slice(
						i,
						i + ITEMS_PER_PAGE,
					);
					const searchEmbed = new EmbedBuilder()
						.setColor('#00AAFF')
						.setTitle('🔍 Search Results')
						.setDescription(
							'Here are the commands matching your search:',
						)
						.addFields(
							pageCommands.map((cmd) => ({
								name: `/${cmd.data.name}`,
								value:
									cmd.data.description ||
									'No description available.',
							})),
						)
						.setFooter({
							text: `Page ${pages.length + 1}`,
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

				await interaction.editReply({
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
					await interaction.editReply({
						components: [],
						content:
							'⏰ The search results have expired. Please use `/help` again.',
					});
				});
			}

			const mainEmbed = new EmbedBuilder()
				.setColor(EMBED_COLOR)
				.setTitle('📖 Help Menu')
				.setDescription('Welcome! Use the buttons below to navigate.')
				.setThumbnail(interaction.client.user.displayAvatarURL())
				.setTimestamp();

			const buttonRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('faq')
					.setLabel('FAQ')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('❔'),
				new ButtonBuilder()
					.setCustomId('commands')
					.setLabel('Commands')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('📜'),
				new ButtonBuilder()
					.setLabel('Support Server')
					.setStyle(ButtonStyle.Link)
					.setURL('https://discord.gg/y3GvzeZVJ3')
					.setEmoji('🔗'),
			);

			await interaction.editReply({
				embeds: [mainEmbed],
				components: [buttonRow],
			});

			const collector =
				interaction.channel.createMessageComponentCollector({
					filter: (i) => {
						const now = Date.now();
						const timestamps = cooldowns.get(i.user.id) || 0;
						const cooldownAmount = 5000; // 5 seconds cooldown

						if (now < timestamps) {
							i.reply({
								content:
									'⏳ Please wait before interacting again.',
								ephemeral: true,
							});
							return false;
						}

						cooldowns.set(i.user.id, now + cooldownAmount);
						return true;
					},
					time: 300000,
				});

			let currentPage = 0;
			const ITEMS_PER_PAGE = 50;
			const pages = [];

			const commandCategories = {};
			for (const cmd of commands) {
				const category = cmd.category || 'Non-categorizable';
				if (!commandCategories[category]) {
					commandCategories[category] = [];
				}
				commandCategories[category].push(cmd);
			}

			for (const [category, cmds] of Object.entries(commandCategories)) {
				for (let i = 0; i < cmds.length; i += ITEMS_PER_PAGE) {
					const pageCommands = cmds.slice(i, i + ITEMS_PER_PAGE);
					const embed = new EmbedBuilder()
						.setColor(EMBED_COLOR)
						.setTitle(
							`📜 ${category.charAt(0).toUpperCase() + category.slice(1)} commands`,
						)
						.setDescription(
							`Commands in the **${category.charAt(0).toUpperCase() + category.slice(1)}** category:`,
						)
						.addFields(
							pageCommands.map((cmd) => ({
								name: `/${cmd.data.name}`,
								value:
									cmd.data.description ||
									'No description available.',
							})),
						)
						.setFooter({
							text: `Page ${pages.length + 1}`,
							iconURL: interaction.client.user.displayAvatarURL(),
						})
						.setTimestamp();

					pages.push(embed);
				}
			}

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
					new ButtonBuilder()
						.setCustomId('back')
						.setLabel('Back')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔙'),
				);

			collector.on('collect', async (i) => {
				try {
					if (i.customId === 'faq') {
						const faqEmbed = new EmbedBuilder()
							.setColor(EMBED_COLOR)
							.setTitle('❔ Frequently Asked Questions')
							.addFields(
								{
									name: 'How do I invite the bot?',
									value: 'Use the invite link provided.',
								},
								{
									name: 'Bot not responding?',
									value: 'Check permissions and command syntax.',
								},
								{
									name: 'How do I set up roles?',
									value: 'Use the role management commands or the server settings.',
								},
								{
									name: 'How do I configure the bot?',
									value: 'Use the configuration commands or refer to the documentation.',
								},
								{
									name: 'Where can I find support?',
									value: 'Join our support server using the link provided.',
								},
							)
							.setFooter({
								text: 'Use the Back button to return.',
								iconURL:
									interaction.client.user.displayAvatarURL(),
							})
							.setTimestamp();

						const backRow = new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('back')
								.setLabel('Back')
								.setStyle(ButtonStyle.Danger)
								.setEmoji('🔙'),
						);

						await i.update({
							embeds: [faqEmbed],
							components: [backRow],
						});
					} else if (i.customId === 'commands') {
						await i.update({
							embeds: [pages[currentPage]],
							components: [getNavigationRow()],
						});
					} else if (i.customId === 'next') {
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
					} else if (i.customId === 'back') {
						await i.update({
							embeds: [mainEmbed],
							components: [buttonRow],
						});
					}
				} catch (error) {
					console.error('Error handling button interaction:', error);
					await handleError(i, error);
				}
			});

			collector.on('end', async () => {
				await interaction.editReply({
					components: [],
					content:
						'⏰ The help menu has expired. Please use `/help` again.',
				});
			});
		} catch (error) {
			console.error('Error executing help command:', error);
			await handleError(interaction, error);
		}
	},
};
