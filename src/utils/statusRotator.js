const { ActivityType } = require("discord.js");

class StatusRotator {
    constructor(client) {
        this.client = client;
        this.currentIndex = 0;
        this.interval = null;

        this.statuses = [
            { name: "🤖 with Discord.js", type: ActivityType.Playing },
            { name: "👂 your commands", type: ActivityType.Listening },
            { name: "👀 over the server", type: ActivityType.Watching },
            { name: "❓ /help for commands", type: ActivityType.Playing },
            { name: "🎵 music and fun", type: ActivityType.Playing },
            { name: "📝 to your requests", type: ActivityType.Listening },
            { name: "🔍 for new members", type: ActivityType.Watching },
            { name: "🛡️ moderation tools", type: ActivityType.Playing },
        ];
    }

    start(intervalMs = 30000) {
        if (this.interval) this.stop();

        this.updateStatus();
        this.interval = setInterval(() => {
            this.updateStatus();
        }, intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateStatus() {
        if (!this.client.user) return;

        const status = this.statuses[this.currentIndex];
        this.client.user.setActivity(status.name, { type: status.type });

        this.currentIndex = (this.currentIndex + 1) % this.statuses.length;
    }

    addStatus(name, type = ActivityType.Playing) {
        this.statuses.push({ name, type });
    }

    setStatuses(newStatuses) {
        this.statuses = newStatuses;
        this.currentIndex = 0;
    }
}

module.exports = StatusRotator;
