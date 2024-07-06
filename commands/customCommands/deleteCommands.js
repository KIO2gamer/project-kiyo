const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');

const protectedCommands = [
    'chairhit', 'echo', 'kill', 'koifish', 'rickroll', 'donottouch', 'snipe', 'steel', 'summon', 
    'searchimage', 'minecraft', 'rule', 'help', 'botinfo', 'serverinfo', 'userinfo', 'viewroles', 
    'reactionstats', 'game', 'ban', 'kick', 'lock', 'purge', 'slowmode', 'timeout', 'unban', 
    'unlock', 'logs', 'warn', 'deletelog', 'tempban', 'editlog', 'modifychannel', 'embed', 
    'image', 'reload', 'topic', 'avatar', 'credits', 'ping', 'translate', 'weather', 'end_poll', 
    'fetch_poll_answers', 'create_poll', 'create_custom_command', 'delete_custom_command', 
    'edit_custom_command'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_custom_command')
        .setDescription('Deletes a custom command')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the command to delete')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const category = interaction.options.getString('category');

        if (protectedCommands.includes(name)) {
            return interaction.reply(`Command \`/${name}\` is protected and cannot be deleted.`);
        }

        const commandFilePath = path.join('C:\\Users\\KIO2gamer\\OneDrive\\Documents\\discordbot\\commands', 'customCommands', `${name}.js`);

        if (fs.existsSync(commandFilePath)) {
            try {
                fs.unlinkSync(commandFilePath);
                interaction.client.commands.delete(name);
                await interaction.reply(`Command \`/${name}\` has been deleted.`);
            } catch (error) {
                console.error('Error deleting command file:', error);
                await interaction.reply('There was an error deleting the command. Please try again.');
            }
        } else {
            await interaction.reply(`Command \`/${name}\` does not exist.`);
        }
    },
};
