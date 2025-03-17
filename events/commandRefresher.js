const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");
const Logger = require("./../utils/logger");

/**
 * Command Refresher - Watches command files for changes and reloads them
 * without requiring a bot restart. Useful during development.
 */
class CommandRefresher {
    /**
     * Initialize the command refresher
     * @param {Client} client - Discord.js client
     * @param {string} commandsDir - Directory containing command files
     * @returns {CommandRefresher} - Command refresher instance
     */
    static init(client, commandsDir) {
        return new CommandRefresher(client, commandsDir);
    }

    /**
     * Create a new CommandRefresher
     * @param {Client} client - Discord.js client
     * @param {string} commandsDir - Directory containing command files
     */
    constructor(client, commandsDir) {
        this.client = client;
        this.commandsDir = commandsDir || path.join(__dirname, "../commands");
        this.watchers = new Collection();
        this.fileToCommandMap = new Map();
        this.commandToFileMap = new Map();
        this.watching = false;
        this.debounceTimers = new Map();

        Logger.log("DEV", "Command refresher initialized", "info");
    }

    /**
     * Start watching command files for changes
     * @param {boolean} verbose - Whether to log all events (default: false)
     */
    startWatching(verbose = false) {
        if (this.watching) return;
        this.watching = true;
        this.verbose = verbose;

        Logger.log("DEV", `Starting to watch command files in ${this.commandsDir}`, "info");

        // Map commands to their files
        this.mapCommandsToFiles();

        // Start watching all command directories
        this.watchCommandDirectories();
    }

    /**
     * Map existing commands to their files for reference
     */
    mapCommandsToFiles() {
        this.fileToCommandMap.clear();
        this.commandToFileMap.clear();

        // Recursively find all command files
        this.findCommandFiles(this.commandsDir).forEach((filePath) => {
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                if (command?.data?.name) {
                    this.fileToCommandMap.set(filePath, command.data.name);
                    this.commandToFileMap.set(command.data.name, filePath);
                }
            } catch (error) {
                Logger.log(
                    "DEV",
                    `Error mapping command file ${filePath}: ${error.message}`,
                    "error",
                );
            }
        });

        Logger.log("DEV", `Mapped ${this.fileToCommandMap.size} commands to their files`, "info");
    }

    /**
     * Find all command files recursively
     * @param {string} dir - Directory to search
     * @returns {string[]} - Array of file paths
     */
    findCommandFiles(dir) {
        const files = [];

        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const filePath = path.join(dir, item.name);

            if (item.isDirectory()) {
                files.push(...this.findCommandFiles(filePath));
            } else if (item.isFile() && item.name.endsWith(".js")) {
                files.push(filePath);
            }
        }

        return files;
    }

    /**
     * Watch command directories for changes
     */
    watchCommandDirectories() {
        // First watch the main commands directory
        this.watchDirectory(this.commandsDir);

        // Then watch all subdirectories
        const items = fs.readdirSync(this.commandsDir, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                const subdirPath = path.join(this.commandsDir, item.name);
                this.watchDirectory(subdirPath);
            }
        }
    }

    /**
     * Watch a specific directory for file changes
     * @param {string} dir - Directory to watch
     */
    watchDirectory(dir) {
        try {
            const watcher = fs.watch(dir, { persistent: true }, (eventType, filename) => {
                if (!filename || !filename.endsWith(".js")) return;

                const filePath = path.join(dir, filename);

                // Debounce the file change event to prevent multiple reloads
                if (this.debounceTimers.has(filePath)) {
                    clearTimeout(this.debounceTimers.get(filePath));
                }

                this.debounceTimers.set(
                    filePath,
                    setTimeout(() => {
                        this.handleFileChange(eventType, filePath);
                        this.debounceTimers.delete(filePath);
                    }, 100),
                ); // 100ms debounce
            });

            this.watchers.set(dir, watcher);

            if (this.verbose) {
                Logger.log("DEV", `Watching directory: ${dir}`, "debug");
            }
        } catch (error) {
            Logger.log("DEV", `Error watching directory ${dir}: ${error.message}`, "error");
        }
    }

    /**
     * Handle a file change event
     * @param {string} eventType - Type of file event (change, rename)
     * @param {string} filePath - Path to the changed file
     */
    handleFileChange(eventType, filePath) {
        try {
            // Check if file exists before trying to reload
            if (!fs.existsSync(filePath)) {
                if (this.fileToCommandMap.has(filePath)) {
                    const commandName = this.fileToCommandMap.get(filePath);
                    Logger.log(
                        "DEV",
                        `Command file deleted: ${filePath} (${commandName})`,
                        "warning",
                    );
                }
                return;
            }

            // If this is a known command file, reload it
            if (this.fileToCommandMap.has(filePath)) {
                const commandName = this.fileToCommandMap.get(filePath);
                this.reloadCommand(commandName);
                return;
            }

            // Otherwise, this might be a new command file
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                if (command?.data?.name) {
                    // Add to the client's commands
                    this.client.commands.set(command.data.name, command);

                    // Update our maps
                    this.fileToCommandMap.set(filePath, command.data.name);
                    this.commandToFileMap.set(command.data.name, filePath);

                    Logger.log(
                        "DEV",
                        `New command detected and loaded: ${command.data.name}`,
                        "success",
                    );
                }
            } catch (error) {
                Logger.log(
                    "DEV",
                    `Error loading potential command file ${filePath}: ${error.message}`,
                    "error",
                );
            }
        } catch (error) {
            Logger.log("DEV", `Error handling file change: ${error.message}`, "error");
        }
    }

    /**
     * Reload a specific command by name
     * @param {string} commandName - Name of the command to reload
     * @returns {boolean} - Whether the reload was successful
     */
    reloadCommand(commandName) {
        try {
            // Check if command exists in our map
            if (!this.commandToFileMap.has(commandName)) {
                Logger.log("DEV", `Command ${commandName} not found in command map`, "warning");
                return false;
            }

            const filePath = this.commandToFileMap.get(commandName);

            // Delete from require cache to force reload
            delete require.cache[require.resolve(filePath)];

            // Load the command
            const command = require(filePath);

            // Validate command structure
            if (!command?.data?.name || !command?.execute) {
                Logger.log("DEV", `Invalid command structure in ${filePath}`, "error");
                return false;
            }

            // Update the command in the client's collection
            this.client.commands.set(command.data.name, command);

            // Handle aliases if present
            if (command.data.aliases) {
                command.data.aliases.forEach((alias) => {
                    this.client.commands.set(alias, command);
                });
            }

            Logger.log("DEV", `Reloaded command: ${command.data.name}`, "success");
            return true;
        } catch (error) {
            Logger.log("DEV", `Error reloading command ${commandName}: ${error.message}`, "error");
            return false;
        }
    }

    /**
     * Stop watching command files
     */
    stopWatching() {
        if (!this.watching) return;

        Logger.log("DEV", "Stopping command file watchers", "info");

        // Close all file watchers
        this.watchers.forEach((watcher) => {
            watcher.close();
        });

        this.watchers.clear();
        this.watching = false;

        // Clear any pending debounce timers
        this.debounceTimers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.debounceTimers.clear();
    }
}

module.exports = CommandRefresher;
