const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');

/**
 * Handles and logs errors that occur during command execution.
 * Can be used like console.error() or with Discord interaction objects.
 *
 * @param {...any} args - Error arguments, with optional Discord interaction object first
 */
async function handleError(...args) {
	// Add a timestamp for clearer log tracking
	const timestamp = new Date().toISOString();

	// Extract parameters based on argument types
	let interaction = null;
	let sent = null;
	let errorMessage = '';

	// Parse arguments to support multiple usage patterns
	for (const arg of args) {
		if (arg?.reply || arg?.editReply) {
			// This looks like a Discord interaction object
			interaction = arg;
		} else if (arg?.edit && !sent) {
			// This looks like a sent message
			sent = arg;
		} else {
			// This is part of the error content
			if (arg instanceof Error) {
				errorMessage += arg.stack || arg.message;
			} else {
				errorMessage += String(arg) + ' ';
			}
		}
	}

	// Log to console (like console.error)
	console.error(`[${timestamp}] ❌ Error: ${errorMessage}`);

	// If no interaction was provided, we're done - just log to console
	if (!interaction) return;

	// Create a shortened error message if the full error is too long
	const shortError =
		errorMessage.substring(0, 1000) +
		(errorMessage.length > 1000 ? '...' : '');

	// Build an embed to notify the user about the error
	const errorEmbed = new EmbedBuilder()
		.setTitle('⚠️ An error occurred')
		.setDescription(
			'There was a problem executing the command. Please try again later.\n' +
			'If you need more details, click the button below.',
		)
		.setColor('#5865F2')
		.setTimestamp();

	// Create a button to show the full error trace
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('show_full_error')
			.setLabel('Show Full Error')
			.setStyle(ButtonStyle.Danger),
	);

	try {
		const response = sent
			? await sent.edit({ embeds: [errorEmbed], components: [row] })
			: await (interaction.replied || interaction.deferred
				? interaction.editReply({
					embeds: [errorEmbed],
					components: [row],
					flags: 64,
				})
				: interaction.reply({
					embeds: [errorEmbed],
					components: [row],
					flags: 64,
				}));

		// Create a collector for the button interaction with a 60-second timeout
		const collector = response.createMessageComponentCollector({
			time: 60000,
		});

		collector.on('collect', async (i) => {
			if (
				i.customId === 'show_full_error' &&
				i.user.id === interaction.user.id
			) {
				const fullErrorEmbed = new EmbedBuilder()
					.setTitle('🔍 Full Error Trace')
					.setDescription(`\`\`\`js\n${errorMessage}\n\`\`\``)
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
		console.error(
			`[${timestamp}] ❌ Failed to send error message:\n${sendError.stack || sendError.message}`,
		);
	}
}

module.exports = {
	handleError,
};
