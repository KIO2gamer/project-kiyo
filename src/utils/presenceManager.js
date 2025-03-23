const { ActivityType } = require("discord.js");
const Logger = require("./logger");

class PresenceManager {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.currentIndex = 0;
        this.interval = null;
    }

    /**
     * Converts string activity type to Discord.js ActivityType
     * @param {string} typeString Activity type string
     * @returns {number} Discord.js ActivityType
     */
    getActivityType(typeString) {
        const types = {
            Playing: ActivityType.Playing,
            Streaming: ActivityType.Streaming,
            Listening: ActivityType.Listening,
            Watching: ActivityType.Watching,
            Custom: ActivityType.Custom,
            Competing: ActivityType.Competing,
        };

        return types[typeString] || ActivityType.Playing;
    }

    /**
     * Updates the bot's presence
     * @param {Object} presenceData Presence configuration
     */
    updatePresence(presenceData) {
        const { activity, status } = presenceData;

        try {
            this.client.user.setPresence({
                activities: [
                    {
                        name: activity.name,
                        type: this.getActivityType(activity.type),
                        ...(activity.details && { details: activity.details }),
                        ...(activity.state && { state: activity.state }),
                    },
                ],
                status: status,
            });
        } catch (error) {
            Logger.error(`Failed to update presence: ${error.message}`);
        }
    }

    /**
     * Start the dynamic presence rotation
     */
    startRotation() {
        // Set initial static presence
        this.updatePresence(this.config.presence.static);

        // Set up dynamic presence rotation if enabled
        if (this.config.presence.dynamic && this.config.presence.dynamic.enabled) {
            this.interval = setInterval(() => {
                const randomActivity =
                    this.config.presence.dynamic.activities[
                        Math.floor(Math.random() * this.config.presence.dynamic.activities.length)
                    ];

                const randomStatus =
                    this.config.presence.dynamic.statusOptions[
                        Math.floor(
                            Math.random() * this.config.presence.dynamic.statusOptions.length,
                        )
                    ];

                this.updatePresence({
                    status: randomStatus,
                    activity: randomActivity,
                });
            }, this.config.presence.dynamic.intervalMs);

            Logger.log("PRESENCE", "Dynamic presence rotation started");
        }
    }

    /**
     * Stop the presence rotation
     */
    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            Logger.log("PRESENCE", "Dynamic presence rotation stopped");
        }
    }
}

module.exports = PresenceManager;
