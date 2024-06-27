const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`,
        );

        let data;
        if (process.env.GUILD_ID) {
            // For guild-based commands
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(
                `Successfully reloaded ${data.length} guild application (/) commands.`,
            );
        } else {
            // For global commands
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(
                `Successfully reloaded ${data.length} global application (/) commands.`,
            );
        }

    } catch (error) {
        console.error(error);

        // Add additional error information
        if (error.response && error.response.data) {
            console.error('Response data:', error.response.data);
        }
    }
})();

// Extra feature: Provide a summary of all commands
console.log('Commands being deployed:');
commands.forEach(command => {
    console.log(`- ${command.name}: ${command.description}`);
});
