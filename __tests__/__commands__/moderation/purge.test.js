const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');

module.exports = {
    description_full:
        'Deletes a specified number of messages from the channel.',
    usage: '/purge amount:number [user:@user]',
    examples: [
        '/purge amount:5',
        '/purge amount:100',
        '/purge amount:50 user:@JohnDoe',
    ],
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes messages from the current channel.')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('The number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user whose messages to delete (optional)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.editReply({
            content: 'Processing purge command...',
            ephemeral: true,
        });
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        try {
            let messages;
            if (user) {
                messages = await interaction.channel.messages.fetch({
                    limit: 100,
                });
                messages = messages
                    .filter((m) => m.author.id === user.id)
                    .first(amount);
            } else {
                messages = await interaction.channel.messages.fetch({
                    limit: amount,
                });
            }

            if (messages.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('No Messages Found')
                            .setDescription(
                                'There are no messages to delete that match the criteria.'
                            )
                            .setColor('Yellow'),
                    ],
                    ephemeral: true,
                });
            }

            const deletedCount = await interaction.channel.bulkDelete(
                messages,
                true
            );

            const embed = new EmbedBuilder()
                .setTitle('Purge Completed')
                .setDescription(
                    `Successfully deleted ${deletedCount.size} message(s).`
                )
                .setColor('Green')
                .setTimestamp();

            if (user) {
                embed.addFields({ name: 'Target User', value: user.tag });
            }

            await interaction.followUp({ embeds: [embed], ephemeral: true });

            // Log the purge action
            const logChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === 'mod-logs'
            );
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Purge Action')
                    .setDescription(
                        `${interaction.user.tag} purged ${deletedCount.size} message(s) in #${interaction.channel.name}`
                    )
                    .setColor('Blue')
                    .setTimestamp();

                if (user) {
                    logEmbed.addFields({
                        name: 'Target User',
                        value: user.tag,
                    });
                }

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Error purging messages:', error);
            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Purge Failed')
                        .setDescription(
                            'An error occurred while trying to purge messages. Messages older than 14 days cannot be bulk deleted.'
                        )
                        .setColor('Red'),
                ],
                ephemeral: true,
            });
        }
    },
};
