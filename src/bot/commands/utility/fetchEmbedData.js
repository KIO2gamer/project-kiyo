// This command fetches the embed data from a message URL.
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	description_full: 'Fetches the embed data from a message URL.',
	usage: '/fetch_embed_data <url:message_url>',
	examples: [
		'/fetch_embed_data https://discord.com/channels/123456789012345678/123456789012345678/123456789012345678',
	],
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('fetch_embed_data')
		.setDescription('Fetches the embed data from a message URL.')
		.addStringOption((option) =>
			option
				.setName('url')
				.setDescription('The message URL')
				.setRequired(true),
		),
	async execute(interaction) {
		try {
			const url = interaction.options.getString('url'); // Get the URL from the message
			const urlRegex =
				/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
			const match = url.match(urlRegex);

			if (!match) {
				return interaction.reply('Invalid message URL.');
			}

			const [, guildId, channelId, messageId] = match;

			// Fetch the message using the provided URL
			const response = await fetch(
				`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
				{
					headers: {
						Authorization: `Bot ${process.env.DISCORD_TOKEN}`, // Replace with your bot token
					},
				},
			);

			if (!response.ok) {
				return interaction.reply(
					'Failed to fetch the message. Is the URL correct and is your bot in the server?',
				);
			}

			const data = await response.json();

			if (!data.embeds || data.embeds.length === 0) {
				return interaction.reply(
					'The message does not contain any embeds.',
				);
			}

			// Extract the first embed (you can loop through if there are multiple)
			const embedData = data.embeds[0];

			// Send the embed data as JSON
			interaction.reply({
				content: 'Embed Data:',
				files: [
					{
						attachment: Buffer.from(
							JSON.stringify(embedData, null, 2),
						),
						name: 'embed.json',
					},
				],
			});
		} catch (error) {
			handleError('Error fetching embed:', error);
			interaction.reply('An error occurred while fetching the embed.');
		}
	},
};
