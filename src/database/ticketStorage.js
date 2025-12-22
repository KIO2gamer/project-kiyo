const mongoose = require("mongoose");

const ticketStorageSchema = new mongoose.Schema({
    ticketId: String, // unique identifier for the ticket
    guildId: String,
    userId: String,
    channelId: String,
    subject: { type: String, default: "No subject" },
    status: { type: String, enum: ["open", "closed", "archived"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    assignedStaff: [String], // Array of staff member IDs
    createdAt: { type: Date, default: Date.now },
    closedAt: Date,
    closedBy: String,
    closeReason: String,
    messageCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("TicketStorage", ticketStorageSchema);
