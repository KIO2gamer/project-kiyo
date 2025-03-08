/**
 * Middleware to check if the user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/discord');
}

/**
 * Middleware to check if user is a bot owner
 */
function isOwner(req, res, next) {
  const config = require('../config');
  
  if (req.isAuthenticated() && config.botOwnerIDs.includes(req.user.id)) {
    return next();
  }
  res.status(403).render('error', {
    message: 'You do not have permission to access this page.'
  });
}

/**
 * Middleware to check if user has manage permissions for the guild
 */
function hasGuildPermission(req, res, next) {
  const guildId = req.params.guildId;
  
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/discord');
  }
  
  const userGuild = req.user.guilds.find(g => g.id === guildId);
  
  if (!userGuild) {
    return res.status(403).render('error', {
      message: 'You do not have access to this server.'
    });
  }
  
  // Check if user has MANAGE_GUILD permission (0x20)
  if ((userGuild.permissions & 0x20) !== 0x20) {
    return res.status(403).render('error', {
      message: 'You need the Manage Server permission to access this page.'
    });
  }
  
  next();
}

module.exports = {
  isAuthenticated,
  isOwner,
  hasGuildPermission
};
