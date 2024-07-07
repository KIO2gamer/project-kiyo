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
        .setName('edit_custom_command')
        .setDescription('Edits the response or name of a custom command')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The current name of the command to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('newname')
                .setDescription('The new name for the command (leave blank to keep the current name)'))
        .addStringOption(option =>
            option.setName('response')
                .setDescription('The new response for the command (leave blank to keep the current response)')),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const newName = interaction.options.getString('newname')?.trim();
        const response = interaction.options.getString('response')?.trim();

        if (protectedCommands.includes(name)) {
            return interaction.reply(`Command \`/${name}\` is protected and cannot be edited.`);
        }

        let commandFilePath = path.join('C:\\Users\\KIO2gamer\\OneDrive\\Documents\\discordbot\\commands', 'customCommands', `${name}.js`);

        if (fs.existsSync(commandFilePath)) {
            try {
                let newCommandName = newName || name;
                let newResponse = response || (require(commandFilePath).data.description || 'No response set.');

                if (newName && newName !== name) {
                    // Check if the new name is protected
                    if (protectedCommands.includes(newName)) {
                        return interaction.reply(`Command \`/${newName}\` is protected and cannot be created.`);
                    }
                    
                    // Define the new file path for the command with the new name
                    const newCommandFilePath = path.join('C:\\Users\\KIO2gamer\\OneDrive\\Documents\\discordbot\\commands', 'customCommands', `${newName}.js`);
                    
                    // Rename the command file
                    fs.renameSync(commandFilePath, newCommandFilePath);
                    
                    // Update the command name for the new command file path
                    commandFilePath = newCommandFilePath;
                }
                
                const commandTemplate = `
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${newCommandName}')
        .setDescription('A dynamically created command'),
    category: 'customCommands',
    async execute(interaction) {
        ${newResponse}
    },
};
`;

                fs.writeFileSync(commandFilePath, commandTemplate);
                delete require.cache[require.resolve(commandFilePath)];
                const updatedCommand = require(commandFilePath);
                interaction.client.commands.set(updatedCommand.data.name, updatedCommand);
                await interaction.reply(`Command \`/${name}\` has been updated to \`/${newCommandName}\` with new response: \`${newResponse}\``);
            } catch (error) {
                console.error('Error editing command file:', error);
                await interaction.reply('There was an error editing the command. Please try again.');
            }
        } else {
            await interaction.reply(`Command \`/${name}\` does not exist.`);
        }
    },
};
