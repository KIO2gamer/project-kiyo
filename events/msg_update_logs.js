const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        console.log('Event triggered: MessageUpdate');
        if (newMessage.author.bot) return;

        try {
            // Fetch the log channel ID from the database
            const config = await MsgLogsConfig.findOne();
            console.log('Config fetched:', config);
            const logChannelId = config ? config.channelId : null;

            // Check if the log channel ID is set
            if (!logChannelId) {
                console.error('Log channel not set.');
                return;
            }

            console.log('Fetching log channel with ID:', logChannelId);
            const logChannel =
                await newMessage.guild.channels.fetch(logChannelId);
            if (!logChannel) {
                console.error('Log channel not found.');
                return;
            }
            console.log('Log channel fetched successfully');

            const logEmbed = {
                color: 0x0099ff,
                title: 'Message Updated',
                fields: [
                    {
                        name: 'Author',
                        value: `<@${newMessage.author.id}> (${newMessage.author.id})`,
                    },
                    {
                        name: 'Channel',
                        value: `<#${newMessage.channel.id}> (${newMessage.channel.id})`,
                    },
                ],
                timestamp: new Date(),
            };

            console.log('Message updated. Old content:', oldMessage.content);
            console.log('New content:', newMessage.content);
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

            if (newMessage.attachments.size > 0) {
                console.log('Attachments found:', newMessage.attachments.size);
                logEmbed.fields.push({
                    name: 'Attachments',
                    value: newMessage.attachments.map((a) => a.url).join('\n'),
                });
            }

            // Fetch audit logs
            console.log('Fetching audit logs');
            const auditLogs = await newMessage.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageUpdate,
                limit: 1,
            });

            const auditEntry = auditLogs.entries.first();
            if (auditEntry && auditEntry.target.id === newMessage.author.id) {
                console.log('Audit log entry found:', auditEntry.executor.tag);
                logEmbed.fields.push({
                    name: 'Audit Log',
                    value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
                });
            } else {
                console.log('No matching audit log entry found');
            }

            console.log('Sending log embed to channel');
            await logChannel.send({ embeds: [logEmbed] });
            console.log('Log embed sent successfully');
        } catch (error) {
            console.error('Error in MessageUpdate event:', error);
        }
    },
};
