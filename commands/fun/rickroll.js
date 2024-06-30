const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rickroll')
		.setDescription('Sends a rickroll gif'),
	category: 'fun',
	async execute(interaction) {
		await interaction.reply(
			'https://tenor.com/view/rickroll-roll-rick-never-gonna-give-you-up-never-gonna-gif-22954713'
		);
	},
};
