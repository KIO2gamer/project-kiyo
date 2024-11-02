const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    userId: {
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
            embedding: {
                type: [Number],
            },
        },
    ],
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
