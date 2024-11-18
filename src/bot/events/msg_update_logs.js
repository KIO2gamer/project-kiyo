const { Events, AuditLogEvent } = require('discord.js');
const MsgLogsConfig = require('../bot_utils/msgLogsConfig');

async function fetchPartialMessages(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) {
        console.error(
            'One or both messages are partial, unable to fetch content.'
        );
        try {
            await oldMessage.fetch();
            await newMessage.fetch();
        } catch (err) {
            console.error('Error fetching partial messages:', err);
            return false;
        }
    }
    return true;
}

async function getLogChannel(newMessage) {
    const config = await MsgLogsConfig.findOne();
    if (!config) {
        console.error('No configuration found in the database.');
        return null;
    }
    const logChannelId = config.channelId;
    if (!logChannelId) {
        console.error('Log channel ID is not set.');
        return null;
    }

    const logChannel = await newMessage.guild.channels.fetch(logChannelId);
    if (!logChannel) {
        console.error(`Log channel with ID ${logChannelId} not found.`);
        return null;
    }

    const botMember = await newMessage.guild.members.fetch(
        newMessage.client.user.id
    );
    if (!botMember.permissionsIn(logChannel).has('SEND_MESSAGES')) {
        console.error(
            `Bot doesn't have permission to send messages to the channel: ${logChannelId}`
        );
        return null;
    }

    return logChannel;
}

/**
 * Creates an embed object for logging message updates.
 *
 * @param {Object} oldMessage - The original message object before the update.
 * @param {Object} newMessage - The updated message object.
 * @param {Object} newMessage.author - The author of the updated message.
 * @param {string} newMessage.author.id - The ID of the author.
 * @param {Object} newMessage.channel - The channel where the message was updated.
 * @param {string} newMessage.channel.id - The ID of the channel.
 * @param {string} [oldMessage.content] - The content of the original message.
 * @param {string} [newMessage.content] - The content of the updated message.
 * @param {Map} newMessage.attachments - A collection of attachments in the updated message.
 * @returns {Object} An embed object containing the log information.
 */
async function createLogEmbed(oldMessage, newMessage) {
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
            {
                name: 'Old Content',
                value: oldMessage.content || 'No text content',
            },
            {
                name: 'New Content',
                value: newMessage.content || 'No text content',
            },
        ],
        timestamp: new Date(),
    };

    if (newMessage.attachments.size > 0) {
        logEmbed.fields.push({
            name: 'Attachments',
            value: newMessage.attachments.map((a) => a.url).join('\n'),
        });
    }

    return logEmbed;
}

async function addAuditLogInfo(newMessage, logEmbed) {
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
        }
    }
}

async function execute(oldMessage, newMessage) {
    if (newMessage.author.bot) return;

    if (!(await fetchPartialMessages(oldMessage, newMessage))) return;

    try {
        const logChannel = await getLogChannel(newMessage);
        if (!logChannel) return;

        const logEmbed = await createLogEmbed(oldMessage, newMessage);
        await addAuditLogInfo(newMessage, logEmbed);

        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error('Error in MessageUpdate event:', error);
    }
}

module.exports = {
    name: Events.MessageUpdate,
    execute,
};
