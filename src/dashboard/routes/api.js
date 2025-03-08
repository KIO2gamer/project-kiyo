const router = require('express').Router();
const { handleError } = require('../../bot/utils/errorHandler');
const { isAuthenticated, hasGuildPermission } = require('../middleware/auth');

// Get bot status
router.get('/status', (req, res) => {
  const client = req.app.locals.client;
  
  try {
    const uptime = client.uptime;
    const servers = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const ping = client.ws.ping;
    
    res.json({
      status: 'online',
      uptime,
      servers,
      users,
      ping
    });
  } catch (err) {
    handleError('API status error:', err);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// Get server stats
router.get('/servers/:guildId/stats', isAuthenticated, hasGuildPermission, async (req, res) => {
  const client = req.app.locals.client;
  const { guildId } = req.params;
  
  try {
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const members = await guild.members.fetch();
    
    const stats = {
      memberCount: guild.memberCount,
      onlineMembers: members.filter(m => m.presence?.status === 'online').size,
      botCount: members.filter(m => m.user.bot).size,
      roleCount: guild.roles.cache.size,
      channelCount: guild.channels.cache.size
    };
    
    res.json(stats);
  } catch (err) {
    handleError('API server stats error:', err);
    res.status(500).json({ error: 'Failed to get server stats' });
  }
});

// Get server settings
router.get('/servers/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
  const client = req.app.locals.client;
  const { guildId } = req.params;
  const db = req.app.locals.db;
  
  try {
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Get settings from database
    const settings = await db.getGuildSettings(guildId) || {};
    
    res.json(settings);
  } catch (err) {
    handleError('API get settings error:', err);
    res.status(500).json({ error: 'Failed to get server settings' });
  }
});

// Update server settings
router.post('/servers/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
  const client = req.app.locals.client;
  const { guildId } = req.params;
  const db = req.app.locals.db;
  
  try {
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const settings = req.body;
    
    // Save settings to database
    await db.updateGuildSettings(guildId, settings);
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    handleError('API update settings error:', err);
    res.status(500).json({ error: 'Failed to update server settings' });
  }
});

// Toggle command status
router.post('/servers/:guildId/commands/:commandName', isAuthenticated, hasGuildPermission, async (req, res) => {
  const client = req.app.locals.client;
  const { guildId, commandName } = req.params;
  const { enabled } = req.body;
  const db = req.app.locals.db;
  
  try {
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if command exists
    const command = client.commands.get(commandName);
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    // Update command settings in database
    await db.updateGuildCommand(guildId, commandName, enabled);
    
    res.json({ success: true, message: `Command ${commandName} has been ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    handleError('API toggle command error:', err);
    res.status(500).json({ error: 'Failed to update command status' });
  }
});

module.exports = router;