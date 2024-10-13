exports.handler = async function (event, context) {
    const urlParams = new URLSearchParams(event.queryStringParameters);
    const code = urlParams.get('code');

    if (!code) {
        return {
            statusCode: 400,
            body: 'No authorization code provided.',
        };
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user connections
    const connectionsResponse = await fetch(
        'https://discord.com/api/users/@me/connections',
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
    );

    const connectionsData = await connectionsResponse.json();
    const youtubeConnection = Array.isArray(connectionsData)
        ? connectionsData.find((conn) => conn.type === 'youtube')
        : null;

    if (youtubeConnection) {
        const youtubeUrl = `https://www.youtube.com/channel/${youtubeConnection.id}`;
        return {
            statusCode: 200,
            body: `Your YouTube URL is: ${youtubeUrl}`,
        };
    } else {
        return {
            statusCode: 200,
            body: 'No YouTube connection found in your Discord account.',
        };
    }
};
