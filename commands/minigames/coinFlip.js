const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin!'),
	async execute(interaction) {
		const result = Math.floor(Math.random() * 2) === 0 ? 'Heads' : 'Tails';
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Coin Flip')
			.setDescription(`The coin landed on **${result}**!`);

		await interaction.reply({ embeds: [embed] });
	},
};
