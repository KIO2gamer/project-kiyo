const mongoose = require('mongoose');

// Define AIChatChannel model
const AIChatChannel = mongoose.model('AIChatChannel', {
	guildId: String,
	channelId: String,
});

module.exports = AIChatChannel;
