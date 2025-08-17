# Project Kiyo Dashboard

A comprehensive web dashboard for managing your Project Kiyo Discord bot. Built with Express.js, EJS templates, and Bootstrap for a modern, responsive interface.

## Features

### 🎛️ **Dashboard Overview**

-   Real-time bot statistics (servers, users, uptime, ping)
-   Activity charts and monitoring
-   System resource usage tracking
-   Quick action buttons for common tasks

### 🖥️ **Server Management**

-   View all servers where the bot is active
-   Server details including member count, channels, and roles
-   Per-server configuration options

### ⚙️ **Bot Settings**

-   **General Settings**: Bot status, activity, and presence configuration
-   **Moderation Settings**: Auto-moderation, timeout defaults, log channels
-   **Leveling System**: XP configuration, level-up announcements, level roles
-   **YouTube Subscriber Roles**: Configure subscriber tiers and role assignments
-   **API Configuration**: Test and monitor API connections (Gemini, Weather, Translate)
-   **Logging Settings**: Configure log levels and output options

### 🔧 **Command Management**

-   View all available commands by category
-   Configure command permissions per server
-   Enable/disable commands for specific servers

### 📊 **Monitoring & Analytics**

-   Real-time bot performance metrics
-   Command usage statistics
-   Error tracking and logging
-   Memory and CPU usage monitoring

### 👥 **User Management**

-   View user statistics and activity
-   Manage user permissions
-   Track user levels and experience

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Dashboard Configuration
ENABLE_DASHBOARD=true
DASHBOARD_PORT=3001
SESSION_SECRET=your_session_secret_here_change_this
DASHBOARD_CALLBACK_URL=http://localhost:3001/auth/discord/callback

# Discord OAuth2 (same as your bot credentials)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
```

### 2. Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2** → **General**
4. Add redirect URI: `http://localhost:3001/auth/discord/callback`
5. Make sure your bot has the following OAuth2 scopes:
    - `identify` (to get user info)
    - `guilds` (to see user's servers)

### 3. Install Dependencies

The required dependencies are already included in the main `package.json`:

```bash
npm install
```

### 4. Start the Bot with Dashboard

```bash
# Start bot with dashboard enabled (default)
npm start

# Or explicitly enable dashboard
npm run dashboard

# Or run bot only without dashboard
npm run bot-only
```

### 5. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3001
```

## File Structure

```
src/dashboard/
├── public/                 # Static assets
│   ├── css/
│   │   └── dashboard.css   # Custom dashboard styles
│   ├── js/
│   │   └── dashboard.js    # Dashboard JavaScript
│   └── images/
├── routes/                 # Express routes
│   ├── auth.js            # Authentication routes
│   ├── dashboard.js       # Dashboard page routes
│   └── api.js             # API endpoints
├── views/                  # EJS templates
│   ├── layout.ejs         # Main layout template
│   ├── index.ejs          # Landing page
│   └── dashboard/         # Dashboard pages
│       ├── index.ejs      # Dashboard home
│       ├── servers.ejs    # Server management
│       ├── commands.ejs   # Command configuration
│       ├── monitoring.ejs # Bot monitoring
│       ├── users.ejs      # User management
│       └── settings.ejs   # Bot settings
└── server.js              # Main dashboard server
```

## API Endpoints

### Authentication

-   `GET /auth/discord` - Initiate Discord OAuth2 login
-   `GET /auth/discord/callback` - OAuth2 callback handler
-   `GET /auth/logout` - Logout user

### Dashboard Pages

-   `GET /` - Landing page
-   `GET /dashboard` - Dashboard home
-   `GET /dashboard/servers` - Server management
-   `GET /dashboard/commands` - Command configuration
-   `GET /dashboard/monitoring` - Bot monitoring
-   `GET /dashboard/users` - User management
-   `GET /dashboard/settings` - Bot settings

### API Routes

-   `GET /api/stats` - Bot statistics
-   `GET /api/guilds` - User's mutual guilds with bot
-   `GET /api/guild/:id` - Specific guild details
-   `GET /api/commands` - Available commands
-   `GET /api/settings` - Current bot settings
-   `POST /api/settings` - Update bot settings
-   `GET /api/test/youtube` - Test YouTube API
-   `GET /api/test/all` - Test all APIs

## Security Features

### Authentication

-   Discord OAuth2 integration
-   Session-based authentication with MongoDB storage
-   Secure session cookies with configurable expiration

### Authorization

-   Guild permission checking (users can only manage servers they have permissions for)
-   Role-based access control
-   CSRF protection for form submissions

### Data Protection

-   Environment variable configuration for sensitive data
-   Secure session storage
-   Input validation and sanitization

## Customization

### Styling

-   Bootstrap 5 for responsive design
-   Custom CSS in `public/css/dashboard.css`
-   Font Awesome icons for UI elements

### Adding New Pages

1. Create EJS template in `views/dashboard/`
2. Add route in `routes/dashboard.js`
3. Add navigation link in `views/layout.ejs`
4. Add any required API endpoints in `routes/api.js`

### Adding New Settings

1. Add form fields to `views/dashboard/settings.ejs`
2. Update JavaScript handlers for the new settings
3. Add API endpoints to handle the new settings
4. Update the bot's configuration system

## Troubleshooting

### Common Issues

**Dashboard won't start:**

-   Check that all required environment variables are set
-   Ensure MongoDB is running and accessible
-   Verify Discord OAuth2 configuration

**Can't login:**

-   Check Discord OAuth2 redirect URI matches exactly
-   Verify Discord client ID and secret are correct
-   Check browser console for JavaScript errors

**Settings not saving:**

-   Check browser network tab for API errors
-   Verify user has proper permissions
-   Check server logs for error messages

**Stats not loading:**

-   Ensure bot is properly connected to Discord
-   Check API endpoints are responding
-   Verify database connection

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=DEBUG
```

This will provide detailed information about dashboard operations and API calls.

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use a strong, random `SESSION_SECRET`
3. Configure proper MongoDB connection string
4. Set up HTTPS with proper SSL certificates
5. Update Discord OAuth2 redirect URI to production URL

### Security Considerations

-   Use HTTPS in production
-   Set secure session cookie options
-   Implement rate limiting
-   Regular security updates
-   Monitor for suspicious activity

### Performance Optimization

-   Enable gzip compression
-   Use CDN for static assets
-   Implement caching strategies
-   Monitor memory usage
-   Set up proper logging

## Contributing

When adding new dashboard features:

1. Follow the existing code structure
2. Add proper error handling
3. Include user permission checks
4. Update documentation
5. Test thoroughly before deployment

## Support

For dashboard-specific issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test API endpoints individually
4. Verify Discord OAuth2 configuration
5. Check browser console for client-side errors
