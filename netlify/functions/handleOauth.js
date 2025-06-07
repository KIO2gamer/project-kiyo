const mongoose = require("mongoose");
const OAuthCode = require("../../src/database/OauthCode.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// MongoDB connection URI from environment variables
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";

let isConnected = false;

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await mongoose.connect(mongoUri, { bufferCommands: false });
            isConnected = true;
            console.log("✅ MongoDB connection established successfully");
        } catch (error) {
            handleError("❌ MongoDB connection error:", error);
            throw error;
        }
    }
}

function handleError(message, ...args) {
    console.error(message, ...args);
}

const algorithm = "aes-256-cbc";

function decrypt(text) {
    try {
        const [ivHex, encryptedTextHex, ...secretKeyHex] = text.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const encryptedText = Buffer.from(encryptedTextHex, "hex");
        const secretKey = Buffer.from(secretKeyHex.join(":"), "hex");
        const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        handleError("❌ Decryption error:", error);
        throw new Error("Failed to decrypt state parameter. Please try again.");
    }
}

exports.handler = async function (event) {
    try {
        await connectToDatabase();
        const { code, state } = getCodeAndState(event);

        if (!code || !state) {
            return createErrorResponse(400, "Missing authorization code or state parameter.");
        }

        try {
            const decryptedState = decrypt(state);
            // Parse the state JSON safely with proper error handling
            let parsedState;
            try {
                parsedState = JSON.parse(decryptedState);
            } catch (jsonError) {
                handleError("❌ Error parsing state JSON:", jsonError);
                return createErrorResponse(
                    400,
                    "Invalid state format",
                    "The state parameter could not be parsed correctly.",
                );
            }

            const accessToken = await exchangeCodeForToken(code);

            if (!accessToken) {
                return createErrorResponse(401, "Failed to obtain access token from Discord.");
            }

            const youtubeConnections = await getYouTubeConnections(accessToken);
            const userInfo = await getDiscordUserInfo(accessToken);

            if (youtubeConnections.length === 0) {
                return createErrorResponse(
                    404,
                    "No YouTube connections found for this Discord account.",
                    "Please connect your YouTube account to Discord first, then try again.",
                );
            }

            await saveOAuthRecord(decryptedState, code, youtubeConnections, userInfo);
            return createSuccessResponse(
                youtubeConnections.length,
                decryptedState,
                userInfo,
                youtubeConnections,
            );
        } catch (error) {
            handleError("❌ OAuth processing error:", error);
            if (error.message.includes("decrypt")) {
                return createErrorResponse(
                    400,
                    "Invalid state parameter",
                    "State parameter validation failed. Please restart the authorization process.",
                );
            }
            return createErrorResponse(
                500,
                "An unexpected error occurred while processing your request.",
                error.message,
            );
        }
    } catch (error) {
        handleError("❌ Critical error in handler:", error);
        return createErrorResponse(500, "A critical error occurred. Please try again later.");
    }
};

function getCodeAndState(event) {
    // Fixed: Netlify's queryStringParameters is already an object, not a string
    try {
        // Access query parameters directly instead of using URLSearchParams
        const { code, state } = event.queryStringParameters || {};
        return { code, state };
    } catch (error) {
        handleError("❌ Error parsing query parameters:", error);
        return { code: null, state: null };
    }
}

// --- Response Helper Functions ---

function createRedirectResponse(location, statusCode = 302) {
    return {
        statusCode,
        headers: {
            Location: location,
            "Cache-Control": "no-cache",
        },
        body: "",
    };
}

function createErrorResponse(
    statusCode,
    message,
    additionalMessage = "Please ensure both code and state are provided in the request.",
) {
    // Instead of returning inline HTML, redirect to the static site with error parameters
    const errorParams = new URLSearchParams({
        error: "oauth_error",
        error_description: message,
        error_details: additionalMessage,
        status_code: statusCode.toString(),
    });

    const redirectUrl = `/?${errorParams.toString()}`;
    return createRedirectResponse(redirectUrl);
}

