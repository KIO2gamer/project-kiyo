const mongoose = require("mongoose");

const oauthCodeSchema = new mongoose.Schema({
  interactionId: { type: String, required: true },
  code: { type: String, required: true },
  youtubeConnections: [
    {
      id: { type: String, required: true }, // YouTube channel ID
      name: { type: String, required: true }, // Optional: YouTube channel name
    },
  ],
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const OAuthCode = mongoose.model("OAuthCode", oauthCodeSchema);
module.exports = OAuthCode;
