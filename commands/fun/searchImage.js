const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('photo')
		.setDescription('Search for a photo.')
		.addStringOption(option =>
			option.setName('query').setDescription('The search query').setRequired(true)
		),
	category: 'fun',
	async execute(interaction) {
		const query = interaction.options.getString('query');
		const apiKey = process.env.PEXELS_API_KEY;
		const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;

		// Defer the reply to give more time for processing
		await interaction.deferReply();

		try {
			const response = await fetch(url, {
				headers: {
					Authorization: apiKey,
				},
			});
			const data = await response.json();

			if (data.photos && data.photos.length > 0) {
				const photo = data.photos[0];
				const embed = new EmbedBuilder()
					.setTitle(`Photo result for "${query}"`)
					.setImage(photo.src.original)
					.setURL(photo.url)
					.setFooter({ text: `Photo by ${photo.photographer} on Pexels` });

				await interaction.editReply({ embeds: [embed] });
			} else {
				await interaction.editReply('Sorry, I could not find any photos for that query.');
			}
		} catch (error) {
			console.error('Error fetching photo:', error);
			await interaction.editReply('There was an error trying to fetch the photo.');
		}
	},
};
