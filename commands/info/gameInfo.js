const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    description_full:
        'Fetches game info from IGDB API including description, genres, release date, platforms, and IGDB link.',
    usage: '/game_info <search>',
    examples: ['/game_info The Witcher 3', '/game_info "Grand Theft Auto V"'],
    category: 'info',
    data: new SlashCommandBuilder()
        .setName('game_info')
        .setDescription('Fetches game information')
        .addStringOption((option) =>
            option
                .setName('search')
                .setDescription('Name of the game')
                .setRequired(true),
        ),

    async execute(interaction) {
        if (!interaction.isCommand()) return;

        await interaction.deferReply();

        const gameName = interaction.options.getString('search');
        const clientId = process.env.IGDB_CLIENT_ID;
        const clientSecret = process.env.IGDB_CLIENT_SECRET;

        try {
            const tokenResponse = await axios.post(
                'https://id.twitch.tv/oauth2/token',
                null,
                {
                    params: {
                        client_id: clientId,
                        client_secret: clientSecret,
                        grant_type: 'client_credentials',
                    },
                },
            );

            const accessToken = tokenResponse.data.access_token;

            const searchResponse = await axios.post(
                'https://api.igdb.com/v4/games',
                `search "${gameName}"; fields name, slug; limit 1;`,
                {
                    headers: {
                        'Client-ID': clientId,
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (searchResponse.data.length > 0) {
                const gameSlug = searchResponse.data[0].slug;

                const gameResponse = await axios.post(
                    'https://api.igdb.com/v4/games',
                    `fields name, summary, genres.name, first_release_date, platforms.name, rating, url; where slug = "${gameSlug}";`,
                    {
                        headers: {
                            'Client-ID': clientId,
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                );

                const game = gameResponse.data[0];

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(game.name)
                    .setDescription(game.summary || 'No description available')
                    .addFields(
                        {
                            name: 'Genres',
                            value:
                                game.genres?.map((g) => g.name).join(', ') ||
                                'N/A',
                            inline: true,
                        },
                        {
                            name: 'Release Date',
                            value: game.first_release_date
                                ? new Date(
                                      game.first_release_date * 1000,
                                  ).toLocaleDateString()
                                : 'Unknown',
                            inline: true,
                        },
                        {
                            name: 'Rating',
                            value: game.rating ? game.rating.toFixed(2) : 'N/A',
                            inline: true,
                        },
                        {
                            name: 'Platforms',
                            value:
                                game.platforms?.map((p) => p.name).join(', ') ||
                                'N/A',
                            inline: true,
                        },
                        {
                            name: 'IGDB',
                            value: `[Link](${game.url})`,
                            inline: true,
                        },
                    )
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({
                            dynamic: true,
                        }),
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply('Game not found.');
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('Error fetching game info.');
        }
    },
};
