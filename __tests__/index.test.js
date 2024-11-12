/* eslint-disable no-undef */
const config = require('../jest.config');

// Helper function to flush promises
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// Increase Jest timeout for async operations
jest.setTimeout(10000);

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Create a mock Client instance
const mockClient = {
    login: jest.fn().mockImplementation(() => {
        // Simulate successful login and trigger ready event
        setTimeout(() => {
            mockClient.emit('ready', mockClient);
        }, 0);
        return Promise.resolve('logged in');
    }),
    on: jest.fn(),
    emit: jest.fn(),
    user: {
        setPresence: jest.fn().mockResolvedValue(true),
    },
    commands: {
        clear: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        set: jest.fn(),
    },
    destroy: jest.fn(),
};

// Add event handling functionality to mockClient
mockClient.on = jest.fn((event, callback) => {
    mockClient.emit = (eventName, ...args) => {
        if (event === eventName) {
            callback(...args);
        }
    };
});

// Mock REST instance
const mockRest = {
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue(true),
};

// Mock discord.js
jest.mock('discord.js', () => {
    const REST = jest.fn(() => mockRest);
    REST.mockImplementation(() => mockRest);

    return {
        Client: jest.fn(() => mockClient),
        GatewayIntentBits: {
            Guilds: 'GUILDS',
            GuildMessages: 'GUILD_MESSAGES',
            MessageContent: 'MESSAGE_CONTENT',
            GuildMembers: 'GUILD_MEMBERS',
            DirectMessages: 'DIRECT_MESSAGES',
            GuildMessageReactions: 'GUILD_MESSAGE_REACTIONS',
            GuildVoiceStates: 'GUILD_VOICE_STATES',
        },
        Collection: jest.fn(() => ({
            clear: jest.fn(),
            has: jest.fn(),
            set: jest.fn(),
        })),
        Partials: {
            Message: 'MESSAGE',
            Channel: 'CHANNEL',
            Reaction: 'REACTION',
        },
        ActivityType: {
            Playing: 'PLAYING',
        },
        REST,
        Routes: {
            applicationGuildCommands: jest.fn().mockReturnValue('/mock/route'),
        },
    };
});

// Mock command file
const mockCommand = {
    data: {
        name: 'test',
        toJSON: () => ({ name: 'test' }),
        aliases: ['t'],
    },
    execute: jest.fn(),
};

// Mock fs module
jest.mock('fs', () => ({
    readdirSync: jest.fn().mockReturnValue(['test.js']),
    statSync: jest.fn().mockReturnValue({
        isDirectory: jest.fn().mockReturnValue(false),
    }),
}));

// Mock path module
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock mongoose
const mockMongoose = {
    connect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
    connection: {
        close: jest.fn().mockResolvedValue(undefined),
    },
};
jest.mock('mongoose', () => mockMongoose);

jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

// Mock command module
jest.mock('../commands/test.js', () => mockCommand, { virtual: true });

describe('Bot Implementation', () => {
    let consoleOutput = [];
    const mockedLog = jest.fn((...args) => {
        consoleOutput.push(...args);
    });
    const originalLog = console.log;
    const originalError = console.error;

    beforeEach(async () => {
        consoleOutput = [];
        console.log = mockedLog;
        console.error = mockedLog;

        // Reset all mocks
        jest.clearAllMocks();
        jest.resetModules();

        // Ensure mockClient.user exists and is properly configured
        mockClient.user = {
            ...mockClient.user,
            setPresence: jest.fn().mockResolvedValue(true),
        };

        // Set up environment variables
        process.env = {
            DISCORD_TOKEN: 'mock-token',
            DISCORD_CLIENT_ID: 'mock-client-id',
            MONGODB_URI: 'mock-mongodb-uri',
            DISCORD_GUILD_IDS: 'guild1,guild2',
        };

        // Wait for any pending promises
        await flushPromises();
    });

    afterEach(() => {
        console.log = originalLog;
        console.error = originalError;
    });

    afterAll(() => {
        mockExit.mockRestore();
    });

    describe('Environment Variables', () => {
        test('should exit if required environment variables are missing', async () => {
            process.env = {};
            require('../index');
            await flushPromises();
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('MongoDB Connection', () => {
        test('should connect to MongoDB successfully', async () => {
            require('../index');
            await flushPromises();
            expect(mockMongoose.connect).toHaveBeenCalledWith(
                'mock-mongodb-uri'
            );
        });

        test('should handle MongoDB connection error', async () => {
            mockMongoose.connect.mockRejectedValueOnce(
                new Error('Connection failed')
            );
            require('../index');
            await flushPromises();
            expect(consoleOutput).toContain('\x1b[31m%s\x1b[0m');
        });
    });

    describe('Command Loading', () => {
        test('should load commands successfully', async () => {
            const fs = require('fs');
            require('../index');
            await flushPromises();
            expect(fs.readdirSync).toHaveBeenCalled();
        });

        test('should handle duplicate command names', async () => {
            mockClient.commands.has.mockReturnValueOnce(true);
            require('../index');
            await flushPromises();
            expect(consoleOutput).toContain('\x1b[33m%s\x1b[0m');
        });
    });

    describe('Graceful Shutdown', () => {
        test('should handle SIGINT signal', async () => {
            require('../index');
            process.emit('SIGINT');
            await flushPromises();
            expect(mockMongoose.connection.close).toHaveBeenCalled();
        });
    });

    test('should handle deployment errors', async () => {
        // Mock a deployment error
        mockRest.put.mockRejectedValueOnce(new Error('Deployment failed'));

        require('../index');

        // Wait for error handling
        await Promise.all([
            flushPromises(),
            new Promise((resolve) => setTimeout(resolve, 100)),
        ]);

        expect(consoleOutput).toContain('\x1b[31m%s\x1b[0m');
    });
});

describe('Jest Configuration', () => {
    test('should have node as test environment', () => {
        expect(config.testEnvironment).toBe('node');
    });

    test('should be verbose', () => {
        expect(config.verbose).toBe(true);
    });

    test('should collect coverage from all relevant files', () => {
        expect(config.collectCoverageFrom).toEqual([
            '**/*.js',
            '!**/node_modules/**',
            '!**/vendor/**',
        ]);
    });
});
