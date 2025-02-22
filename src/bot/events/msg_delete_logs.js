const {
	Events,
	AuditLogEvent,
	PermissionsBitField,
	EmbedBuilder,
	AttachmentBuilder
} = require('discord.js');
const MsgLogsConfig = require('./../../database/msgLogsConfig');
const { handleError } = require('./../utils/errorHandler');
const Logger = require('./../../../logger');

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
		try {
			// Ignore bot messages and self-deletions
			if (message.author.bot || message.author.id === message.client.user.id) {
				return;
			}

			// Handle partial messages
			if (message.partial) {
				try {
					message = await message.fetch();
				} catch (error) {
					Logger.error('Failed to fetch partial message:', error);
					return;
				}
			}

			// Fetch log channel configuration
			const config = await MsgLogsConfig.findOne({});
			if (!config?.channelId) {
				Logger.warn('Message log channel not configured');
				return;
			}

			// Get log channel
			const logChannel = await message.guild.channels.fetch(config.channelId);
			if (!logChannel) {
				Logger.warn('Invalid log channel ID in configuration');
				return;
			}

			// Prevent logging deletions in the log channel itself
			if (message.channel.id === logChannel.id) {
				return;
			}

			// Check bot permissions in log channel
			const botMember = await message.guild.members.fetch(message.client.user.id);
			const permissions = botMember.permissionsIn(logChannel);
			if (
				!permissions.has([
					PermissionsBitField.Flags.SendMessages,
					PermissionsBitField.Flags.EmbedLinks,
					PermissionsBitField.Flags.AttachFiles
				])
			) {
				Logger.error('Bot lacks required permissions in log channel');
				return;
			}

			// Create log embed
			const logEmbed = new EmbedBuilder()
				.setColor(0xff0000)
				.setTitle('Message Deleted')
				.addFields([
					{
						name: 'Author',
						value: `${message.author.tag} (${message.author.id})`,
						inline: true
					},
					{
						name: 'Channel',
						value: `${message.channel.name} (${message.channel.id})`,
						inline: true
					},
					{
						name: 'Message ID',
						value: message.id,
						inline: true
					},
					{
						name: 'Content',
						value: message.content || 'No text content',
						inline: false
					}
				])
				.setTimestamp();

			// Fetch audit logs to determine deletion cause
			const auditLogs = await message.guild.fetchAuditLogs({
				type: AuditLogEvent.MessageDelete,
				limit: 1
			});

			const auditEntry = auditLogs.entries.first();
			if (auditEntry) {
				const { executor, target, createdTimestamp } = auditEntry;
				const timeDifference = Date.now() - createdTimestamp;

				if (
					target.id === message.author.id &&
					timeDifference < 5000
				) {
					logEmbed.addFields({
						name: 'Deleted By',
						value: `${executor.tag} (${executor.id})`,
						inline: true
					});
				}
			}

			// Collect and send attachments
			const attachments = [];
			if (message.attachments.size > 0) {
				for (const [index, attachment] of message.attachments.entries()) {
					try {
						const response = await fetch(attachment.url);
						const buffer = Buffer.from(await response.arrayBuffer());
						attachments.push(new AttachmentBuilder(buffer, {
							name: attachment.name,
							description: `Attachment ${index + 1}`
						}));
					} catch (error) {
						Logger.error(`Failed to fetch attachment ${index + 1}:`, error);
					}
				}
			}

			// Send log message
			await logChannel.send({
				embeds: [logEmbed],
				files: attachments.length > 0 ? attachments : undefined
			});

			Logger.info('Message deletion logged successfully');

		} catch (error) {
			Logger.error('Error in MessageDelete event handler:', error);
			await handleError(null, error, false);
		}
	}
};