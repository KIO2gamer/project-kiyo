const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs')
const path = require('path')

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

		const foldersPath = require('path').join(__dirname, '..');
		const commandFolders = fs.readdirSync(foldersPath);

		for (const folder of commandFolders) {
			const commandsPath = path.join(foldersPath, folder);
			
			try {
				delete require.cache[require.resolve(`${commandsPath}\\${command.data.name}.js`)];

				const newCommand = require(`${commandsPath}\\${command.data.name}.js`);
				interaction.client.commands.set(newCommand.data.name, newCommand);
				await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
			} catch (error) {
				if (error.code == 'MODULE_NOT_FOUND') {
					continue;
				} else {
					console.error(error)
					await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
				}
			}
		}
	},
};