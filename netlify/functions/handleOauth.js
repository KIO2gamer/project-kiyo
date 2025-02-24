const mongoose = require('mongoose');
const OAuthCode = require('./../../src/database/OauthCode');

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

exports.handler = async function (event) {
    await connectToDatabase();
    const { code, state } = getCodeAndState(event);

    if (!code || !state) {
        return createErrorResponse(400, 'Missing authorization code or state parameter.');
    }

    try {
        let decryptedState;
        try {
            decryptedState = JSON.parse(state); // Parse state directly as JSON
        } catch (e) {
            console.error("Error parsing state JSON:", e);
            return createErrorResponse(400, 'Invalid state parameter format.'); // More specific error for state parsing
        }

        const accessToken = await exchangeCodeForToken(code);
        const youtubeConnections = await getYouTubeConnections(accessToken);

        if (youtubeConnections.length === 0) {
            return createErrorResponse(404, 'No YouTube connections found for this Discord account.');
        }

        await saveOAuthRecord(decryptedState, code, youtubeConnections);
        return createSuccessResponse(youtubeConnections.length, decryptedState);
    } catch (error) {
        console.error('❌ Error processing OAuth flow:', error); // More general error log
        console.error(error); // Log full error for debugging
        return createErrorResponse(500, 'An unexpected error occurred while processing your request.'); // Generic user error
    }
};

function getCodeAndState(event) {
    const urlParams = new URLSearchParams(event.queryStringParameters);
    return {
        code: urlParams.get('code'),
        state: urlParams.get('state'),
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

    if (!tokenResponse.ok) { // Check if token request was successful
        const errorData = await tokenResponse.json();
        console.error("Discord token exchange error:", errorData);
        throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${tokenResponse.statusText}`); // More specific error
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

async function getYouTubeConnections(accessToken) {
    const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!connectionsResponse.ok) { // Check if connections request was successful
        const errorData = await connectionsResponse.json();
        console.error("Discord connections fetch error:", errorData);
        throw new Error(`Failed to fetch Discord connections: ${connectionsResponse.status} ${connectionsResponse.statusText}`); // More specific error
    }

    const connectionsData = await connectionsResponse.json();
    return connectionsData.filter(connection => connection.type === 'youtube');
}

async function saveOAuthRecord(state, code, youtubeConnections) {
    const { interactionId, guildId, channelId } = state; // State is already parsed JSON
    const oauthRecord = new OAuthCode({
        interactionId,
        code,
        youtubeConnections: youtubeConnections.map(conn => ({
            id: conn.id,
            name: conn.name,
        })),
        guildId,
        channelId,
    });
    await oauthRecord.save();
}

const templateHandler = require('./templateHandler');

// Update createSuccessResponse and createErrorResponse are already using templateHandler and are good.

async function createSuccessResponse(connectionsLength, state) {
    const { guildId, channelId } = state;
    const discordDeepLink = `discord://discord.com/channels/${guildId}/${channelId}`;

    const html = await templateHandler.generateResponse('template', { // Assuming 'template.html' is your base success template
        title: 'Success',
        heading: 'Authorization successful!',
        message: 'Your YouTube connections have been successfully linked. You can now return to Discord and continue using the bot.',
        additionalMessage: `Number of connections: ${connectionsLength}`,
        buttonText: 'Return to Discord',
        buttonLink: discordDeepLink,
        status: 'success' // Add status for template styling if needed
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}


async function createErrorResponse(statusCode, message) {
    const html = await templateHandler.generateResponse('template', { // Assuming 'template.html' is your base error template
        title: 'Error',
        heading: statusCode,
        message: message,
        additionalMessage: 'Please ensure both code and state are provided in the request.',
        status: 'error' // Add status for template styling if needed
    });

    return {
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}


async function handleWarningResponse(message) { // No changes needed for handleWarningResponse, it's good.
    const html = await templateHandler.generateResponse('warning-template', {
        title: 'Warning',
        heading: 'Action Required',
        message: message,
        additionalMessage: 'Please review the following details carefully.',
        buttonText: 'Acknowledge',
        buttonLink: '#',
        status: 'warning'
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}