const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');

module.exports = {
	description_full: 'Sends a message with a button to a specified channel. Users can click the button to open a new ticket. Requires the "Manage Channels" permission.', 
	usage: '/setup_ticket <channel:channel>',
	examples: ['/setup_ticket channel:#support'],
	data: new SlashCommandBuilder()
		.setName('setup_ticket')
		.setDescription('Sends the ticket opening message to a channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) // Require Manage Channels permission
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to send the setup message to.')
				.setRequired(true)
		),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		// Create a button for users to open tickets
		const ticketButton = new ButtonBuilder()
			.setCustomId('open-ticket')
			.setLabel('Open Ticket')
			.setStyle(ButtonStyle.Primary);

		// Create an action row to hold the button
		const ticketRow = new ActionRowBuilder().addComponents(ticketButton);

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Open a Ticket')
			.setDescription('Click the button below to open a new ticket.');

		try {
			await interaction.deferReply({ ephemeral: true });
			await channel.send({ embeds: [embed], components: [ticketRow] });
			await interaction.followUp({ content: 'Ticket setup message sent!', ephemeral: true });
		} catch (error) {
			console.error('Error sending ticket setup message:', error);
			interaction.reply({
				content: 'There was an error setting up the ticket system.',
				ephemeral: true,
			});
		}
	},
};
