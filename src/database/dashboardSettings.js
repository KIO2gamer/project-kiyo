const mongoose = require("mongoose");

const dashboardSettingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    settings: {
        general: {
            status: {
                type: String,
                default: "online",
                enum: ["online", "idle", "dnd", "invisible"],
            },
            activity: {
                type: String,
                default: "with Discord.js",
            },
            activityType: {
                type: String,
                default: "Playing",
                enum: ["Playing", "Streaming", "Listening", "Watching", "Competing"],
            },
        },
        moderation: {
            autoMod: {
                type: Boolean,
                default: false,
            },
            defaultTimeout: {
                type: Number,
                default: 10,
                min: 1,
                max: 40320,
            },
            deleteCommands: {
                type: Boolean,
                default: false,
            },
            logChannel: {
                type: String,
                default: null,
            },
        },
        leveling: {
            enabled: {
                type: Boolean,
                default: true,
            },
            xpPerMessage: {
                type: Number,
                default: 15,
                min: 1,
                max: 100,
            },
            levelUpChannel: {
                type: String,
                default: "dm",
                enum: ["dm", "same", "disabled"],
            },
            levelRoles: {
                type: Boolean,
                default: false,
            },
        },
        youtube: {
            enabled: {
                type: Boolean,
                default: false,
            },
            tiers: [
                {
                    subscribers: {
                        type: Number,
                        required: true,
                    },
                    roleName: {
                        type: String,
                        required: true,
                    },
                    roleId: {
                        type: String,
                        default: null,
                    },
                },
            ],
        },
        logging: {
            level: {
                type: String,
                default: "INFO",
                enum: ["ERROR", "WARN", "INFO", "DEBUG"],
            },
            toFile: {
                type: Boolean,
                default: false,
            },
            commands: {
                type: Boolean,
                default: true,
            },
            errors: {
                type: Boolean,
                default: true,
            },
            discordChannel: {
                type: String,
                default: null,
            },
        },
    },
    updatedBy: {
        type: String,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("DashboardSettings", dashboardSettingsSchema);
