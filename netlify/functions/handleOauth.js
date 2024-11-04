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
            console.log('✅ MongoDB connection established successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }
}

exports.handler = async function (event, context) {
    await connectToDatabase();
    const { code, state } = getCodeAndState(event);

    if (!code || !state) {
        return createErrorResponse(400, 'Missing authorization code or state parameter.');
    }

    try {
        const accessToken = await exchangeCodeForToken(code);
        const youtubeConnections = await getYouTubeConnections(accessToken);

        if (youtubeConnections.length === 0) {
            return createErrorResponse(404, 'No YouTube connections found for this Discord account.');
        }

        await saveOAuthRecord(state, code, youtubeConnections);

        return createSuccessResponse(youtubeConnections.length);
    } catch (error) {
        console.error('❌ Error fetching Discord connections or saving to MongoDB:', error);
        return createErrorResponse(500, 'An unexpected error occurred while processing your request.');
    }
};

function getCodeAndState(event) {
    const urlParams = new URLSearchParams(event.queryStringParameters);
    return {
        code: urlParams.get('code'),
        state: urlParams.get('state'),
    };
}

function createErrorResponse(statusCode, message) {
    return {
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: `
            <html>
                <head>
                    <title>Error</title>
                </head>
                <body>
                    <h1>Error: ${statusCode}</h1>
                    <p>${message}</p>
                    <p>Please ensure both code and state are provided in the request.</p>
                </body>
            </html>
        `,
    };
}

async function exchangeCodeForToken(code) {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

async function getYouTubeConnections(accessToken) {
    const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const connectionsData = await connectionsResponse.json();
    return connectionsData.filter((connection) => connection.type === 'youtube');
}

async function saveOAuthRecord(state, code, youtubeConnections) {
    const oauthRecord = new OAuthCode({
        interactionId: state,
        code,
        youtubeConnections: youtubeConnections.map((conn) => ({
            id: conn.id,
            name: conn.name,
        })),
    });
    await oauthRecord.save();
}

function createSuccessResponse(connectionsLength) {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
            <html>
                <head>
                    <title>Success</title>
                </head>
                <body>
                    <h1>Authorization successful! 🎉</h1>
                    <p>Your YouTube connections have been successfully linked. You can now return to Discord and continue using the bot.</p>
                    <p>Number of connections: ${connectionsLength}</p>
                </body>
            </html>
        `,
    };
}
