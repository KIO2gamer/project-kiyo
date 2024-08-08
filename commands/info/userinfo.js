const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionsBitField,
	ActivityType,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays information about a user.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The user to get information about')
				.setRequired(false)
		),

	async execute(interaction) {
		const user = interaction.options.getUser('target') || interaction.user;
		const member = await interaction.guild.members.fetch(user.id);

		// Determine discriminator availability
		let discrim =
			user.discriminator === '0' ? 'Not available for users' : `#${user.discriminator}`;

		// User's presence status
		const presence = member.presence?.status || 'offline';

		// User's highest role
		const highestRole = member.roles.highest;

		// User's account creation date
		const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;

		// User's server join date
		const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;

		// User's permissions in the server
		const permissions =
			member.permissions
				.toArray()
				.map(perm => {
					return PermissionsBitField.resolve(perm) === 0
						? ''
						: perm
								.replace(/_/g, ' ')
								.toLowerCase()
								.replace(/\b\w/g, char => char.toUpperCase());
				})
				.join('\n') || 'No permissions';

		// User's current activity
		const activities = member.presence?.activities || [];
		const activityList = activities.length
			? activities
					.map(activity => {
						let type;
						switch (activity.type) {
							case ActivityType.Playing:
								type = 'Playing';
								break;
							case ActivityType.Streaming:
								type = 'Streaming';
								break;
							case ActivityType.Listening:
								type = 'Listening';
								break;
							case ActivityType.Watching:
								type = 'Watching';
								break;
							case ActivityType.Competing:
								type = 'Competing';
								break;
							default:
								type = 'Unknown';
						}
						return `${type}: ${activity.name}`;
					})
					.join('\n')
			: 'None';

		// Is the user a server booster?
		const isBooster = member.premiumSince
			? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F>`
			: 'No';

		// List of user's devices (Desktop, Mobile, Web)
		const clientStatus = member.presence?.clientStatus
			? Object.keys(member.presence.clientStatus).join(', ')
			: 'Unknown';

		// User's display color (role color)
		const displayColor = highestRole.hexColor !== '#000000' ? highestRole.hexColor : 'Default';

		// User's roles
		const roles = member.roles.cache
			.filter(role => role.id !== interaction.guild.id) // Exclude @everyone role
			.sort((a, b) => b.position - a.position)
			.map(role => role.toString());

		// Construct the embed with the collected information
		const userInfoEmbed = new EmbedBuilder()
			.setTitle(`User Information - ${user.username}`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setColor(displayColor)
			.addFields(
				{ name: 'Username', value: user.username, inline: true },
				{ name: 'Discriminator', value: discrim, inline: true },
				{ name: 'User ID', value: user.id, inline: true },
				{ name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
				{ name: 'Account Created', value: createdAt, inline: true },
				{ name: 'Joined Server', value: joinedAt, inline: true },
				{ name: 'Presence', value: presence, inline: true },
				{ name: 'Highest Role', value: highestRole.toString(), inline: true },
				{ name: 'Roles', value: roles.length > 0 ? roles.join(', ') : 'None' },
				{ name: 'Permissions', value: permissions },
				{ name: 'Current Activity', value: activityList },
				{ name: 'Server Booster Since', value: isBooster, inline: true },
				{ name: 'Client Status', value: clientStatus, inline: true },
				{ name: 'Display Color', value: displayColor, inline: true }
			);

		// Send the embed
		await interaction.reply({ embeds: [userInfoEmbed] });
	},
};
