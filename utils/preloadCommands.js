const fs = require("fs");
const path = require("path");

const commandFolders = ['fun', 'info', 'logs', 'moderation', 'utility'];
const commandsCache = {};

const preloadCommands = async (client) => {
    for (const folder of commandFolders) {
        const folderPath = path.join("C:\\Users\\KIO2gamer\\OneDrive\\Documents\\discordbot\\commands", `${folder}`);
        if (!fs.existsSync(folderPath)) {
            console.error(`Directory ${folderPath} does not exist`);
            continue;
        }

        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        const commands = [];

        for (const file of files) {
            const command = require(path.join(folderPath, file));
            const name = command.data.name;

            try {
                const commandId = await client.guilds.cache.first().commands.fetch()
                    .then(cmds => cmds.find(cmd => cmd.name === name)?.id);

                if (commandId) {
                    commands.push({ name, id: commandId, description: command.data.description });
                }
            } catch (error) {
                console.error(`Error fetching ID for ${name}: ${error.message}`);
            }
        }

        commandsCache[folder] = commands;
    }
};

module.exports = { preloadCommands, commandsCache };
