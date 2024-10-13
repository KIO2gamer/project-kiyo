const { SlashCommandBuilder } = require('discord.js');
const OAuthCode = require('./../../bot_utils/OauthCode');
const RoleSchema = require('./../../bot_utils/roleStorage');
const { google } = require('googleapis');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY, // Your YouTube API key
});

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

            // Poll MongoDB for the OAuth2 authorization code and YouTube channel ID
            const oauthData =
                await getAuthorizationDataFromMongoDB(interactionId);

            // Check if YouTube channel ID was returned
            if (oauthData.youtubeChannelId) {
                const youtubeChannelId = oauthData.youtubeChannelId;

                // Fetch the subscriber count from YouTube Data API v3
                const subscriberCount =
                    await getYouTubeSubscriberCount(youtubeChannelId);

                if (subscriberCount !== null) {
                    // Determine and assign the appropriate role based on the subscriber count
                    const assignedRole = await assignSubscriberRole(
                        interaction.member,
                        subscriberCount,
                    );

                    // Send success message with YouTube channel link and subscriber count
                    const youtubeUrl = `https://www.youtube.com/channel/${youtubeChannelId}`;
                    const embed = {
                        color: 0x0099ff,
                        title: 'YouTube Channel Verified',
                        description: `Your YouTube channel has been verified and you have got the following subscriber role: ${assignedRole}.\nSubscriber Count: **${subscriberCount.toLocaleString()}**\n[Visit Channel](${youtubeUrl})`,
                    };
                    await interaction.followUp({
                        embeds: [embed],
                        ephemeral: true,
                    });
                } else {
                    throw new Error(
                        'Failed to retrieve YouTube subscriber count.',
                    );
                }
            } else {
                throw new Error('Failed to verify YouTube channel.');
            }
        } catch (error) {
            // Handle any errors
            await interaction.followUp({
                content: `Error: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};

// Function to poll MongoDB for the OAuth2 code and YouTube channel ID
async function getAuthorizationDataFromMongoDB(interactionId) {
    const fetchTimeout = 60000; // 60 seconds timeout
    const pollingInterval = 3000; // Poll every 3 seconds

    let elapsedTime = 0;
    while (elapsedTime < fetchTimeout) {
        const oauthRecord = await OAuthCode.findOne({ interactionId });

        if (oauthRecord) {
            return {
                code: oauthRecord.code,
                youtubeChannelId: oauthRecord.youtubeChannelId, // Return the YouTube channel ID
            };
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        elapsedTime += pollingInterval;
    }

    throw new Error('Timeout waiting for authorization.');
}

async function getYouTubeSubscriberCount(youtubeChannelId) {
    try {
        const response = await youtube.channels.list({
            part: 'statistics',
            id: youtubeChannelId,
        });

        const channelData = response.data.items[0];
        const subscriberCount = channelData.statistics.subscriberCount;

        return parseInt(subscriberCount, 10);
    } catch (error) {
        console.error('YouTube API error:', error.message);
        return null;
    }
}

async function assignSubscriberRole(member, subscriberCount) {
    let roleName;

    // Determine the role based on the subscriber count
    if (subscriberCount < 1000) {
        roleName = 'Less than 1K';
    } else if (subscriberCount < 10000) {
        roleName = 'Less than 10K';
    } else {
        roleName = '10K or more';
    }

    try {
        // Fetch the subscriber role from the database by role name
        const subscriberRoleData = await RoleSchema.findOne({ roleName });

        if (!subscriberRoleData) {
            throw new Error(`Role "${roleName}" not found in the database.`);
        }

        const role = member.guild.roles.cache.get(subscriberRoleData.roleID); // Get the role by its ID

        if (!role) {
            throw new Error(`Role "${roleName}" not found in the guild.`);
        }

        // Add the role to the user
        await member.roles.add(role);
        return roleName;
    } catch (error) {
        console.error('Failed to assign role:', error.message);
        throw new Error('Failed to assign subscriber role.');
    }
}
