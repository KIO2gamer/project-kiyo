// Load environment variables
require('dotenv').config();
const { handleError } = require('./bot/utils/errorHandler');
const Logger = require('./../logger');

// Start tracking startup time
const startTime = process.hrtime();

// Import dependencies
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} = require('discord.js');

// Configuration module
const config = {
  // Environment Variables with validation and defaults
  clientId: process.env.DISCORD_CLIENT_ID,
  token: process.env.DISCORD_TOKEN,
  mongoUri: process.env.MONGODB_URI,
  guildIds: process.env.DISCORD_GUILD_IDS?.split(',').filter(Boolean) || [],
  environment: process.env.NODE_ENV || 'development',
  
  // Application paths
  paths: {
    commands: path.join(__dirname, 'bot/commands'),
    events: path.join(__dirname, 'bot/events'),
    database: path.join(__dirname, 'database'),
  },
  
  // Validate essential configuration
  validate() {
    const missing = [];
    if (!this.token) missing.push('DISCORD_TOKEN');
    if (!this.clientId) missing.push('DISCORD_CLIENT_ID');
    if (!this.mongoUri) missing.push('MONGODB_URI');
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (this.guildIds.length === 0) {
      Logger.warning('CONFIG', 'No guild IDs provided. Commands will not be registered to any servers.');
    }
    
    return this;
  }
};

// Validate configuration before proceeding
try {
  config.validate();
} catch (error) {
  Logger.error('CONFIG', error.message);
  process.exit(1);
}

Logger.log('BOT', 'Initializing...', 'info');

// Create Discord client with optimized intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  // Performance optimizations
  makeCache: Options => {
    const defaults = Options.defaultMakeCacheSettings;
    return {
      ...defaults,
      MessageManager: {
        maxSize: 100, // Cache fewer messages
        sweepInterval: 60, // Clean up cache more frequently (in seconds)
      },
      GuildMemberManager: {
        maxSize: 200, // Limit member cache size
      }
    };
  },
  // Reduce the number of presence updates received
  presence: {
    status: 'online'
  }
});

// Initialize collections
client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.commandStats = {
  usageCount: 0,
  categoryCounts: new Map(),
  lastUsed: new Map()
};

// Track startup metrics
client.startup = {
  time: Date.now(),
  commandsLoaded: 0,
  eventsLoaded: 0,
  errors: 0
};

/**
 * File System Utilities
 */
const FileLoader = {
  /**
   * Safely reads directory contents
   * @param {string} dir - Directory to read
   * @returns {string[]} Array of file names or empty array on error
   */
  readDirSync(dir) {
    try {
      return fs.readdirSync(dir);
    } catch (error) {
      Logger.warning('FILES', `Cannot read directory ${dir}: ${error.message}`);
      return [];
    }
  },
  
  /**
   * Recursively loads files from a directory applying a callback to each file
   * @param {string} dir - Directory to process
   * @param {Function} callback - Function to apply to each file path
   */
  loadFiles(dir, callback) {
    if (!fs.existsSync(dir)) {
      Logger.warning('FILES', `Directory does not exist: ${dir}`);
      return;
    }
    
    const processFile = (filePath) => {
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.loadFiles(filePath, callback);
          return;
        }
        
        if (filePath.endsWith('.js')) {
          callback(filePath);
        }
      } catch (error) {
        Logger.warning('FILES', `Error processing ${filePath}: ${error.message}`);
      }
    };
    
    this.readDirSync(dir)
      .map(file => path.join(dir, file))
      .forEach(processFile);
  },
  
  /**
   * Safely requires a module with error handling
   * @param {string} filePath - Path to the module
   * @returns {Object|null} The module or null if there was an error
   */
  safeRequire(filePath) {
    try {
      // Clear cache to ensure we get fresh modules during development
      if (config.environment === 'development') {
        delete require.cache[require.resolve(filePath)];
      }
      return require(filePath);
    } catch (error) {
      Logger.warning('FILES', `Failed to load ${filePath}: ${error.message}`);
      client.startup.errors++;
      return null;
    }
  }
};

