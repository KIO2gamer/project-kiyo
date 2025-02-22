const { SlashCommandBuilder } = require('discord.js');
const cc = require('./../../../database/customCommands');
const { handleError } = require('./../../utils/errorHandler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_delete')
		.setDescription('Deletes an existing custom command')
		.addStringOption((option) =>
			option
				.setName('name')
				.setDescription('The name or alias of the command to delete')
				.setRequired(true),
		),
	category: 'customs',
	description_full:
		"Deletes an existing custom command from the bot's database.",
	usage: '/custom_delete <name:command_name_or_alias>',
	examples: ['/custom_delete name:hello', '/custom_delete name:greet'],
	/**
	 * Executes the custom command deletion process.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @param {Object} interaction.options - The options provided with the interaction.
	 * @param {Function} interaction.options.getString - Function to get a string option by name.
	 * @param {Function} interaction.reply - Function to edit the reply to the interaction.
	 * @param {Function} interaction.awaitMessageComponent - Function to await a message component interaction.
	 * @param {Object} interaction.user - The user who initiated the interaction.
	 * @param {string} interaction.user.id - The ID of the user who initiated the interaction.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 */
	async execute(interaction) {
		try {
			const commandNameOrAlias = interaction.options.getString('name');
			let cc_record = await cc.findOne({ name: commandNameOrAlias });

			if (!cc_record) {
				cc_record = await cc.findOne({
					alias_name: commandNameOrAlias,
				});
			}

			if (!cc_record) {
				await interaction.reply({
					content: `Custom command or alias "${commandNameOrAlias}" not found!`,
					ephemeral: true,
				});
				return;
			}

			const isAlias = cc_record.name !== commandNameOrAlias;
			const alias_name = isAlias ? commandNameOrAlias : null;
			const command_name = cc_record.name;
			const confirmMessage = isAlias
				? `The name you provided is an alias. The main command name is "${command_name}". Do you want to delete this command?`
				: `Are you sure you want to delete the custom command "${command_name}"?`;

			const confirmationResponse = await interaction.reply({
				content: confirmMessage,
				ephemeral: true,
				components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								style: 3,
								label: 'Yes',
								custom_id: 'delete_confirm',
							},
							{
								type: 2,
								style: 4,
								label: 'No',
								custom_id: 'delete_cancel',
							},
						],
					},
				],
			});

			const confirmation = await confirmationResponse
				.awaitMessageComponent({
					filter: (i) => i.user.id === interaction.user.id,
					time: 15000,
				})
				.catch(() => null);

			if (!confirmation) {
				await interaction.reply({
					content: 'Command deletion timed out.',
					components: [],
				});
				return;
			}

			if (confirmation.customId === 'delete_confirm') {
				await cc.deleteOne({ _id: cc_record._id });
				await interaction.reply({
					content: `Custom command "${command_name}"${alias_name ? ` (alias: ${alias_name})` : ''
						} deleted successfully!`,
					components: [],
				});
			} else {
				await interaction.reply({
					content: 'Command deletion cancelled.',
					components: [],
				});
			}
		} catch (error) {
			handleError(interaction, error);
		}
	},
};
