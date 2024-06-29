const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('donottouch')
    .setDescription('YOUR PC WILL GO BOOM-BOOM.'),
    category: 'fun',
    async execute(interaction) {
        await interaction.reply(`Oh? so you found the secret? well well well, its time for your pc to blow up.\nand also your discord acc is being reported for finding it illegally ||joke btw||\n||or maybe fr?||`);
    }
}