const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

module.exports = {
    name: [Events.MessageUpdate, Events.MessageDelete],
    async execute(oldMessage, newMessage) {
        const message = newMessage || oldMessage;
        if (message.author.bot) return;

        try {
            // Fetch the log channel ID from the database
            const config = await MsgLogsConfig.findOne();
            const logChannelId = config ? config.channelId : null;

            // Check if the log channel ID is set
            if (!logChannelId) {
                console.error('Log channel not set.');
                return;
            }

            const logChannel = await message.guild.channels.fetch(logChannelId);
            if (!logChannel) {
                console.error('Log channel not found.');
                return;
            }

            const logEmbed = {
                color: 0x0099ff,
                title: newMessage ? 'Message Updated' : 'Message Deleted',
                fields: [
                    {
                        name: 'Author',
                        value: `<@${message.author.id}> (${message.author.id})`,
                    },
                    {
                        name: 'Channel',
                        value: `<#${message.channel.id}> (${message.channel.id})`,
                    },
                ],
                timestamp: new Date(),
            };

            if (newMessage) {
                logEmbed.fields.push(
                    {
                        name: 'Old Content',
                        value: oldMessage.content || 'No text content',
                    },
                    {
                        name: 'New Content',
                        value: newMessage.content || 'No text content',
                    },
                );
            } else {
                logEmbed.fields.push({
                    name: 'Deleted Content',
                    value: message.content || 'No text content',
                });
            }

            if (message.attachments.size > 0) {
                logEmbed.fields.push({
                    name: 'Attachments',
                    value: message.attachments.map((a) => a.url).join('\n'),
                });
            }

            // Fetch audit logs
            const auditLogs = await message.guild.fetchAuditLogs({
                type: newMessage
                    ? AuditLogEvent.MessageUpdate
                    : AuditLogEvent.MessageDelete,
                limit: 1,
            });

            const auditEntry = auditLogs.entries.first();
            if (auditEntry && auditEntry.target.id === message.author.id) {
                logEmbed.fields.push({
                    name: 'Audit Log',
                    value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
                });
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error(
                `Error in ${newMessage ? 'MessageUpdate' : 'MessageDelete'} event:`,
                error,
            );
        }
    },
};
