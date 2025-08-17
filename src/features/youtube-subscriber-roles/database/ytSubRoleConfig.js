const mongoose = require("mongoose");

const SubscriberTierSchema = new mongoose.Schema({
    minSubscribers: {
        type: Number,
        required: true,
        min: 0,
    },
    roleId: {
        type: String,
        required: true,
    },
    tierName: {
        type: String,
        required: true,
    },
});

const YTSubRoleConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    subscriberTiers: [SubscriberTierSchema],
    isEnabled: {
        type: Boolean,
        default: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: String,
        required: true,
    },
});

// Update the lastUpdated field before saving
YTSubRoleConfigSchema.pre("save", function (next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model("YTSubRoleConfig", YTSubRoleConfigSchema);
