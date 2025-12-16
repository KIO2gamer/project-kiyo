const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const Logger = require("../utils/logger");
const { GuildSettingsSchema } = require("../database/GuildSettingsSchema");
const AIChatChannel = require("../database/AIChatChannel");
const MsgLogsConfig = require("../database/msgLogsConfig");
const TicketConfig = require("../database/ticketConfig");
const YTSubRoleConfig = require("../features/youtube-subscriber-roles/database/ytSubRoleConfig");
const CustomCommands = require("../database/customCommands");

// In-memory session storage (can be replaced with Redis later)
const sessionStore = new Map();
const oauthStateStore = new Map();

const DISCORD_OAUTH_URL = "https://discord.com/api/oauth2";
const DISCORD_API_URL = "https://discord.com/api";

const manageGuildBit = BigInt(1 << 5); // Manage Guild permission bit

const settingsSchema = z.object({
    welcome: z
        .object({
            enabled: z.boolean().optional(),
            channelId: z.string().min(1).max(64).nullable().optional(),
            message: z.string().min(1).max(2000).optional(),
        })
        .optional(),
    aiChatChannelId: z.string().min(1).max(64).nullable().optional(),
    modLogChannelId: z.string().min(1).max(64).nullable().optional(),
    msgLogChannelId: z.string().min(1).max(64).nullable().optional(),
    ticketCategoryId: z.string().min(1).max(64).nullable().optional(),
    xp: z
        .object({
            enabled: z.boolean(),
            baseRate: z.number().min(0).max(10),
        })
        .optional(),
    ytSubRoleConfig: z
        .object({
            isEnabled: z.boolean().optional(),
            subscriberTiers: z
                .array(
                    z.object({
                        minSubscribers: z.number().int().min(0),
                        roleId: z.string().min(1).max(64),
                        tierName: z.string().min(1).max(64),
                    }),
                )
                .optional(),
        })
        .optional(),
});

const customCommandSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(32)
        .regex(/^[a-zA-Z0-9_-]+$/),
    message: z.string().trim().min(1).max(2000),
    alias_name: z
        .string()
        .trim()
        .min(2)
        .max(32)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .nullable()
        .optional(),
});

function getEnvConfig() {
    return {
        clientId: process.env.DASHBOARD_CLIENT_ID || process.env.DISCORD_CLIENT_ID || "",
        clientSecret:
            process.env.DASHBOARD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || "",
        redirectUri: process.env.DASHBOARD_REDIRECT_URI || process.env.DISCORD_REDIRECT_URI || "",
        sessionSecret: process.env.DASHBOARD_SESSION_SECRET || "",
        apiPort: Number(process.env.DASHBOARD_API_PORT || 3001),
        baseUrl: process.env.DASHBOARD_BASE_URL || "http://localhost:5173",
        allowOrigins: (process.env.DASHBOARD_ALLOW_ORIGINS || "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
    };
}

function hasManageGuild(permissions) {
    try {
        return (BigInt(permissions) & manageGuildBit) === manageGuildBit;
    } catch (err) {
        Logger.warn(`Failed to parse permissions: ${err.message}`);
        return false;
    }
}

function buildCorsOptions(allowOrigins) {
    const defaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
    const origins = [...new Set([...defaults, ...allowOrigins])].filter(Boolean);

    return {
        origin: (origin, callback) => {
            if (!origin || origins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    };
}

async function exchangeCodeForToken(code, config) {
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        scope: "identify guilds",
    });

    const response = await fetch(`${DISCORD_OAUTH_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to exchange code: ${response.status} ${text}`);
    }

    return response.json();
}

async function fetchDiscordUser(accessToken) {
    const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch user: ${response.status} ${text}`);
    }

    return response.json();
}

async function fetchDiscordGuilds(accessToken) {
    const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch guilds: ${response.status} ${text}`);
    }

    return response.json();
}

function createSession({ user, guilds, token, sessionSecret }) {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + token.expires_in * 1000;

    sessionStore.set(sessionId, {
        user,
        guilds,
        token,
        expiresAt,
    });

    const jwtToken = jwt.sign(
        {
            sessionId,
            userId: user.id,
        },
        sessionSecret,
        { expiresIn: "1h" },
    );

    return jwtToken;
}

function getSession(jwtToken, sessionSecret) {
    try {
        const decoded = jwt.verify(jwtToken, sessionSecret);
        const session = sessionStore.get(decoded.sessionId);
        if (!session) return null;

        if (session.expiresAt && session.expiresAt < Date.now()) {
            sessionStore.delete(decoded.sessionId);
            return null;
        }

        return { ...session, sessionId: decoded.sessionId };
    } catch {
        return null;
    }
}

