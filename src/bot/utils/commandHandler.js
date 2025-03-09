const { Collection, PermissionsBitField } = require('discord.js');
const Logger = require('../../../logger');
const { handleError } = require('./errorHandler');

/**
 * Class to handle command execution, cooldowns, and permissions
 */
class CommandHandler {
	constructor(client) {
		this.client = client;
		this.cooldowns = new Collection();
		this.usageStats = {
			commandsUsed: 0,
			categoryStats: new Collection()
		};
	}

	/**
	 * Initialize the command handler with the client
	 * 
	 * @param {Client} client - The Discord.js client
	 * @returns {CommandHandler} The command handler instance
	 */
	static init(client) {
		return new CommandHandler(client);
	}

	/**
	 * Check if a user is on cooldown for a command
	 * 
	 * @param {Object} interaction - The interaction object
	 * @param {Object} command - The command object
	 * @returns {boolean|number} False if not on cooldown, or time remaining if on cooldown
	 */
	checkCooldown(interaction, command) {
		if (!command.cooldown) return false;

		const cooldownAmount = command.cooldown * 1000;
		const userId = interaction.user.id;

		if (!this.cooldowns.has(command.data.name)) {
			this.cooldowns.set(command.data.name, new Collection());
		}

		const timestamps = this.cooldowns.get(command.data.name);
		const now = Date.now();

		if (timestamps.has(userId)) {
			const expirationTime = timestamps.get(userId) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return timeLeft;
			}
		}

		timestamps.set(userId, now);
		setTimeout(() => timestamps.delete(userId), cooldownAmount);
		return false;
	}

	/**
	 * Check if the user has the required permissions to use the command
	 * 
	 * @param {Object} interaction - The interaction object
	 * @param {Object} command - The command object
	 * @returns {boolean} Whether the user has the required permissions
	 */
	checkPermissions(interaction, command) {
		// Skip checks if no permissions required
		if (!command.permissions) return true;

		// Check for global permissions (bot owner, etc)
		if (command.permissions.includes('BOT_OWNER')) {
			const owners = process.env.BOT_OWNERS ? process.env.BOT_OWNERS.split(',') : [];
			if (!owners.includes(interaction.user.id)) {
				return false;
			}
		}

		// Check for Discord permissions
		if (command.permissions.some(perm => Object.keys(PermissionsBitField.Flags).includes(perm))) {
			const memberPerms = interaction.memberPermissions;
			if (!memberPerms) return false;

			const missingPerms = command.permissions.filter(perm =>
				Object.keys(PermissionsBitField.Flags).includes(perm) &&
				!memberPerms.has(PermissionsBitField.Flags[perm])
			);

			if (missingPerms.length > 0) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Track command usage statistics
	 * 
	 * @param {Object} interaction - The interaction object
	 * @param {Object} command - The command object
	 */
	trackCommandUsage(interaction, command) {
		// Increment total commands used
		this.usageStats.commandsUsed++;

		// Track by category
		const category = command.category || 'uncategorized';
		if (!this.usageStats.categoryStats.has(category)) {
			this.usageStats.categoryStats.set(category, 0);
		}
		this.usageStats.categoryStats.set(
			category,
			this.usageStats.categoryStats.get(category) + 1
		);

		// Track command history
		if (!this.client.commandHistory) {
			this.client.commandHistory = [];
		}

		this.client.commandHistory.push({
			command: interaction.commandName,
			user: interaction.user.tag,
			userId: interaction.user.id,
			guildId: interaction.guildId,
			channelId: interaction.channelId,
			timestamp: Date.now(),
			options: Array.from(interaction.options?.data || []).map(opt => ({
				name: opt.name,
				value: opt.value
			}))
		});

		// Keep only last 1000 commands
		if (this.client.commandHistory.length > 1000) {
			this.client.commandHistory.shift();
		}
	}

	/**
	 * Execute a command with all necessary checks and error handling
	 * 
	 * @param {Object} interaction - The interaction object
	 * @returns {Promise<void>}
	 */
	async executeCommand(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const commandName = interaction.commandName;
		const command = this.client.commands.get(commandName);

		// Check if command exists
		if (!command) {
			Logger.log('COMMANDS', `No command matching ${commandName} was found.`, 'error');
			return;
		}

		// Check cooldown
		const cooldownResult = this.checkCooldown(interaction, command);
		if (cooldownResult !== false) {
			await interaction.reply({
				content: `Please wait ${cooldownResult.toFixed(1)} more seconds before reusing the \`${commandName}\` command.`,
				ephemeral: true
			});
			return;
		}

		// Check permissions
		if (!this.checkPermissions(interaction, command)) {
			await interaction.reply({
				content: 'You do not have permission to use this command.',
				ephemeral: true
			});
			return;
		}

		try {
			// Track command usage
			this.trackCommandUsage(interaction, command);

			// Check if command has a validator function and run it
			if (typeof command.validate === 'function') {
				const validationResult = await command.validate(interaction);
				if (validationResult !== true) {
					await interaction.reply({
						content: validationResult || 'Command validation failed.',
						ephemeral: true
					});
					return;
				}
			}

			// Execute the command
			await command.execute(interaction);

		} catch (error) {
			// Handle errors with our specialized error handler
			handleError(interaction, `Error executing ${commandName}:`, error);
		}
	}

	/**
	 * Get command usage statistics
	 * 
	 * @returns {Object} Command usage statistics
	 */
	getUsageStats() {
		return {
			total: this.usageStats.commandsUsed,
			byCategory: Object.fromEntries(this.usageStats.categoryStats)
		};
	}
}

module.exports = CommandHandler; 