/* eslint-disable no-self-assign */
/* eslint-disable no-undef */
const config = require('./../jest.config');
const path = require('path');

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Updated mock implementation
jest.mock('discord.js', () => {
    const mClient = {
        login: jest.fn().mockResolvedValue('logged in'),
        on: jest.fn(),
        user: {
            setPresence: jest.fn(),
        },
        commands: new (jest.fn(() => ({
            clear: jest.fn(),
            has: jest.fn(),
            set: jest.fn(),
        })))(),
        destroy: jest.fn(),
    };
    return {
        Client: jest.fn(() => mClient),
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
        REST: jest.fn(() => ({
            setToken: jest.fn().mockReturnThis(),
            put: jest.fn().mockResolvedValue(true),
        })),
        Routes: {
            applicationGuildCommands: jest.fn(),
        },
    };
});

// Mock fs module
jest.mock('fs', () => ({
    readdirSync: jest.fn().mockReturnValue([]),
    statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
}));

// Mock path module
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
    connection: {
        close: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

// Mock process.env
process.env = {
    ...process.env,
    DISCORD_TOKEN: 'mock-token',
    DISCORD_CLIENT_ID: 'mock-client-id',
    MONGODB_URI: 'mock-mongodb-uri',
    DISCORD_GUILD_IDS: 'guild1,guild2',
};

describe('Jest Configuration', () => {
    test('should have node as test environment', () => {
        expect(config.testEnvironment).toBe('node');
    });

    test('should be verbose', () => {
        expect(config.verbose).toBe(true);
    });
});

describe('Bot Startup', () => {
    let consoleOutput = [];
    const mockedLog = jest.fn((...args) => {
        consoleOutput.push(...args);
    });
    const originalLog = console.log;
    const originalError = console.error;

    beforeEach(() => {
        consoleOutput = [];
        console.log = mockedLog;
        console.error = mockedLog;
        jest.clearAllMocks();
    });

    afterEach(() => {
        console.log = originalLog;
        console.error = originalError;
    });

    afterAll(() => {
        mockExit.mockRestore();
    });

    test('should log bot startup message', async () => {
        const { Client } = require('discord.js');
        const client = new Client();

        // Ensure client.login resolves
        client.login.mockResolvedValueOnce('logged in');

        require('./../index');

        // Wait for all promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if the console output contains the startup message
        const containsStartupMessage = consoleOutput.some((item, index) => {
            return (
                consoleOutput[index] === '\x1b[32m%s\x1b[0m' &&
                consoleOutput[index + 1] === '[BOT] Bot is running!'
            );
        });

        expect(containsStartupMessage).toBe(true);
        expect(mockExit).not.toHaveBeenCalled();
    });
});