function removeSession(sessionId) {
    if (sessionId) {
        sessionStore.delete(sessionId);
    }
}

async function resolveGuildSettings(guildId, client) {
    const [guildSettings, aiChat, msgLogs, ticketConfig, ytConfig] = await Promise.all([
        GuildSettingsSchema.findOne({ guildId }),
        AIChatChannel.findOne({ guildId }),
        MsgLogsConfig.findOne({ guildId }),
        TicketConfig.findOne({ guildId }),
        YTSubRoleConfig.findOne({ guildId }),
    ]);

    const status = {
        botTag: client.user?.tag,
        uptimeMs: client.uptime || 0,
        ping: client.ws.ping,
        readyAt: client.readyAt,
        guildCount: client.guilds.cache.size,
    };

    return {
        status,
        welcome: {
            enabled: guildSettings?.welcome?.enabled ?? false,
            channelId: guildSettings?.welcome?.channelId || null,
            message: guildSettings?.welcome?.message || "Welcome {user} to {server}!",
        },
        aiChatChannelId: aiChat?.channelId || null,
        modLogChannelId: guildSettings?.moderation?.moderationChannelId || null,
        msgLogChannelId: msgLogs?.channelId || null,
        ticketCategoryId: ticketConfig?.ticketCategoryId || null,
        xp: {
            enabled: guildSettings?.leveling?.enabled ?? true,
            baseRate: guildSettings?.leveling?.xpRate ?? 1,
        },
        ytSubRoleConfig: ytConfig
            ? {
                  isEnabled: ytConfig.isEnabled,
                  subscriberTiers: ytConfig.subscriberTiers,
                  updatedBy: ytConfig.updatedBy,
                  lastUpdated: ytConfig.lastUpdated,
              }
            : {
                  isEnabled: false,
                  subscriberTiers: [],
                  updatedBy: null,
                  lastUpdated: null,
              },
    };
}

function buildCookieOptions() {
    const secure = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    };
}

function authMiddleware(sessionSecret) {
    return (req, res, next) => {
        const token = req.cookies?.dash_session;
        if (!token) return res.status(401).json({ error: "Not authenticated" });

        const session = getSession(token, sessionSecret);
        if (!session) return res.status(401).json({ error: "Session expired" });

        req.session = session;
        return next();
    };
}

function guildAccessMiddleware(client) {
    return async (req, res, next) => {
        const { guildId } = req.params;
        const manageable = req.session.guilds.find(
            (g) => g.id === guildId && hasManageGuild(g.permissions),
        );

        if (!manageable) return res.status(403).json({ error: "Missing guild permission" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Bot is not in that guild" });

        req.guild = guild;
        return next();
    };
}

function serializeGuilds(guilds, client) {
    return guilds
        .filter((g) => hasManageGuild(g.permissions))
        .filter((g) => client.guilds.cache.has(g.id))
        .map((g) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            permissions: g.permissions,
        }));
}

function mapCommand(doc) {
    return {
        id: String(doc._id),
        name: doc.name,
        message: doc.message,
        alias_name: doc.alias_name || null,
    };
}

async function listCustomCommands() {
    const commands = await CustomCommands.find({}).sort({ name: 1 });
    return commands.map(mapCommand);
}

