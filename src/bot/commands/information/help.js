const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { handleError } = require('../../utils/errorHandler.js');

// Theme configuration - Expanded with more customization options
const THEME = {
	COLOR: '#3498db', // Discord blue
	ICON: 'https://cdn.discordapp.com/embed/avatars/0.png', // Default Discord avatar
	TIMEOUT_MS: 180000, // 3 minutes timeout for menus (increased from 2)
	ITEMS_PER_PAGE: 8, // Reduced for better readability
	FOOTER_TEXT: 'Use the buttons below to navigate • Command times out after 3 minutes',
	SUPPORT_SERVER: 'https://discord.gg/yourserver', // Add your support server link
	COMMAND_PREFIX: '/', // For showing command usage
};

// Enhanced emoji mapping for categories with more descriptive emojis
const CATEGORY_EMOJIS = {
	core: '⚙️',
	customization: '🎨',
	entertainment: '🎮',
	information: 'ℹ️',
	interaction: '💬',
	management: '🛠️'
};

// Function to ensure all categories have an emoji (Modified to use predefined categories)
function updateCategoryEmojis(categories) {
	const validCategories = ['core', 'customization', 'entertainment', 'information', 'interaction', 'management'];
	validCategories.forEach(category => {
		if (!CATEGORY_EMOJIS[category.toLowerCase()]) {
			CATEGORY_EMOJIS[category.toLowerCase()] = '📌'; // Default emoji if missing (shouldn't happen now)
		}
	});
	return CATEGORY_EMOJIS;
}

// Function to get category emoji
function getCategoryEmoji(category = 'core') { // Default to 'core' if category is not provided or invalid
	return CATEGORY_EMOJIS[category.toLowerCase()] || '📌';
}

// Helper function to organize commands by category (Modified to use predefined categories)
function organizeCommandsByCategory(commands) {
	const categories = {
		core: [],
		customization: [],
		entertainment: [],
		information: [],
		interaction: [],
		management: []
	};
	for (const command of commands.values()) {
		let category = command.category?.toLowerCase() || 'core'; // Default to 'core' if no category or invalid
		if (!categories.hasOwnProperty(category)) {
			category = 'core'; // Fallback to 'core' if category is not in predefined list
		}
		categories[category].push(command);
	}

	// Sort categories by name for consistency (already sorted in object definition)
	return categories;
}

// Helper function to count commands per category
function getCommandCountByCategory(organizedCommands) {
	const counts = {};
	for (const [category, commands] of Object.entries(organizedCommands)) {
		counts[category] = commands.length;
	}
	return counts;
}

// Function to create a paginated menu without requiring fetchReply
async function createPaginatedMenu(interaction, pages, initialComponents = []) {
	if (!pages || pages.length === 0) {
		return interaction.reply({ content: 'No pages to display.', ephemeral: true });
	}

	// Store page state in a Map using interaction user ID as key
	if (!interaction.client.helpMenuState) {
		interaction.client.helpMenuState = new Map();
	}

	// Send the initial reply
	await interaction.reply({
		embeds: [pages[0]],
		components: [...initialComponents, ...(pages.length > 1 ? [createNavigationRow(0, pages.length)] : [])]
	});

	// Generate a unique ID for this help session
	const helpSessionId = `help_${interaction.user.id}_${Date.now()}`;

	// Initialize the state for this help session
	interaction.client.helpMenuState.set(helpSessionId, {
		currentPage: 0,
		pages: pages,
		initialComponents: initialComponents,
		userId: interaction.user.id,
		channelId: interaction.channelId,
		createdAt: Date.now()
	});

	if (pages.length <= 1 && initialComponents.length === 0) return; // No need for collector

	// We'll set up a listener in the main client interaction create event
	// This is handled in the execute method below

	// Set a timeout to remove the state after the timeout period
	setTimeout(() => {
		// If this help session still exists, clean it up
		if (interaction.client.helpMenuState.has(helpSessionId)) {
			// Try to edit the original message if possible
			interaction.editReply({
				embeds: [
					EmbedBuilder.from(pages[0])
						.setFooter({ text: 'This help menu has expired. Use /help again to get a fresh menu.' })
				],
				components: []
			}).catch(() => { }); // Ignore errors if we can't edit

			// Clean up the state
			interaction.client.helpMenuState.delete(helpSessionId);
		}
	}, THEME.TIMEOUT_MS);

	// Return the session ID so it can be used in the execute method
	return helpSessionId;
}

