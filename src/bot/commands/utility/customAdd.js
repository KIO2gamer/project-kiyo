const { SlashCommandBuilder } = require('discord.js');
const CustomCommand = require('./../../../database/customCommands');
const { handleError } = require('./../../utils/errorHandler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_add')
		.setDescription('Adds a custom command')
		.addStringOption((option) =>
			option
				.setName('name')
				.setDescription('The main name of the command')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('The response message of the command')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('alias_name')
				.setDescription('The alternate name of the command')
				.setRequired(false),
		),
	description_full:
		'Add a custom command to the server.',
	usage: '/custom_add [name] [message] [alias]',
	examples: [
		'/custom_add name:hello message:Hello World!',
		'/custom_add name:greet message:Hi there! alias:hi',
	],
	category: 'utility',
	/**
	 * Executes the custom command addition process.
	 *
	 * @param {Object} interaction - The interaction object from the Discord API.
	 * @param {Object} interaction.options - The options provided with the interaction.
	 * @param {Function} interaction.options.getString - Function to get a string option by name.
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 */
	async execute(interaction) {
		const name = interaction.options.getString('name');
		const message = interaction.options.getString('message');
		const alias_name = interaction.options.getString('alias_name');

		try {
			const customCommand = new CustomCommand({
				name,
				message,
				...(alias_name && { alias_name }),
			});

			await customCommand.save();

			await interaction.reply({
				content: `Custom command "${name}" added successfully!`,
				ephemeral: true,
			});
		} catch (error) {
			handleError(interaction, error);
		}
	},
};
