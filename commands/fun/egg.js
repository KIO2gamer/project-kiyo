const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();


module.exports = {
	data: new SlashCommandBuilder().setName('egg').setDescription('send egg image'),
	category: 'fun',
	async execute(interaction) {
		try {
            const response = await fetch(`https://api.unsplash.com/photos/random?query=interesting%20egg&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
            const data = await response.json();
            if (data && data.urls && data.urls.regular) {
                await interaction.reply(data.urls.regular);
            } else {
                await interaction.reply('Sorry, I couldn\'t find any egg images.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the image.');
        }
	},
};