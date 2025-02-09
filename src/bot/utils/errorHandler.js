const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Handles and logs errors that occur during command execution.
 *
 * @param {import('discord.js').Interaction} interaction - The Discord interaction object.
 * @param {Error} error - The error that occurred.
 * @param {import('discord.js').Message} [sent] - The initial message sent by the command (optional).
 */
async function handleError(interaction, error, sent) {
	// Add a timestamp for clearer log tracking
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] ❌ Error executing command:\n${error.stack || error.message}`);

	// Create a shortened error message if the full stack is too long
	const shortError = error.stack
		? error.stack.substring(0, 1000) + (error.stack.length > 1000 ? '...' : '')
		: error.message;

	// Build an embed to notify the user about the error
	const errorEmbed = new EmbedBuilder()
		.setTitle('⚠️ An error occurred')
		.setDescription(
			'There was a problem executing the command. Please try again later.\n' +
			'If you need more details, click the button below.'
		)
		.setColor('#5865F2')
		.setTimestamp();

	// Create a button to show the full error trace
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('show_full_error')
			.setLabel('Show Full Error')
			.setStyle(ButtonStyle.Danger)
	);

	try {
		const response = sent
			? await sent.edit({ embeds: [errorEmbed], components: [row] })
			: await (interaction.replied || interaction.deferred
				? interaction.editReply({ embeds: [errorEmbed], components: [row], ephemeral: true })
				: interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true }));

		// Create a collector for the button interaction with a 60-second timeout
		const collector = response.createMessageComponentCollector({ time: 60000 });

		collector.on('collect', async (i) => {
			if (i.customId === 'show_full_error' && i.user.id === interaction.user.id) {
				const fullError = error.stack || error.message;
				const fullErrorEmbed = new EmbedBuilder()
					.setTitle('🔍 Full Error Trace')
					.setDescription(`\`\`\`js\n${fullError}\n\`\`\``)
					.setColor('Red')
					.setTimestamp();

				await i.update({ embeds: [fullErrorEmbed], components: [] });
			}
		});

		collector.on('end', async () => {
			// Disable the button after the collector ends
			await response.edit({ components: [] }).catch(() => { });
		});
	} catch (sendError) {
		console.error(`[${timestamp}] ❌ Failed to send error message:\n${sendError.stack || sendError.message}`);
	}
}

module.exports = {
	handleError,
};