const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { version } = require('../package.json');
const errorHandler = require('../utils/errorHandler');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        await errorHandler.wrap(
            async () => {
                // Log successful startup with detailed information
                logger.info(
                    `Bot is ready! Logged in as ${client.user.tag} (${client.user.id})`,
                    'READY'
                );

                // Gather statistics
                const guildCount = client.guilds.cache.size;
                const userCount = client.guilds.cache.reduce(
                    (acc, guild) => acc + guild.memberCount,
                    0
                );
                const commandCount = client.commands?.size || 0;

                // Log bot statistics
                logger.info(`Serving ${guildCount} guilds and ${userCount} users`, 'STATS');
                logger.info(`Loaded ${commandCount} commands`, 'STATS');

                // Set custom status
                try {
                    await client.user.setPresence({
                        activities: [
                            {
                                name: `/help | v${version}`,
                                type: ActivityType.Playing,
                            },
                        ],
                        status: 'online',
                    });
                    logger.debug('Bot presence updated successfully', 'READY');
                } catch (error) {
                    logger.warn('Failed to update bot presence', 'READY');
                }

                // Print memory usage if in debug mode
                if (process.env.LOG_LEVEL === 'DEBUG') {
                    const memoryUsage = process.memoryUsage();
                    logger.debug(
                        `Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                        'MEMORY'
                    );
                }
            },
            'READY_EVENT',
            false
        );
    },
};
