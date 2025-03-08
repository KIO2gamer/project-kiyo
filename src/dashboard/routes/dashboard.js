const router = require('express').Router();
const { handleError } = require('../../bot/utils/errorHandler');

// Main dashboard page
router.get('/', (req, res) => {
  const client = req.app.locals.client;
  
  try {
    // Get mutual guilds (servers where both user and bot are members)
    const userGuilds = req.user.guilds;
    const botGuilds = client.guilds.cache.map(guild => guild.id);
    
    const mutualGuilds = userGuilds.filter(guild => 
      botGuilds.includes(guild.id) && 
      (guild.permissions & 0x20) === 0x20 // Check for MANAGE_GUILD permission
    );

    res.render('dashboard/index', {
      user: req.user,
      mutualGuilds,
      botName: 'Kiyo',
      botUser: client.user
    });
  } catch (err) {
    handleError('Dashboard error:', err);
    res.status(500).render('error', { 
      message: 'An error occurred while loading the dashboard.' 
    });
  }
});

// Server management page
router.get('/servers/:guildId', async (req, res) => {
  const client = req.app.locals.client;
  const { guildId } = req.params;
  
  try {
    // Check if the guild exists and the user has permission
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).render('error', { 
        message: 'Server not found.' 
      });
    }
    
    // Fetch additional guild data
    const members = await guild.members.fetch();
    const channels = guild.channels.cache;
    
    // Stats for display
    const stats = {
      totalMembers: guild.memberCount,
      humanMembers: members.filter(m => !m.user.bot).size,
      botMembers: members.filter(m => m.user.bot).size,
      textChannels: channels.filter(c => c.isTextBased() && c.type !== 4).size,
      voiceChannels: channels.filter(c => c.isVoiceBased()).size,
      roles: guild.roles.cache.size
    };
    
    res.render('dashboard/server', {
      user: req.user,
      guild,
      stats,
      botName: 'Kiyo',
    });
  } catch (err) {
    handleError('Server dashboard error:', err);
    res.status(500).render('error', { 
      message: 'An error occurred while loading the server dashboard.' 
    });
  }
});

// Command management page
router.get('/servers/:guildId/commands', (req, res) => {
  const client = req.app.locals.client;
  const { guildId } = req.params;
  
  try {
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      return res.status(404).render('error', { 
        message: 'Server not found.' 
      });
    }
    
    // Group commands by category
    const commands = [...client.commands.values()];
    const groupedCommands = {};
    
    commands.forEach(cmd => {
      const category = cmd.category || 'Uncategorized';
      if (!groupedCommands[category]) {
        groupedCommands[category] = [];
      }
      groupedCommands[category].push(cmd);
    });
    
    res.render('dashboard/commands', {
      user: req.user,
      guild,
      groupedCommands,
      botName: 'Kiyo',
    });
  } catch (err) {
    handleError('Commands dashboard error:', err);
    res.status(500).render('error', { 
      message: 'An error occurred while loading the commands page.' 
    });
  }
});

module.exports = router;