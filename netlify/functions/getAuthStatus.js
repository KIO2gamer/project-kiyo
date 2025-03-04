const mongoose = require('mongoose');
const OAuthCode = require('./../../src/database/OauthCode');

async function connectToDatabase() {
    if (!mongoose.connection.readyState) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
}

exports.handler = async (event) => {
    try {
        await connectToDatabase();
        const authToken = event.headers.authorization?.split(' ')[1];
        if (!authToken) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        const session = await OAuthCode.findOne({ code: authToken })
            .select('userInfo youtubeConnections createdAt')
            .lean();

        return {
            statusCode: 200,
            body: JSON.stringify({
                authenticated: !!session,
                user: session?.userInfo || null
            })
        };
    } catch (error) {
        console.error('Auth status error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to check authentication status' })
        };
    }
};