const mongoose = require("mongoose");

const oauthCodeSchema = new mongoose.Schema({
    interactionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    code: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    youtubeConnections: [
        {
            id: { type: String, required: true },
            name: { type: String, required: true },
            verified: { type: Boolean, default: false },
            subscriberCount: { type: Number, default: 0 },
            hiddenSubscriberCount: { type: Boolean, default: false },
        },
    ],
    userInfo: {
        id: { type: String, required: true },
        username: { type: String, required: true },
        discriminator: { type: String },
        avatar: { type: String },
        email: { type: String },
    },
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: false,
    },
    userAgent: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'expired'],
        default: 'pending',
    },
    scopes: {
        type: [String],
        default: ['identify', 'connections'],
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        index: { expireAfterSeconds: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
});

// Indexes for better performance
oauthCodeSchema.index({ guildId: 1, status: 1 });
oauthCodeSchema.index({ createdAt: 1 });

// Pre-save middleware to update status
oauthCodeSchema.pre('save', function(next) {
    if (this.isModified('youtubeConnections') && this.youtubeConnections.length > 0) {
        this.status = 'completed';
        this.completedAt = new Date();
    }
    next();
});

const OAuthCode = mongoose.model("OAuthCode", oauthCodeSchema);
module.exports = OAuthCode;
