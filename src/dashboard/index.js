const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
	contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('dev'));

// Session configuration
app.use(session({
	secret: process.env.SESSION_SECRET || 'your-secret-key',
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 60000 * 60 * 24 // 24 hours
	}
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Discord strategy setup for dashboard
passport.use(new DiscordStrategy({
	clientID: process.env.DASHBOARD_CLIENT_ID || process.env.DISCORD_CLIENT_ID,
	clientSecret: process.env.DASHBOARD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET,
	callbackURL: process.env.DASHBOARD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
	scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
	// Store the access token in the profile object
	profile.accessToken = accessToken;
	process.nextTick(() => done(null, profile));
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Home route
app.get('/', (req, res) => {
	res.render('index', {
		user: req.user,
		title: 'Kiyo Bot Dashboard'
	});
});

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).render('error', {
		title: 'Error',
		message: 'Something went wrong!'
	});
});

const PORT = process.env.DASHBOARD_PORT || 3000;
app.listen(PORT, () => {
	console.log(`Dashboard is running on port ${PORT}`);
}); 