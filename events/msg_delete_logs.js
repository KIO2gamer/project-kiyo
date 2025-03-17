const {
    Events,
    AuditLogEvent,
    PermissionsBitField,
    EmbedBuilder,
    AttachmentBuilder,
} = require("discord.js");
const MsgLogsConfig = require("./../database/msgLogsConfig");
const { handleError } = require("./../utils/errorHandler");
const Logger = require("./../utils/logger");

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
            // Handle partial messages first
            if (message.partial) {
                try {
                    // Attempt to fetch the complete message data
                    message = await message.fetch().catch(() => null);
                    if (!message) {
                        Logger.warn("Could not fetch deleted partial message, skipping log");
                        return;
                    }
                } catch (error) {
                    Logger.error("Failed to fetch partial message:", error);
                    return;
                }
            }

            // Check if message.author exists before checking bot property
            // This prevents the TypeError when author is null
            if (!message.author) {
                Logger.warn("Message author information unavailable, skipping log");
                return;
            }

            // Ignore bot messages
            if (message.author.bot) {
                return;
            }

            // Safety check for guild
            if (!message.guild) {
                Logger.warn("Message not from a guild, skipping log");
                return;
            }

            // Fetch log channel configuration
            const config = await MsgLogsConfig.findOne({}).catch((err) => {
                Logger.error("Failed to fetch message log configuration:", err);
                return null;
            });

            if (!config?.channelId) {
                Logger.debug("Message log channel not configured");
                return;
            }

            // Get log channel safely
            const logChannel = await message.guild.channels
                .fetch(config.channelId)
                .catch(() => null);
            if (!logChannel) {
                Logger.warn(`Invalid log channel ID in configuration: ${config.channelId}`);
                return;
            }

            // Prevent logging deletions in the log channel itself
            if (message.channel.id === logChannel.id) {
                return;
            }

            // Check bot permissions in log channel
            const requiredPermissions = [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
            ];

            try {
                const botMember = await message.guild.members.fetch(message.client.user.id);
                const permissions = botMember.permissionsIn(logChannel);

                if (!permissions.has(requiredPermissions)) {
                    Logger.warn(`Missing permissions in log channel ${logChannel.name}`);
                    return;
                }
            } catch (error) {
                Logger.error("Failed to check permissions:", error);
                return;
            }

            // Create log embed
            const logEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Message Deleted")
                .addFields([
                    {
                        name: "Author",
                        value: `${message.author.tag} (${message.author.id})`,
                        inline: true,
                    },
                    {
                        name: "Channel",
                        value: `${message.channel.name} (${message.channel.id})`,
                        inline: true,
                    },
                    {
                        name: "Message ID",
                        value: message.id,
                        inline: true,
                    },
                ])
                .setTimestamp();

            // Add message content (if any) with length limit handling
            const contentLimit = 1024;
            const content = message.content || "No text content";

            if (content.length <= contentLimit) {
                logEmbed.addFields({
                    name: "Content",
                    value: content,
                    inline: false,
                });
            } else {
                logEmbed.addFields({
                    name: "Content (truncated)",
                    value: content.substring(0, contentLimit - 3) + "...",
                    inline: false,
                });
            }

            // Try to fetch audit logs to determine deletion cause
            try {
                const auditLogs = await message.guild
                    .fetchAuditLogs({
                        type: AuditLogEvent.MessageDelete,
                        limit: 5, // Fetch more entries to increase matching chances
                    })
                    .catch(() => ({ entries: new Map() }));

                // Look for a matching audit log entry
                const matchingEntry = auditLogs.entries.find((entry) => {
                    // Check if this audit log entry matches our deleted message
                    const isRecentDeletion = Date.now() - entry.createdTimestamp < 5000;
                    const matchesChannel = entry.extra?.channel?.id === message.channel.id;
                    const matchesAuthor = entry.target?.id === message.author.id;

                    return isRecentDeletion && (matchesChannel || matchesAuthor);
                });

                if (matchingEntry) {
                    const { executor } = matchingEntry;

                    // Skip logging if this is a bot self-deletion
                    if (
                        executor.id === message.client.user.id &&
                        matchingEntry.target.id === message.author.id
                    ) {
                        Logger.debug("Self-deletion detected, skipping logging.");
                        return;
                    }

                    // Add deletion attribution field
                    logEmbed.addFields({
                        name: "Deleted By",
                        value: `${executor.tag} (${executor.id})`,
                        inline: true,
                    });
                }
            } catch (error) {
                Logger.warn("Failed to fetch audit logs:", error);
                // Continue with logging even if audit logs fail
            }

            // Collect attachments with improved error handling
            const attachments = [];
            if (message.attachments.size > 0) {
                logEmbed.addFields({
                    name: "Attachments",
                    value: `${message.attachments.size} attachment(s)`,
                    inline: true,
                });

                // Process up to 5 attachments to avoid exceeding Discord limits
                const maxAttachments = Math.min(message.attachments.size, 5);
                let attachmentCount = 0;

                for (const [, attachment] of message.attachments) {
                    if (attachmentCount >= maxAttachments) break;

                    try {
                        // Avoid downloading very large files
                        if (attachment.size > 8 * 1024 * 1024) {
                            // 8MB limit
                            logEmbed.addFields({
                                name: `Attachment ${attachmentCount + 1}`,
                                value: `[${attachment.name}](${attachment.url}) (too large to save: ${(attachment.size / 1024 / 1024).toFixed(2)}MB)`,
                                inline: true,
                            });
                            continue;
                        }

                        const response = await fetch(attachment.url, {
                            timeout: 5000,
                        });
                        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

                        const buffer = Buffer.from(await response.arrayBuffer());
                        attachments.push(
                            new AttachmentBuilder(buffer, {
                                name:
                                    attachment.name ||
                                    `attachment-${attachmentCount + 1}.${attachment.contentType?.split("/")[1] || "bin"}`,
                                description: `${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB)`,
                            }),
                        );
                        attachmentCount++;
                    } catch (error) {
                        Logger.warn(`Failed to fetch attachment: ${error.message}`);
                    }
                }
            }

            // Send log message with improved error handling
            try {
                await logChannel.send({
                    embeds: [logEmbed],
                    files: attachments.length > 0 ? attachments : [],
                });
            } catch (error) {
                Logger.error("Failed to send log message:", error);
            }
        } catch (error) {
            Logger.error("Error in MessageDelete event handler:", error);
            await handleError(null, error, false);
        }
    },
};
