const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public auth routes
router.post('/login', authController.login);
router.post('/discord', authController.redirectToDiscord);
router.get('/discord/callback', authController.handleDiscordCallback);
router.post('/youtube/verify', authController.verifyYouTube);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);

module.exports = router;
