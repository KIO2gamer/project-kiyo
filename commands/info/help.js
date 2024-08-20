const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all available commands or get help for a specific command.')
		.addStringOption(option =>
			option.setName('command').setDescription('The command to get help for.')
		),
	async execute(interaction) {
		
	},
};
