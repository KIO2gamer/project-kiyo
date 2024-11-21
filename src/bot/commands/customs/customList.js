const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const cc = require('./../../../database/customCommands');
const { handleError } = require('./../../utils/errorHandler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_list')
		.setDescription('Lists all custom commands'),
	category: 'customs',
	description_full: 'Lists all custom commands stored in the bot\'s database.',
	usage: '/custom_list',
	examples: ['/custom_list'],
	/**
	 * Executes the custom command list interaction.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @returns {Promise<void>} - A promise that resolves when the interaction is complete.
	 * @throws {Error} - Throws an error if the interaction fails.
	 */
	async execute(interaction) {
		try {
			const customCommands = await cc.find({}).sort({ name: 1 });

			if (customCommands.length === 0) {
				await interaction.editReply('There are no custom commands.');
				return;
			}

			const commandsPerPage = 10;
			const pages = Math.ceil(customCommands.length / commandsPerPage);
			let currentPage = 0;

			const generateEmbed = page => {
				const embed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle('Custom Commands')
					.setFooter({ text: `Page ${page + 1} of ${pages}` })
					.setTimestamp();

				const start = page * commandsPerPage;
				const end = start + commandsPerPage;
				const pageCommands = customCommands.slice(start, end);

				const commandList = pageCommands
					.map(cmd => {
						const alias = cmd.alias_name
							? ` (alias: ${cmd.alias_name})`
							: '';
						return `**${cmd.name}**${alias}`;
					})
					.join('\n');

				embed.setDescription(commandList);

				return embed;
			};

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('previous')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('next')
					.setLabel('Next')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(pages === 1),
			);

			const initialMessage = await interaction.editReply({
				embeds: [generateEmbed(0)],
				components: [row],
				fetchReply: true,
			});

			const collector = initialMessage.createMessageComponentCollector({
				time: 60000,
			});

			collector.on('collect', async i => {
				if (i.user.id === interaction.user.id) {
					if (i.customId === 'previous') {
						currentPage = Math.max(0, currentPage - 1);
					}
					else if (i.customId === 'next') {
						currentPage = Math.min(pages - 1, currentPage + 1);
					}

					row.components[0].setDisabled(currentPage === 0);
					row.components[1].setDisabled(currentPage === pages - 1);

					await i.update({
						embeds: [generateEmbed(currentPage)],
						components: [row],
					});
				}
				else {
					i.editReply({
						content: 'You cannot use these buttons.',
						ephemeral: true,
					});
				}
			});

			collector.on('end', () => {
				row.components.forEach(button => button.setDisabled(true));
				initialMessage.edit({ components: [row] });
			});
		}
		catch (error) {
			handleError(interaction, error);
		}
	},
};
