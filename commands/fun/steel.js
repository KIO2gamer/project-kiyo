const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    usage: ,
    examples: ,
	data: new SlashCommandBuilder().setName('steel').setDescription('steel'),

	async execute(interaction) {
		await interaction.reply('Guess wat? you just got steeled.\n*metal pipe drop sound*');
	},
};
