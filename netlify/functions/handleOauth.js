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

// --- HTML Generating Functions ---

function generateHtmlResponse(title, statusCode, message, additionalMessage = '', buttonHtml = '') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { width: 80%; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
            h1 { color: #333; }
            p { color: #666; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .button:hover { background-color: #0056b3; }
            .error-heading { color: #dc2626; }
            .success-heading { color: #16a34a; }
            .warning-heading { color: #eab308; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="${title.toLowerCase()}-heading">${title}</h1>
            ${statusCode ? `<p>Status Code: ${statusCode}</p>` : ''}
            <p>${message}</p>
            ${additionalMessage ? `<p>${additionalMessage}</p>` : ''}
            ${buttonHtml}
        </div>
    </body>
    </html>
    `;
}

function createErrorResponse(statusCode, message) {
    const html = generateHtmlResponse('Error', statusCode, message, 'Please ensure both code and state are provided in the request.');
    return {
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: html,
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

    if (!connectionsResponse.ok) {
        console.error("Discord connections API error:", connectionsResponse.status, connectionsResponse.statusText);
        const errorData = await connectionsResponse.json();
        console.error("Discord connections API error details:", errorData);
        return []; // Return empty array on API error
    }

    const connectionsData = await connectionsResponse.json();
    console.log("Discord connections data:", connectionsData); // Log this!
    if (!Array.isArray(connectionsData)) {
        console.error("Error: connectionsData is not an array:", connectionsData);
        return []; // Return empty array if not an array
    }
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


// Update createSuccessResponse
async function createSuccessResponse(connectionsLength, state) {
    const { guildId, channelId } = JSON.parse(state);
    const discordDeepLink = `discord://discord.com/channels/${guildId}/${channelId}`;

    const buttonHtml = `<a href="${discordDeepLink}" class="button">Return to Discord</a>`;
    const html = generateHtmlResponse(
        'Success',
        null, // No status code for success
        'Your YouTube connections have been successfully linked. You can now return to Discord and continue using the bot.',
        `Number of connections: ${connectionsLength}`,
        buttonHtml
    );

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}


async function createErrorResponse(statusCode, message) {
    const html = generateHtmlResponse(
        'Error',
        statusCode,
        message,
        'Please ensure both code and state are provided in the request.'
    );

    return {
        statusCode,
        headers: { 'Content-Type': 'text/html' },
        body: html
    };
}