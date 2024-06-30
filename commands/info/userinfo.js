const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const badgeEmojis = {
	DISCORD_EMPLOYEE: '👨‍💼',
	PARTNERED_SERVER_OWNER: '🤝',
	HYPESQUAD_EVENTS: '🎉',
	BUGHUNTER_LEVEL_1: '🐛',
	HOUSE_BRAVERY: '🦁',
	HOUSE_BRILLIANCE: '🧠',
	HOUSE_BALANCE: '⚖️',
	EARLY_SUPPORTER: '💖',
	BUGHUNTER_LEVEL_2: '🐞',
	VERIFIED_BOT: '🤖',
	EARLY_VERIFIED_BOT_DEVELOPER: '👨‍💻',
	DISCORD_CERTIFIED_MODERATOR: '🛡️',
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Get info about a user')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The user to get info about')
		),
	category: 'info',
	async execute(interaction) {
		const user = interaction.options.getUser('target') || interaction.user;
		let guildUser;

		try {
			guildUser = await interaction.guild.members.fetch(user.id);
		} catch (error) {
			return interaction.reply({
				content: 'User not found in this server.',
				ephemeral: true,
			});
		}

		const roles = guildUser.roles.cache
			.filter(role => role.id !== interaction.guild.id)
			.map(role => role.toString())
			.join(' | ');

		const presence = guildUser.presence
			? guildUser.presence.status
			: 'offline';
		const userFlags = guildUser.user.flags.toArray();

		const badges = userFlags
			.map(
				flag =>
					badgeEmojis[flag] || flag.replace(/_/g, ' ').toLowerCase()
			)
			.join(' ');

		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s Information`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{
					name: 'Username:',
					value: `\`${user.username}\``,
					inline: true,
				},
				{ name: 'ID:', value: `\`${user.id}\``, inline: true },
				{ name: 'Presence:', value: `\`${presence}\``, inline: true },
				{
					name: 'Bot:',
					value: `\`${user.bot ? 'Yes' : 'No'}\``,
					inline: true,
				},
				{
					name: 'System:',
					value: `\`${user.system ? 'Yes' : 'No'}\``,
					inline: true,
				},
				{
					name: 'Flags:',
					value: `\`${userFlags.length ? userFlags.map(flag => flag.replace(/_/g, ' ')).join(', ') : 'None'}\``,
					inline: true,
				},
				{ name: 'Roles:', value: `${roles || 'None'}` },
				{
					name: 'Joined Server:',
					value: `<t:${parseInt(guildUser.joinedTimestamp / 1000)}:R>`,
					inline: true,
				},
				{
					name: 'Account Created:',
					value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>`,
					inline: true,
				}
			)
			.setColor('Random')
			.setTimestamp()
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
			});

		if (badges) {
			embed.addFields({ name: 'Badges:', value: badges, inline: true });
		}

		if (guildUser.premiumSince) {
			embed.addFields({
				name: 'Boosting Since:',
				value: `<t:${parseInt(guildUser.premiumSinceTimestamp / 1000)}:R>`,
				inline: true,
			});
		}

		embed.addFields(
			{
				name: 'Status:',
				value: `${guildUser.presence ? guildUser.presence.status : 'offline'}`,
				inline: true,
			},
			{
				name: 'Activities:',
				value: `${guildUser.presence ? guildUser.presence.activities.map(activity => activity.name).join(', ') : 'None'}`,
				inline: true,
			}
		);

		await interaction.reply({ embeds: [embed] });
	},
};
