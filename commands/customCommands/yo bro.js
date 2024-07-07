
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yo_bro')
        .setDescription('whats up'),
    category: 'customCommands',
    async execute(interaction) {
        await interaction.reply('whats up')
        await interaction.reply('pretty good myself')
    },
};
