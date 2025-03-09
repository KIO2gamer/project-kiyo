exports.handler = async (event, context) => {
	const clientId = process.env.DISCORD_CLIENT_ID;
	const redirectUri = process.env.DISCORD_REDIRECT_URI; // e.g. https://kiyo-discord-bot.netlify.app/.netlify/functions/auth/discord-callback
	const scopes = "identify guilds";
	const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;

	return {
		statusCode: 302,
		headers: {
			Location: oauthUrl,
		},
	};
};