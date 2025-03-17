const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const CustomCommand = require('../../../database/customCommands');
const { handleError } = require('../../utils/errorHandler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_add')
		.setDescription('Adds a custom command')
		.addStringOption(option =>
			option.setName('name').setDescription('The main name of the command').setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('The response message of the command')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('alias_name')
				.setDescription('The alternate name of the command')
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	description_full: 'Add a custom command to the server.',
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
		try {
			const name = interaction.options.getString('name');
			const message = interaction.options.getString('message');
			const alias_name = interaction.options.getString('alias_name');

			// Validate command name
			if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
				await handleError(
					interaction,
					new Error('Invalid command name format'),
					'VALIDATION',
					'Command name can only contain letters, numbers, underscores, and hyphens.',
				);
				return;
			}

			if (name.length < 2 || name.length > 32) {
				await handleError(
					interaction,
					new Error('Invalid command name length'),
					'VALIDATION',
					'Command name must be between 2 and 32 characters long.',
				);
				return;
			}

			// Validate message content
			if (message.length < 1 || message.length > 2000) {
				await handleError(
					interaction,
					new Error('Invalid message length'),
					'VALIDATION',
					'Message must be between 1 and 2000 characters long.',
				);
				return;
			}

			// Validate alias if provided
			if (alias_name) {
				if (!/^[a-zA-Z0-9_-]+$/.test(alias_name)) {
					await handleError(
						interaction,
						new Error('Invalid alias format'),
						'VALIDATION',
						'Alias can only contain letters, numbers, underscores, and hyphens.',
					);
					return;
				}

				if (alias_name.length < 2 || alias_name.length > 32) {
					await handleError(
						interaction,
						new Error('Invalid alias length'),
						'VALIDATION',
						'Alias must be between 2 and 32 characters long.',
					);
					return;
				}
			}

			// Check if command name already exists
			const existingCommand = await CustomCommand.findOne({
				$or: [{ name: name.toLowerCase() }, { alias_name: name.toLowerCase() }],
			});

			if (existingCommand) {
				await handleError(
					interaction,
					new Error('Command already exists'),
					'VALIDATION',
					`A command or alias with the name "${name}" already exists.`,
				);
				return;
			}

			// Check if alias already exists
			if (alias_name) {
				const existingAlias = await CustomCommand.findOne({
					$or: [
						{ name: alias_name.toLowerCase() },
						{ alias_name: alias_name.toLowerCase() },
					],
				});

				if (existingAlias) {
					await handleError(
						interaction,
						new Error('Alias already exists'),
						'VALIDATION',
						`A command or alias with the name "${alias_name}" already exists.`,
					);
					return;
				}
			}

			// Create and save the custom command
			const customCommand = new CustomCommand({
				name: name.toLowerCase(),
				message,
				...(alias_name && { alias_name: alias_name.toLowerCase() }),
			});

			await customCommand.save();

			await interaction.reply({
				content: `Custom command "${name}" added successfully!${alias_name ? ` Alias: ${alias_name}` : ''}`,
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			if (error.code === 11000) {
				await handleError(
					interaction,
					error,
					'DATABASE',
					'A command with this name or alias already exists.',
				);
			} else if (error.name === 'ValidationError') {
				await handleError(
					interaction,
					error,
					'VALIDATION',
					'Invalid command data provided.',
				);
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An error occurred while creating the custom command.',
				);
			}
		}
	},
};
