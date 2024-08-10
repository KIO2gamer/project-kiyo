const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription("Checks the bot's latency"),
	 
	async execute(interaction) {
		try {
			// Create initial embed
			const initialEmbed = new EmbedBuilder().setTitle('Pinging...').setColor('Blue');

			// Reply with the initial embed and fetch the reply to calculate latency
			const sent = await interaction.reply({
				embeds: [initialEmbed],
				fetchReply: true,
			});

			// Calculate latency
			const latency = sent.createdTimestamp - interaction.createdTimestamp;

			// Get WebSocket ping
			const websocketPing = interaction.client.ws.ping;

			// Calculate uptime
			const uptime = process.uptime();
			const days = Math.floor(uptime / (3600 * 24));
			const hours = Math.floor((uptime % (3600 * 24)) / 3600);
			const minutes = Math.floor((uptime % 3600) / 60);
			const seconds = Math.floor(uptime % 60);
			const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

			// Create the final embed with the latency and uptime
			const finalEmbed = new EmbedBuilder()
				.setTitle('Ping Results')
				.setColor('Green')
				.addFields(
					{
						name: 'Roundtrip Latency',
						value: `${latency}ms`,
						inline: true,
					},
					{
						name: 'WebSocket Ping',
						value: `${websocketPing}ms`,
						inline: true,
					},
					{ name: 'Uptime', value: uptimeString, inline: false }
				)
				.setTimestamp();

			// Edit the reply with the final embed
			await interaction.editReply({ embeds: [finalEmbed] });
		} catch (error) {
			console.error('Error executing ping command:', error);
			await interaction.editReply(
				'There was an error while executing this command. Please try again later.'
			);
		}
	},
};
