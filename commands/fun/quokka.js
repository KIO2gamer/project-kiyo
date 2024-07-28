const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quokka')
        .setDescription('Send a pic of a quokka because it is cute.'),
    category: 'fun',
    async execute(interaction) {
        try {
            const response = await fetch(`https://tenor.googleapis.com/v2/search?q=quokka&key=${process.env.TENOR_API_KEY}&limit=10`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                const quokkaGif = data.results[randomIndex].url;
                await interaction.reply(`***You have been blessed by the powers of a quokka***\n${quokkaGif}`);
            } else {
                await interaction.reply('Sorry, I could not find a quokka GIF.');
            }
        } catch (error) {
            console.error('Error fetching quokka GIF:', error);
            await interaction.reply('There was an error trying to fetch a quokka GIF.');
        }
    },
};
