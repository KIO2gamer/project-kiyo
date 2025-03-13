const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Initialize client with appropriate intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  ws: {
    large_threshold: 250,
  },
  failIfNotExists: false,
  retryLimit: 5,
});

// Collections for bot data
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Collection();
client.startup = {
  time: Date.now(),
  modules: {
    commands: 0,
    events: 0,
  }
};

module.exports = client;
