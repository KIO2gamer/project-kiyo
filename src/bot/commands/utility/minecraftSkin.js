const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const NodeCache = require('node-cache');
const { handleError } = require('./../../utils/errorHandler.js');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Cache for 5 minutes
const ASHCON_API_BASE = 'https://api.ashcon.app/mojang/v2/user/';

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

		// Check Cache
		const cachedData = cache.get(username);
		if (cachedData) {
			await interaction.editReply({
				embeds: [cachedData],
				ephemeral: true,
			});
			return;
		}

		try {
			const playerData = await fetchPlayerData(username);
			if (!playerData) {
				await interaction.editReply('Player not found on Ashcon API.');
				return;
			}

			const infoEmbed = createInfoEmbed(playerData);
			cache.set(username, infoEmbed);

			await interaction.editReply({
				embeds: [infoEmbed],
				ephemeral: true,
			});
		} catch (error) {
			console.error('Error fetching Minecraft player data:', error);
			await handleError(interaction, error);
		}
	},
};

async function fetchPlayerData(username) {
	try {
		const response = await axios.get(`${ASHCON_API_BASE}${username}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching data from Ashcon API:', error);
		throw new Error('Failed to fetch data from Ashcon API.');
	}
}

function createInfoEmbed(playerData) {
	console.log(playerData); // Log the player data for debugging
	const uuid = playerData.uuid;
	const skinUrl = playerData.textures.skin.url;

	console.log(`Skin URL: ${skinUrl}`); // Log the skin URL for debugging

	return new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle(`Minecraft Player: ${playerData.username}`)
		.setThumbnail(skinUrl)
		.addFields(
			{ name: 'Username', value: playerData.username, inline: true },
			{ name: 'UUID', value: uuid, inline: true },
			{ name: 'Skin', value: `[View Skin](${skinUrl})`, inline: true },
		)
		.setTimestamp();
}
