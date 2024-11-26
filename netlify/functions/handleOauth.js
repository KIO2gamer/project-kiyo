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

exports.handler = async function (event) {
	await connectToDatabase();
	const { code, state } = getCodeAndState(event);

	if (!code || !state) {
		return createErrorResponse(
			400,
			'Missing authorization code or state parameter.',
		);
	}

	try {
		const accessToken = await exchangeCodeForToken(code);
		const youtubeConnections = await getYouTubeConnections(accessToken);

		if (youtubeConnections.length === 0) {
			return createErrorResponse(
				404,
				'No YouTube connections found for this Discord account.',
			);
		}

		await saveOAuthRecord(state, code, youtubeConnections);

		return createSuccessResponse(youtubeConnections.length, state);
	} catch (error) {
		console.error(
			'❌ Error fetching Discord connections or saving to MongoDB:',
			error,
		);
		return createErrorResponse(
			500,
			'An unexpected error occurred while processing your request.',
		);
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
		body: generateHtmlResponse(
			'Error',
			statusCode,
			message,
			'Please ensure both code and state are provided in the request.',
		),
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
	const connectionsResponse = await fetch(
		'https://discord.com/api/users/@me/connections',
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	);

	const connectionsData = await connectionsResponse.json();
	console.log('Fetched connections:', connectionsData); // Add logging
	const youtubeConnections = connectionsData.filter(
		(connection) => connection.type === 'youtube',
	);
	console.log('Filtered YouTube connections:', youtubeConnections); // Add logging
	return youtubeConnections;
}

async function saveOAuthRecord(state, code, youtubeConnections) {
    const { interactionId, guildId, channelId } = JSON.parse(state);
    const oauthRecord = new OAuthCode({
        interactionId,
        code,
        youtubeConnections: youtubeConnections.map((conn) => ({
            id: conn.id,
            name: conn.name,
        })),
        guildId,
        channelId,
    });
    await oauthRecord.save();
}

function createSuccessResponse(connectionsLength, state) {
	const { guildId, channelId } = JSON.parse(state);
	const discordDeepLink = `discord://discord.com/channels/${guildId}/${channelId}`;
	return {
		statusCode: 200,
		headers: { 'Content-Type': 'text/html' },
		body: generateHtmlResponse(
			'Success',
			'Authorization successful!',
			'Your YouTube connections have been successfully linked. You can now return to Discord and continue using the bot.',
			`Number of connections: ${connectionsLength}`,
			'Return to Discord',
			discordDeepLink,
		),
	};
}

function generateHtmlResponse(
	title,
	heading,
	message,
	additionalMessage,
	buttonText = '',
	buttonLink = '',
) {
	return `
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 50px auto;
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: ${title === 'Success' ? '#4CAF50' : '#FF0000'};
                    }
                    p {
                        font-size: 16px;
                        color: #333;
                    }
                    .button {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 10px 20px;
                        font-size: 16px;
                        color: white;
                        background-color: #7289DA;
                        border: none;
                        border-radius: 5px;
                        text-decoration: none;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${heading}</h1>
                    <p>${message}</p>
                    <p>${additionalMessage}</p>
                    ${buttonText && buttonLink ? `<a class="button" href="${buttonLink}">${buttonText}</a>` : ''}
                </div>
            </body>
        </html>
    `;
}
