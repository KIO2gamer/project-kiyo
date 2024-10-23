const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    description_full:
        'Displays a list of available commands and their descriptions.',
    usage: '/help [command] [search]',
    examples: ['/help', '/help ping', '/help search:music'],
    category: 'info',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get information about available commands')
        .addStringOption((option) =>
            option
                .setName('command')
                .setDescription('Specific command to get help for')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('search')
                .setDescription('Search term to filter commands')
                .setRequired(false)
        ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const search = interaction.options.getString('search');

        // If a specific command is requested, show that command's help
        if (commandName) {
            const command = interaction.client.commands.get(commandName);
            if (!command) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription(
                                `❌ Command \`${commandName}\` not found.`
                            ),
                    ],
                });
            }
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Command: ${commandName}`)
                .setDescription(
                    command.description_full || command.data.description
                )
                .addFields(
                    {
                        name: '🔧 Usage',
                        value: `\`${command.usage || command.data.name}\``,
                    },
                    ...(command.examples && command.examples.length
                        ? [
                              {
                                  name: '📝 Examples',
                                  value: `\`\`\`\n${command.examples.join(
                                      '\n'
                                  )}\`\`\``,
                              },
                          ]
                        : []),
                    {
                        name: '📁 Category',
                        value: `\`${command.category || 'No category'}\``,
                    }
                )
                .setFooter({ text: 'Tip: Use /help to see all commands' });

            return interaction.editReply({ embeds: [embed] });
        }

        // If a search term is provided, filter commands and show results
        if (search) {
            const commands = interaction.client.commands.filter(
                (command) =>
                    command.data.name
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                    command.data.description
                        .toLowerCase()
                        .includes(search.toLowerCase())
            );
            if (commands.size === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription(
                                `❌ No commands found matching \`${search}\``
                            ),
                    ],
                });
            }
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔍 Search Results')
                .setDescription(
                    commands
                        .map(
                            (cmd) =>
                                `**/${cmd.data.name}**\n└ ${cmd.data.description}`
                        )
                        .join('\n\n')
                )
                .setFooter({ text: `Found ${commands.size} command(s)` });

            return interaction.editReply({ embeds: [embed] });
        }

        // Show the main help menu with select menu and buttons
        const categories = new Map();
        interaction.client.commands.forEach((command) => {
            if (!categories.has(command.category)) {
                categories.set(command.category, []);
            }
            categories.get(command.category).push(command);
        });

        // Create the main help embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📚 Statbot Help Menu')
            .setDescription(
                "This is Statbot's help menu. Use the dropdown below to navigate to the category of your choice."
            )
            .setFooter({
                text: `Total Commands: ${interaction.client.commands.size}`,
            });

        // Create the select menu for categories
        const options = Array.from(categories.keys()).map((category) => ({
            label: category
                ? category.charAt(0).toUpperCase() + category.slice(1)
                : 'Miscellaneous',
            description: `Commands related to ${category || 'Misc'}`,
            value: category || 'miscellaneous',
            emoji: getCategoryEmoji(category),
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help-menu')
            .setPlaceholder('Make a selection')
            .addOptions(options);

        // Add buttons for quick navigation
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('guide')
                .setLabel('📘 Guide')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('commands')
                .setLabel('⚙️ Commands')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('faq')
                .setLabel('❓ FAQs')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('🔗 Links')
                .setStyle(ButtonStyle.Link) // Button that links to a URL
                .setURL('https://example.com') // Replace with actual link, no customId
        );

        // Send the initial help menu with select menu and buttons
        await interaction.editReply({
            embeds: [helpEmbed],
            components: [new ActionRowBuilder().addComponents(selectMenu), row],
        });

        // Handle the selection
        const filter = (i) =>
            i.customId === 'help-menu' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 60000, // Collector time limit (60 seconds)
        });

        collector.on('collect', async (i) => {
            const selectedCategory = i.values[0];
            const selectedCommands = categories.get(selectedCategory) || [];

            const categoryEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`📂 ${selectedCategory} Commands`)
                .setDescription(
                    selectedCommands
                        .map(
                            (cmd) =>
                                `**/${cmd.data.name}**\n└ ${cmd.data.description}`
                        )
                        .join('\n\n')
                )
                .setFooter({
                    text: `Category: ${selectedCategory} • Total: ${selectedCommands.length} commands`,
                });

            await i.update({ embeds: [categoryEmbed], components: [] });
        });

        collector.on('end', (collected) => {
            console.log(`Collected ${collected.size} interactions.`);
        });
    },
};

// Helper function to get emojis for categories
function getCategoryEmoji(category) {
    const emojiMap = {
        info: 'ℹ️',
        moderation: '🛡️',
        fun: '🎮',
        utility: '🔧',
        music: '🎵',
        economy: '💰',
        admin: '⚡',
    };
    return emojiMap[category] || '📁';
}
