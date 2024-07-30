const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('quokka')
		.setDescription('Send a pic of a quokka because it is cute.'),
	category: 'fun',
	async execute(interaction) {
		// Defer the reply to give more time for processing
		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://tenor.googleapis.com/v2/search?q=quokka&key=${process.env.TENOR_API_KEY}&limit=10`
			);
			const data = await response.json();

			if (data.results && data.results.length > 0) {
				const randomIndex = Math.floor(Math.random() * data.results.length);
				const quokkaGif = data.results[randomIndex].media_formats.gif.url; // Adjust as necessary for the correct URL

				const embed = new EmbedBuilder()
					.setTitle('You have been blessed by the powers of a quokka!')
					.setImage(quokkaGif);

				await interaction.editReply({ embeds: [embed] });
			} else {
				await interaction.editReply('Sorry, I could not find a quokka GIF.');
			}
		} catch (error) {
			console.error('Error fetching quokka GIF:', error);
			await interaction.editReply('There was an error trying to fetch a quokka GIF.');
		}
	},
};
