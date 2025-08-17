const chalk = require("chalk");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

// Use dynamic imports for ESM modules
let boxenCache = null;
let figuresCache = null;

// Default symbols to use until figures loads
const defaultSymbols = {
    info: "ℹ",
    error: "✖",
    warning: "⚠",
    success: "✓",
    bullet: "•",
};

// Discord client reference for logging to Discord
let discordClient = null;
let logChannelId = null;

// Log storage for dashboard
const logHistory = [];
const MAX_LOG_HISTORY = 1000;

function formatLogObject(obj) {
    if (obj instanceof Error) {
        return obj.stack || obj.message;
    } else if (typeof obj === "object" && obj !== null) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(obj);
        }
    }
    return obj;
}

class Logger {
    static COLORS = {
        BOT: chalk.cyan,
        COMMANDS: chalk.yellow,
        EVENTS: chalk.magenta,
        DATABASE: chalk.blue,
        DEPLOY: chalk.green,
        DEV: chalk.gray,
        PRESENCE: chalk.blueBright,
        ERROR: chalk.red,
        WARN: chalk.yellow,
        INFO: chalk.white,
        SUCCESS: chalk.green,
        AI: chalk.hex("#10a37f"),
        DASHBOARD: chalk.hex("#ff6b35"),
        API: chalk.hex("#4ecdc4"),
        SECURITY: chalk.hex("#ff4757"),
    };

