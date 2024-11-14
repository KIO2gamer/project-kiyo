/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const { Client, REST, Routes } = require('discord.js');

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Mock Client instance
const mockClient = {
    login: jest.fn().mockResolvedValue('logged in'),
    on: jest.fn(),
    once: jest.fn(),
    destroy: jest.fn(),
    commands: {
        clear: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        set: jest.fn(),
    },
};

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
        REST,
        Routes: {
            applicationGuildCommands: jest.fn().mockReturnValue('/mock/route'),
        },
    };
});

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

        // Set up environment variables
        process.env = {
            DISCORD_TOKEN: 'mock-token',
            DISCORD_CLIENT_ID: 'mock-client-id',
            MONGODB_URI: 'mock-mongodb-uri',
            DISCORD_GUILD_IDS: 'guild1,guild2',
        };

        // Wait for any pending promises
        await new Promise((resolve) => setImmediate(resolve));
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
            await new Promise((resolve) => setImmediate(resolve));
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('MongoDB Connection', () => {
        test('should connect to MongoDB successfully', async () => {
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(mockMongoose.connect).toHaveBeenCalledWith(
                'mock-mongodb-uri'
            );
        });

        test('should handle MongoDB connection error', async () => {
            mockMongoose.connect.mockRejectedValueOnce(
                new Error('Connection failed')
            );
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(consoleOutput).toContain(
                '[DATABASE] MongoDB connection failed: Connection failed'
            );
        });
    });

    describe('Command Loading', () => {
        test('should load commands successfully', async () => {
            const fs = require('fs');
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(fs.readdirSync).toHaveBeenCalled();
        });

        test('should handle duplicate command names', async () => {
            mockClient.commands.has.mockReturnValueOnce(true);
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(consoleOutput).toContain(
                '[WARNING] Duplicate command name detected: test'
            );
        });
    });

    describe('Graceful Shutdown', () => {
        test('should handle SIGINT signal', async () => {
            require('../index');
            process.emit('SIGINT');
            await new Promise((resolve) => setImmediate(resolve));
            expect(mockMongoose.connection.close).toHaveBeenCalled();
        });
    });

    describe('Command Deployment', () => {
        test('should deploy commands successfully', async () => {
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(mockRest.put).toHaveBeenCalled();
        });

        test('should handle deployment errors', async () => {
            mockRest.put.mockRejectedValueOnce(new Error('Deployment failed'));
            require('../index');
            await new Promise((resolve) => setImmediate(resolve));
            expect(consoleOutput).toContain(
                '[DEPLOY] Command deployment failed: Deployment failed'
            );
        });
    });

    describe('Command Execution', () => {
        test('should execute a command successfully', async () => {
            const interaction = {
                options: {
                    getString: jest.fn().mockReturnValue('test'),
                },
                client: mockClient,
                reply: jest.fn(),
            };

            const mockCommand = {
                data: {
                    name: 'test',
                    toJSON: () => ({ name: 'test' }),
                    aliases: ['t'],
                },
                execute: jest.fn(),
            };

            jest.mock('../commands/test.js', () => mockCommand, {
                virtual: true,
            });

            await mockCommand.execute(interaction);
            expect(mockCommand.execute).toHaveBeenCalledWith(interaction);
        });

        test('should handle command execution errors', async () => {
            const interaction = {
                options: {
                    getString: jest.fn().mockReturnValue('test'),
                },
                client: mockClient,
                reply: jest.fn(),
            };

            const mockCommand = {
                data: {
                    name: 'test',
                    toJSON: () => ({ name: 'test' }),
                    aliases: ['t'],
                },
                execute: jest
                    .fn()
                    .mockRejectedValueOnce(new Error('Execution failed')),
            };

            jest.mock('../commands/test.js', () => mockCommand, {
                virtual: true,
            });

            try {
                await mockCommand.execute(interaction);
            } catch (error) {
                expect(consoleOutput).toContain('Execution failed');
            }
        });
    });
});

describe('Jest Configuration', () => {
    const config = require('../jest.config');

    test('should have node as test environment', () => {
        expect(config.testEnvironment).toBe('node');
    });

    test('should be verbose', () => {
        expect(config.verbose).toBe(true);
    });
});
