const OAuthCode = require('./../../bot_utils/OauthCode')

exports.handler = async function (event, context) {
    const urlParams = new URLSearchParams(event.queryStringParameters);
    const code = urlParams.get('code');
    const interactionId = urlParams.get('state'); // Use the state parameter as interaction ID

    if (!code || !interactionId) {
        return {
            statusCode: 400,
            body: 'Missing authorization code or interaction ID (state).',
        };
    }

    try {
        // Save the authorization code and interaction ID in MongoDB
        const oauthRecord = new OAuthCode({ interactionId, code });
        await oauthRecord.save();

        return {
            statusCode: 200,
            body: 'Authorization successful. You can return to Discord.',
        };
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        return {
            statusCode: 500,
            body: 'Error saving the OAuth code.',
        };
    }
};
