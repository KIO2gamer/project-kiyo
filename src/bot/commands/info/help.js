const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');

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
			await interaction.deferReply({ ephemeral: true });

			const searchQuery = interaction.options.getString('search');
			const commandQuery = interaction.options.getString('command');

			const allCommands = interaction.client.commands;
			const commands = Array.from(allCommands.values());

			if (commandQuery) {
				const command = commands.find(
					(cmd) => cmd.data.name.toLowerCase() === commandQuery.toLowerCase(),
				);

				if (!command) {
					return interaction.editReply({
						content: `❌ No command found with the name \`${commandQuery}\`.`,
					});
				}

				const commandEmbed = new EmbedBuilder()
					.setColor('#00AAFF')
					.setTitle(`✨ Command: /${command.data.name}`)
					.setDescription(command.description_full || 'No description available.')
					.addFields(
						{ name: 'Usage', value: `\`${command.usage}\`` },
						{ name: 'Examples', value: command.examples.join('\n') || 'No examples available.' },
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
						cmd.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(cmd.data.description &&
							cmd.data.description.toLowerCase().includes(searchQuery.toLowerCase())),
				);

				if (filteredCommands.length === 0) {
					return interaction.editReply({
						content: `❌ No commands found matching \`${searchQuery}\`.`,
					});
				}

				const searchEmbed = new EmbedBuilder()
					.setColor('#00AAFF')
					.setTitle('🔍 Search Results')
					.setDescription('Here are the commands matching your search:')
					.addFields(
						filteredCommands.map((cmd) => ({
							name: `/${cmd.data.name}`,
							value: cmd.data.description || 'No description available.',
						})),
					)
					.setFooter({
						text: 'Use /help to return to the main menu.',
						iconURL: interaction.client.user.displayAvatarURL(),
					})
					.setTimestamp();

				return interaction.editReply({ embeds: [searchEmbed] });
			}

			const mainEmbed = new EmbedBuilder()
				.setColor('#00AAFF')
				.setTitle('📖 Help Menu')
				.setDescription('Welcome! Use the buttons below to navigate.')
				.setThumbnail(interaction.client.user.displayAvatarURL())
				.setTimestamp();

			const buttonRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('guide')
					.setLabel('Guide')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('📝'),
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

			const collector = interaction.channel.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: 300000,
			});

			let currentPage = 0;
			const ITEMS_PER_PAGE = 5;
			const pages = [];

			const commandCategories = {};
			for (const cmd of commands) {
				const category = cmd.category || 'Uncategorized';
				if (!commandCategories[category]) {
					commandCategories[category] = [];
				}
				commandCategories[category].push(cmd);
			}

			for (const [category, cmds] of Object.entries(commandCategories)) {
				for (let i = 0; i < cmds.length; i += ITEMS_PER_PAGE) {
					const pageCommands = cmds.slice(i, i + ITEMS_PER_PAGE);
					const embed = new EmbedBuilder()
						.setColor('#00AAFF')
						.setTitle(`📜 ${category} Commands`)
						.setDescription(`Commands in the **${category}** category:`)
						.addFields(
							pageCommands.map((cmd) => ({
								name: `/${cmd.data.name}`,
								value: cmd.data.description || 'No description available.',
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
					if (i.customId === 'guide') {
						const guideEmbed = new EmbedBuilder()
							.setColor('#00AAFF')
							.setTitle('📝 Setup Guide')
							.setDescription('Follow these steps to set up the bot:')
							.addFields(
								{ name: 'Step 1', value: 'Invite the bot to your server.' },
								{ name: 'Step 2', value: 'Configure the bot settings as needed.' },
								{ name: 'Step 3', value: 'Use `/help` to learn about commands.' },
								{ name: 'Support', value: 'Join our support server for assistance.' },
							)
							.setFooter({
								text: 'Use the Back button to return.',
								iconURL: interaction.client.user.displayAvatarURL(),
							})
							.setTimestamp();

						const backRow = new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('back')
								.setLabel('Back')
								.setStyle(ButtonStyle.Danger)
								.setEmoji('🔙'),
						);

						await i.update({ embeds: [guideEmbed], components: [backRow] });
					} else if (i.customId === 'faq') {
						const faqEmbed = new EmbedBuilder()
							.setColor('#00AAFF')
							.setTitle('❔ Frequently Asked Questions')
							.addFields(
								{ name: 'How do I invite the bot?', value: 'Use the invite link provided.' },
								{ name: 'Bot not responding?', value: 'Check permissions and command syntax.' },
							)
							.setFooter({
								text: 'Use the Back button to return.',
								iconURL: interaction.client.user.displayAvatarURL(),
							})
							.setTimestamp();

						const backRow = new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('back')
								.setLabel('Back')
								.setStyle(ButtonStyle.Danger)
								.setEmoji('🔙'),
						);

						await i.update({ embeds: [faqEmbed], components: [backRow] });
					} else if (i.customId === 'commands') {
						await i.update({ embeds: [pages[currentPage]], components: [getNavigationRow()] });
					} else if (i.customId === 'next') {
						currentPage++;
						await i.update({ embeds: [pages[currentPage]], components: [getNavigationRow()] });
					} else if (i.customId === 'prev') {
						currentPage--;
						await i.update({ embeds: [pages[currentPage]], components: [getNavigationRow()] });
					} else if (i.customId === 'back') {
						await i.update({ embeds: [mainEmbed], components: [buttonRow] });
					}
				} catch (error) {
					console.error('Error handling button interaction:', error);
					await handleError(i, error);
				}
			});

			collector.on('end', async () => {
				await interaction.editReply({
					components: [],
					content: '⏰ The help menu has expired. Please use `/help` again.',
				});
			});
		} catch (error) {
			console.error('Error executing help command:', error);
			await handleError(interaction, error);
		}
	},
};