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
    },
  ],
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
