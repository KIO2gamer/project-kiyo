const {
	SlashCommandBuilder,
	PermissionsBitField,
	ChannelType,
} = require('discord.js');
const { handleError } = require('./../../utils/errorHandler.js');

module.exports = {
	description_full:
		'This command allows you to modify the properties of an existing text or voice channel. You can change the channel name and manage channel permissions for specific roles or everyone. Choose either the "text" or "voice" subcommand to specify the channel type.',
	usage: '/modify_channel [text/voice] [channel] <newname> <permissions> <toggle> <role>',
	examples: [
		'/modify_channel text channel:text_old newname:text_new',
		'/modify_channel text channel:text_old permissions:View Channel toggle:Off',
		'/modify_channel voice channel:voice_channel permissions:Speak toggle:On role:@role',
	],
	category: 'channels',
	data: new SlashCommandBuilder()
		.setName('modify_channel')
		.setDescription('Modify a text or voice channel.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('text')
				.setDescription('Modify text channel permissions')
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription('The text channel to modify')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText),
				)
				.addStringOption((option) =>
					option
						.setName('newname')
						.setDescription('The new name for the channel')
						.setRequired(false),
				)
				.addStringOption((option) =>
					option
						.setName('permission')
						.setDescription(
							'Permission to modify for the text channel',
						)
						.setRequired(false)
						.addChoices(
							{ name: 'View Channel', value: 'ViewChannel' },
							{
								name: 'Manage Channels',
								value: 'ManageChannels',
							},
							{ name: 'Manage Roles', value: 'ManageRoles' },
							{ name: 'Add Reactions', value: 'AddReactions' },
							{ name: 'Send Messages', value: 'SendMessages' },
							{
								name: 'Send TTS Messages',
								value: 'SendTtsMessages',
							},
							{
								name: 'Manage Messages',
								value: 'ManageMessages',
							},
							{ name: 'Embed Links', value: 'EmbedLinks' },
							{ name: 'Attach Files', value: 'AttachFiles' },
							{
								name: 'Read Message History',
								value: 'ReadMessageHistory',
							},
							{
								name: 'Mention Everyone',
								value: 'MentionEveryone',
							},
							{
								name: 'Use External Emojis',
								value: 'UseExternalEmojis',
							},
							{
								name: 'Manage Webhooks',
								value: 'ManageWebhooks',
							},
							{ name: 'Manage Threads', value: 'ManageThreads' },
							{
								name: 'Create Public Threads',
								value: 'CreatePublicThreads',
							},
							{
								name: 'Create Private Threads',
								value: 'CreatePrivateThreads',
							},
							{
								name: 'Use External Stickers',
								value: 'UseExternalStickers',
							},
							{
								name: 'Send Messages In Threads',
								value: 'SendMessagesInThreads',
							},
							{
								name: 'Use Embedded Activities',
								value: 'UseEmbeddedActivities',
							},
							{
								name: 'Send Voice Messages',
								value: 'SendVoiceMessages',
							},
							{ name: 'Send Polls', value: 'SendPolls' },
						),
				)
				.addStringOption((option) =>
					option
						.setName('toggle')
						.setDescription('Toggle permission on or off')
						.setRequired(false)
						.addChoices(
							{ name: 'On', value: 'on' },
							{ name: 'Off', value: 'off' },
						),
				)
				.addRoleOption((option) =>
					option
						.setName('role')
						.setDescription(
							'The role to modify permissions for (leave empty for everyone)',
						)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('voice')
				.setDescription('Modify voice channel permissions')
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription('The voice channel to modify')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildVoice),
				)
				.addStringOption((option) =>
					option
						.setName('newname')
						.setDescription('The new name for the channel')
						.setRequired(false),
				)
				.addStringOption((option) =>
					option
						.setName('permission')
						.setDescription(
							'Permission to modify for the voice channel',
						)
						.setRequired(false)
						.addChoices(
							{ name: 'View Channel', value: 'ViewChannel' },
							{
								name: 'Manage Channels',
								value: 'ManageChannels',
							},
							{ name: 'Manage Roles', value: 'ManageRoles' },
							{ name: 'Connect', value: 'Connect' },
							{ name: 'Speak', value: 'Speak' },
							{ name: 'Mute Members', value: 'MuteMembers' },
							{ name: 'Deafen Members', value: 'DeafenMembers' },
							{ name: 'Move Members', value: 'MoveMembers' },
							{ name: 'Use VAD', value: 'UseVAD' },
							{
								name: 'Priority Speaker',
								value: 'PrioritySpeaker',
							},
							{ name: 'Stream', value: 'Stream' },
							{
								name: 'Manage Webhooks',
								value: 'ManageWebhooks',
							},
							{
								name: 'Create Instant Invite',
								value: 'CreateInstantInvite',
							},
						),
				)
				.addStringOption((option) =>
					option
						.setName('toggle')
						.setDescription('Toggle permission on or off')
						.setRequired(false)
						.addChoices(
							{ name: 'On', value: 'on' },
							{ name: 'Off', value: 'off' },
						),
				)
				.addRoleOption((option) =>
					option
						.setName('role')
						.setDescription(
							'The role to modify permissions for (leave empty for everyone)',
						)
						.setRequired(false),
				),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const channel = interaction.options.getChannel('channel');
		const newChannelName = interaction.options.getString('newname');
		const permissionChoice = interaction.options.getString('permission');
		const toggleChoice = interaction.options.getString('toggle');
		const role =
			interaction.options.getRole('role') ||
			interaction.guild.roles.everyone;

		if (
			!interaction.guild.members.me.permissions.has(
				PermissionsBitField.Flags.ManageChannels,
			)
		) {
			return interaction.reply({
				content: 'I do not have permission to manage channels.',
				ephemeral: true,
			});
		}

		if (
			!interaction.member.permissions.has(
				PermissionsBitField.Flags.ManageChannels,
			)
		) {
			return interaction.reply({
				content: 'You do not have permission to manage channels.',
				ephemeral: true,
			});
		}

		if (!newChannelName && !permissionChoice) {
			return interaction.reply({
				content:
					"Please specify what you'd like to modify (channel name or permissions).",
				ephemeral: true,
			});
		}

		try {
			let updated = false;
			let response = 'Channel modified: ';

			async function updateChannelName(channel, newChannelName) {
				if (newChannelName) {
					await channel.setName(newChannelName);
					return `Name changed to \`${newChannelName}\`, `;
				}
				return '';
			}

			async function updateChannelPermission(
				channel,
				permissionChoice,
				toggleChoice,
				role,
			) {
				if (permissionChoice && toggleChoice) {
					const permissionFlag =
						PermissionsBitField.Flags[permissionChoice];
					const currentOverwrites =
						channel.permissionOverwrites.cache.get(role.id);
					const currentPermissions = currentOverwrites
						? currentOverwrites.allow
						: new PermissionsBitField();
					const isPermissionSet =
						currentPermissions.has(permissionFlag);

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

			async function handleChannelUpdate(
				channel,
				newChannelName,
				permissionChoice,
				toggleChoice,
				role,
			) {
				let response = '';
				response += await updateChannelName(channel, newChannelName);
				const permissionResponse = await updateChannelPermission(
					channel,
					permissionChoice,
					toggleChoice,
					role,
				);

				if (permissionResponse.startsWith('The permission')) {
					return { response: permissionResponse, updated: false };
				} else {
					response += permissionResponse;
					return { response, updated: true };
				}
			}

			if (subcommand === 'text' || subcommand === 'voice') {
				const { response: channelResponse, updated: channelUpdated } =
					await handleChannelUpdate(
						channel,
						newChannelName,
						permissionChoice,
						toggleChoice,
						role,
					);

				if (!channelUpdated) {
					return interaction.reply({
						content: channelResponse,
						ephemeral: true,
					});
				} else {
					response += channelResponse;
					updated = true;
				}
			}

			if (updated) {
				await interaction.reply({
					content: response.slice(0, -2),
					ephemeral: true,
				});
			}
		} catch (error) {
			handleError('Error modifying channel:', error);
			await handleError(interaction, error);
		}
	},
};
