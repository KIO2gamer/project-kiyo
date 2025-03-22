const fs = require("fs");
const path = require("path");
const { Collection, PermissionsBitField, MessageFlags } = require("discord.js");
const Logger = require("../utils/logger");
const ErrorHandler = require("../utils/errorHandler");

/**
 * CommandHandler - Manages command registration, execution, and dynamic reloading
 */
class CommandHandler {
    /**
     * Initialize the command handler
     * @param {Client} client - Discord.js client instance
     * @param {Object} options - Configuration options
     * @param {string} options.commandsDir - Directory containing command files
     * @param {boolean} options.enableHotReload - Whether to enable hot reloading (dev mode)
     * @returns {CommandHandler} - The command handler instance
     */
    static init(client, options = {}) {
        return new CommandHandler(client, options);
    }

    /**
     * Create a new CommandHandler instance
     * @param {Client} client - Discord.js client instance
     * @param {Object} options - Configuration options
     */
    constructor(client, options = {}) {
        this.client = client;
        this.commandsDir = options.commandsDir || path.join(process.cwd(), "src/commands");
        this.enableHotReload = options.enableHotReload || process.env.NODE_ENV === "development";

        // Command tracking
        this.cooldowns = new Collection();
        this.recentCommands = new Collection();
        this.MAX_RECENT_COMMANDS = 100;

        // Hot reload tracking
        this.watchers = new Collection();
        this.fileToCommandMap = new Map();
        this.commandToFileMap = new Map();
        this.watching = false;
        this.debounceTimers = new Map();

        Logger.log("COMMANDS", "Command handler initialized", "info");

        // Start hot reloading if enabled
        if (this.enableHotReload) {
            this.startWatching();
        }
    }

    /**
     * Load all commands from the commands directory
     * @returns {Promise<Collection>} - Collection of loaded commands
     */
    async loadCommands() {
        const commands = new Collection();

        try {
            // Find all command files
            const commandFiles = this.findCommandFiles(this.commandsDir);

            // Load each command
            for (const filePath of commandFiles) {
                try {
                    if (
                        filePath ===
                        `C:\\Users\\KIO2gamer\\github_projects\\project-kiyo\\src\\commands\\handler.js`
                    )
                        return; // Skip the handler file

                    // Clear cache if reloading
                    delete require.cache[require.resolve(filePath)];

                    const command = require(filePath);

                    // Validate command structure
                    if (!command?.data?.name) {
                        Logger.log(
                            "COMMANDS",
                            `Invalid command at ${filePath}: missing data.name property`,
                            "warning",
                        );
                        continue;
                    }

                    if (typeof command.execute !== "function") {
                        Logger.log(
                            "COMMANDS",
                            `Invalid command at ${filePath}: missing execute method`,
                            "warning",
                        );
                        continue;
                    }

                    // Add command to collection
                    commands.set(command.data.name, command);

                    // Update file mappings for hot reload
                    this.fileToCommandMap.set(filePath, command.data.name);
                    this.commandToFileMap.set(command.data.name, filePath);

                    // Handle command aliases if present
                    if (command.data.aliases && Array.isArray(command.data.aliases)) {
                        command.data.aliases.forEach((alias) => {
                            commands.set(alias, command);
                        });
                    }
                } catch (error) {
                    Logger.log(
                        "COMMANDS",
                        `Failed to load command at ${filePath}: ${error.message}`,
                        "error",
                    );
                }
            }

            Logger.log("COMMANDS", `Loaded ${commands.size} commands successfully`, "info");
            this.client.commands = commands;
            return commands;
        } catch (error) {
            Logger.log("COMMANDS", `Error loading commands: ${error.message}`, "error");
            return new Collection();
        }
    }

