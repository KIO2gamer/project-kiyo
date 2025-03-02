const { SlashCommandBuilder } = require('discord.js');
const cc = require('../../../database/customCommands');
const { handleError } = require('../../utils/errorHandler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_run')
		.setDescription('Run a custom command')
		.addStringOption((option) =>
			option
				.setName('name')
				.setDescription(
					'The name or alias of the custom command to run',
				)
				.setRequired(true),
		),
	category: 'customs',
	description_full:
		"Runs a specified custom command stored in the bot's database.",
	usage: '/custom_run <name_or_alias>',
	examples: ['/custom_run greet', '/custom_run hello'],
	/**
	 * Executes a custom command based on the provided interaction.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @param {Object} interaction.options - The options provided with the interaction.
	 * @param {Function} interaction.options.getString - Function to get a string option by name.
	 * @param {Function} interaction.reply - Function to edit the reply to the interaction.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 *
	 * @throws Will call handleError function if an error occurs during execution.
	 */
	async execute(interaction) {
		try {
			const commandNameOrAlias = interaction.options.getString('name');
			let customCommand = await cc.findOne({ name: commandNameOrAlias });

			if (!customCommand) {
				customCommand = await cc.findOne({
					alias_name: commandNameOrAlias,
				});
			}

			if (!customCommand) {
				await interaction.reply({
					content: `Custom command or alias "${commandNameOrAlias}" not found.`,
					ephemeral: true,
				});
				return;
			}

			await interaction.reply({
				content: customCommand.message,
				ephemeral: false,
			});
		} catch (error) {
			handleError(interaction, error);
		}
	},
};
