const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true
	},
	discordId: {
		type: String,
		unique: true,
		sparse: true
	},
	discordUsername: String,
	avatar: String,
	isAdmin: {
		type: Boolean,
		default: false
	},
	guilds: [String],
	refreshToken: String,
	createdAt: {
		type: Date,
		default: Date.now
	}
});

// Hash password before saving
userSchema.pre('save', async function (next) {
	const user = this;
	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 10);
	}
	next();
});

// Generate auth token method
userSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ userId: user._id.toString() },
		process.env.JWT_SECRET,
		{ expiresIn: '24h' }
	);
	return token;
};

// Generate refresh token method
userSchema.methods.generateRefreshToken = async function () {
	const user = this;
	const refreshToken = jwt.sign(
		{ userId: user._id.toString() },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: '7d' }
	);
	user.refreshToken = refreshToken;
	await user.save();
	return refreshToken;
};

// Static method to authenticate user
userSchema.statics.findByCredentials = async function (email, password) {
	const user = await this.findOne({ email });
	if (!user) {
		throw new Error('Invalid login credentials');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Invalid login credentials');
	}
	return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
