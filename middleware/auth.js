const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 */
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user is an admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

/**
 * Middleware to check if user belongs to a specific guild
 */
exports.inGuild = (guildId) => (req, res, next) => {
  if (!req.user || !req.user.guilds.includes(guildId)) {
    return res.status(403).json({ error: 'You don\'t have access to this server' });
  }
  next();
};
