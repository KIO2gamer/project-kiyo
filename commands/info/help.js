const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Collection,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	description_full: 'Displays all available commands.',
	usage: '/help [command name]',
	examples: ['/help', '/help ban'],
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays all available commands.')
		.addStringOption(option =>
			option
				.setName('command')
				.setDescription('The name of the command to get help with.')
				.setRequired(false)
		),
	async execute(interaction) {
		const commandName = interaction.options.getString('command')?.toLowerCase();

		if (commandName) {
			// Display help for a specific command
			const command = getCommands().get(commandName);

			if (!command) {
				return interaction.reply({
					content: `No command with the name \`${commandName}\` was found.`,
				});
			}

			const embed = new EmbedBuilder()
				.setColor('Blue')
				.setTitle(`Command: \`${command.data.name}\``)
				.setDescription(command.description_full || command.data.description)
				.addFields(
					{ name: 'Usage', value: `\`${command.usage}\``, inline: false },
					{
						name: 'Examples',
						value: `\`\`\`${command.examples.join('\n')}\`\`\``,
						inline: false,
					}
				);

			return interaction.reply({ embeds: [embed] });
		} else {
			// Pagination for all commands
			const commandFolders = fs.readdirSync('./commands');
			const categories = commandFolders.map(folder => {
				const commandFiles = fs
					.readdirSync(`./commands/${folder}`)
					.filter(file => file.endsWith('.js'));

				const commands = commandFiles.map(file => {
					const command = require(`../${folder}/${file}`);
					return {
						name: command.data.name,
						description: command.data.description,
						commandId: interaction.client.application.commands.cache.find(
							cmd => cmd.name === command.data.name
						)?.id,
					};
				});

				return {
					name: folder.charAt(0).toUpperCase() + folder.slice(1),
					commands: commands,
				};
			});

			let currentIndex = 0;

			const generateEmbed = index => {
				return new EmbedBuilder()
					.setTitle(`${categories[index].name} Commands`)
					.setDescription(
						categories[index].commands
							.map(cmd =>
								cmd.commandId
									? `</${cmd.name}:${cmd.commandId}> - ${cmd.description}`
									: `\`/${cmd.name}\` - ${cmd.description}`
							)
							.join('\n')
					)
					.setColor(0x00ae86)
					.setFooter({ text: `Page ${index + 1} of ${categories.length}` });
			};

			const generateButtons = index => {
				return new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('previous')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(index === 0),
					new ButtonBuilder()
						.setCustomId('next')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(index === categories.length - 1)
				);
			};

			const embed = generateEmbed(currentIndex);
			const buttons = generateButtons(currentIndex);

			const message = await interaction.reply({
				embeds: [embed],
				components: [buttons],
				fetchReply: true,
			});

			const collector = message.createMessageComponentCollector({ time: 60000 });

			collector.on('collect', async i => {
				if (i.user.id !== interaction.user.id) {
					return i.reply({ content: "This button isn't for you!", ephemeral: true });
				}

				if (i.customId === 'next' && currentIndex < categories.length - 1) {
					currentIndex++;
				} else if (i.customId === 'previous' && currentIndex > 0) {
					currentIndex--;
				}

				await i.update({
					embeds: [generateEmbed(currentIndex)],
					components: [generateButtons(currentIndex)],
				});
			});

			collector.on('end', () => {
				if (message.editable) {
					message
						.edit({ components: [generateButtons(currentIndex, true)] })
						.catch(error => console.error('Error disabling buttons:', error));
				}
			});
		}
	},
};

function getCommands() {
	const commands = new Collection();
	const commandsPath = path.join(__dirname, '..'); // Base path
	console.log(commandsPath);

	const commandFolders = fs.readdirSync(commandsPath);

	for (const folder of commandFolders) {
		const categoryPath = path.join(commandsPath, folder);

		if (fs.statSync(categoryPath).isDirectory()) {
			const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, folder, file);
				const command = require(filePath); // Use the constructed path directly
				commands.set(command.data.name, command);
			}
		}
	}

	return commands;
}
