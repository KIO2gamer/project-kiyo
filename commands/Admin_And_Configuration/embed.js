const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DEFAULT_COLOR = '#0099ff';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Creates a customizable embed message.')
		.addStringOption(option =>
			option
				.setName('title')
				.setDescription('The title of the embed')
				.setRequired(true)
				.setMaxLength(256),
		)
		.addStringOption(option =>
			option
				.setName('description')
				.setDescription('The description of the embed')
				.setRequired(true)
				.setMaxLength(4096),
		)
		.addStringOption(option =>
			option
				.setName('color')
				.setDescription('The color of the embed in HEX (e.g., #FF5733)')
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('footer')
				.setDescription('The footer text of the embed')
				.setRequired(false)
				.setMaxLength(2048),
		)
		.addStringOption(option =>
			option
				.setName('thumbnail')
				.setDescription('The URL of the thumbnail image')
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('author')
				.setDescription('The author of the embed')
				.setRequired(false)
				.setMaxLength(256),
		)
		.addStringOption(option =>
			option.setName('image').setDescription('The URL of the image').setRequired(false),
		)
		.addBooleanOption(option =>
			option
				.setName('timestamp')
				.setDescription('Whether to include a timestamp')
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	category: 'utility',
	async execute(interaction) {
		const options = interaction.options;
		const embed = new EmbedBuilder()
			.setTitle(options.getString('title'))
			.setDescription(options.getString('description'))
			.setColor(options.getString('color') || DEFAULT_COLOR);

		const footer = options.getString('footer');
		if (footer) embed.setFooter({ text: footer });

		const thumbnail = options.getString('thumbnail');
		if (thumbnail) {
			try {
				embed.setThumbnail(thumbnail);
			} catch (error) {
				handleError('Error setting thumbnail:', error);
			}
		}

		const author = options.getString('author');
		if (author) embed.setAuthor({ name: author });

		const image = options.getString('image');
		if (image) {
			try {
				embed.setImage(image);
			} catch (error) {
				handleError('Error setting image:', error);
			}
		}

		if (options.getBoolean('timestamp')) embed.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