/**
 * Command Management
 */
const CommandManager = {
  /**
   * Loads command modules from a directory
   * @param {string} dir - Directory containing command modules
   */
  loadCommands(dir) {
    Logger.log('COMMANDS', 'Loading command modules', 'info');
    
    FileLoader.loadFiles(dir, (filePath) => {
      const command = FileLoader.safeRequire(filePath);
      
      if (!command) return;
      
      if (command?.data?.name && command.execute) {
        client.commands.set(command.data.name, command);
        
        // Register command aliases if any
        if (command.data.aliases && Array.isArray(command.data.aliases)) {
          command.data.aliases.forEach(alias => {
            client.aliases.set(alias, command.data.name);
          });
        }
        
        // Count loaded categories for stats
        const category = command.category || 'uncategorized';
        if (!client.commandStats.categoryCounts.has(category)) {
          client.commandStats.categoryCounts.set(category, 0);
        }
        client.commandStats.categoryCounts.set(
          category, 
          client.commandStats.categoryCounts.get(category) + 1
        );
        
        client.startup.commandsLoaded++;
      } else {
        Logger.warning('COMMANDS', `Invalid command structure in ${filePath}`);
      }
    });
    
    Logger.success('COMMANDS', `Loaded ${client.startup.commandsLoaded} command modules`);
    
    // Refresh the help command if it exists
    this.refreshHelpCommand();
  },
  
  /**
   * Updates the help command with current categories and commands
   */
  refreshHelpCommand() {
    const helpCommand = client.commands.get('help');
    if (helpCommand && typeof helpCommand.refreshData === 'function') {
      try {
        helpCommand.refreshData(client);
        Logger.info('COMMANDS', 'Help command categories refreshed');
      } catch (error) {
        Logger.warning('COMMANDS', `Failed to refresh help command: ${error.message}`);
      }
    }
  },
  
  /**
   * Deploys commands to Discord API
   * @returns {Promise<void>}
   */
  async deployCommands() {
    Logger.info('DEPLOY', 'Preparing command deployment');
    
    // Collect command data
    const commands = [];
    client.commands.forEach(cmd => {
      if (cmd.data && typeof cmd.data.toJSON === 'function') {
        commands.push(cmd.data.toJSON());
      }
    });
    
    Logger.info('DEPLOY', `Deploying ${commands.length} commands`);
    
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
      // Clear global commands first for clean state
      await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
      
      // Deploy to each guild in parallel
      if (config.guildIds.length > 0) {
        const deploymentPromises = config.guildIds.map(guildId =>
          this.deployToGuild(rest, guildId, commands)
        );
        
        await Promise.all(deploymentPromises);
        Logger.success('DEPLOY', 'Command deployment complete');
      } else {
        Logger.warning('DEPLOY', 'No guild IDs provided for command deployment');
      }
    } catch (error) {
      Logger.error('DEPLOY', `Command deployment failed: ${error.message}`);
      throw error; // Propagate error for higher-level handling
    }
  },
  
  /**
   * Deploy commands to a specific guild
   * @param {REST} rest - Discord REST client
   * @param {string} guildId - Target guild ID
   * @param {Object[]} commands - Command data objects
   * @returns {Promise<void>}
   */
  async deployToGuild(rest, guildId, commands) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commands }
      );
      Logger.success('DEPLOY', `Deployed ${commands.length} commands to guild ${guildId}`);
    } catch (error) {
      Logger.error('DEPLOY', `Failed to deploy to guild ${guildId}: ${error.message}`);
      // Don't throw, continue with other guilds
    }
  }
};

/**
 * Event Management
 */
