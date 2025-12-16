# 📊 Dashboard Documentation

Project Kiyo features a modern web dashboard for managing your Discord bot configuration and monitoring its status in real-time.

## 🎯 **Features**

### **Authentication & Security**

-   **OAuth2 Integration**: Secure Discord OAuth authentication
-   **JWT Tokens**: Session management with JSON Web Tokens
-   **Permission Verification**: Ensure users have "Manage Server" permission
-   **Secure Sessions**: Cookie-based authentication with HTTP-only flags

### **Server Management**

-   **Guild Selection**: Choose from servers where you have admin permissions
-   **Welcome Messages**: Configure welcome channel and custom messages
-   **AI Chat Channels**: Set up AI-powered chat channels
-   **Moderation Logs**: Configure moderation logging channels
-   **Message Logs**: Set up message edit/delete logging
-   **Ticket System**: Configure ticket support categories
-   **XP System**: Enable/disable and configure XP rates
-   **YouTube Subscriber Roles**: Configure subscriber tier roles

### **Monitoring & Logs**

-   **Real-time Logs**: View bot logs with automatic refresh
-   **Log Filtering**: Filter by level (ERROR, WARN, INFO, DEBUG, SUCCESS)
-   **Module Filtering**: Filter logs by module (BOT, COMMANDS, EVENTS, etc.)
-   **Discord Logging**: Configure Discord channel for log output
-   **Auto-scroll**: Automatically scroll to latest logs

### **Bot Statistics**

-   **Server Count**: Total number of servers
-   **User Count**: Total number of users
-   **Command Stats**: Most used commands and usage statistics
-   **Uptime**: Bot uptime and status
-   **Performance Metrics**: Response times and error rates

## 🏗️ **Architecture**

### **Frontend (React + Vite + Tailwind)**

```
dashboard/
├── src/
│   ├── App.jsx              # Main application component with routing
│   ├── api.js               # Axios API client configuration
│   ├── main.jsx             # Application entry point
│   └── styles.css           # Global styles and Tailwind imports
├── dist/                    # Production build output
├── index.html               # HTML template
├── vite.config.js           # Vite build configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

### **Backend (Express API)**

```
src/api/
└── server.js                # RESTful API server (679 lines)
    ├── OAuth2 endpoints     # /api/auth/*
    ├── Settings endpoints   # /api/settings/*
    ├── Statistics endpoints # /api/stats/*
    ├── Logs endpoints       # /api/logs/*
    └── Middleware           # Authentication & validation
```

## 🚀 **Getting Started**

### **1. Environment Configuration**

Add these variables to your `.env` file:

```env
# Dashboard OAuth Configuration
DASHBOARD_CLIENT_ID=your_discord_client_id
DASHBOARD_CLIENT_SECRET=your_discord_client_secret
DASHBOARD_REDIRECT_URI=http://localhost:5173/callback
DASHBOARD_BASE_URL=http://localhost:5173

# API Configuration
DASHBOARD_SESSION_SECRET=generate_random_secret_here
DASHBOARD_API_PORT=3001
DASHBOARD_ALLOW_ORIGINS=http://localhost:5173

# Optional: Production URLs
# DASHBOARD_REDIRECT_URI=https://yourdomain.com/callback
# DASHBOARD_BASE_URL=https://yourdomain.com
# DASHBOARD_ALLOW_ORIGINS=https://yourdomain.com
```

### **2. Discord Application Setup**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (or create a new one)
3. Go to **OAuth2** → **General**
4. Add redirect URL: `http://localhost:5173/callback` (or your production URL)
5. Copy the **Client ID** and **Client Secret** to your `.env` file

### **3. Install Dependencies**

```bash
# Install bot dependencies
npm install

# Install dashboard dependencies
npm install --prefix dashboard
```

### **4. Development Mode**

Run both the bot and dashboard in development mode:

```bash
# Terminal 1: Start bot with API server
npm run dev

# Terminal 2: Start dashboard dev server
npm run dev:dash
```

The dashboard will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

### **5. Production Build**

```bash
# Build dashboard for production
npm run build:dash

# This creates optimized files in dashboard/dist/
```

## 🔌 **API Endpoints**

### **Authentication**

#### `GET /api/auth/login`

Initiates Discord OAuth flow

-   Redirects to Discord authorization
-   Generates secure state token

