const {
	SlashCommandBuilder,
	EmbedBuilder,
	version: djsVersion,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');

module.exports = {
	description_full:
		'Displays comprehensive information about the bot, including developer details, operational metrics, and system specifications.',
	usage: '/bot_info',
	examples: ['/bot_info'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('bot_info')
		.setDescription('Retrieve detailed information about the bot.'),

	async execute(interaction) {
		try {
			const sent = await interaction.deferReply({ fetchReply: true });
			await sendBotInfo(sent, interaction);
		} catch (error) {
			console.error('Error executing bot_info command:', error);
			await handleError(interaction, error);
		}
	},
};

async function sendBotInfo(sent, interaction) {
	try {
		const uptime = formatUptime(interaction.client.uptime);

		const description = `\`\`\`fix\nDeveloper: kio2gamer\nStatus: In Development\nLanguage: JavaScript\nCreation Date: ${interaction.client.user.createdAt.toUTCString()}\n\`\`\``;

		const performanceMetrics = `\`\`\`fix\nLatency: ${sent.createdTimestamp - interaction.createdTimestamp}ms\nWebSocket: ${interaction.client.ws.ping}ms\nUptime: ${uptime}\nNode.js Version: ${process.version}\ndiscord.js Version: v${djsVersion}\n\`\`\``;

		const systemSpecs = `\`\`\`fix\nBot ID: ${interaction.client.user.id}\nType: Private\nCommand Count: ${interaction.client.commands.size}\nCommand Type: Slash Commands\nMemory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n\`\`\``;

		const inviteLink = process.env.DISCORD_INVITE;
		const embed = new EmbedBuilder().setTitle('🤖 Bot Information');

		if (inviteLink && inviteLink.startsWith('https://')) {
			embed.setURL(inviteLink);
		}

		embed
			.setColor('#8A2BE2')
			.setDescription(description)
			.addFields(
				{
					name: '📊 Performance Metrics',
					value: performanceMetrics,
					inline: false,
				},
				{
					name: '💻 System Specifications',
					value: systemSpecs,
					inline: false,
				},
			)
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setFooter({
				text: 'Note: Invite link is restricted to bot owner only.',
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setTimestamp();

		return interaction.reply({ content: ' ', embeds: [embed], ephemeral: true });
	} catch (error) {
		console.error('Error retrieving bot information:', error);
		return handleError(interaction, error);
	}
}

function formatUptime(uptimeMilliseconds) {
	const seconds = Math.floor(uptimeMilliseconds / 1000);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
	const secondsLeft = ((seconds % 86400) % 3600) % 60;

	return `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;
}