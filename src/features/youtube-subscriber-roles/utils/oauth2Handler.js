const express = require("express");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const TempOAuth2Storage = require("../database/tempOAuth2Storage");
const Logger = require("../../../utils/logger");
const { logError } = require("../../../utils/errorHandler");

class OAuth2Handler {
    constructor() {
        this.app = express();
        this.server = null;
        this.setupRoutes();
    }

    setupRoutes() {
        // Serve static files for the callback page
        this.app.use(express.static(path.join(__dirname, "../public")));

        // OAuth2 callback route
        this.app.get("/callback", async (req, res) => {
            const { code, state, error } = req.query;

            if (error) {
                return res.send(`
                    <html>
                        <head>
                            <title>Authorization Error</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                .error { color: #ff0000; }
                            </style>
                        </head>
                        <body>
                            <h1 class="error">Authorization Error</h1>
                            <p>There was an error during authorization: ${error}</p>
                            <p>You can close this window and try again.</p>
                        </body>
                    </html>
                `);
            }

            if (!code || !state) {
                return res.send(`
                    <html>
                        <head>
                            <title>Invalid Request</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                .error { color: #ff0000; }
                            </style>
                        </head>
                        <body>
                            <h1 class="error">Invalid Request</h1>
                            <p>Missing required parameters. Please try again.</p>
                        </body>
                    </html>
                `);
            }

            try {
                const statePayload = this.verifyState(state);
                if (!statePayload) {
                    return res.status(400).send(this.renderErrorPage("Invalid or expired state."));
                }

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

                // Cross-check state user with OAuth user to prevent misuse
                if (userId !== statePayload.userId) {
                    return res
                        .status(400)
                        .send(this.renderErrorPage("State/user mismatch. Please retry the flow."));
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
                    res.send(`
                        <html>
                            <head>
                                <title>Authorization Successful</title>
                                <style>
                                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                    .success { color: #00ff00; }
                                    .info { color: #0066cc; }
                                </style>
                            </head>
                            <body>
                                <h1 class="success">✅ Authorization Successful!</h1>
                                <p class="info">YouTube channel found: <strong>${youtubeConnection.name}</strong></p>
                                <p>You can now close this window and click "I've Already Authorized" in Discord to complete the verification process.</p>
                            </body>
                        </html>
                    `);
                } else {
                    res.send(`
                        <html>
                            <head>
                                <title>No YouTube Connection</title>
                                <style>
                                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                    .warning { color: #ffa500; }
                                </style>
                            </head>
                            <body>
                                <h1 class="warning">⚠️ No YouTube Connection Found</h1>
                                <p>Authorization was successful, but no YouTube channel is connected to your Discord account.</p>
                                <p>Please connect your YouTube channel in Discord Settings → Connections and try again.</p>
                            </body>
                        </html>
                    `);
                }
            } catch (error) {
                logError("OAuth2 callback error", error, { category: "API" });
                res.send(`
                    <html>
                        <head>
                            <title>Server Error</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                .error { color: #ff0000; }
                            </style>
                        </head>
                        <body>
                            <h1 class="error">❌ Server Error</h1>
                            <p>An error occurred while processing your authorization. Please try again.</p>
                        </body>
                    </html>
                `);
            }
        });

        // Health check route
        this.app.get("/health", (req, res) => {
            res.json({ status: "OK", timestamp: new Date().toISOString() });
        });
    }

    start(port = 3000) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    Logger.success(`OAuth2 callback server running on port ${port}`);
                    resolve();
                }
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    Logger.log("INFO", "OAuth2 callback server stopped");
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    renderErrorPage(message) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Authorization Error</title>
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
                    <h1>Authorization Error</h1>
                    <p>${message}</p>
                    <p>You can close this window and try again.</p>
                </div>
            </body>
            </html>
        `;
    }

    verifyState(state) {
        try {
            if (!state) return null;
            const secret = process.env.OAUTH_STATE_SECRET || process.env.DISCORD_CLIENT_SECRET;
            if (!secret) return null;

            const [payloadB64, signature] = state.split(".");
            if (!payloadB64 || !signature) return null;

            const expectedSig = crypto
                .createHmac("sha256", secret)
                .update(payloadB64)
                .digest("base64url");

            if (signature !== expectedSig) return null;

            const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
            const payload = JSON.parse(payloadJson);

            // Expire after 15 minutes
            if (Date.now() - payload.iat > 15 * 60 * 1000) return null;

            return payload;
        } catch (error) {
            Logger.error(`State verification failed: ${error.message}`);
            return null;
        }
    }
}

module.exports = OAuth2Handler;
