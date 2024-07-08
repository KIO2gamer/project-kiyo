const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const errorHandler = require('../../events/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_custom_commands')
        .setDescription('Shows all custom commands'),

    async execute(interaction) {
        try {
            // Define the directory path
            const dirPath = path.join(__dirname);

            // Read all files in the directory
            const files = fs.readdirSync(dirPath);

            // Define files to exclude
            const excludeFiles = ['createCommands.js', 'deleteCommands.js', 'editCommands.js', 'showCommands.js'];

            // Filter out the files to exclude
            const commandFiles = files.filter(file => !excludeFiles.includes(file));

            // Check if there are no commands to show
            if (commandFiles.length === 0) {
                return interaction.reply({ content: 'There are no custom commands to show.', ephemeral: true });
            }

            // Split commands into pages of 10
            const commandsPerPage = 10;
            const totalPages = Math.ceil(commandFiles.length / commandsPerPage);

            // Function to generate embed for a specific page
            const generateEmbed = (page) => {
                const start = page * commandsPerPage;
                const end = start + commandsPerPage;
                const currentCommands = commandFiles.slice(start, end);
                
                const embedDescription = currentCommands.length > 0 
                    ? currentCommands.map((file, index) => `${start + index + 1}. ${file.replace('.js', '')}`).join('\n')
                    : 'No commands available on this page.';

                return new EmbedBuilder()
                    .setTitle('Custom Commands')
                    .setColor(0x00AE86)
                    .setDescription(embedDescription)
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
                    .setTimestamp();
            };

            // Initial page
            let currentPage = 0;
            const embed = generateEmbed(currentPage);

            // Create buttons for navigation
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages - 1)
                );

            // Send the initial message with the embed and buttons
            const message = await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });

            // Create a collector to handle button interactions
            const collector = message.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.user.id !== interaction.user.id) {
                    return btnInteraction.reply({ content: 'You cannot interact with this button.', ephemeral: true });
                }

                if (btnInteraction.customId === 'previous' && currentPage > 0) {
                    currentPage--;
                } else if (btnInteraction.customId === 'next' && currentPage < totalPages - 1) {
                    currentPage++;
                }

                const newEmbed = generateEmbed(currentPage);

                const newButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages - 1)
                    );

                await btnInteraction.update({ embeds: [newEmbed], components: [newButtons] });
            });

            collector.on('end', async () => {
                await message.edit({ components: [] });
            });
        } catch (error) {
            console.error('Error fetching custom commands:', error);
            errorHandler.handleError(error, interaction);
        }
    }
};
