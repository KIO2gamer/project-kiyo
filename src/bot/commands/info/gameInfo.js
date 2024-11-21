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
    const gameName = interaction.options.getString('search');
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    try {
      const accessToken = await this.getAccessToken(clientId, clientSecret);
      const gameSlug = await this.searchGame(gameName, clientId, accessToken);

      if (gameSlug) {
        const game = await this.fetchGameDetails(
          gameSlug,
          clientId,
          accessToken,
        );
        const embed = this.createGameEmbed(game, interaction.user);
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('Game not found.');
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply('Error fetching game info.');
    }
  },

  async getAccessToken(clientId, clientSecret) {
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
    return tokenResponse.data.access_token;
  },

  async searchGame(gameName, clientId, accessToken) {
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
    return searchResponse.data.length > 0 ? searchResponse.data[0].slug : null;
  },

  async fetchGameDetails(gameSlug, clientId, accessToken) {
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
    return gameResponse.data[0];
  },

  createGameEmbed(game, user) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(game.name)
      .setDescription(game.summary || 'No description available')
      .addFields(
        {
          name: 'Genres',
          value: game.genres?.map((g) => g.name).join(', ') || 'N/A',
          inline: true,
        },
        {
          name: 'Release Date',
          value: game.first_release_date
            ? new Date(game.first_release_date * 1000).toLocaleDateString()
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
          value: game.platforms?.map((p) => p.name).join(', ') || 'N/A',
          inline: true,
        },
        {
          name: 'IGDB',
          value: `[Link](${game.url})`,
          inline: true,
        },
      )
      .setFooter({
        text: `Requested by ${user.tag}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();
  },
};
