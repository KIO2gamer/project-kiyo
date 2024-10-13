const { SlashCommandBuilder } = require('discord.js');
const OAuthCode = require('../../bot_utils/OauthCode');
const RoleSchema = require('../../bot_utils/roleStorage');
const { google } = require('googleapis');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

module.exports = {
    description_full:
        'Verify your YouTube channel using Discord OAuth2, fetch your subscriber count, and automatically assign a role based on your subscriber count.',
    usage: '/get_yt_sub_role',
    examples: ['/get_yt_sub_role'],
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('get_yt_sub_role')
        .setDescription(
            'Automatically assign a role based on your subscriber count on your YT Channel.',
        ),

    async execute(interaction) {
        try {
            const interactionId = interaction.id; // Use the interaction ID as state
            const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections&state=${interactionId}`;

            await interaction.reply({
                content: `Please click [here](${discordOAuthUrl}) to authorize and fetch your YouTube connections.`,
                ephemeral: true,
            });

            const oauthData =
                await getAuthorizationDataFromMongoDB(interactionId);
            if (
                !oauthData.youtubeConnections ||
                oauthData.youtubeConnections.length === 0
            ) {
                throw new Error('No YouTube connections found.');
            }

            // Fetch subscriber counts for all YouTube connections and find the one with the highest count
            const highestSubscriberData = await getHighestSubscriberCount(
                oauthData.youtubeConnections,
            );
            const { youtubeChannelId, subscriberCount } = highestSubscriberData;

            if (subscriberCount !== null) {
                const assignedRole = await assignSubscriberRole(
                    interaction.member,
                    subscriberCount,
                );
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
                throw new Error('Failed to retrieve YouTube subscriber count.');
            }
        } catch (error) {
            await interaction.followUp({
                content: `Error: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};

// Function to poll MongoDB for the OAuth2 code and YouTube connections
async function getAuthorizationDataFromMongoDB(interactionId) {
    const fetchTimeout = 60000; // 60 seconds timeout
    const pollingInterval = 3000; // Poll every 3 seconds

    let elapsedTime = 0;
    while (elapsedTime < fetchTimeout) {
        const oauthRecord = await OAuthCode.findOne({ interactionId });

        if (oauthRecord) {
            return {
                code: oauthRecord.code,
                youtubeConnections: oauthRecord.youtubeConnections || [],
            };
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        elapsedTime += pollingInterval;
    }

    throw new Error('Timeout waiting for authorization.');
}

async function getHighestSubscriberCount(youtubeConnections) {
    let highestSubscriberData = {
        youtubeChannelId: null,
        subscriberCount: 0,
    };

    for (const connection of youtubeConnections) {
        const subscriberCount = await getYouTubeSubscriberCount(connection.id);
        if (subscriberCount > highestSubscriberData.subscriberCount) {
            highestSubscriberData = {
                youtubeChannelId: connection.id,
                subscriberCount,
            };
        }
    }

    return highestSubscriberData;
}

async function getYouTubeSubscriberCount(youtubeChannelId) {
    try {
        const response = await youtube.channels.list({
            part: 'statistics',
            id: youtubeChannelId,
        });

        const channelData = response.data.items[0];
        return parseInt(channelData.statistics.subscriberCount, 10);
    } catch (error) {
        console.error('YouTube API error:', error.message);
        return null;
    }
}

async function assignSubscriberRole(member, subscriberCount) {
    let roleName;

    if (subscriberCount < 1000) {
        roleName = 'Less than 1K';
    } else if (subscriberCount < 10000) {
        roleName = 'Less than 10K';
    } else {
        roleName = '10K or more';
    }

    try {
        const subscriberRoleData = await RoleSchema.findOne({ roleName });
        if (!subscriberRoleData)
            throw new Error(`Role "${roleName}" not found in the database.`);

        const role = member.guild.roles.cache.get(subscriberRoleData.roleID);
        if (!role)
            throw new Error(`Role "${roleName}" not found in the guild.`);

        await member.roles.add(role);
        return roleName;
    } catch (error) {
        console.error('Failed to assign role:', error.message);
        throw new Error('Failed to assign subscriber role.');
    }
}
