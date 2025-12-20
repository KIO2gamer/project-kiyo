const mongoose = require("mongoose");

const msgLogsConfigSchema = new mongoose.Schema(
    {
        guildId: { type: String, required: true, unique: true },

        // Legacy default channel for all message logs (kept for backward compatibility)
        channelId: { type: String },

        // Map of eventKey -> channelId so each event can be routed to a different channel
        channels: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: true,
    },
);

// Convenience helper to resolve the best channel for a given event key
msgLogsConfigSchema.methods.resolveChannelId = function resolveChannelId(eventKey) {
    if (this.channels && (this.channels.get?.(eventKey) || this.channels[eventKey])) {
        return this.channels.get?.(eventKey) || this.channels[eventKey];
    }
    return this.channelId || null; // Fallback to legacy default
};

const MsgLogsConfig = mongoose.model("MsgLogsConfig", msgLogsConfigSchema);

module.exports = MsgLogsConfig;
