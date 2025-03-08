const app = require('./app');
const config = require('./config');
const { handleError } = require('../bot/utils/errorHandler');

/**
 * Start the dashboard with the bot client
 * @param {Object} client - Discord.js client
 * @param {Object} db - Database connection
 */
function startDashboard(client, db) {
  try {
    // Make client and db available to routes
    app.locals.client = client;
    app.locals.db = db;
    
    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`[Dashboard] Server running on port ${config.port}`);
    });
    
    return server;
  } catch (err) {
    handleError('[Dashboard] Failed to start dashboard:', err);
    throw err;
  }
}

module.exports = { startDashboard };
