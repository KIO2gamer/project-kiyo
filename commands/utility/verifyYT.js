const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    description_full: '',
    usage: '',
    examples: [

    ],
    data: new SlashCommandBuilder()
        .setName('verify_youtube')
        .setDescription('verify youtube channel'),
    category: 'utility',
    async execute(interaction) {
        const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections`;

        await interaction.reply({
            content: `Please click [here](${discordOAuthUrl}) to authorize and fetch your YouTube connection.`,
            ephemeral: true,
        });
    }
}