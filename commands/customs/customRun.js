const { SlashCommandBuilder } = require('discord.js');
const cc = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_run')
        .setDescription('Run a custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The name of the custom command to run')
                .setRequired(true),
        ),
    category: 'customs',
    description_full:
        "Runs a specified custom command stored in the bot's database.",
    usage: '/custom_run <name>',
    examples: ['/custom_run greet'],
    async execute(interaction) {
        try {
            const commandName = interaction.options.getString('name');
            const customCommand = await cc.findOne({ name: commandName });

            if (!customCommand) {
                await interaction.editReply({
                    content: `Custom command "${commandName}" not found.`,
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
