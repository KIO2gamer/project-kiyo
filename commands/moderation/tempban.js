// commands/moderation/tempban.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const ModerationLog = require('../../models/ModerationLog');
const ms = require('ms'); // Use ms library to parse duration strings

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user for a specified duration.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('The duration of the ban (e.g., 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason');
    const moderator = interaction.user;
    const guild = interaction.guild;

    // Parse duration
    const durationMs = ms(duration);
    if (!durationMs) {
      return interaction.reply('Invalid duration format. Please use formats like 1h, 1d, etc.');
    }

    try {
      const member = await guild.members.fetch(target.id);
      await member.ban({ reason });

      // Log the ban to MongoDB
      const logEntry = new ModerationLog({
        action: 'tempban',
        moderator: moderator.id,
        user: target.id,
        reason: reason,
        timestamp: Date.now(),
        duration: durationMs
      });
      await logEntry.save();

      // Notify the moderator
      await interaction.reply(`Successfully banned ${target.tag} for ${duration} for: ${reason}`);

      // Schedule unban
      setTimeout(async () => {
        try {
          await guild.members.unban(target.id);
          console.log(`Successfully unbanned ${target.tag} after ${duration}`);
        } catch (error) {
          console.error(`Failed to unban ${target.tag}: ${error}`);
        }
      }, durationMs);
    } catch (error) {
      console.error(error);
      await interaction.reply(`Failed to ban ${target.tag}`);
    }
  },
};
