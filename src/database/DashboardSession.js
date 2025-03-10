const mongoose = require('mongoose');
const fetch = require('node-fetch');
const crypto = require('crypto');

/**
 * Schema for dashboard user sessions
 * Stores Discord user data and authentication tokens
 */
const dashboardSessionSchema = new mongoose.Schema({
	// Session identifier
	sessionId: {
		type: String,
		required: true,
		unique: true,
		index: true
	},

	// Discord user information
	userId: {
		type: String,
		required: true,
		index: true
	},
	username: String,
	discriminator: String,
	avatar: String,

	// OAuth tokens
	accessToken: {
		type: String,
		required: true
	},
	refreshToken: {
		type: String,
		required: true
	},

	// Token expiration timestamp
	tokenExpires: {
		type: Date,
		required: true
	},

	// User's Discord guilds (cached)
	guilds: [{
		id: String,
		name: String,
		icon: String,
		owner: Boolean,
		permissions: String,
		features: [String]
	}],

	// Session expiration with auto-delete (TTL index)
	createdAt: {
		type: Date,
		default: Date.now,
		expires: '7d' // Automatically delete after 7 days
	}
});

/**
 * Generate a secure random session ID
 * @returns {string} Random session ID
 */
dashboardSessionSchema.statics.generateSessionId = function () {
	return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a new session from Discord OAuth data
 * @param {Object} tokenData - Token response from Discord OAuth
 * @param {Object} userData - User data from Discord API
 * @param {Array} guildsData - User's guilds from Discord API
 * @returns {Promise<Object>} Created session
 */
dashboardSessionSchema.statics.createFromOAuth = async function (tokenData, userData, guildsData) {
	try {
		const sessionId = this.generateSessionId();
		const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

		// Extract useful guild data
		const processedGuilds = guildsData.map(guild => ({
			id: guild.id,
			name: guild.name,
			icon: guild.icon,
			owner: guild.owner,
			permissions: guild.permissions,
			features: guild.features
		}));

		// Create and save session
		const session = new this({
			sessionId,
			userId: userData.id,
			username: userData.username,
			discriminator: userData.discriminator || '0',
			avatar: userData.avatar,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			tokenExpires: expiresAt,
			guilds: processedGuilds
		});

		await session.save();
		return session;
	} catch (error) {
		console.error('Error creating dashboard session:', error);
		throw new Error('Failed to create session');
	}
};

/**
 * Refresh the access token if expired
 * @returns {Promise<boolean>} True if refreshed successfully
 */
dashboardSessionSchema.methods.refreshTokenIfNeeded = async function () {
	try {
		// Check if token needs refreshing (with 5 minute buffer)
		const now = new Date();
		const bufferTime = 5 * 60 * 1000; // 5 minutes in ms

		if (this.tokenExpires > new Date(now.getTime() + bufferTime)) {
			return true; // Token still valid
		}

		// Token expired or expiring soon, refresh it
		const response = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID,
				client_secret: process.env.DISCORD_CLIENT_SECRET,
				grant_type: 'refresh_token',
				refresh_token: this.refreshToken
			})
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			console.error('Token refresh failed:', error);
			return false;
		}

		const data = await response.json();

		// Update session with new tokens
		this.accessToken = data.access_token;
		this.refreshToken = data.refresh_token || this.refreshToken;
		this.tokenExpires = new Date(Date.now() + data.expires_in * 1000);

		await this.save();
		return true;
	} catch (error) {
		console.error('Error refreshing token:', error);
		return false;
	}
};

/**
 * Get fresh user data from Discord API
 * @returns {Promise<Object|null>} User data or null if failed
 */
dashboardSessionSchema.methods.fetchUserData = async function () {
	try {
		// Refresh token if needed
		const refreshed = await this.refreshTokenIfNeeded();
		if (!refreshed) return null;

		// Fetch user data
		const response = await fetch('https://discord.com/api/v10/users/@me', {
			headers: {
				Authorization: `Bearer ${this.accessToken}`
			}
		});

		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		console.error('Error fetching user data:', error);
		return null;
	}
};

/**
 * Refresh guild list from Discord API
 * @returns {Promise<boolean>} Success status
 */
dashboardSessionSchema.methods.refreshGuilds = async function () {
	try {
		// Refresh token if needed
		const refreshed = await this.refreshTokenIfNeeded();
		if (!refreshed) return false;

		// Fetch guilds
		const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
			headers: {
				Authorization: `Bearer ${this.accessToken}`
			}
		});

		if (!response.ok) return false;

		const guildsData = await response.json();
		this.guilds = guildsData.map(guild => ({
			id: guild.id,
			name: guild.name,
			icon: guild.icon,
			owner: guild.owner,
			permissions: guild.permissions,
			features: guild.features
		}));

		await this.save();
		return true;
	} catch (error) {
		console.error('Error refreshing guilds:', error);
		return false;
	}
};

/**
 * Find a session by its session ID
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object|null>} Session document or null
 */
dashboardSessionSchema.statics.findBySessionId = function (sessionId) {
	return this.findOne({ sessionId });
};

// Create model from schema
const DashboardSession = mongoose.model('DashboardSession', dashboardSessionSchema);

module.exports = DashboardSession;