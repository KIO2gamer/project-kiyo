const { Events, InteractionType, MessageFlags } = require("discord.js");
const Logger = require("../utils/logger");
const { handleError } = require("../utils/errorHandler");

module.exports = {
    name: Events.InteractionCreate,

    /**
     * Handles all Discord interactions
     * @param {import('discord.js').Interaction} interaction - The interaction object
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            // Early return if the bot doesn't have access to the guild
            if (interaction.guild && !interaction.guild.available) return;

            // Handle different interaction types
            if (interaction.isChatInputCommand()) {
                // Handle slash commands via CommandHandler
                await handleCommandInteraction(interaction);
            } else if (interaction.isButton()) {
                // Handle button interactions
                await handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu()) {
                // Handle select menu interactions
                await handleSelectMenuInteraction(interaction);
            } else if (interaction.isAutocomplete()) {
                // Handle autocomplete interactions
                await handleAutocompleteInteraction(interaction);
            } else if (interaction.isModalSubmit()) {
                // Handle modal submit interactions
                await handleModalInteraction(interaction);
            }
        } catch (error) {
            Logger.log("INTERACTION", `Error handling interaction: ${error.message}`, "error");

            // Attempt to respond to the interaction if it hasn't been responded to already
            if (!interaction.replied && !interaction.deferred) {
                await handleError(
                    interaction,
                    error,
                    "INTERACTION",
                    "An error occurred while processing this interaction.",
                );
            }
        }
    },
};

/**
 * Handles command interactions
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction
 */
async function handleCommandInteraction(interaction) {
    const { client } = interaction;

    // Use the CommandHandler class if it exists
    if (client.commandHandler && typeof client.commandHandler.executeCommand === "function") {
        await client.commandHandler.executeCommand(interaction);
    } else {
        // Fallback to direct command execution
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            await interaction.reply({
                content: "This command is no longer available or has been disabled.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while executing this command.",
            );
        }
    }
}

/**
 * Handles button interactions
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction
 */
async function handleButtonInteraction(interaction) {
    const { client, customId } = interaction;

    // Help command button handling
    if (customId.startsWith("help_")) {
        const helpCommand = client.commands.get("help");
        if (helpCommand && typeof helpCommand.handleButton === "function") {
            await helpCommand.handleButton(interaction);
            return;
        }
    }

    // Ticket button handling (special case based on the project structure)
    if (customId === "create_ticket" || customId === "open-ticket") {
        // This will be handled by the dedicated ticket_button_interaction.js event
        return;
    }

    // General button handling - look for handlers
    const buttonHandlers =
        client.buttonHandlers?.get(customId) ||
        client.buttonHandlers?.find((handler) => customId.startsWith(handler.prefix));

    if (buttonHandlers) {
        try {
            await buttonHandlers.execute(interaction);
            return;
        } catch (error) {
            await handleError(
                interaction,
                error,
                "BUTTON_HANDLER",
                "An error occurred while processing this button.",
            );
            return;
        }
    }

    // If we reach here, no handler was found
    Logger.log("BUTTONS", `No handler found for button: ${customId}`, "warning");
}

/**
 * Handles select menu interactions
 * @param {import('discord.js').StringSelectMenuInteraction} interaction - The select menu interaction
 */
async function handleSelectMenuInteraction(interaction) {
    const { client, customId } = interaction;

    // Help command select menu handling
    if (customId.startsWith("help_")) {
        const helpCommand = client.commands.get("help");
        if (helpCommand && typeof helpCommand.handleSelectMenu === "function") {
            await helpCommand.handleSelectMenu(interaction);
            return;
        }
    }

    // General select menu handling
    const selectMenuHandlers =
        client.selectMenuHandlers?.get(customId) ||
        client.selectMenuHandlers?.find((handler) => customId.startsWith(handler.prefix));

    if (selectMenuHandlers) {
        try {
            await selectMenuHandlers.execute(interaction);
            return;
        } catch (error) {
            await handleError(
                interaction,
                error,
                "SELECT_MENU_HANDLER",
                "An error occurred while processing this select menu.",
            );
            return;
        }
    }

    // If we reach here, no handler was found
    Logger.log("SELECT_MENUS", `No handler found for select menu: ${customId}`, "warning");
}

/**
 * Handles autocomplete interactions
 * @param {import('discord.js').AutocompleteInteraction} interaction - The autocomplete interaction
 */
async function handleAutocompleteInteraction(interaction) {
    const { client, commandName } = interaction;

    // Get the command
    const command = client.commands.get(commandName);

    // Check if the command exists and has an autocomplete function
    if (command && typeof command.autocomplete === "function") {
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            Logger.log(
                "AUTOCOMPLETE",
                `Error handling autocomplete for ${commandName}: ${error.message}`,
                "error",
            );

            // Respond with an empty result to prevent the interaction from failing
            await interaction.respond([]);
        }
    } else {
        // If no autocomplete function exists, respond with an empty result
        await interaction.respond([]);
    }
}

/**
 * Handles modal submit interactions
 * @param {import('discord.js').ModalSubmitInteraction} interaction - The modal submit interaction
 */
async function handleModalInteraction(interaction) {
    const { client, customId } = interaction;

    // Special case for help command search modal
    if (customId === "help_search_modal") {
        const helpCommand = client.commands.get("help");
        if (helpCommand && typeof helpCommand.handleSearchModal === "function") {
            try {
                await helpCommand.handleSearchModal(interaction);
                return;
            } catch (error) {
                console.error("Error handling search modal:", error);
                // Don't create a new message, update the existing one if possible
                await interaction
                    .update({
                        content: "Something went wrong with the search. Please try again.",
                        embeds: [],
                        components: [],
                    })
                    .catch(() => {
                        // If update fails, then reply
                        interaction.reply({
                            content: "Something went wrong with the search. Please try again.",
                            flags: MessageFlags.Ephemeral,
                        });
                    });
                return;
            }
        }
    }

    // Find handlers for this modal
    const modalHandlers =
        client.modalHandlers?.get(customId) ||
        client.modalHandlers?.find((handler) => customId.startsWith(handler.prefix));

    if (modalHandlers) {
        try {
            await modalHandlers.execute(interaction);
            return;
        } catch (error) {
            await handleError(
                interaction,
                error,
                "MODAL_HANDLER",
                "An error occurred while processing this modal submission.",
            );
            return;
        }
    }

    // If we reach here, no handler was found
    Logger.log("MODALS", `No handler found for modal: ${customId}`, "warning");
}
