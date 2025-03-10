const mongoose = require('mongoose');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const cookie = require('cookie');
const path = require('path');

// MongoDB connection
let isConnected = false;

// Discord client for API operations (initialized only when needed)
let client = null;

// Define schemas
const sessionSchema = new mongoose.Schema({
	_id: String,
	userId: { type: String, required: true },
	username: String,
	avatar: String,
	accessToken: { type: String, required: true },
	refreshToken: { type: String, required: true },
	tokenExpires: Date,
	guilds: Array,
	createdAt: { type: Date, default: Date.now, expires: '7d' }
});

const guildConfigSchema = new mongoose.Schema({
	guildId: { type: String, required: true, unique: true },
	prefix: { type: String, default: '!' },
	welcomeChannel: String,
	welcomeMessage: String,
	logChannel: String,
	logJoins: { type: Boolean, default: false },
	logMessages: { type: Boolean, default: false },
	disabledCommands: [String],
	customRoles: {
		type: Map,
		of: String
	},
	autoModSettings: {
		enabled: { type: Boolean, default: false },
		filterWords: { type: Boolean, default: false },
		antiSpam: { type: Boolean, default: false },
		maxMentions: { type: Number, default: 5 },
		filterLinks: { type: Boolean, default: false }
	}
});

// Initialize models
let Session, GuildConfig;
try {
	Session = mongoose.model('DashboardSession');
} catch (error) {
	Session = mongoose.model('DashboardSession', sessionSchema);
}

try {
	GuildConfig = mongoose.model('GuildConfig');
} catch (error) {
	GuildConfig = mongoose.model('GuildConfig', guildConfigSchema);
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

// Authenticate user session
async function authenticateSession(event) {
	const cookies = cookie.parse(event.headers.cookie || '');
	const sessionId = cookies.dashboard_session;

	if (!sessionId) {
		throw new Error('No session cookie found');
	}

	const session = await Session.findById(sessionId);

	if (!session) {
		throw new Error('Invalid session');
	}

	// Check if token is expired and should be refreshed
	if (session.tokenExpires && new Date(session.tokenExpires) < new Date()) {
		try {
			// Refresh the token
			const response = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: process.env.DISCORD_CLIENT_ID,
					client_secret: process.env.DISCORD_CLIENT_SECRET,
					grant_type: 'refresh_token',
					refresh_token: session.refreshToken
				})
			});

			if (!response.ok) {
				throw new Error('Failed to refresh token');
			}

			const tokenData = await response.json();

			// Update session with new tokens
			session.accessToken = tokenData.access_token;
			session.refreshToken = tokenData.refresh_token;
			session.tokenExpires = new Date(Date.now() + tokenData.expires_in * 1000);
			await session.save();

		} catch (error) {
			console.error('Token refresh failed:', error);
			throw new Error('Session expired');
		}
	}

	return session;
}

// Initialize Discord client if needed
async function getDiscordClient() {
	if (!client) {
		client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers
			]
		});

		// Wait for client to be ready
		const readyPromise = new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Discord client login timed out'));
			}, 10000);

			client.once('ready', () => {
				clearTimeout(timeout);
				console.log('Discord client ready');
				resolve();
			});

			client.once('error', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		});

		// Login
		await client.login(process.env.DISCORD_TOKEN);
		await readyPromise;
	}

	return client;
}

