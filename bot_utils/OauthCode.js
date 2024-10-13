const mongoose = require('mongoose');

const oauthCodeSchema = new mongoose.Schema({
    interactionId: { type: String, required: true },
    code: { type: String, required: true },
    youtubeChannelId: { type: String }, // Field to store YouTube channel ID
    createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires in 10 minutes
});

const OAuthCode = mongoose.model('OAuthCode', oauthCodeSchema);
module.exports = OAuthCode;
