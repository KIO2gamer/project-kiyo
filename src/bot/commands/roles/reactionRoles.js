const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ReactionRole = require('./../../../database/ReactionRole');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactrole')
		.setDescription('Create a reaction role message')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addStringOption(option =>
			option.setName('title').setDescription('Title for the message').setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('description')
				.setDescription('Description of the roles')
				.setRequired(true),
		)
		.addChannelOption(option =>
			option.setName('channel').setDescription('Channel for the message').setRequired(true),
		)
		.addRoleOption(option =>
			option.setName('role1').setDescription('First role to add').setRequired(true),
		)
		.addStringOption(option =>
			option.setName('emoji1').setDescription('Emoji for first role').setRequired(true),
		)
		.addRoleOption(option =>
			option.setName('role2').setDescription('Second role to add').setRequired(false),
		)
		.addStringOption(option =>
			option.setName('emoji2').setDescription('Emoji for second role').setRequired(false),
		)
		.addRoleOption(option =>
			option.setName('role3').setDescription('Third role to add').setRequired(false),
		)
		.addStringOption(option =>
			option.setName('emoji3').setDescription('Emoji for third role').setRequired(false),
		),

	async execute(interaction) {
		try {
			const title = interaction.options.getString('title');
			const description = interaction.options.getString('description');
			const channel = interaction.options.getChannel('channel');

			// Get roles and emojis
			const roles = [];
			for (let i = 1; i <= 3; i++) {
				const role = interaction.options.getRole(`role${i}`);
				const emoji = interaction.options.getString(`emoji${i}`);

				if (role && emoji) {
					roles.push({ role, emoji });
				}
			}

			if (roles.length === 0) {
				return await interaction.reply({
					content: 'You must provide at least one role and emoji.',
					ephemeral: true,
				});
			}

			// Create description with roles
			let fullDescription = `${description}\n\n`;
			roles.forEach(({ role, emoji }) => {
				fullDescription += `${emoji} - ${role.name}\n`;
			});

			// Create and send embed
			const embed = new EmbedBuilder()
				.setTitle(title)
				.setDescription(fullDescription)
				.setColor('#0099ff')
				.setFooter({ text: 'React to get a role' });

			const message = await channel.send({ embeds: [embed] });

			// Add reactions
			for (const { emoji } of roles) {
				await message.react(emoji);
			}

			// Save to database
			const reactionRoleData = {
				guildId: interaction.guild.id,
				messageId: message.id,
				channelId: channel.id,
				roles: roles.map(({ role, emoji }) => ({
					emoji: emoji,
					roleId: role.id,
				})),
			};

			await ReactionRole.create(reactionRoleData);

			await interaction.reply({
				content: `Reaction role message created in ${channel}!`,
				ephemeral: true,
			});
		} catch (error) {
			console.error('Error creating reaction roles:', error);
			await interaction.reply({
				content: 'There was an error setting up the reaction roles.',
				ephemeral: true,
			});
		}
	},
};
