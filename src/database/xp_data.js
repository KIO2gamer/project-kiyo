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
});

// Create compound index for faster queries
levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Create model
const LevelSchema = mongoose.model("Level", levelSchema);

module.exports = { LevelSchema };