async function handleHelpInteraction(i, originalInteraction, messageId) {
	// Get the current state
	const state = originalInteraction.client.helpMenuState.get(messageId) || {
		currentPage: 0,
		pages: [createMainHelpEmbed(originalInteraction.client, organizeCommandsByCategory(originalInteraction.client.commands))],
		initialComponents: []
	};

	// Handle navigation buttons
	if (i.customId === 'prev') {
		state.currentPage = Math.max(0, state.currentPage - 1);
		await i.update({
			embeds: [state.pages[state.currentPage]],
			components: [
				...state.initialComponents,
				createNavigationRow(state.currentPage, state.pages.length)
			],
		});
	}
	else if (i.customId === 'next') {
		state.currentPage = Math.min(state.pages.length - 1, state.currentPage + 1);
		await i.update({
			embeds: [state.pages[state.currentPage]],
			components: [
				...state.initialComponents,
				createNavigationRow(state.currentPage, state.pages.length)
			],
		});
	}
	// Handle category select menu
	else if (i.customId === 'category_select') {
		const categoryName = i.values[0];
		await i.deferUpdate();

		// Get commands for the selected category
		const commands = Array.from(originalInteraction.client.commands.values())
			.filter(cmd => cmd.category && cmd.category.toLowerCase() === categoryName.toLowerCase());

		if (!commands.length) {
			await i.followUp({
				content: `⚠️ No commands found in the \`${categoryName}\` category.`,
				ephemeral: true
			});
			return;
		}

		// Display category-specific embeds
		const categoryEmbeds = createCategoryCommandEmbeds(categoryName, commands, originalInteraction.client);

		// Update state with new pages
		state.pages = categoryEmbeds;
		state.currentPage = 0;
		state.initialComponents = [
			createHelpTypeRow(),
			createCategoryMenuRow(Object.keys(organizeCommandsByCategory(originalInteraction.client.commands)))
		];

		// Save updated state
		originalInteraction.client.helpMenuState.set(messageId, state);

		if (categoryEmbeds.length > 1) {
			// If multiple pages, add navigation
			await i.editReply({
				embeds: [categoryEmbeds[0]],
				components: [
					...state.initialComponents,
					createNavigationRow(0, categoryEmbeds.length)
				],
			});
		} else {
			// If only one page, no navigation needed
			await i.editReply({
				embeds: [categoryEmbeds[0]],
				components: state.initialComponents,
			});
		}
	}
	// Handle help type buttons
	else if (i.customId === 'help_home') {
		// Return to main help page
		const organizedCommands = organizeCommandsByCategory(originalInteraction.client.commands);
		const mainHelpEmbed = createMainHelpEmbed(originalInteraction.client, organizedCommands);

		// Update state
		state.pages = [mainHelpEmbed];
		state.currentPage = 0;
		state.initialComponents = [
			createHelpTypeRow(),
			createCategoryMenuRow(Object.keys(organizeCommandsByCategory(originalInteraction.client.commands)))
		];

		originalInteraction.client.helpMenuState.set(messageId, state);

		await i.update({
			embeds: [mainHelpEmbed],
			components: state.initialComponents,
		});
	}
	else if (i.customId === 'help_commands') {
		// Show all commands in a paginated list
		const allCommands = Array.from(originalInteraction.client.commands.values())
			.sort((a, b) => a.data.name.localeCompare(b.data.name));
		const allCommandEmbeds = createAllCommandsEmbeds(allCommands, originalInteraction.client);

		// Update state with new pages
		state.pages = allCommandEmbeds;
		state.currentPage = 0;
		state.initialComponents = [createHelpTypeRow()];

		originalInteraction.client.helpMenuState.set(messageId, state);

		await i.update({
			embeds: [allCommandEmbeds[0]],
			components: [
				createHelpTypeRow(),
				...(allCommandEmbeds.length > 1 ? [createNavigationRow(0, allCommandEmbeds.length)] : [])
			],
		});
	}
	else if (i.customId === 'help_stats') {
		// Show bot statistics
		const statsEmbed = createBotStatsEmbed(originalInteraction.client);

		// Update state
		state.pages = [statsEmbed];
		state.currentPage = 0;
		state.initialComponents = [createHelpTypeRow()];

		originalInteraction.client.helpMenuState.set(messageId, state);

		await i.update({
			embeds: [statsEmbed],
			components: [createHelpTypeRow()],
		});
	}
	else if (i.customId === 'help_support') {
		// Show support information
		const supportEmbed = createSupportEmbed(originalInteraction.client);

		// Update state
		state.pages = [supportEmbed];
		state.currentPage = 0;
		state.initialComponents = [createHelpTypeRow()];

		originalInteraction.client.helpMenuState.set(messageId, state);

		await i.update({
			embeds: [supportEmbed],
			components: [createHelpTypeRow()],
		});
	}
	else if (i.customId === 'help_close') {
		// Create a closed embed that shows the menu was dismissed
		const closedEmbed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setDescription('Help menu closed. Use `/help` again if you need assistance.')
			.setFooter({ text: 'Menu dismissed by user' });

		// Update the message with the closed embed and no components
		await i.update({
			embeds: [closedEmbed],
			components: []
		});

		// Clean up the help menu state
		originalInteraction.client.helpMenuState.delete(messageId);

		// Return early as we don't need to save state
		return;
	}

	// Save the updated state
	originalInteraction.client.helpMenuState.set(messageId, state);
}

