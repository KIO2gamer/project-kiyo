const { SlashCommandBuilder } = require('discord.js');
const Logger = require('../../../logger');

/**
 * Base Command class that all commands should extend.
 * Provides standard structure and helper methods for commands.
 */
class Command {
	/**
	 * @param {Object} options - Command options
	 * @param {string} options.name - Command name
	 * @param {string} options.description - Short command description
	 * @param {string} [options.category='uncategorized'] - Command category
	 * @param {string} [options.fullDescription] - Detailed command description
	 * @param {string[]} [options.examples=[]] - Usage examples
	 * @param {string} [options.usage] - Usage syntax
	 * @param {number} [options.cooldown=0] - Cooldown in seconds
	 * @param {string[]} [options.aliases=[]] - Command aliases (for help system)
	 * @param {string[]} [options.permissions=[]] - Required permissions
	 */
	constructor(options) {
		this.validateOptions(options);

		// Required properties
		this.name = options.name;
		this.description = options.description;

		// Optional properties with defaults
		this.category = options.category || 'uncategorized';
		this.description_full = options.fullDescription || options.description;
		this.examples = options.examples || [];
		this.usage = options.usage || `/${options.name}`;
		this.cooldown = options.cooldown || 0;

		// Set up slash command builder
		this.data = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);

		// Add aliases if provided
		if (options.aliases && Array.isArray(options.aliases)) {
			this.data.aliases = options.aliases;
		}

