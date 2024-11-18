const { Events } = require('discord.js');
const TicketConfig = require('../bot_utils/ticketConfig');

module.exports = {
    name: Events.InteractionCreate,
    /**
     * Handles the interaction when a button is clicked.
     * 
     * @param {Object} interaction - The interaction object from Discord.
     * @param {Function} interaction.isButton - Checks if the interaction is a button.
     * @param {string} interaction.customId - The custom ID of the button.
     * @param {Object} interaction.guild - The guild object where the interaction took place.
     * @param {Object} interaction.user - The user who initiated the interaction.
     * @param {Object} interaction.client - The client object representing the bot.
     * @param {Function} interaction.reply - Sends a reply to the interaction.
     * 
     * @returns {Promise<void>} - A promise that resolves when the interaction is handled.
     * 
     * @throws Will throw an error if there is an issue creating the ticket channel.
     */
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'open-ticket') {
            try {
                // Fetch the ticket category ID from the database
                const config = await TicketConfig.findOne();
                const ticketCategoryId = config
                    ? config.ticketCategoryId
                    : null;

                // Check if the category ID is set
                if (!ticketCategoryId) {
                    return interaction.reply({
                        content:
                            'A ticket category has not been set yet. Please use the `/set_ticket_category` command to set one.',
                        ephemeral: true,
                    });
                }

                // Create a new ticket channel
                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    type: 0, // Text channel
                    parent: ticketCategoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['ViewChannel'],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                'ViewChannel',
                                'SendMessages',
                                'ReadMessageHistory',
                            ],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [
                                'ViewChannel',
                                'SendMessages',
                                'ReadMessageHistory',
                                'ManageChannels',
                            ],
                        },
                    ],
                });

                // Send a message to the ticket channel
                await ticketChannel.send(
                    `<@${interaction.user.id}>, your ticket has been created!`
                );

                // Send a message to the user
                await interaction.reply({
                    content: `Your ticket has been created in <#${ticketChannel.id}>.`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error('Error creating ticket channel:', error);
                await interaction.reply({
                    content:
                        'There was an error creating your ticket. Please try again later.',
                    ephemeral: true,
                });
            }
        }
    },
};
