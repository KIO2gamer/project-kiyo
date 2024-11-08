// Mock MongoDB connection
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(true),
    Schema: jest.fn().mockReturnValue({
        plugin: jest.fn(),
    }),
    model: jest.fn().mockReturnValue({
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
    }),
    set: jest.fn(),
}));

// Mock Discord.js classes
jest.mock('discord.js', () => ({
    Client: jest.fn().mockImplementation(() => ({
        login: jest.fn().mockResolvedValue('token'),
        destroy: jest.fn(),
    })),
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis(),
    })),
    EmbedBuilder: jest.fn().mockImplementation(() => ({
        setTitle: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setTimestamp: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        addFields: jest.fn().mockReturnThis(),
    })),
}));