		// Add permissions if provided
		if (options.permissions && Array.isArray(options.permissions)) {
			this.permissions = options.permissions;
		}
	}

	/**
	 * Validate command options
	 * 
	 * @param {Object} options - Command options to validate
	 * @private
	 */
	validateOptions(options) {
		if (!options) {
			throw new Error('Command options are required');
		}

		if (!options.name) {
			throw new Error('Command name is required');
		}

		if (!options.description) {
			throw new Error('Command description is required');
		}

		// Validate name format
		if (!/^[\w-]{1,32}$/.test(options.name)) {
			throw new Error('Command name must be 1-32 characters and contain only letters, numbers, hyphens, or underscores');
		}

		// Validate description length
		if (options.description.length > 100) {
			throw new Error('Command description must be 100 characters or less');
		}
	}

	/**
	 * Add an option to the command
	 * 
	 * @param {Function} optionBuilder - Function that takes an option and returns it
	 * @returns {Command} This command instance for chaining
	 * @example
	 * addOption(option => 
	 *   option.setName('user')
	 *     .setDescription('The user')
	 *     .setRequired(true)
	 * )
	 */
	addOption(optionBuilder) {
		this.data.addOption(optionBuilder);
		return this;
	}

	/**
	 * Add a string option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @param {Object[]} [choices=[]] - Choices for the option
	 * @returns {Command} This command instance for chaining
	 */
	addStringOption(name, description, required = false, choices = []) {
		this.data.addStringOption(option => {
			option.setName(name)
				.setDescription(description)
				.setRequired(required);

			if (choices && choices.length > 0) {
				for (const choice of choices) {
					option.addChoices(choice);
				}
			}

			return option;
		});

		return this;
	}

	/**
	 * Add an integer option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @param {number} [min=null] - Minimum value
	 * @param {number} [max=null] - Maximum value
	 * @param {Object[]} [choices=[]] - Choices for the option
	 * @returns {Command} This command instance for chaining
	 */
	addIntegerOption(name, description, required = false, min = null, max = null, choices = []) {
		this.data.addIntegerOption(option => {
			option.setName(name)
				.setDescription(description)
				.setRequired(required);

			if (min !== null) {
				option.setMinValue(min);
			}

			if (max !== null) {
				option.setMaxValue(max);
			}

			if (choices && choices.length > 0) {
				for (const choice of choices) {
					option.addChoices(choice);
				}
			}

			return option;
		});

		return this;
	}

	/**
	 * Add a user option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @returns {Command} This command instance for chaining
	 */
	addUserOption(name, description, required = false) {
		this.data.addUserOption(option =>
			option.setName(name)
				.setDescription(description)
				.setRequired(required)
		);

		return this;
	}

	/**
	 * Add a channel option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @param {number[]} [channelTypes=[]] - Channel types to allow
	 * @returns {Command} This command instance for chaining
	 */
	addChannelOption(name, description, required = false, channelTypes = []) {
		this.data.addChannelOption(option => {
			option.setName(name)
				.setDescription(description)
				.setRequired(required);

			if (channelTypes && channelTypes.length > 0) {
				option.addChannelTypes(...channelTypes);
			}

			return option;
		});

		return this;
	}

	/**
	 * Add a role option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @returns {Command} This command instance for chaining
	 */
	addRoleOption(name, description, required = false) {
		this.data.addRoleOption(option =>
			option.setName(name)
				.setDescription(description)
				.setRequired(required)
		);

		return this;
	}

	/**
	 * Add a boolean option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @returns {Command} This command instance for chaining
	 */
	addBooleanOption(name, description, required = false) {
		this.data.addBooleanOption(option =>
			option.setName(name)
				.setDescription(description)
				.setRequired(required)
		);

		return this;
	}

	/**
	 * Add a mentionable option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @returns {Command} This command instance for chaining
	 */
	addMentionableOption(name, description, required = false) {
		this.data.addMentionableOption(option =>
			option.setName(name)
				.setDescription(description)
				.setRequired(required)
		);

		return this;
	}

	/**
	 * Add a number option to the command
	 * 
	 * @param {string} name - Option name
	 * @param {string} description - Option description
	 * @param {boolean} [required=false] - Whether the option is required
	 * @param {number} [min=null] - Minimum value
	 * @param {number} [max=null] - Maximum value
	 * @returns {Command} This command instance for chaining
	 */
	addNumberOption(name, description, required = false, min = null, max = null) {
		this.data.addNumberOption(option => {
			option.setName(name)
				.setDescription(description)
				.setRequired(required);

			if (min !== null) {
				option.setMinValue(min);
			}

			if (max !== null) {
				option.setMaxValue(max);
			}

			return option;
		});

		return this;
	}

	/**
	 * Add a subcommand to the command
	 * 
	 * @param {string} name - Subcommand name
	 * @param {string} description - Subcommand description
	 * @param {Function} [optionsBuilder] - Function to build subcommand options
	 * @returns {Command} This command instance for chaining
	 * @example
	 * addSubcommand('list', 'List items', (subcommand) =>
	 *   subcommand.addStringOption('filter', 'Filter the list', false)
	 * )
	 */
	addSubcommand(name, description, optionsBuilder) {
		this.data.addSubcommand(subcommand => {
			subcommand.setName(name).setDescription(description);

			if (typeof optionsBuilder === 'function') {
				optionsBuilder(subcommand);
			}

			return subcommand;
		});

		return this;
	}

	/**
	 * Add a subcommand group to the command
	 * 
	 * @param {string} name - Group name
	 * @param {string} description - Group description
	 * @param {Function} subcommandsBuilder - Function to build subcommands
	 * @returns {Command} This command instance for chaining
	 */
	addSubcommandGroup(name, description, subcommandsBuilder) {
		this.data.addSubcommandGroup(group => {
			group.setName(name).setDescription(description);

			if (typeof subcommandsBuilder === 'function') {
				subcommandsBuilder(group);
			}

			return group;
		});

		return this;
	}

	/**
	 * Set the command to be NSFW
	 * 
	 * @param {boolean} [nsfw=true] - Whether the command is NSFW
	 * @returns {Command} This command instance for chaining
	 */
	setNSFW(nsfw = true) {
		this.data.setNSFW(nsfw);
		return this;
	}

	/**
	 * Default implementation - should be overridden in subclasses
	 * 
	 * @param {Object} interaction - Discord interaction object
	 */
	async execute(interaction) {
		await interaction.reply({
			content: 'This command has not been implemented yet!',
			ephemeral: true
		});

		Logger.log('COMMANDS', `Command ${this.name} has no execute method implemented`, 'warning');
	}

	/**
	 * Optional validation method to be implemented in subclasses
	 * 
	 * @param {Object} interaction - Discord interaction object
	 * @returns {boolean|string} true if valid, error message if invalid
	 */
	async validate(interaction) {
		return true;
	}

	/**
	 * Optional autocomplete handler to be implemented in subclasses
	 * 
	 * @param {Object} interaction - Discord autocomplete interaction
	 */
	async autocomplete(interaction) {
		await interaction.respond([]);
	}
}

module.exports = Command; 