const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// 1. Create the SlashCommandBuilder outside the execute function
const commandData = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Displays all commands or info about a specific command')
	.addStringOption(option =>
		option
			.setName('search')
			.setRequired(false)
			.setDescription('Search for a command by name or description')
	)
	// 2. Add the 'category' option here, but don't populate choices yet
	.addStringOption(option =>
		option
			.setName('category')
			.setRequired(false)
			.setDescription('What command category do you want to view?')
			.addChoices(
				{ name: 'Fun', value: 'fun' },
				{ name: 'Info', value: 'info' },
				{ name: 'Moderation', value: 'moderation' },
				{ name: 'Utility', value: 'utility' }
			)
	);

module.exports = {
	data: commandData, // Export the commandData object
	category: 'info',
	async execute(interaction) {
		await interaction.deferReply();

		const { client, guild } = interaction;
		const category = interaction.options.getString('category');
		const searchQuery = interaction.options.getString('search')?.toLowerCase();

		const guildCommands = await guild.commands.fetch();
		const commandsDirectory = path.join(__dirname, '..');
		const categoryFolders = fs
			.readdirSync(commandsDirectory)
			.filter(dir => fs.statSync(path.join(commandsDirectory, dir)).isDirectory());

		const commandsByCategory = new Map();
		for (const category of categoryFolders) {
			commandsByCategory.set(category, []);

			const commandFiles = fs
				.readdirSync(path.join(commandsDirectory, category))
				.filter(file => file.endsWith('.js'));

			for (const file of commandFiles) {
				const filePath = path.join(commandsDirectory, category, file);
				const command = require(filePath);
				commandsByCategory.get(category).push({
					id: guildCommands.find(c => c.name === command.data.name).id,
					name: command.data.name,
					description: command.data.description,
				});
			}
		}

		// 3. Dynamically populate category choices here
		const categoryChoices = Array.from(commandsByCategory.keys()).map(category => ({
			name: category.charAt(0).toUpperCase() + category.slice(1),
			value: category,
		}));
		commandData.options
			.find(option => option.name === 'category')
			.addChoices(...categoryChoices);

		const createCommandListEmbed = (commands, title, color) => {
			const embed = new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();

			const fieldValueMaxLength = 1024;
			let currentFieldValue = '';

			commands.forEach((cmd, index) => {
				const cmdStr = `> \`${index + 1}.\` </${cmd.name}:${
					cmd.id
				}> - ${cmd.description}\n`;

				if (currentFieldValue.length + cmdStr.length <= fieldValueMaxLength) {
					currentFieldValue += cmdStr;
				} else {
					embed.addFields({
						name: currentFieldValue.length > 0 ? '\u200B' : title, // Only add title to the first field
						value: currentFieldValue,
					});
					currentFieldValue = cmdStr;
				}
			});

			if (currentFieldValue.length > 0) {
				embed.addFields({
					name: '\u200B', // Subsequent fields have empty names
					value: currentFieldValue,
				});
			}

			return embed;
		};

		if (searchQuery) {
			const searchResults = [];
			if (category) {
				commandsByCategory.get(category).forEach(cmd => {
					if (
						cmd.name.toLowerCase().includes(searchQuery) ||
						cmd.description.toLowerCase().includes(searchQuery)
					) {
						searchResults.push(cmd);
					}
				});
			} else {
				for (const commands of commandsByCategory.values()) {
					commands.forEach(cmd => {
						if (
							cmd.name.toLowerCase().includes(searchQuery) ||
							cmd.description.toLowerCase().includes(searchQuery)
						) {
							searchResults.push(cmd);
						}
					});
				}
			}

			const searchEmbed = createCommandListEmbed(
				searchResults,
				`🔍 Search Results for "${searchQuery}"`,
				'#f39c12'
			).setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
			});
			return await interaction.editReply({ embeds: [searchEmbed] });
		}

		if (!category) {
			const mainMenuEmbed = new EmbedBuilder()
				.setColor('#2ecc71')
				.setTitle('Kiyo Bot Help Desk')
				.setDescription(
					'Explore my commands using the buttons below! \n Use `/help [category]` to directly view a category, or `/help [search]` to search for commands.'
				)
				.setThumbnail(interaction.client.user.avatarURL())
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
				})
				.setTimestamp();

			const categoryButtons = Array.from(commandsByCategory.keys()).map((category, index) =>
				new ButtonBuilder()
					.setCustomId(`help-${category}`)
					.setLabel(category.charAt(0).toUpperCase() + category.slice(1))
					.setStyle(ButtonStyle.Primary)
			);

			const rows = [];
			for (let i = 0; i < categoryButtons.length; i += 5) {
				rows.push(new ActionRowBuilder().addComponents(categoryButtons.slice(i, i + 5)));
			}

			const reply = await interaction.editReply({
				embeds: [mainMenuEmbed],
				components: rows,
			});

			const collector = reply.createMessageComponentCollector({
				time: 60_000 * 5,
			});

			collector.on('collect', async i => {
				if (i.user.id !== interaction.user.id) {
					return await i.reply({
						content: 'You should run the command to use this interaction.',
						ephemeral: true,
					});
				}

				const requestedCategory = i.customId.replace('help-', '');
				const commands = commandsByCategory.get(requestedCategory) || [];

				const embed = createCommandListEmbed(
					commands,
					`Commands: ${
						requestedCategory.charAt(0).toUpperCase() + requestedCategory.slice(1)
					}`,
					'#e74c3c'
				).setFooter({
					text: `Requested by ${i.user.tag}`,
					iconURL: i.user.displayAvatarURL({ dynamic: true }),
				});

				await i.update({ embeds: [embed], components: [] });
			});

			collector.on('end', () => {
				reply.edit({ components: [] });
			});

			return;
		}

		if (commandsByCategory.has(category)) {
			const commands = commandsByCategory.get(category);
			const embed = createCommandListEmbed(
				commands,
				`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
				'#e74c3c'
			).setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL({
					dynamic: true,
				}),
			});
			return await interaction.editReply({ embeds: [embed] });
		} else {
			await interaction.editReply({
				content: 'Invalid category.',
				ephemeral: true,
			});
		}
	},
};
