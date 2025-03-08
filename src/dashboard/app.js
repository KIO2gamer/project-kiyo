const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const morgan = require('morgan');
const helmet = require('helmet');
const { Strategy } = require('passport-discord');
const { handleError } = require('../bot/utils/errorHandler');
const config = require('./config');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "https://cdn.discordapp.com", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000 // 1 day
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Discord strategy
passport.use(new Strategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  // Store user in session
  return done(null, profile);
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Global middleware for templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', require('./middleware/auth').isAuthenticated, dashboardRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('home', {
    botName: 'Kiyo',
    isAuthenticated: req.isAuthenticated(),
    user: req.user
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  handleError('Dashboard error:', err);
  res.status(err.status || 500).render('error', {
    message: err.message || 'An unexpected error occurred'
  });
});

// Export app instead of starting server
// This allows the bot's main file to control when the dashboard starts
module.exports = app;
