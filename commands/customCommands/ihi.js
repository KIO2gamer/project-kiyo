
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ihi')
        .setDescription('ikpsghade'),
    category: 'customCommands',
    async execute(interaction) {
        interaction.reply(2+4)
    },
};
