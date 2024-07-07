const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hi_bro')
        .setDescription('aiegjdj'),
    category: 'customCommands',
    async execute(interaction) {
        await interaction.reply('ok bozo')
    },
};
