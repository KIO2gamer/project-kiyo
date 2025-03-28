const { Client, GatewayIntentBits, Events } = require("discord.js")
const { token } = require('../config.json')

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers
    ]
})

client.once(Events.ClientReady, clientReady => {
    console.log(`Logged in as ${clientReady.user.tag}`)
})

client.login(token)