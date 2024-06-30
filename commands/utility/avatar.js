const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Get the avatar of the user.')
		.addUserOption(
			option =>
				option
					.setName('target')
					.setDescription("The user's avatar to show")
					.setRequired(false) // Make this optional
		)
		.addStringOption(option =>
			option
				.setName('size')
				.setDescription('The size of the avatar')
				.setRequired(false)
				.addChoices(
					{ name: '128', value: '128' },
					{ name: '256', value: '256' },
					{ name: '512', value: '512' },
					{ name: '1024', value: '1024' },
					{ name: '2048', value: '2048' },
					{ name: '4096', value: '4096' }
				)
		)
		.addStringOption(option =>
			option
				.setName('format')
				.setDescription('The format of the avatar')
				.setRequired(false)
				.addChoices(
					{ name: 'WebP', value: 'webp' },
					{ name: 'PNG', value: 'png' },
					{ name: 'JPEG', value: 'jpg' },
					{ name: 'GIF', value: 'gif' }
				)
		),
	category: 'utility',
	async execute(interaction) {
		const userTarget = interaction.options.getUser('target') || interaction.user;
		const size = interaction.options.getString('size') || '512';
		const format = interaction.options.getString('format') || 'webp';

		const avatarURL = userTarget.displayAvatarURL({
			format: format,
			dynamic: true,
			size: parseInt(size),
		});

		const embed = new EmbedBuilder()
			.setTitle(`${userTarget.username}'s Avatar [Click here to see full image]`)
			.setImage(avatarURL)
			.setURL(avatarURL)
			.setFooter({
				text: `Requested by ${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
			});

		await interaction.reply({ embeds: [embed] });
	},
};
