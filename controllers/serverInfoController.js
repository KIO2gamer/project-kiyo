const { Client } = require('discord.js');
const client = require('../src/bot/client');
const moment = require('moment');

/**
 * Format features for display
 */
const formatFeature = (feature) => {
  const featureMap = {
    ANIMATED_BANNER: 'Animated Banner',
    ANIMATED_ICON: 'Animated Server Icon',
    BANNER: 'Server Banner',
    COMMUNITY: 'Community Server',
    DISCOVERABLE: 'Server Discovery',
    FEATURABLE: 'Featurable',
    INVITE_SPLASH: 'Invite Splash Background',
    MEMBER_VERIFICATION_GATE_ENABLED: 'Membership Screening',
    MONETIZATION_ENABLED: 'Monetization',
    MORE_STICKERS: 'More Sticker Slots',
    NEWS: 'News Channels',
    PARTNERED: 'Partnered',
    PREVIEW_ENABLED: 'Preview Enabled',
    PRIVATE_THREADS: 'Private Threads',
    ROLE_ICONS: 'Role Icons',
    TICKETED_EVENTS_ENABLED: 'Ticketed Events',
    VANITY_URL: 'Vanity URL',
    VERIFIED: 'Verified',
    VIP_REGIONS: 'VIP Voice Regions',
    WELCOME_SCREEN_ENABLED: 'Welcome Screen'
  };
  
  return featureMap[feature] || feature;
};

exports.getServers = async (req, res) => {
  try {
    // Check if user has permission to access this data
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get guilds the bot is in
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true }),
      memberCount: guild.memberCount,
      owner: {
        id: guild.ownerId,
        tag: guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown'
      },
      features: guild.features.map(formatFeature),
      createdAt: guild.createdAt,
      joinedAt: guild.joinedAt
    }));
    
    res.json({ guilds });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
};

exports.getServerById = async (req, res) => {
  try {
    const { id } = req.params;
    const guild = client.guilds.cache.get(id);
    
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if the user has permission to view this server
    if (!req.user.isAdmin && !req.user.guilds.includes(id)) {
      return res.status(403).json({ error: 'You do not have permission to view this server' });
    }
    
    // Get owner details
    let owner;
    try {
      owner = await guild.fetchOwner();
    } catch (e) {
      console.warn(`Could not fetch owner for guild ${id}:`, e);
      owner = { user: { tag: 'Unknown' } };
    }
    
    // Get basic counts
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;
    
    // Format creation date
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const serverAge = moment(guild.createdAt).fromNow(true);
    
    const guildData = {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 256 }),
      banner: guild.bannerURL({ size: 1024 }),
      description: guild.description,
      owner: {
        id: guild.ownerId,
        tag: owner.user.tag
      },
      memberCount: guild.memberCount,
      channels: {
        total: channelCount,
        categories: guild.channels.cache.filter(c => c.type === 4).size,
        text: guild.channels.cache.filter(c => c.type === 0).size,
        voice: guild.channels.cache.filter(c => c.type === 2).size,
        announcement: guild.channels.cache.filter(c => c.type === 5).size,
        forum: guild.channels.cache.filter(c => c.type === 15).size
      },
      roles: roleCount,
      emojis: emojiCount,
      features: guild.features.map(formatFeature),
      createdAt: {
        timestamp: createdTimestamp,
        formatted: `<t:${createdTimestamp}:F>`,
        relative: `<t:${createdTimestamp}:R>`,
        age: serverAge
      },
      preferredLocale: guild.preferredLocale,
      premiumTier: guild.premiumTier,
      premiumSubscriptionCount: guild.premiumSubscriptionCount,
      verificationLevel: guild.verificationLevel,
      explicitContentFilter: guild.explicitContentFilter,
      mfaLevel: guild.mfaLevel
    };
    
    res.json({ guild: guildData });
  } catch (error) {
    console.error(`Error fetching server ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch server info' });
  }
};

exports.getServerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = '7d' } = req.query;
    
    const guild = client.guilds.cache.get(id);
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if the user has permission to view this server
    if (!req.user.isAdmin && !req.user.guilds.includes(id)) {
      return res.status(403).json({ error: 'You do not have permission to view this server' });
    }
    
    // Define start date based on timeframe
    const startDate = getStartDate(timeframe);
    
    // Collect statistics
    const stats = await collectServerStats(guild, startDate);
    
    res.json({ stats, timeframe });
  } catch (error) {
    console.error(`Error fetching server stats for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch server statistics' });
  }
};

// Helper function to determine start date
function getStartDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '24h': return new Date(now - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '1M': 
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'all':
    default:
      return new Date(0); // Beginning of time
  }
}

// Helper function to collect server stats
async function collectServerStats(guild, startDate) {
  // This would typically query a database of stored events
  // For now, we'll return mock data based on the current state
  
  return {
    overview: {
      totalMembers: guild.memberCount,
      onlineMembers: guild.members.cache.filter(m => m.presence?.status === 'online').size,
      newMembers: 0, // Would be calculated from join dates
      membersLeft: 0, // Would be calculated from stored leave events
    },
    activityBreakdown: {
      messagesSent: 0, // Would be calculated from stored message events
      voiceTime: 0,   // Would be calculated from stored voice session events
      commandsUsed: 0, // Would be calculated from stored command usage events
      reactionCount: 0 // Would be calculated from stored reaction events
    },
    growthChart: generateMockGrowthData(guild.memberCount, startDate),
    topChannels: generateMockTopChannels(guild),
    memberActivity: {
      mostActive: [],
      newJoins: [],
      recentLeaves: []
    }
  };
}

function generateMockGrowthData(currentCount, startDate) {
  const days = Math.max(1, Math.floor((Date.now() - startDate) / (24 * 60 * 60 * 1000)));
  const dataPoints = Math.min(30, days); // Max 30 data points
  
  const avgGrowthPerDay = currentCount / 100; // Assume 1% growth per day
  let mockData = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const memberCount = Math.floor(currentCount - (avgGrowthPerDay * i));
    mockData.push({
      date: date.toISOString().split('T')[0],
      count: memberCount
    });
  }
  
  return mockData;
}

function generateMockTopChannels(guild) {
  return guild.channels.cache
    .filter(channel => channel.type === 0) // Text channels only
    .sort((a, b) => b.position - a.position)
    .slice(0, 5)
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      messageCount: Math.floor(Math.random() * 1000) // Mock message count
    }));
}
