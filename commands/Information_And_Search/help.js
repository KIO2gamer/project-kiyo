const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const Logger = require("../../utils/logger");
const { handleError } = require("../../utils/errorHandler");

// Component IDs for routing
const COMPONENT_IDS = {
    CATEGORY_SELECT: "help_category_select",
    SUBCATEGORY_SELECT: "help_subcategory_select",
    COMMAND_SELECT: "help_command_select",
    OVERVIEW_BUTTON: "help_overview",
    BACK_BUTTON: "help_back",
    NEXT_BUTTON: "help_next",
    SEARCH_BUTTON: "help_search",
    REFRESH_BUTTON: "help_refresh",
    SEARCH_MODAL: "help_search_modal",
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Display help information about commands.")
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("Get information about a specific command")
                .setRequired(false)
                .setAutocomplete(true),
        ),

    description_full:
        "Displays help information about available commands. Shows categories, command descriptions, usage examples, and more.",
    usage: "/help [command]",
    examples: ["/help", "/help play", "/help embed"],

    /**
     * Handles the initial command execution
     * @param {Object} interaction - The interaction object
     */
    async execute(interaction) {
        try {
            // Check if looking for specific command
            const commandName = interaction.options.getString("command");

            if (commandName) {
                await this.displayCommandHelp(interaction, commandName);
            } else {
                await this.displayOverview(interaction);
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "Failed to display help information.",
            );
        }
    },

    /**
     * Displays the main help overview with categories
     * @param {Object} interaction - The interaction object
     */
    async displayOverview(interaction) {
        const client = interaction.client;
        const categories = this.getCategorizedCommands(client.commands);

        const embed = new EmbedBuilder()
            .setTitle("📚 Command Help")
            .setDescription("Browse commands by category or search for specific commands.")
            .setColor("#3498db")
            .setFooter({
                text: `Use the menu below to navigate • ${client.commands.size} commands available`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();

        // Add category fields with command counts
        for (const [categoryName, commands] of Object.entries(categories)) {
            if (commands.length > 0) {
                const formattedName = this.formatCategoryName(categoryName);
                embed.addFields({
                    name: `${formattedName} (${commands.length})`,
                    value:
                        commands
                            .slice(0, 3)
                            .map((cmd) => `\`${cmd.data.name}\``)
                            .join(", ") +
                        (commands.length > 3 ? ` and ${commands.length - 3} more...` : ""),
                });
            }
        }

        // Create category select menu
        const categoryOptions = Object.keys(categories)
            .filter((category) => categories[category].length > 0)
            .map((category) => {
                return {
                    label: this.formatCategoryName(category),
                    value: category,
                    description: `View ${categories[category].length} commands in this category`,
                    emoji: this.getCategoryEmoji(category),
                };
            });

        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(COMPONENT_IDS.CATEGORY_SELECT)
                .setPlaceholder("Select a category")
                .addOptions(categoryOptions),
        );

        // Create button row
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.SEARCH_BUTTON)
                .setLabel("Search")
                .setEmoji("🔍")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.REFRESH_BUTTON)
                .setLabel("Refresh")
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({
            embeds: [embed],
            components: [selectRow, buttonRow],
            ephemeral: true,
        });
    },

    /**
     * Organizes commands into categories based on folder structure
     * @param {Map} commands - The client commands collection
     * @returns {Object} - Commands organized by category
     */
    getCategorizedCommands(commands) {
        const categories = {};

        for (const command of commands.values()) {
            // Try to get category from:
            // 1. Explicit category property
            // 2. Folder name from command's file path
            // 3. Fall back to "misc" if nothing else works
            let category;

            if (command.category) {
                // Use explicitly defined category if available
                category = command.category;
            } else if (command.filePath) {
                // Extract folder name from file path
                // Assuming filePath looks like ".../<category_folder>/<command_name>.js"
                const folderMatch = command.filePath.match(/([^\/\\]+)[\/\\][^\/\\]+\.js$/);
                category = folderMatch ? folderMatch[1].toLowerCase() : "misc";
            } else {
                category = "misc";
            }

            // Create category array if it doesn't exist
            if (!categories[category]) {
                categories[category] = [];
            }

            // Add command to category
            categories[category].push(command);
        }

        // Sort commands alphabetically within each category
        for (const category in categories) {
            categories[category].sort((a, b) => a.data.name.localeCompare(b.data.name));
        }

        return categories;
    },

    /**
     * Displays help for a specific command
     * @param {Object} interaction - The interaction object
     * @param {string} commandName - The name of the command
     */
    async displayCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName.toLowerCase());

        if (!command) {
            // Check if this is a reply or update situation
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: `Command \`${commandName}\` not found. Try using /help to see all available commands.`,
                    ephemeral: true,
                });
            } else {
                return interaction.reply({
                    content: `Command \`${commandName}\` not found. Try using /help to see all available commands.`,
                    ephemeral: true,
                });
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Command: ${command.data.name}`)
            .setDescription(command.description_full || command.data.description)
            .setColor("#00b0f4")
            .setTimestamp();

        if (command.category) {
            embed.addFields({
                name: "Category",
                value: this.formatCategoryName(command.category),
                inline: true,
            });
        }

        if (command.usage) {
            embed.addFields({
                name: "Usage",
                value: `\`\`\`\n${command.usage}\n\`\`\``,
            });
        }

        if (command.examples && command.examples.length > 0) {
            embed.addFields({
                name: "Examples",
                value: command.examples.map((example) => `\`${example}\``).join("\n"),
            });
        }

        // Get required permissions, if any
        const permissions = this.getCommandPermissions(command);
        if (permissions) {
            embed.addFields({
                name: "Required Permissions",
                value: permissions,
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.OVERVIEW_BUTTON)
                .setLabel("Back to Overview")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.REFRESH_BUTTON)
                .setLabel("Refresh")
                .setStyle(ButtonStyle.Secondary),
        );

        // Check if this is a new interaction or an update to an existing one
        if (interaction.isCommand()) {
            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true,
            });
        } else {
            await interaction.update({
                embeds: [embed],
                components: [row],
            });
        }
    },

    /**
     * Displays commands for a specific category
     * @param {Object} interaction - The interaction object
     * @param {string} categoryName - The category name
     */
    async displayCategory(interaction, categoryName) {
        const client = interaction.client;
        const categories = this.getCategorizedCommands(client.commands);
        const commands = categories[categoryName] || [];

        if (commands.length === 0) {
            return interaction.update({
                content: `No commands found in category: ${this.formatCategoryName(categoryName)}`,
                embeds: [],
                components: [],
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(
                `${this.getCategoryEmoji(categoryName)} ${this.formatCategoryName(categoryName)} Commands`,
            )
            .setDescription(`Select a command to view details`)
            .setColor("#3498db")
            .setFooter({
                text: `${commands.length} commands in this category`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();

        // Add command fields (up to 10 to avoid hitting embed limits)
        commands.slice(0, 12).forEach((cmd) => {
            embed.addFields({
                name: cmd.data.name,
                value: cmd.data.description || "No description provided.",
                inline: true,
            });
        });

        if (commands.length > 12) {
            embed.addFields({
                name: `... and ${commands.length - 12} more commands`,
                value: "Use the select menu below to see more commands.",
            });
        }

        // Create command select menu
        const commandOptions = commands.map((cmd) => {
            return {
                label: cmd.data.name,
                value: cmd.data.name,
                description: cmd.data.description.substring(0, 100), // Truncate if too long
            };
        });

        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(COMPONENT_IDS.COMMAND_SELECT)
                .setPlaceholder("Select a command for details")
                .addOptions(commandOptions),
        );

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.OVERVIEW_BUTTON)
                .setLabel("Back to Overview")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.REFRESH_BUTTON)
                .setLabel("Refresh")
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.update({
            embeds: [embed],
            components: [selectRow, buttonRow],
        });
    },

    /**
     * Formats category name for display based on folder names
     * @param {string} category - The category name
     * @returns {string} - Formatted category name
     */
    formatCategoryName(category) {
        if (!category) return "Miscellaneous";

        // Convert folder names like "Information_And_Search" to "Information And Search"
        return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    },

    /**
     * Get emoji for category based on folder name
     * @param {string} category - The category name
     * @returns {string} - Emoji for the category
     */
    getCategoryEmoji(category) {
        const emojis = {
            // Add all your folder names here
            admin: "⚙️",
            admin_and_configuration: "⚙️",
            api: "🔌",
            api_integrations: "🔌",
            fun: "🎮",
            fun_and_entertainment: "🎮",
            games: "🎲",
            info: "ℹ️",
            information_and_search: "🔍",
            levels: "📈",
            levels_and_experience: "📈",
            misc: "📦",
            moderation: "🛡️",
            music: "🎵",
            utility: "🔧",
            role_management: "👥",
            // Add other folder names as needed
        };

        return emojis[category.toLowerCase()] || "📄";
    },

    /**
     * Get command required permissions
     * @param {Object} command - Command object
     * @returns {string} - Formatted permissions string or null
     */
    getCommandPermissions(command) {
        if (!command.data.default_member_permissions) return null;

        // Convert the permission flags to readable format
        const permFlag = BigInt(command.data.default_member_permissions);
        const permissions = [];

        // Add common permissions checks here
        if (permFlag & (1n << 3n)) permissions.push("Administrator");
        if (permFlag & (1n << 5n)) permissions.push("Manage Server");
        if (permFlag & (1n << 6n)) permissions.push("Manage Channels");
        if (permFlag & (1n << 7n)) permissions.push("Kick Members");
        if (permFlag & (1n << 8n)) permissions.push("Ban Members");
        if (permFlag & (1n << 13n)) permissions.push("Manage Messages");
        if (permFlag & (1n << 28n)) permissions.push("Manage Roles");

        return permissions.length > 0 ? permissions.join(", ") : "None";
    },

    /**
     * Handle autocomplete for the command option
     * @param {Object} interaction - The interaction object
     */
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = Array.from(interaction.client.commands.keys());

        const filtered = focusedValue
            ? choices.filter((choice) => choice.toLowerCase().includes(focusedValue))
            : choices.slice(0, 25); // Return first 25 if no input

        await interaction.respond(
            filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
        );
    },

    /**
     * Handle select menu interactions for the help command
     * @param {Object} interaction - The interaction object
     */
    async handleSelectMenu(interaction) {
        const customId = interaction.customId;

        switch (customId) {
            case COMPONENT_IDS.CATEGORY_SELECT:
                const categoryValue = interaction.values[0];
                await this.displayCategory(interaction, categoryValue);
                break;

            case COMPONENT_IDS.COMMAND_SELECT:
                const commandValue = interaction.values[0];
                await this.displayCommandHelp(interaction, commandValue);
                break;
        }
    },

    /**
     * Handle button interactions for the help command
     * @param {Object} interaction - The interaction object
     */
    async handleButton(interaction) {
        const customId = interaction.customId;

        switch (customId) {
            case COMPONENT_IDS.OVERVIEW_BUTTON:
                await this.displayOverview(interaction);
                break;

            case COMPONENT_IDS.SEARCH_BUTTON:
                await this.handleSearchButton(interaction);
                break;

            case COMPONENT_IDS.REFRESH_BUTTON:
                // Get the current state and refresh it
                if (interaction.message.embeds[0].title.includes("Command:")) {
                    // We're viewing a specific command
                    const commandName = interaction.message.embeds[0].title.split(": ")[1];
                    await this.displayCommandHelp(interaction, commandName);
                } else if (interaction.message.embeds[0].title.includes("Commands")) {
                    // We're viewing a category
                    const categoryName = interaction.message.embeds[0].title
                        .replace(/^.*? /, "")
                        .replace(" Commands", "")
                        .toLowerCase()
                        .replace(/ /g, "_");
                    await this.displayCategory(interaction, categoryName);
                } else {
                    // We're at the overview
                    await this.displayOverview(interaction);
                }
                break;
        }
    },

    /**
     * Handle search button
     * @param {Object} interaction - The interaction object
     */
    async handleSearchButton(interaction) {
        // Create a search results embed
        const embed = new EmbedBuilder()
            .setTitle("🔍 Command Search")
            .setDescription("Enter a search term to find commands:")
            .setColor("#3498db")
            .setFooter({
                text: "Type keywords to search by name or description",
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        // Create a search input component
        const searchRow = new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId("help_search_input")
                .setLabel("Search Commands")
                .setPlaceholder("Enter keywords (e.g., music, role, server)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(50),
        );

        // Create a modal to contain our input component
        const modal = new ModalBuilder()
            .setCustomId("help_search_modal")
            .setTitle("Search Commands")
            .addComponents(searchRow);

        // Show the modal
        await interaction.showModal(modal);
    },

    /**
     * Handle search modal submission
     * @param {Object} interaction - The modal submission interaction
     */
    async handleSearchModal(interaction) {
        const searchTerm = interaction.fields.getTextInputValue("help_search_input").toLowerCase();
        const commands = interaction.client.commands;
        const results = [];

        // Search through commands
        for (const command of commands.values()) {
            const name = command.data.name.toLowerCase();
            const description = command.data.description.toLowerCase();
            const fullDesc = (command.description_full || "").toLowerCase();

            // Check if search term appears in name or description
            if (
                name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                fullDesc.includes(searchTerm)
            ) {
                results.push(command);
            }
        }

        // Sort results by relevance (exact name matches first)
        results.sort((a, b) => {
            const aName = a.data.name.toLowerCase();
            const bName = b.data.name.toLowerCase();

            // Exact name matches come first
            if (aName === searchTerm && bName !== searchTerm) return -1;
            if (bName === searchTerm && aName !== searchTerm) return 1;

            // Then name contains
            if (aName.includes(searchTerm) && !bName.includes(searchTerm)) return -1;
            if (bName.includes(searchTerm) && !aName.includes(searchTerm)) return 1;

            // Alphabetical order for equal relevance
            return aName.localeCompare(bName);
        });

        // Create embed for search results
        const embed = new EmbedBuilder()
            .setTitle(`🔍 Search Results: "${searchTerm}"`)
            .setColor("#3498db")
            .setFooter({
                text: `Found ${results.length} commands matching your search`,
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        if (results.length === 0) {
            embed.setDescription("No commands found matching your search term.");
        } else {
            embed.setDescription(`Here are the commands that match your search:`);

            // Add results (up to 15)
            results.slice(0, 15).forEach((cmd) => {
                embed.addFields({
                    name: cmd.data.name,
                    value: cmd.data.description || "No description provided.",
                });
            });

            if (results.length > 15) {
                embed.addFields({
                    name: `... and ${results.length - 15} more results`,
                    value: "Try refining your search for more specific results.",
                });
            }
        }

        // Create command select menu if we have results
        const components = [];

        if (results.length > 0) {
            const commandOptions = results.slice(0, 25).map((cmd) => {
                return {
                    label: cmd.data.name,
                    value: cmd.data.name,
                    description: cmd.data.description.substring(0, 100), // Truncate if too long
                };
            });

            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(COMPONENT_IDS.COMMAND_SELECT)
                    .setPlaceholder("Select a command for details")
                    .addOptions(commandOptions),
            );
            components.push(selectRow);
        }

        // Add navigation buttons
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.OVERVIEW_BUTTON)
                .setLabel("Back to Overview")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.SEARCH_BUTTON)
                .setLabel("New Search")
                .setEmoji("🔍")
                .setStyle(ButtonStyle.Primary),
        );
        components.push(buttonRow);

        // Reply with search results
        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: true,
        });
    },
};
