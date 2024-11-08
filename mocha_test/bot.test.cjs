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
});
