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
	const textParts = text.split(':');
	const iv = Buffer.from(textParts.shift(), 'hex');
	const encryptedText = Buffer.from(textParts.shift(), 'hex');
	const secretKey = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
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
		const decryptedState = decrypt(state);
		const accessToken = await exchangeCodeForToken(code);
		const youtubeConnections = await getYouTubeConnections(accessToken);

		if (youtubeConnections.length === 0) {
			return createErrorResponse(
				404,
				'No YouTube connections found for this Discord account.',
			);
		}

		await saveOAuthRecord(decryptedState, code, youtubeConnections);

		return createSuccessResponse(youtubeConnections.length, decryptedState);
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

	const youtubeConnections = connectionsData.filter(
		(connection) => connection.type === 'youtube',
	);

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
	buttonLink = ''
) {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
			<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
					font-family: 'Inter', sans-serif;
				}

				body {
					background-color: #f8fafc;
					min-height: 100vh;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					padding: 1rem;
				}

				.container {
					max-width: 800px;
					width: 100%;
					background: white;
					padding: 2.5rem;
					border-radius: 12px;
					box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
					text-align: center;
				}

				.header {
					margin-bottom: 2rem;
				}

				h1 {
					font-size: 2rem;
					font-weight: 600;
					color: ${title === 'Success' ? '#16a34a' : '#dc2626'};
					margin-bottom: 0.5rem;
				}

				.subtitle {
					font-size: 1.125rem;
					font-weight: 400;
					color: #64748b;
					margin-bottom: 2rem;
				}

				.content {
					margin-bottom: 2rem;
				}

				.message {
					font-size: 1.125rem;
					color: #1e293b;
					margin-bottom: 1rem;
				}

				.details {
					font-size: 0.875rem;
					color: #64748b;
					margin-top: 1rem;
					display: none;
				}

				.show-details {
					color: #7289da;
					font-size: 0.875rem;
					cursor: pointer;
					margin-top: 1rem;
				}

				.button {
					display: inline-block;
					padding: 0.75rem 1.5rem;
					font-size: 1rem;
					font-weight: 500;
					color: white;
					background-color: #7289da;
					border: none;
					border-radius: 6px;
					text-decoration: none;
					cursor: pointer;
					transition: all 0.2s ease;
					margin-top: 2rem;
				}

				.button:hover {
					background-color: #6366f1;
					transform: translateY(-1px);
				}

				.button:active {
					transform: translateY(0);
					box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
				}

				.footer {
					margin-top: 2rem;
					font-size: 0.875rem;
					color: #64748b;
				}

				@media (max-width: 768px) {
					.container {
						padding: 1.5rem;
					}

					h1 {
						font-size: 1.5rem;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>${heading}</h1>
					<!-- Removed subtitle since it was undefined -->
				</div>
				
				<div class="content">
					<div class="message">${message}</div>
					<div class="details">${additionalMessage}</div>
					<p class="show-details" onclick="toggleDetails()">Show more details</p>
				</div>

				${buttonText && buttonLink ? `<a href="${buttonLink}" class="button">${buttonText}</a>` : ''}

				<div class="footer">
					<p>The Kiyo bot and this website would never share your data to other services. It automatically gets deleted from the database after a short while.</p>
				</div>
			</div>

			<script>
				function toggleDetails() {
					const details = document.querySelector('.details');
					const showDetails = document.querySelector('.show-details');
					
					details.style.display = details.style.display === 'none' || details.style.display === '' ? 'block' : 'none';
					showDetails.textContent = details.style.display === 'block' ? 'Hide details' : 'Show more details';
				}
			</script>
		</body>
		</html>
	`;
}
