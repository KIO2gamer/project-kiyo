// Add this code where you load commands - exact location depends on your existing code

// After loading all commands and before registering them with Discord:
function updateDynamicCommands(client) {
    // If the help command exists, update its category choices
    const helpCommand = client.commands.get('help');
    if (helpCommand && typeof helpCommand.refreshData === 'function') {
        // Get all categories from loaded commands
        const categories = [...new Set(
            Array.from(client.commands.values())
                .map(cmd => cmd.category?.toLowerCase() || 'general')
        )];
        
        // Update the help command with current categories
        helpCommand.refreshData(categories);
        console.log(`Updated help command with ${categories.length} categories`);
    }
}

// Call this function after loading all commands but before registering them
