const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Check if the message author exists and it's not a bot
        if (!message.author && message.partial) {
            console.error(
                'Message is partial, unable to fetch author details.'
            );
            return;
        }
        if (message.author.bot) return;

        try {
            // Fetch the log channel ID from the database
            const config = await MsgLogsConfig.findOne();
            if (!config) {
                console.error('No configuration found in the database.');
                return;
            }
            const logChannelId = config.channelId;
            if (!logChannelId) {
                console.error('Log channel ID is not set.');
                return;
            }

            const logChannel = await message.guild.channels.fetch(logChannelId);
            if (!logChannel) {
                console.error(`Log channel with ID ${logChannelId} not found.`);
                return;
            }
            const botMember = await message.guild.members.fetch(
                message.client.user.id
            );
            if (!botMember.permissionsIn(logChannel).has('SEND_MESSAGES')) {
                console.error(
                    `Bot doesn't have permission to send messages to the channel: ${logChannelId}`
                );
                return;
            }

            // Log Embed creation
            const logEmbed = {
                color: 0xff0000,
                title: 'Message Deleted',
                fields: [
                    {
                        name: 'Author',
                        value: `<@${message.author.id}> (${message.author.id})`,
                    },
                    {
                        name: 'Channel',
                        value: `<#${message.channel.id}> (${message.channel.id})`,
                    },
                    {
                        name: 'Content',
                        value: message.content || 'No text content',
                    },
                ],
                timestamp: new Date(),
            };

            if (message.attachments.size > 0) {
                logEmbed.fields.push({
                    name: 'Attachments',
                    value: message.attachments.map((a) => a.url).join('\n'),
                });
            }

            // Fetch audit logs to determine who deleted the message
            const auditLogs = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1,
            });
            const auditEntry = auditLogs.entries.first();
            if (auditEntry && auditEntry.target.id === message.author.id) {
                const timeDifference = Date.now() - auditEntry.createdTimestamp;
                if (timeDifference < 5000) {
                    logEmbed.fields.push({
                        name: 'Audit Log',
                        value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
                    });
                }
            }

            // Send the log to the log channel
            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error in MessageDelete event:', error);
        }
    },
};
