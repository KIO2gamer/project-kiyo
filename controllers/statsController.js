const client = require('../src/bot/client');

exports.getGlobalStats = async (req, res) => {
  try {
    const stats = {
      servers: client.guilds.cache.size,
      users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      commands: client.commands.size,
      uptime: Math.floor(client.uptime / 1000),
      // Add more relevant stats
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
};
