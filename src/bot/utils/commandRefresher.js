const fs = require('fs');
const path = require('path');
const Logger = require('../../../logger').default;

/**
 * CommandRefresher watches command files for changes and automatically reloads them
 * This is particularly useful during development
 */
class CommandRefresher {
	constructor(client, commandsDir) {
		this.client = client;
		this.commandsDir = commandsDir;
		this.watchers = new Map();
		this.isWatching = false;
		this.lastReload = new Map();
		this.debounceTime = 1000; // Debounce reload calls by this many ms
	}

	/**
	 * Initialize the command refresher
	 *
	 * @param {Client} client - The Discord.js client
	 * @param {string} commandsDir - Path to the commands directory
	 * @returns {CommandRefresher} The command refresher instance
	 */
	static init(client, commandsDir) {
		const refresher = new CommandRefresher(client, commandsDir);
		return refresher;
	}

	/**
	 * Start watching command files for changes
	 *
	 * @param {boolean} recursive - Whether to watch subdirectories recursively
	 * @returns {CommandRefresher} The command refresher instance for chaining
	 */
	startWatching(recursive = true) {
		if (this.isWatching) return this;

		Logger.log('DEVELOPMENT', 'Starting command file watcher', 'info');
		this._watchDirectory(this.commandsDir, recursive);
		this.isWatching = true;

		return this;
	}

	/**
	 * Watch a directory for file changes
	 *
	 * @param {string} dir - Directory to watch
	 * @param {boolean} recursive - Whether to watch subdirectories
	 * @private
	 */
	_watchDirectory(dir, recursive) {
		try {
			// Check if directory exists
			if (!fs.existsSync(dir)) {
				Logger.log('WATCHER', `Directory does not exist: ${dir}`, 'warning');
				return;
			}

			// Watch the directory itself
			const watcher = fs.watch(dir, (eventType, filename) => {
				if (!filename) return;

				const fullPath = path.join(dir, filename);

				// Check if it's a JS file
				if (filename.endsWith('.js')) {
					this._handleFileChange(fullPath);
				}
			});

			this.watchers.set(dir, watcher);

			// If recursive, watch subdirectories too
			if (recursive) {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					if (entry.isDirectory()) {
						const subdir = path.join(dir, entry.name);
						this._watchDirectory(subdir, recursive);
					}
				}
			}
		} catch (error) {
			Logger.log('WATCHER', `Error watching directory ${dir}: ${error.message}`, 'error');
		}
	}

	/**
	 * Handle file change events
	 *
	 * @param {string} filePath - Path to the changed file
	 * @private
	 */
	_handleFileChange(filePath) {
		try {
			// Ensure the file still exists
			if (!fs.existsSync(filePath)) return;

			// Debounce reloads to prevent multiple reloads for the same file
			const now = Date.now();
			if (this.lastReload.has(filePath)) {
				const lastTime = this.lastReload.get(filePath);
				if (now - lastTime < this.debounceTime) {
					return;
				}
			}

			this.lastReload.set(filePath, now);

			// Get the command name from the file path
			const commandName = this._getCommandNameFromPath(filePath);
			if (!commandName) return;

			// Reload the command
			this._reloadCommand(filePath, commandName);
		} catch (error) {
			Logger.log(
				'WATCHER',
				`Error handling file change for ${filePath}: ${error.message}`,
				'error',
			);
		}
	}

	/**
	 * Get the command name from a file path
	 *
	 * @param {string} filePath - Path to the command file
	 * @returns {string|null} The command name or null if not found
	 * @private
	 */
	_getCommandNameFromPath(filePath) {
		try {
			// Clear require cache for this file
			delete require.cache[require.resolve(filePath)];

			// Require the command file
			const command = require(filePath);

			// Check if it's a valid command
			if (command && command.data && command.data.name) {
				return command.data.name;
			}

			return null;
		} catch (error) {
			Logger.log(
				'WATCHER',
				`Error getting command name from ${filePath}: ${error.message}`,
				'warning',
			);
			return null;
		}
	}

	/**
	 * Reload a command from its file
	 *
	 * @param {string} filePath - Path to the command file
	 * @param {string} commandName - Name of the command
	 * @private
	 */
	_reloadCommand(filePath, commandName) {
		try {
			// Load the command
			const command = require(filePath);

			// Update the command in the collection
			this.client.commands.set(commandName, command);

			// Update aliases if any
			if (command.data.aliases && Array.isArray(command.data.aliases)) {
				// Remove old aliases that might point to this command
				for (const [alias, cmdName] of this.client.aliases.entries()) {
					if (cmdName === commandName) {
						this.client.aliases.delete(alias);
					}
				}

				// Add new aliases
				for (const alias of command.data.aliases) {
					this.client.aliases.set(alias, commandName);
				}
			}

			Logger.log('DEVELOPMENT', `Reloaded command: ${commandName}`, 'success');
		} catch (error) {
			Logger.log(
				'WATCHER',
				`Error reloading command ${commandName}: ${error.message}`,
				'error',
			);
		}
	}

	/**
	 * Stop watching command files
	 */
	stopWatching() {
		if (!this.isWatching) return;

		Logger.log('DEVELOPMENT', 'Stopping command file watcher', 'info');

		// Close all watchers
		for (const [dir, watcher] of this.watchers.entries()) {
			watcher.close();
		}

		this.watchers.clear();
		this.isWatching = false;
	}

	/**
	 * Manually reload a specific command
	 *
	 * @param {string} commandName - Name of the command to reload
	 * @returns {boolean} Whether the reload was successful
	 */
	reloadCommand(commandName) {
		try {
			// Find the command file
			const command = this.client.commands.get(commandName);
			if (!command) {
				Logger.log('DEVELOPMENT', `Command not found: ${commandName}`, 'warning');
				return false;
			}

			// Find the file path
			const commandFile = this._findCommandFile(this.commandsDir, commandName);
			if (!commandFile) {
				Logger.log('DEVELOPMENT', `Command file not found for: ${commandName}`, 'warning');
				return false;
			}

			// Reload the command
			this._reloadCommand(commandFile, commandName);
			return true;
		} catch (error) {
			Logger.log(
				'DEVELOPMENT',
				`Error reloading command ${commandName}: ${error.message}`,
				'error',
			);
			return false;
		}
	}

	/**
	 * Find a command file by its name
	 *
	 * @param {string} dir - Directory to search in
	 * @param {string} commandName - Name of the command
	 * @returns {string|null} Path to the command file or null if not found
	 * @private
	 */
	_findCommandFile(dir, commandName) {
		try {
			// Check if directory exists
			if (!fs.existsSync(dir)) return null;

			const entries = fs.readdirSync(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					// Recursively search subdirectories
					const result = this._findCommandFile(fullPath, commandName);
					if (result) return result;
				} else if (entry.isFile() && entry.name.endsWith('.js')) {
					// Check if this is the command file
					try {
						delete require.cache[require.resolve(fullPath)];
						const command = require(fullPath);

						if (command && command.data && command.data.name === commandName) {
							return fullPath;
						}
					} catch (error) {
						// Skip invalid files
					}
				}
			}

			return null;
		} catch (error) {
			Logger.log('WATCHER', `Error finding command file: ${error.message}`, 'error');
			return null;
		}
	}
}

module.exports = CommandRefresher;
