const mongoose = require("mongoose");
const OAuthCode = require("../src/database/OauthCode.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// MongoDB connection URI from environment variables
const mongoUri = process.env.MONGODB_URL;
const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";

let isConnected = false;

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await mongoose.connect(mongoUri);
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

module.exports = async (req, res) => {
    try {
        await connectToDatabase();
        const { code, state } = getCodeAndState(req);

        if (!code || !state) {
            return createErrorResponse(res, 400, "Missing authorization code or state parameter.");
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
                    res,
                    400,
                    "Invalid state format",
                    "The state parameter could not be parsed correctly."
                );
            }

            const accessToken = await exchangeCodeForToken(code);

            if (!accessToken) {
                return createErrorResponse(res, 401, "Failed to obtain access token from Discord.");
            }

            const youtubeConnections = await getYouTubeConnections(accessToken);
            const userInfo = await getDiscordUserInfo(accessToken);

            if (youtubeConnections.length === 0) {
                return createErrorResponse(
                    res,
                    404,
                    "No YouTube connections found for this Discord account.",
                    "Please connect your YouTube account to Discord first, then try again."
                );
            }

            await saveOAuthRecord(decryptedState, code, youtubeConnections, userInfo);
            return createSuccessResponse(res, youtubeConnections.length, decryptedState, userInfo, youtubeConnections);
        } catch (error) {
            handleError("❌ OAuth processing error:", error);
            if (error.message.includes("decrypt")) {
                return createErrorResponse(
                    res,
                    400,
                    "Invalid state parameter",
                    "State parameter validation failed. Please restart the authorization process."
                );
            }
            return createErrorResponse(
                res,
                500,
                "An unexpected error occurred while processing your request.",
                error.message
            );
        }
    } catch (error) {
        handleError("❌ Critical error in handler:", error);
        return createErrorResponse(res, 500, "A critical error occurred. Please try again later.");
    }
};

function getCodeAndState(req) {
    try {
        const { code, state } = req.query || {};
        return { code, state };
    } catch (error) {
        handleError("❌ Error parsing query parameters:", error);
        return { code: null, state: null };
    }
}

function createRedirectResponse(res, location, statusCode = 302) {
    res.writeHead(statusCode, {
        Location: location,
        "Cache-Control": "no-cache",
    });
    res.end();
}

function createErrorResponse(res, statusCode, message, additionalMessage = "Please ensure both code and state are provided in the request.") {
    const errorParams = new URLSearchParams({
        error: "oauth_error",
        error_description: message,
        error_details: additionalMessage,
        status_code: statusCode.toString(),
    });
    const redirectUrl = `/?${errorParams.toString()}`;
    return createRedirectResponse(res, redirectUrl);
}

async function exchangeCodeForToken(code) {
    try {
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENTID,
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
                userResponse.statusText
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
                connectionsResponse.statusText
            );
            const errorData = await connectionsResponse.text();
            handleError("Discord connections API error details:", errorData);
            return [];
        }

        const connectionsData = await connectionsResponse.json();

        if (!Array.isArray(connectionsData)) {
            handleError("❌ Error: connectionsData is not an array:", connectionsData);
            return [];
        }

        const youtubeConnections = connectionsData.filter(
            (connection) => connection.type === "youtube"
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

function createSuccessResponse(res, connectionsLength, state, userInfo, youtubeConnections) {
    try {
        let parsedState;
        try {
            parsedState = JSON.parse(state);
        } catch (error) {
            handleError("❌ Error parsing state for response:", error);
            throw new Error("Invalid state format for response generation");
        }

        const { guildId, channelId } = parsedState;

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

        return createRedirectResponse(res, redirectUrl);
    } catch (error) {
        handleError("❌ Error creating success response:", error);
        return createErrorResponse(res, 500, "An error occurred while creating the success response");
    }
}
