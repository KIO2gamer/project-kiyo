const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Handles and logs errors that occur during command execution.
 *
 * @param {import('discord.js').Interaction} interaction - The Discord interaction object.
 * @param {Error} error - The error that occurred.
 * @param {import('discord.js').Message} [sent] - The initial message sent by the command (optional).
 */
async function handleError(interaction, error, sent) {
	// Log the full error for debugging
	console.error(`❌ Error executing command:`, error);

	// Truncate long errors to prevent excessive message length
	const errorMessage = error.stack ? error.stack.substring(0, 1000) + '...' : error.message;

	// Create the error embed
	const errorEmbed = new EmbedBuilder()
		.setTitle('⚠️ An error occurred')
		.setDescription('There was a problem executing the command. Please try again later.')
		.setColor('#5865F2') // Consistent color
		.setTimestamp();

	// Create a button to reveal the full traceback
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('show_full_error')
				.setLabel('Show Full Error')
				.setStyle(ButtonStyle.Danger)
		);

	try {
		let response;
		if (sent) {
			response = await sent.edit({ embeds: [errorEmbed], components: [row] });
		} else if (interaction.replied || interaction.deferred) {
			response = await interaction.editReply({ embeds: [errorEmbed], components: [row], ephemeral: true });
		} else {
			response = await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
		}

		// Create button collector
		const collector = response.createMessageComponentCollector({ time: 60000 }); // Button active for 60 seconds

		collector.on('collect', async (i) => {
			if (i.customId === 'show_full_error' && i.user.id === interaction.user.id) {
				const fullErrorEmbed = new EmbedBuilder()
					.setTitle('🔍 Full Error Traceback')
					.setDescription(`\`\`\`js\n${error.stack || error.message}\n\`\`\``)
					.setColor('Red')
					.setTimestamp();

				await i.update({ embeds: [fullErrorEmbed], components: [] });
			}
		});

		collector.on('end', async () => {
			if (response) {
				await response.edit({ components: [] }).catch(() => { });
			}
		});

	} catch (sendError) {
		console.error('❌ Failed to send error message:', sendError);
	}
}

module.exports = {
	handleError,
};
