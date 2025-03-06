const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help information for bot commands')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Get detailed info about a specific command')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('search')
				.setDescription('Search for commands by keyword')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('category')
				.setDescription('Filter commands by category')
				.setRequired(false)),
	description_full: 'Displays comprehensive help information for all bot commands. You can view all commands grouped by category, get detailed information about specific commands, search for commands using keywords, or filter commands by category.',
	usage: '/help [command:command_name] [search:keyword] [category:category_name]',
	examples: [
		'/help',
		'/help command:ping',
		'/help search:user',
		'/help category:moderation'
	],

	async execute(interaction) {
		const commandName = interaction.options.getString('command');
		const searchQuery = interaction.options.getString('search');
		const categoryFilter = interaction.options.getString('category');

		// Get all commands from command folders
		const commands = await getAllCommands();

		if (commandName) {
			return handleCommandDetails(interaction, commandName, commands);
		} else if (searchQuery) {
			return handleSearchQuery(interaction, searchQuery, commands);
		} else if (categoryFilter) {
			return handleCategoryFilter(interaction, categoryFilter, commands);
		} else {
			return handleGeneralHelp(interaction, commands);
		}
	}
};

// Get all commands recursively from the commands directory
async function getAllCommands() {
	const commands = [];
	// Fix the path to point to the commands directory
	const commandsPath = path.join(__dirname, '..');

	try {
		const categories = fs.readdirSync(commandsPath)
			.filter(dir => {
				try {
					return fs.statSync(path.join(commandsPath, dir)).isDirectory();
				} catch (error) {
					console.error(`Error checking if ${dir} is a directory:`, error);
					return false;
				}
			});

		for (const category of categories) {
			const categoryPath = path.join(commandsPath, category);
			try {
				const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

				for (const file of commandFiles) {
					try {
						const filePath = path.join(categoryPath, file);
						const command = require(filePath);
						if (command.data && command.execute) {
							command.category = category;
							commands.push(command);
						}
					} catch (error) {
						console.error(`Error loading command file ${file}:`, error);
					}
				}
			} catch (error) {
				console.error(`Error reading category directory ${category}:`, error);
			}
		}
	} catch (error) {
		console.error('Error reading commands directory:', error);
	}

	return commands;
}

async function handleCommandDetails(interaction, commandName, commands) {
	const command = commands.find(cmd => cmd.data.name === commandName);

	if (!command) {
		return interaction.reply({
			content: `Command \`${commandName}\` not found.`,
			flags: 64
		});
	}

	const embed = new EmbedBuilder()
		.setTitle(`Command: /${command.data.name}`)
		.setDescription(command.data.description || 'No description available')
		.setColor('#3498db');

	// Add command options if they exist
	if (command.data.options && command.data.options.length > 0) {
		let optionsText = '';
		command.data.options.forEach(option => {
			const required = option.required ? '(required)' : '(optional)';
			optionsText += `• **${option.name}** ${required}: ${option.description}\n`;
		});

		embed.addFields({ name: 'Options', value: optionsText });
	}

	// Add examples if they exist
	if (command.examples) {
		embed.addFields({
			name: 'Examples',
			value: command.examples.join('\n')
		});
	}

	// Add category information
	embed.addFields({
		name: 'Category',
		value: command.category || 'Uncategorized'
	});

	return interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleSearchQuery(interaction, searchQuery, commands) {
	const results = commands.filter(cmd => {
		// Search in command name
		if (cmd.data.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;

		// Search in command description
		if (cmd.data.description && cmd.data.description.toLowerCase().includes(searchQuery.toLowerCase())) return true;

		// Search in command options
		if (cmd.data.options) {
			return cmd.data.options.some(opt =>
				opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				opt.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return false;
	});

	if (results.length === 0) {
		return interaction.reply({
			content: `No commands found matching '${searchQuery}'.`,
			flags: 64
		});
	}

	const embed = new EmbedBuilder()
		.setTitle(`Search Results: "${searchQuery}"`)
		.setDescription(`Found ${results.length} command(s)`)
		.setColor('#3498db');

	// Group results by category
	const groupedResults = {};
	results.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedResults[category]) {
			groupedResults[category] = [];
		}
		groupedResults[category].push(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
	});

	// Add each category as a field
	Object.entries(groupedResults).forEach(([category, cmds]) => {
		embed.addFields({
			name: `📂 ${category}`,
			value: cmds.join('\n')
		});
	});

	return interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleCategoryFilter(interaction, categoryFilter, commands) {
	const categories = [...new Set(commands.map(cmd => cmd.category || 'Uncategorized'))];

	// Find the closest category match
	const category = categories.find(cat =>
		cat.toLowerCase() === categoryFilter.toLowerCase()
	) || categories.find(cat =>
		cat.toLowerCase().includes(categoryFilter.toLowerCase())
	);

	if (!category) {
		return interaction.reply({
			content: `Category "${categoryFilter}" not found. Available categories: ${categories.join(', ')}`,
			flags: 64
		});
	}

	const categoryCommands = commands.filter(cmd =>
		(cmd.category || 'Uncategorized') === category
	);

	const embed = new EmbedBuilder()
		.setTitle(`Commands in category: ${category}`)
		.setDescription(`${categoryCommands.length} command(s) available`)
		.setColor('#3498db');

	categoryCommands.forEach(cmd => {
		embed.addFields({
			name: `/${cmd.data.name}`,
			value: cmd.data.description || 'No description available'
		});
	});

	return interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleGeneralHelp(interaction, commands) {
	// Group commands by category
	const groupedCommands = {};
	commands.forEach(cmd => {
		const category = cmd.category || 'Uncategorized';
		if (!groupedCommands[category]) {
			groupedCommands[category] = [];
		}
		groupedCommands[category].push(cmd);
	});

	const embed = new EmbedBuilder()
		.setTitle('Bot Commands Help')
		.setDescription('Use `/help command:name` for detailed information about a specific command.')
		.setColor('#3498db')
		.setFooter({
			text: 'Tip: Try /help search:keyword or /help category:name'
		});

	// Add each category as a field
	Object.entries(groupedCommands).forEach(([category, cmds]) => {
		const commandList = cmds.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n');
		embed.addFields({
			name: `📂 ${category} (${cmds.length})`,
			value: commandList
		});
	});

	return interaction.reply({ embeds: [embed], flags: 64 });
}