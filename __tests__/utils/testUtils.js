const createMockInteraction = (options = {}) => ({
    options: {
        getString: jest.fn(),
        getInteger: jest.fn(),
        getBoolean: jest.fn(),
        getUser: jest.fn(),
        getChannel: jest.fn(),
        ...options.options,
    },
    editReply: jest.fn().mockResolvedValue({}),
    reply: jest.fn().mockResolvedValue({}),
    deferReply: jest.fn().mockResolvedValue({}),
    user: { id: 'testUserId', ...options.user },
    guild: { id: 'testGuildId', ...options.guild },
    channel: { id: 'testChannelId', ...options.channel },
    ...options,
});

const createMockClient = (options = {}) => ({
    commands: new Map(),
    users: {
        fetch: jest.fn(),
    },
    guilds: {
        fetch: jest.fn(),
    },
    ...options,
});

module.exports = {
    createMockInteraction,
    createMockClient,
};
