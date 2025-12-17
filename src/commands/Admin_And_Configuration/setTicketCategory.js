const {
    ChannelType,
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags,
} = require("discord.js");

const TicketConfig = require("./../../database/ticketConfig");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full: "Sets the category where ticket channels will be created",
    usage: "/set_ticket_category category:category",
    examples: ["/set_ticket_category category:Support Tickets"],

    data: new SlashCommandBuilder()
        .setName("set_ticket_category")
        .setDescription("Set the category for ticket channels")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option
                .setName("category")
                .setDescription("The category where tickets will be created")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory),
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const category = interaction.options.getChannel("category");

            // Basic validation
            if (!category) {
                return await interaction.editReply("⚠️ You must select a category channel.");
            }

            if (category.type !== ChannelType.GuildCategory) {
                return await interaction.editReply("⚠️ The selected channel must be a category.");
            }

            if (category.guild.id !== interaction.guild.id) {
                return await interaction.editReply("⚠️ The category must be in this server.");
            }

            // Check permissions
            const botMember = interaction.guild.members.me;
            const requiredPermissions = [
                { flag: PermissionFlagsBits.ViewChannel, name: "View Channel" },
                { flag: PermissionFlagsBits.ManageChannels, name: "Manage Channels" },
                { flag: PermissionFlagsBits.ManageRoles, name: "Manage Permissions" },
            ];

            const missingPermissions = requiredPermissions
                .filter((perm) => !category.permissionsFor(botMember).has(perm.flag))
                .map((perm) => perm.name);

            if (missingPermissions.length > 0) {
                return await interaction.editReply(
                    `⚠️ I'm missing these permissions in the category:\n• ${missingPermissions.join("\n• ")}`,
                );
            }

            try {
                // Find existing config first
                let config = await TicketConfig.findOne({ guildId: interaction.guild.id });

                if (config) {
                    // Update existing config
                    config.ticketCategoryId = category.id;
                    await config.save();
                } else {
                    // Create new config
                    config = new TicketConfig({
                        guildId: interaction.guild.id,
                        ticketCategoryId: category.id,
                    });
                    await config.save();
                }

                // Verify config was saved correctly
                await TicketConfig.findOne({ guildId: interaction.guild.id });

                // Send success message
                const embed = new EmbedBuilder()
                    .setTitle("✅ Ticket Category Set")
                    .setDescription(`The ticket category has been set to **${category.name}**`)
                    .setColor(Colors.Green)
                    .addFields([
                        { name: "Category", value: category.name, inline: true },
                        { name: "Category ID", value: category.id, inline: true },
                        {
                            name: "Next Step",
                            value: "Use `/send_ticket_message` to create a panel where users can open tickets",
                        },
                    ])
                    .setFooter({
                        text: `Set by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (dbError) {
                console.error("Database error when setting ticket category:", dbError);
                throw dbError;
            }
        } catch (error) {
            console.error("Error in set_ticket_category command:", error);

            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "There was an error setting the ticket category. Please try again.",
            );
        }
    },
};
