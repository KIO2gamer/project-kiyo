const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler');
const path = require('path');
const fs = require('fs');

module.exports = {
	description_full:
		'Reloads bot commands without restarting. Can reload a specific command or all commands.',
	usage: '/reload [command:command_name]',
	examples: [
		'/reload command:ping',
		'/reload',
	],
	category: 'admin',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads bot commands')
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('Specific command to reload')
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });

			const commandName = interaction.options.getString('command');
			const foldersPath = path.join(__dirname, '..');
			const commandFolders = fs.readdirSync(foldersPath).filter(folder => {
				return fs.statSync(path.join(foldersPath, folder)).isDirectory();
			});

			if (commandName) {
				await this.reloadSingleCommand(interaction, commandName, foldersPath, commandFolders);
			} else {
				await this.reloadAllCommands(interaction, foldersPath, commandFolders);
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while reloading commands.'
			);
		}
	},

	async reloadSingleCommand(interaction, commandName, foldersPath, commandFolders) {
		try {
			const commandPath = this.findCommandPath(commandName, foldersPath, commandFolders);

			if (!commandPath) {
				await handleError(
					interaction,
					new Error(`Command "${commandName}" not found`),
					'VALIDATION',
					`There is no command with name \`${commandName}\`!`
				);
				return;
			}

			// Clear require cache and reload command
			delete require.cache[require.resolve(commandPath)];

			try {
				interaction.client.commands.delete(commandName);
				const newCommand = require(commandPath);

				// Validate command structure
				if (!newCommand.data || !newCommand.execute) {
					throw new Error('Invalid command structure');
				}

				interaction.client.commands.set(newCommand.data.name, newCommand);

				const successEmbed = new EmbedBuilder()
					.setTitle('Command Reloaded')
					.setDescription(`Successfully reloaded command \`${commandName}\``)
					.setColor('Green')
					.setTimestamp();

				await interaction.editReply({ embeds: [successEmbed] });
			} catch (error) {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					`Failed to reload command \`${commandName}\`: ${error.message}`
				);
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while reloading the command.'
			);
		}
	},

	findCommandPath(commandName, foldersPath, commandFolders) {
		for (const folder of commandFolders) {
			const folderPath = path.join(foldersPath, folder);
			const commandFiles = fs.readdirSync(folderPath)
				.filter(file => file.endsWith('.js'));

			for (const file of commandFiles) {
				try {
					const filePath = path.join(folderPath, file);
					const command = require(filePath);

					if (command.data && command.data.name === commandName) {
						return filePath;
					}
				} catch (error) {
					console.error(`Error loading command file ${file}:`, error);
				}
			}
		}
		return null;
	},

	async reloadAllCommands(interaction, foldersPath, commandFolders) {
		try {
			let reloadedCount = 0;
			let errorCount = 0;
			const errors = [];

			for (const folder of commandFolders) {
				const folderPath = path.join(foldersPath, folder);
				const commandFiles = fs.readdirSync(folderPath)
					.filter(file => file.endsWith('.js'));

				for (const file of commandFiles) {
					try {
						const filePath = path.join(folderPath, file);
						delete require.cache[require.resolve(filePath)];

						const command = require(filePath);
						if (command.data && command.execute) {
							interaction.client.commands.set(command.data.name, command);
							reloadedCount++;
						} else {
							errorCount++;
							errors.push(`${file}: Missing required "data" or "execute" property`);
						}
					} catch (error) {
						errorCount++;
						errors.push(`${file}: ${error.message}`);
					}
				}
			}

			const statusEmbed = new EmbedBuilder()
				.setTitle('Commands Reload Status')
				.setDescription(`Successfully reloaded ${reloadedCount} commands.`)
				.setColor(errorCount > 0 ? 'Yellow' : 'Green')
				.setTimestamp();

			if (errorCount > 0) {
				statusEmbed.addFields({
					name: '⚠️ Errors',
					value: `Failed to reload ${errorCount} commands:\n${errors.map(e => `• ${e}`).join('\n')}`
				});
			}

			await interaction.editReply({ embeds: [statusEmbed] });
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while reloading all commands.'
			);
		}
	},
};
