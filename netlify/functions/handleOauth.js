const mongoose = require('mongoose');
const OAuthCode = require('./../../bot_utils/OauthCode');

// MongoDB connection URI from environment variables
const mongoUri = process.env.MONGODB_URI;

// Initialize Mongoose connection (ensure only one connection is made)
let isConnected = false; // Keep track of connection status

function generateRandomString() {
    let randomString = '';
    const randomNumber = Math.floor(Math.random() * 10);

    for (let i = 0; i < 20 + randomNumber; i++) {
        randomString += String.fromCharCode(
            33 + Math.floor(Math.random() * 94),
        );
    }

    return randomString;
}

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                bufferCommands: false, // Disable Mongoose buffering
            });
            isConnected = true;
            console.log('MongoDB connected');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error; // Re-throw to handle it in the function
        }
    }
}

exports.handler = async function (event, context) {
    await connectToDatabase();
    const urlParams = new URLSearchParams(event.queryStringParameters);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code || !state) {
        return {
            statusCode: 400,
            body: 'Missing authorization code or state.',
        };
    }

    try {
        // Save the authorization code and interaction ID in MongoDB
        const oauthRecord = new OAuthCode({
            interactionId: state,
            code: code,
        });
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
