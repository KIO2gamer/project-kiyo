const mongoose = require('mongoose');

const dashboardConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    dashboardId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    settings: {
        enabledWidgets: { type: [String], default: ['serverStats', 'memberCount', 'commandUsage'] },
        theme: { type: String, default: 'dark' },
        customization: {
            accentColor: { type: String, default: '#5865F2' },
            banner: { type: String, default: null }
        }
    },
    lastAccessed: { type: Date, default: null }
});

module.exports = mongoose.model('DashboardConfig', dashboardConfigSchema);