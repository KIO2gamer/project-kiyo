const { Events } = require("discord.js");
const PresenceManager = require("../utils/presenceManager");
const Logger = require("../utils/logger");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Log the bot's username and ID
        await Logger.bot(`Logged in as ${client.user.tag} (${client.user.id})`, "success");
        
        // Log bot statistics
        await Logger.bot(`Connected to ${client.guilds.cache.size} servers with ${client.users.cache.size} users`);
        
        // Log available commands
        await Logger.bot(`Loaded ${client.commands.size} commands`);
        
        // Send startup notification to Discord if log channel is configured
        await Logger.logToDiscord(
            `🚀 Bot started successfully!\n` +
            `**Servers:** ${client.guilds.cache.size}\n` +
            `**Users:** ${client.users.cache.size}\n` +
            `**Commands:** ${client.commands.size}`,
            "success",
            "BOT"
        );
    },
};
