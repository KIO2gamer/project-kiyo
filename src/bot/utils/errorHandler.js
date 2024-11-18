const { EmbedBuilder } = require('discord.js');

/**
 * Handles and logs errors that occur during command execution.
 *
 * @param {import('discord.js').Interaction} interaction - The Discord interaction object.
 * @param {Error} error - The error that occurred.
 * @param {import('discord.js').Message} sent - The initial message sent by the command.
 */
async function handleError(interaction, error) {
    // Simple console error log
    console.error(`❌ Error: ${error.message}`);

    const errorEmbed = new EmbedBuilder()
        .setTitle('An error occurred')
        .setDescription(
            'There was a problem executing the command. Please try again later.'
        )
        .setColor('Red')
        .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed], ephemeral: true }); // Edit the initial message
}

module.exports = {
    handleError,
};
