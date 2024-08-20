const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    usage: ,
    examples: ,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),
    async execute(interaction) {
        // Read command categories (subfolders)
        const commandFolders = fs.readdirSync('./commands');
        const categories = commandFolders.map(folder => {
            const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
            
            // Create a list of commands in the category with clickable links
            const commands = commandFiles.map(file => {
                const command = require(`../${folder}/${file}`);
                // Find the command in the cache to get its ID for the </command:id> format
                const commandId = interaction.client.application.commands.cache.find(cmd => cmd.name === command.data.name)?.id;
                if (commandId) {
                    // Format the command as a clickable link
                    return `</${command.data.name}:${commandId}> - ${command.data.description}`;
                } else {
                    return `\`/${command.data.name}\` - ${command.data.description}`; // Fallback if command ID isn't found
                }
            });

            return {
                name: folder.charAt(0).toUpperCase() + folder.slice(1),
                value: commands.join('\n'),
            };
        });

        let currentIndex = 0;

        // Function to generate the embed for the current category
        const generateEmbed = (index) => {
            return new EmbedBuilder()
                .setTitle(`${categories[index].name} Commands`)
                .setDescription(categories[index].value)
                .setColor(0x00AE86)
                .setFooter({ text: `Page ${index + 1} of ${categories.length}` });
        };

        // Function to generate the buttons for pagination
        const generateButtons = (index) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === 0),  // Disable if on the first page
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === categories.length - 1)  // Disable if on the last page
            );
        };

        const embed = generateEmbed(currentIndex);
        const buttons = generateButtons(currentIndex);

        // Send the initial embed with buttons
        const message = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

        // Create a message component collector for button interaction
        const filter = i => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            // Update the current index based on button click
            if (i.customId === 'next' && currentIndex < categories.length - 1) {
                currentIndex++;
            } else if (i.customId === 'previous' && currentIndex > 0) {
                currentIndex--;
            }

            // Update the embed and buttons
            await i.update({ 
                embeds: [generateEmbed(currentIndex)], 
                components: [generateButtons(currentIndex)] 
            });
        });

        collector.on('end', () => {
            if (!message.editable) return;
            message.edit({ components: [] });  // Remove buttons after the collector ends
        });
    },
};
