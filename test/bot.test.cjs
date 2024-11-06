const { expect } = require('chai');
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
        expect(client.user).to.not.be.null;
        expect(client.user.username).to.equal('Kiyo');
    });

    it('should join a guild successfully', async () => {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        expect(guild).to.not.be.null;
        expect(guild.name).to.equal('testing server');
    });

    it('should fetch a user by ID', async () => {
        const user = await client.users.fetch(process.env.USER_ID);
        expect(user).to.not.be.null;
        expect(user.username).to.equal('KIO2gamer');
    });
});