// Helper function to create navigation row for pagination
function createNavigationRow(currentPage, totalPages) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('prev')
			.setEmoji('◀️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === 0),
		new ButtonBuilder()
			.setCustomId('page_indicator')
			.setLabel(`Page ${currentPage + 1} of ${totalPages}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder()
			.setCustomId('next')
			.setEmoji('▶️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(currentPage === totalPages - 1),
	);
}

// NEW: Create category selection dropdown menu
function createCategoryMenuRow(categories) {
	// Prepare select menu with each category as an option
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('category_select')
		.setPlaceholder('Select a command category')
		.setMaxValues(1)
		.setMinValues(1);

	// Add each category as an option with proper formatting and emoji
	categories.forEach(category => {
		selectMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(category.charAt(0).toUpperCase() + category.slice(1))
				.setValue(category)
				.setDescription(`View all ${category} commands`)
				.setEmoji(getCategoryEmoji(category))
		);
	});

	return new ActionRowBuilder().addComponents(selectMenu);
}

// NEW: Create help type button row
function createHelpTypeRow() {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('help_home')
			.setLabel('Home')
			.setEmoji('🏠')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId('help_commands')
			.setLabel('All Commands')
			.setEmoji('📋')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId('help_stats')
			.setLabel('Bot Stats')
			.setEmoji('📊')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('help_support')
			.setLabel('Support')
			.setEmoji('❓')
			.setStyle(ButtonStyle.Danger),
		new ButtonBuilder()
			.setCustomId('help_close')
			.setLabel('Close')
			.setEmoji('✖️')
			.setStyle(ButtonStyle.Secondary),
	);
}

// Function to create main help embed (enhanced with more info)
function createMainHelpEmbed(client, organizedCommands) {
	const totalCommands = Array.from(client.commands.values()).length;
	const categories = Object.keys(organizedCommands);
	const commandCounts = getCommandCountByCategory(organizedCommands);

	// Get server count (if available)
	const serverCount = client.guilds?.cache?.size || 'N/A';

	// Get uptime
	const uptime = formatUptime(client.uptime);

	return new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setAuthor({ name: `${client.user.username} Help Center`, iconURL: client.user.displayAvatarURL() })
		.setTitle('Interactive Help System')
		.setDescription(
			`Welcome to the interactive help menu! Here you can explore all available commands and features.\n\n` +
			`**Key Statistics:**\n` +
			`• **Commands:** ${totalCommands} commands across ${categories.length} categories\n` +
			`• **Servers:** Currently serving ${serverCount} Discord servers\n` +
			`• **Uptime:** ${uptime}\n\n` +
			`Use the buttons below to explore different sections of the help system or select a specific category from the dropdown menu.`
		)
		.addFields({
			name: '📚 Available Categories',
			value: categories.map(category =>
				`${getCategoryEmoji(category)} **${category.charAt(0).toUpperCase() + category.slice(1)}** (${commandCounts[category]} commands)`
			).join('\n'),
			inline: false
		})
		.addFields({
			name: '🔍 Need Help with a Specific Command?',
			value: 'Use `/help command:[command name]` to get detailed information about any command.',
			inline: false
		})
		.setFooter({ text: THEME.FOOTER_TEXT })
		.setTimestamp();
}

// NEW: Format uptime function
function formatUptime(ms) {
	if (!ms) return 'Unknown';

	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
	if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

// Function to create embeds for category command listing (enhanced with examples)
function createCategoryCommandEmbeds(categoryName, categoryCommands, client) {
	const pages = [];
	const itemsPerPage = THEME.ITEMS_PER_PAGE;
	const emoji = getCategoryEmoji(categoryName);
	const categoryTitle = `${emoji} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Commands`;

	// Sort commands alphabetically
	categoryCommands.sort((a, b) => a.data.name.localeCompare(b.data.name));

	for (let i = 0; i < categoryCommands.length; i += itemsPerPage) {
		const pageCommands = categoryCommands.slice(i, i + itemsPerPage);
		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle(categoryTitle)
			.setDescription(`Here are the commands in the **${categoryName}** category. Select any command with \`/help command:[name]\` for more details.`)
			.setThumbnail(client.user.displayAvatarURL());

		// Add each command with more detailed formatting
		pageCommands.forEach(cmd => {
			embed.addFields({
				name: `/${cmd.data.name}`,
				value: `${cmd.data.description || 'No description provided.'}\n` +
					`${cmd.usage ? `**Usage:** \`${cmd.usage}\`` : ''}` +
					`${cmd.examples && cmd.examples.length ? `\n**Example:** \`${cmd.examples[0]}\`` : ''}`,
				inline: false
			});
		});

		embed.setFooter({ text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(categoryCommands.length / itemsPerPage)}` });
		pages.push(embed);
	}

	// If no commands found
	if (pages.length === 0) {
		pages.push(
			new EmbedBuilder()
				.setColor(THEME.COLOR)
				.setTitle(categoryTitle)
				.setDescription(`There are currently no commands in the **${categoryName}** category.`)
		);
	}

	return pages;
}

