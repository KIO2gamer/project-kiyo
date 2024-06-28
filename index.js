// const fs = require("node:fs");
// require("dotenv").config();
// const path = require("node:path");
// const { Client, Collection, GatewayIntentBits } = require("discord.js");
// const { default: mongoose } = require("mongoose");

// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions] });

// client.commands = new Collection();
// const foldersPath = path.join(__dirname, "commands");
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
//     const commandsPath = path.join(foldersPath, folder);
//     const commandFiles = fs
//         .readdirSync(commandsPath)
//         .filter((file) => file.endsWith(".js"));
//     for (const file of commandFiles) {
//         const filePath = path.join(commandsPath, file);
//         const command = require(filePath);
//         if ("data" in command && "execute" in command && "category" in command) {
//             client.commands.set(command.data.name, command);
//         } else {
//             console.log(
//                 `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
//             );
//         }
//     }
// }

// (async () => {
//     try {
//         mongoose.set("strictQuery", false);
//         await mongoose.connect(process.env.MONGODB_URL);
//         console.log("Connected to MongoDB");
//         const eventsPath = path.join(__dirname, "events");
//         const eventFiles = fs
//             .readdirSync(eventsPath)
//             .filter((file) => file.endsWith(".js"));

//         for (const file of eventFiles) {
//             const filePath = path.join(eventsPath, file);
//             const event = require(filePath);
//             if (event.once) {
//                 client.once(event.name, (...args) => event.execute(...args));
//             } else {
//                 client.on(event.name, (...args) => event.execute(...args));
//             }
//         }

//         client.login(process.env.DISCORD_TOKEN);
//     } catch (error) {
//         console.log(error);
//     }
// })();






const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URL'];
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
  ],
});

// Command collection
client.commands = new Collection();
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
      client.commands.set(command.data.name, command);
      if (command.data.aliases) {
        for (const alias of command.data.aliases) {
          client.commands.set(alias, command);
        }
      }
      console.log(`Registered command: ${command.data.name}`);
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Event handling
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`Registered event: ${event.name}`);
}

// MongoDB connection
async function connectToMongoDB(retries = 5) {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying to connect to MongoDB (${retries} attempts left)...`);
      setTimeout(() => connectToMongoDB(retries - 1), 5000);
    } else {
      console.error('Exhausted all retries. Shutting down...');
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
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