const EventManager = {
  /**
   * Loads event handlers from a directory
   * @param {string} dir - Directory containing event handlers
   */
  loadEvents(dir) {
    Logger.info('EVENTS', 'Loading event handlers');
    
    FileLoader.loadFiles(dir, (filePath) => {
      const event = FileLoader.safeRequire(filePath);
      
      if (!event || !event.name) return;
      
      const execute = (...args) => {
        try {
          event.execute(...args);
        } catch (error) {
          Logger.error('EVENTS', `Error in ${event.name} event: ${error.message}`);
          handleError(`Error in ${event.name} event handler:`, error);
        }
      };
      
      if (event.once) {
        client.once(event.name, execute);
      } else {
        client.on(event.name, execute);
      }
      
      client.startup.eventsLoaded++;
    });
    
    Logger.success('EVENTS', `Loaded ${client.startup.eventsLoaded} event handlers`);
  }
};

/**
 * Database Management
 */
const DatabaseManager = {
  /**
   * Connect to MongoDB database
   * @returns {Promise<void>}
   */
  async connect() {
    Logger.info('DATABASE', 'Establishing connection to MongoDB');
    
    try {
      mongoose.set('strictQuery', false);
      
      // Enhanced MongoDB connection options
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000, // Fail fast on connection issues
        maxPoolSize: 10, // Limit connection pool for better resource usage
      });
      
      Logger.success('DATABASE', 'MongoDB connection established');
      
      // Set up connection event handlers
      mongoose.connection.on('error', error => {
        Logger.error('DATABASE', `Connection error: ${error.message}`);
      });
      
      mongoose.connection.on('disconnected', () => {
        Logger.warning('DATABASE', 'MongoDB disconnected, attempting to reconnect');
      });
      
      mongoose.connection.on('reconnected', () => {
        Logger.success('DATABASE', 'MongoDB reconnection successful');
      });
      
    } catch (error) {
      Logger.error('DATABASE', `Failed to connect to MongoDB: ${error.message}`);
      throw error; // Propagate error for higher-level handling
    }
  },
  
  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      Logger.info('DATABASE', 'MongoDB connection closed');
    }
  }
};

/**
 * Main application flow
 */
const App = {
  /**
   * Initialize the bot
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load commands and events
      CommandManager.loadCommands(config.paths.commands);
      EventManager.loadEvents(config.paths.events);
      
      // Parallelize database connection and command deployment
      await Promise.all([
        DatabaseManager.connect(),
        CommandManager.deployCommands()
      ]);
      
      // Login to Discord
      await client.login(config.token);
      
      // Calculate and log startup time
      const elapsed = process.hrtime(startTime);
      const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1000000).toFixed(2);
      
      Logger.success('BOT', `Initialization complete in ${elapsedMs}ms`);
      Logger.info('BOT', `Loaded ${client.startup.commandsLoaded} commands, ${client.startup.eventsLoaded} events`);
      
      if (client.startup.errors > 0) {
        Logger.warning('BOT', `Encountered ${client.startup.errors} non-critical errors during startup`);
      }
    } catch (error) {
      Logger.error('BOT', `Initialization failed: ${error.message}`);
      await this.shutdown(1);
    }
  },
  
  /**
   * Gracefully shut down the application
   * @param {number} exitCode - Process exit code
   * @returns {Promise<void>}
   */
  async shutdown(exitCode = 0) {
    Logger.warning('BOT', 'Initiating shutdown sequence');
    
    try {
      // Close database connection
      await DatabaseManager.disconnect();
      
      // Destroy Discord client
      if (client) {
        client.destroy();
        Logger.info('BOT', 'Discord client connection terminated');
      }
      
      Logger.success('BOT', 'Shutdown complete');
    } catch (error) {
      Logger.error('BOT', `Error during shutdown: ${error.message}`);
    } finally {
      process.exit(exitCode);
    }
  }
};

// Set up process event handlers
process.on('SIGINT', () => App.shutdown(0));
process.on('SIGTERM', () => App.shutdown(0));

process.on('unhandledRejection', (reason) => {
  handleError('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  handleError('Uncaught Exception:', error);
  App.shutdown(1); // Uncaught exceptions should terminate the process
});

// Start the application
App.initialize();
