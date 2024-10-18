const { SlashCommandBuilder } = require('discord.js');
const cc = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_list')
        .setDescription('Lists all custom commands'),
    category: 'customs',
    description_full: "Lists all custom commands stored in the bot's database.",
    usage: '/custom_list',
    examples: ['/custom_list'],
    async execute(interaction) {
        try {
            const customCommands = await cc.find({});

            if (customCommands.length === 0) {
                await interaction.editReply({
                    content: 'There are no custom commands.',
                    ephemeral: true,
                });
                return;
            }

            const commandList = customCommands
                .map((cmd) => {
                    const aliases = cmd.aliases
                        ? ` (aliases: ${cmd.aliases.join(', ')})`
                        : '';
                    return `- ${cmd.name}${aliases}: ${cmd.message}`;
                })
                .join('\n');

            await interaction.editReply({
                content: `## Custom Commands:\n${commandList}`,
                ephemeral: true,
            });
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