// NEW: Create all commands embeds
function createAllCommandsEmbeds(commands, client) {
	const pages = [];
	const itemsPerPage = 15; // More commands per page for this view

	// Sort commands alphabetically
	commands.sort((a, b) => a.data.name.localeCompare(b.data.name));

	for (let i = 0; i < commands.length; i += itemsPerPage) {
		const pageCommands = commands.slice(i, i + itemsPerPage);
		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle('All Bot Commands')
			.setDescription(`Below is a list of all available commands. Use \`/help command:[name]\` for detailed information about any command.`)
			.setThumbnail(client.user.displayAvatarURL());

		// Add compact command listing
		embed.addFields({
			name: 'Available Commands',
			value: pageCommands
				.map(cmd => {
					const emoji = getCategoryEmoji(cmd.category);
					return `${emoji} \`/${cmd.data.name}\` - ${cmd.data.description?.substring(0, 50) || 'No description'}${cmd.data.description?.length > 50 ? '...' : ''}`;
				})
				.join('\n'),
			inline: false
		});

		embed.setFooter({ text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(commands.length / itemsPerPage)} • Total: ${commands.length} commands` });
		pages.push(embed);
	}

	return pages;
}

// NEW: Create bot stats embed with enhanced statistics
function createBotStatsEmbed(client) {
	// Calculate basic stats
	const serverCount = client.guilds?.cache?.size || 'N/A';
	const channelCount = client.channels?.cache?.size || 'N/A';
	const userCount = client.users?.cache?.size || 'N/A';
	const uptime = formatUptime(client.uptime);
	const commandCount = client.commands?.size || 'N/A';

	// Calculate more detailed stats
	const textChannelCount = client.channels?.cache?.filter(c => c.type === 0).size || 'N/A';
	const voiceChannelCount = client.channels?.cache?.filter(c => c.type === 2).size || 'N/A';
	const categoryCount = client.channels?.cache?.filter(c => c.type === 4).size || 'N/A';

	// Calculate bot age
	const botAge = formatBotAge(client.user.createdTimestamp);

	// Get system metrics
	const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
	const totalMemory = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);
	const cpuUsage = process.cpuUsage();
	const cpuUsagePercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

	// Get platform details
	const platform = process.platform;
	const arch = process.arch;

	// Get Discord.js and Node.js versions
	const djsVersion = require('discord.js').version || 'Unknown';
	const nodeVersion = process.version;

	return new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setTitle('Bot Statistics')
		.setThumbnail(client.user.displayAvatarURL())
		.addFields([
			{
				name: '🤖 Bot Information',
				value: `• **Name:** ${client.user.username}\n` +
					`• **ID:** \`${client.user.id}\`\n` +
					`• **Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R> (${botAge})\n` +
					`• **Commands:** ${commandCount}\n` +
					`• **Uptime:** ${uptime}`,
				inline: false
			},
			{
				name: '📊 Usage Statistics',
				value: `• **Servers:** ${serverCount}\n` +
					`• **Users:** ${userCount}\n` +
					`• **Channels:** ${channelCount} total\n` +
					`  ↳ ${textChannelCount} text | ${voiceChannelCount} voice | ${categoryCount} categories`,
				inline: true
			},
			{
				name: '🛠️ Technical Details',
				value: `• **Node.js:** ${nodeVersion}\n` +
					`• **Discord.js:** v${djsVersion}\n` +
					`• **Platform:** ${formatPlatform(platform)} (${arch})\n` +
					`• **Ping:** ${client.ws.ping || 'N/A'} ms`,
				inline: true
			},
			{
				name: '💻 System Resources',
				value: `• **Memory Usage:** ${memoryUsage} MB / ${totalMemory} MB\n` +
					`• **CPU Usage:** ${cpuUsagePercent}ms\n` +
					`• **Process PID:** ${process.pid}`,
				inline: false
			}
		])
		.setFooter({ text: 'Bot statistics are updated in real-time • Last refreshed' })
		.setTimestamp();
}

