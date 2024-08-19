const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandData = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Displays all commands');

// Function to recursively get commands from a directory
function getCommandsFromDirectory(dirPath) {
	const commands = [];
	const files = fs.readdirSync(dirPath);

	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			commands.push(...getCommandsFromDirectory(filePath));
		} else if (file.endsWith('.js')) {
			const command = require(filePath);
			if (command.data && command.execute) {
				commands.push(command);
			}
		}
	}

	return commands;
}

module.exports = {
	data: commandData,
	async execute(interaction) {
		await interaction.deferReply();

		const { client, guild } = interaction;
		const guildCommands = await guild.commands.fetch();
		const commandsDirectory = path.join(__dirname, '..');

		// Get all commands recursively
		const allCommands = getCommandsFromDirectory(commandsDirectory);

		// Group commands by category
		const commandsByCategory = new Map();
		allCommands.forEach(command => {
			const commandFilePath = path.relative(commandsDirectory, require.resolve(`./${command.data.name}`));
            const category = commandFilePath.split(path.sep)[0]; 
			if (!commandsByCategory.has(category)) {
				commandsByCategory.set(category, []);
			}
			commandsByCategory.get(category).push({
				name: command.data.name,
				description: command.data.description,
			});
		});

		// Function to create the embed for a category
		const createCategoryEmbed = (categoryName, commands) => {
			const embed = new EmbedBuilder()
				.setColor('#e74c3c')
				.setTitle(`Category: ${categoryName}`)
				.setTimestamp();

			let description = '';
			commands.forEach((command, index) => {
				description += `\`${index + 1}.\` **${command.name}** - ${command.description || 'No description available.'}\n`;
			});
			embed.setDescription(description);

			return embed;
		};

		// Pagination logic for categories
		const categories = Array.from(commandsByCategory.keys());
		let currentCategoryIndex = 0;

		// Create the initial embed
		const initialEmbed = createCategoryEmbed(
			categories[currentCategoryIndex],
			commandsByCategory.get(categories[currentCategoryIndex])
		);

		// Create the button row
		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('prevCategory')
				.setLabel('Previous Category')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentCategoryIndex === 0),
			new ButtonBuilder()
				.setCustomId('nextCategory')
				.setLabel('Next Category')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentCategoryIndex === categories.length - 1)
		);

		const reply = await interaction.editReply({
			embeds: [initialEmbed],
			components: [buttonRow],
		});

		// Button collector
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000 * 5, // 5 minutes
		});

		collector.on('collect', async i => {
			if (i.user.id !== interaction.user.id) {
				return await i.reply({
					content: 'You should run the command to use this interaction.',
					ephemeral: true,
				});
			}

			if (i.customId === 'prevCategory') {
				currentCategoryIndex--;
			} else if (i.customId === 'nextCategory') {
				currentCategoryIndex++;
			}

			// Update buttons and embed
			buttonRow.components[0].setDisabled(currentCategoryIndex === 0);
			buttonRow.components[1].setDisabled(currentCategoryIndex === categories.length - 1);

			const newEmbed = createCategoryEmbed(
				categories[currentCategoryIndex],
				commandsByCategory.get(categories[currentCategoryIndex])
			);

			await i.update({
				embeds: [newEmbed],
				components: [buttonRow],
			});
		});

		collector.on('end', () => {
			reply.edit({ components: [] });
		});
	},
};
