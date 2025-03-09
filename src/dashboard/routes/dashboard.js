const express = require('express');
const router = express.Router();
const auth = require('./auth');

// Dashboard home
router.get('/', auth.isAuthenticated, async (req, res) => {
	try {
		res.render('dashboard/index', {
			user: req.user,
			title: 'Dashboard',
			guilds: req.user.guilds
		});
	} catch (error) {
		console.error('Dashboard error:', error);
		res.status(500).render('error', {
			title: 'Error',
			message: 'Failed to load dashboard'
		});
	}
});

// Guild-specific settings
router.get('/guild/:guildId', auth.isAuthenticated, async (req, res) => {
	try {
		const { guildId } = req.params;
		const userGuilds = req.user.guilds;
		const guild = userGuilds.find(g => g.id === guildId);

		if (!guild) {
			return res.status(404).render('error', {
				title: 'Error',
				message: 'Guild not found'
			});
		}

		res.render('dashboard/guild', {
			user: req.user,
			title: `${guild.name} - Settings`,
			guild
		});
	} catch (error) {
		console.error('Guild settings error:', error);
		res.status(500).render('error', {
			title: 'Error',
			message: 'Failed to load guild settings'
		});
	}
});

module.exports = router; 