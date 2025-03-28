require('dotenv').config()
const { Client, GatewayIntentBits, Events } = require("discord.js")

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers
    ]
})

client.once(Events.ClientReady, clientReady => {
    console.log(`Logged in as ${clientReady.user.tag}`)
})

client.login(process.env.DISCORD_TOKEN)