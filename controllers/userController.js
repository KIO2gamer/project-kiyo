const User = require('../models/User');

exports.getCurrentUser = async (req, res) => {
	try {
		// User is already attached to req from auth middleware
		const user = req.user;

		res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			discordUsername: user.discordUsername,
			avatar: user.avatar,
			isAdmin: user.isAdmin,
			guilds: user.guilds,
			createdAt: user.createdAt
		});
	} catch (error) {
		console.error('Error fetching current user:', error);
		res.status(500).json({ error: 'Failed to fetch user data' });
	}
};

exports.getUserById = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if requesting user has rights to view this data
		if (req.user._id.toString() !== id && !req.user.isAdmin) {
			return res.status(403).json({ error: 'Access denied' });
		}

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			discordUsername: user.discordUsername,
			avatar: user.avatar,
			isAdmin: user.isAdmin,
			guilds: user.guilds,
			createdAt: user.createdAt
		});
	} catch (error) {
		console.error(`Error fetching user ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to fetch user data' });
	}
};

exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if user has permission to update
		if (req.user._id.toString() !== id && !req.user.isAdmin) {
			return res.status(403).json({ error: 'You do not have permission to update this user' });
		}

		const allowedUpdates = ['username', 'email', 'password'];
		const updates = Object.keys(req.body);
		const isValidOperation = updates.every(update => allowedUpdates.includes(update));

		if (!isValidOperation) {
			return res.status(400).json({ error: 'Invalid updates' });
		}

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Update the fields
		updates.forEach(update => {
			user[update] = req.body[update];
		});

		await user.save();

		res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			discordUsername: user.discordUsername,
			avatar: user.avatar,
			isAdmin: user.isAdmin,
			guilds: user.guilds,
			createdAt: user.createdAt
		});
	} catch (error) {
		console.error(`Error updating user ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update user' });
	}
};
