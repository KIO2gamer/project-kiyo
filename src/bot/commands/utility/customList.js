const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const cc = require('./../../../database/customCommands');
const { handleError } = require('./../../utils/errorHandler');

const { MessageFlags } = require('discord.js');

const COMMANDS_PER_PAGE = 10;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_list')
		.setDescription('Lists all custom commands')
		.addStringOption((option) =>
			option
				.setName('search')
				.setDescription('Search for a specific command')
				.setRequired(false),
		),
	category: 'utility',
	description_full: "Lists all custom commands stored in the bot's database.",
	usage: '/custom_list [search:search_term]',
	examples: [
		'/custom_list',
		'/custom_list search:greet',
	],
	/**
	 * Executes the custom command list interaction.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @returns {Promise<void>} - A promise that resolves when the interaction is complete.
	 * @throws {Error} - Throws an error if the interaction fails.
	 */
	async execute(interaction) {
		try {
			await interaction.deferReply();
			const searchTerm = interaction.options.getString('search')?.toLowerCase();

			// Build query
			const query = searchTerm
				? {
					$or: [
						{ name: { $regex: searchTerm, $options: 'i' } },
						{ alias_name: { $regex: searchTerm, $options: 'i' } },
						{ message: { $regex: searchTerm, $options: 'i' } },
					],
				}
				: {};

			// Fetch commands
			const commands = await cc.find(query).sort({ name: 1 });

			if (commands.length === 0) {
				const noResultsEmbed = new EmbedBuilder()
					.setTitle('Custom Commands')
					.setDescription(searchTerm
						? `No commands found matching "${searchTerm}"`
						: 'No custom commands have been created yet.')
					.setColor('#FF0000')
					.setTimestamp();

				await interaction.editReply({ embeds: [noResultsEmbed] });
				return;
			}

			// Calculate total pages
			const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);
			let currentPage = 0;

			// Function to generate embed for a specific page
			const generateEmbed = (page) => {
				const start = page * COMMANDS_PER_PAGE;
				const end = Math.min(start + COMMANDS_PER_PAGE, commands.length);
				const pageCommands = commands.slice(start, end);

				const embed = new EmbedBuilder()
					.setTitle('Custom Commands')
					.setColor('#0099ff')
					.setFooter({
						text: `Page ${page + 1}/${totalPages} • Total commands: ${commands.length}`,
					})
					.setTimestamp();

				if (searchTerm) {
					embed.setDescription(`Search results for "${searchTerm}"`);
				}

				const commandList = pageCommands.map((cmd) => {
					const aliasText = cmd.alias_name ? ` (alias: ${cmd.alias_name})` : '';
					const messagePreview = cmd.message.length > 50
						? cmd.message.substring(0, 47) + '...'
						: cmd.message;
					return `• **${cmd.name}**${aliasText}\n  └ ${messagePreview}`;
				}).join('\n\n');

				embed.addFields({ name: 'Commands', value: commandList || 'No commands found.' });

				return embed;
			};

			// Create navigation buttons
			const getNavigationRow = (currentPage) => {
				const row = new ActionRowBuilder();

				row.addComponents(
					new ButtonBuilder()
						.setCustomId('first')
						.setLabel('⏪ First')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === 0),
					new ButtonBuilder()
						.setCustomId('prev')
						.setLabel('◀️ Previous')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === 0),
					new ButtonBuilder()
						.setCustomId('next')
						.setLabel('Next ▶️')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === totalPages - 1),
					new ButtonBuilder()
						.setCustomId('last')
						.setLabel('Last ⏩')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === totalPages - 1)
				);

				return row;
			};

			// Send initial message
			const message = await interaction.editReply({
				embeds: [generateEmbed(currentPage)],
				components: totalPages > 1 ? [getNavigationRow(currentPage)] : [],
			});

			if (totalPages > 1) {
				// Create collector for button interactions
				const collector = message.createMessageComponentCollector({
					filter: (i) => i.user.id === interaction.user.id,
					time: 300000, // 5 minutes
				});

				collector.on('collect', async (i) => {
					try {
						switch (i.customId) {
							case 'first':
								currentPage = 0;
								break;
							case 'prev':
								currentPage = Math.max(0, currentPage - 1);
								break;
							case 'next':
								currentPage = Math.min(totalPages - 1, currentPage + 1);
								break;
							case 'last':
								currentPage = totalPages - 1;
								break;
						}

						await i.update({
							embeds: [generateEmbed(currentPage)],
							components: [getNavigationRow(currentPage)],
						});
					} catch (error) {
						await handleError(
							interaction,
							error,
							'COMMAND_EXECUTION',
							'Failed to update the command list.'
						);
					}
				});

				collector.on('end', async () => {
					try {
						const finalEmbed = generateEmbed(currentPage);
						finalEmbed.setFooter({
							text: `Page ${currentPage + 1}/${totalPages} • Total commands: ${commands.length} • Navigation expired`,
						});

						await message.edit({
							embeds: [finalEmbed],
							components: [],
						});
					} catch (error) {
						console.error('Error removing buttons:', error);
					}
				});
			}
		} catch (error) {
			if (error.name === 'MongoError' || error.name === 'MongooseError') {
				await handleError(
					interaction,
					error,
					'DATABASE',
					'Failed to fetch custom commands from the database.'
				);
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An error occurred while listing custom commands.'
				);
			}
		}
	},
};
