const mongoose = require("mongoose");

const reactionRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    roles: [
        {
            emoji: { type: String, required: true },
            roleId: { type: String, required: true },
            description: { type: String, default: "" },
        },
    ],
});

module.exports = mongoose.model("ReactionRole", reactionRoleSchema);
