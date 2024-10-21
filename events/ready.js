const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(
            `Bot is ready and operational. Logged in as ${client.user.tag}`,
        );
        console.log(`Serving ${client.guilds.cache.size} guilds`);
        console.log(`Watching ${client.channels.cache.size} channels`);
        console.log(`Observing ${client.users.cache.size} users`);
    },
};
