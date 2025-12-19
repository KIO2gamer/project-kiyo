const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL);
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: #1f2937;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 60px 40px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 5em;
                margin-bottom: 24px;
                display: inline-block;
                animation: bounce 0.6s ease-in-out;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            h1 {
                color: #10b981;
                font-size: 28px;
                margin-bottom: 16px;
                font-weight: 700;
            }
            .info {
                color: #6b7280;
                font-size: 16px;
                line-height: 1.6;
                margin: 20px 0;
            }
            p {
                color: #4b5563;
                font-size: 15px;
                line-height: 1.7;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🎉</div>
            <h1>${title}</h1>
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #1f2937;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 60px 40px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
                border-left: 5px solid #f59e0b;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 5em;
                margin-bottom: 24px;
                display: inline-block;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            h1 {
                color: #d97706;
                font-size: 28px;
                margin-bottom: 16px;
                font-weight: 700;
            }
            p {
                color: #4b5563;
                font-size: 15px;
                line-height: 1.7;
                margin: 12px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">⚠️</div>
            <h1>${title}</h1>
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: #1f2937;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 60px 40px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
                border-left: 5px solid #ef4444;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 5em;
                margin-bottom: 24px;
                display: inline-block;
                animation: shake 0.5s ease-in-out;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            h1 {
                color: #dc2626;
                font-size: 28px;
                margin-bottom: 16px;
                font-weight: 700;
            }
            p {
                color: #4b5563;
                font-size: 15px;
                line-height: 1.7;
                margin: 12px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">❌</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <p>You can close this window and try again.</p>
        </div>
    </body>
    </html>
  `;
}
