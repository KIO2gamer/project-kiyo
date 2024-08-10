const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandData = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Displays all available commands.');

module.exports = {
	data: commandData,
	async execute(interaction) {
		await interaction.deferReply();

		const commandsDirectory = path.join(__dirname, '..'); // Path to your "commands" folder
		const categoryFolders = fs
			.readdirSync(commandsDirectory)
			.filter(folder => fs.statSync(path.join(commandsDirectory, folder)).isDirectory());

		const embed = new EmbedBuilder().setColor('#0099ff').setTitle('Available Commands');

		for (const category of categoryFolders) {
			let categoryCommands = '';
			const commandFiles = fs
				.readdirSync(path.join(commandsDirectory, category))
				.filter(file => file.endsWith('.js'));

			for (const file of commandFiles) {
				const filePath = path.join(commandsDirectory, category, file);
				const command = require(filePath);
				categoryCommands += `\`/${command.data.name}\` - ${command.data.description}\n`;
			}

			embed.addFields({ name: `${category}`, value: categoryCommands, inline: false });
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
