const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActivityType,
	PermissionsBitField,
} = require('discord.js');

// Get platform-specific emoji for client status
function getStatusEmoji(platform) {
	const emojis = {
		desktop: '🖥️',
		mobile: '📱',
		web: '🌐',
	};
	return emojis[platform] || '❓';
}

// Format user status with color and emoji
function formatStatus(status) {
	const statusFormats = {
		online: '🟢 Online',
		idle: '🟡 Idle',
		dnd: '🔴 Do Not Disturb',
		invisible: '⚫ Invisible',
		offline: '⚫ Offline',
	};
	return statusFormats[status] || '⚫ Offline';
}

// Extract activity name formatter outside execute function for better organization
function getActivityName(activity) {
	if (!activity) return 'Unknown Activity';

	switch (activity.type) {
		case ActivityType.Playing:
			return `🎮 Playing **${activity.name}**${activity.details ? `\n┗ ${activity.details}` : ''}`;
		case ActivityType.Streaming:
			return `🔴 Streaming **${activity.name}**${activity.details ? `\n┗ ${activity.details}` : ''}`;
		case ActivityType.Listening:
			return `🎧 Listening to **${activity.name}**${activity.details ? `\n┗ ${activity.details}` : ''}`;
		case ActivityType.Watching:
			return `👁️ Watching **${activity.name}**${activity.details ? `\n┗ ${activity.details}` : ''}`;
		case ActivityType.Competing:
			return `🏆 Competing in **${activity.name}**${activity.details ? `\n┗ ${activity.details}` : ''}`;
		case ActivityType.Custom:
			return activity.state
				? `${activity.emoji ? activity.emoji + ' ' : ''}${activity.state}`
				: '🏷️ Custom Status';
		default:
			return '❓ Unknown Activity';
	}
}

// Format badges for display
function formatUserBadges(user) {
	// You can use actual emoji as fallback if custom emojis aren't set up
	const fallbackMap = {
		Staff: '👨‍💼',
		Partner: '🤝',
		Hypesquad: '🏠',
		BugHunterLevel1: '🐛',
		BugHunterLevel2: '🐞',
		HypeSquadOnlineHouse1: '⚔️',
		HypeSquadOnlineHouse2: '🧠',
		HypeSquadOnlineHouse3: '⚖️',
		PremiumEarlySupporter: '🏅',
		VerifiedDeveloper: '👨‍💻',
		CertifiedModerator: '🛡️',
		ActiveDeveloper: '⚒️',
	};

	// For simplicity, using fallback map in this example
	const flags = user.flags?.toArray() || [];
	return flags.length
		? flags.map((flag) => fallbackMap[flag] || flag).join(' ')
		: 'None';
}

// Get key permissions in a readable format
function getKeyPermissions(member) {
	const permissionsMap = {
		Administrator: '👑 Administrator',
		ManageGuild: '🏠 Manage Server',
		BanMembers: '🔨 Ban Members',
		KickMembers: '👢 Kick Members',
		ManageChannels: '📁 Manage Channels',
		ManageRoles: '📊 Manage Roles',
		ManageMessages: '📝 Manage Messages',
		MentionEveryone: '📢 Mention Everyone',
		ManageWebhooks: '🔗 Manage Webhooks',
		ManageEmojisAndStickers: '😀 Manage Emojis',
		ManageThreads: '🧵 Manage Threads',
		ModerateMembers: '🛡️ Timeout Members',
	};

	const memberPermissions = member.permissions.toArray();
	const keyPerms = Object.entries(permissionsMap)
		.filter(([perm]) => memberPermissions.includes(perm))
		.map(([, name]) => name);

	return keyPerms.length ? keyPerms.join('\n') : 'None';
}

