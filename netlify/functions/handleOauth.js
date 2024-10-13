const mongoose = require('mongoose');
const OAuthCode = require('./../../bot_utils/OauthCode');

// MongoDB connection URI from environment variables
const mongoUri = process.env.MONGODB_URI;

let isConnected = false;

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await mongoose.connect(mongoUri, { bufferCommands: false });
            isConnected = true;
            console.log('MongoDB connected');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
}

exports.handler = async function (event, context) {
    await connectToDatabase();
    const urlParams = new URLSearchParams(event.queryStringParameters);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code || !state) {
        return {
            statusCode: 400,
            body: 'Missing authorization code or state.',
        };
    }

    try {
        // Step 1: Exchange the authorization code for an access token
        const tokenResponse = await fetch(
            'https://discord.com/api/oauth2/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: process.env.DISCORD_REDIRECT_URI,
                }),
            },
        );

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Fetch the user's Discord connections using the access token
        const connectionsResponse = await fetch(
            'https://discord.com/api/users/@me/connections',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        const connectionsData = await connectionsResponse.json();

        // Step 3: Filter for YouTube connections
        const youtubeConnections = connectionsData.filter(
            (connection) => connection.type === 'youtube',
        );

        if (youtubeConnections.length === 0) {
            return { statusCode: 404, body: 'No YouTube connections found.' };
        }

        // Step 4: Save the authorization code, interaction ID, and YouTube connection IDs in MongoDB
        const oauthRecord = new OAuthCode({
            interactionId: state,
            code: code,
            youtubeConnections: youtubeConnections.map((conn) => ({
                id: conn.id,
                name: conn.name,
            })), // Save multiple connections
        });
        await oauthRecord.save();

        return {
            statusCode: 200,
            body: 'Authorization successful. Please return to Discord.',
        };
    } catch (error) {
        console.error(
            'Error fetching Discord connections or saving to MongoDB:',
            error,
        );
        return { statusCode: 500, body: 'Error processing OAuth2 flow.' };
    }
};
