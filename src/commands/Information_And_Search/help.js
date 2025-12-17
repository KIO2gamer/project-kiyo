const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
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

    async execute(interaction) {
        try {
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

        if (interaction.isChatInputCommand()) {
            await interaction.reply({
                embeds: [embed],
                components: [selectRow, buttonRow],
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.update({
                content: null,
                embeds: [embed],
                components: [selectRow, buttonRow],
            });
        }
    },

    getCategorizedCommands(commands) {
        const categories = {};
        for (const command of commands.values()) {
            let category;

            if (command.category) {
                category = command.category;
            } else if (command.filePath) {
                const folderMatch = command.filePath.match(/([^/\\]+)[/\\][^/\\]+\.js$/);
                category = folderMatch ? folderMatch[1].toLowerCase() : "misc";
            } else {
                category = "misc";
            }

            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        }

        for (const category in categories) {
            categories[category].sort((a, b) => a.data.name.localeCompare(b.data.name));
        }

        const filteredCategories = {};
        for (const [categoryName, commandList] of Object.entries(categories)) {
            if (commandList.length > 0) {
                filteredCategories[categoryName] = commandList;
            }
        }
        return filteredCategories;
    },

    async displayCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName.toLowerCase());

        if (!command) {
            const msgWithFlags = {
                content: `Command \`${commandName}\` not found. Try using /help to see all available commands.`,
                flags: MessageFlags.Ephemeral,
            };
            return interaction.replied || interaction.deferred
                ? interaction.followUp(msgWithFlags)
                : interaction.reply(msgWithFlags);
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
        if (command.examples?.length > 0) {
            embed.addFields({
                name: "Examples",
                value: command.examples.map((example) => `\`${example}\``).join("\n"),
            });
        }

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

        if (interaction.isChatInputCommand()) {
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

    formatCategoryName(category) {
        if (!category) return "Miscellaneous";
        return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    },

    getCategory(client, categoryName) {
        return client.categories.get(categoryName.toLowerCase()) || { emoji: "📄" };
    },

    getCommandPermissions(command) {
        if (!command.data.default_member_permissions) return null;
        const permFlag = BigInt(command.data.default_member_permissions);
        const permissions = [];

        if (permFlag & (1n << 3n)) permissions.push("Administrator");
        if (permFlag & (1n << 5n)) permissions.push("Manage Server");
        if (permFlag & (1n << 6n)) permissions.push("Manage Channels");
        if (permFlag & (1n << 7n)) permissions.push("Kick Members");
        if (permFlag & (1n << 8n)) permissions.push("Ban Members");
        if (permFlag & (1n << 13n)) permissions.push("Manage Messages");
        if (permFlag & (1n << 28n)) permissions.push("Manage Roles");

        return permissions.length > 0 ? permissions.join(", ") : "None";
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = Array.from(interaction.client.commands.keys());

        const filtered = focusedValue
            ? choices.filter((choice) => choice.toLowerCase().includes(focusedValue))
            : choices.slice(0, 25);

        await interaction.respond(
            filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
        );
    },

    async displayCategory(interaction, categoryName) {
        const client = interaction.client;
        const categories = this.getCategorizedCommands(client.commands);
        const commands = categories[categoryName] || [];

        if (commands.length === 0) {
            await interaction.update({
                content: "No commands found in this category.",
                embeds: [],
                components: [],
            });
            return;
        }

        const category = this.getCategory(client, categoryName);
        const embed = new EmbedBuilder()
            .setTitle(`${category.emoji} ${this.formatCategoryName(categoryName)} Commands`)
            .setDescription(`${commands.length} commands available in this category.`)
            .setColor("#3498db")
            .setTimestamp();

        commands.forEach((cmd) => {
            embed.addFields({
                name: cmd.data.name,
                value: cmd.data.description || "No description provided.",
                inline: true,
            });
        });

        const commandOptions = commands.slice(0, 25).map((cmd) => ({
            label: cmd.data.name,
            value: cmd.data.name,
            description: cmd.data.description.substring(0, 100),
        }));

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
        );

        await interaction.update({
            embeds: [embed],
            components: [selectRow, buttonRow],
        });
    },

    async handleSelectMenu(interaction) {
        switch (interaction.customId) {
            case COMPONENT_IDS.CATEGORY_SELECT: {
                await this.displayCategory(interaction, interaction.values[0]);
                break;
            }
            case COMPONENT_IDS.COMMAND_SELECT: {
                await this.displayCommandHelp(interaction, interaction.values[0]);
                break;
            }
        }
    },

    async handleButton(interaction) {
        switch (interaction.customId) {
            case COMPONENT_IDS.OVERVIEW_BUTTON:
                await this.displayOverview(interaction);
                break;

            case COMPONENT_IDS.SEARCH_BUTTON:
                await this.handleSearchButton(interaction);
                break;

            case COMPONENT_IDS.REFRESH_BUTTON: {
                const title = interaction.message.embeds[0]?.title ?? "";
                if (title.startsWith("Command:")) {
                    const commandName = title.split(": ")[1];
                    await this.displayCommandHelp(interaction, commandName);
                } else if (title.includes("Commands")) {
                    // Safer: store category in footer instead of parsing title
                    await this.displayOverview(interaction);
                } else {
                    await this.displayOverview(interaction);
                }
                break;
            }
        }
    },

    async handleSearchButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId(COMPONENT_IDS.SEARCH_MODAL)
            .setTitle("Search Commands");

        const searchInput = new TextInputBuilder()
            .setCustomId("search_term")
            .setLabel("Search Term")
            .setPlaceholder("Enter command name or keywords")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(searchInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    async handleSearchModal(interaction) {
        const searchTerm = interaction.fields.getTextInputValue("search_term").toLowerCase().trim();

        const commands = interaction.client.commands;
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
        }

        const components = [];
        if (results.length > 0) {
            const commandOptions = results.slice(0, 25).map((cmd) => ({
                label: cmd.data.name,
                value: cmd.data.name,
                description: cmd.data.description.substring(0, 100),
            }));

            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(COMPONENT_IDS.COMMAND_SELECT)
                    .setPlaceholder("Select a command for details")
                    .addOptions(commandOptions),
            );
            components.push(selectRow);
        }

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

        await interaction.reply({
            embeds: [embed],
            components,
            flags: MessageFlags.Ephemeral,
        });
    },
};
