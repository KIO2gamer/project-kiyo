const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        console.log('Event triggered: MessageUpdate');
        if (newMessage.author.bot) return;

        // Handle partial messages
        if (oldMessage.partial || newMessage.partial) {
            console.error(
                'One or both messages are partial, unable to fetch content.',
            );
            try {
                await oldMessage.fetch();
                await newMessage.fetch();
                console.log('Fetched full messages after partial detection.');
            } catch (err) {
                console.error('Error fetching partial messages:', err);
                return;
            }
        }

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

            const logChannel =
                await newMessage.guild.channels.fetch(logChannelId);
            if (!logChannel) {
                console.error(`Log channel with ID ${logChannelId} not found.`);
                return;
            }
            const botMember = await newMessage.guild.members.fetch(
                newMessage.client.user.id,
            );
            if (!botMember.permissionsIn(logChannel).has('SEND_MESSAGES')) {
                console.error(
                    `Bot doesn't have permission to send messages to the channel: ${logChannelId}`,
                );
                return;
            }

            // Log Embed creation
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

            // Handle attachments
            if (newMessage.attachments.size > 0) {
                console.log('Attachments found:', newMessage.attachments.size);
                logEmbed.fields.push({
                    name: 'Attachments',
                    value: newMessage.attachments.map((a) => a.url).join('\n'),
                });
            }

            // Fetch audit logs to determine who updated the message
            const auditLogs = await newMessage.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageUpdate,
                limit: 1,
            });

            const auditEntry = auditLogs.entries.first();
            if (auditEntry && auditEntry.target.id === newMessage.author.id) {
                const timeDifference = Date.now() - auditEntry.createdTimestamp;
                if (timeDifference < 5000) {
                    logEmbed.fields.push({
                        name: 'Audit Log',
                        value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
                    });
                } else {
                    console.log('Audit log entry is too old.');
                }
            } else {
                console.log('No matching audit log entry found.');
            }

            // Send the log to the log channel
            await logChannel.send({ embeds: [logEmbed] });
            console.log('Log embed sent successfully');
        } catch (error) {
            console.error('Error in MessageUpdate event:', error);
        }
    },
};
