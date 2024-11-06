const assert = require('assert');
const { Client, GatewayIntentBits } = require('discord.js');

let client = new Client({ intents: [GatewayIntentBits.Guilds] });

require('dotenv').config();

describe('Discord Bot', () => {
    before(async () => {
        await client.login(process.env.DISCORD_TOKEN);
    });

    after(() => {
        client.destroy();
    });

    it('should log in successfully', () => {
        assert(client.user !== null);
        assert.strictEqual(client.user.username, 'Kiyo');
    });

    it('should join a guild successfully', async () => {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        assert(guild !== null);
        assert.strictEqual(guild.name, 'testing server');
    });

    it('should fetch a user by ID', async () => {
        const user = await client.users.fetch(process.env.USER_ID);
        assert(user !== null);
        assert.strictEqual(user.username, 'KIO2gamer');
    });
});
