const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');

module.exports = {
	description_full:
		"Shows details about a specific emoji from the server, including its name, ID, image URL, creation date, whether it's animated, and whether it's managed. Can also display all emojis in the server.",
	usage: '/emoji_info [emoji]',
	examples: ['/emoji_info 😄', '/emoji_info MyCustomEmoji', '/emoji_info'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('emoji_info')
		.setDescription('Provides information about emojis')
		.addStringOption((option) =>
			option
				.setName('emoji')
				.setDescription(
					'The name of the emoji (must be in the server/guild) to get information about',
				)
				.setRequired(false),
		),
	async execute(interaction) {
		const emojiName = interaction.options.getString('emoji');
		try {
			if (!emojiName) {
				const allEmojis = interaction.guild.emojis.cache
					.map((emoji) => `${emoji} - \`<:${emoji.name}:${emoji.id}>\``)
					.join('\n');
				const embed = new EmbedBuilder()
					.setTitle(`All Emojis in ${interaction.guild.name}`)
					.setDescription(allEmojis || 'No custom emojis in this server.')
					.setColor('#00ff00');

				return interaction.reply({ embeds: [embed], split: true });
			}

			const emoji = interaction.guild.emojis.cache.find(
				(e) => e.name === emojiName,
			);

			if (!emoji) {
				return interaction.reply('Emoji not found.');
			}

			const embed = new EmbedBuilder()
				.setTitle('Emoji Info')
				.setThumbnail(emoji.imageURL())
				.addFields(
					{ name: 'Emoji Name', value: emoji.name, inline: true },
					{ name: 'Emoji ID', value: emoji.id, inline: true },
					{ name: 'Emoji URL', value: emoji.imageURL(), inline: true },
					{
						name: 'Emoji Created At',
						value: emoji.createdAt.toDateString(),
						inline: true,
					},
					{
						name: 'Emoji Animated',
						value: emoji.animated ? 'Yes' : 'No',
						inline: true,
					},
				);

			await interaction.reply({ embeds: [embed] });
		}
		catch (error) {
			console.error('❌ Failed to execute command:', error);
			await handleError(interaction, error);
		}
	},
};
