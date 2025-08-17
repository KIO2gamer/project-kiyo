const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    discriminator: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    guildName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['command_used', 'joined_server', 'left_server', 'level_up', 'role_added', 'role_removed', 'message_sent']
    },
    commandName: {
        type: String,
        default: null
    },
    details: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
userActivitySchema.index({ timestamp: -1 });
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ guildId: 1, timestamp: -1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);