#### `GET /api/auth/callback`

Handles OAuth callback

-   Exchanges code for access token
-   Creates JWT session token
-   Returns user data

#### `GET /api/auth/user`

Get current authenticated user

-   Requires valid JWT token
-   Returns user info and guilds

#### `POST /api/auth/logout`

Logout current user

-   Clears session cookie
-   Invalidates JWT token

### **Settings**

#### `GET /api/settings/:guildId`

Get guild settings

-   Requires authentication
-   Requires Manage Server permission
-   Returns all configuration

#### `PUT /api/settings/:guildId`

Update guild settings

-   Requires authentication
-   Requires Manage Server permission
-   Validates input with Zod schema

#### `GET /api/settings/:guildId/channels`

Get guild channels

-   Returns list of channels
-   Includes channel types and permissions

### **Statistics**

#### `GET /api/stats/bot`

Get bot statistics

-   Total servers
-   Total users
-   Uptime
-   Memory usage

#### `GET /api/stats/commands`

Get command usage statistics

-   Most used commands
-   Command execution counts
-   Success/failure rates

### **Logs**

#### `GET /api/logs`

Get recent logs

-   Query params: `?level=ERROR&module=BOT&limit=100`
-   Returns filtered log entries
-   Sorted by timestamp (newest first)

#### `DELETE /api/logs`

Clear log history

-   Requires authentication
-   Clears in-memory log storage

#### `POST /api/logs/discord-channel`

Set Discord log channel

-   Body: `{ guildId, channelId }`
-   Configures where logs are sent

#### `POST /api/logs/test-discord`

Send test log to Discord

-   Verifies logging configuration
-   Checks bot permissions

## 🎨 **UI Components**

### **Pages**

#### **Home Page** (`/`)

-   Welcome message
-   Quick stats overview
-   Login button
-   Feature highlights

#### **Dashboard** (`/dashboard`)

-   Server selector dropdown
-   Configuration tabs
-   Real-time status indicators
-   Save/reset buttons

#### **Monitoring** (`/monitoring`)

-   Live log viewer
-   Filter controls
-   Auto-refresh toggle
-   Log level indicators
-   Discord logging config

#### **Callback** (`/callback`)

-   OAuth callback handler
-   Loading state
-   Error handling
-   Redirect to dashboard

### **Components**

#### **Navigation**

-   Logo and branding
-   Page links (Home, Dashboard, Monitoring)
-   User profile display
-   Logout button

#### **Server Selector**

-   Dropdown list of servers
-   Server icons and names
-   Filter by permissions
-   Active server indicator

#### **Settings Forms**

-   Input validation
-   Real-time feedback
-   Save/reset actions
-   Success/error notifications

#### **Log Viewer**

-   Color-coded log levels
-   Module badges
-   Timestamp display
-   Auto-scroll feature
-   Filter controls

## 🔒 **Security Features**

### **Authentication Flow**

1. User clicks "Login with Discord"
2. Redirected to Discord OAuth
3. User authorizes application
4. Callback receives authorization code
5. Backend exchanges code for access token
6. JWT session token created and stored in HTTP-only cookie
7. Frontend receives user data

### **Authorization**

-   **Manage Server Check**: Users must have "Manage Server" permission
-   **Guild Membership**: Only accessible guilds are shown
-   **Bot Presence**: Guild must have the bot installed
-   **JWT Validation**: All API requests verify JWT signature

### **Data Protection**

-   **HTTP-only Cookies**: Session tokens not accessible via JavaScript
-   **SameSite Attribute**: CSRF protection
-   **Secure Flag**: HTTPS-only in production
-   **Input Validation**: Zod schemas for all inputs
-   **SQL Injection Prevention**: MongoDB parameterized queries

## 🎯 **Configuration Examples**

### **Welcome Messages**

```javascript
{
  "welcome": {
    "enabled": true,
    "channelId": "1234567890",
    "message": "Welcome {user} to {server}!"
  }
}
```

### **XP System**

```javascript
{
  "xp": {
    "enabled": true,
    "baseRate": 5  // XP per message
  }
}
```

### **YouTube Subscriber Roles**

```javascript
{
  "ytSubRoleConfig": {
    "isEnabled": true,
    "subscriberTiers": [
      { "minSubscribers": 100, "roleId": "123456" },
      { "minSubscribers": 1000, "roleId": "789012" },
      { "minSubscribers": 10000, "roleId": "345678" }
    ]
  }
}
```

