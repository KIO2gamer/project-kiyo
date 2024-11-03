const { SlashCommandBuilder } = require('discord.js');
const cc = require('../../bot_utils/customCommands');
const { handleError } = require('../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_run')
        .setDescription('Run a custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription(
                    'The name or alias of the custom command to run',
                )
                .setRequired(true),
        ),
    category: 'customs',
    description_full:
        "Runs a specified custom command stored in the bot's database.",
    usage: '/custom_run <name_or_alias>',
    examples: ['/custom_run greet', '/custom_run hello'],
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

            await interaction.editReply({
                content: customCommand.message,
                ephemeral: false,
            });
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
