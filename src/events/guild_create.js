const { Events } = require("discord.js");
const Logger = require("./../utils/logger");

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        Logger.log("GUILDS", `Joined new guild: ${guild.name} (${guild.id})`, "info");
    },
};
