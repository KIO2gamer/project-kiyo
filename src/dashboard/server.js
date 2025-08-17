const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { Client } = require("discord.js");
const Logger = require("../utils/logger");

class DashboardServer {
    constructor(discordClient) {
        this.app = express();
        this.client = discordClient;
        this.server = null;

        this.setupMiddleware();
        this.setupAuth();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Session configuration
        this.app.use(
            session({
                secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
                resave: false,
                saveUninitialized: false,
                store: MongoStore.create({
                    mongoUrl: process.env.MONGODB_URL,
                }),
                cookie: {
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                },
            }),
        );

        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Static files
        this.app.use(express.static(path.join(__dirname, "public")));

        // View engine
        this.app.set("view engine", "ejs");
        this.app.set("views", path.join(__dirname, "views"));

        // Passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());
    }

    setupAuth() {
        passport.use(
            new DiscordStrategy(
                {
                    clientID: process.env.DISCORD_CLIENT_ID,
                    clientSecret: process.env.DISCORD_CLIENT_SECRET,
                    callbackURL:
                        process.env.DASHBOARD_CALLBACK_URL ||
                        "http://localhost:3001/auth/discord/callback",
                    scope: ["identify", "guilds"],
                },
                (accessToken, refreshToken, profile, done) => {
                    return done(null, profile);
                },
            ),
        );

        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((user, done) => {
            done(null, user);
        });
    }

    setupRoutes() {
        // Import route handlers
        const authRoutes = require("./routes/auth");
        const dashboardRoutes = require("./routes/dashboard");
        const apiRoutes = require("./routes/api");

        // Use routes
        this.app.use("/auth", authRoutes);
        this.app.use("/dashboard", dashboardRoutes);
        this.app.use("/api", apiRoutes(this.client));

        // Root route
        this.app.get("/", (req, res) => {
            if (req.user) {
                res.redirect("/dashboard");
            } else {
                res.render("index", { user: null });
            }
        });
    }

    start(port = 3001) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, (err) => {
                if (err) {
                    Logger.error(`Dashboard server failed to start: ${err.message}`);
                    reject(err);
                } else {
                    Logger.success(`Dashboard server running on port ${port}`);
                    Logger.log("DASHBOARD", `Access at: http://localhost:${port}`);
                    resolve();
                }
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    Logger.log("DASHBOARD", "Dashboard server stopped");
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DashboardServer;
