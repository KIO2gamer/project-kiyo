const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('boba')
		.setDescription('Send a pic of boba because it is the best.'),
	category: 'fun',
	async execute(interaction) {
		// Defer the reply to give more time for processing
		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://tenor.googleapis.com/v2/search?q=boba&key=${process.env.TENOR_API_KEY}&limit=10`
			);
			const data = await response.json();

			if (data.results && data.results.length > 0) {
				const randomIndex = Math.floor(Math.random() * data.results.length);
				const bobaGif = data.results[randomIndex].media_formats.gif.url; // Adjust as necessary for the correct URL

				const embed = new EmbedBuilder().setTitle('Enjoy your Boba GIF!').setImage(bobaGif);

				await interaction.editReply({ embeds: [embed] });
			} else {
				await interaction.editReply('Sorry, I could not find a Boba GIF.');
			}
		} catch (error) {
			console.error('Error fetching Boba GIF:', error);
			await interaction.editReply('There was an error trying to fetch a Boba GIF.');
		}
	},
};
