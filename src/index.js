require("dotenv").config();
const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");

const client = new Client({
	intents: [
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.User,
		Partials.GuildMember,
	],
});

client.once(Events.ClientReady, (clientReady) => {
	console.log(`Logged in as ${clientReady.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
