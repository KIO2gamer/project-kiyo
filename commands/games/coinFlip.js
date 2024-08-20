const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    description_full: '',
    usage: '',
    examples: [
        '',
        '',
    ],
	data: new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin!'),
	async execute(interaction) {
		const result = Math.floor(Math.random() * 2) === 0 ? 'Heads' : 'Tails';
		let imageMedia = '';
		if (result == 'Heads') {
			imageMedia =
				'https://upload.wikimedia.org/wikipedia/commons/6/60/Logo-hyperplanning-H.png?20211111211806';
		} else {
			imageMedia =
				'https://upload.wikimedia.org/wikipedia/commons/e/ef/Letter_T.png?20170930195759';
		}

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Coin Flip')
			.setDescription(`The coin landed on **${result}**!`)
			.setThumbnail(imageMedia);

		await interaction.reply({ embeds: [embed] });
	},
};
