const { SlashCommandBuilder } = require('discord.js');
const handleOauth = require('./../../netlify/functions/handleOauth')
const OAuthCode = require('./../../bot_utils/OauthCode')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify_youtube')
        .setDescription('Verify your YouTube channel using Discord OAuth2.'),

    async execute(interaction) {
        try {
            const interactionId = interaction.id; // Use the interaction ID as state

            // Generate Discord OAuth2 URL for user authorization
            const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections&state=${interactionId}`;

            // Send OAuth link to the user in Discord (ephemeral = only the user will see it)
            await interaction.reply({
                content: `Please click [here](${discordOAuthUrl}) to authorize and fetch your YouTube connection.`,
                ephemeral: true,
            });

            // Poll MongoDB for the OAuth2 authorization code
            const oauthCode =
                await getAuthorizationCodeFromMongoDB(interactionId);

            // Use the OAuth2 code to fetch the YouTube connection
            const youtubeUrl = await handleOauth(oauthCode); // Implement this in the same way as in the Netlify function

            // Send an embed with the YouTube channel info after authorization
            const embed = {
                color: 0x0099ff,
                title: 'YouTube Channel Verified',
                description: `Your YouTube channel has been verified.\n[Visit Channel](${youtubeUrl})`,
            };

            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } catch (error) {
            // Handle any errors
            await interaction.followUp({
                content: `Error: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};

// Function to poll MongoDB for the OAuth2 code
async function getAuthorizationCodeFromMongoDB(interactionId) {
    const fetchTimeout = 60000; // 60 seconds timeout
    const pollingInterval = 3000; // Poll every 3 seconds

    let elapsedTime = 0;
    while (elapsedTime < fetchTimeout) {
        const oauthRecord = await OAuthCode.findOne({ interactionId });

        if (oauthRecord) {
            return oauthRecord.code; // Return the OAuth2 code
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        elapsedTime += pollingInterval;
    }

    throw new Error('Timeout waiting for authorization.');
}
