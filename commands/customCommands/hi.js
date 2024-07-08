
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hi')
        .setDescription('dasf'),
    category: 'customCommands',
    async execute(interaction) {
        await interaction.reply({ content: 'hellow', ephemeral: true })
    },
};