// Helper function to format bot age in a readable way
function formatBotAge(timestamp) {
	const now = Date.now();
	const diff = now - timestamp;

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) {
		return `${years} year${years !== 1 ? 's' : ''}, ${months % 12} month${months % 12 !== 1 ? 's' : ''}`;
	} else if (months > 0) {
		return `${months} month${months !== 1 ? 's' : ''}, ${days % 30} day${days % 30 !== 1 ? 's' : ''}`;
	} else {
		return `${days} day${days !== 1 ? 's' : ''}`;
	}
}

// Helper function to format platform names nicely
function formatPlatform(platform) {
	const platforms = {
		'win32': 'Windows',
		'darwin': 'macOS',
		'linux': 'Linux',
		'freebsd': 'FreeBSD',
		'openbsd': 'OpenBSD',
		'sunos': 'SunOS',
		'aix': 'AIX'
	};

	return platforms[platform] || platform;
}

// NEW: Create support embed
function createSupportEmbed(client) {
	return new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setTitle('Support Information')
		.setDescription(`Need help with ${client.user.username}? Here's how to get support and additional resources.`)
		.addFields([
			{ name: '📚 Documentation', value: 'Check out our documentation for detailed guides and tutorials on how to use all features.', inline: false },
			{
				name: '🔗 Useful Links', value:
					`• [Support Server](${THEME.SUPPORT_SERVER})\n` +
					`• [Invite Bot](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)\n` +
					`• [GitHub Repository](https://github.com/yourusername/yourrepo)\n` +
					`• [Report a Bug](${THEME.SUPPORT_SERVER})`, inline: false
			},
			{ name: '📞 Direct Support', value: 'Join our support server and open a ticket in the #support channel to get help from our team.', inline: false },
			{ name: '🤔 Frequently Asked Questions', value: 'Most common questions are answered in the #faq channel of our support server.', inline: false }
		])
		.setFooter({ text: 'Thank you for using our bot!' })
		.setTimestamp();
}

