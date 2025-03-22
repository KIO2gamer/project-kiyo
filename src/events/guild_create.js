const { Events } = require("discord.js");
const Logger = require("./../utils/logger");

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        Logger.log("GUILDS", `Joined new guild: ${guild.name} (${guild.id})`, "info");

        // Track recent server joins for dashboard
        if (!guild.client.recentJoins) {
            guild.client.recentJoins = [];
        }

        guild.client.recentJoins.unshift({
            guild: {
                name: guild.name,
                id: guild.id,
            },
            timestamp: Date.now(),
        });

        // Keep only last 10 server joins
        if (guild.client.recentJoins.length > 10) {
            guild.client.recentJoins.pop();
        }
    },
};