// Helper function to generate fields for better organization
function generateUserFields(user, member) {
	const presence = member.presence || {};
	const clientStatus = presence.clientStatus || {};

	// Format client status with emojis
	const clientStatusText = Object.keys(clientStatus).length
		? Object.entries(clientStatus)
				.map(
					([platform, status]) =>
						`${getStatusEmoji(platform)} ${platform}: ${status}`,
				)
				.join('\n')
		: 'No devices active';

	return [
		// Section 1: Basic User Info
		{
			name: '👤 Profile',
			value: [
				`**Username:** ${user.tag}`,
				`**Display Name:** ${member.displayName}${member.nickname ? ` (${member.nickname})` : ''}`,
				`**ID:** \`${user.id}\``,
				`**Type:** ${user.bot ? '🤖 Bot' : '👤 Human'}`,
				`**Badges:** ${formatUserBadges(user)}`,
			].join('\n'),
		},

		// Section 2: Dates
		{
			name: '📆 Dates',
			value: [
				`**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
				`**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
				member.premiumSince
					? `**Boosting Since:** <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F> (<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>)`
					: '**Boosting:** No',
			].join('\n'),
		},

		// Section 3: Status
		{
			name: '📊 Status',
			value: [
				`**Status:** ${formatStatus(presence.status || 'offline')}`,
				`**Devices:** ${clientStatusText}`,
				`**Custom Status:** ${presence.activities?.find((a) => a.type === ActivityType.Custom)?.state || 'None'}`,
			].join('\n'),
		},

		// Section 4: Activities (if any)
		...(presence.activities?.filter((a) => a.type !== ActivityType.Custom)
			.length
			? [
					{
						name: '🎯 Activities',
						value: presence.activities
							.filter((a) => a.type !== ActivityType.Custom)
							.map(getActivityName)
							.join('\n\n'),
					},
				]
			: []),

		// Section 5: Key Permissions
		{
			name: '🛠️ Key Permissions',
			value: getKeyPermissions(member),
		},

		// Section 6: Roles
		{
			name: `📋 Roles [${member.roles.cache.size - 1}]`,
			value: getRolesText(member),
		},
	];
}

// Helper function for roles text
function getRolesText(member) {
	if (member.roles.cache.size <= 1) return 'None';

	const roles = member.roles.cache
		.filter((role) => role.id !== member.guild.id)
		.sort((a, b) => b.position - a.position);

	// Check if too many roles to display
	if (roles.size > 15) {
		const topRoles = roles.first(10);
		return (
			topRoles.map((role) => role.toString()).join(', ') +
			`\n*...and ${roles.size - 10} more roles*`
		);
	}

	return roles.map((role) => role.toString()).join(', ') || 'None';
}

module.exports = {
	description_full:
		'Shows detailed information about a user, including their profile, status, activities, roles, permissions and more.',
	usage: '/user_info [target]',
	examples: ['/user_info', '/user_info @user'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('user_info')
		.setDescription('Displays detailed information about a user.')
		.addUserOption((option) =>
			option
				.setName('target')
				.setDescription('The user to get information about')
				.setRequired(false),
		),
	async execute(interaction) {
		try {
			const user =
				interaction.options.getUser('target') || interaction.user;

			// Try to get from cache first, then fetch if needed
			let member = interaction.guild.members.cache.get(user.id);
			if (!member) {
				member = await interaction.guild.members
					.fetch(user.id)
					.catch(() => null);
			}

			// Early return if member is not found (e.g., left the server)
			if (!member) {
				return interaction.reply({
					content: 'That user is not a member of this server.',
					ephemeral: true,
				});
			}

			// Fetch user banner if possible (requires API v9)
			let bannerUrl;
			try {
				const fetchedUser = await interaction.client.users.fetch(
					user.id,
					{ force: true },
				);
				bannerUrl = fetchedUser.bannerURL({
					dynamic: true,
					size: 1024,
				});
			} catch (err) {
				console.log('Unable to fetch banner:', err);
			}

			const userInfoEmbed = new EmbedBuilder()
				.setAuthor({
					name: `${user.tag}${user.bot ? ' [BOT]' : ''}`,
					iconURL: user.displayAvatarURL({ dynamic: true }),
				})
				.setTitle(`User Information`)
				.setThumbnail(
					user.displayAvatarURL({ dynamic: true, size: 512 }),
				)
				.setColor(
					member.displayHexColor !== '#000000'
						? member.displayHexColor
						: '#2F3136',
				)
				.addFields(generateUserFields(user, member))
				.setFooter({
					text: `Requested by ${interaction.user.tag} • ID: ${user.id}`,
					iconURL: interaction.user.displayAvatarURL({
						dynamic: true,
					}),
				})
				.setTimestamp();

			// Add banner if available
			if (bannerUrl) {
				userInfoEmbed.setImage(bannerUrl);
			}

			// Create buttons (mention and avatar URL)
			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setLabel('View Avatar')
					.setStyle(ButtonStyle.Link)
					.setURL(
						user.displayAvatarURL({ dynamic: true, size: 1024 }),
					),
			);

			await interaction.reply({
				embeds: [userInfoEmbed],
				components: [actionRow],
			});
		} catch (error) {
			console.error('Error in user_info command:', error);
			await interaction.reply({
				content: 'An error occurred while fetching user information.',
				ephemeral: true,
			});
		}
	},
};
