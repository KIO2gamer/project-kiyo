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
			handleError('❌ MongoDB connection error:', error);
			throw error;
		}
	}
}

function handleError(message, ...args) {
	console.error(message, ...args);
}

const algorithm = 'aes-256-cbc';

function decrypt(text) {
	try {
		const [ivHex, encryptedTextHex, ...secretKeyHex] = text.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const encryptedText = Buffer.from(encryptedTextHex, 'hex');
		const secretKey = Buffer.from(secretKeyHex.join(':'), 'hex');
		const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
		const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
		return decrypted.toString();
	} catch (error) {
		handleError('❌ Decryption error:', error);
		throw new Error('Failed to decrypt state parameter. Please try again.');
	}
}

exports.handler = async function (event) {
	try {
		await connectToDatabase();
		const { code, state } = getCodeAndState(event);

		if (!code || !state) {
			return createErrorResponse(400, 'Missing authorization code or state parameter.');
		}

		try {
			const decryptedState = decrypt(state);
			// Parse the state JSON safely with proper error handling
			let parsedState;
			try {
				parsedState = JSON.parse(decryptedState);
			} catch (jsonError) {
				handleError('❌ Error parsing state JSON:', jsonError);
				return createErrorResponse(
					400,
					'Invalid state format',
					'The state parameter could not be parsed correctly.',
				);
			}

			const accessToken = await exchangeCodeForToken(code);

			if (!accessToken) {
				return createErrorResponse(401, 'Failed to obtain access token from Discord.');
			}

			const youtubeConnections = await getYouTubeConnections(accessToken);
			const userInfo = await getDiscordUserInfo(accessToken);

			if (youtubeConnections.length === 0) {
				return createErrorResponse(
					404,
					'No YouTube connections found for this Discord account.',
					'Please connect your YouTube account to Discord first, then try again.',
				);
			}

			await saveOAuthRecord(decryptedState, code, youtubeConnections, userInfo);
			return createSuccessResponse(youtubeConnections.length, decryptedState, userInfo);
		} catch (error) {
			handleError('❌ OAuth processing error:', error);
			if (error.message.includes('decrypt')) {
				return createErrorResponse(
					400,
					'Invalid state parameter',
					'State parameter validation failed. Please restart the authorization process.',
				);
			}
			return createErrorResponse(
				500,
				'An unexpected error occurred while processing your request.',
				error.message,
			);
		}
	} catch (error) {
		handleError('❌ Critical error in handler:', error);
		return createErrorResponse(500, 'A critical error occurred. Please try again later.');
	}
};

function getCodeAndState(event) {
	// Fixed: Netlify's queryStringParameters is already an object, not a string
	try {
		// Access query parameters directly instead of using URLSearchParams
		const { code, state } = event.queryStringParameters || {};
		return { code, state };
	} catch (error) {
		handleError('❌ Error parsing query parameters:', error);
		return { code: null, state: null };
	}
}

// --- HTML Generating Functions ---

