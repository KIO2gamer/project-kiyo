const { expect } = import('chai');
const { Client, Intents } = import('discord.js');

require('dotenv').config();

describe('Discord Bot', () => {
    let client;

    before(async () => {
        client = new Client({ intents: [Intents.FLAGS.GUILDS] });
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
