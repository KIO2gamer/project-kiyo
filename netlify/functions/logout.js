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
        const { code } = JSON.parse(event.body);
        
        await OAuthCode.deleteOne({ code });
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to logout' })
        };
    }
};