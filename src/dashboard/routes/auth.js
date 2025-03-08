const router = require('express').Router();
const passport = require('passport');
const { handleError } = require('../../bot/utils/errorHandler');

// Login route - redirects to Discord OAuth
router.get('/discord', passport.authenticate('discord'));

// Discord callback route
router.get('/discord/callback', 
  passport.authenticate('discord', {
    failureRedirect: '/auth/login-failed'
  }), 
  (req, res) => {
    // Redirect to dashboard after successful login
    res.redirect('/dashboard');
  }
);

// Failed login route
router.get('/login-failed', (req, res) => {
  res.status(401).render('error', {
    message: 'Failed to authenticate with Discord.'
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      handleError('Logout error:', err);
      return res.status(500).render('error', { 
        message: 'An error occurred while logging out.' 
      });
    }
    res.redirect('/');
  });
});

module.exports = router;