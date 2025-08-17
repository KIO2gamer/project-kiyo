const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const { handleError } = require("../../utils/errorHandler");
const YTSubRoleConfig = require("../../database/ytSubRoleConfig");

module.exports = {
    description_full:
        "Configure YouTube subscriber role tiers for the server. Set up roles that are automatically assigned based on users' YouTube subscriber counts.",
    usage: "/yt_sub_role_config [action]",
    examples: [
        "/yt_sub_role_config action:setup",
        "/yt_sub_role_config action:view",
        "/yt_sub_role_config action:add_tier",
        "/yt_sub_role_config action:remove_tier",
        "/yt_sub_role_config action:toggle",
    ],

    data: new SlashCommandBuilder()
        .setName("yt_sub_role_config")
        .setDescription("Configure YouTube subscriber role tiers")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("Action to perform")
                .setRequired(true)
                .addChoices(
                    { name: "Setup Initial Configuration", value: "setup" },
                    { name: "View Current Configuration", value: "view" },
                    { name: "Add New Tier", value: "add_tier" },
                    { name: "Remove Tier", value: "remove_tier" },
                    { name: "Toggle Enable/Disable", value: "toggle" },
                    { name: "Clear All Configuration", value: "clear" },
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            const action = interaction.options.getString("action");
            const guildId = interaction.guild.id;
            const userId = interaction.user.id;

            // Check if user has manage roles permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                await handleError(
                    interaction,
                    new Error("Insufficient permissions"),
                    "PERMISSION",
                    "You need the 'Manage Roles' permission to configure YouTube subscriber roles.",
                );
                return;
            }

            switch (action) {
                case "setup":
                    await this.handleSetup(interaction, guildId, userId);
                    break;
                case "view":
                    await this.handleView(interaction, guildId);
                    break;
                case "add_tier":
                    await this.handleAddTier(interaction, guildId, userId);
                    break;
                case "remove_tier":
                    await this.handleRemoveTier(interaction, guildId, userId);
                    break;
                case "toggle":
                    await this.handleToggle(interaction, guildId, userId);
                    break;
                case "clear":
                    await this.handleClear(interaction, guildId, userId);
                    break;
                default:
                    await handleError(
                        interaction,
                        new Error("Invalid action"),
                        "VALIDATION",
                        "Invalid action specified.",
                    );
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while configuring YouTube subscriber roles.",
            );
        }
    },

    async handleSetup(interaction, guildId, userId) {
        const existingConfig = await YTSubRoleConfig.findOne({ guildId });
        if (existingConfig && existingConfig.subscriberTiers.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle("⚠️ Configuration Already Exists")
                .setDescription(
                    "YouTube subscriber roles are already configured for this server. Use other actions to modify the configuration or use the 'clear' action to start over.",
                )
                .setColor("#FFA500");

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // Create setup modal
        const modal = new ModalBuilder()
            .setCustomId(`yt_setup_${userId}`)
            .setTitle("YouTube Subscriber Role Setup");

        const tierInput = new TextInputBuilder()
            .setCustomId("tiers")
            .setLabel("Subscriber Tiers (one per line)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(
                "Format: subscribers:@role\nExample:\n100:@Bronze Creator\n1000:@Silver Creator",
            )
            .setRequired(true)
            .setMaxLength(1000);

        const firstActionRow = new ActionRowBuilder().addComponents(tierInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        // Handle modal submission
        const filter = (i) => i.customId === `yt_setup_${userId}` && i.user.id === userId;
        try {
            const modalSubmission = await interaction.awaitModalSubmit({
                filter,
                time: 300000, // 5 minutes
            });

            await modalSubmission.deferReply();
            await this.processSetupData(modalSubmission, guildId, userId);
        } catch (error) {
            console.error("Modal submission timeout or error:", error);
        }
    },

    async processSetupData(interaction, guildId, userId) {
        const tiersInput = interaction.fields.getTextInputValue("tiers");
        const lines = tiersInput.split("\n").filter((line) => line.trim());

        const subscriberTiers = [];
        const errors = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(/^(\d+):@?(.+)$/);

            if (!match) {
                errors.push(`Line ${i + 1}: Invalid format "${line}"`);
                continue;
            }

            const minSubscribers = parseInt(match[1]);
            const roleName = match[2].trim();

            // Find role by name
            const role = interaction.guild.roles.cache.find(
                (r) => r.name.toLowerCase() === roleName.toLowerCase(),
            );

            if (!role) {
                errors.push(`Line ${i + 1}: Role "${roleName}" not found`);
                continue;
            }

            // Check if bot can manage this role
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                errors.push(
                    `Line ${i + 1}: Cannot manage role "${roleName}" (higher than bot's role)`,
                );
                continue;
            }

            subscriberTiers.push({
                minSubscribers,
                roleId: role.id,
                tierName: roleName,
            });
        }

        if (errors.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Configuration Errors")
                .setDescription("The following errors were found:\n\n" + errors.join("\n"))
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (subscriberTiers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Valid Tiers")
                .setDescription("No valid subscriber tiers were found in your input.")
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Sort tiers by subscriber count
        subscriberTiers.sort((a, b) => a.minSubscribers - b.minSubscribers);

        // Save configuration
        await YTSubRoleConfig.findOneAndUpdate(
            { guildId },
            {
                guildId,
                subscriberTiers,
                isEnabled: true,
                updatedBy: userId,
            },
            { upsert: true, new: true },
        );

        const embed = new EmbedBuilder()
            .setTitle("✅ Configuration Saved")
            .setDescription(
                `Successfully configured ${subscriberTiers.length} YouTube subscriber tiers:\n\n` +
                    subscriberTiers
                        .map((tier) => {
                            const role = interaction.guild.roles.cache.get(tier.roleId);
                            return `**${this.formatNumber(tier.minSubscribers)}+ subscribers:** ${role.name}`;
                        })
                        .join("\n"),
            )
            .setColor("#00FF00")
            .setFooter({
                text: "Users can now use /get_yt_sub_role to get their subscriber-based roles",
            });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleView(interaction, guildId) {
        await interaction.deferReply();

        const config = await YTSubRoleConfig.findOne({ guildId });
        if (!config) {
            const embed = new EmbedBuilder()
                .setTitle("📋 No Configuration Found")
                .setDescription(
                    "YouTube subscriber roles are not configured for this server. Use `/yt_sub_role_config action:setup` to get started.",
                )
                .setColor("#FFA500");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 YouTube Subscriber Role Configuration")
            .setDescription(
                `**Status:** ${config.isEnabled ? "✅ Enabled" : "❌ Disabled"}\n` +
                    `**Last Updated:** <t:${Math.floor(config.lastUpdated.getTime() / 1000)}:R>\n` +
                    `**Updated By:** <@${config.updatedBy}>\n\n` +
                    `**Configured Tiers (${config.subscriberTiers.length}):**`,
            )
            .setColor(config.isEnabled ? "#00FF00" : "#FF0000");

        if (config.subscriberTiers.length > 0) {
            const tiers = config.subscriberTiers
                .sort((a, b) => a.minSubscribers - b.minSubscribers)
                .map((tier) => {
                    const role = interaction.guild.roles.cache.get(tier.roleId);
                    const roleName = role ? role.name : "❌ Role Deleted";
                    const roleStatus = role ? "" : " (Role no longer exists)";
                    return `**${this.formatNumber(tier.minSubscribers)}+ subscribers:** ${roleName}${roleStatus}`;
                })
                .join("\n");

            embed.addFields({
                name: "📊 Subscriber Tiers",
                value: tiers,
                inline: false,
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`yt_config_add_${interaction.user.id}`)
                .setLabel("Add Tier")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`yt_config_remove_${interaction.user.id}`)
                .setLabel("Remove Tier")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(config.subscriberTiers.length === 0),
            new ButtonBuilder()
                .setCustomId(`yt_config_toggle_${interaction.user.id}`)
                .setLabel(config.isEnabled ? "Disable" : "Enable")
                .setStyle(config.isEnabled ? ButtonStyle.Secondary : ButtonStyle.Success),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async handleAddTier(interaction, guildId, userId) {
        const modal = new ModalBuilder()
            .setCustomId(`yt_add_tier_${userId}`)
            .setTitle("Add New Subscriber Tier");

        const subscribersInput = new TextInputBuilder()
            .setCustomId("subscribers")
            .setLabel("Minimum Subscribers")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g., 1000")
            .setRequired(true);

        const roleInput = new TextInputBuilder()
            .setCustomId("role")
            .setLabel("Role Name")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g., Silver Creator")
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(subscribersInput),
            new ActionRowBuilder().addComponents(roleInput),
        );

        await interaction.showModal(modal);
    },

    async handleRemoveTier(interaction, guildId, userId) {
        await interaction.deferReply();

        const config = await YTSubRoleConfig.findOne({ guildId });
        if (!config || config.subscriberTiers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Tiers to Remove")
                .setDescription("There are no subscriber tiers configured to remove.")
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const options = config.subscriberTiers.map((tier, index) => {
            const role = interaction.guild.roles.cache.get(tier.roleId);
            const roleName = role ? role.name : "Deleted Role";
            return {
                label: `${this.formatNumber(tier.minSubscribers)}+ - ${roleName}`,
                value: index.toString(),
                description: `Remove the ${this.formatNumber(tier.minSubscribers)} subscriber tier`,
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`yt_remove_select_${userId}`)
            .setPlaceholder("Select a tier to remove")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setTitle("🗑️ Remove Subscriber Tier")
            .setDescription("Select the subscriber tier you want to remove:")
            .setColor("#FFA500");

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async handleToggle(interaction, guildId, userId) {
        await interaction.deferReply();

        const config = await YTSubRoleConfig.findOneAndUpdate(
            { guildId },
            { $set: { isEnabled: { $not: "$isEnabled" }, updatedBy: userId } },
            { new: true },
        );

        if (!config) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Configuration Found")
                .setDescription(
                    "No YouTube subscriber role configuration found. Use the setup action first.",
                )
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${config.isEnabled ? "✅ Enabled" : "❌ Disabled"}`)
            .setDescription(
                `YouTube subscriber roles have been ${config.isEnabled ? "enabled" : "disabled"} for this server.`,
            )
            .setColor(config.isEnabled ? "#00FF00" : "#FF0000");

        await interaction.editReply({ embeds: [embed] });
    },

    async handleClear(interaction, guildId, userId) {
        await interaction.deferReply();

        const config = await YTSubRoleConfig.findOne({ guildId });
        if (!config) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Configuration Found")
                .setDescription("There is no YouTube subscriber role configuration to clear.")
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Create confirmation buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`yt_clear_confirm_${userId}`)
                .setLabel("Yes, Clear All")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`yt_clear_cancel_${userId}`)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary),
        );

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Confirm Clear Configuration")
            .setDescription(
                "Are you sure you want to clear all YouTube subscriber role configuration?\n\n" +
                    `This will remove **${config.subscriberTiers.length} configured tiers** and cannot be undone.`,
            )
            .setColor("#FFA500");

        await interaction.editReply({ embeds: [embed], components: [row] });

        // Handle confirmation
        const filter = (i) =>
            (i.customId === `yt_clear_confirm_${userId}` ||
                i.customId === `yt_clear_cancel_${userId}`) &&
            i.user.id === userId;

        try {
            const confirmation = await interaction.awaitMessageComponent({
                filter,
                time: 30000,
            });

            if (confirmation.customId === `yt_clear_confirm_${userId}`) {
                await YTSubRoleConfig.deleteOne({ guildId });

                const successEmbed = new EmbedBuilder()
                    .setTitle("✅ Configuration Cleared")
                    .setDescription("All YouTube subscriber role configuration has been cleared.")
                    .setColor("#00FF00");

                await confirmation.update({ embeds: [successEmbed], components: [] });
            } else {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("❌ Cancelled")
                    .setDescription("Configuration clear cancelled.")
                    .setColor("#FF0000");

                await confirmation.update({ embeds: [cancelEmbed], components: [] });
            }
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Timeout")
                .setDescription("Confirmation timeout. Configuration was not cleared.")
                .setColor("#FFA500");

            await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        }
    },

    formatNumber(num) {
        if (!num) return "0";
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + "B";
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    },
};
