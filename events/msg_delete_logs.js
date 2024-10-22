const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        console.log('Event triggered: MessageDelete');
        if (message.author.bot) return;

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
            const logChannel = await message.guild.channels.fetch(logChannelId);
            if (!logChannel) {
                console.error('Log channel not found.');
                return;
            }
            console.log('Log channel fetched successfully');

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

            console.log('Message deleted. Content:', message.content);

            if (message.attachments.size > 0) {
                console.log('Attachments found:', message.attachments.size);
                logEmbed.fields.push({
                    name: 'Attachments',
                    value: message.attachments.map((a) => a.url).join('\n'),
                });
            }

            // Fetch audit logs
            console.log('Fetching audit logs');
            const auditLogs = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1,
            });

            const auditEntry = auditLogs.entries.first();
            if (auditEntry && auditEntry.target.id === message.author.id) {
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
            console.error('Error in MessageDelete event:', error);
        }
    },
};
