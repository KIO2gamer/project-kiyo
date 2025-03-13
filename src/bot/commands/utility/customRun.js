const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('./../../../database/customCommands');
const { handleError } = require('./../../utils/errorHandler');

const { MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom_run')
		.setDescription('Run a custom command')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The name or alias of the custom command to run')
				.setRequired(true),
		),
	category: 'utility',
	description_full: "Runs a specified custom command stored in the bot's database.",
	usage: '/custom_run <name_or_alias>',
	examples: ['/custom_run greet', '/custom_run hello'],

	async execute(interaction) {
		try {
			const commandNameOrAlias = interaction.options.getString('name')?.toLowerCase();

			if (!commandNameOrAlias) {
				await handleError(
					interaction,
					new Error('No command name provided'),
					'VALIDATION',
					'Please provide a command name to run.',
				);
				return;
			}

			// Find command by name or alias
			let customCommand = await cc.findOne({ name: commandNameOrAlias });

			if (!customCommand) {
				customCommand = await cc.findOne({ alias_name: commandNameOrAlias });
			}

			if (!customCommand) {
				await handleError(
					interaction,
					new Error('Command not found'),
					'VALIDATION',
					`Custom command or alias "${commandNameOrAlias}" not found.`,
				);
				return;
			}

			// Check message length and content
			if (!customCommand.message || customCommand.message.trim().length === 0) {
				await handleError(
					interaction,
					new Error('Invalid command message'),
					'VALIDATION',
					'This command has no message content.',
				);
				return;
			}

			// Check if message contains any disallowed content
			if (
				customCommand.message.includes('@everyone') ||
				customCommand.message.includes('@here')
			) {
				await handleError(
					interaction,
					new Error('Disallowed mentions'),
					'VALIDATION',
					'This command contains disallowed mentions.',
				);
				return;
			}

			try {
				// Execute the command
				await interaction.reply({
					content: customCommand.message,
					allowedMentions: { parse: ['users', 'roles'] },
				});

				// Log command usage (optional)
				console.log(
					`Custom command "${customCommand.name}" executed by ${interaction.user.tag}`,
				);
			} catch (error) {
				if (error.code === 50006) {
					await handleError(
						interaction,
						error,
						'VALIDATION',
						'Cannot send an empty message.',
					);
				} else if (error.code === 50035) {
					await handleError(
						interaction,
						error,
						'VALIDATION',
						'Message content is invalid.',
					);
				} else {
					await handleError(
						interaction,
						error,
						'COMMAND_EXECUTION',
						'Failed to execute the custom command.',
					);
				}
			}
		} catch (error) {
			if (error.name === 'MongoError' || error.name === 'MongooseError') {
				await handleError(
					interaction,
					error,
					'DATABASE',
					'Failed to fetch the custom command from the database.',
				);
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An error occurred while running the custom command.',
				);
			}
		}
	},
};