    static DISCORD_COLORS = {
        ERROR: 0xff4757,    // Red
        WARN: 0xffa502,     // Orange
        INFO: 0x3742fa,     // Blue
        SUCCESS: 0x2ed573,  // Green
        DEBUG: 0x747d8c,    // Gray
        BOT: 0x00d2d3,      // Cyan
        COMMANDS: 0xffa502, // Yellow
        EVENTS: 0xa55eea,   // Purple
        DATABASE: 0x3742fa, // Blue
        DEPLOY: 0x2ed573,   // Green
        DASHBOARD: 0xff6b35, // Orange
        API: 0x4ecdc4,      // Teal
        SECURITY: 0xff4757, // Red
    };

    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
    };

    static currentLogLevel = Logger.LOG_LEVELS[process.env.LOG_LEVEL] || Logger.LOG_LEVELS.INFO;

    static getSymbols() {
        return figuresCache || defaultSymbols;
    }

    static setDiscordClient(client, channelId = null) {
        discordClient = client;
        logChannelId = channelId;
        this.log("LOGGER", "Discord client configured for logging", "info");
    }

    static setLogChannel(channelId) {
        logChannelId = channelId;
        this.log("LOGGER", `Log channel set to: ${channelId}`, "info");
    }

    static shouldLog(level) {
        const levelValue = this.LOG_LEVELS[level.toUpperCase()] || this.LOG_LEVELS.INFO;
        return levelValue <= this.currentLogLevel;
    }

    static async writeToFile(logEntry) {
        if (process.env.LOG_TO_FILE !== "true") return;

        try {
            const logDir = process.env.LOG_FOLDER || "logs";
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logFile = path.join(logDir, `${moment().format("YYYY-MM-DD")}.log`);
            const logLine = `${logEntry.timestamp} [${logEntry.level}] [${logEntry.module}] ${logEntry.message}\n`;
            
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error("Failed to write to log file:", error.message);
        }
    }

    static async sendToDiscord(logEntry) {
        if (!discordClient || !logChannelId || !discordClient.isReady()) return;

        try {
            const channel = await discordClient.channels.fetch(logChannelId);
            if (!channel || !channel.isTextBased()) return;

            // Only send important logs to Discord (ERROR, WARN, and specific modules)
            const importantModules = ["ERROR", "WARN", "SECURITY", "DATABASE", "DEPLOY"];
            if (!importantModules.includes(logEntry.module.toUpperCase()) && 
                !importantModules.includes(logEntry.level.toUpperCase())) {
                return;
            }

            const embed = {
                color: this.DISCORD_COLORS[logEntry.module.toUpperCase()] || 
                       this.DISCORD_COLORS[logEntry.level.toUpperCase()] || 
                       this.DISCORD_COLORS.INFO,
                title: `${this.getDiscordEmoji(logEntry.level)} ${logEntry.module}`,
                description: logEntry.message.length > 2000 ? 
                    logEntry.message.substring(0, 1997) + "..." : 
                    logEntry.message,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Level: ${logEntry.level.toUpperCase()}`
                }
            };

            await channel.send({ embeds: [embed] });
        } catch (error) {
            // Don't log Discord errors to avoid infinite loops
            console.error("Failed to send log to Discord:", error.message);
        }
    }

    static getDiscordEmoji(level) {
        const emojis = {
            error: "🔴",
            warn: "🟡", 
            warning: "🟡",
            info: "🔵",
            success: "🟢",
            debug: "⚪"
        };
        return emojis[level.toLowerCase()] || "ℹ️";
    }

    static addToHistory(logEntry) {
        logHistory.push(logEntry);
        if (logHistory.length > MAX_LOG_HISTORY) {
            logHistory.shift(); // Remove oldest entry
        }
    }

    static getHistory(limit = 100) {
        return logHistory.slice(-limit);
    }

    static clearHistory() {
        logHistory.length = 0;
    }

    static async log(module, message, level = "info") {
        // Check if we should log this level
        if (!this.shouldLog(level)) return;

        const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
        const timestampColored = chalk.gray(`[${moment().format("HH:mm:ss")}]`);
        const moduleStr = this.COLORS[module.toUpperCase()]
            ? this.COLORS[module.toUpperCase()](`[${module}]`)
            : chalk.white(`[${module}]`);

        const symbols = this.getSymbols();
        const symbol = symbols[level] || symbols.info;
        const levelColor =
            level === "error"
                ? "red"
                : level === "warning"
                    ? "yellow"
                    : level === "success"
                        ? "green"
                        : level === "debug"
                            ? "gray"
                            : "blue";

        const symbolStr = chalk[levelColor](symbol);
        const formattedMessage = typeof message === "object" ? formatLogObject(message) : message;

        // Console output
        console.log(`${timestampColored} ${symbolStr} ${moduleStr} ${formattedMessage}`);

        // Create log entry for other outputs
        const logEntry = {
            timestamp,
            module,
            message: formattedMessage,
            level: level.toUpperCase(),
            raw: message
        };

        // Add to history for dashboard
        this.addToHistory(logEntry);

        // Write to file if enabled
        await this.writeToFile(logEntry);

        // Send to Discord if configured and important
        await this.sendToDiscord(logEntry);
    }

    static async error(message, module = "ERROR") {
        await this.log(module, message, "error");
    }

    static async warn(message, module = "WARN") {
        await this.log(module, message, "warning");
    }

    static async success(message, module = "SUCCESS") {
        await this.log(module, message, "success");
    }

    static async info(message, module = "INFO") {
        await this.log(module, message, "info");
    }

    static async debug(message, module = "DEBUG") {
        await this.log(module, message, "debug");
    }

    // Specialized logging methods for different components
    static async bot(message, level = "info") {
        await this.log("BOT", message, level);
    }

    static async command(message, level = "info") {
        await this.log("COMMANDS", message, level);
    }

    static async event(message, level = "info") {
        await this.log("EVENTS", message, level);
    }

    static async database(message, level = "info") {
        await this.log("DATABASE", message, level);
    }

    static async dashboard(message, level = "info") {
        await this.log("DASHBOARD", message, level);
    }

    static async api(message, level = "info") {
        await this.log("API", message, level);
    }

    static async security(message, level = "warn") {
        await this.log("SECURITY", message, level);
    }

    // Discord-specific logging methods
    static async logToDiscord(message, level = "info", module = "BOT") {
        const logEntry = {
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
            module,
            message: typeof message === "object" ? formatLogObject(message) : message,
            level: level.toUpperCase(),
            raw: message
        };

        await this.sendToDiscord(logEntry);
    }

    static async commandUsage(commandName, user, guild, success = true) {
        const message = `Command "${commandName}" ${success ? 'executed' : 'failed'} by ${user.tag} in ${guild?.name || 'DM'}`;
        await this.log("COMMANDS", message, success ? "info" : "warn");
    }

    static async errorWithContext(error, context = {}) {
        const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
        const contextStr = Object.keys(context).length > 0 ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';
        await this.log("ERROR", `${errorMessage}${contextStr}`, "error");
    }

    static startupBox(message) {
        // Use a fallback if boxen isn't available yet
        if (!boxenCache) {
            // Create our own box while boxen loads
            const boxWidth = message.length + 4;
            const horizontalLine = chalk.cyan("━".repeat(boxWidth));

            console.log("");
            console.log(horizontalLine);
            console.log(chalk.cyan("┃") + " " + chalk.bold(message) + " " + chalk.cyan("┃"));
            console.log(horizontalLine);
            console.log("");
            return;
        }

        console.log(
            boxenCache(chalk.bold(message), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "cyan",
                backgroundColor: "#222",
            }),
        );
    }

    static table(data, title = null) {
        if (title) {
            console.log(chalk.cyan(`\n━━━ ${title} ━━━`));
        }

        // Convert data object to a better formatted table
        const rows = [];
        for (const [key, value] of Object.entries(data)) {
            rows.push([chalk.yellow(key), value]);
        }

        // Custom simple table format
        const maxKeyLength = Math.max(...rows.map((row) => row[0].length)) + 2;
        rows.forEach((row) => {
            console.log(`${row[0].padEnd(maxKeyLength)} ${row[1]}`);
        });
        console.log(chalk.cyan("━".repeat(40)));
    }
}

// Preload ESM modules
Promise.all([
    import("boxen").then((module) => {
        boxenCache = module.default;
    }),
    import("figures").then((module) => {
        figuresCache = module.default;
    }),
]).catch((error) => {
    console.log("Note: Using fallback styles (some modules couldn't be loaded)");
});

module.exports = Logger;
