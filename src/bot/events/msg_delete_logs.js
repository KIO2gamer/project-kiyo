const {
	Events,
	AuditLogEvent,
	PermissionsBitField,
	EmbedBuilder,
} = require('discord.js');
const MsgLogsConfig = require('./../../database/msgLogsConfig');
const { handleError } = require('./../utils/errorHandler');
// If using Node.js version below 18, uncomment the following line:
// const fetch = require('node-fetch');

module.exports = {
	name: Events.MessageDelete,
	/**
	 * Handles the message delete event and logs the details to a specified log channel.
	 *
	 * @async
	 * @function execute
	 * @param {Message} message - The deleted message object.
	 * @returns {Promise<void>}
	 */
	async execute(message) {
		// Handle partial messages
		if (message.partial && !message.channel.id === logChannel.id) {
			try {
				message = await message.fetch();
			} catch (error) {
				console.error('Failed to fetch partial message:', error);
				return;
			}
		}

		// Ignore bot messages
		if (message.author.bot) return;

		try {
			// Fetch the log channel ID from the database
			const config = await MsgLogsConfig.findOne();
			if (!config?.channelId) return;

			const logChannel = await message.guild.channels.fetch(config.channelId);
			if (!logChannel) return;

			// **Ignore deletions in the log channel to prevent recursive logging**
			if (message.channel.id === logChannel.id) {
				return; // Exit early if the deletion occurred in the log channel
			}

			// Check bot permissions in the log channel
			const botMember = await message.guild.members.fetch(
				message.client.user.id,
			);
			const permissions = botMember.permissionsIn(logChannel);
			if (
				!permissions.has([
					PermissionsBitField.Flags.SendMessages,
					PermissionsBitField.Flags.EmbedLinks,
					PermissionsBitField.Flags.AttachFiles,
				])
			) {
				console.error(
					'Bot lacks permission to send messages, embed links, or attach files in the log channel.',
				);
				return;
			}

			// Create the embed
			const logEmbed = new EmbedBuilder()
				.setColor(0xff0000)
				.setTitle('Message Deleted')
				.addFields(
					{
						name: 'Author',
						value: `${message.author.tag} (${message.author.id})`,
						inline: true,
					},
					{
						name: 'Channel',
						value: `${message.channel.name} (${message.channel.id})`,
						inline: true,
					},
					{
						name: 'Content',
						value: message.content || 'No text content',
					},
				)
				.setTimestamp();

			// Fetch audit logs to determine who deleted the message
			const auditLogs = await message.guild.fetchAuditLogs({
				type: AuditLogEvent.MessageDelete,
				limit: 1,
			});
			const auditEntry = auditLogs.entries.first();

			if (auditEntry) {
				const { executor, target, createdTimestamp } = auditEntry;
				const timeDifference = Date.now() - createdTimestamp;

				if (
					target.id === message.author.id &&
					timeDifference < 5000 // Check if the deletion was recent
				) {
					logEmbed.addFields({
						name: 'Deleted By',
						value: `${executor.tag} (${executor.id})`,
						inline: true,
					});
				}
			}

			// Collect files to send
			const files = [];

			if (message.attachments.size > 0) {
				for (const attachment of message.attachments.values()) {
					try {
						const response = await fetch(attachment.url);
						const arrayBuffer = await response.arrayBuffer();
						const buffer = Buffer.from(arrayBuffer);
						files.push({ attachment: buffer, name: attachment.name });
					} catch (error) {
						console.error('Error fetching attachment:', error);
					}
				}
			}

			// Send the embed and attachments to the log channel
			await logChannel.send({ embeds: [logEmbed], files });
		} catch (error) {
			console.error('Error in MessageDelete event handler:', error);
			await handleError(null, error);
		}
	},
};