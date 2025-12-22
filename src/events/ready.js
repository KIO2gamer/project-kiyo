const { Events } = require("discord.js");
const Logger = require("../utils/logger");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Log the bot's username and ID
        await Logger.bot(`Logged in as ${client.user.tag} (${client.user.id})`, "success");

        // Get guilds configured for deployment
        const guildIds = process.env.GUILDID
            ? process.env.GUILDID.split(",")
                  .map((id) => id.trim())
                  .filter(Boolean)
            : [];

        let guildInfo = "";
        if (guildIds.length > 0) {
            const deploymentGuilds = [];
            for (const guildId of guildIds) {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    deploymentGuilds.push(guild);
                }
            }

            if (deploymentGuilds.length > 0) {
                const guildNames = deploymentGuilds.map((g) => g.name).join(", ");
                guildInfo = `Deployment Guild${deploymentGuilds.length > 1 ? "s" : ""}: ${guildNames} (${deploymentGuilds.length})`;
                await Logger.bot(guildInfo);
            } else {
                await Logger.bot(
                    `Configured for guild deployment but not in any specified guilds`,
                    "warn",
                );
            }
        } else {
            await Logger.bot(
                `Global deployment mode - Connected to ${client.guilds.cache.size} server${client.guilds.cache.size !== 1 ? "s" : ""}`,
            );
        }

        // Log available commands
        await Logger.bot(`Loaded ${client.commands.size} commands`);

        // Send startup notification to Discord if log channel is configured
        const discordLogMessage =
            guildIds.length > 0
                ? `🚀 Bot started successfully!\n` +
                  `**Deployment Mode:** Guild-specific\n` +
                  `**Target Guilds:** ${guildIds.length}\n` +
                  `**Commands:** ${client.commands.size}`
                : `🚀 Bot started successfully!\n` +
                  `**Deployment Mode:** Global\n` +
                  `**Servers:** ${client.guilds.cache.size}\n` +
                  `**Users:** ${client.users.cache.size}\n` +
                  `**Commands:** ${client.commands.size}`;

        await Logger.logToDiscord(discordLogMessage, "success", "BOT");
    },
};