    /**
     * Find all command files recursively
     * @param {string} dir - Directory to search
     * @returns {string[]} - Array of file paths
     */
    findCommandFiles(dir) {
        const files = [];

        if (!fs.existsSync(dir)) {
            Logger.log("COMMANDS", `Directory not found: ${dir}`, "warning");
            return files;
        }

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
     * Execute a slash command
     * @param {CommandInteraction} interaction - The command interaction
     * @returns {Promise<void>}
     */
    async executeCommand(interaction) {
        const command = this.client.commands.get(interaction.commandName);

        // Command not found
        if (!command) {
            Logger.log("COMMANDS", `Command not found: ${interaction.commandName}`, "warning");
            return interaction.reply({
                content: "This command isn't available. It may have been removed or disabled.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // Track command usage
        this.trackCommandUsage(interaction);

        // Check permissions
        if (!(await this.checkPermissions(command, interaction))) {
            return; // Permission check handles responses
        }

        // Check cooldowns
        if (!(await this.checkCooldown(command, interaction))) {
            return; // Cooldown check handles responses
        }

        // Execute command
        try {
            await command.execute(interaction);
        } catch (error) {
            // Handle command execution error
            this.handleError(error, interaction, command);
        }
    }

    /**
     * Track command usage for analytics
     * @param {CommandInteraction} interaction - The command interaction
     */
    trackCommandUsage(interaction) {
        const commandData = {
            command: interaction.commandName,
            user: interaction.user.tag,
            userId: interaction.user.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            timestamp: Date.now(),
            options: interaction.options ? [...interaction.options.data] : [],
        };

        // Store recent commands (limited to prevent memory issues)
        this.recentCommands.set(Date.now(), commandData);

        // Keep only most recent commands
        if (this.recentCommands.size > this.MAX_RECENT_COMMANDS) {
            const oldest = Math.min(...this.recentCommands.keys());
            this.recentCommands.delete(oldest);
        }
    }

    /**
     * Check if the user has permission to use the command
     * @param {Object} command - The command object
     * @param {CommandInteraction} interaction - The command interaction
     * @returns {Promise<boolean>} - True if user has permission, false otherwise
     */
    async checkPermissions(command, interaction) {
        // Skip permission check if no requirements specified
        if (!command.permissions) return true;

        const userPermissions = interaction.memberPermissions;

        // Client permissions check
        if (command.permissions.client) {
            const clientMember = interaction.guild?.members.cache.get(this.client.user.id);
            if (!clientMember) return true; // DM context, no guild permissions to check

            const missingClientPerms = this.getMissingPermissions(
                clientMember.permissions,
                command.permissions.client,
            );

            if (missingClientPerms.length > 0) {
                await interaction.reply({
                    content: `I'm missing required permissions: ${missingClientPerms.join(", ")}`,
                    flags: MessageFlags.Ephemeral,
                });
                return false;
            }
        }

        // User permissions check
        if (command.permissions.user) {
            // Skip check for bot owners if specified
            if (command.permissions.botOwnerOnly) {
                const botOwners = process.env.BOT_OWNERS?.split(",") || [];
                if (botOwners.includes(interaction.user.id)) {
                    return true;
                }
            }

            if (!userPermissions) return true; // DM context, no guild permissions to check

            const missingUserPerms = this.getMissingPermissions(
                userPermissions,
                command.permissions.user,
            );

            if (missingUserPerms.length > 0) {
                await interaction.reply({
                    content: `You're missing required permissions: ${missingUserPerms.join(", ")}`,
                    flags: MessageFlags.Ephemeral,
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Get missing permissions
     * @param {PermissionsBitField} currentPermissions - Current permissions
     * @param {string[]} requiredPermissions - Required permissions
     * @returns {string[]} - List of missing permissions
     */
    getMissingPermissions(currentPermissions, requiredPermissions) {
        return requiredPermissions.filter((permission) => {
            try {
                return !currentPermissions.has(PermissionsBitField.Flags[permission]);
            } catch (e) {
                Logger.log("PERMISSIONS", `Invalid permission flag: ${permission}`, "error");
                return false;
            }
        });
    }

    /**
     * Check command cooldowns
     * @param {Object} command - The command object
     * @param {CommandInteraction} interaction - The command interaction
     * @returns {Promise<boolean>} - True if command can be executed, false otherwise
     */
    async checkCooldown(command, interaction) {
        if (!command.cooldown) return true;

        // Get cooldown in milliseconds (default: 3s)
        const cooldownAmount = (command.cooldown || 3) * 1000;

        // Check if user is on cooldown
        if (!this.cooldowns.has(command.data.name)) {
            this.cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.data.name);
        const userKey = interaction.user.id;

        // Check if user is on cooldown
        if (timestamps.has(userKey)) {
            const expirationTime = timestamps.get(userKey) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.data.name}\` command.`,
                    flags: MessageFlags.Ephemeral,
                });
                return false;
            }
        }

        // Set the cooldown timestamp
        timestamps.set(userKey, now);
        setTimeout(() => timestamps.delete(userKey), cooldownAmount);

        return true;
    }

    /**
     * Handle command execution errors
     * @param {Error} error - The error that occurred
     * @param {CommandInteraction} interaction - The command interaction
     * @param {Object} command - The command object that caused the error
     */
    async handleError(error, interaction, command) {
        Logger.log("COMMANDS", `Error executing ${command.data.name}: ${error.message}`, "error");

        // Use the error handler utility if available
        if (ErrorHandler && typeof ErrorHandler.handleError === "function") {
            await ErrorHandler.handleError(interaction, error);
        } else {
            // Fallback error handling
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "There was an error while executing this command.",
                    flags: MessageFlags.Ephemeral,
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    content: "There was an error while executing this command.",
                });
            }
        }
    }

    /**
     * Get command usage statistics
     * @returns {Object} - Command usage statistics
     */
    getCommandStats() {
        // Convert command usage to usable statistics
        const stats = {
            total: this.recentCommands.size,
            byCommand: {},
            byUser: {},
            byGuild: {},
        };

        this.recentCommands.forEach((data) => {
            // Count by command
            if (!stats.byCommand[data.command]) {
                stats.byCommand[data.command] = 0;
            }
            stats.byCommand[data.command]++;

            // Count by user
            if (!stats.byUser[data.userId]) {
                stats.byUser[data.userId] = 0;
            }
            stats.byUser[data.userId]++;

            // Count by guild
            if (data.guildId) {
                if (!stats.byGuild[data.guildId]) {
                    stats.byGuild[data.guildId] = 0;
                }
                stats.byGuild[data.guildId]++;
            }
        });

        return stats;
    }

    // ===== HOT RELOAD FUNCTIONALITY =====

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

module.exports = CommandHandler;
