const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require('discord.js');
const moderationLogs = require('./../../../database/moderationLogs');

module.exports = {
	description_full:
		'Kicks a member from the server with the specified reason.',
	usage: '/kick target:@user [reason:"kick reason"]',
	examples: [
		'/kick target:@user123',
		'/kick target:@user123 reason:"Violating server rules"',
	],
	category: 'moderation',
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Select a member and kick them.')
		.addUserOption((option) =>
			option
				.setName('target')
				.setDescription('The member to kick')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName('reason').setDescription('The reason for the kick'),
		)
		.setDefaultMemberPermissions(
			PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers,
		),

	async execute(interaction) {
		const targetUser = interaction.options.getMember('target');
		const reason =
			interaction.options.getString('reason') ?? 'No reason provided';

		if (!targetUser) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('ERROR')
						.setDescription('User not found')
						.setColor('Red')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
			return;
		}

		if (targetUser.id === interaction.guild.ownerId) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('ERROR')
						.setDescription(
							'You cannot kick the owner of the server',
						)
						.setColor('Red')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
			return;
		}
		const targetUserRolePosition = targetUser.roles.highest.position;
		const requestUserRolePosition =
			interaction.member.roles.highest.position;
		const botRolePosition =
			interaction.guild.members.me.roles.highest.position;

		if (targetUserRolePosition >= requestUserRolePosition) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('ERROR')
						.setDescription(
							'You cannot kick someone with a higher or equal role than you',
						)
						.setColor('Red')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
			return;
		}

		if (targetUserRolePosition >= botRolePosition) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('ERROR')
						.setDescription(
							'I cannot kick someone with a higher or equal role than myself',
						)
						.setColor('Red')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
			return;
		}

		try {
			const logEntry = new moderationLogs({
				action: 'kick',
				moderator: interaction.user.id,
				user: targetUser.id,
				reason: reason,
			});

			await logEntry.save();

			await targetUser.kick(reason);
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('KICKED!!!')
						.setDescription(
							`<@${targetUser.id}> has been kicked for reason: \`${reason}\``,
						)
						.setColor('Green')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
		} catch (error) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('ERROR')
						.setDescription(
							error.message ??
								'An error occurred while trying to kick the user',
						)
						.setColor('Red')
						.setFooter({
							text: `Done by: ${interaction.user.username}`,
							iconURL: `${interaction.user.avatarURL()}`,
						}),
				],
			});
		}
	},
};
