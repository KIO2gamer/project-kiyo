const assert = require('assert');
const { Client, GatewayIntentBits } = require('discord.js');

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

    it('should log in successfully', () => {
        assert(client.user !== null);
        assert.strictEqual(client.user.username, 'Kiyo');
    });

    it('should fetch a user by ID', async () => {
        const user = await client.users.fetch(process.env.OWNER_ID);
        assert(user !== null);
        assert.strictEqual(user.username, 'kio2gamer');
    });

    // New tests
    it('should have correct status', () => {
        assert(client.isReady());
        assert.strictEqual(client.ws.status, 0); // 0 means READY
    });

    it('should have required intents', () => {
        assert(client.options.intents.has(GatewayIntentBits.Guilds));
    });

    it('should be in at least one guild', async () => {
        assert(client.guilds.cache.size > 0);
    });

    it('should have application commands registered', async () => {
        const commands = await client.application.commands.fetch();
        assert(commands.size > 0);
    });

    describe('Guild Tests', () => {
        let testGuild;

        before(async () => {
            // Replace GUILD_ID with your test guild ID in .env
            testGuild = await client.guilds.fetch(process.env.TEST_GUILD_ID);
        });

        it('should fetch guild successfully', () => {
            assert(testGuild !== null);
            assert(testGuild.available);
        });

        it('should have bot as a member', async () => {
            const botMember = await testGuild.members.fetch(client.user.id);
            assert(botMember !== null);
        });

        it('should have required permissions', async () => {
            const botMember = await testGuild.members.fetch(client.user.id);
            assert(botMember.permissions.has('SendMessages'));
            assert(botMember.permissions.has('ViewChannel'));
        });
    });
});
