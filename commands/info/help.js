const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays all commands or info about a specific command')
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
		)
		.addStringOption(option =>
			option
				.setName('search')
				.setRequired(false)
				.setDescription('Search for a command by name or description')
		),
	category: 'info',
	async execute(interaction) {
		await interaction.deferReply();

		const { client, guild } = interaction;
		const category = interaction.options.getString('category');
		const searchQuery = interaction.options.getString('search')?.toLowerCase();

		// Pre-fetch all necessary data 
		const guildCommands = await guild.commands.fetch(); 
        
		// Use a map for faster lookups (optional but improves performance)
		const commandsByCategory = new Map([
			['fun', []],
			['information', []],
			['moderation', []],
			['utility', []],
		]);

		// Populate the map in a single loop for efficiency 
		guildCommands.forEach(command => {
			const commandData = client.commands.get(command.name);
			if (commandData && commandsByCategory.has(commandData.category)) {
				commandsByCategory.get(commandData.category).push({
					id: command.id,
					name: command.name,
					description: command.description,
				});
			}
		});

		// Create a function to build embeds with command lists 
		const createCommandListEmbed = (commands, title, color) => {
			const embed = new EmbedBuilder()
				.setColor(color)
				.setTitle(title)
				.setTimestamp();

			// Efficiently split command lists into multiple fields
			const fieldValueMaxLength = 1024;
			let currentFieldValue = '';

			commands.forEach(cmd => {
				const cmdStr = `</${cmd.name}:${cmd.id}> - ${cmd.description}\n`;
				if (currentFieldValue.length + cmdStr.length <= fieldValueMaxLength) {
					currentFieldValue += cmdStr;
				} else {
					embed.addFields({ name: '\u200B', value: currentFieldValue });
					currentFieldValue = cmdStr;
				}
			});

			if (currentFieldValue.length > 0) {
				embed.addFields({ name: '\u200B', value: currentFieldValue });
			}

			return embed;
		};

        // Create embeds only when needed 

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

            const searchEmbed = createCommandListEmbed(searchResults, `🔍 Search Results: ${searchQuery}`, '#f39c12')
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
				}); 
            return await interaction.editReply({ embeds: [searchEmbed] }); 
        }


		if (!category) { 
			const mainMenuEmbed = new EmbedBuilder() 
				.setColor('#2ecc71')
				.setDescription(
					'`/help [category] - View commands in a specific category`\n`/help [search] - Search commands from all categories`\n`/help [category] [search] - Search commands from a specific category`'
				)
				.setAuthor({
					name: 'Kiyo Bot HelpDesk',
					iconURL: interaction.client.user.avatarURL(),
				})
				.setThumbnail(interaction.client.user.avatarURL())
				.addFields([
					{
						name: '📂 Categories',
						value: Array.from(commandsByCategory.keys())
							.map(
								key =>
									`> **${key.charAt(0).toUpperCase() + key.slice(1)}**\n`
							)
							.join('\n'),
					},
				])
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
				})
				.setTimestamp();

			const cmdListButton = new ButtonBuilder()
				.setLabel('📜 Command List')
				.setStyle(ButtonStyle.Secondary)
				.setCustomId('cmdList');

			const mainMenuBtn = new ButtonBuilder()
				.setLabel('🏠 Home')
				.setStyle(ButtonStyle.Secondary)
				.setCustomId('home');

			const rowWithCmdBtn = new ActionRowBuilder().addComponents(cmdListButton);
			const rowWithHomeBtn = new ActionRowBuilder().addComponents(mainMenuBtn);

			const reply = await interaction.editReply({
				embeds: [mainMenuEmbed],
				components: [rowWithCmdBtn],
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
				if (i.customId === 'cmdList') {
					// Flatten the map's values into a single array safely 
					const allCommands = [];
					for (const commands of commandsByCategory.values()) {
						if (commands) { 
							allCommands.push(...commands);
						}
					}
		
					const cmdListEmbed = createCommandListEmbed(
						allCommands, // Pass the flattened array 
						'📜 Command List', 
						'#3498db'
					).setFooter({
						text: `Requested by ${interaction.user.tag}`,
						iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
					}); 
					await i.update({
						embeds: [cmdListEmbed],
						components: [rowWithHomeBtn],
					});
				}
				if (i.customId === 'home') {
					await i.update({
						embeds: [mainMenuEmbed],
						components: [rowWithCmdBtn],
					});
				}
			});

			collector.on('end', async (collected, reason) => {
				if (reason === 'time') {
					await reply.edit({ components: [] });
				}
			});

			return;
		}

        // Handle category display here 
        if (commandsByCategory.has(category)) {
            const commands = commandsByCategory.get(category);
			const embed = createCommandListEmbed(
			    commands,
                `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`, 
                '#e74c3c'
            ) 
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL({
					dynamic: true,
				}),
			});
			return await interaction.editReply({ embeds: [embed] }); 
        } else { 
            // Invalid Category Handling
			await interaction.editReply({
				content: 'Invalid category.',
				ephemeral: true,
			}); 
        } 
	},
};