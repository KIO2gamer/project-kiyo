const {
	SlashCommandBuilder,
	EmbedBuilder,
	version: djsVersion,
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');
const moment = require('moment');

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
			handleError('Error executing bot_info command:', error);
			await handleError(interaction, error);
		}
	},
};

async function sendBotInfo(sent, interaction) {
	try {
		const uptime = formatUptime(interaction.client.uptime);

		const description = `\`\`\`ansi
\x1b[34mDeveloper:\x1b[32m kio2gamer\x1b[0m
\x1b[34mStatus:\x1b[33m In Development\x1b[0m
\x1b[34mLanguage:\x1b[35m JavaScript\x1b[0m
\x1b[34mCreation Date:\x1b[36m ${moment(interaction.client.user.createdAt)
				.format('MMM DD, YYYY, h:mm A UTC')}\x1b[0m
\`\`\``;

		const performanceMetrics = `\`\`\`ansi
\x1b[34mLatency:\x1b[0m ${sent.createdTimestamp - interaction.createdTimestamp}ms
\x1b[34mWebSocket:\x1b[0m ${interaction.client.ws.ping}ms
\x1b[34mUptime:\x1b[0m ${uptime}
\x1b[34mNode.js Version:\x1b[0m ${process.version}
\x1b[34mdiscord.js Version:\x1b[0m v${djsVersion}
\`\`\``;

		const systemSpecs = `\`\`\`ansi
\x1b[34mBot ID:\x1b[0m ${interaction.client.user.id}
\x1b[34mType:\x1b[0m Private
\x1b[34mCommand Count:\x1b[0m ${interaction.client.commands.size}
\x1b[34mCommand Type:\x1b[0m Slash Commands
\x1b[34mMemory Usage:\x1b[0m ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
\`\`\``;

		const embed = new EmbedBuilder()
			.setTitle('🤖 Bot Information')
			.setColor('#8A2BE2')
			.setDescription(description)
			.addFields(
				{
					name: '📊 **Performance Metrics**',
					value: performanceMetrics,
					inline: false,
				},
				{
					name: '💻 **System Specifications**',
					value: systemSpecs,
					inline: false,
				}
			)
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setFooter({
				text: 'Note: Invite link is restricted to bot owner only.',
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setTimestamp();

		const inviteLink = process.env.DISCORD_INVITE;
		if (inviteLink && inviteLink.startsWith('https://')) {
			embed.setURL(inviteLink);
		}

		return interaction.editReply({ content: ' ', embeds: [embed], ephemeral: true });
	} catch (error) {
		handleError('Error retrieving bot information:', error);
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