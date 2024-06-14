const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unlock')
		.setDescription('Unlock a channel')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel you want to unlock')
				.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
				.setRequired(false)
		),
		category: 'moderation',
	async execute(interaction) {
			const channel = interaction.options.getChannel('channel') || interaction.channel
			await interaction.deferReply({ ephemeral: true })

			const embed = new EmbedBuilder().setTitle(`${channel} has been unlocked`).setColor('Green').setFooter({
				text: `Done by: ${interaction.user.username}`,
				iconURL: `${interaction.user.avatarURL()}`,
			})

			const errorEmbed = new EmbedBuilder().setTitle(`ERROR`).setColor('Green').setDescription(`${channel} is already unlocked`)

			
			if (!channel.permissionOverwrites.cache.get(interaction.guild.id).deny.has(PermissionFlagsBits.SendMessages)) {
				await interaction.editReply({
					embeds: [errorEmbed],
				})
				return
			}

			channel.permissionOverwrites.create(interaction.guild.id, {
				SendMessages: true,
			})

			if (channel === interaction.channel) {
				await interaction.editReply({
					embeds: [embed],
				})
			}
			else {
				await interaction.editReply({ content: '**Unlocked Successfully**' })
				await channel.send({
					embeds: [embed],
				})
			}
	},
}