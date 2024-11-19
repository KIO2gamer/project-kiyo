const { Events, AuditLogEvent } = require("discord.js");
const MsgLogsConfig = require("./../../database/msgLogsConfig");

module.exports = {
  name: Events.MessageDelete,
  /**
   * Handles the message delete event and logs the details to a specified log channel.
   *
   * @async
   * @function execute
   * @param {Message} message - The deleted message object.
   * @returns {Promise<void>}
   *
   * @description
   * This function checks if the message author exists and is not a bot. It fetches the log channel ID from the database,
   * verifies the bot's permissions to send messages in the log channel, and creates an embed with the message details.
   * If the message has attachments, they are included in the embed. The function also fetches audit logs to determine
   * who deleted the message and includes this information in the embed if available. Finally, it sends the embed to the log channel.
   *
   * @throws Will log an error if there is an issue fetching the log channel ID, the log channel itself, or if the bot lacks permissions.
   */
  async execute(message) {
    // Check if the message author exists and it's not a bot
    if (!message.author && message.partial) {
      console.error("Message is partial, unable to fetch author details.");
      return;
    }
    if (message.author.bot) return;

    try {
      // Fetch the log channel ID from the database
      const config = await MsgLogsConfig.findOne();
      if (!config) {
        console.error("No configuration found in the database.");
        return;
      }
      const logChannelId = config.channelId;
      if (!logChannelId) {
        console.error("Log channel ID is not set.");
        return;
      }

      const logChannel = await message.guild.channels.fetch(logChannelId);
      if (!logChannel) {
        console.error(`Log channel with ID ${logChannelId} not found.`);
        return;
      }
      const botMember = await message.guild.members.fetch(
        message.client.user.id,
      );
      if (!botMember.permissionsIn(logChannel).has("SEND_MESSAGES")) {
        console.error(
          `Bot doesn't have permission to send messages to the channel: ${logChannelId}`,
        );
        return;
      }

      // Log Embed creation
      const logEmbed = {
        color: 0xff0000,
        title: "Message Deleted",
        fields: [
          {
            name: "Author",
            value: `<@${message.author.id}> (${message.author.id})`,
          },
          {
            name: "Channel",
            value: `<#${message.channel.id}> (${message.channel.id})`,
          },
          {
            name: "Content",
            value: message.content || "No text content",
          },
        ],
        timestamp: new Date(),
      };

      if (message.attachments.size > 0) {
        logEmbed.fields.push({
          name: "Attachments",
          value: message.attachments.map((a) => a.url).join("\n"),
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
            name: "Audit Log",
            value: `Executor: ${auditEntry.executor.tag} (${auditEntry.executor.id})`,
          });
        }
      }

      // Send the log to the log channel
      await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
      console.error("Error in MessageDelete event:", error);
    }
  },
};
