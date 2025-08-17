const { Events } = require("discord.js");
const PresenceManager = require("../utils/presenceManager");
const Logger = require("../utils/logger");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // Log the bot's username and ID
        Logger.log("BOT", `Logged in as ${client.user.tag} (${client.user.id})`);
    },
};
