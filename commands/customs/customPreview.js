const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_preview')
        .setDescription('Previews a custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription(
                    'The name or alias of the custom command to preview',
                )
                .setRequired(true),
        ),
    category: 'customs',
    description_full: "Previews a custom command stored in the bot's database.",
    usage: '/custom_preview <name_or_alias>',
    examples: ['/custom_preview hello'],
    async execute(interaction) {
        try {
            const commandNameOrAlias = interaction.options.getString('name');
            let customCommand = await cc.findOne({ name: commandNameOrAlias });

            if (!customCommand) {
                customCommand = await cc.findOne({
                    alias_name: commandNameOrAlias,
                });
            }

            if (!customCommand) {
                await interaction.editReply({
                    content: `Custom command or alias "${commandNameOrAlias}" not found.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Custom Command: ${customCommand.name}`)
                .addFields(
                    { name: 'Content', value: customCommand.message },
                    {
                        name: 'Aliases',
                        value: customCommand.alias_name || 'None',
                    },
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed],
                ephemeral: true,
            });
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
