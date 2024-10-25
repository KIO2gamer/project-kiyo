const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows help menu with guides and commands'),
    description_full:
        'Shows an interactive help menu with guides, commands, FAQs and important links. Navigate through different sections using the buttons provided.',
    usage: '/help',
    examples: ['/help'],
    category: 'info',

    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎮 Interactive Help Menu')
            .setDescription(
                '> Welcome to the interactive help menu! Select a category below to get started!'
            )
            .addFields(
                {
                    name: '📚 Guide',
                    value: ' started with our comprehensive setup guide',
                    inline: true,
                },
                {
                    name: '❓ FAQ',
                    value: ' answers to common questions',
                    inline: true,
                },
                {
                    name: '🤖 Commands',
                    value: ' all available bot commands',
                    inline: true,
                },
                {
                    name: '🔗 Links',
                    value: ' important resources',
                    inline: true,
                }
            )
            .setThumbnail(
                interaction.client.user.displayAvatarURL({
                    dynamic: true,
                    size: 256,
                })
            )
            .setTimestamp()
            .setFooter({
                text: 'Use the buttons below to navigate',
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

        const row = new ActionRowBuilder().addComponents(
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
                .setLabel('Links')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/support')
                .setEmoji('🔗')
        );

        await interaction.editReply({
            embeds: [helpEmbed],
            components: [row],
            ephemeral: true,
        });

        let activeCollector = true;
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 300000,
        });

        collector.on('collect', async (i) => {
            collector.resetTimer();
            if (i.customId === 'guide') {
                const guideEmbed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle('📚 Setup Guide')
                    .setDescription(
                        '> Welcome to the comprehensive setup guide! Follow these steps to get started:'
                    )
                    .addFields(
                        {
                            name: '🔹 1. Initial Setup',
                            value: '\n+ Invite the bot using the official invite link\n+ Ensure it joins your server successfully',
                            inline: false,
                        },
                        {
                            name: '🔹 2. Configure Permissions',
                            value: '\n+ Check bot role permissions\n+ Verify channel access permissions',
                            inline: false,
                        },
                        {
                            name: '🔹 3. Explore Commands',
                            value: '\n+ Use /help command\n+ Click on Commands button to view all features',
                            inline: false,
                        },
                        {
                            name: '🔹 4. Get Support',
                            value: '\n+ Join our support server\n+ Create a ticket if you need assistance',
                            inline: false,
                        }
                    )
                    .setThumbnail(
                        interaction.client.user.displayAvatarURL({
                            dynamic: true,
                            size: 256,
                        })
                    )
                    .setTimestamp()
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
                        .setEmoji('↩️')
                );

                await i.update({
                    embeds: [guideEmbed],
                    components: [backRow],
                });
            }

            if (i.customId === 'faq') {
                const faqEmbed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setTitle('❓ Frequently Asked Questions')
                    .setDescription(
                        '> Here are the most common questions and their detailed answers:'
                    )
                    .addFields(
                        {
                            name: '🔸 How do I invite the bot?',
                            value: ' can invite the bot through our official invite link available in the support server. Make sure you have the necessary permissions in your server.',
                            inline: false,
                        },
                        {
                            name: '🔸 Bot not responding?',
                            value: '\n1. Verify bot permissions\n2. Check command syntax (/)\n3. Ensure bot has channel access',
                            inline: false,
                        },
                        {
                            name: '🔸 Reporting Bugs',
                            value: '\n- Join support server\n- Go to #bug-reports\n- Create a detailed ticket',
                            inline: false,
                        },
                        {
                            name: '🔸 Contributing',
                            value: '\n[Ways to Contribute]\nCode = Visit our GitHub\nIdeas = Join support server\nFeedback = Use feedback command',
                            inline: false,
                        },
                        {
                            name: '🔸 Update Schedule',
                            value: '\nMajor Updates: Monthly\nBug Fixes: Weekly\nHotfixes: As needed',
                            inline: false,
                        }
                    )
                    .setThumbnail(
                        interaction.client.user.displayAvatarURL({
                            dynamic: true,
                            size: 256,
                        })
                    )
                    .setTimestamp()
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
                        .setEmoji('↩️')
                );

                await i.update({
                    embeds: [faqEmbed],
                    components: [backRow],
                });
            }

            if (i.customId === 'commands') {
                const commands = interaction.client.commands;
                const categories = new Map();

                commands.forEach((cmd) => {
                    const category = cmd.category || 'Uncategorized';
                    if (!categories.has(category)) {
                        categories.set(category, []);
                    }
                    categories.get(category).push(cmd);
                });

                const pages = [];
                for (const [category, cmds] of categories) {
                    const embed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setTitle(
                            `🤖 ${
                                category.charAt(0).toUpperCase() +
                                category.slice(1)
                            } Commands`
                        )
                        .setDescription(
                            '> Here are all the available commands in this category:'
                        )
                        .addFields(
                            cmds.map((cmd) => ({
                                name: `/${cmd.data.name}`,
                                value: `\`\`\`yaml\nDescription: ${
                                    cmd.data.description || 'No description'
                                }\nUsage: ${
                                    cmd.usage || 'No usage info'
                                }\`\`\``,
                                inline: false,
                            }))
                        )
                        .setThumbnail(
                            interaction.client.user.displayAvatarURL({
                                dynamic: true,
                                size: 256,
                            })
                        )
                        .setTimestamp()
                        .setFooter({
                            text: `Page ${pages.length + 1}/${
                                categories.size
                            } • Use the buttons to navigate`,
                            iconURL: interaction.user.displayAvatarURL({
                                dynamic: true,
                            }),
                        });
                    pages.push(embed);
                }

                let currentPage = 0;

                const pageRow = new ActionRowBuilder().addComponents(
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
                        .setDisabled(currentPage === pages.length - 1)
                );

                await i.update({
                    embeds: [pages[currentPage]],
                    components: [pageRow],
                });

                const pageCollector = i.channel.createMessageComponentCollector(
                    {
                        filter: (interaction) =>
                            interaction.user.id === i.user.id,
                        time: 300000,
                    }
                );

                pageCollector.on('collect', async (interaction) => {
                    pageCollector.resetTimer();
                    if (interaction.customId === 'prev' && currentPage > 0) {
                        currentPage--;
                    } else if (
                        interaction.customId === 'next' &&
                        currentPage < pages.length - 1
                    ) {
                        currentPage++;
                    } else if (interaction.customId === 'back') {
                        pageCollector.stop();
                        await interaction.update({
                            embeds: [helpEmbed],
                            components: [row],
                        });
                        return;
                    }

                    const newRow = new ActionRowBuilder().addComponents(
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
                            .setDisabled(currentPage === pages.length - 1)
                    );

                    await interaction.update({
                        embeds: [pages[currentPage]],
                        components: [newRow],
                    });
                });

                pageCollector.on('end', () => {
                    if (!i.replied && !i.deferred && activeCollector) {
                        i.update({
                            components: [],
                            content:
                                '> ⏰ This commands menu has expired. Please use `/help` again.',
                        });
                    }
                });
            }

            if (i.customId === 'back') {
                await i.update({
                    embeds: [helpEmbed],
                    components: [row],
                });
            }
        });

        collector.on('end', () => {
            activeCollector = false;
            interaction.editReply({
                components: [],
                content:
                    '> ⏰ This help menu has expired. Please use `/help` again.',
            });
        });
    },
};
