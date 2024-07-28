const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Cache for 5 minutes

module.exports = {
	data: new SlashCommandBuilder()
		.setName('minecraft')
		.setDescription('Sends info about a Minecraft player')
		.addStringOption(option =>
			option
				.setName('username')
				.setDescription('Search for a Minecraft player')
				.setRequired(true)
		),
	category: 'info',
	async execute(interaction) {
		const username = interaction.options.getString('username');

		// Check if the data is in cache
		const cachedData = cache.get(username);
		if (cachedData) {
			await interaction.reply({ embeds: [createEmbed(cachedData)] });
			return;
		}

		try {
			const response = await fetch(
				`https://api.mojang.com/users/profiles/minecraft/${username}`
			);
			const data = await response.json();

			if (data && data.id && data.name) {
				const skinHeadUrl = `https://minotar.net/helm/${data.id}/256.png`;
				const skinFullUrl = `https://minotar.net/skin/${data.id}`;


				const infoMinecraftEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle(`Minecraft Player: ${data.name}`)
					.setThumbnail(skinHeadUrl)
					.addFields(
						{ name: 'Username', value: data.name, inline: true },
						{ name: 'UUID', value: data.id, inline: true }
					)
					.setImage(skinFullUrl)
					.setTimestamp();

				// Cache the data
				cache.set(username, infoMinecraftEmbed);

				await interaction.reply({ embeds: [infoMinecraftEmbed] });
			} else {
				await interaction.reply('Could not find the Minecraft player.');
			}
		} catch (error) {
			console.error(error);
			await interaction.reply(
				'An error occurred while fetching the player information. Please try again later.'
			);
		}
	},
};

function createEmbed(playerData) {
	return new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle(`Minecraft Player: ${playerData.name}`)
		.setThumbnail(playerData.skinUrl)
		.addFields(
			{ name: 'Username', value: playerData.name, inline: true },
			{ name: 'UUID', value: playerData.uuid, inline: true }
		)
		.setTimestamp();
}
