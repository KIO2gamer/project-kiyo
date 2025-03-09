const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

exports.handler = async (event, context) => {
	const params = new URLSearchParams(event.queryStringParameters);
	const code = params.get('code');
	if (!code) {
		return { statusCode: 400, body: "Missing code parameter" };
	}

	const data = new URLSearchParams({
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		code,
		redirect_uri: process.env.DISCORD_REDIRECT_URI,
	});

	try {
		// Exchange code for access token
		const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: data,
		});
		const tokenData = await tokenResponse.json();

		if (!tokenResponse.ok) {
			return { statusCode: tokenResponse.status, body: JSON.stringify(tokenData) };
		}

		// Optionally: Retrieve Discord user info here using tokenData.access_token

		// Here you can set a cookie or session (using additional libraries or Netlify Identity)
		// Then redirect the user back to your dashboard

		return {
			statusCode: 302,
			headers: { Location: "/dashboard.html" },
		};
	} catch (error) {
		return { statusCode: 500, body: error.toString() };
	}
};