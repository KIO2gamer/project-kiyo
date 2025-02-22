const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');
const EMBED_COLOR = '#5865F2';
const cooldowns = new Map();

// Helper function to handle pagination
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
				const command = commands.find(
					(cmd) =>
						cmd.data.name.toLowerCase() === commandQuery.toLowerCase(),
				);

				if (!command) {
					return interaction.reply({
						content: `❌ No command found with the name \`${commandQuery}\`.`,
					});
				}

				const commandEmbed = new EmbedBuilder()
					.setColor(EMBED_COLOR)
					.setImage('https://i.imgur.com/0X4O7f3.png')
					.setTitle(`✨ Command: /${command.data.name}`)
					.setDescription(command.description_full || 'No description available.')
					.addFields(
						{ name: 'Usage', value: `\`${command.usage}\`` },
						{
							name: 'Examples',
							value: command.examples.join('\n') || 'No examples available.',
						},
					)
					.setFooter({
						text: 'Use /help to return to the main menu.',
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
						content: `❌ No commands found matching \`${searchQuery}\`.`,
					});
				}

				const ITEMS_PER_PAGE = 10;
				const pages = [];
				for (let i = 0; i < filteredCommands.length; i += ITEMS_PER_PAGE) {
					const pageCommands = filteredCommands.slice(i, i + ITEMS_PER_PAGE);
					const searchEmbed = new EmbedBuilder()
						.setColor(EMBED_COLOR)
						.setImage('https://i.imgur.com/0X4O7f3.png')
						.setTitle('🔍 Search Results')
						.setDescription('Here are the commands matching your search:')
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
					await interaction.reply({
						components: [],
						content: '⏰ The search results have expired. Please use `/help` again.',
					});
				});
				return;
			}

			// Main help menu
			const mainEmbed = new EmbedBuilder()
				.setColor(EMBED_COLOR)
				.setImage('https://i.imgur.com/0X4O7f3.png')
				.setTitle('📖 Help Menu')
				.setDescription('Welcome! Use the buttons below to navigate.')
				.setThumbnail(interaction.client.user.displayAvatarURL())
				.setTimestamp();

			const buttonRow = new ActionRowBuilder().addComponents(
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

			await interaction.reply({
				embeds: [mainEmbed],
				components: [buttonRow],
			});
		} catch (error) {
			console.error('Error executing help command:', error);
			await handleError(interaction, error);
		}
	},
};
