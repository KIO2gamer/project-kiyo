const { Events, InteractionType } = require('discord.js');
const Logger = require('../../../logger').default;
const CommandHandler = require('../utils/commandHandler');

let commandHandler = null;

module.exports = {
	name: Events.InteractionCreate,
	/**
	 * Handles all interaction types: commands, buttons, select menus, modals, etc.
	 * 
	 * @param {Object} interaction - The interaction object
	 * @returns {Promise<void>} - A promise that resolves when the interaction handling is complete
	 */
	async execute(interaction) {
		// Initialize the command handler if not already initialized
		if (!commandHandler && interaction.client) {
			commandHandler = CommandHandler.init(interaction.client);
			Logger.log('HANDLERS', 'Command handler initialized', 'info');
		}

		try {
			// Handle different interaction types
			switch (interaction.type) {
				case InteractionType.ApplicationCommand:
					if (interaction.isChatInputCommand()) {
						// Handle slash commands using our command handler
						await commandHandler.executeCommand(interaction);
					} else if (interaction.isContextMenuCommand()) {
						// Handle context menu commands
						await this.handleContextMenu(interaction);
					}
					break;

				case InteractionType.MessageComponent:
					if (interaction.isButton()) {
						// Handle button interactions
						await this.handleButtonInteraction(interaction);
					} else if (interaction.isStringSelectMenu()) {
						// Handle select menu interactions
						await this.handleSelectMenuInteraction(interaction);
					}
					break;

				case InteractionType.ModalSubmit:
					// Handle modal submissions
					await this.handleModalSubmission(interaction);
					break;

				case InteractionType.ApplicationCommandAutocomplete:
					// Handle autocomplete interactions
					await this.handleAutocomplete(interaction);
					break;

				default:
					Logger.log('INTERACTION', `Unknown interaction type: ${interaction.type}`, 'warning');
					break;
			}
		} catch (error) {
			Logger.log('INTERACTION', `Error handling interaction: ${error.message}`, 'error');
			// Only reply if we haven't already
			if (!interaction.replied && !interaction.deferred) {
				try {
					await interaction.reply({
						content: 'There was an error while processing this interaction.',
						flags: MessageFlags.Ephemeral
					});
				} catch (replyError) {
					// Ignore reply errors as the interaction might have expired
				}
			}
		}
	},

	/**
	 * Handles context menu command interactions
	 * 
	 * @param {Object} interaction - The interaction object
	 */
	async handleContextMenu(interaction) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			Logger.log('COMMANDS', `No context menu command matching ${interaction.commandName} was found.`, 'warning');
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			Logger.log('COMMANDS', `Error executing context menu ${interaction.commandName}: ${error.message}`, 'error');
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: 'There was an error while executing this command.',
					flags: MessageFlags.Ephemeral
				});
			}
		}
	},

	/**
	 * Handles button interactions
	 * 
	 * @param {Object} interaction - The interaction object
	 */
	async handleButtonInteraction(interaction) {
		const [type, ...args] = interaction.customId.split('_');

		// Generic button handler - routes buttons to their handlers based on type prefix
		switch (type) {
			case 'help':
				// Example: Route to help system buttons
				const helpCommand = interaction.client.commands.get('help');
				if (helpCommand && helpCommand.handleButton) {
					await helpCommand.handleButton(interaction, args);
				}
				break;

			case 'ticket':
				// Router for ticket system buttons
				// This defers to the ticket button handler event
				const ticketEvent = require('./ticket_button_interaction');
				if (ticketEvent && ticketEvent.execute) {
					await ticketEvent.execute(interaction);
				}
				break;

			case 'error':
				// Handle error buttons (like "Show Full Error")
				if (args[0] === 'show' && args[1] === 'full') {
					// This would be handled by the error handler directly
				}
				break;

			default:
				// For custom buttons that don't follow the type_action pattern
				// Check if we have an event file specifically for this button
				try {
					const customHandler = require(`./buttons/${interaction.customId}`);
					if (customHandler && customHandler.execute) {
						await customHandler.execute(interaction);
					}
				} catch (error) {
					// No handler found, log the unhandled button
					Logger.log('BUTTONS', `No handler for button: ${interaction.customId}`, 'warning');
					await interaction.reply({
						content: 'This button is not currently configured.',
						flags: MessageFlags.Ephemeral
					});
				}
				break;
		}
	},

	/**
	 * Handles select menu interactions
	 * 
	 * @param {Object} interaction - The interaction object
	 */
	async handleSelectMenuInteraction(interaction) {
		const [type, ...args] = interaction.customId.split('_');

		// Generic select menu handler - routes to specific handlers
		switch (type) {
			case 'help':
				// Example: Route to help system select menus
				const helpCommand = interaction.client.commands.get('help');
				if (helpCommand && helpCommand.handleSelectMenu) {
					await helpCommand.handleSelectMenu(interaction, args);
				}
				break;

			default:
				// Check for custom select menu handlers
				try {
					const customHandler = require(`./select_menus/${interaction.customId}`);
					if (customHandler && customHandler.execute) {
						await customHandler.execute(interaction);
					}
				} catch (error) {
					Logger.log('SELECT_MENU', `No handler for select menu: ${interaction.customId}`, 'warning');
					await interaction.reply({
						content: 'This selection menu is not currently configured.',
						flags: MessageFlags.Ephemeral
					});
				}
				break;
		}
	},

	/**
	 * Handles modal submission interactions
	 * 
	 * @param {Object} interaction - The interaction object
	 */
	async handleModalSubmission(interaction) {
		const [type, ...args] = interaction.customId.split('_');

		// Generic modal submission handler
		switch (type) {
			case 'ticket':
				// Example: Handle ticket creation/update modals
				try {
					const ticketModal = require('./modals/ticket_modal');
					if (ticketModal && ticketModal.execute) {
						await ticketModal.execute(interaction, args);
					}
				} catch (error) {
					Logger.log('MODAL', `Error handling ticket modal: ${error.message}`, 'error');
				}
				break;

			default:
				// Check for custom modal handlers
				try {
					const customHandler = require(`./modals/${interaction.customId}`);
					if (customHandler && customHandler.execute) {
						await customHandler.execute(interaction);
					}
				} catch (error) {
					Logger.log('MODAL', `No handler for modal: ${interaction.customId}`, 'warning');
					await interaction.reply({
						content: 'This form submission could not be processed.',
						flags: MessageFlags.Ephemeral
					});
				}
				break;
		}
	},

	/**
	 * Handles autocomplete interactions
	 * 
	 * @param {Object} interaction - The interaction object
	 */
	async handleAutocomplete(interaction) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command || !command.autocomplete) {
			// If no autocomplete handler, just return empty results
			return await interaction.respond([]);
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			Logger.log('AUTOCOMPLETE', `Error handling autocomplete for ${interaction.commandName}: ${error.message}`, 'error');
			// Try to respond with empty results to prevent the interaction from hanging
			try {
				await interaction.respond([]);
			} catch (respondError) {
				// Ignore respond errors
			}
		}
	}
};
