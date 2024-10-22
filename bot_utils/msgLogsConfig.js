const mongoose = require('mongoose');

const msgLogsConfigSchema = new mongoose.Schema({
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
});

const MsgLogsConfig = mongoose.model('MsgLogsConfig', msgLogsConfigSchema);

module.exports = MsgLogsConfig;
