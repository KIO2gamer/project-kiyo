const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        try {
            console.log(
                '\x1b[32m%s\x1b[0m',
                `Bot is ready and operational. Logged in as ${client.user.tag}`
            );
            console.log(
                '\x1b[32m%s\x1b[0m',
                `Serving ${client.guilds.cache.size} guilds`
            );
            console.log(
                '\x1b[32m%s\x1b[0m',
                `Watching ${client.channels.cache.size} channels`
            );
            console.log(
                '\x1b[32m%s\x1b[0m',
                `Observing ${client.users.cache.size} users`
            );

            // Additional logging for more detailed information
            client.guilds.cache.forEach((guild) => {
                console.log(
                    '\x1b[34m%s\x1b[0m',
                    `- ${guild.name} (ID: ${guild.id})`
                );
            });

            console.log(
                '\x1b[32m%s\x1b[0m',
                'Bot is fully operational and ready to serve!'
            );
        } catch (error) {
            console.error(
                '\x1b[31m%s\x1b[0m',
                `Error during ready event: ${error.message}`
            );
        }
    },
};
