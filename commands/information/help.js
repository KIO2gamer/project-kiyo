const {
    SlashCommandBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandData = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays all commands or info about a specific command')
    .addStringOption(option =>
        option
            .setName('search')
            .setRequired(false)
            .setDescription('Search for a command by name or description')
    );

module.exports = {
    data: commandData,
    category: 'info',
    async execute(interaction) {
        await interaction.deferReply();

        const { client, guild } = interaction;
        const searchQuery = interaction.options.getString('search')?.toLowerCase();

        const guildCommands = await guild.commands.fetch();
        const commandsDirectory = path.join(__dirname, '..');
        const categoryFolders = fs
            .readdirSync(commandsDirectory)
            .filter(dir => fs.statSync(path.join(commandsDirectory, dir)).isDirectory());

        const commandsByCategory = new Map();
        for (const category of categoryFolders) {
            commandsByCategory.set(category, []);

            const commandFiles = fs
                .readdirSync(path.join(commandsDirectory, category))
                .filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsDirectory, category, file);
                const command = require(filePath);
                commandsByCategory.get(category).push({
                    id: guildCommands.find(c => c.name === command.data.name).id,
                    name: command.data.name,
                    description: command.data.description,
                });
            }
        }

        const categoryOptions = Array.from(commandsByCategory.keys()).map(category => ({
            label: category.charAt(0).toUpperCase() + category.slice(1),
            value: category,
        }));

        const createCommandListEmbed = (commands, title, color) => {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setTimestamp();

            const fieldValueMaxLength = 1024;
            let currentFieldValue = '';

            commands.forEach((cmd, index) => {
                const cmdStr = `> \`${index + 1}.\` </${cmd.name}:${
                    cmd.id
                }> - ${cmd.description}\n`;

                if (currentFieldValue.length + cmdStr.length <= fieldValueMaxLength) {
                    currentFieldValue += cmdStr;
                } else {
                    embed.addFields({
                        name: currentFieldValue.length > 0 ? '\u200B' : title,
                        value: currentFieldValue,
                    });
                    currentFieldValue = cmdStr;
                }
            });

            if (currentFieldValue.length > 0) {
                embed.addFields({
                    name: '\u200B',
                    value: currentFieldValue,
                });
            }

            return embed;
        };

        if (searchQuery) {
            const searchResults = [];
            for (const commands of commandsByCategory.values()) {
                commands.forEach(cmd => {
                    if (
                        cmd.name.toLowerCase().includes(searchQuery) ||
                        cmd.description.toLowerCase().includes(searchQuery)
                    ) {
                        searchResults.push(cmd);
                    }
                });
            }

            const searchEmbed = createCommandListEmbed(
                searchResults,
                `🔍 Search Results for "${searchQuery}"`,
                '#f39c12'
            ).setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });
            return await interaction.editReply({ embeds: [searchEmbed] });
        }

        const generateCategoryEmbed = async (selectedCategory = null) => {
            let selected = selectedCategory || categoryFolders[0];

            const commands = commandsByCategory.get(selected) || [];

            // Separate action rows for dropdown and button
            const rowDropdown = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('help-category-select')
                        .setPlaceholder('Choose a category')
                        .addOptions(categoryOptions)
                );
            const rowButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('go-back')
                        .setLabel('Main Menu')
                        .setStyle(ButtonStyle.Secondary)
                );

            if (selectedCategory) {
                const embed = createCommandListEmbed(
                    commands,
                    `Commands: ${selected.charAt(0).toUpperCase() + selected.slice(1)}`,
                    '#e74c3c'
                ).setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
                return await interaction.editReply({ embeds: [embed], components: [rowDropdown, rowButton] });
            } else {
                // Custom Main Menu Embed
                const mainMenuEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('Welcome to Kiyo Bot Help')
                    .setDescription('Use the dropdown below to select a command category. You can also search for a specific command using `/help [search]`!')
                    .setThumbnail(interaction.client.user.avatarURL()) 
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp(); 
                
                return await interaction.editReply({ embeds: [mainMenuEmbed], components: [rowDropdown] });
            }
        };

        const reply = await generateCategoryEmbed();
        const selectMenuCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000 * 5, 
        });

        selectMenuCollector.on('collect', async i => { 
            if (i.user.id !== interaction.user.id) { 
                return await i.reply({
                    content: 'You should run the command to use this interaction.', 
                    ephemeral: true, 
                });
            } 

            const selectedCategory = i.values[0];
            await generateCategoryEmbed(selectedCategory);
            await i.deferUpdate();
        });

        selectMenuCollector.on('end', () => { 
            reply.edit({ components: [] }); 
        });

        // Back Button Collector
        const buttonCollector = reply.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 60_000 * 5,
        }); 

        buttonCollector.on('collect', async i => { 
            if (i.customId === 'go-back') {
                await generateCategoryEmbed();
                await i.deferUpdate();
            }
        }); 

        buttonCollector.on('end', () => {
            reply.edit({ components: [] });
        });
    }, 
}; 