const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	description_full:
		'Reloads a specific command, or all commands if no command is specified.',
	usage: '/reload [command name]',
	examples: ['/reload', '/reload ban'],
	category: 'admin',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('The command to reload.')
				.setRequired(false),
		),
	async execute(interaction) {
		const commandName = interaction.options.getString('command');
		const foldersPath = path.join(__dirname, '..');
		const commandFolders = fs.readdirSync(foldersPath);

		if (commandName) {
			await this.reloadSingleCommand(
				interaction,
				commandName,
				foldersPath,
				commandFolders,
			);
		} else {
			await this.reloadAllCommands(
				interaction,
				foldersPath,
				commandFolders,
			);
		}
	},

	async reloadSingleCommand(
		interaction,
		commandName,
		foldersPath,
		commandFolders,
	) {
		const commandPath = this.findCommandPath(
			commandName,
			foldersPath,
			commandFolders,
		);

		if (!commandPath) {
			return interaction.reply({
				content: `There is no command with name \`${commandName}\`!`,
				ephemeral: true,
			});
		}

		delete require.cache[require.resolve(commandPath)];

		try {
			interaction.client.commands.delete(commandName);
			const newCommand = require(commandPath);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			await interaction.reply({
				content: `Command \`${commandName}\` was reloaded!`,
				ephemeral: true,
			});
		} catch (error) {
			handleError(error);
			await interaction.reply({
				content: `There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``,
				ephemeral: true,
			});
		}
	},

	findCommandPath(commandName, foldersPath, commandFolders) {
		return commandFolders
			.map((folder) => {
				const commandsPath = path.join(foldersPath, folder, 'commands');
				if (fs.existsSync(commandsPath)) {
					const commandFiles = fs
						.readdirSync(commandsPath)
						.filter((file) => file.endsWith('.js'));
					const commandFile = commandFiles.find(
						(file) => file === `${commandName}.js`,
					);
					if (commandFile) {
						return path.join(commandsPath, commandFile);
					}
				}
			})
			.find((path) => path !== undefined);
	},

	/**
	 * Reloads all commands from the specified command folders.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @param {string} foldersPath - The path to the folders containing command files.
	 * @param {Array<string>} commandFolders - An array of folder names containing command files.
	 * @returns {Promise<void>} - A promise that resolves when all commands have been reloaded and a reply has been sent.
	 */
	async reloadAllCommands(interaction, foldersPath, commandFolders) {
		commandFolders.forEach((folder) => {
			const commandsPath = path.join(foldersPath, folder, 'commands');
			if (fs.existsSync(commandsPath)) {
				const commandFiles = fs
					.readdirSync(commandsPath)
					.filter((file) => file.endsWith('.js'));
				for (const file of commandFiles) {
					const filePath = path.join(commandsPath, file);
					delete require.cache[require.resolve(filePath)];

					try {
						const command = require(filePath);
						if ('data' in command && 'execute' in command) {
							interaction.client.commands.set(
								command.data.name,
								command,
							);
						} else {
							console.log(
								`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
							);
						}
					} catch (error) {
						handleError(error);
					}
				}
			}
		});

		await interaction.reply({
			content: 'All commands reloaded!',
			ephemeral: true,
		});
	},
};
