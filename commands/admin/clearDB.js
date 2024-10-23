const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleardb')
        .setDescription('⚠️ DANGER: Wipes all database contents. Admin only.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user has the highest admin role
        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.editReply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Initial warning message
        await interaction.editReply({
            content:
                '⚠️ **DANGER**: This will permanently delete ALL data in the database. Are you absolutely sure?\nType `CONFIRM` to proceed.',
            ephemeral: true,
        });

        try {
            // Create message collector for confirmation
            const filter = (m) => m.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({
                filter,
                time: 30000,
                max: 1,
            });

            collector.on('collect', async (message) => {
                if (message.content === 'CONFIRM') {
                    try {
                        // Get all collections
                        const collections =
                            await mongoose.connection.db.collections();

                        // Drop each collection
                        for (let collection of collections) {
                            await collection.drop();
                        }

                        await message.editReply(
                            '✅ Database has been completely wiped.'
                        );
                    } catch (error) {
                        console.error('Database clear error:', error);
                        await message.editReply(
                            '❌ An error occurred while clearing the database.'
                        );
                    }
                } else {
                    await message.editReply('❌ Database wipe cancelled.');
                }
                message.delete().catch(() => {});
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    interaction.followUp({
                        content:
                            '❌ Command timed out. Database wipe cancelled.',
                        ephemeral: true,
                    });
                }
            });
        } catch (error) {
            console.error('Command error:', error);
            await interaction.followUp({
                content: '❌ An error occurred while executing the command.',
                ephemeral: true,
            });
        }
    },
};
