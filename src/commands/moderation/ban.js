const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('ban'),
    async execute(interaction) {
        await interaction.reply('interaction provoked')
    }
}