const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('koifish').setDescription('fish'),
	category: 'fun',
	async execute(interaction) {
		await interaction.reply(
			'https://tenor.com/view/feesh-yeet-feesh-yeet-fish-yeet-fish-throw-gif-21734241'
		);
	},
};
