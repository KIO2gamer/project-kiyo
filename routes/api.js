const express = require('express');
const router = express.Router();

// Import controllers
const serverInfoController = require('../controllers/serverInfoController');
const commandsController = require('../controllers/commandsController');
const statsController = require('../controllers/statsController');
const userController = require('../controllers/userController');

// Import middleware
const { authenticate, isAdmin } = require('../middleware/auth');

// User routes
router.get('/users/me', authenticate, userController.getCurrentUser);
router.get('/users/:id', authenticate, userController.getUserById);
router.put('/users/:id', authenticate, userController.updateUser);

// Server routes - protected with authentication
router.get('/servers', authenticate, isAdmin, serverInfoController.getServers);
router.get('/servers/:id', authenticate, serverInfoController.getServerById);
router.get('/servers/:id/stats', authenticate, serverInfoController.getServerStats);

// Commands routes - some are public
router.get('/commands', commandsController.getAllCommands); // Public
router.get('/commands/:category', commandsController.getCommandsByCategory); // Public
router.post('/commands/execute', authenticate, commandsController.executeCommand); // Protected

// Stats routes - admin only
router.get('/stats/global', authenticate, isAdmin, statsController.getGlobalStats);

module.exports = router;
