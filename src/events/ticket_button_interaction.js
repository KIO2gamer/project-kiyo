const {
    Events,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const TicketConfig = require("./../database/ticketConfig");
const TicketStorage = require("./../database/ticketStorage");
const { handleError } = require("./../utils/errorHandler");

module.exports = {
    name: Events.InteractionCreate,
    /**
     * Handles the interaction when a button is clicked.
     *
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord.
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Support both legacy and current button IDs
        if (interaction.customId === "open-ticket" || interaction.customId === "create_ticket") {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Fetch the ticket configuration
                const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
                const ticketCategoryId = config?.ticketCategoryId;
                const supportRoleId = config?.supportRoleId;
                const ticketPrefix = config?.ticketPrefix || "ticket";
                const maxOpenTickets = config?.maxOpenTickets || 5;

                // Check if the category ID is set
                if (!ticketCategoryId) {
                    return interaction.editReply({
                        content:
                            "A ticket category has not been set yet. Please use the `/set_ticket_category` command to set one.",
                    });
                }

                // Check if the user already has an open ticket
                const existingTicket = await TicketStorage.findOne({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    status: "open",
                });

                if (existingTicket) {
                    const channel = interaction.guild.channels.cache.get(existingTicket.channelId);
                    if (channel) {
                        return interaction.editReply({
                            content: `You already have an open ticket: <#${existingTicket.channelId}>.`,
                        });
                    }
                }

                // Check if user has reached max open tickets
                const userOpenTickets = await TicketStorage.countDocuments({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    status: "open",
                });

                if (userOpenTickets >= maxOpenTickets) {
                    return interaction.editReply({
                        content: `You can only have a maximum of ${maxOpenTickets} open tickets. Please close some first.`,
                    });
                }

                // Generate unique ticket ID
                const ticketId = `${Date.now()}-${interaction.user.id.slice(-4)}`;
                const ticketNumber = Math.floor(Math.random() * 9000) + 1000;

                // Create a new ticket channel
                const ticketChannel = await interaction.guild.channels.create({
                    name: `${ticketPrefix}-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategoryId,
                    topic: `Ticket #${ticketNumber} • User: ${interaction.user.tag} • Created: ${new Date().toLocaleDateString()}`,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                            ],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                                PermissionsBitField.Flags.ManageChannels,
                            ],
                        },
                    ],
                });

                // Add support role if configured
                if (supportRoleId) {
                    try {
                        const supportRole = interaction.guild.roles.cache.get(supportRoleId);
                        if (supportRole) {
                            await ticketChannel.permissionOverwrites.create(supportRole, {
                                ViewChannel: true,
                                SendMessages: true,
                                ReadMessageHistory: true,
                            });
                        }
                    } catch (e) {
                        console.error("Failed to add support role to ticket:", e);
                    }
                }

                // Store ticket in database
                const ticketRecord = new TicketStorage({
                    ticketId,
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    channelId: ticketChannel.id,
                    subject: "No subject provided",
                    status: "open",
                    priority: "medium",
                });
                await ticketRecord.save();

                // Create close button
                const closeButton = new ButtonBuilder()
                    .setCustomId("close_ticket_button")
                    .setLabel("Close Ticket")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("🔒");

                const row = new ActionRowBuilder().addComponents(closeButton);

                // Send welcome message to the ticket channel
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`🎫 Ticket #${ticketNumber}`)
                    .setDescription(
                        `Thank you for creating a ticket, ${interaction.user}!\n\nA staff member will review your ticket shortly. Please describe your issue in detail below.`,
                    )
                    .addFields(
                        { name: "Status", value: "🟢 Open", inline: true },
                        { name: "Priority", value: "🟡 Medium", inline: true },
                        { name: "Ticket ID", value: ticketId, inline: false },
                    )
                    .setTimestamp();

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });

                // Send staff notification if support role is set
                if (supportRoleId) {
                    const supportRole = interaction.guild.roles.cache.get(supportRoleId);
                    const notificationEmbed = new EmbedBuilder()
                        .setColor(0xffa500)
                        .setTitle("📌 New Ticket Created")
                        .setDescription(`${supportRole} - A new ticket has been created.`)
                        .addFields(
                            { name: "User", value: `${interaction.user}`, inline: true },
                            { name: "Ticket #", value: `${ticketNumber}`, inline: true },
                            { name: "Channel", value: `<#${ticketChannel.id}>`, inline: false },
                        )
                        .setTimestamp();

                    try {
                        await ticketChannel.send({
                            content: `${supportRole}`,
                            embeds: [notificationEmbed],
                        });
                    } catch (e) {
                        console.error("Failed to send staff notification:", e);
                    }
                }

                // Send a confirmation to the user
                await interaction.editReply({
                    content: `✅ Your ticket has been created: <#${ticketChannel.id}> (Ticket #${ticketNumber})`,
                });
            } catch (error) {
                console.error("Error creating ticket channel:", error);
                await interaction.editReply({
                    content: "There was an error creating your ticket. Please try again later.",
                });
            }
        } else if (interaction.customId === "close_ticket_button") {
            // Handle close ticket button
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Find ticket in database
                const ticket = await TicketStorage.findOne({
                    channelId: interaction.channel.id,
                });

                if (!ticket) {
                    return await interaction.editReply(
                        "⚠️ This command can only be used in ticket channels.",
                    );
                }

                if (ticket.status === "closed") {
                    return await interaction.editReply("⚠️ This ticket is already closed.");
                }

                // Check permissions - only staff with ManageChannels can close
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return await interaction.editReply(
                        "⚠️ You need the Manage Channels permission to close tickets.",
                    );
                }

                // Update ticket status in database
                ticket.status = "closed";
                ticket.closedAt = new Date();
                ticket.closedBy = interaction.user.id;
                ticket.closeReason = "Closed via button";
                await ticket.save();

                // Create closure summary embed
                const closureEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`🔒 Ticket Closed`)
                    .setDescription(`Ticket has been closed.`)
                    .addFields(
                        { name: "Closed By", value: `${interaction.user}`, inline: true },
                        { name: "Reason", value: "Closed via button", inline: false },
                    )
                    .setTimestamp();

                // Send closure notification to the channel
                await interaction.channel.send({ embeds: [closureEmbed] });

                // Notify the ticket creator
                const ticketCreator = await interaction.guild.members
                    .fetch(ticket.userId)
                    .catch(() => null);

                if (ticketCreator) {
                    const userNotificationEmbed = new EmbedBuilder()
                        .setTitle("🔒 Your Ticket Was Closed")
                        .setDescription(
                            `Your ticket in \`${interaction.guild.name}\` has been closed.`,
                        )
                        .addFields({
                            name: "Closed By",
                            value: `${interaction.user.tag}`,
                            inline: true,
                        })
                        .setColor("#ff0000")
                        .setThumbnail(interaction.guild.iconURL())
                        .setTimestamp();

                    try {
                        await ticketCreator.send({ embeds: [userNotificationEmbed] });
                    } catch (e) {
                        console.log("Could not DM ticket creator");
                    }
                }

                await interaction.editReply({
                    content: `✅ Ticket closed successfully. Deleting channel in 5 seconds...`,
                });

                // Delete the channel after a delay
                setTimeout(() => {
                    interaction.channel.delete().catch((e) => {
                        console.error("Failed to delete ticket channel:", e);
                    });
                }, 5000);
            } catch (error) {
                console.error("Error closing ticket:", error);
                await interaction.editReply({
                    content: "There was an error closing the ticket. Please try again later.",
                });
            }
        }
    },
};
