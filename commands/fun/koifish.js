const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('koifish')
        .setDescription('Fish'),
    category: 'fun',
    async execute(interaction) {
        try {
            const response = await fetch(`https://tenor.googleapis.com/v2/search?q=koifish&key=${process.env.TENOR_API_KEY}&limit=10`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                const koifishGif = data.results[randomIndex].url;
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
