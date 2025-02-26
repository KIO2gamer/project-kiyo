const { Events } = require('discord.js');
const { handleError } = require('./../utils/errorHandler');

module.exports = {
	name: Events.InteractionCreate,
	/**
	 * Executes the interaction command.
	 *
	 * @param {Object} interaction - The interaction object.
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 */
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const { client, commandName } = interaction;
		const command = client.commands.get(commandName);

		if (!command) {
			handleError(`No command matching ${commandName} was found.`);
			return;
		}

		try {
			// Execute the command
			await command.execute(interaction);
		} catch (error) {
			handleError(`Error executing ${commandName}:`, error);
			await handleError(interaction);
		}
	},
};
