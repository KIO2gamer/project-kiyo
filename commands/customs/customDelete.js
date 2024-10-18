const { SlashCommandBuilder } = require('discord.js');
const cc = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_delete')
        .setDescription('Deletes an existing custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The name or alias of the command to delete')
                .setRequired(true),
        ),
    category: 'customs',
    description_full:
        "Deletes an existing custom command from the bot's database.",
    usage: '/custom_delete <name:command_name_or_alias>',
    examples: ['/custom_delete name:hello', '/custom_delete name:greet'],
    async execute(interaction) {
        const name = interaction.options.getString('name');

        try {
            const cc_record = await cc.findOne({
                $or: [{ name: name }, { aliases: name }],
            });

            if (!cc_record) {
                await interaction.reply({
                    content: `Custom command or alias "${name}" not found!`,
                    ephemeral: true,
                });
                return;
            }

            const isAlias = cc_record.name !== name;
            const confirmMessage = isAlias
                ? `The name you provided is an alias. The main command name is "${cc_record.name}". Do you want to delete this command?`
                : `Are you sure you want to delete the custom command "${name}"?`;

            const confirmationResponse = await interaction.reply({
                content: confirmMessage,
                ephemeral: true,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 3,
                                label: 'Yes',
                                custom_id: 'delete_confirm',
                            },
                            {
                                type: 2,
                                style: 4,
                                label: 'No',
                                custom_id: 'delete_cancel',
                            },
                        ],
                    },
                ],
            });

            const confirmation = await confirmationResponse
                .awaitMessageComponent({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 15000,
                })
                .catch(() => null);

            if (!confirmation) {
                await interaction.editReply({
                    content: 'Command deletion timed out.',
                    components: [],
                });
                return;
            }

            if (confirmation.customId === 'delete_confirm') {
                await cc.deleteOne({ _id: cc_record._id });
                await interaction.editReply({
                    content: `Custom command "${cc_record.name}" deleted successfully!`,
                    components: [],
                });
            } else {
                await interaction.editReply({
                    content: 'Command deletion cancelled.',
                    components: [],
                });
            }
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
