const { Events, AuditLogEvent, EmbedBuilder, PermissionsBitField } = require("discord.js");
const MsgLogsConfig = require("./../database/msgLogsConfig");
const { handleError, logError } = require("./../utils/errorHandler");

async function fetchPartialMessages(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) {
        try {
            oldMessage = await oldMessage.fetch();
            newMessage = await newMessage.fetch();
        } catch (err) {
            logError("Error fetching partial messages", err, { category: "EVENTS" });
            return false;
        }
    }
    return true;
}

async function getLogChannel(newMessage, eventKey = "message_update") {
    const config = await MsgLogsConfig.findOne({ guildId: newMessage.guildId });
    const targetChannelId = config?.resolveChannelId?.(eventKey) || config?.channelId;

    if (!targetChannelId) {
        logError("Message logs", "Log channel ID is not set", { category: "EVENTS" });
        return null;
    }

    const logChannel = await newMessage.guild.channels.fetch(targetChannelId).catch(() => null);
    if (!logChannel) {
        logError("Message logs", `Log channel with ID ${targetChannelId} not found`, {
            category: "EVENTS",
        });
        return null;
    }

    const botMember = await newMessage.guild.members.fetch(newMessage.client.user.id);
    const permissions = botMember.permissionsIn(logChannel);

    if (
        !permissions.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
        ])
    ) {
        logError(
            "Message logs permission error",
            `Bot lacks permission to send messages or embed links in the channel: ${targetChannelId}`,
            { category: "PERMISSION" },
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
 * @returns {EmbedBuilder} An embed object containing the log information.
 */
async function createLogEmbed(oldMessage, newMessage) {
    const logEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Message Updated")
        .addFields(
            {
                name: "Author",
                value: `${newMessage.author.tag} (${newMessage.author.id})`,
                inline: true,
            },
            {
                name: "Channel",
                value: `${newMessage.channel.name} (${newMessage.channel.id})`,
                inline: true,
            },
            {
                name: "Old Content",
                value: oldMessage.content || "No text content",
            },
            {
                name: "New Content",
                value: newMessage.content || "No text content",
            },
        )
        .setTimestamp();

    if (newMessage.attachments.size > 0) {
        logEmbed.addFields({
            name: "Attachments",
            value: newMessage.attachments.map((a) => a.url).join("\n"),
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
            logEmbed.addFields({
                name: "Audit Log",
                value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
            });
        }
    }
}

/**
 * Handles the message update event and logs the details to a specified log channel.
 *
 * @async
 * @function execute
 * @param {Message} oldMessage - The message before the update.
 * @param {Message} newMessage - The message after the update.
 * @returns {Promise<void>}
 */
async function execute(oldMessage, newMessage) {
    // Ignore bot messages
    if (newMessage.author.bot) return;

    // Fetch partial messages if necessary
    if (!(await fetchPartialMessages(oldMessage, newMessage))) return;

    try {
        const logChannel = await getLogChannel(newMessage, "message_update");
        if (!logChannel) return;

        // **Ignore edits in the log channel to prevent recursive logging**
        if (newMessage.channel.id === logChannel.id) return;

        const logEmbed = await createLogEmbed(oldMessage, newMessage);
        await addAuditLogInfo(newMessage, logEmbed);

        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        handleError("Error in MessageUpdate event handler:", error);
    }
}

module.exports = {
    name: Events.MessageUpdate,
    execute,
};
