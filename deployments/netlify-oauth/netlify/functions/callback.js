const axios = require("axios");
const mongoose = require("mongoose");
const crypto = require("crypto");

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
    },
    guildId: {
        type: String,
        required: true,
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

TempOAuth2Schema.index({ userId: 1, guildId: 1 }, { unique: true });

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
        // Verify signed state
        const statePayload = verifyState(state);
        if (!statePayload) {
            return {
                statusCode: 400,
                headers,
                body: generateErrorPage("Invalid Request", "Invalid or expired state."),
            };
        }

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

        // Cross-check state user and ensure guildId present
        if (userId !== statePayload.userId || !statePayload.guildId) {
            return {
                statusCode: 400,
                headers,
                body: generateErrorPage("Invalid Request", "State/user mismatch. Please retry."),
            };
        }

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
        await TempOAuth2Storage.replaceOne(
            { userId, guildId: statePayload.guildId },
            {
                userId,
                guildId: statePayload.guildId,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt,
            },
            { upsert: true },
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

function verifyState(state) {
    try {
        if (!state) return null;
        const secret = process.env.OAUTH_STATE_SECRET || process.env.DISCORD_CLIENT_SECRET;
        if (!secret) return null;

        const parts = state.split(".");
        if (parts.length !== 2) return null;
        const [payloadB64, signature] = parts;

        const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(payloadB64)
            .digest("base64url");
        if (signature !== expectedSig) return null;

        const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
        const payload = JSON.parse(payloadJson);

        // Require userId and guildId, expire after 15 minutes
        if (!payload.userId || !payload.guildId) return null;
        if (Date.now() - payload.iat > 15 * 60 * 1000) return null;

        return payload;
    } catch (err) {
        console.error("State verification failed:", err.message);
        return null;
    }
}

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
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: '';
                position: absolute;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
                border-radius: 50%;
                top: -100px;
                right: -100px;
            }
            body::after {
                content: '';
                position: absolute;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                border-radius: 50%;
                bottom: -50px;
                left: -100px;
            }
            .container {
                background: rgba(30, 41, 59, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(51, 65, 85, 0.5);
                border-radius: 20px;
                padding: 50px 40px;
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                z-index: 10;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 4.5em;
                margin-bottom: 28px;
                display: inline-block;
                animation: float 3s ease-in-out infinite;
                filter: drop-shadow(0 8px 16px rgba(16, 185, 129, 0.2));
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
            }
            h1 {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 32px;
                margin-bottom: 12px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }
            .info {
                color: #cbd5e1;
                font-size: 16px;
                line-height: 1.6;
                margin: 16px 0;
                font-weight: 500;
            }
            p {
                color: #94a3b8;
                font-size: 14px;
                line-height: 1.8;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✨</div>
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
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: '';
                position: absolute;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
                border-radius: 50%;
                top: -100px;
                right: -100px;
            }
            body::after {
                content: '';
                position: absolute;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%);
                border-radius: 50%;
                bottom: -50px;
                left: -100px;
            }
            .container {
                background: rgba(31, 41, 55, 0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(245, 158, 11, 0.2);
                border-radius: 20px;
                padding: 50px 40px;
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                z-index: 10;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 158, 11, 0.1);
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 4.5em;
                margin-bottom: 28px;
                display: inline-block;
                animation: wobble 2s ease-in-out infinite;
                filter: drop-shadow(0 8px 16px rgba(245, 158, 11, 0.15));
            }
            @keyframes wobble {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-2deg); }
                75% { transform: rotate(2deg); }
            }
            h1 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 32px;
                margin-bottom: 12px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }
            p {
                color: #d1d5db;
                font-size: 14px;
                line-height: 1.8;
                margin: 10px 0;
            }
            p:first-of-type {
                font-size: 15px;
                font-weight: 500;
                color: #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">⚡</div>
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
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                background: linear-gradient(135deg, #1f1f2e 0%, #0f0f1e 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: '';
                position: absolute;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%);
                border-radius: 50%;
                top: -100px;
                right: -100px;
            }
            body::after {
                content: '';
                position: absolute;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%);
                border-radius: 50%;
                bottom: -50px;
                left: -100px;
            }
            .container {
                background: rgba(31, 31, 46, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 20px;
                padding: 50px 40px;
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                z-index: 10;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(239, 68, 68, 0.1);
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .icon {
                font-size: 4.5em;
                margin-bottom: 28px;
                display: inline-block;
                animation: pulse-shake 0.6s ease-in-out;
                filter: drop-shadow(0 8px 16px rgba(239, 68, 68, 0.25));
            }
            @keyframes pulse-shake {
                0% { transform: scale(1) rotate(0deg); opacity: 0; }
                50% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            h1 {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 32px;
                margin-bottom: 12px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }
            p {
                color: #d1d5db;
                font-size: 14px;
                line-height: 1.8;
                margin: 10px 0;
            }
            p:first-of-type {
                font-size: 15px;
                font-weight: 500;
                color: #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🚨</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <p>You can close this window and try again.</p>
        </div>
    </body>
    </html>
  `;
}
