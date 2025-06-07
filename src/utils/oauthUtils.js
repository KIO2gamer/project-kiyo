const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Logger = require("./logger");

class OAuth2Utils {
    constructor() {
        this.algorithm = "aes-256-gcm";
        this.jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";
    }

    /**
     * Generate a secure state parameter with JWT and encryption
     * @param {Object} data - Data to encode in state
     * @returns {string} Encrypted state parameter
     */
    generateSecureState(data) {
        try {
            // Add security metadata
            const stateData = {
                ...data,
                timestamp: Date.now(),
                nonce: crypto.randomBytes(16).toString("hex"),
                version: "2.0",
            };

            // Create JWT
            const jwt = this.createJWT(stateData);
            
            // Encrypt the JWT
            return this.encrypt(jwt);
        } catch (error) {
            Logger.error("Error generating secure state:", error);
            throw new Error("Failed to generate secure state parameter");
        }
    }

    /**
     * Verify and decrypt state parameter
     * @param {string} encryptedState - Encrypted state parameter
     * @returns {Object} Decrypted and verified state data
     */
    verifySecureState(encryptedState) {
        try {
            // Decrypt the state
            const jwt = this.decrypt(encryptedState);
            
            // Verify JWT
            const stateData = this.verifyJWT(jwt);
            
            // Check timestamp (max 15 minutes old)
            const maxAge = 15 * 60 * 1000; // 15 minutes
            if (Date.now() - stateData.timestamp > maxAge) {
                throw new Error("State parameter has expired");
            }
            
            return stateData;
        } catch (error) {
            Logger.error("Error verifying secure state:", error);
            throw new Error("Invalid or expired state parameter");
        }
    }

    /**
     * Create a JWT token
     * @param {Object} payload - Data to encode
     * @returns {string} JWT token
     */
    createJWT(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: "15m",
            issuer: "project-kiyo",
            audience: "oauth2-flow",
        });
    }

    /**
     * Verify a JWT token
     * @param {string} token - JWT token to verify
     * @returns {Object} Decoded payload
     */
    verifyJWT(token) {
        return jwt.verify(token, this.jwtSecret, {
            issuer: "project-kiyo",
            audience: "oauth2-flow",
        });
    }

    /**
     * Encrypt text using AES-256-GCM
     * @param {string} text - Text to encrypt
     * @returns {string} Encrypted text
     */
    encrypt(text) {
        try {
            const key = crypto.scryptSync(this.jwtSecret, "salt", 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.algorithm, key);
            
            let encrypted = cipher.update(text, "utf8", "hex");
            encrypted += cipher.final("hex");
            
            const authTag = cipher.getAuthTag();
            
            return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
        } catch (error) {
            Logger.error("Encryption error:", error);
            throw new Error("Failed to encrypt data");
        }
    }

    /**
     * Decrypt text using AES-256-GCM
     * @param {string} encryptedText - Text to decrypt
     * @returns {string} Decrypted text
     */
    decrypt(encryptedText) {
        try {
            const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
            
            if (!ivHex || !authTagHex || !encrypted) {
                throw new Error("Invalid encrypted data format");
            }
            
            const key = crypto.scryptSync(this.jwtSecret, "salt", 32);
            const iv = Buffer.from(ivHex, "hex");
            const authTag = Buffer.from(authTagHex, "hex");
            
            const decipher = crypto.createDecipher(this.algorithm, key);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            
            return decrypted;
        } catch (error) {
            Logger.error("Decryption error:", error);
            throw new Error("Failed to decrypt data");
        }
    }

    /**
     * Generate Discord OAuth2 URL with enhanced security
     * @param {Object} stateData - State data to encode
     * @param {Array} scopes - OAuth2 scopes
     * @returns {string} OAuth2 authorization URL
     */
    generateDiscordOAuthUrl(stateData, scopes = ["identify", "connections"]) {
        try {
            const state = this.generateSecureState(stateData);
            const clientId = process.env.DISCORD_CLIENT_ID;
            const redirectUri = process.env.DISCORD_REDIRECT_URI;
            
            if (!clientId || !redirectUri) {
                throw new Error("Missing Discord OAuth2 configuration");
            }
            
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: scopes.join(" "),
                state: state,
                prompt: "consent", // Always ask for consent for security
            });
            
            return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
        } catch (error) {
            Logger.error("Error generating OAuth URL:", error);
            throw new Error("Failed to generate authorization URL");
        }
    }

    /**
     * Validate OAuth2 callback parameters
     * @param {Object} params - Callback parameters
     * @returns {Object} Validated parameters
     */
    validateCallbackParams(params) {
        const { code, state, error, error_description } = params;
        
        if (error) {
            throw new Error(`OAuth2 error: ${error} - ${error_description || "Unknown error"}`);
        }
        
        if (!code || !state) {
            throw new Error("Missing required OAuth2 parameters (code or state)");
        }
        
        return { code, state };
    }

    /**
     * Generate a secure random string
     * @param {number} length - Length of the string
     * @returns {string} Random string
     */
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString("hex");
    }

    /**
     * Rate limiting helper for OAuth2 requests
     * @param {string} identifier - Unique identifier (IP, user ID, etc.)
     * @param {number} maxRequests - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {boolean} Whether request is allowed
     */
    checkRateLimit(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
        // This would typically use Redis or in-memory cache
        // For now, return true (implementation depends on your caching solution)
        return true;
    }
}

module.exports = new OAuth2Utils();

