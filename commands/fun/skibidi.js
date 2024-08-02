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
				.setRequired(true)
				.addChoices(
					{ name: 'Yes', value: 'yes' },
					{ name: 'No', value: 'no' }
				)
		),
	category: 'fun',
	async execute(interaction) {
		const option = interaction.options.getString('option');

		if (option === 'yes') {
			await interaction.deferReply();
			try {
				const response = await fetch(
					`https://tenor.googleapis.com/v2/search?q=nickeh30ehmazing&key=${process.env.TENOR_API_KEY}&limit=1`
				);
				const data = await response.json();
				const url = data.results[0].url;

				const embed = new EmbedBuilder()
					.setDescription('## Skibidi powers activated successfully ✅')
					.setImage(url)
					.setColor('#00FF00'); // Optional: Add a color to the embed

				await interaction.editReply({ embeds: [embed] });
			} catch (error) {
				console.error('Error fetching GIF:', error);
				await interaction.editReply('***Failed to fetch Skibidi powers GIF. Please try again later.***');
			}
		} else {
			await interaction.editReply('***You are not worthy enough to wield the powers, mortal***');
		}
	},
};
