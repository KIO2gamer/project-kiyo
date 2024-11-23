const { Events } = require('discord.js');

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

		const command = interaction.client.commands.get(
			interaction.commandName,
		);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`,
			);
			return;
		}

		try {
			if (interaction.commandName === 'get_yt_sub_role') {
				await command.execute(interaction);
				return;
			}
			// Defer reply to ensure response time is handled within the 3-second window
			await interaction.deferReply();

			// Execute the command
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);

			// Send a failure message if something goes wrong
			try {
				await interaction.editReply({
					content: 'There was an error executing this command!',
					ephemeral: true,
				});
			} catch (editError) {
				console.error('Failed to edit reply: ', editError);
			}
		}
	},
};
