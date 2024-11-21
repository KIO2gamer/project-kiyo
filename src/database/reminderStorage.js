const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
	userId: String,
	reminderMessage: String,
	reminderTime: Date,
	channelId: String,
	status: { type: String, default: 'pending' }, // 'pending' or 'sent'
});

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