async function updateSettings(guildId, payload, userId) {
    if (payload.welcome) {
        await GuildSettingsSchema.findOneAndUpdate(
            { guildId },
            {
                $set: {
                    guildId,
                    "welcome.enabled": payload.welcome.enabled,
                    "welcome.channelId": payload.welcome.channelId,
                    "welcome.message": payload.welcome.message,
                },
            },
            { upsert: true },
        );
    }

    if (payload.aiChatChannelId !== undefined) {
        if (!payload.aiChatChannelId) {
            await AIChatChannel.deleteOne({ guildId });
        } else {
            await AIChatChannel.findOneAndUpdate(
                { guildId },
                { guildId, channelId: payload.aiChatChannelId, enabled: true },
                { upsert: true },
            );
        }
    }

    if (payload.modLogChannelId !== undefined) {
        await GuildSettingsSchema.findOneAndUpdate(
            { guildId },
            { $set: { guildId, "moderation.moderationChannelId": payload.modLogChannelId } },
            { upsert: true },
        );
    }

    if (payload.msgLogChannelId !== undefined) {
        if (!payload.msgLogChannelId) {
            await MsgLogsConfig.deleteOne({ guildId });
        } else {
            await MsgLogsConfig.findOneAndUpdate(
                { guildId },
                { guildId, channelId: payload.msgLogChannelId },
                { upsert: true },
            );
        }
    }

    if (payload.ticketCategoryId !== undefined) {
        if (!payload.ticketCategoryId) {
            await TicketConfig.deleteOne({ guildId });
        } else {
            await TicketConfig.findOneAndUpdate(
                { guildId },
                { guildId, ticketCategoryId: payload.ticketCategoryId },
                { upsert: true },
            );
        }
    }

    if (payload.xp) {
        await GuildSettingsSchema.findOneAndUpdate(
            { guildId },
            {
                $set: {
                    guildId,
                    "leveling.enabled": payload.xp.enabled,
                    "leveling.xpRate": payload.xp.baseRate,
                },
            },
            { upsert: true },
        );
    }

    if (payload.ytSubRoleConfig) {
        const ytPayload = {
            guildId,
            isEnabled: payload.ytSubRoleConfig.isEnabled ?? true,
            subscriberTiers: payload.ytSubRoleConfig.subscriberTiers ?? [],
            updatedBy: userId,
        };

        await YTSubRoleConfig.findOneAndUpdate({ guildId }, ytPayload, { upsert: true });
    }
}

