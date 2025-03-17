const { Collection, PermissionsBitField, MessageFlags } = require("discord.js");
const Logger = require("./../utils/logger");
const ErrorHandler = require("./../utils/errorHandler");

/**
 * CommandHandler class for managing command execution and tracking
 */
class CommandHandler {
    /**
     * Initialize the command handler
     * @param {Client} client - Discord.js client instance
     * @returns {CommandHandler} - The command handler instance
     */
    static init(client) {
        return new CommandHandler(client);
    }

    /**
     * Create a new CommandHandler instance
     * @param {Client} client - Discord.js client instance
     */
    constructor(client) {
        this.client = client;
        this.cooldowns = new Collection();
        this.recentCommands = new Collection();
        this.MAX_RECENT_COMMANDS = 100;

        Logger.log("COMMANDS", "Command handler initialized with cooldown system", "info");
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
}

module.exports = CommandHandler;
