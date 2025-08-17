const mongoose = require("mongoose");

const botStatsSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    guilds: {
        type: Number,
        required: true,
    },
    users: {
        type: Number,
        required: true,
    },
    channels: {
        type: Number,
        required: true,
    },
    commands: {
        type: Number,
        required: true,
    },
    uptime: {
        type: Number,
        required: true,
    },
    memoryUsage: {
        used: Number,
        rss: Number,
        heapUsed: Number,
        heapTotal: Number,
        external: Number,
    },
    ping: {
        type: Number,
        required: true,
    },
    commandsExecuted: {
        type: Number,
        default: 0,
    },
});

// TTL index to automatically delete old stats after 30 days
botStatsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("BotStats", botStatsSchema);
