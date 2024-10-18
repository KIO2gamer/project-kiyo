const { SlashCommandBuilder } = require('discord.js');
const CustomCommand = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_add')
        .setDescription('Adds a custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The main name of the command')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('message')
                .setDescription('The response message of the command')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('alias_name')
                .setDescription('The alternate name of the command')
                .setRequired(false),
        ),
    category: 'customs',
    description_full: "Adds a custom command to the bot's database.",
    usage: '/custom_add <name:command_name> <message:response_message> [alias_name:alternate_name]',
    examples: [
        '/custom_add name:hello message:Hello!',
        '/custom_add name:hello message:Hi! alias_name:hey',
    ],
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const message = interaction.options.getString('message');
        const alias_name = interaction.options.getString('alias_name');

        try {
            const customCommand = new CustomCommand({
                name,
                message,
                ...(alias_name && { alias_name }),
            });

            await customCommand.save();

            await interaction.reply({
                content: `Custom command "${name}" added successfully!`,
                ephemeral: true,
            });
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
