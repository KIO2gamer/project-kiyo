const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URL', 'CLIENT_ID'];
if (!requiredEnvVars.every(envVar => process.env[envVar])) {
	console.error(
		`Missing required environment variable(s): ${requiredEnvVars.filter(v => !process.env[v]).join(', ')}`
	);
	process.exit(1);
}

const { CLIENT_ID, DISCORD_TOKEN, GUILD_IDS = '' } = process.env;

const GUILD_ID_ARRAY = GUILD_IDS.split(',').filter(Boolean);

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.DirectMessagePolls,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Command & Event Handling
const loadItems = (type, dir) => {
	const items = fs.readdirSync(dir, { withFileTypes: true });
  
	for (const item of items) {
	  const fullPath = path.join(dir, item.name);
	  if (item.isDirectory()) {
		loadItems(type, fullPath);
	  } else if (item.isFile() && item.name.endsWith('.js')) {
		const loadedItem = require(fullPath);
		if (type === 'commands' && 'data' in loadedItem && 'execute' in loadedItem) {
		  client.commands.set(loadedItem.data.name, loadedItem);
		  loadedItem.data.aliases?.forEach(alias => client.commands.set(alias, loadedItem));
		} else if (type === 'events' && ['name', 'execute'].every(prop => prop in loadedItem)) {
		  client[loadedItem.once ? 'once' : 'on'](loadedItem.name, (...args) => loadedItem.execute(...args, client)); 
		} else {
		  console.warn(`[WARNING] The ${type} at ${fullPath} is missing required properties.`);
		}
	  }
	}
  };
  
  client.commands = new Collection();
  loadItems('commands', path.join(__dirname, 'commands'));
  loadItems('events', path.join(__dirname, 'events'));

// MongoDB connection
const connectToMongoDB = async () => {
	let retries = 5;
	while (retries > 0) {
		try {
			mongoose.set('strictQuery', false);
			await mongoose.connect(process.env.MONGODB_URL);
			console.log('Connected to MongoDB');
			return;
		} catch (error) {
			retries--;
			console.error(
				`Failed to connect to MongoDB (attempts left: ${retries}): ${error.message}`
			);
			if (retries > 0) {
				console.log(`Retrying in 5 seconds...`);
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		}
	}
	console.error('Exhausted all MongoDB connection attempts. Shutting down...');
	process.exit(1);
};

// Deploy commands
const deployCommands = async () => {
	const commands = Array.from(client.commands.values()).map(c => c.data.toJSON());

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		if (GUILD_ID_ARRAY.length === 0) {
			await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
			console.log('Successfully reset global commands.');
		}

		for (const guildId of GUILD_ID_ARRAY.length ? GUILD_ID_ARRAY : [null]) {
			const route = guildId
				? Routes.applicationGuildCommands(CLIENT_ID, guildId)
				: Routes.applicationCommands(CLIENT_ID);
			const data = await rest.put(route, { body: commands });
			console.log(
				`Successfully reloaded ${data.length} commands for ${guildId ? `guild ${guildId}` : 'globally'}.`
			);
		}
	} catch (error) {
		console.error('Error deploying commands:', error);
	}
};

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('Shutting down gracefully...');
	try {
		await mongoose.connection.close();
		client.destroy();
		console.log('Disconnected from MongoDB and Discord.');
		process.exit(0);
	} catch (error) {
		console.error('Error during shutdown:', error);
		process.exit(1);
	}
});

// Start the bot
(async () => {
	try {
		await connectToMongoDB();
		await deployCommands();
		await client.login(DISCORD_TOKEN);
	} catch (error) {
		console.error('Failed to start:', error);
		process.exit(1);
	}
})();
