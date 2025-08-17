const mongoose = require("mongoose");

const TempOAuth2Schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // Auto-delete after 1 hour
    },
});

module.exports = mongoose.model("TempOAuth2", TempOAuth2Schema);
