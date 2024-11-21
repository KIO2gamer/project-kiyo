const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  description_full:
    'Unleash a mesmerizing (and slightly nutty) koi fish GIF upon the unsuspecting populace of your Discord server.',
  usage: '/koifish',
  examples: ['/koifish'],
  category: 'fun',
  data: new SlashCommandBuilder().setName('koifish').setDescription('Fish'),

  async execute(interaction) {
    interaction.reply(
      'https://tenor.com/view/schizoaz-lil-koi-big-nuts-lil-gif-18596477',
    );
  },
};
