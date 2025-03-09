const express = require('express');
const passport = require('passport');
const router = express.Router();

// Discord authentication
router.get('/discord', passport.authenticate('discord'));

// Discord callback
router.get('/discord/callback',
	passport.authenticate('discord', {
		failureRedirect: '/'
	}),
	(req, res) => res.redirect('/dashboard')
);

// Logout
router.get('/logout', (req, res) => {
	req.logout(() => {
		res.redirect('/');
	});
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
};

// Export both the router and isAuthenticated middleware
router.isAuthenticated = isAuthenticated;
module.exports = router; 