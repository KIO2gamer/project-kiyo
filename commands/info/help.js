const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
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
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName('search')
                .setDescription('Search term to filter commands')
                .setRequired(false),
        ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const search = interaction.options.getString('search');

        if (commandName) {
            const command = interaction.client.commands.get(commandName);
            if (!command) {
                return interaction.editReply(
                    `I couldn't find a command named \`${commandName}\`. Please check the spelling and try again.`,
                );
            }
            const embed = new EmbedBuilder()
                .setTitle(`Command: ${commandName}`)
                .setDescription(
                    command.description_full ||
                        command.data.description ||
                        'No description available for this command.',
                )
                .addFields(
                    {
                        name: 'How to use',
                        value:
                            command.usage || 'Usage information not available.',
                    },
                    ...(command.usage !== command.examples.join('\n')
                        ? [
                              {
                                  name: 'Examples',
                                  value:
                                      command.examples.join('\n') ||
                                      'No examples available for this command.',
                              },
                          ]
                        : []),
                );
            return interaction.editReply({ embeds: [embed] });
        } else if (search) {
            const commands = interaction.client.commands.filter(
                (command) =>
                    command.data.name
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                    command.data.description
                        .toLowerCase()
                        .includes(search.toLowerCase()),
            );
            if (commands.size === 0) {
                return interaction.editReply(
                    `I couldn't find any commands matching \`${search}\`. Try a different search term or use \`/help\` without any options to see all commands.`,
                );
            }
            const embed = new EmbedBuilder()
                .setTitle(`Search Results: "${search}"`)
                .setDescription(
                    `Here are the commands that match your search:\n\n${commands
                        .map(
                            (command) =>
                                `\`${command.data.name}\`: ${command.data.description}`,
                        )
                        .join('\n')}`,
                );
            return interaction.editReply({ embeds: [embed] });
        } else {
            const categories = new Map();
            interaction.client.commands.forEach((command) => {
                if (!categories.has(command.category)) {
                    categories.set(command.category, []);
                }
                categories.get(command.category).push(command);
            });

            const cmds = await interaction.guild.commands.fetch();
            const commandMentions = new Map();

            cmds.forEach((cmd) => {
                commandMentions.set(cmd.name, `</${cmd.name}:${cmd.id}>`);
            });

            const embeds = [];
            categories.forEach((commands, category) => {
                const embed = new EmbedBuilder()
                    .setTitle(
                        `Command List - ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Miscellaneous'}`,
                    )
                    .setDescription(
                        commands
                            .map(
                                (command) =>
                                    `${commandMentions.get(command.data.name) || `/${command.data.name}`}: ${command.data.description}`,
                            )
                            .join('\n'),
                    );
                embeds.push(embed);
            });
            let currentPage = 0;

            const updateButtons = () => {
                const row = new ActionRowBuilder();
                if (currentPage > 0) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary),
                    );
                }
                if (currentPage < embeds.length - 1) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary),
                    );
                }
                return row;
            };

            const response = await interaction.editReply({
                embeds: [embeds[currentPage]],
                components: [updateButtons()],
            });

            const collector = response.createMessageComponentCollector({
                time: 60000,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'previous' && currentPage > 0) {
                    currentPage--;
                } else if (
                    i.customId === 'next' &&
                    currentPage < embeds.length - 1
                ) {
                    currentPage++;
                }
                await i.update({
                    embeds: [embeds[currentPage]],
                    components: [updateButtons()],
                });
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder();
                updateButtons().components.forEach((button) => {
                    disabledRow.addComponents(
                        ButtonBuilder.from(button).setDisabled(true),
                    );
                });
                interaction.editReply({ components: [disabledRow] });
            });
        }
    },
};
