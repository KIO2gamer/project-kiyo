const mongoose = require("mongoose");

const commandPermissionsSchema = new mongoose.Schema({
    commandName: {
        type: String,
        required: true,
        unique: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    permissions: {
        roles: {
            type: Map,
            of: Boolean,
            default: new Map(),
        },
        users: {
            type: Map,
            of: Boolean,
            default: new Map(),
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field on save
commandPermissionsSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("CommandPermissions", commandPermissionsSchema);
