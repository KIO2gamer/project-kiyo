const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require('discord.js');

module.exports = {
    usage: ,
    examples: ,
	data: new SlashCommandBuilder()
		.setName('lock')
		.setDescription('Lock a channel')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel you want to lock')
				.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
				.setRequired(false)
		),

	async execute(interaction) {
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		await interaction.deferReply({ ephemeral: true });

		// Check if the bot has the required permissions
		if (
			!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageChannels)
		) {
			const noPermissionEmbed = new EmbedBuilder()
				.setTitle('ERROR')
				.setColor('Red')
				.setDescription('I do not have the required permissions to lock the channel.');
			await interaction.editReply({ embeds: [noPermissionEmbed] });
			return;
		}

		// Check if the channel is already locked
		if (
			channel.permissionOverwrites.cache
				.get(interaction.guild.id)
				?.deny.has(PermissionFlagsBits.SendMessages)
		) {
			const alreadyLockedEmbed = new EmbedBuilder()
				.setTitle('ERROR')
				.setColor('Red')
				.setDescription(`${channel} is already locked.`);
			await interaction.editReply({ embeds: [alreadyLockedEmbed] });
			return;
		}

		try {
			// Lock the channel
			await channel.permissionOverwrites.create(interaction.guild.id, {
				SendMessages: false,
			});

			const lockEmbed = new EmbedBuilder()
				.setTitle(`${channel.name} has been locked`)
				.setColor('Red')
				.setFooter({
					text: `Done by: ${interaction.user.username}`,
					iconURL: `${interaction.user.avatarURL()}`,
				})
				.setTimestamp();

			if (channel === interaction.channel) {
				await interaction.editReply({
					embeds: [lockEmbed],
				});
			} else {
				await interaction.editReply({
					content: '**Locked Successfully**',
				});
				await channel.send({
					embeds: [lockEmbed],
				});
			}
		} catch (error) {
			const errorEmbed = new EmbedBuilder()
				.setTitle('ERROR')
				.setColor('Red')
				.setDescription(
					`An error occurred while trying to lock the channel: ${error.message}`
				);
			await interaction.editReply({ embeds: [errorEmbed] });
		}
	},
};