// Function to create embed for command details (enhanced with permission details)
function createCommandDetailEmbed(command, client) {
	const embed = new EmbedBuilder()
		.setColor(THEME.COLOR)
		.setTitle(`\`/${command.data.name}\` Command Details`)
		.setDescription(command.description_full || command.data.description || '*No detailed description provided.*')
		.addFields([
			{ name: 'Category', value: command.category ? `${getCategoryEmoji(command.category)} ${command.category}` : 'Core', inline: true }, // Default to 'Core' if no category
			{ name: 'Usage', value: `\`${command.usage || `/${command.data.name}`}\``, inline: true },
		])
		.setFooter({ text: 'For general help, use /help without any arguments' });

	// Add permissions with more details
	if (command.permissions && command.permissions.length) {
		embed.addFields({
			name: '🔑 Required Permissions',
			value: formatPermissions(command.permissions),
			inline: false
		});
	}

	// Add examples with better formatting
	if (command.examples && command.examples.length > 0) {
		embed.addFields({
			name: '📝 Examples',
			value: command.examples.map(ex => `• \`${ex}\``).join('\n'),
			inline: false
		});
	}

	// Add options/parameters if available
	const options = command.data.options;
	if (options && options.length > 0) {
		embed.addFields({
			name: '⚙️ Options',
			value: options.map(opt => {
				const required = opt.required ? '(Required)' : '(Optional)';
				return `• \`${opt.name}\`: ${opt.description} ${required}`;
			}).join('\n'),
			inline: false
		});
	}

	// Add cooldown if applicable
	if (command.cooldown) {
		embed.addFields({
			name: '⏱️ Cooldown',
			value: `${command.cooldown} seconds`,
			inline: true
		});
	}

	return embed;
}

// NEW: Format permissions for better readability
function formatPermissions(permissions) {
	if (!permissions || permissions.length === 0) return 'None required';

	// Map raw permission strings to more readable formats
	const readablePermissions = {
		ADMINISTRATOR: 'Administrator',
		MANAGE_GUILD: 'Manage Server',
		MANAGE_ROLES: 'Manage Roles',
		MANAGE_CHANNELS: 'Manage Channels',
		KICK_MEMBERS: 'Kick Members',
		BAN_MEMBERS: 'Ban Members',
		MODERATE_MEMBERS: 'Moderate Members (Timeout)',
		// Add more mappings as needed
	};

	return permissions.map(perm => {
		return readablePermissions[perm] || perm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
	}).join(', ');
}

