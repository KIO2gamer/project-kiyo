const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
	},
	guildId: {
		type: String,
		required: true,
	},
	messages: [
		{
			role: {
				type: String,
				enum: ['user', 'model'],
				required: true,
			},
			content: {
				type: String,
				required: true,
			},
			timestamp: {
				type: Date,
				default: Date.now
			}
		},
	],
	lastUpdated: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true // Adds createdAt and updatedAt fields
});

// Create compound index for faster lookups
chatHistorySchema.index({ userId: 1, guildId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
