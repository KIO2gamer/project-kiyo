const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all commands or info about a specific command')
        .addStringOption(option =>
            option
                .setName('category')
                .setRequired(false)
                .setDescription('What command category do you want to view?')
                .addChoices(
                    { name: 'Fun', value: 'fun' },
                    { name: 'Info', value: 'info' },
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Utility', value: 'utility' },
                ),
        )
        .addStringOption(option =>
            option
                .setName('search')
                .setRequired(false)
                .setDescription('Search for a command by name or description'),
        ),
    category: 'info',
    async execute(interaction) {
        await interaction.deferReply(); // Immediately acknowledge the interaction

        const { client, guild } = interaction;
        const category = interaction.options.getString('category');
        const searchQuery = interaction.options.getString('search')?.toLowerCase();

        // Fetching guild commands
        const guildCommands = await guild.commands.fetch();

        const categories = {
            fun: [],
            info: [],
            moderation: [],
            utility: [],
        };

        guildCommands.forEach(command => {
            const commandData = client.commands.get(command.name);
            if (commandData && categories[commandData.category]) {
                categories[commandData.category].push({
                    id: command.id,
                    name: command.name,
                    description: command.description,
                });
            }
        });

        const buildCommandFields = (commands) => {
            const chunks = [];
            let currentChunk = [];

            commands.forEach((cmd) => {
                const cmdStr = `</${cmd.name}:${cmd.id}> - ${cmd.description}`;
                if (currentChunk.join("\n").length + cmdStr.length > 1024) {
                    chunks.push(currentChunk.join("\n"));
                    currentChunk = [];
                }
                currentChunk.push(cmdStr);
            });

            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join("\n"));
            }

            return chunks;
        };

        const cmdListEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📜 Command List')
            .setDescription(
                '`/help [category] - View commands in a specific category`\n`/help [search] - Search commands from all categories`\n`/help [category] [search] - Search commands from a specific category`',
            )
            .setAuthor({
                name: 'Kiyo Bot HelpDesk',
                iconURL: interaction.client.user.avatarURL(),
            })
            .setThumbnail(interaction.client.user.avatarURL());

        buildCommandFields(categories.fun).forEach((chunk, index) => {
            cmdListEmbed.addFields({ name: index === 0 ? '🎉 Fun' : '\u200B', value: chunk });
        });

        buildCommandFields(categories.info).forEach((chunk, index) => {
            cmdListEmbed.addFields({ name: index === 0 ? '📖 Info' : '\u200B', value: chunk });
        });

        buildCommandFields(categories.moderation).forEach((chunk, index) => {
            cmdListEmbed.addFields({ name: index === 0 ? '🛡️ Moderation' : '\u200B', value: chunk });
        });

        buildCommandFields(categories.utility).forEach((chunk, index) => {
            cmdListEmbed.addFields({ name: index === 0 ? '🛠️ Utility' : '\u200B', value: chunk });
        });

        cmdListEmbed.setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }).setTimestamp();

        if (searchQuery) {
            const searchResults = [];
            if (category) {
                categories[category].forEach(cmd => {
                    if (cmd.name.toLowerCase().includes(searchQuery) || cmd.description.toLowerCase().includes(searchQuery)) {
                        searchResults.push(cmd);
                    }
                });
            } else {
                for (const key in categories) {
                    categories[key].forEach(cmd => {
                        if (cmd.name.toLowerCase().includes(searchQuery) || cmd.description.toLowerCase().includes(searchQuery)) {
                            searchResults.push(cmd);
                        }
                    });
                }
            }

            const searchEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle(`🔍 Search Results: ${searchQuery}`)
                .setDescription(searchResults.map(cmd => `</${cmd.name}:${cmd.id}> - ${cmd.description}`).join('\n') || 'No commands found')
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            return await interaction.editReply({ embeds: [searchEmbed] });
        }

        if (!category) {
            const mainMenuEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setDescription(
                    '`/help [category] - View commands in a specific category`\n`/help [search] - Search commands from all categories`\n`/help [category] [search] - Search commands from a specific category`',
                )
                .setAuthor({
                    name: 'Kiyo Bot HelpDesk',
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setThumbnail(interaction.client.user.avatarURL())
                .addFields([
                    {
                        name: '📂 Categories',
                        value: Object.keys(categories).map(key => `> **${key.charAt(0).toUpperCase() + key.slice(1)}**\n> Commands for ${key}.\n`).join('\n'),
                    },
                ])
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            const cmdListButton = new ButtonBuilder()
                .setLabel('📜 Command List')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('cmdList');

            const mainMenuBtn = new ButtonBuilder()
                .setLabel('🏠 Home')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('home');

            const rowWithCmdBtn = new ActionRowBuilder().addComponents(cmdListButton);
            const rowWithHomeBtn = new ActionRowBuilder().addComponents(mainMenuBtn);

            const reply = await interaction.editReply({
                embeds: [mainMenuEmbed],
                components: [rowWithCmdBtn],
            });

            const collector = reply.createMessageComponentCollector({
                time: 60_000 * 5,
            });

            collector.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === 'cmdList') {
                        await i.update({
                            embeds: [cmdListEmbed],
                            components: [rowWithHomeBtn],
                        });
                    }
                    if (i.customId === 'home') {
                        await i.update({
                            embeds: [mainMenuEmbed],
                            components: [rowWithCmdBtn],
                        });
                    }
                } else {
                    await i.reply({
                        content: 'You should run the command to use this interaction.',
                        ephemeral: true,
                    });
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await reply.edit({ components: [] });
                }
            });

            return;
        }

        if (Object.keys(categories).includes(category)) {
            const commands = categories[category];
            const embedDescription = commands.map(cmd => `</${cmd.name}:${cmd.id}> - ${cmd.description}`).join('\n') || 'No commands available';

            const categoryEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
                .setDescription(embedDescription)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            return await interaction.editReply({ embeds: [categoryEmbed] });
        } else {
            await interaction.editReply({
                content: 'Invalid category.',
                ephemeral: true,
            });
        }
    },
};
