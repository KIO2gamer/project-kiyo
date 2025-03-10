const mongoose = require('mongoose');
const crypto = require('crypto');
const fetch = require('node-fetch');
const cookie = require('cookie');

// MongoDB connection
let isConnected = false;

// Define the schema for dashboard sessions
const sessionSchema = new mongoose.Schema({
	_id: String, // Use custom generated session ID
	userId: { type: String, required: true },
	username: String,
	avatar: String,
	accessToken: { type: String, required: true },
	refreshToken: { type: String, required: true },
	tokenExpires: Date,
	guilds: Array,
	createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-expire after 7 days
});

// Initialize model
let Session;
try {
	Session = mongoose.model('DashboardSession');
} catch (error) {
	Session = mongoose.model('DashboardSession', sessionSchema);
}

// Connect to MongoDB
async function connectToDatabase() {
	if (isConnected) return;

	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		isConnected = true;
		console.log('✅ MongoDB connected successfully');
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		throw new Error('Database connection failed');
	}
}

// Generate secure session ID
function generateSessionId() {
	return crypto.randomBytes(32).toString('hex');
}

exports.handler = async (event) => {
	// Set CORS headers for preflight requests
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': 'https://kiyo-discord-bot.netlify.app',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
			}
		};
	}

	// Parse query parameters
	const params = new URLSearchParams(event.queryStringParameters || {});
	const code = params.get('code');
	const error = params.get('error');

	// Handle OAuth errors returned by Discord
	if (error) {
		console.error('Discord OAuth error:', error);
		return {
			statusCode: 302,
			headers: {
				'Location': '/?error=auth_failed',
				'Cache-Control': 'no-cache'
			},
			body: 'Redirecting...'
		};
	}

	// If no code is provided, redirect to Discord authorization
	if (!code) {
		const redirectUri = `${process.env.DISCORD_REDIRECT_URI}/dashboardAuth`;
		const clientId = process.env.DISCORD_CLIENT_ID;
		const scope = 'identify guilds';

		const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;

		return {
			statusCode: 302,
			headers: {
				'Location': authUrl,
				'Cache-Control': 'no-cache'
			},
			body: 'Redirecting to Discord login...'
		};
	}

	// Exchange code for token
	try {
		await connectToDatabase();

		// Exchange code for access token
		const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID,
				client_secret: process.env.DISCORD_CLIENT_SECRET,
				grant_type: 'authorization_code',
				code,
				redirect_uri: `${process.env.DISCORD_REDIRECT_URI}/dashboard`,
				scope: 'identify guilds'
			})
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json().catch(() => ({}));
			console.error('Token exchange failed:', tokenResponse.status, errorData);
			throw new Error(`Token exchange failed: ${tokenResponse.status}`);
		}

		const tokenData = await tokenResponse.json();

		// Get user info
		const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`
			}
		});

		if (!userResponse.ok) {
			const errorData = await userResponse.json().catch(() => ({}));
			console.error('User fetch failed:', userResponse.status, errorData);
			throw new Error(`User fetch failed: ${userResponse.status}`);
		}

		const userData = await userResponse.json();

		// Get user's guilds
		const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`
			}
		});

		if (!guildsResponse.ok) {
			const errorData = await guildsResponse.json().catch(() => ({}));
			console.error('Guilds fetch failed:', guildsResponse.status, errorData);
			throw new Error(`Guilds fetch failed: ${guildsResponse.status}`);
		}

		const guildsData = await guildsResponse.json();

		// Generate session ID and create session document
		const sessionId = generateSessionId();
		const session = new Session({
			_id: sessionId,
			userId: userData.id,
			username: userData.username,
			avatar: userData.avatar,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			tokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
			guilds: guildsData
		});

		// Save session to database
		await session.save();

		// Set secure cookie and redirect
		const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
		const cookieHeader = cookie.serialize('dashboard_session', sessionId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'Lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 // 7 days
		});

		return {
			statusCode: 302,
			headers: {
				'Set-Cookie': cookieHeader,
				'Location': '/dashboard/home',
				'Cache-Control': 'no-cache'
			},
			body: 'Authentication successful! Redirecting...'
		};

	} catch (error) {
		console.error('Authentication error:', error);

		return {
			statusCode: 302,
			headers: {
				'Location': `/?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
				'Cache-Control': 'no-cache'
			},
			body: 'Authentication failed! Redirecting...'
		};
	}
};