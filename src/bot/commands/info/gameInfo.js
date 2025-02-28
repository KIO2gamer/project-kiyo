const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');
const { handleError } = require('../../utils/errorHandler');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('game_info')
		.setDescription('Get detailed information about a video game')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('The title of the game to search for')
				.setRequired(true)),

	async execute(interaction) {
		await interaction.deferReply();
		const gameTitle = interaction.options.getString('title');
		const clientId = process.env.IGDB_CLIENT_ID;
		if (!clientId || !process.env.IGDB_CLIENT_SECRET) {
			return interaction.editReply('API keys not configured. Please contact the bot administrator.');
		}

		// Helper: Get an access token from Twitch using your client credentials
		async function getAccessToken() {
			const params = new URLSearchParams();
			params.append('client_id', process.env.IGDB_CLIENT_ID);
			params.append('client_secret', process.env.IGDB_CLIENT_SECRET);
			params.append('grant_type', 'client_credentials');

			try {
				const response = await axios.post('https://id.twitch.tv/oauth2/token', params);
				return response.data.access_token;
			} catch (error) {
				console.error('Error fetching access token:', error);
				throw error;
			}
		}

		// Helper: Build an embed with the game details
		function createGameEmbed(gameData) {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(gameData.name)
				.setThumbnail(gameData.cover ? `https:${gameData.cover.url}` : '')
				.addFields(
					{
						name: '📅 Released',
						value: gameData.first_release_date
							? new Date(gameData.first_release_date * 1000).toLocaleDateString()
							: 'Unknown',
						inline: true
					},
					{
						name: '⭐ Rating',
						value: gameData.rating
							? `${gameData.rating.toFixed(1)}/100`
							: 'Unknown',
						inline: true
					},
					{
						name: '🎮 Platforms',
						value: gameData.platforms ? gameData.platforms.map(p => p.name).join(', ') : 'Unknown',
						inline: false
					},
					{
						name: '🏷️ Genres',
						value: gameData.genres ? gameData.genres.map(g => g.name).join(', ') : 'Unknown',
						inline: true
					}
				)
				.setFooter({ text: 'Data provided by IGDB' });

			// Only set URL if a valid one exists
			if (gameData.websites && gameData.websites.length > 0 && gameData.websites[0].url) {
				embed.setURL(gameData.websites[0].url);
			}

			if (gameData.summary) {
				const description = gameData.summary.length > 2000
					? gameData.summary.substring(0, 1997) + '...'
					: gameData.summary;
				embed.setDescription(description);
			}

			return embed;
		}

		try {
			const accessToken = await getAccessToken();

			// Increase limit to 5 for a more flexible search
			const query = `
				search "${gameTitle}";
				fields name, summary, first_release_date, rating, platforms.name, genres.name, cover.url, websites.url;
				limit 5;
			`;

			const response = await axios({
				url: 'https://api.igdb.com/v4/games',
				method: 'POST',
				headers: {
					'Client-ID': clientId,
					'Authorization': `Bearer ${accessToken}`,
					'Accept': 'application/json',
					'Content-Type': 'text/plain'
				},
				data: query
			});

			const games = response.data;
			if (!games || games.length === 0) {
				return interaction.editReply(`No games found with title "${gameTitle}"`);
			}

			// Check for an exact (case-insensitive) match
			const exactMatch = games.find(game => game.name.toLowerCase() === gameTitle.toLowerCase());
			if (exactMatch) {
				const embed = createGameEmbed(exactMatch);
				return interaction.editReply({ embeds: [embed] });
			}

			// If only one game is found, show its details
			if (games.length === 1) {
				const embed = createGameEmbed(games[0]);
				return interaction.editReply({ embeds: [embed] });
			}

			// Multiple results found: Present a select menu for the user to choose the correct game
			const options = games.map((game, index) => ({
				label: game.name.substring(0, 100), // Discord's limit for select menu labels
				description: game.summary ? game.summary.substring(0, 50) : 'No summary available',
				value: String(index)
			}));

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('select_game')
				.setPlaceholder('Select a game')
				.addOptions(options);

			const row = new ActionRowBuilder().addComponents(selectMenu);

			const listEmbed = new EmbedBuilder()
				.setTitle('Multiple Games Found')
				.setDescription('Please select a game from the list below:')
				.setColor(0x0099FF);

			await interaction.editReply({ embeds: [listEmbed], components: [row] });

			// Create a collector to handle the user's selection
			const filter = i => i.customId === 'select_game' && i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

			collector.on('collect', async i => {
				await i.deferUpdate();
				const selectedIndex = parseInt(i.values[0]);
				const selectedGame = games[selectedIndex];
				const embed = createGameEmbed(selectedGame);
				await interaction.editReply({ embeds: [embed], components: [] });
			});

			collector.on('end', async collected => {
				if (collected.size === 0) {
					await interaction.editReply({ content: 'No selection made, please try the command again.', components: [] });
				}
			});

		} catch (error) {
			handleError('❌ Failed to fetch game data:', error);
			console.log(error);
		}
	},
};
