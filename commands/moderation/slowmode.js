const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
  } = require('discord.js');
  const ms = require('ms');

  module.exports = {
    data: new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Set slowmode for a channel')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addStringOption(option =>
        option
          .setName('duration')
          .setDescription('Slowmode duration')
          .setRequired(true)
      )
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('The channel to set slowmode for')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(false)
      ),
    category: 'moderation',
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const durationRaw = interaction.options.getString('duration');
      const duration = ms(durationRaw);
  
      if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageChannels)) {
        const noPermissionEmbed = new EmbedBuilder()
          .setTitle('ERROR')
          .setColor('Red')
          .setDescription('I do not have the required permissions to set slowmode for this channel.');
        await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        return;
      }
  
      if (duration < 0 || duration > 21600) {
        const invalidDurationEmbed = new EmbedBuilder()
          .setTitle('ERROR')
          .setColor('Red')
          .setDescription('The duration must be between 0 and 21600 seconds (6 hours).');
        await interaction.reply({ embeds: [invalidDurationEmbed], ephemeral: true });
        return;
      }
  
      await channel.setRateLimitPerUser(duration);
  
      const successEmbed = new EmbedBuilder()
        .setTitle('Slowmode Set')
        .setColor('Green')
        .setDescription(`Slowmode for ${channel} has been set to ${duration} seconds.`)
        .setFooter({
          text: `Set by: ${interaction.user.username}`,
          iconURL: `${interaction.user.avatarURL()}`,
        });
  
      await interaction.reply({ embeds: [successEmbed], ephemeral: false });
    },
  };
  