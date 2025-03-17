const chalk = require("chalk");
const moment = require("moment");
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
    };

    static getSymbols() {
        return figuresCache || defaultSymbols;
    }

    static log(module, message, level = "info") {
        const timestamp = chalk.gray(`[${moment().format("HH:mm:ss")}]`);
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

        console.log(`${timestamp} ${symbolStr} ${moduleStr} ${message}`);
    }

    static error(message) {
        this.log("ERROR", message, "error");
    }

    static warn(message) {
        this.log("WARN", message, "warning");
    }

    static success(message) {
        this.log("SUCCESS", message, "success");
    }

    static info(message) {
        this.log("INFO", message, "info");
    }

    static debug(message) {
        if (process.env.DEBUG === "true") {
            this.log("DEBUG", message, "debug");
        }
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
