const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config()

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
                .setDescription('The response of the new command (or the whole code under the async execute() function)')
                .setRequired(true)),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        const response = interaction.options.getString('response');
        const description = interaction.options.getString('description');

        if (name.includes(' ')) {
            return interaction.reply('Please provide a valid name with no spaces (Use underscores instead).');
        }

        const commandTemplate = `
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${name}')
        .setDescription('${description}'),
    category: 'customCommands',
    async execute(interaction) {
        ${response}
    },
};
`;

        const commandFolderPath = path.join(__dirname);
        const commandFilePath = path.join(commandFolderPath, `${name}.js`);

        try {
            // Ensure the category folder exists
            if (!fs.existsSync(commandFolderPath)) {
                fs.mkdirSync(commandFolderPath, { recursive: true });
            }

            // Write the new command file
            fs.writeFileSync(commandFilePath, commandTemplate);

            // Deploy commands
            await deployCommands();

            await interaction.reply(`Command \`/${name}\` created with response: \`${response}\``);
        } catch (error) {
            console.error('Error writing command file:', error);
            await interaction.reply('There was an error creating the new command. Please try again.');
        }
    },
};

async function deployCommands() {
    const commands = [];
    const commandFolders = fs.readdirSync(path.join(__dirname, '..'));

    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(path.join(__dirname, '..', folder)).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(__dirname, '..', folder, file));
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}
