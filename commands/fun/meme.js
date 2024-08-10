const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder().setName('meme').setDescription('Send a random meme.'),
	 
	async execute(interaction) {
		let attempts = 0;
		let meme;

		while (attempts < 5) {
			try {
				const response = await axios.get('https://meme-api.com/gimme');
				meme = response.data;

				if (meme && !meme.nsfw && meme.title && meme.url) {
					break;
				}
			} catch (error) {
				console.error('Error fetching meme:', error);
			}
			attempts++;
		}

		if (meme && !meme.nsfw && meme.title && meme.url) {
			const memeEmbed = new EmbedBuilder()
				.setTitle(meme.title)
				.setImage(meme.url)
				.setColor('#00ff00')
				.setFooter({
					text: `Executed by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTimestamp();

			await interaction.reply({ embeds: [memeEmbed] });
		} else {
			await interaction.reply(
				'Could not fetch a non-NSFW meme at this time. Please try again later.'
			);
		}
	},
};
