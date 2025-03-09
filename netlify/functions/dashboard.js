const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Security middleware
app.use(helmet({
	contentSecurityPolicy: false,
}));

// Session configuration
app.use(session({
	secret: process.env.SESSION_SECRET || 'your-secret-key',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: true,
		maxAge: 60000 * 60 * 24 // 24 hours
	}
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Discord strategy setup
passport.use(new DiscordStrategy({
	clientID: process.env.DASHBOARD_CLIENT_ID,
	clientSecret: process.env.DASHBOARD_CLIENT_SECRET,
	callbackURL: '/.netlify/functions/dashboard/auth/discord/callback',
	scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
	profile.accessToken = accessToken;
	process.nextTick(() => done(null, profile));
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('../../dist/routes/auth');
const dashboardRoutes = require('../../dist/routes/dashboard');

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

// Export the serverless function
exports.handler = serverless(app); 