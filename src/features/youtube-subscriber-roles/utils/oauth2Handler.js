const express = require("express");
const axios = require("axios");
const path = require("path");
const TempOAuth2Storage = require("../database/tempOAuth2Storage");

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
                console.error("OAuth2 callback error:", error);
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
                    console.log(`OAuth2 callback server running on port ${port}`);
                    resolve();
                }
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log("OAuth2 callback server stopped");
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = OAuth2Handler;
