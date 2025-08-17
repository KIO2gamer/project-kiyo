const express = require("express");
const CommandPermissions = require("../../database/commandPermissions");

module.exports = (client) => {
    const router = express.Router();

    // Middleware to check if user is authenticated
    function requireAuth(req, res, next) {
        if (req.user) {
            next();
        } else {
            res.status(401).json({ error: "Unauthorized" });
        }
    }

    // Get bot stats
    router.get("/stats", requireAuth, (req, res) => {
        const stats = {
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            channels: client.channels.cache.size,
            commands: client.commands.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            ping: client.ws.ping,
        };
        res.json(stats);
    });

    // Get user's guilds where bot is present
    router.get("/guilds", requireAuth, async (req, res) => {
        try {
            const userGuilds = req.user.guilds || [];
            const botGuilds = client.guilds.cache;

            const mutualGuilds = userGuilds
                .filter((guild) => botGuilds.has(guild.id))
                .map((guild) => {
                    const botGuild = botGuilds.get(guild.id);
                    return {
                        id: guild.id,
                        name: guild.name,
                        icon: guild.icon,
                        owner: guild.owner,
                        permissions: guild.permissions,
                        memberCount: botGuild?.memberCount || 0,
                        channels: botGuild?.channels.cache.size || 0,
                    };
                });

            res.json(mutualGuilds);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get guild details
    router.get("/guild/:id", requireAuth, async (req, res) => {
        try {
            const guild = client.guilds.cache.get(req.params.id);
            if (!guild) {
                return res.status(404).json({ error: "Guild not found" });
            }

            // Check if user has permission to manage this guild
            const userGuild = req.user.guilds?.find((g) => g.id === req.params.id);
            if (!userGuild || !(userGuild.permissions & 0x20)) {
                // MANAGE_GUILD permission
                return res.status(403).json({ error: "Insufficient permissions" });
            }

            const guildData = {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                memberCount: guild.memberCount,
                channels: guild.channels.cache.map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                })),
                roles: guild.roles.cache.map((role) => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    position: role.position,
                })),
            };

            res.json(guildData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get commands
    router.get("/commands", requireAuth, (req, res) => {
        const commands = Array.from(client.commands.values()).map((cmd) => ({
            name: cmd.data.name,
            description: cmd.data.description,
            category: cmd.category,
            options: cmd.data.options || [],
        }));
        res.json(commands);
    });

    // Get command permissions for a guild
    router.get("/guild/:id/permissions", requireAuth, async (req, res) => {
        try {
            const permissions = await CommandPermissions.find({ guildId: req.params.id });
            res.json(permissions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update command permissions
    router.post("/guild/:id/permissions", requireAuth, async (req, res) => {
        try {
            const { commandName, permissions } = req.body;

            await CommandPermissions.findOneAndUpdate(
                { guildId: req.params.id, commandName },
                { permissions },
                { upsert: true, new: true },
            );

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get real-time bot activity (WebSocket endpoint would be better)
    router.get("/activity", requireAuth, (req, res) => {
        // This would typically be implemented with WebSockets
        // For now, return basic activity data
        res.json({
            timestamp: Date.now(),
            activeGuilds: client.guilds.cache.size,
            activeUsers: client.users.cache.size,
            commandsExecuted: 0, // You'd track this in your command handler
        });
    });

    // Get current bot settings
    router.get("/settings", requireAuth, async (req, res) => {
        try {
            // Get current bot settings from various sources
            const settings = {
                general: {
                    status: client.user?.presence?.status || "online",
                    activity: client.user?.presence?.activities?.[0]?.name || "",
                    activityType: client.user?.presence?.activities?.[0]?.type || 0,
                },
                moderation: {
                    autoMod: false, // You'd get this from your database
                    defaultTimeout: 10,
                    deleteCommands: false,
                    logChannel: null,
                },
                leveling: {
                    enabled: true,
                    xpPerMessage: 15,
                    levelUpChannel: "dm",
                    levelRoles: false,
                },
                youtube: {
                    enabled: !!process.env.GOOGLE_API_KEY,
                    tiers: [], // You'd get this from your YouTube subscriber roles config
                },
                logging: {
                    level: process.env.LOG_LEVEL || "INFO",
                    toFile: process.env.LOG_TO_FILE === "true",
                    commands: true,
                    errors: true,
                },
            };

            res.json({ success: true, settings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update bot settings
    router.post("/settings", requireAuth, async (req, res) => {
        try {
            const { general, moderation, leveling, youtube, logging } = req.body;

            // Update bot presence
            if (general) {
                const activityTypes = [
                    "Playing",
                    "Streaming",
                    "Listening",
                    "Watching",
                    "Competing",
                ];
                const activityType = activityTypes.indexOf(general.activityType);

                await client.user.setPresence({
                    status: general.status,
                    activities: general.activity
                        ? [
                              {
                                  name: general.activity,
                                  type: activityType >= 0 ? activityType : 0,
                              },
                          ]
                        : [],
                });
            }

            // Here you would save other settings to your database
            // For now, we'll just acknowledge the update

            res.json({ success: true, message: "Settings updated successfully" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Test YouTube API
    router.get("/test/youtube", requireAuth, async (req, res) => {
        try {
            if (!process.env.GOOGLE_API_KEY) {
                return res.json({ success: false, error: "Google API key not configured" });
            }

            // Test YouTube API connection
            const { google } = require("googleapis");
            const youtube = google.youtube({
                version: "v3",
                auth: process.env.GOOGLE_API_KEY,
            });

            // Simple test - get channel info for a known channel
            await youtube.channels.list({
                part: "snippet",
                id: "UC_x5XG1OV2P6uZZ5FSM9Ttw", // Google Developers channel
            });

            res.json({ success: true, message: "YouTube API connection successful" });
        } catch (error) {
            res.json({ success: false, error: error.message });
        }
    });

    // Test all APIs
    router.get("/test/all", requireAuth, async (req, res) => {
        try {
            const results = {};

            // Test Gemini AI
            try {
                if (process.env.GEMINI_API_KEY) {
                    const { GoogleGenerativeAI } = require("@google/generative-ai");
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                    await model.generateContent("Test");
                    results.gemini = { success: true };
                } else {
                    results.gemini = { success: false, error: "API key not configured" };
                }
            } catch (error) {
                results.gemini = { success: false, error: error.message };
            }

            // Test Weather API
            try {
                if (process.env.WEATHER_API_KEY) {
                    const axios = require("axios");
                    await axios.get(
                        `http://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.WEATHER_API_KEY}`,
                    );
                    results.weather = { success: true };
                } else {
                    results.weather = { success: false, error: "API key not configured" };
                }
            } catch (error) {
                results.weather = { success: false, error: error.message };
            }

            // Test Google Translate
            try {
                if (process.env.GOOGLE_API_KEY) {
                    const translate = require("@iamtraction/google-translate");
                    await translate("Hello", { to: "es" });
                    results.translate = { success: true };
                } else {
                    results.translate = { success: false, error: "API key not configured" };
                }
            } catch (error) {
                results.translate = { success: false, error: error.message };
            }

            // Test YouTube API
            try {
                if (process.env.GOOGLE_API_KEY) {
                    const { google } = require("googleapis");
                    const youtube = google.youtube({
                        version: "v3",
                        auth: process.env.GOOGLE_API_KEY,
                    });
                    await youtube.channels.list({
                        part: "snippet",
                        id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
                    });
                    results.youtube = { success: true };
                } else {
                    results.youtube = { success: false, error: "API key not configured" };
                }
            } catch (error) {
                results.youtube = { success: false, error: error.message };
            }

            res.json({ success: true, results });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get log history for dashboard
    router.get("/logs", requireAuth, (req, res) => {
        try {
            const Logger = require("../../utils/logger");
            const limit = parseInt(req.query.limit) || 100;
            const level = req.query.level;
            const module = req.query.module;

            let logs = Logger.getHistory(limit);

            // Filter by level if specified
            if (level) {
                logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
            }

            // Filter by module if specified
            if (module) {
                logs = logs.filter(log => log.module.toLowerCase() === module.toLowerCase());
            }

            res.json({
                success: true,
                logs: logs.reverse(), // Most recent first
                total: logs.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Clear log history
    router.delete("/logs", requireAuth, (req, res) => {
        try {
            const Logger = require("../../utils/logger");
            Logger.clearHistory();
            res.json({ success: true, message: "Log history cleared" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Set Discord log channel
    router.post("/logs/discord-channel", requireAuth, async (req, res) => {
        try {
            const { channelId, guildId } = req.body;

            // Verify user has permission to manage this guild
            const userGuild = req.user.guilds?.find(g => g.id === guildId);
            if (!userGuild || !(userGuild.permissions & 0x20)) {
                return res.status(403).json({ success: false, error: "Insufficient permissions" });
            }

            // Verify channel exists and bot has access
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ success: false, error: "Guild not found" });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel || !channel.isTextBased()) {
                return res.status(404).json({ success: false, error: "Channel not found or not a text channel" });
            }

            // Check bot permissions
            const botMember = guild.members.cache.get(client.user.id);
            if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
                return res.status(403).json({ 
                    success: false, 
                    error: "Bot doesn't have permission to send messages in this channel" 
                });
            }

            const Logger = require("../../utils/logger");
            Logger.setLogChannel(channelId);

            res.json({ success: true, message: "Discord log channel set successfully" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Send test log to Discord
    router.post("/logs/test-discord", requireAuth, async (req, res) => {
        try {
            const Logger = require("../../utils/logger");
            await Logger.logToDiscord("Test log message from dashboard", "info", "DASHBOARD");
            res.json({ success: true, message: "Test log sent to Discord" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
