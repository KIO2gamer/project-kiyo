const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
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
    QUIT_BUTTON: "help_quit",
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

        const totalCategories = Object.keys(categories).length;
        const embed = new EmbedBuilder()
            .setTitle("📚 Command Help")
            .setDescription(
                `Browse commands by category or search for specific commands.\n\n**${client.commands.size} commands** available across **${totalCategories} categories**.`,
            )
            .setColor("#3498db")
            .setFooter({
                text: "Use the menu below to navigate • Updated after cleanup",
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();

        // Add category fields with command counts
        const sortedCategories = Object.entries(categories).sort(([a], [b]) =>
            this.formatCategoryName(a).localeCompare(this.formatCategoryName(b)),
        );

        for (const [categoryName, commands] of sortedCategories) {
            if (commands.length > 0) {
                const formattedName = this.formatCategoryName(categoryName);
                const category = this.getCategory(client, categoryName);
                embed.addFields({
                    name: `${category.emoji} ${formattedName} (${commands.length})`,
                    value:
                        commands
                            .slice(0, 3)
                            .map((cmd) => `\`${cmd.data.name}\``)
                            .join(", ") +
                        (commands.length > 3 ? ` and ${commands.length - 3} more...` : ""),
                    inline: true,
                });
            }
        }

        // Create category select menu
        const categoryOptions = Object.keys(categories)
            .filter((category) => categories[category].length > 0)
            .sort((a, b) => this.formatCategoryName(a).localeCompare(this.formatCategoryName(b)))
            .map((categoryName) => {
                const category = this.getCategory(client, categoryName);
                return {
                    label: this.formatCategoryName(categoryName),
                    value: categoryName,
                    description: `View ${categories[categoryName].length} commands in this category`,
                    emoji: category.emoji,
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
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.QUIT_BUTTON)
                .setLabel("Close")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),
        );

        // Check if this is the initial command or an update to an existing message
        if (interaction.isCommand()) {
            await interaction.reply({
                embeds: [embed],
                components: [selectRow, buttonRow],
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.update({
                content: null, // Remove any previous content
                embeds: [embed],
                components: [selectRow, buttonRow],
            });
        }
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
            // 1. Explicit category property (set by command loader)
            // 2. Folder name from command's file path
            // 3. Fall back to "misc" if nothing else works
            let category;

            if (command.category) {
                // Use explicitly defined category if available
                category = command.category;
            } else if (command.filePath) {
                // Extract folder name from file path
                // Assuming filePath looks like ".../<category_folder>/<command_name>.js"
                const folderMatch = command.filePath.match(/([^/\\]+)[/\\][^/\\]+\.js$/);
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

        // Filter out empty categories (shouldn't happen with the improved loader, but safety check)
        const filteredCategories = {};
        for (const [categoryName, commandList] of Object.entries(categories)) {
            if (commandList.length > 0) {
                filteredCategories[categoryName] = commandList;
            }
        }

        return filteredCategories;
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
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                return interaction.reply({
                    content: `Command \`${commandName}\` not found. Try using /help to see all available commands.`,
                    flags: MessageFlags.Ephemeral,
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
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.QUIT_BUTTON)
                .setLabel("Close")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),
        );

        // Check if this is a new interaction or an update to an existing one
        if (interaction.isCommand()) {
            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral,
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
            const embed = new EmbedBuilder()
                .setTitle("❌ Category Not Found")
                .setDescription(
                    `No commands found in category: **${this.formatCategoryName(categoryName)}**\n\nThis category may have been cleaned up or all commands may have been removed.`,
                )
                .setColor("#e74c3c")
                .setTimestamp();

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(COMPONENT_IDS.OVERVIEW_BUTTON)
                    .setLabel("Back to Overview")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(COMPONENT_IDS.QUIT_BUTTON)
                    .setLabel("Close")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger),
            );

            return interaction.update({
                embeds: [embed],
                components: [buttonRow],
            });
        }

        const category = this.getCategory(client, categoryName);
        const embed = new EmbedBuilder()
            .setTitle(
                `${category.emoji} ${this.formatCategoryName(categoryName)} Commands`,
            )
            .setDescription("Select a command to view details")
            .setColor("#3498db")
            .setFooter({
                text: `${commands.length} commands in this category`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();

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
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.QUIT_BUTTON)
                .setLabel("Close")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),
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
     * Get category information from the client
     * @param {Client} client - The client object
     * @param {string} categoryName - The name of the category
     * @returns {object} - The category object, or a default
     */
    getCategory(client, categoryName) {
        return client.categories.get(categoryName.toLowerCase()) || { emoji: "📄" };
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
        case COMPONENT_IDS.CATEGORY_SELECT: {
            const categoryValue = interaction.values[0];
            await this.displayCategory(interaction, categoryValue);
            break;
        }

        case COMPONENT_IDS.COMMAND_SELECT: {
            const commandValue = interaction.values[0];
            await this.displayCommandHelp(interaction, commandValue);
            break;
        }
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

        case COMPONENT_IDS.QUIT_BUTTON:
            await interaction.update({
                content: "Help menu closed.",
                embeds: [],
                components: [],
            });
            break;
        }
    },

    /**
     * Handle search button
     * @param {Object} interaction - The interaction object
     */
    async handleSearchButton(interaction) {
        // Create a modal with a search input field
        const modal = new ModalBuilder()
            .setCustomId(COMPONENT_IDS.SEARCH_MODAL)
            .setTitle("Search Commands");

        const searchInput = new TextInputBuilder()
            .setCustomId("search_term")
            .setLabel("Search Term")
            .setPlaceholder("Enter command name or keywords")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100);

        const actionRow = new ActionRowBuilder().addComponents(searchInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    /**
     * Handle search modal submission
     * @param {Object} interaction - The interaction object
     */
    async handleSearchModal(interaction) {
        const searchTerm = interaction.fields.getTextInputValue("search_term").toLowerCase().trim();

        if (!searchTerm) {
            return interaction.update({
                content: "Please provide a search term.",
                embeds: [],
                components: [],
            });
        }

        const commands = interaction.client.commands;

        // Find matching commands
        const results = [];
        for (const command of commands.values()) {
            const name = command.data.name.toLowerCase();
            const description = (command.data.description || "").toLowerCase();
            const category = (command.category || "").toLowerCase();

            if (
                name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.includes(searchTerm)
            ) {
                results.push(command);
            }
        }

        // Create embed with results
        const embed = new EmbedBuilder()
            .setTitle(`🔍 Search Results: "${searchTerm}"`)
            .setColor("#3498db")
            .setTimestamp()
            .setFooter({
                text: `Found ${results.length} matching commands`,
                iconURL: interaction.client.user.displayAvatarURL(),
            });

        if (results.length === 0) {
            embed.setDescription("No commands found matching your search term.");
        } else {
            embed.setDescription("Here are the commands that match your search:");

            results.slice(0, 15).forEach((cmd) => {
                embed.addFields({
                    name: cmd.data.name,
                    value: cmd.data.description || "No description provided.",
                });
            });

            if (results.length > 15) {
                embed.addFields({
                    name: `... and ${results.length - 15} more matches`,
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
            new ButtonBuilder()
                .setCustomId(COMPONENT_IDS.QUIT_BUTTON)
                .setLabel("Close")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),
        );
        components.push(buttonRow);

        // Use update instead of reply
        await interaction.update({
            content: null, // Remove any previous content
            embeds: [embed],
            components: components,
        });
    },
};
