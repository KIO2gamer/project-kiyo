
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yo')
        .setDescription('yo'),
    category: 'customCommands',
    async execute(interaction) {
        interaction.reply('yo')
    },
};
