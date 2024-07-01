const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modifychannel')
		.setDescription('Modify a text or voice channel.')
		.addStringOption(option =>
			option
				.setName('channelid')
				.setDescription('The ID of the channel to modify')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('newname')
				.setDescription('The new name for the channel')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('permission')
				.setDescription('Permission to set for the channel')
				.setRequired(true)
				.addChoices(
					{ name: 'View Channel', value: 'VIEW_CHANNEL' },
					{ name: 'Manage Channel', value: 'MANAGE_CHANNELS' },
					{ name: 'Add Reactions', value: 'ADD_REACTIONS' },
					{ name: 'Send Messages', value: 'SEND_MESSAGES' },
					{ name: 'Send TTS Messages', value: 'SEND_TTS_MESSAGES' },
					{ name: 'Manage Messages', value: 'MANAGE_MESSAGES' },
					{ name: 'Embed Links', value: 'EMBED_LINKS' },
					{ name: 'Attach Files', value: 'ATTACH_FILES' },
					{ name: 'Read Message History', value: 'READ_MESSAGE_HISTORY' },
					{ name: 'Mention Everyone', value: 'MENTION_EVERYONE' },
					{ name: 'Use External Emojis', value: 'USE_EXTERNAL_EMOJIS' },
					{ name: 'Connect', value: 'CONNECT' },
					{ name: 'Speak', value: 'SPEAK' },
					{ name: 'Use VAD', value: 'USE_VAD' },
					{ name: 'Manage Webhooks', value: 'MANAGE_WEBHOOKS' },
					{ name: 'Manage Threads', value: 'MANAGE_THREADS' },
					{ name: 'Create Public Threads', value: 'CREATE_PUBLIC_THREADS' },
					{ name: 'Create Private Threads', value: 'CREATE_PRIVATE_THREADS' },
					{ name: 'Use External Stickers', value: 'USE_EXTERNAL_STICKERS' },
					{ name: 'Send Messages In Threads', value: 'SEND_MESSAGES_IN_THREADS' },
					{ name: 'Use Embedded Activities', value: 'USE_EMBEDDED_ACTIVITIES' },
					{ name: 'Send Voice Messages', value: 'SEND_VOICE_MESSAGES' },
					{ name: 'Send Polls', value: 'SEND_POLLS' }
				)
		)
		.addStringOption(option =>
			option
				.setName('toggle')
				.setDescription('Toggle permission on or off')
				.setRequired(true)
				.addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
		)
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('The role to modify permissions for (leave empty for everyone)')
				.setRequired(false)
		),
	category: 'moderation',
	async execute(interaction) {
		const channelId = interaction.options.getString('channelid');
		const newChannelName = interaction.options.getString('newname');
		const permissionChoice = interaction.options.getString('permission');
		const toggleChoice = interaction.options.getString('toggle');
		const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;

		const permissionMap = {
			VIEW_CHANNEL: PermissionsBitField.Flags.ViewChannel,
			MANAGE_CHANNELS: PermissionsBitField.Flags.ManageChannels,
			ADD_REACTIONS: PermissionsBitField.Flags.AddReactions,
			SEND_MESSAGES: PermissionsBitField.Flags.SendMessages,
			SEND_TTS_MESSAGES: PermissionsBitField.Flags.SendTtsMessages,
			MANAGE_MESSAGES: PermissionsBitField.Flags.ManageMessages,
			EMBED_LINKS: PermissionsBitField.Flags.EmbedLinks,
			ATTACH_FILES: PermissionsBitField.Flags.AttachFiles,
			READ_MESSAGE_HISTORY: PermissionsBitField.Flags.ReadMessageHistory,
			MENTION_EVERYONE: PermissionsBitField.Flags.MentionEveryone,
			USE_EXTERNAL_EMOJIS: PermissionsBitField.Flags.UseExternalEmojis,
			CONNECT: PermissionsBitField.Flags.Connect,
			SPEAK: PermissionsBitField.Flags.Speak,
			USE_VAD: PermissionsBitField.Flags.UseVad,
			MANAGE_WEBHOOKS: PermissionsBitField.Flags.ManageWebhooks,
			MANAGE_THREADS: PermissionsBitField.Flags.ManageThreads,
			CREATE_PUBLIC_THREADS: PermissionsBitField.Flags.CreatePublicThreads,
			CREATE_PRIVATE_THREADS: PermissionsBitField.Flags.CreatePrivateThreads,
			USE_EXTERNAL_STICKERS: PermissionsBitField.Flags.UseExternalStickers,
			SEND_MESSAGES_IN_THREADS: PermissionsBitField.Flags.SendMessagesInThreads,
			USE_EMBEDDED_ACTIVITIES: PermissionsBitField.Flags.UseEmbeddedActivities,
			SEND_VOICE_MESSAGES: PermissionsBitField.Flags.SendVoiceMessages,
			SEND_POLLS: PermissionsBitField.Flags.SendPolls,
		};

		if (!interaction.guild) {
			return interaction.reply('This command can only be used in a guild.');
		}

		const member = await interaction.guild.members.fetch(interaction.user.id);
		const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

		if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
			return interaction.reply('You do not have permission to manage channels.');
		}

		if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
			return interaction.reply('I do not have permission to manage channels.');
		}

		const channel = interaction.guild.channels.cache.get(channelId);
		if (!channel) {
			return interaction.reply('Channel not found.');
		}

		try {
			// Update the channel name
			await channel.setName(newChannelName);

			// Fetch current permission overwrites for the role
			const currentOverwrites = channel.permissionOverwrites.cache.get(role.id);
			const currentPermissions = currentOverwrites
				? currentOverwrites.allow
				: new PermissionsBitField();

			const permissionFlag = permissionMap[permissionChoice];
			const isPermissionSet = currentPermissions.has(permissionFlag);

			// Check if the permission is already set to the requested state
			if (
				(toggleChoice === 'on' && isPermissionSet) ||
				(toggleChoice === 'off' && !isPermissionSet)
			) {
				return interaction.reply({
					content: `The permission \`${permissionChoice}\` is already set to \`${toggleChoice.toUpperCase()}\` for role \`${role.name}\`.`,
					ephemeral: true,
				});
			}

			// Toggle the permission
			if (toggleChoice === 'on') {
				currentPermissions.add(permissionFlag);
			} else {
				currentPermissions.remove(permissionFlag);
			}

			// Edit the permission overwrites
			await channel.permissionOverwrites.edit(role, {
				[permissionFlag]: toggleChoice === 'on',
			});

			interaction.reply({
				content: `Channel name changed to \`${newChannelName}\` and permission \`${permissionChoice}\` set to \`${toggleChoice.toUpperCase()}\` for role \`${role.name}\`.`,
				ephemeral: true,
			});
		} catch (error) {
			console.error(error);
			interaction.reply('An error occurred while modifying the channel.');
		}
	},
};
