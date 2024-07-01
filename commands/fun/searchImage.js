const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder().setName('searchimage').setDescription('sends a image').addStringOption(option => option.setName('query').setDescription('search query').setRequired(true)),
	category: 'fun',
	async execute(interaction) {
        const query = interaction.options.getString('query');
		try {
            const response = await fetch(`https://api.unsplash.com/photos/random?query=${query.replace(/ /g, '%20')}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
            const data = await response.json();
            if (data && data.urls && data.urls.regular) {
                await interaction.reply(data.urls.regular);
            } else {
                await interaction.reply('Sorry, I couldn\'t find any images.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the image.');
        }
	},
};