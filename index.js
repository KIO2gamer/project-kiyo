const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");

// Validate environment variables
const requiredEnvVars = ["DISCORD_TOKEN", "MONGODB_URL"];
requiredEnvVars.forEach((envVar) => {
	if (!process.env[envVar]) {
		console.error(`Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
});

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessagePolls,
	],
});

// Command collection
client.commands = new Collection();
const loadCommands = (dir) => {
	const commandFiles = fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const command = require(path.join(dir, file));
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
			if (command.data.aliases) {
				for (const alias of command.data.aliases) {
					client.commands.set(alias, command);
				}
			}
			console.log(`Registered command: ${command.data.name}`);
		} else {
			console.warn(
				`[WARNING] The command at ${path.join(dir, file)} is missing a required "data" or "execute" property.`,
			);
		}
	}
};

const commandFolders = fs.readdirSync(path.join(__dirname, "commands"));
for (const folder of commandFolders) {
	loadCommands(path.join(__dirname, "commands", folder));
}

// Event handling
const loadEvents = (dir) => {
	const eventFiles = fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".js"));

	for (const file of eventFiles) {
		const event = require(path.join(dir, file));
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
		console.log(`Registered event: ${event.name}`);
	}
};

loadEvents(path.join(__dirname, "events"));

// MongoDB connection
async function connectToMongoDB(retries = 5) {
	try {
		mongoose.set("strictQuery", false);
		await mongoose.connect(process.env.MONGODB_URL);
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error(`Failed to connect to MongoDB: ${error.message}`);
		if (retries > 0) {
			console.log(
				`Retrying to connect to MongoDB (${retries} attempts left)...`,
			);
			setTimeout(() => connectToMongoDB(retries - 1), 5000);
		} else {
			console.error("Exhausted all retries. Shutting down...");
			process.exit(1);
		}
	}
}

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");
	await mongoose.connection.close();
	client.destroy();
	process.exit(0);
});

// Login to Discord and start the bot
(async () => {
	try {
		await connectToMongoDB();
		await client.login(process.env.DISCORD_TOKEN);
	} catch (error) {
		console.error(`Failed to start the bot: ${error.message}`);
		process.exit(1);
	}
})();
