const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    xp: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 0,
    },
    totalXp: {
        type: Number,
        default: 0,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    voiceTime: {
        type: Number,
        default: 0,
    }, // Voice time in minutes
    // Daily bonus and streak system
    dailyStreak: {
        type: Number,
        default: 0,
    },
    lastDailyClaimAt: {
        type: Date,
        default: null,
    },
    totalDailyBonuses: {
        type: Number,
        default: 0,
    },
    // XP boost system
    xpBoost: {
        multiplier: {
            type: Number,
            default: 1.0,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    // Voice channel tracking
    voiceJoinedAt: {
        type: Date,
        default: null,
    },
    voiceChannelId: {
        type: String,
        default: null,
    },
    // Achievement tracking
    achievements: {
        type: [String],
        default: [],
    },
    // Activity stats
    messageCount: {
        type: Number,
        default: 0,
    },
    voiceSessions: {
        type: Number,
        default: 0,
    },
});

// Create compound index for faster queries
levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Create model
const LevelSchema = mongoose.model("Level", levelSchema);

module.exports = { LevelSchema };
