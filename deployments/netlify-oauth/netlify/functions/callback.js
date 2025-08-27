const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        cachedDb = connection;
        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

// TempOAuth2Storage Schema
const TempOAuth2Schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // Auto-delete after 1 hour
    },
});

const TempOAuth2Storage =
    mongoose.models.TempOAuth2 || mongoose.model("TempOAuth2", TempOAuth2Schema);

exports.handler = async (event) => {
    // Set CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "text/html",
    };

    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: "",
        };
    }

    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers,
            body: generateErrorPage("Method Not Allowed", "Only GET requests are allowed."),
        };
    }

    const { code, state, error } = event.queryStringParameters || {};

    if (error) {
        return {
            statusCode: 400,
            headers,
            body: generateErrorPage(
                "Authorization Error",
                `There was an error during authorization: ${error}`,
            ),
        };
    }

    if (!code || !state) {
        return {
            statusCode: 400,
            headers,
            body: generateErrorPage(
                "Invalid Request",
                "Missing required parameters. Please try again.",
            ),
        };
    }

    try {
        // Connect to database
        await connectToDatabase();

        // Exchange code for access token
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Get user info to get the user ID
        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userId = userResponse.data.id;

        // Get user's connections
        const connectionsResponse = await axios.get(
            "https://discord.com/api/users/@me/connections",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            },
        );

        const connections = connectionsResponse.data;
        const youtubeConnection = connections.find((conn) => conn.type === "youtube");

        // Store the access token temporarily
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        await TempOAuth2Storage.findOneAndUpdate(
            { userId },
            {
                userId,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt,
            },
            { upsert: true, new: true },
        );

        if (youtubeConnection) {
            return {
                statusCode: 200,
                headers,
                body: generateSuccessPage(
                    "Authorization Successful!",
                    `YouTube channel found: <strong>${youtubeConnection.name}</strong>`,
                    'You can now close this window and click "I\'ve Already Authorized" in Discord to complete the verification process.',
                ),
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: generateWarningPage(
                    "No YouTube Connection Found",
                    "Authorization was successful, but no YouTube channel is connected to your Discord account.",
                    "Please connect your YouTube channel in Discord Settings → Connections and try again.",
                ),
            };
        }
    } catch (error) {
        console.error("OAuth2 callback error:", error);
        return {
            statusCode: 500,
            headers,
            body: generateErrorPage(
                "Server Error",
                "An error occurred while processing your authorization. Please try again.",
            ),
        };
    }
};

function generateSuccessPage(title, message, instructions) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 500px;
            }
            .success { color: #4CAF50; font-size: 3em; margin-bottom: 20px; }
            .info { color: #2196F3; margin: 20px 0; }
            h1 { margin: 20px 0; font-size: 2em; }
            p { font-size: 1.1em; line-height: 1.6; }
            .icon { font-size: 4em; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🎉</div>
            <h1 class="success">${title}</h1>
            <p class="info">${message}</p>
            <p>${instructions}</p>
        </div>
    </body>
    </html>
  `;
}

function generateWarningPage(title, message, instructions) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 500px;
            }
            .warning { color: #FFA726; font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 20px 0; font-size: 2em; }
            p { font-size: 1.1em; line-height: 1.6; }
            .icon { font-size: 4em; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">⚠️</div>
            <h1 class="warning">${title}</h1>
            <p>${message}</p>
            <p>${instructions}</p>
        </div>
    </body>
    </html>
  `;
}

function generateErrorPage(title, message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                color: white;
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 500px;
            }
            .error { color: #f44336; font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 20px 0; font-size: 2em; }
            p { font-size: 1.1em; line-height: 1.6; }
            .icon { font-size: 4em; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">❌</div>
            <h1 class="error">${title}</h1>
            <p>${message}</p>
            <p>You can close this window and try again.</p>
        </div>
    </body>
    </html>
  `;
}
