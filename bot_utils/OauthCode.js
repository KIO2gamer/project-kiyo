const mongoose = require('mongoose');

const oauthCodeSchema = new mongoose.Schema({
    interactionId: String,
    code: String,
    createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires in 10 minutes
});

module.exports = mongoose.model('OAuthCode', oauthCodeSchema);
