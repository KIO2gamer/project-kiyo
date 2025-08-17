const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema(
    {
        // Basic guild information
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        guildName: {
            type: String,
            required: false,
        },

        // Prefix (if using alongside slash commands)
        prefix: {
            type: String,
            default: "!",
        },

        // Moderation settings
        moderation: {
            autoModEnabled: { type: Boolean, default: false },
            mutedRoleId: { type: String, default: null },
            moderationChannelId: { type: String, default: null },
            logActions: { type: Boolean, default: true },
            autoDeleteModCommands: { type: Boolean, default: false },
        },

        // Welcome settings
        welcome: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            message: { type: String, default: "Welcome {user} to {server}!" },
            dmEnabled: { type: Boolean, default: false },
            dmMessage: { type: String, default: "Welcome to {server}! Please read our rules." },
        },

        // Goodbye settings
        goodbye: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            message: { type: String, default: "Goodbye {user}! We hope to see you again." },
        },

        // Auto-role settings
        autorole: {
            enabled: { type: Boolean, default: false },
            roles: [{ type: String }],
        },

        // Logging settings
        logging: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            events: {
                messageDelete: { type: Boolean, default: true },
                messageEdit: { type: Boolean, default: true },
                memberJoin: { type: Boolean, default: true },
                memberLeave: { type: Boolean, default: true },
                memberBan: { type: Boolean, default: true },
                memberUnban: { type: Boolean, default: true },
                channelCreate: { type: Boolean, default: true },
                channelDelete: { type: Boolean, default: true },
                roleCreate: { type: Boolean, default: true },
                roleDelete: { type: Boolean, default: true },
            },
        },

        // Music settings
        music: {
            defaultVolume: { type: Number, default: 80 },
            djRoleId: { type: String, default: null },
            djOnly: { type: Boolean, default: false },
            announceSongs: { type: Boolean, default: true },
        },

        // Leveling system settings
        leveling: {
            enabled: { type: Boolean, default: true },
            xpRate: { type: Number, default: 1.0 },
            levelUpMessageType: {
                type: String,
                enum: ["public", "dm", "disabled"],
                default: "public",
            },
            levelUpChannelId: { type: String, default: null },
            roleRewards: [
                {
                    level: { type: Number, required: true },
                    roleId: { type: String, required: true },
                },
            ],
        },

        // Custom commands
        customCommands: [
            {
                name: { type: String, required: true },
                response: { type: String, required: true },
                allowedRoles: [{ type: String }],
                allowedChannels: [{ type: String }],
            },
        ],

        // Utility
        disabledCommands: [{ type: String }],
        disabledCategories: [{ type: String }],

        // Timestamps
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
    },
);

// Indexes for performance
guildSettingsSchema.index({ "leveling.enabled": 1 });

// Create model
const GuildSettingsSchema = mongoose.model("GuildSettings", guildSettingsSchema);

module.exports = { GuildSettingsSchema };