async function exchangeCodeForToken(code) {
    try {
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            handleError("❌ Discord token exchange error:", tokenResponse.status, errorData);
            return null;
        }

        const tokenData = await tokenResponse.json();
        return tokenData.access_token;
    } catch (error) {
        handleError("❌ Error exchanging code for token:", error);
        return null;
    }
}

async function getDiscordUserInfo(accessToken) {
    try {
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            handleError(
                "❌ Discord user info error:",
                userResponse.status,
                userResponse.statusText,
            );
            return null;
        }

        return await userResponse.json();
    } catch (error) {
        handleError("❌ Error fetching Discord user info:", error);
        return null;
    }
}

async function getYouTubeConnections(accessToken) {
    try {
        const connectionsResponse = await fetch("https://discord.com/api/users/@me/connections", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!connectionsResponse.ok) {
            handleError(
                "❌ Discord connections API error:",
                connectionsResponse.status,
                connectionsResponse.statusText,
            );
            const errorData = await connectionsResponse.text();
            handleError("Discord connections API error details:", errorData);
            return []; // Return empty array on API error
        }

        const connectionsData = await connectionsResponse.json();

        if (!Array.isArray(connectionsData)) {
            handleError("❌ Error: connectionsData is not an array:", connectionsData);
            return []; // Return empty array if not an array
        }

        const youtubeConnections = connectionsData.filter(
            (connection) => connection.type === "youtube",
        );
        console.log(`✅ Found ${youtubeConnections.length} YouTube connections`);

        return youtubeConnections;
    } catch (error) {
        handleError("❌ Error fetching YouTube connections:", error);
        return [];
    }
}

async function saveOAuthRecord(state, code, youtubeConnections, userInfo) {
    try {
        let parsedState;
        try {
            parsedState = JSON.parse(state);
        } catch (error) {
            handleError("❌ Error parsing state for database save:", error);
            throw new Error("Invalid state format for database save");
        }

        const { interactionId, guildId, channelId } = parsedState;

        if (!interactionId || !guildId || !channelId) {
            throw new Error("Missing required state parameters");
        }

        const oauthRecord = new OAuthCode({
            interactionId,
            code,
            youtubeConnections: youtubeConnections.map((conn) => ({
                id: conn.id,
                name: conn.name,
                verified: conn.verified,
            })),
            guildId,
            channelId,
            userInfo: userInfo
                ? {
                      id: userInfo.id,
                      username: userInfo.username,
                      discriminator: userInfo.discriminator,
                      avatar: userInfo.avatar,
                  }
                : null,
            createdAt: new Date(),
        });

        await oauthRecord.save();
        console.log(`✅ OAuth record saved for interaction ${interactionId}`);
    } catch (error) {
        handleError("❌ Error saving OAuth record:", error);
        throw new Error("Failed to save authorization data");
    }
}

async function createSuccessResponse(connectionsLength, state, userInfo, youtubeConnections) {
    try {
        let parsedState;
        try {
            parsedState = JSON.parse(state);
        } catch (error) {
            handleError("❌ Error parsing state for response:", error);
            throw new Error("Invalid state format for response generation");
        }

        const { guildId, channelId } = parsedState;

        // Create success parameters to pass to the static site
        const successData = {
            success: "true",
            connections: connectionsLength.toString(),
            guild_id: guildId,
            channel_id: channelId,
            user_id: userInfo?.id || "",
            username: userInfo?.username || "",
            avatar: userInfo?.avatar || "",
            connection_data: JSON.stringify(youtubeConnections || []),
        };

        const successParams = new URLSearchParams(successData);
        const redirectUrl = `/?${successParams.toString()}`;

        return createRedirectResponse(redirectUrl);
    } catch (error) {
        handleError("❌ Error creating success response:", error);
        return createErrorResponse(500, "An error occurred while creating the success response");
    }
}
