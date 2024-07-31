const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channelinfo')
		.setDescription('Provides information about a specific channel')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to get information about')
				.setRequired(true)
		),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		// Map channel type to a readable format
		const channelTypes = {
			[ChannelType.GuildText]: 'Text',
			[ChannelType.GuildVoice]: 'Voice',
			[ChannelType.GuildCategory]: 'Category',
			[ChannelType.GuildAnnouncement]: 'Announcement',
			[ChannelType.GuildStore]: 'Store',
			[ChannelType.GuildStageVoice]: 'Stage Voice',
			[ChannelType.GuildForum]: 'Forum',
		};

		// Get the permissions in a readable format
		const permissions = channel
			.permissionsFor(interaction.guild.roles.everyone)
			.toArray()
			.map(perm => {
				const permName = Object.keys(PermissionsBitField.Flags).find(
					key => PermissionsBitField.Flags[key] === perm
				);
				return permName ? permName.replace(/_/g, ' ').toLowerCase() : perm;
			});

		const embed = new EmbedBuilder().setTitle(`Channel Info: ${channel.name}`).addFields(
			{
				name: 'Channel ID',
				value: channel.id,
				inline: true,
			},
			{
				name: 'Channel Type',
				value: channelTypes[channel.type] || 'Unknown',
				inline: true,
			},
			{
				name: 'Channel Topic',
				value: channel.topic || 'No topic set',
				inline: true,
			},
			{
				name: 'Channel Created At',
				value: channel.createdAt.toDateString(),
				inline: true,
			},
			{
				name: 'Channel Permissions',
				value: permissions.length > 0 ? permissions.join('\n') : 'No permissions',
				inline: false,
			}
		);

		await interaction.reply({ embeds: [embed] });
	},
};
