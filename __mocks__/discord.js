// __mocks__/discord.js
class MockEmbed {
    constructor() {
        this.data = {
            title: '',
            description: '',
            color: null,
            timestamp: null,
        };
    }

    setTitle(title) {
        this.data.title = title;
        return this;
    }

    setDescription(desc) {
        this.data.description = desc;
        return this;
    }

    setColor(color) {
        this.data.color = color;
        return this;
    }

    setTimestamp(timestamp) {
        this.data.timestamp = timestamp;
        return this;
    }
}

class MockSlashCommandBuilder {
    constructor() {
        this.name = '';
        this.description = '';
    }

    setName(name) {
        this.name = name;
        return this;
    }

    setDescription(desc) {
        this.description = desc;
        return this;
    }
}

module.exports = {
    EmbedBuilder: jest.fn(() => new MockEmbed()),
    SlashCommandBuilder: jest.fn(() => new MockSlashCommandBuilder()),
    ActionRowBuilder: jest.fn(() => ({
        addComponents: jest.fn().mockReturnThis(),
    })),
    ButtonBuilder: jest.fn(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
    })),
};
