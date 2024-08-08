const { SlashCommandBuilder } = require('@discordjs/builders');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder().setName('koifish').setDescription('Fish'),
	category: 'fun',
	async execute(interaction) {
		try {
			const response = await fetch(
				`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=koifish&limit=10`
			);
			const data = await response.json();

			if (data.data && data.data.length > 0) {
				const randomIndex = Math.floor(Math.random() * data.data.length);
				const koifishGif = data.data[randomIndex].images.original.url;
				await interaction.reply(`***Enjoy a koi fish GIF!***\n${koifishGif}`);
			} else {
				await interaction.reply('Sorry, I could not find a koi fish GIF.');
			}
		} catch (error) {
			console.error('Error fetching koi fish GIF:', error);
			await interaction.reply('There was an error trying to fetch a koi fish GIF.');
		}
	},
};