## 📱 **Responsive Design**

The dashboard is fully responsive and works on:

-   **Desktop**: Full-featured layout with sidebars
-   **Tablet**: Optimized layout with collapsible menus
-   **Mobile**: Touch-friendly interface with mobile navigation

## 🚀 **Deployment**

### **Frontend Deployment (Netlify/Vercel)**

1. Build the dashboard:

```bash
npm run build:dash
```

2. Deploy the `dashboard/dist/` folder to your hosting service

3. Configure environment variables:

-   `DASHBOARD_BASE_URL`: Your production URL
-   `DASHBOARD_REDIRECT_URI`: Your production callback URL

### **Backend Deployment**

The API server runs alongside the Discord bot. Deploy as you would deploy the bot:

1. Ensure environment variables are set
2. Start the bot: `npm start`
3. API will be available on the configured port

### **Production Checklist**

-   [ ] Set `DASHBOARD_BASE_URL` to production URL
-   [ ] Set `DASHBOARD_REDIRECT_URI` to production callback
-   [ ] Update Discord OAuth redirect URLs
-   [ ] Generate secure `DASHBOARD_SESSION_SECRET`
-   [ ] Enable HTTPS for secure cookies
-   [ ] Configure CORS `DASHBOARD_ALLOW_ORIGINS`
-   [ ] Set up SSL certificate
-   [ ] Configure reverse proxy (nginx/Apache)
-   [ ] Enable rate limiting
-   [ ] Set up monitoring and logging

## 🔧 **Troubleshooting**

### **OAuth Errors**

**"Invalid redirect_uri"**

-   Ensure redirect URI matches exactly in Discord Developer Portal
-   Check for trailing slashes
-   Verify protocol (http vs https)

**"Invalid client"**

-   Verify `DASHBOARD_CLIENT_ID` is correct
-   Check `DASHBOARD_CLIENT_SECRET` is correct
-   Ensure bot application exists in Discord

### **API Connection Issues**

**"Network Error"**

-   Check API server is running
-   Verify `DASHBOARD_API_PORT` is correct
-   Check CORS configuration in `DASHBOARD_ALLOW_ORIGINS`
-   Ensure firewall allows connections

**"401 Unauthorized"**

-   Check JWT token is valid
-   Verify cookie is being sent
-   Check `DASHBOARD_SESSION_SECRET` matches
-   Try logging out and logging in again

### **Permission Errors**

**"Forbidden" or "Insufficient permissions"**

-   Ensure user has "Manage Server" permission
-   Check bot is in the guild
-   Verify guild ID is correct
-   Check bot has required permissions

## 📈 **Performance Optimization**

### **Frontend**

-   **Code Splitting**: Automatic route-based splitting with Vite
-   **Lazy Loading**: Components loaded on demand
-   **Asset Optimization**: Images and fonts optimized
-   **Caching**: Static assets cached by browser
-   **Minification**: JavaScript and CSS minified

### **Backend**

-   **Connection Pooling**: MongoDB connection reuse
-   **Caching**: Node-cache for frequently accessed data
-   **Rate Limiting**: Prevent API abuse
-   **Compression**: Gzip compression for responses
-   **Async Operations**: Non-blocking I/O

## 🔄 **Future Enhancements**

Planned improvements:

-   **WebSocket Support**: Real-time updates without polling
-   **Role Management UI**: Visual role configuration
-   **Custom Commands Editor**: Create/edit commands in dashboard
-   **Advanced Analytics**: Graphs and charts for bot statistics
-   **User Management**: View and manage server members
-   **Plugin System**: Install and configure bot plugins
-   **Theme Customization**: Light/dark mode and custom themes
-   **Mobile App**: Native mobile application
-   **Multi-language Support**: Internationalization (i18n)
-   **Advanced Permissions**: Fine-grained access control

## 📞 **Support**

For issues or questions:

1. Check this documentation
2. Review the [Logging System Documentation](LOGGING_SYSTEM.md)
3. Check the [Project Structure](PROJECT_STRUCTURE.md)
4. Review the main [README](../README.md)
5. Open an issue on GitHub

## 📝 **License**

The dashboard is part of Project Kiyo and is licensed under the same MIT license as the main project.
