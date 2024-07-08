
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asofih')
        .setDescription('asef'),
    category: 'customCommands',
    async execute(interaction) {
        await interaction.reply('hellouiasjohdaiudos')
    },
};
