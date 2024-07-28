const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rickroll')
        .setDescription('Rickroll someone'),
    category: 'fun',
    async execute(interaction) {
        try {
            const response = await fetch(`https://tenor.googleapis.com/v2/search?q=rickroll&key=${process.env.TENOR_API_KEY}&limit=10`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                const rickrollGif = data.results[randomIndex].url;
                await interaction.reply(`***You've been rickrolled!***\n${rickrollGif}`);
            } else {
                await interaction.reply('Sorry, I could not find a rickroll GIF.');
            }
        } catch (error) {
            console.error('Error fetching rickroll GIF:', error);
            await interaction.reply('There was an error trying to fetch a rickroll GIF.');
        }
    },
};