// Function to create embeds for search results (improved layout)
function createSearchEmbeds(results, searchQuery, client) {
	const pages = [];
	const itemsPerPage = THEME.ITEMS_PER_PAGE;

	// Sort results alphabetically
	results.sort((a, b) => a.data.name.localeCompare(b.data.name));

	for (let i = 0; i < results.length; i += itemsPerPage) {
		const pageResults = results.slice(i, i + itemsPerPage);
		const embed = new EmbedBuilder()
			.setColor(THEME.COLOR)
			.setTitle(`Search Results for "${searchQuery}"`)
			.setDescription(`Found ${results.length} commands matching your search. Use \`/help command:[name]\` to see detailed information for any command.`)
			.setThumbnail(client.user.displayAvatarURL());

		// Add each result with category info and formatting
		pageResults.forEach(cmd => {
			embed.addFields({
				name: `${getCategoryEmoji(cmd.category || 'core')} /${cmd.data.name}`, // Default to 'core' if no category
				value: `**Category:** ${cmd.category || 'Core'}\n` + // Default to 'Core' if no category
					`**Description:** ${cmd.data.description || 'No description.'}\n` +
					`**Usage:** \`${cmd.usage || `/${cmd.data.name}`}\``,
				inline: false
			});
		});

		embed.setFooter({ text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(results.length / itemsPerPage)}` });
		pages.push(embed);
	}
	return pages;
}

// Add this function to dynamically build command data
function buildCommandData(client = null) {
	// Use the predefined categories
	const categories = ['core', 'customization', 'entertainment', 'information', 'interaction', 'management'];

	const categoryChoices = categories.map(category => ({
		name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
		value: category,
	}));

	return new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays interactive help information for bot commands and features.')
		.addStringOption(option => option.setName('command').setDescription('Get details for a specific command.'))
		.addStringOption(option =>
			option.setName('category')
				.setDescription('View commands within a specific category.')
				.setRequired(false)
				.addChoices(...categoryChoices)
		)
		.addStringOption(option => option.setName('search').setDescription('Search for commands by keyword.'));
}

module.exports = {
	// Initialize with empty data that will be replaced during load
	data: buildCommandData(),

	// Method to refresh command data with current categories
	refreshData(client) {
		this.data = buildCommandData(client);
		return this.data;
	},

	category: 'information', // Changed help command category to 'information' as it provides info
	usage: '/help [command:command-name] [category:category-name] [search:keyword]',
	description_full: 'The help command provides an interactive menu system for exploring all bot commands and features. You can view commands by category, search for specific functionality, or get detailed information about any command. The help system includes bot statistics, support resources, and easy navigation between different sections.',
	examples: [
		'/help',
		'/help command:ping',
		'/help category:entertainment', // Example category changed to 'entertainment'
		'/help search:roles'
	],

	async execute(interaction) {
		try {
			const { client } = interaction;
			const commandName = interaction.options.getString('command');
			const categoryName = interaction.options.getString('category');
			const searchQuery = interaction.options.getString('search');

			const commands = client.commands;

			// Use predefined categories and update emoji mapping
			const categories = ['core', 'customization', 'entertainment', 'information', 'interaction', 'management'];
			updateCategoryEmojis(categories);
			const organizedCategories = organizeCommandsByCategory(commands);


			if (commandName) {
				// Find the command by name
				const command = commands.get(commandName) ||
					Array.from(commands.values()).find(
						cmd => cmd.data && cmd.data.name.toLowerCase() === commandName.toLowerCase()
					);

				if (!command) {
					return interaction.reply({
						content: `⚠️ No command found with name \`${commandName}\`. Use \`/help\` without arguments to see all available commands.`,
						ephemeral: true
					});
				}

				// Create and display the command detail embed
				const commandEmbed = createCommandDetailEmbed(command, client);
				return interaction.reply({ embeds: [commandEmbed] });
			}

			if (categoryName) {
				// Filter commands by the requested category
				const categoryCommands = organizedCategories[categoryName.toLowerCase()];

				if (!categoryCommands || categoryCommands.length === 0) {
					return interaction.reply({
						content: `⚠️ No commands found in the \`${categoryName}\` category. Use \`/help\` without arguments to see all available categories.`,
						ephemeral: true
					});
				}

				// Create and display paginated embeds for the category
				const categoryEmbeds = createCategoryCommandEmbeds(categoryName, categoryCommands, client);
				return createPaginatedMenu(interaction, categoryEmbeds, [createHelpTypeRow()]);
			}

			if (searchQuery) {
				// Search for commands matching the query
				const results = Array.from(commands.values()).filter(cmd => {
					const name = cmd.data?.name || '';
					const description = cmd.data?.description || cmd.description_full || '';
					const usage = cmd.usage || '';
					const examples = Array.isArray(cmd.examples) ? cmd.examples.join(' ') : '';
					const category = cmd.category || 'core'; // Default to 'core' for search

					const searchString = `${name} ${description} ${usage} ${examples} ${category}`.toLowerCase();
					return searchString.includes(searchQuery.toLowerCase());
				});

				if (!results.length) {
					return interaction.reply({
						content: `⚠️ No commands found matching \`${searchQuery}\`. Try a different search term or use \`/help\` without arguments to browse all commands.`,
						ephemeral: true
					});
				}

				// Create and display paginated embeds for search results
				const searchEmbeds = createSearchEmbeds(results, searchQuery, client);
				return createPaginatedMenu(interaction, searchEmbeds, [createHelpTypeRow()]);
			}

			// Default Help Menu (No options provided)
			const organizedCommands = organizeCommandsByCategory(commands);
			const mainHelpEmbed = createMainHelpEmbed(client, organizedCommands);

			// Create the rows of components for the main help menu
			const helpTypeRow = createHelpTypeRow();
			const categoryMenuRow = createCategoryMenuRow(Object.keys(organizedCommands));

			// Send the interactive help menu
			const helpPages = [mainHelpEmbed];
			const helpSessionId = await createPaginatedMenu(
				interaction,
				helpPages,
				[helpTypeRow, categoryMenuRow]
			);

			// Initialize help session tracking if needed
			if (!client.helpCollectors) {
				client.helpCollectors = new Map();
			}

			// Store session ID for this user
			client.helpCollectors.set(interaction.user.id, helpSessionId);

			// Set up the global interaction handler only once
			if (!client.helpInteractionHandler) {
				// Create a single reusable handler function
				client.helpInteractionHandler = async (buttonInteraction) => {
					// Skip if not a button or select menu interaction
					if (!buttonInteraction.isButton() && !buttonInteraction.isStringSelectMenu()) return;

					// Get the user's active help session
					const sessionId = client.helpCollectors.get(buttonInteraction.user.id);
					if (!sessionId) return;

					// Get the state for this help session
					const state = client.helpMenuState.get(sessionId);
					if (!state) return;

					// Only handle if the interaction is from the help menu user
					if (buttonInteraction.user.id !== state.userId) return;

					// Process the help menu interaction
					await handleHelpInteraction(buttonInteraction, interaction, sessionId);
				};

				// Register the handler once
				client.on('interactionCreate', client.helpInteractionHandler);

				// Optional: Set up a cleanup interval to prevent memory leaks
				if (!client.helpMenuCleanupInterval) {
					client.helpMenuCleanupInterval = setInterval(() => {
						const now = Date.now();

						// Clean up expired help sessions
						client.helpMenuState?.forEach((state, id) => {
							if (now - state.createdAt > THEME.TIMEOUT_MS) {
								client.helpMenuState.delete(id);

								// Also remove from collectors map
								for (const [userId, sessionId] of client.helpCollectors.entries()) {
									if (sessionId === id) {
										client.helpCollectors.delete(userId);
									}
								}
							}
						});
					}, 60000); // Check every minute
				}
			}
		} catch (error) {
			handleError(interaction, error);
		}
	},
}