const { SlashCommandBuilder, EmbedBuilder, Embed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask the magic 8ball a question.')
		.addStringOption(option =>
			option.setName('question').setDescription('The question to ask').setRequired(true)
		),
	category: 'fun',
    async execute(interaction) {
        const response = await fetch('https://meme-api.com/memes/random');
        const data = await response.json();

        const memeEmbed = new EmbedBuilder()
            .setTitle(data.title)
            .setImage(data.url)
            .setColor('#00ff00')
            .setFooter({
                text: `Executed by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();
        if (data.url) {
            await interaction.reply({ embeds: [memeEmbed] });
        } else {
            await interaction.reply('Could not fetch a meme at this time. Please try again later.');
        }
    }
}