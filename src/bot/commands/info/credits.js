const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  description_full:
    'Shows an embed acknowledging and listing the contributors who helped create the bot, linking their Discord usernames to their IDs.',
  usage: '/credits',
  examples: ['/credits'],
  category: 'info',
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Shows an embed of users who helped make this bot.'),

  async execute(interaction) {
    const contributors = [
      { command: 'steel', name: 'steeles.0' },
      { command: 'koifish', name: 'hallow_spice' },
      { command: 'do_not_touch', name: 'umbree_on_toast' },
      { command: 'rickroll', name: 'flashxdfx' },
      { command: 'summon', name: 'eesmal' },
      { command: 'snipe', name: 'na51f' },
      { command: 'photo', name: 'spheroidon' },
      { command: 'skibidi', name: 'zenoz231' },
      { command: 'quokka', name: 'wickiwacka2' },
      { command: 'uwu', name: 'rizzwan.' },
      { command: 'boba', name: 'pepsi_pro' },
      { command: 'lyricwhiz', name: 'vipraz' },
    ];

    const embed = new EmbedBuilder()
      .setTitle('✨ Credits ✨')
      .setColor('#0099ff')
      .setDescription(
        'A big thank you to all the amazing contributors who helped make this bot possible!',
      )
      .setTimestamp()
      .setFooter({ text: 'Thanks to all the contributors!' });

    const guildCommands = await interaction.guild.commands.fetch();

    contributors.forEach((contributor) => {
      const command = guildCommands.find(
        (cmd) => cmd.name === contributor.command,
      );
      if (command) {
        embed.addFields([
          {
            name: `**${contributor.name}**`,
            value: `</${contributor.command}:${command.id}>`,
            inline: true,
          },
        ]);
      }
    });

    await interaction.reply({ embeds: [embed] });
  },
};
