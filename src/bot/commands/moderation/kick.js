const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const moderationLogs = require('./../../../database/moderationLogs');
const { handleError } = require('../../utils/errorHandler');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full: 'Kicks a member from the server with the specified reason.',
	usage: '/kick target:@user [reason:"kick reason"]',
	examples: ['/kick target:@user123', '/kick target:@user123 reason:"Violating server rules"'],
	category: 'moderation',
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a user from the server')
		.addUserOption(option =>
			option.setName('target').setDescription('The user to kick').setRequired(true),
		)
		.addStringOption(option =>
			option.setName('reason').setDescription('The reason for kicking').setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		try {
			const targetUser = interaction.options.getMember('target');
			const reason = interaction.options.getString('reason');

			// Validate target user
			if (!targetUser) {
				await handleError(
					interaction,
					new Error('Could not find the specified user in this server.'),
					'VALIDATION',
				);
				return;
			}

			// Check if user is kickable
			if (!targetUser.kickable) {
				await handleError(
					interaction,
					new Error('I do not have permission to kick this user.'),
					'PERMISSION',
				);
				return;
			}

			// Check if target is server owner
			if (targetUser.id === interaction.guild.ownerId) {
				await handleError(
					interaction,
					new Error('You cannot kick the owner of the server.'),
					'PERMISSION',
				);
				return;
			}

			// Check role hierarchy
			const targetUserRolePosition = targetUser.roles.highest.position;
			const botRolePosition = interaction.guild.members.me.roles.highest.position;
			const moderatorRolePosition = interaction.member.roles.highest.position;

			if (targetUserRolePosition >= moderatorRolePosition) {
				await handleError(
					interaction,
					new Error('You cannot kick someone with a higher or equal role than yourself.'),
					'PERMISSION',
				);
				return;
			}

			if (targetUserRolePosition >= botRolePosition) {
				await handleError(
					interaction,
					new Error('I cannot kick someone with a higher or equal role than myself.'),
					'PERMISSION',
				);
				return;
			}

			// Create moderation log entry
			const logEntry = new moderationLogs({
				action: 'kick',
				moderator: interaction.user.id,
				user: targetUser.id,
				reason: reason,
			});

			// Try to DM the user before kicking
			try {
				const dmEmbed = new EmbedBuilder()
					.setTitle(`Kicked from ${interaction.guild.name}`)
					.setDescription(`You have been kicked for: \`${reason}\``)
					.setColor('Orange')
					.setTimestamp();

				await targetUser.send({ embeds: [dmEmbed] });
			} catch (dmError) {
				// If DM fails, log it but don't treat it as a command failure
				await handleError(
					interaction,
					dmError,
					'COMMAND_EXECUTION',
					'Could not send kick notification DM to user (they may have DMs disabled).',
					false, // Don't show this error to the user
				);
			}

			// Save log and kick user
			await Promise.all([logEntry.save(), targetUser.kick(reason)]);

			// Send success message
			const successEmbed = new EmbedBuilder()
				.setTitle('User Kicked')
				.setDescription(`Successfully kicked ${targetUser} for reason: \`${reason}\``)
				.setColor('Orange')
				.setFooter({
					text: `Kicked by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTimestamp();

			await interaction.reply({ embeds: [successEmbed] });
		} catch (error) {
			// Handle different types of errors
			if (error.code === 50013) {
				await handleError(
					interaction,
					error,
					'PERMISSION',
					'I do not have the required permissions to kick this user.',
				);
			} else if (error.code === 'DATABASE_ERROR') {
				await handleError(interaction, error, 'DATABASE', 'Failed to save moderation log.');
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An error occurred while trying to kick the user.',
				);
			}
		}
	},
};
