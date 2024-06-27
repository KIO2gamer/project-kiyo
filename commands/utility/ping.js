const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks the bot\'s latency'),

	category: "utility",

	async execute(interaction) {
		// Create initial embed
		const initialEmbed = new EmbedBuilder()
			.setTitle('Pinging...')
			.setColor('Blue');
		
		// Reply with the initial embed and fetch the reply to calculate latency
		const sent = await interaction.reply({ embeds: [initialEmbed], fetchReply: true });

		// Calculate latency
		const latency = sent.createdTimestamp - interaction.createdTimestamp;

		// Create the final embed with the latency
		const finalEmbed = new EmbedBuilder()
			.setTitle(`Roundtrip latency: ${latency}ms`)
			.setColor('Green');

		// Edit the reply with the final embed
		await interaction.editReply({ embeds: [finalEmbed] });
	},
};
