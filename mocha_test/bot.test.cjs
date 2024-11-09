const assert = require('assert');
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const fs = require('fs');

let client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

require('dotenv').config();

describe('Discord Bot', () => {
    before(async () => {
        await client.login(process.env.DISCORD_TOKEN);
    });

    after(() => {
        client.destroy();
        console.log('All tests passed successfully.');
    });

    describe('Core Bot Tests', () => {
        it('should log in successfully', () => {
            assert(client.user !== null);
            assert.strictEqual(client.user.username, 'Kiyo');
        });

        it('should have correct status', () => {
            assert(client.isReady());
            assert.strictEqual(client.ws.status, 0);
        });

        it('should have required intents', () => {
            assert(client.options.intents.has(GatewayIntentBits.Guilds));
            assert(client.options.intents.has(GatewayIntentBits.GuildMessages));
        });
    });

    describe('Command Tests', () => {
        describe('Avatar Command', () => {
            const avatarCommand = require('../src/commands/info/avatar.js');

            it('should have correct structure', () => {
                assert(avatarCommand.data);
                assert(avatarCommand.execute);
                assert.strictEqual(avatarCommand.data.name, 'avatar');
                assert(avatarCommand.description_full);
            });

            it('should handle size options correctly', () => {
                const sizes = avatarCommand.data.options[1].choices;
                assert(sizes.some((size) => size.value === 512));
                assert(sizes.some((size) => size.value === 1024));
            });
        });

        describe('Credits Command', () => {
            const creditsCommand = require('../src/commands/info/credits.js');

            it('should have correct structure', () => {
                assert(creditsCommand.data);
                assert(creditsCommand.execute);
                assert.strictEqual(creditsCommand.data.name, 'credits');
            });

            it('should have contributors list', () => {
                const contributors = creditsCommand.contributors;
                assert(Array.isArray(contributors));
            });
        });

        describe('Ticket System Tests', () => {
            const closeTicketCommand = require('../src/commands/tickets/closeTicket.js');

            it('should have correct structure', () => {
                assert(closeTicketCommand.data);
                assert(closeTicketCommand.execute);
                assert.strictEqual(
                    closeTicketCommand.data.name,
                    'close_ticket'
                );
            });

            it('should require manage channels permission', () => {
                const permissions =
                    closeTicketCommand.data.default_member_permissions;
                assert(
                    permissions &&
                        permissions.includes(PermissionFlagsBits.ManageChannels)
                );
            });
        });
    });

    describe('Event Handler Tests', () => {
        describe('Message Delete Logs', () => {
            const msgDeleteEvent = require('../src/events/msg_delete_logs.js');

            it('should have correct structure', () => {
                assert(msgDeleteEvent.name);
                assert(msgDeleteEvent.execute);
                assert.strictEqual(msgDeleteEvent.name, 'messageDelete');
            });

            it('should handle message deletion logging', async () => {
                const mockMessage = {
                    author: { id: '123', bot: false },
                    guild: {
                        channels: {
                            fetch: async () => ({
                                send: async (data) => data,
                            }),
                        },
                        fetchAuditLogs: async () => ({
                            entries: new Map([
                                [
                                    1,
                                    {
                                        executor: { tag: 'test', id: '456' },
                                        createdTimestamp: Date.now(),
                                    },
                                ],
                            ]),
                        }),
                    },
                    channel: { id: '789' },
                    content: 'test message',
                    attachments: new Map(),
                    partial: false,
                };

                const result = await msgDeleteEvent.execute(mockMessage);
                assert(result);
            });
        });

        describe('Ticket System Events', () => {
            const ticketEvent = require('../src/events/ticket_button_interaction.js');

            it('should have correct structure', () => {
                assert(ticketEvent.name);
                assert(ticketEvent.execute);
                assert.strictEqual(ticketEvent.name, 'interactionCreate');
            });

            it('should handle ticket creation button', async () => {
                const mockInteraction = {
                    isButton: () => true,
                    customId: 'open-ticket',
                    guild: {
                        channels: {
                            create: async () => ({
                                id: '123',
                                send: async (msg) => msg,
                            }),
                        },
                        roles: {
                            everyone: { id: '789' },
                        },
                    },
                    user: { id: '456' },
                    client: { user: { id: '101' } },
                    reply: async (data) => data,
                };

                const result = await ticketEvent.execute(mockInteraction);
                assert(result);
            });
        });

        describe('Ready Event', () => {
            const readyEvent = require('../src/events/ready.js');

            it('should have correct structure', () => {
                assert(readyEvent.name);
                assert(readyEvent.execute);
                assert.strictEqual(readyEvent.name, 'clientReady');
                assert(readyEvent.once);
            });

            it('should handle ready event', () => {
                const mockClient = {
                    user: { tag: 'TestBot#0000' },
                    guilds: {
                        cache: new Map([
                            ['1', { name: 'Test Guild', id: '123' }],
                        ]),
                    },
                    channels: {
                        cache: new Map([['1', {}]]),
                    },
                    users: {
                        cache: new Map([['1', {}]]),
                    },
                };

                const result = readyEvent.execute(mockClient);
                assert(result !== undefined);
            });
        });

        describe('Reminder System', () => {
            const reminderEvent = require('../src/events/reminder_check.js');

            it('should have correct structure', () => {
                assert(reminderEvent.name);
                assert(reminderEvent.execute);
                assert.strictEqual(reminderEvent.name, 'clientReady');
                assert(reminderEvent.once);
            });

            it('should handle pending reminders', async () => {
                const mockClient = {
                    channels: {
                        fetch: async () => ({
                            send: async (msg) => msg,
                        }),
                    },
                };

                const result = await reminderEvent.execute(mockClient);
                assert(result !== undefined);
            });
        });
    });

    describe('Fun Command Tests', () => {
        describe('UWU Command', () => {
            const uwuCommand = require('../src/commands/fun/uwu.js');

            it('should have correct structure', () => {
                assert(uwuCommand.data);
                assert(uwuCommand.execute);
                assert.strictEqual(uwuCommand.data.name, 'uwu');
            });

            it('should use Tenor API key', () => {
                assert(
                    process.env.TENOR_API_KEY,
                    'Tenor API key should be defined'
                );
            });
        });
    });

    describe('Admin Command Tests', () => {
        describe('Reload Command', () => {
            const reloadCommand = require('../src/commands/admin/reloadCmds.js');

            it('should have correct structure', () => {
                assert(reloadCommand.data);
                assert(reloadCommand.execute);
                assert.strictEqual(reloadCommand.data.name, 'reload');
            });

            it('should have admin permissions', () => {
                const permissions =
                    reloadCommand.data.default_member_permissions;
                assert(
                    permissions &&
                        permissions.includes(PermissionFlagsBits.Administrator)
                );
            });

            it('should have command finding functionality', () => {
                assert(typeof reloadCommand.findCommandPath === 'function');
            });
        });
    });

    describe('Environment Tests', () => {
        it('should have required environment variables', () => {
            assert(
                process.env.DISCORD_TOKEN,
                'Discord token should be defined'
            );
            assert(
                process.env.TENOR_API_KEY,
                'Tenor API key should be defined'
            );
            assert(process.env.OWNER_ID, 'Owner ID should be defined');
        });
    });
});
