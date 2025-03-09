const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const NodeCache = require('node-cache');
const { handleError } = require('./../../utils/errorHandler.js');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Cache for 5 minutes (TTL: Time To Live, checkperiod: how often to check for expired entries)
const ASHCON_API_BASE = 'https://api.ashcon.app/mojang/v2/user/';
const EMBED_COLOR = '#2ECC71'; // A more visually appealing color for embeds
const ERROR_COLOR = '#E74C3C'; // Color for error embeds

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Retrieves general information about a Minecraft player from the Ashcon API, including their username, UUID, and skin.',
	usage: '/minecraft <username>',
	examples: ['/minecraft Notch', '/minecraft Dinnerbone'],
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('minecraft')
		.setDescription('Gets general info about a Minecraft player')
		.addStringOption((option) =>
			option
				.setName('username')
				.setDescription('The Minecraft username')
				.setRequired(true),
		),

	async execute(interaction) {
		const username = interaction.options.getString('username');

		// Check Cache - Moved cache check to the beginning for quicker response
		const cachedEmbed = cache.get(username); // Directly cache the embed
		if (cachedEmbed) {
			await interaction.reply({
				embeds: [cachedEmbed],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			const playerData = await fetchPlayerData(username);

			if (!playerData) {
				// Player not found - Create specific error embed for better UX
				const notFoundEmbed = new EmbedBuilder()
					.setColor(ERROR_COLOR)
					.setTitle('Minecraft Player Not Found')
					.setDescription(
						`Could not find player with username: \`${username}\` on the Mojang services. Please check the username and try again.`,
					)
					.setTimestamp();
				await interaction.reply({
					embeds: [notFoundEmbed],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const infoEmbed = createInfoEmbed(
				playerData,
				username,
				interaction,
			); // Pass username to embed function for potential use
			cache.set(username, infoEmbed); // Cache the created embed

			await interaction.reply({
				embeds: [infoEmbed],
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			handleError('Error fetching Minecraft player data:', error);
			await handleError(
				interaction,
				error,
				'Failed to fetch Minecraft player data.',
			); // More descriptive error message for handleError
		}
	},
};

async function fetchPlayerData(username) {
	try {
		const response = await axios.get(`${ASHCON_API_BASE}${username}`);
		if (response.status === 204) {
			// 204 No Content - Player not found on Ashcon API (or Mojang)
			return null; // Return null to indicate player not found
		}
		return response.data;
	} catch (error) {
		handleError(
			`Error fetching data from Ashcon API for username ${username}:`,
			error,
		);
		if (error.response) {
			// API responded with an error status code
			if (error.response.status === 404) {
				return null; // Treat 404 as player not found as well, though 204 should be the standard for not found
			}
			throw new Error(
				`Ashcon API error: ${error.response.status} - ${error.response.statusText}`,
			); // More informative API error
		} else if (error.request) {
			// Request was made but no response was received
			throw new Error(
				'No response received from Ashcon API. The service might be down.',
			);
		} else {
			// Something happened in setting up the request that triggered an Error
			throw new Error('Error setting up the request to Ashcon API.');
		}
	}
}

function createInfoEmbed(playerData, username, interaction) {
	const uuid = playerData.uuid;
	const skinUrl = playerData.textures?.skin?.url; // Use optional chaining in case textures or skin is missing

	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setTitle(`Minecraft Player: ${playerData.username}`)
		.setURL(`https://namemc.com/profile/${uuid}`) // Added NameMC link for easy profile viewing
		.setDescription(
			`Information about the Minecraft player **${playerData.username}**`,
		) // Slightly improved description
		.addFields(
			{
				name: 'Username',
				value: playerData.username || 'N/A',
				inline: true,
			}, // Fallback value if data is missing
			{ name: 'UUID', value: uuid || 'N/A', inline: true }, // Fallback value if data is missing
			{
				name: 'Skin',
				value: skinUrl
					? `[View Skin](${skinUrl})`
					: 'No Skin Available',
				inline: true,
			}, // Handle case where skin URL might be missing
		)
		.setFooter({
			text: 'Data provided by Ashcon API',
			iconURL: interaction.client.user.displayAvatarURL(),
		}) // Added footer with API source and bot icon
		.setTimestamp();

	if (skinUrl) {
		embed.setImage(skinUrl.replace('http://', 'https://')); // Set skin as large image, ensure https
	}

	return embed;
}
