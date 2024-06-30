const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_IDS = process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',') : [];

if (!CLIENT_ID || !DISCORD_TOKEN) {
	console.error('Missing CLIENT_ID or DISCORD_TOKEN in .env file.');
	process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if (command.data && command.execute) {
			commands.push(command.data.toJSON());
		} else {
			console.warn(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`
		);

		// Reset global commands (if needed)
		await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
		console.log('Successfully reset global commands.');

		// Deploy commands to specific guilds
		for (const guildId of GUILD_IDS) {
			try {
				const data = await rest.put(
					Routes.applicationGuildCommands(CLIENT_ID, guildId),
					{ body: commands }
				);
				console.log(
					`Successfully reloaded ${data.length} commands for guild ${guildId}.`
				);
			} catch (error) {
				console.error(
					`Failed to deploy commands for guild ${guildId}:`,
					error
				);
			}
		}
	} catch (error) {
		console.error('Error deploying commands:', error);
	}
})();
