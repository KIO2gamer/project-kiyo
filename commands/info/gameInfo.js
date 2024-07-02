const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Fetches game information')
        .addStringOption(option => option
            .setName('search')
            .setDescription('Name of the game')
            .setRequired(true)),
    category: 'info',
    async execute(interaction) {
        const gameName = interaction.options.getString('search');
        if (gameName) {
            try {
                interaction.deferReply();

                const searchResponse = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`);
                const searchData = await searchResponse.json();

                if (!searchData.items || searchData.items.length === 0) {
                    await interaction.reply('Could not find the game.');
                    return;
                }

                const game = searchData.items[0];
                const appId = game.id;

                const detailsResponse = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appId}`);
                const gameDetails = await detailsResponse.json();

                const response = await fetch(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(game.name)}`);
                const data = await response.json();

                const gameDetailsResponse = await fetch(`https://api.rawg.io/api/games/${data.results[0].id}?key=${process.env.RAWG_API_KEY}`);
                const moreGameDetails = await gameDetailsResponse.json();

                const embed = new EmbedBuilder()
                    .setTitle(gameDetails.name)
                    .setDescription(moreGameDetails.description_raw || 'No description available')
                    .addFields(
                        { name: 'Developer', value: gameDetails.developer || 'Unknown', inline: true },
                        { name: 'Publisher', value: gameDetails.publisher || 'Unknown', inline: true },
                        { name: 'Release Date', value: (data.results[0]).released || 'Unknown', inline: true },
                        { name: 'Positive Reviews', value: gameDetails.positive.toString(), inline: true },
                        { name: 'Negative Reviews', value: gameDetails.negative.toString(), inline: true },
                        { name: 'Owners', value: gameDetails.owners, inline: true },
                        { name: 'Genres', value: gameDetails.genre ? gameDetails.genre.split(',').join(', ') : 'Unknown', inline: true }
                    )
                    .setURL(`https://store.steampowered.com/app/${appId}`)
                    .setImage(`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`)
                    .setColor(0x00AE86);

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await interaction.editReply('An error occurred while fetching the game information. Please try again later.');
            }
        }
    },
};