function generateHtmlResponse(title, statusCode, message, additionalMessage = '', buttonHtml = '') {
	const headingClass = title.toLowerCase(); // Use title to dynamically generate heading class
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Project Kiyo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin-top: 50px;
                background-color: #f4f4f4;
                color: #333;
            }
            .container {
                width: 90%;
                max-width: 600px;
                margin: 0 auto;
                padding: 25px;
                border: 1px solid #ddd;
                border-radius: 10px;
                background-color: white;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            p {
                color: #555;
                line-height: 1.6;
                margin-bottom: 15px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #5865F2; /* Discord blue */
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin-top: 20px;
                transition: background-color 0.3s ease, transform 0.2s ease;
                font-weight: bold;
            }
            .button:hover {
                background-color: #4752C4;
                transform: translateY(-2px);
            }
            .button:active {
                transform: translateY(0);
            }
            .error-heading {
                color: #dc2626;
            }
            .success-heading {
                color: #16a34a;
            }
            .warning-heading {
                color: #eab308;
            }
            .status-code {
                font-weight: bold;
                margin-top: 10px;
                color: #777;
            }
            .user-info {
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 20px 0;
            }
            .avatar {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                margin-right: 15px;
                border: 3px solid #5865F2;
            }
            .username {
                font-size: 1.2em;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="${headingClass}-heading">${title}</h1>
            ${statusCode ? `<p class="status-code">Status Code: ${statusCode}</p>` : ''}
            ${message ? `<p>${message}</p>` : ''}
            ${additionalMessage ? `<p>${additionalMessage}</p>` : ''}
            ${buttonHtml}
        </div>
    </body>
    </html>
    `;
}

function createErrorResponse(
	statusCode,
	message,
	additionalMessage = 'Please ensure both code and state are provided in the request.',
) {
	const html = generateHtmlResponse('Error', statusCode, message, additionalMessage);

	return {
		statusCode,
		headers: { 'Content-Type': 'text/html' },
		body: html,
	};
}

async function exchangeCodeForToken(code) {
	try {
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

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.text();
			handleError('❌ Discord token exchange error:', tokenResponse.status, errorData);
			return null;
		}

		const tokenData = await tokenResponse.json();
		return tokenData.access_token;
	} catch (error) {
		handleError('❌ Error exchanging code for token:', error);
		return null;
	}
}

async function getDiscordUserInfo(accessToken) {
	try {
		const userResponse = await fetch('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (!userResponse.ok) {
			handleError(
				'❌ Discord user info error:',
				userResponse.status,
				userResponse.statusText,
			);
			return null;
		}

		return await userResponse.json();
	} catch (error) {
		handleError('❌ Error fetching Discord user info:', error);
		return null;
	}
}

async function getYouTubeConnections(accessToken) {
	try {
		const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (!connectionsResponse.ok) {
			handleError(
				'❌ Discord connections API error:',
				connectionsResponse.status,
				connectionsResponse.statusText,
			);
			const errorData = await connectionsResponse.text();
			handleError('Discord connections API error details:', errorData);
			return []; // Return empty array on API error
		}

		const connectionsData = await connectionsResponse.json();

		if (!Array.isArray(connectionsData)) {
			handleError('❌ Error: connectionsData is not an array:', connectionsData);
			return []; // Return empty array if not an array
		}

		const youtubeConnections = connectionsData.filter(
			connection => connection.type === 'youtube',
		);
		console.log(`✅ Found ${youtubeConnections.length} YouTube connections`);

		return youtubeConnections;
	} catch (error) {
		handleError('❌ Error fetching YouTube connections:', error);
		return [];
	}
}

async function saveOAuthRecord(state, code, youtubeConnections, userInfo) {
	try {
		let parsedState;
		try {
			parsedState = JSON.parse(state);
		} catch (error) {
			handleError('❌ Error parsing state for database save:', error);
			throw new Error('Invalid state format for database save');
		}

		const { interactionId, guildId, channelId } = parsedState;

		if (!interactionId || !guildId || !channelId) {
			throw new Error('Missing required state parameters');
		}

		const oauthRecord = new OAuthCode({
			interactionId,
			code,
			youtubeConnections: youtubeConnections.map(conn => ({
				id: conn.id,
				name: conn.name,
				verified: conn.verified,
			})),
			guildId,
			channelId,
			userInfo: userInfo
				? {
						id: userInfo.id,
						username: userInfo.username,
						discriminator: userInfo.discriminator,
						avatar: userInfo.avatar,
					}
				: null,
			createdAt: new Date(),
		});

		await oauthRecord.save();
		console.log(`✅ OAuth record saved for interaction ${interactionId}`);
	} catch (error) {
		handleError('❌ Error saving OAuth record:', error);
		throw new Error('Failed to save authorization data');
	}
}

async function createSuccessResponse(connectionsLength, state, userInfo) {
	try {
		let parsedState;
		try {
			parsedState = JSON.parse(state);
		} catch (error) {
			handleError('❌ Error parsing state for response:', error);
			throw new Error('Invalid state format for response generation');
		}

		const { guildId, channelId } = parsedState;
		const discordDeepLink = `discord://discord.com/channels/${guildId}/${channelId}`;
		const browserLink = `https://discord.com/channels/${guildId}/${channelId}`;

		let userInfoHtml = '';
		if (userInfo) {
			const avatarUrl = userInfo.avatar
				? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png?size=128`
				: 'https://cdn.discordapp.com/embed/avatars/0.png';

			userInfoHtml = `
            <div class="user-info">
                <img src="${avatarUrl}" alt="Discord Avatar" class="avatar">
                <span class="username">${userInfo.username}</span>
            </div>`;
		}

		const buttonHtml = `
        ${userInfoHtml}
        <p>You can now return to Discord and continue using the bot.</p>
        <a href="${discordDeepLink}" class="button">Return to Discord (App)</a>
        <a href="${browserLink}" class="button" style="margin-left: 10px; background-color: #7289da;">Open in Browser</a>`;

		const html = generateHtmlResponse(
			'Success',
			null,
			'Your YouTube connections have been successfully linked!',
			`Number of connections: ${connectionsLength}`,
			buttonHtml,
		);

		return {
			statusCode: 200,
			headers: { 'Content-Type': 'text/html' },
			body: html,
		};
	} catch (error) {
		handleError('❌ Error creating success response:', error);
		return createErrorResponse(500, 'An error occurred while creating the success response');
	}
}
