const mongoose = require("mongoose");

const autoModConfigSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },

        // Main toggle
        enabled: {
            type: Boolean,
            default: false,
        },

        // Log channel for auto-mod actions
        logChannelId: {
            type: String,
            default: null,
        },

        // Spam detection
        spamDetection: {
            enabled: { type: Boolean, default: true },
            maxMessages: { type: Number, default: 5 }, // Max messages in timeWindow
            timeWindow: { type: Number, default: 5000 }, // Time window in ms (5 seconds)
            maxDuplicates: { type: Number, default: 3 }, // Max duplicate messages
            action: {
                type: String,
                enum: ["warn", "timeout", "kick", "ban", "delete"],
                default: "timeout",
            },
            timeoutDuration: { type: Number, default: 300000 }, // 5 minutes in ms
            deleteMessages: { type: Boolean, default: true },
        },

        // Mass mention protection
        massMention: {
            enabled: { type: Boolean, default: true },
            maxMentions: { type: Number, default: 5 }, // Max mentions per message
            action: {
                type: String,
                enum: ["warn", "timeout", "kick", "ban", "delete"],
                default: "timeout",
            },
            timeoutDuration: { type: Number, default: 600000 }, // 10 minutes in ms
            deleteMessages: { type: Boolean, default: true },
        },

        // Link filtering
        linkFilter: {
            enabled: { type: Boolean, default: false },
            whitelist: [{ type: String }], // Allowed domains
            action: {
                type: String,
                enum: ["warn", "timeout", "kick", "ban", "delete"],
                default: "delete",
            },
            deleteMessages: { type: Boolean, default: true },
        },

        // Invite link filtering
        inviteFilter: {
            enabled: { type: Boolean, default: true },
            action: {
                type: String,
                enum: ["warn", "timeout", "kick", "ban", "delete"],
                default: "delete",
            },
            deleteMessages: { type: Boolean, default: true },
        },

        // Bad words filter
        wordFilter: {
            enabled: { type: Boolean, default: false },
            words: [{ type: String }], // Blacklisted words
            action: {
                type: String,
                enum: ["warn", "timeout", "kick", "ban", "delete"],
                default: "delete",
            },
            deleteMessages: { type: Boolean, default: true },
        },

        // Caps lock detection
        capsFilter: {
            enabled: { type: Boolean, default: false },
            percentage: { type: Number, default: 70 }, // Percentage of caps
            minLength: { type: Number, default: 10 }, // Minimum message length
            action: {
                type: String,
                enum: ["warn", "delete"],
                default: "delete",
            },
            deleteMessages: { type: Boolean, default: true },
        },

        // Emoji spam
        emojiSpam: {
            enabled: { type: Boolean, default: false },
            maxEmojis: { type: Number, default: 10 },
            action: {
                type: String,
                enum: ["warn", "delete"],
                default: "delete",
            },
            deleteMessages: { type: Boolean, default: true },
        },

        // Ignored channels (auto-mod won't run in these)
        ignoredChannels: [{ type: String }],

        // Ignored roles (users with these roles bypass auto-mod)
        ignoredRoles: [{ type: String }],

        // Anti-raid settings
        antiRaid: {
            enabled: { type: Boolean, default: false },
            joinThreshold: { type: Number, default: 10 }, // Max joins in timeWindow
            timeWindow: { type: Number, default: 10000 }, // 10 seconds
            action: {
                type: String,
                enum: ["kick", "ban"],
                default: "kick",
            },
        },
    },
    {
        timestamps: true,
    },
);

const AutoModConfig = mongoose.model("AutoModConfig", autoModConfigSchema);

module.exports = AutoModConfig;
