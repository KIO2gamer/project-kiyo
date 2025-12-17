const mongoose = require("mongoose");

const commandStatsSchema = new mongoose.Schema({
    commandName: {
        type: String,
        required: true,
        index: true,
    },
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
    },
    success: {
        type: Boolean,
        required: true,
        default: true,
    },
    executionTime: {
        type: Number,
        default: 0, // in milliseconds
    },
    errorMessage: {
        type: String,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Compound indexes for efficient queries
commandStatsSchema.index({ commandName: 1, timestamp: -1 });
commandStatsSchema.index({ guildId: 1, timestamp: -1 });
commandStatsSchema.index({ timestamp: -1 });

module.exports = mongoose.model("CommandStats", commandStatsSchema);
