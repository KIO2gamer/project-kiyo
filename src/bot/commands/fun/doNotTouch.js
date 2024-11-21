const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');

module.exports = {
	description_full:
		'WARNING: This command initiates a critical system override. Proceed with extreme caution. Improper handling may result in irreversible consequences.',
	usage: '/system_override',
	examples: ['/system_override'],
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('system_override')
		.setDescription('CRITICAL: Initiate system override protocol.'),

	async execute(interaction) {
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('abort')
				.setLabel('Abort Override')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId('confirm')
				.setLabel('Confirm Override')
				.setStyle(ButtonStyle.Danger),
		);

		await interaction.editReply({
			content: 'ALERT: Unauthorized system override detected. Your device and account have been flagged for immediate termination. Proceed with caution. /j',
			components: [row],
		});

		const filter = i => i.customId === 'abort' || i.customId === 'confirm';
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 15000,
		});

		collector.on('collect', async i => {
			if (i.customId === 'abort') {
				await i.update({
					content:
						'Override aborted. Security protocols re-engaged. Your system remains intact, but further attempts may result in permanent lockout.',
					components: [],
				});
			}
			else {
				await i.update({
					content:
						'WARNING: System override confirmed. Initiating complete data wipe and hardware deactivation. This process cannot be reversed. /j',
					components: [],
				});
			}
		});

		collector.on('end', collected => {
			if (!collected.size) {
				interaction.editReply({
					content:
						'ALERT: Override timeout detected. Initiating emergency shutdown. All systems will be locked for security audit. /j',
					components: [],
				});
			}
		});
	},
};
