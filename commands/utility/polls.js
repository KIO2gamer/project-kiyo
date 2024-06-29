const { SlashCommandBuilder, PollLayoutType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('The question of the poll')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('answer1')
                .setDescription('The answer of the poll')
                .setRequired(true)),
    category: 'utility',
    async execute(interaction) {
        
    }
}