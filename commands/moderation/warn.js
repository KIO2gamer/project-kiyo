// commands/moderation/warn.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the warning')
        .setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const moderator = interaction.user;

    try {
      // Log the warning to MongoDB
      
      const logEntry = new ModerationLog({
        action: 'warn',
        moderator: moderator.id,
        user: target.id,
        reason: reason,
      });
      
      await logEntry.save();

      // Notify the warned user via DM
      try {
        await target.send(`You have been warned for: ${reason}`);
      } catch (error) {
        console.error(`Could not send DM to ${target.tag}.`);
      }

      // Notify the moderator in the channel
      await interaction.reply(`Successfully warned ${target.tag} for: ${reason}`);
    } catch (error) {
      console.error(error);
      await interaction.reply(`Failed to warn ${target.tag}`);
    }
  },
};
