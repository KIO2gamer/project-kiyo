const mongoose = require('mongoose');
const OAuthCode = require('./../../src/database/OauthCode');
const crypto = require('crypto');

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

const algorithm = 'aes-256-cbc';

function decrypt(text) {
    const [ivHex, encryptedTextHex, ...secretKeyHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedTextHex, 'hex');
    const secretKey = Buffer.from(secretKeyHex.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}

exports.handler = async function (event) {
    await connectToDatabase();
    const { code, state } = getCodeAndState(event);

    if (!code || !state) {
        return createErrorResponse(400, 'Missing authorization code or state parameter.');
    }

    try {
        const decryptedState = decrypt(state);
        const accessToken = await exchangeCodeForToken(code);
        const youtubeConnections = await getYouTubeConnections(accessToken);

        if (youtubeConnections.length === 0) {
            return createErrorResponse(404, 'No YouTube connections found for this Discord account.');
        }

        await saveOAuthRecord(decryptedState, code, youtubeConnections);
        return createSuccessResponse(youtubeConnections.length, decryptedState);
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
        body: generateHtmlResponse('Error', statusCode, message, 'Please ensure both code and state are provided in the request.'),
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
    return connectionsData.filter(connection => connection.type === 'youtube');
}

async function saveOAuthRecord(state, code, youtubeConnections) {
    const { interactionId, guildId, channelId } = JSON.parse(state);
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

// Update createSuccessResponse
async function createSuccessResponse(connectionsLength, state) {
    const { guildId, channelId } = JSON.parse(state);
    const discordDeepLink = `discord://discord.com/channels/${guildId}/${channelId}`;

    const html = await templateHandler.generateResponse({
        title: 'Success',
        heading: 'Authorization successful!',
        message: 'Your YouTube connections have been successfully linked. You can now return to Discord and continue using the bot.',
        additionalMessage: `Number of connections: ${connectionsLength}`,
        buttonText: 'Return to Discord',
        buttonLink: discordDeepLink
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}

// Update createErrorResponse
async function createErrorResponse(statusCode, message) {
    const html = await templateHandler.generateResponse({
        title: 'Error',
        heading: statusCode,
        message: message,
        additionalMessage: 'Please ensure both code and state are provided in the request.'
    });

    return {
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}

async function handleWarningResponse(message) {
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
