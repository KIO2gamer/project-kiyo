const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_custom_command')
        .setDescription('Creates a new command')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The name of the new command')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The topic (description) of the new command')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('response')
                .setDescription('The response of the new command')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const response = interaction.options.getString('response');
        const description = interaction.options.getString('description');


        const commandTemplate = `
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${name}')
        .setDescription('${description}'),
    category: 'customCommands',
    async execute(interaction) {
        await interaction.reply('${response}');
    },
};
`;

        const commandFolderPath = path.join('C:\\Users\\KIO2gamer\\OneDrive\\Documents\\discordbot\\commands', 'customCommands');
        const commandFilePath = path.join(commandFolderPath, `${name}.js`);

        try {
            // Ensure the category folder exists
            if (!fs.existsSync(commandFolderPath)) {
                fs.mkdirSync(commandFolderPath, { recursive: true });
            }

            // Write the new command file
            fs.writeFileSync(commandFilePath, commandTemplate);
            await interaction.reply(`Command \`/${name}\` created with response: \`${response}\``);
        } catch (error) {
            console.error('Error writing command file:', error);
            await interaction.reply('There was an error creating the new command. Please try again.');
        }
    },
};
