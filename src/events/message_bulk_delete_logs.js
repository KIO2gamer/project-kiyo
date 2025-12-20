const { Events, EmbedBuilder, AuditLogEvent, PermissionsBitField } = require("discord.js");
const MsgLogsConfig = require("./../database/msgLogsConfig");
const { handleError, logError } = require("./../utils/errorHandler");

async function getLogChannel(guild, eventKey) {
    const config = await MsgLogsConfig.findOne({ guildId: guild.id });
    const targetChannelId = config?.resolveChannelId?.(eventKey) || config?.channelId;
    if (!targetChannelId) return null;

    const logChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return null;

    const botMember = await guild.members.fetch(guild.client.user.id);
    const permissions = botMember.permissionsIn(logChannel);
    if (
        !permissions.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
        ])
    ) {
        return null;
    }

    return logChannel;
}

module.exports = {
    name: Events.MessageBulkDelete,
    /**
     * Logs bulk message deletions with count and channel info.
     * @param {Collection<string, Message>} messages
     */
    async execute(messages) {
        try {
            const firstMessage = messages.first();
            if (!firstMessage || !firstMessage.guild) return;

            const logChannel = await getLogChannel(firstMessage.guild, "message_bulk_delete");
            if (!logChannel) return;

            // Avoid logging in the same channel to prevent loops
            if (firstMessage.channel.id === logChannel.id) return;

            const logEmbed = new EmbedBuilder()
                .setColor(0xff4757)
                .setTitle("Messages Bulk Deleted")
                .addFields(
                    {
                        name: "Channel",
                        value: `${firstMessage.channel} (${firstMessage.channel.id})`,
                        inline: true,
                    },
                    { name: "Count", value: `${messages.size}`, inline: true },
                )
                .setTimestamp();

            // Try audit log attribution
            try {
                const auditLogs = await firstMessage.guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageBulkDelete,
                    limit: 5,
                });

                const match = auditLogs.entries.find(
                    (entry) => Date.now() - entry.createdTimestamp < 5000,
                );
                if (match) {
                    logEmbed.addFields({
                        name: "Deleted By",
                        value: `${match.executor.tag} (${match.executor.id})`,
                        inline: true,
                    });
                }
            } catch (err) {
                logError("Bulk delete audit log fetch failed", err, { category: "EVENTS" });
            }

            // Include a short preview of one message (if available)
            const sample = firstMessage.content?.slice(0, 200);
            if (sample) {
                logEmbed.addFields({
                    name: "Sample Content",
                    value: sample,
                });
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            await handleError(null, error, false);
        }
    },
};
