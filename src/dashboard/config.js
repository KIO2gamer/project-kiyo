require('dotenv').config({ path: '../../.env' });

module.exports = {
  clientID: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  port: process.env.DASHBOARD_PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'kiyo-dashboard-secret',
  botOwnerIDs: process.env.BOT_OWNER_IDS ? process.env.BOT_OWNER_IDS.split(',') : []
};
