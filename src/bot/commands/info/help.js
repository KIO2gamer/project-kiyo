const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { handleError } = require('./../../utils/errorHandler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows help menu with guides and commands')
        .addStringOption((option) =>
            option
                .setName('search')
                .setDescription('Search for a specific command or topic')
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName('command')
                .setDescription('Show detailed info for a specific command')
                .setRequired(false),
        ),
    description_full:
        'Shows an interactive help menu with guides, commands, FAQs, and important links. Navigate through different sections using the buttons provided.',
    usage: '/help [search] [command]',
    examples: ['/help', '/help search:music', '/help command:ban'],
    category: 'info',

    async execute(interaction) {
        try {
            const searchQuery = interaction.options
                .getString('search')
                ?.toLowerCase();
            const commandQuery = interaction.options.getString('command');

            // Fetch commands
            const allCommands = interaction.client.commands;
            let commands = Array.from(allCommands.values());

            // Show detailed info for a specific command
            if (commandQuery) {
                const command = commands.find(
                    (cmd) => cmd.data.name.toLowerCase() === commandQuery.toLowerCase(),
                );

                if (!command) {
                    await interaction.reply({
                        content: `No command found with the name \`${commandQuery}\`.`,
                        ephemeral: true,
                    });
                    return;
                }

                const commandEmbed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle(`Command: /${command.data.name}`)
                    .setDescription(command.description_full || 'No description available.')
                    .addFields(
                        { name: 'Usage', value: command.usage || 'No usage info available.' },
                        { name: 'Examples', value: command.examples.join('\n') || 'No examples available.' },
                    )
                    .setTimestamp()
                    .setFooter({
                        text: 'Use the buttons below to navigate',
                        iconURL: interaction.user.displayAvatarURL({
                            dynamic: true,
                        }),
                    });

                await interaction.reply({
                    embeds: [commandEmbed],
                    ephemeral: true,
                });
                return;
            }

            // Apply search filter if provided
            if (searchQuery) {
                commands = commands.filter(
                    (cmd) =>
                        cmd.data.name.toLowerCase().includes(searchQuery) ||
                        cmd.data.description
                            .toLowerCase()
                            .includes(searchQuery),
                );

                if (commands.length === 0) {
                    await interaction.followUp({
                        content: 'No commands found matching your search.',
                        ephemeral: true,
                    });
                    return;
                }

                // Create search results embed
                const searchEmbed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle('🔍 Search Results')
                    .setDescription(
                        'Here are the commands matching your search:',
                    )
                    .addFields(
                        commands.map((cmd) => ({
                            name: `/${cmd.data.name}`,
                            value: `**Description:** ${cmd.data.description || 'No description'}\n**Usage:** ${cmd.usage || 'No usage info'}`,
                            inline: false,
                        })),
                    )
                    .setThumbnail(
                        interaction.client.user.displayAvatarURL({
                            dynamic: true,
                            size: 256,
                        }),
                    );

                await interaction.followUp({
                    embeds: [searchEmbed],
                    ephemeral: true,
                });
                return;
            }

            // Main Help Embed
            const mainEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🎮 Interactive Help Menu')
                .setDescription(
                    '> Welcome to the interactive help menu! Select a category below to get started!',
                )
                .addFields(
                    {
                        name: '📚 Guide',
                        value: 'Get started with our comprehensive setup guide',
                        inline: true,
                    },
                    {
                        name: '❓ FAQ',
                        value: 'Answers to common questions',
                        inline: true,
                    },
                    {
                        name: '🤖 Commands',
                        value: 'All available bot commands',
                        inline: true,
                    }
                )
                .setThumbnail(
                    interaction.client.user.displayAvatarURL({
                        dynamic: true,
                        size: 256,
                    }),
                )
                .setTimestamp()
                .setFooter({
                    text: 'Use the buttons below to navigate',
                    iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                    }),
                });

            // Main Button Row
            const mainRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('guide')
                    .setLabel('Guide')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📚'),
                new ButtonBuilder()
                    .setCustomId('faq')
                    .setLabel('FAQ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❓'),
                new ButtonBuilder()
                    .setCustomId('commands')
                    .setLabel('Commands')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/y3GvzeZVJ3')
                    .setEmoji('🔗'),
            );

            await interaction.reply({
                embeds: [mainEmbed],
                components: [mainRow],
                ephemeral: true,
            });

            let currentPage = 0;
            const ITEMS_PER_PAGE = 5;
            const pages = [];

            // Categorize commands
            const commandCategories = new Map();
            commands.forEach((cmd) => {
                const category = cmd.category || 'Uncategorized';
                if (!commandCategories.has(category)) {
                    commandCategories.set(category, []);
                }
                commandCategories.get(category).push(cmd);
            });

            // Create pages
            for (const [category, cmds] of commandCategories) {
                for (let i = 0; i < cmds.length; i += ITEMS_PER_PAGE) {
                    const pageCommands = cmds.slice(i, i + ITEMS_PER_PAGE);
                    const embed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setTitle(`🤖 ${category} Commands`)
                        .setDescription(
                            '> Here are the available commands in this category:',
                        )
                        .addFields(
                            pageCommands.map((cmd) => ({
                                name: `/${cmd.data.name}`,
                                value: `**Description:** ${cmd.data.description || 'No description'}\n**Usage:** ${cmd.usage || 'No usage info'}`,
                                inline: false,
                            })),
                        )
                        .setThumbnail(
                            interaction.client.user.displayAvatarURL({
                                dynamic: true,
                                size: 256,
                            }),
                        )
                        .setFooter({
                            text: `Page ${pages.length + 1}`,
                            iconURL: interaction.user.displayAvatarURL({
                                dynamic: true,
                            }),
                        });
                    pages.push(embed);
                }
            }

            // Function to get navigation buttons
            const getNavigationRow = () =>
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⬅️')
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('↩️'),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('➡️')
                        .setDisabled(currentPage === pages.length - 1),
                );

            // Collector for button interactions
            const collector =
                interaction.channel.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 300000,
                });

            collector.on('collect', async (i) => {
                try {
                    if (i.customId === 'guide') {
                        const guideEmbed = new EmbedBuilder()
                            .setColor('#2F3136')
                            .setTitle('📚 Setup Guide')
                            .setDescription(
                                '> Follow these steps to get started:',
                            )
                            .addFields(
                                {
                                    name: '1️⃣ Invite the Bot',
                                    value: 'Ensure the bot has joined your server.',
                                    inline: false,
                                },
                                {
                                    name: '2️⃣ Configure Permissions',
                                    value: 'Set up necessary bot permissions.',
                                    inline: false,
                                },
                                {
                                    name: '3️⃣ Explore Commands',
                                    value: 'Use `/help` to view all commands.',
                                    inline: false,
                                },
                                {
                                    name: '4️⃣ Get Support',
                                    value: 'Join our support server if you need help.',
                                    inline: false,
                                },
                            )
                            .setThumbnail(
                                interaction.client.user.displayAvatarURL({
                                    dynamic: true,
                                    size: 256,
                                }),
                            )
                            .setFooter({
                                text: 'Click the back button to return to the main menu',
                                iconURL: interaction.user.displayAvatarURL({
                                    dynamic: true,
                                }),
                            });

                        const backRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel('Back')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('↩️'),
                        );

                        await i.update({
                            embeds: [guideEmbed],
                            components: [backRow],
                        });
                    } else if (i.customId === 'faq') {
                        const faqEmbed = new EmbedBuilder()
                            .setColor('#2F3136')
                            .setTitle('❓ Frequently Asked Questions')
                            .setDescription('> Common questions and answers:')
                            .addFields(
                                {
                                    name: 'How do I invite the bot?',
                                    value: 'Use the invite link provided.',
                                    inline: false,
                                },
                                {
                                    name: 'Bot not responding?',
                                    value: 'Check permissions and command syntax.',
                                    inline: false,
                                },
                            )
                            .setThumbnail(
                                interaction.client.user.displayAvatarURL({
                                    dynamic: true,
                                    size: 256,
                                }),
                            )
                            .setFooter({
                                text: 'Click the back button to return to the main menu',
                                iconURL: interaction.user.displayAvatarURL({
                                    dynamic: true,
                                }),
                            });

                        const backRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel('Back')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('↩️'),
                        );

                        await i.update({
                            embeds: [faqEmbed],
                            components: [backRow],
                        });
                    } else if (i.customId === 'commands' && pages.length > 0) {
                        const navigationRow = getNavigationRow();
                        await i.update({
                            embeds: [pages[currentPage]],
                            components: [navigationRow],
                        });
                    } else if (
                        i.customId === 'next' &&
                        currentPage < pages.length - 1
                    ) {
                        currentPage++;
                        const navigationRow = getNavigationRow();
                        await i.update({
                            embeds: [pages[currentPage]],
                            components: [navigationRow],
                        });
                    } else if (i.customId === 'prev' && currentPage > 0) {
                        currentPage--;
                        const navigationRow = getNavigationRow();
                        await i.update({
                            embeds: [pages[currentPage]],
                            components: [navigationRow],
                        });
                    } else if (i.customId === 'back') {
                        await i.update({
                            embeds: [mainEmbed],
                            components: [mainRow],
                        });
                    }
                } catch (error) {
                    console.error('Error handling button interaction:', error);
                    await handleError(i, error);
                }
            });

            collector.on('end', async () => {
                await interaction.editReply({
                    components: [],
                    content:
                        '> ⏰ This help menu has expired. Please use `/help` again.',
                });
            });
        } catch (error) {
            console.error('Error executing help command:', error);
            await handleError(interaction, error);
        }
    },
};
