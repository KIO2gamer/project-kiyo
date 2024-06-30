const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('steel').setDescription('steel'),
	category: 'fun',
	async execute(interaction) {
		await interaction.reply('Guess wat? you just got steeled.\n*metal pipe drop sound*');
	},
};