exports.handler = async (event) => {
	// Set CORS headers for preflight requests
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': 'https://kiyo-discord-bot.netlify.app',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Credentials': 'true'
			}
		};
	}

	// Extract API route from path
	const routePath = event.path.replace(/^\/.netlify\/functions\/dashboardApi\/?/, '');

	// Default headers for all responses
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': 'https://kiyo-discord-bot.netlify.app',
		'Access-Control-Allow-Credentials': 'true'
	};

	try {
		await connectToDatabase();

		// Parse request body if it exists
		let body = {};
		if (event.body) {
			try {
				body = JSON.parse(event.body);
			} catch (error) {
				return {
					statusCode: 400,
					headers,
					body: JSON.stringify({ error: 'Invalid request body' })
				};
			}
		}

		// Routes that require authentication
		try {
			const session = await authenticateSession(event);

			// User profile endpoint
			if (routePath === 'profile') {
				return {
					statusCode: 200,
					headers,
					body: JSON.stringify({
						id: session.userId,
						username: session.username,
						avatar: session.avatar
					})
				};
			}

			// Get user's guilds
			if (routePath === 'guilds') {
				// Filter guilds where user has MANAGE_GUILD permission (0x20)
				const managedGuilds = session.guilds.filter(guild =>
					(BigInt(guild.permissions) & PermissionsBitField.Flags.ManageGuild) ===
					PermissionsBitField.Flags.ManageGuild
				);

				return {
					statusCode: 200,
					headers,
					body: JSON.stringify({ guilds: managedGuilds })
				};
			}

			// Get bot statistics
			if (routePath === 'stats') {
				const client = await getDiscordClient();

				return {
					statusCode: 200,
					headers,
					body: JSON.stringify({
						servers: client.guilds.cache.size,
						users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
						channels: client.channels.cache.size,
						commands: client.application.commands.cache.size,
						uptime: Math.floor(client.uptime / 1000) // in seconds
					})
				};
			}

			// Get list of commands
			if (routePath === 'commands') {
				const client = await getDiscordClient();

				// Get global commands
				const commands = Array.from(client.application.commands.cache.values());

				// Format command data
				const formattedCommands = commands.map(cmd => ({
					name: cmd.name,
					description: cmd.description,
					category: cmd.category || 'Uncategorized',
					options: cmd.options
				}));

				return {
					statusCode: 200,
					headers,
					body: JSON.stringify({ commands: formattedCommands })
				};
			}

			// Guild specific endpoints
			if (routePath.startsWith('guilds/')) {
				const pathParts = routePath.split('/');
				const guildId = pathParts[1];
				const subRoute = pathParts[2];

				// Verify user has permission for this guild
				const hasPermission = session.guilds.some(g =>
					g.id === guildId &&
					(BigInt(g.permissions) & PermissionsBitField.Flags.ManageGuild) ===
					PermissionsBitField.Flags.ManageGuild
				);

				if (!hasPermission) {
					return {
						statusCode: 403,
						headers,
						body: JSON.stringify({ error: 'You do not have permission to manage this server' })
					};
				}

				// Get guild configuration
				if (!subRoute && event.httpMethod === 'GET') {
					// Find or create guild config
					let guildConfig = await GuildConfig.findOne({ guildId });

					if (!guildConfig) {
						guildConfig = new GuildConfig({ guildId });
						await guildConfig.save();
					}

					// Get additional guild info from Discord
					const client = await getDiscordClient();
					const guild = client.guilds.cache.get(guildId);

					if (!guild) {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({ error: 'Guild not found or bot is not a member' })
						};
					}

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify({
							config: guildConfig.toObject(),
							guild: {
								id: guild.id,
								name: guild.name,
								icon: guild.icon,
								memberCount: guild.memberCount
							}
						})
					};
				}

				// Update guild configuration
				if (!subRoute && event.httpMethod === 'POST') {
					try {
						// Validate input data
						if (body.prefix && body.prefix.length > 3) {
							return {
								statusCode: 400,
								headers,
								body: JSON.stringify({ error: 'Prefix must be 3 characters or less' })
							};
						}

						// Find and update guild configuration
						const updatedConfig = await GuildConfig.findOneAndUpdate(
							{ guildId },
							{
								$set: {
									prefix: body.prefix,
									welcomeChannel: body.welcomeChannel,
									welcomeMessage: body.welcomeMessage,
									logChannel: body.logChannel,
									logJoins: body.logJoins,
									logMessages: body.logMessages,
									disabledCommands: body.disabledCommands || [],
									...(body.autoModSettings && { autoModSettings: body.autoModSettings }),
									...(body.customRoles && { customRoles: body.customRoles })
								}
							},
							{ upsert: true, new: true }
						);

						return {
							statusCode: 200,
							headers,
							body: JSON.stringify({ success: true, config: updatedConfig.toObject() })
						};

					} catch (error) {
						console.error('Error updating guild config:', error);
						return {
							statusCode: 500,
							headers,
							body: JSON.stringify({ error: 'Failed to update configuration' })
						};
					}
				}

				// Get guild channels
				if (subRoute === 'channels' && event.httpMethod === 'GET') {
					const client = await getDiscordClient();
					const guild = client.guilds.cache.get(guildId);

					if (!guild) {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({ error: 'Guild not found or bot is not a member' })
						};
					}

					// Get guild configuration
					const guildConfig = await GuildConfig.findOne({ guildId });

					// Format channels for the response
					const channels = Array.from(guild.channels.cache.values())
						.filter(channel => channel.type === 0 || channel.type === 5) // Text channels and announcements
						.map(channel => ({
							id: channel.id,
							name: channel.name,
							type: channel.type,
							parentId: channel.parentId
						}));

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify({
							channels,
							config: guildConfig ? {
								welcomeChannel: guildConfig.welcomeChannel,
								logChannel: guildConfig.logChannel
							} : {}
						})
					};
				}

				// Get guild roles
				if (subRoute === 'roles' && event.httpMethod === 'GET') {
					const client = await getDiscordClient();
					const guild = client.guilds.cache.get(guildId);

					if (!guild) {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({ error: 'Guild not found or bot is not a member' })
						};
					}

					const roles = Array.from(guild.roles.cache.values())
						.filter(role => role.id !== guild.id) // Filter out @everyone
						.map(role => ({
							id: role.id,
							name: role.name,
							color: role.hexColor,
							position: role.position,
							managed: role.managed
						}))
						.sort((a, b) => b.position - a.position);

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify({ roles })
					};
				}
			}

			// If no matching route, return 404
			return {
				statusCode: 404,
				headers,
				body: JSON.stringify({ error: 'Not found' })
			};

		} catch (authError) {
			console.error('Authentication error:', authError);

			// Return 401 for authentication errors
			return {
				statusCode: 401,
				headers,
				body: JSON.stringify({ error: 'Authentication failed', message: authError.message })
			};
		}

	} catch (error) {
		console.error('API error:', error);

		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: 'Internal server error' })
		};
	}
};