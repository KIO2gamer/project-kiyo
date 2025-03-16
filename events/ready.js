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
                // Create a visually distinct startup section
                logger.section('BOT READY', 'INFO');

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

                // Display statistics in a table
                logger.table(
                    [
                        { metric: 'Guilds', value: guildCount },
                        { metric: 'Users', value: userCount },
                        { metric: 'Commands', value: commandCount },
                        { metric: 'Version', value: version },
                    ],
                    'Bot Statistics',
                    'INFO'
                );

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

                // Visual divider before technical information
                logger.divider();

                // Print memory usage if in debug mode
                if (process.env.LOG_LEVEL === 'DEBUG') {
                    const memoryUsage = process.memoryUsage();
                    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
                    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
                    const externalMB = Math.round(memoryUsage.external / 1024 / 1024);

                    logger.table(
                        [
                            { type: 'Heap Used', value: `${heapUsedMB} MB` },
                            { type: 'Heap Total', value: `${heapTotalMB} MB` },
                            { type: 'External', value: `${externalMB} MB` },
                            { type: 'Uptime', value: `${Math.round(process.uptime())} seconds` },
                        ],
                        'System Information',
                        'DEBUG'
                    );
                }

                // Show guild list in debug mode
                if (process.env.LOG_LEVEL === 'DEBUG') {
                    const guildList = Array.from(client.guilds.cache).map(([id, guild]) => ({
                        id: id,
                        name: guild.name,
                        members: guild.memberCount,
                    }));

                    if (guildList.length > 0) {
                        logger.table(guildList, 'Connected Guilds', 'DEBUG');
                    }
                }
            },
            'READY_EVENT',
            false
        );
    },
};
