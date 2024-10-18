const { SlashCommandBuilder } = require('discord.js');
const cc = require('./../../bot_utils/customCommands');
const { handleError } = require('./../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_edit')
        .setDescription('Edits an existing custom command')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The name or alias of the command to edit')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('new_message')
                .setDescription('The new response message for the command')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('new_alias')
                .setDescription('A new alias for the command (optional)')
                .setRequired(false),
        ),
    category: 'customs',
    description_full: "Edits an existing custom command in the bot's database.",
    usage: '/custom_edit <name:command_name_or_alias> <new_message:updated_response> [new_alias:new_alternate_name]',
    examples: [
        '/custom_edit name:hello new_message:Hello, world!',
        '/custom_edit name:greet new_message:Welcome! new_alias:welcome',
    ],
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const newMessage = interaction.options.getString('new_message');
        const newAlias = interaction.options.getString('new_alias');

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
                ? `The name you provided is an alias. The main command name is "${cc_record.name}". Do you want to edit this command?`
                : `Are you sure you want to edit the custom command "${name}"?`;

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
                                custom_id: 'edit_confirm',
                            },
                            {
                                type: 2,
                                style: 4,
                                label: 'No',
                                custom_id: 'edit_cancel',
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
                    content: 'Command edit timed out.',
                    components: [],
                });
                return;
            }

            if (confirmation.customId === 'edit_confirm') {
                cc_record.message = newMessage;
                if (newAlias) {
                    if (!cc_record.aliases) {
                        cc_record.aliases = [];
                    }
                    cc_record.aliases.push(newAlias);
                }
                await cc_record.save();
                await interaction.editReply({
                    content: `Custom command "${cc_record.name}" edited successfully!`,
                    components: [],
                });
            } else {
                await interaction.editReply({
                    content: 'Command edit cancelled.',
                    components: [],
                });
            }
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
