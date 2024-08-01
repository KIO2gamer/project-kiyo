const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skibidi')
		.setDescription('Gives you skibidi powers')
		.addStringOption(option =>
			option
				.setName('option')
				.setDescription('Did you watch Skibidi Toilet?')
				.addChoices(
					{ name: 'Yes', value: 'yes' },
					{ name: 'No', value: 'no' }
				)
				.setRequired(true)
		),
	category: 'fun',
	async execute(interaction) {
		const option = interaction.options.getString('option');
		if (option === 'yes') {
			const embed = new EmbedBuilder()
				.setDescription('## Skibidi powers activated successfully ✅')
				.setImage('https://tenor.com/view/eeeeeehmazin-ehmazing-amazing-gif-1173311831093611344')
				.setColor('#00FF00'); // Optional: Add a color to the embed
			await interaction.reply({ embeds: [embed] });
		} else {
			await interaction.reply('***You are not worthy enough to wield the powers, mortal***');
		}
	},
};
