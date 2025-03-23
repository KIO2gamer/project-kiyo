const { Events } = require("discord.js");
const PresenceManager = require("../utils/presenceManager");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // Log the bot's username and ID
        console.log(`Logged in as ${client.user.tag} (${client.user.id})`);
    },
};
