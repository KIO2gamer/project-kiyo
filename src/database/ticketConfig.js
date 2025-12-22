const mongoose = require("mongoose");

const ticketConfigSchema = new mongoose.Schema({
    guildId: String,
    ticketCategoryId: String,
    maxOpenTickets: { type: Number, default: 5 },
    autoCloseTime: { type: Number, default: 0 }, // 0 = disabled, in hours
    supportRoleId: String, // Role that gets pinged on new tickets
    ticketPrefix: { type: String, default: "ticket" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TicketConfig", ticketConfigSchema);
