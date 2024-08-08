const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modifychannel')
		.setDescription('Modify a text or voice channel.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('text')
				.setDescription('Modify text channel permissions')
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('The text channel to modify')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addStringOption(option =>
					option
						.setName('newname')
						.setDescription('The new name for the channel')
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('permission')
						.setDescription('Permission to modify for the text channel')
						.setRequired(false)
						.addChoices(
							{ name: 'View Channel', value: 'ViewChannel' },
							{ name: 'Manage Channels', value: 'ManageChannels' },
							{ name: 'Manage Roles', value: 'ManageRoles' },
							{ name: 'Add Reactions', value: 'AddReactions' },
							{ name: 'Send Messages', value: 'SendMessages' },
							{ name: 'Send TTS Messages', value: 'SendTtsMessages' },
							{ name: 'Manage Messages', value: 'ManageMessages' },
							{ name: 'Embed Links', value: 'EmbedLinks' },
							{ name: 'Attach Files', value: 'AttachFiles' },
							{ name: 'Read Message History', value: 'ReadMessageHistory' },
							{ name: 'Mention Everyone', value: 'MentionEveryone' },
							{ name: 'Use External Emojis', value: 'UseExternalEmojis' },
							{ name: 'Manage Webhooks', value: 'ManageWebhooks' },
							{ name: 'Manage Threads', value: 'ManageThreads' },
							{ name: 'Create Public Threads', value: 'CreatePublicThreads' },
							{ name: 'Create Private Threads', value: 'CreatePrivateThreads' },
							{ name: 'Use External Stickers', value: 'UseExternalStickers' },
							{ name: 'Send Messages In Threads', value: 'SendMessagesInThreads' },
							{ name: 'Use Embedded Activities', value: 'UseEmbeddedActivities' },
							{ name: 'Send Voice Messages', value: 'SendVoiceMessages' },
							{ name: 'Send Polls', value: 'SendPolls' }
						)
				)
				.addStringOption(option =>
					option
						.setName('toggle')
						.setDescription('Toggle permission on or off')
						.setRequired(false)
						.addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
				)
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription(
							'The role to modify permissions for (leave empty for everyone)'
						)
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('voice')
				.setDescription('Modify voice channel permissions')
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('The voice channel to modify')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildVoice)
				)
				.addStringOption(option =>
					option
						.setName('newname')
						.setDescription('The new name for the channel')
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('permission')
						.setDescription('Permission to modify for the voice channel')
						.setRequired(false)
						.addChoices(
							{ name: 'View Channel', value: 'ViewChannel' },
							{ name: 'Manage Channels', value: 'ManageChannels' },
							{ name: 'Manage Roles', value: 'ManageRoles' },
							{ name: 'Connect', value: 'Connect' },
							{ name: 'Speak', value: 'Speak' },
							{ name: 'Mute Members', value: 'MuteMembers' },
							{ name: 'Deafen Members', value: 'DeafenMembers' },
							{ name: 'Move Members', value: 'MoveMembers' },
							{ name: 'Use VAD', value: 'UseVad' },
							{ name: 'Priority Speaker', value: 'PrioritySpeaker' },
							{ name: 'Stream', value: 'Stream' },
							{ name: 'Manage Webhooks', value: 'ManageWebhooks' },
							{ name: 'Create Instant Invite', value: 'CreateInstantInvite' }
						)
				)
				.addStringOption(option =>
					option
						.setName('toggle')
						.setDescription('Toggle permission on or off')
						.setRequired(false)
						.addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
				)
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription(
							'The role to modify permissions for (leave empty for everyone)'
						)
						.setRequired(false)
				)
		),
	category: 'moderation',
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const channel = interaction.options.getChannel('channel');
		const newChannelName = interaction.options.getString('newname');
		const permissionChoice = interaction.options.getString('permission');
		const toggleChoice = interaction.options.getString('toggle');
		const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;

		// Check if bot has permission
		if (
			!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)
		) {
			return interaction.reply({
				content: 'I do not have permission to manage channels.',
				ephemeral: true,
			});
		}

		// Check if the user has permission
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
			return interaction.reply({
				content: 'You do not have permission to manage channels.',
				ephemeral: true,
			});
		}

		if (!newChannelName && !permissionChoice) {
			return interaction.reply({
				content: "Please specify what you'd like to modify (channel name or permissions).",
				ephemeral: true,
			});
		}

		try {
			let updated = false;
			let response = 'Channel modified: ';

			// Helper functions to refactor common logic
			async function updateChannelName(channel, newChannelName) {
				if (newChannelName) {
					await channel.setName(newChannelName);
					return `Name changed to \`${newChannelName}\`, `;
				}
				return '';
			}

			async function updateChannelPermission(channel, permissionChoice, toggleChoice, role) {
				if (permissionChoice && toggleChoice) {
					const permissionFlag = PermissionsBitField.Flags[permissionChoice];
					const currentOverwrites = channel.permissionOverwrites.cache.get(role.id);
					const currentPermissions = currentOverwrites
						? currentOverwrites.allow
						: new PermissionsBitField();
					const isPermissionSet = currentPermissions.has(permissionFlag);

					if (
						(toggleChoice === 'on' && isPermissionSet) ||
						(toggleChoice === 'off' && !isPermissionSet)
					) {
						return `The permission \`${permissionChoice}\` is already set to \`${toggleChoice.toUpperCase()}\` for role \`${role.name}\`.`;
					}

					await channel.permissionOverwrites.edit(role, {
						[permissionFlag]: toggleChoice === 'on',
					});
					return `Permission \`${permissionChoice}\` set to \`${toggleChoice.toUpperCase()}\` for role \`${role.name}\`, `;
				}
				return '';
			}

			// Use helper functions in your subcommand logic
			if (subcommand === 'text') {
				response += await updateChannelName(channel, newChannelName);
				const permissionResponse = await updateChannelPermission(
					channel,
					permissionChoice,
					toggleChoice,
					role
				);

				if (permissionResponse.startsWith('The permission')) {
					// Permission already in that state
					return interaction.reply({ content: permissionResponse, ephemeral: true });
				} else {
					response += permissionResponse;
					updated = true;
				}
			} else if (subcommand === 'voice') {
				response += await updateChannelName(channel, newChannelName);
				const permissionResponse = await updateChannelPermission(
					channel,
					permissionChoice,
					toggleChoice,
					role
				);

				if (permissionResponse.startsWith('The permission')) {
					return interaction.reply({ content: permissionResponse, ephemeral: true });
				} else {
					response += permissionResponse;
					updated = true;
				}
			}

			if (updated) {
				interaction.reply({ content: response.slice(0, -2), ephemeral: true });
			}
		} catch (error) {
			console.error('Error modifying channel:', error);
			interaction.reply({
				content: 'An error occurred while modifying the channel.',
				ephemeral: true,
			});
		}
	},
};
