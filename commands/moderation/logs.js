// commands/moderation/logs.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Show the moderation logs.')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('The number of logs to retrieve')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The user id to filter logs by')
        .setRequired(false)),
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const user = interaction.options.getString('user_id');

    try {
      // Fetch logs from MongoDB
      let logs;
      if (user) {
        logs = await ModerationLog.find({ user: user }).sort({ timestamp: -1 }).limit(limit);
      } else {
        logs = await ModerationLog.find().sort({ timestamp: -1 }).limit(limit);
      }

      if (logs.length === 0) {
        return interaction.reply('No moderation logs of that user are found.');
      }

      const embed = new EmbedBuilder()
        .setTitle('Moderation Logs')
        .setColor('#FF0000')
        .setTimestamp();

      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      });

      let description = '';

      logs.forEach(log => {
        const moderator = `<@${log.moderator}>`;
        const punishedUser = `<@${log.user}>`;
        const formattedTimestamp = formatter.format(new Date(log.timestamp));

        description += `**Action**: ${log.action}\n**Moderator**: ${moderator}\n**User**: ${punishedUser}\n**Reason**: ${log.reason}\n**Time**: ${formattedTimestamp}\n\n`;
      });

      embed.setDescription(description);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply('Failed to retrieve logs.');
    }
  },
};
