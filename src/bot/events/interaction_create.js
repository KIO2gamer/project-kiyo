const { Events } = require('discord.js');
const { handleError } = require('./../utils/errorHandler');

module.exports = {
	name: Events.InteractionCreate,
	/**
	 * Executes the interaction command.
	 *
	 * @param {Object} interaction - The interaction object.
	 * @param {Function} interaction.isCommand - Checks if the interaction is a command.
	 * @param {Object} interaction.client - The client object.
	 * @param {Map} interaction.client.commands - The collection of commands.
	 * @param {string} interaction.commandName - The name of the command.
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 * @throws Will throw an error if the command execution fails.
	 */
	async execute(interaction) {
		if (!interaction.isCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			// Special handling for 'get_yt_sub_role' command
			if (interaction.commandName === 'get_yt_sub_role' || interaction.commandName === 'bot_info') {
				await command.execute(interaction);
				return;
			}

			// Defer reply to ensure response time is handled within the 3-second window
			await interaction.deferReply();

			// Execute the command
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			await handleError(interaction, error);
		}
	},
};

/**
 * Handles command execution errors by sending an error message to the user.
 *
 * @param {Object} interaction - The interaction object.
 * @returns {Promise<void>} - A promise that resolves when the error message is sent.
 */
async function handleCommandError(interaction) {
	try {
		await interaction.editReply({
			content: 'There was an error executing this command!',
			ephemeral: true,
		});
	} catch (editError) {
		console.error('Failed to edit reply: ', editError);
	}
}