function registerRoutes(app, client, config) {
    const cookieOptions = buildCookieOptions();
    const requireAuth = authMiddleware(config.sessionSecret);
    const requireGuild = guildAccessMiddleware(client);

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", ready: client.isReady(), uptimeMs: client.uptime || 0 });
    });

    app.get("/api/auth/login", (req, res) => {
        const state = crypto.randomUUID();
        oauthStateStore.set(state, Date.now());

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: "code",
            scope: "identify guilds",
            state,
            prompt: "consent",
        });

        res.redirect(`${DISCORD_OAUTH_URL}/authorize?${params.toString()}`);
    });

    app.get("/api/auth/callback", async (req, res) => {
        const { code, state } = req.query;

        try {
            if (!code || !state || !oauthStateStore.has(state)) {
                return res.status(400).send("Invalid OAuth state");
            }

            oauthStateStore.delete(state);

            const token = await exchangeCodeForToken(code, config);
            const user = await fetchDiscordUser(token.access_token);
            const guilds = await fetchDiscordGuilds(token.access_token);

            const signed = createSession({
                user,
                guilds,
                token,
                sessionSecret: config.sessionSecret,
            });

            res.cookie("dash_session", signed, cookieOptions);
            res.redirect(config.baseUrl);
        } catch (err) {
            Logger.error(`OAuth callback failed: ${err.message}`);
            res.status(500).send("Authentication failed");
        }
    });

    app.post("/api/auth/logout", requireAuth, (req, res) => {
        removeSession(req.session.sessionId);
        res.clearCookie("dash_session", cookieOptions);
        res.json({ ok: true });
    });

    app.get("/api/me", requireAuth, async (req, res) => {
        const manageable = serializeGuilds(req.session.guilds, client);
        res.json({ user: req.session.user, guilds: manageable });
    });

    app.get("/api/guilds", requireAuth, async (req, res) => {
        const manageable = serializeGuilds(req.session.guilds, client);
        res.json({ guilds: manageable });
    });

    app.get("/api/guilds/:guildId/settings", requireAuth, requireGuild, async (req, res) => {
        try {
            const payload = await resolveGuildSettings(req.params.guildId, client);
            res.json(payload);
        } catch (err) {
            Logger.error(`Failed to fetch settings: ${err.message}`);
            res.status(500).json({ error: "Failed to fetch settings" });
        }
    });

    app.put("/api/guilds/:guildId/settings", requireAuth, requireGuild, async (req, res) => {
        try {
            const parsed = settingsSchema.parse(req.body || {});
            await updateSettings(req.params.guildId, parsed, req.session.user.id);
            const payload = await resolveGuildSettings(req.params.guildId, client);
            res.json(payload);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ error: "Validation failed", details: err.errors });
            }
            Logger.error(`Failed to update settings: ${err.message}`);
            res.status(500).json({ error: "Failed to update settings" });
        }
    });

    app.get("/api/guilds/:guildId/custom-commands", requireAuth, requireGuild, async (req, res) => {
        try {
            const commands = await listCustomCommands();
            res.json({ commands });
        } catch (err) {
            Logger.error(`Failed to list custom commands: ${err.message}`);
            res.status(500).json({ error: "Failed to list commands" });
        }
    });

    app.post(
        "/api/guilds/:guildId/custom-commands",
        requireAuth,
        requireGuild,
        async (req, res) => {
            try {
                const parsed = customCommandSchema.parse(req.body || {});

                const existing = await CustomCommands.findOne({
                    $or: [
                        { name: parsed.name.toLowerCase() },
                        { alias_name: parsed.name.toLowerCase() },
                    ],
                });

                if (existing) {
                    return res.status(409).json({ error: "Command or alias already exists" });
                }

                if (parsed.alias_name) {
                    const aliasExists = await CustomCommands.findOne({
                        $or: [
                            { name: parsed.alias_name.toLowerCase() },
                            { alias_name: parsed.alias_name.toLowerCase() },
                        ],
                    });

                    if (aliasExists) {
                        return res.status(409).json({ error: "Alias already exists" });
                    }
                }

                const doc = new CustomCommands({
                    name: parsed.name.toLowerCase(),
                    message: parsed.message,
                    alias_name: parsed.alias_name ? parsed.alias_name.toLowerCase() : undefined,
                });

                await doc.save();
                const commands = await listCustomCommands();
                res.json({ commands });
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return res
                        .status(400)
                        .json({ error: "Validation failed", details: err.errors });
                }
                Logger.error(`Failed to create command: ${err.message}`);
                res.status(500).json({ error: "Failed to create command" });
            }
        },
    );

    app.put(
        "/api/guilds/:guildId/custom-commands/:commandId",
        requireAuth,
        requireGuild,
        async (req, res) => {
            try {
                const parsed = customCommandSchema.partial().parse(req.body || {});
                const command = await CustomCommands.findById(req.params.commandId);

                if (!command) return res.status(404).json({ error: "Command not found" });

                // Uniqueness checks
                if (parsed.name) {
                    const existing = await CustomCommands.findOne({
                        _id: { $ne: command._id },
                        $or: [
                            { name: parsed.name.toLowerCase() },
                            { alias_name: parsed.name.toLowerCase() },
                        ],
                    });
                    if (existing) {
                        return res.status(409).json({ error: "Command or alias already exists" });
                    }
                    command.name = parsed.name.toLowerCase();
                }

                if (parsed.alias_name !== undefined) {
                    if (parsed.alias_name) {
                        const aliasExists = await CustomCommands.findOne({
                            _id: { $ne: command._id },
                            $or: [
                                { name: parsed.alias_name.toLowerCase() },
                                { alias_name: parsed.alias_name.toLowerCase() },
                            ],
                        });
                        if (aliasExists) {
                            return res.status(409).json({ error: "Alias already exists" });
                        }
                        command.alias_name = parsed.alias_name.toLowerCase();
                    } else {
                        command.alias_name = undefined;
                    }
                }

                if (parsed.message) {
                    command.message = parsed.message;
                }

                await command.save();
                const commands = await listCustomCommands();
                res.json({ commands });
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return res
                        .status(400)
                        .json({ error: "Validation failed", details: err.errors });
                }
                Logger.error(`Failed to update command: ${err.message}`);
                res.status(500).json({ error: "Failed to update command" });
            }
        },
    );

    app.delete(
        "/api/guilds/:guildId/custom-commands/:commandId",
        requireAuth,
        requireGuild,
        async (req, res) => {
            try {
                await CustomCommands.findByIdAndDelete(req.params.commandId);
                const commands = await listCustomCommands();
                res.json({ commands });
            } catch (err) {
                Logger.error(`Failed to delete command: ${err.message}`);
                res.status(500).json({ error: "Failed to delete command" });
            }
        },
    );
}

function startApiServer(client) {
    const config = getEnvConfig();

    if (!config.clientId || !config.clientSecret || !config.redirectUri || !config.sessionSecret) {
        Logger.warn(
            "Dashboard API not started: set DASHBOARD_CLIENT_ID, DASHBOARD_CLIENT_SECRET, DASHBOARD_REDIRECT_URI, DASHBOARD_SESSION_SECRET",
        );
        return null;
    }

    const app = express();
    app.set("trust proxy", 1);

    app.use(cors(buildCorsOptions([config.baseUrl, ...config.allowOrigins])));
    app.use(cookieParser());
    app.use(express.json({ limit: "1mb" }));

    registerRoutes(app, client, config);

    const server = app.listen(config.apiPort, () => {
        Logger.success(`Dashboard API listening on port ${config.apiPort}`);
    });

    return server;
}

module.exports = { startApiServer };
