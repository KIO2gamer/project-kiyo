const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('predict')
		.setDescription('Send a question and let the bot predict whether its good or bad.')
		.addStringOption(option =>
			option.setName('question').setDescription('The question to ask').setRequired(true)
		),
	category: 'fun',
	async execute(interaction) {
		const question = interaction.options.getString('question');

		const embed = new EmbedBuilder()
			.setDescription(
				`# Question: ${question}\nAnswer: ***${Math.random() < 0.5 ? (Math.random() < 0.5 ? 'yessir' : 'ayee') : Math.random() < 0.5 ? 'nuh uh' : 'nay'}***`
			)
			.setColor('#00ff00')
			.setFooter({
				text: `Executed by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
