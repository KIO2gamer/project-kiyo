const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chairhit')
		.setDescription('yeet the chair fr'),
	category: 'fun',
	async execute(interaction) {
		await interaction.reply(
			'https://tenor.com/view/chair-hit-throw-rigby-gif-17178150'
		);
	},
};
