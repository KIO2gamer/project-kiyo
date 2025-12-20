# 🚀 Installation & Setup Guide

Complete step-by-step guide for setting up and deploying Project Kiyo.

## 📋 Prerequisites

Before you begin, ensure you have:

-   **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
-   **npm** v8.0.0 or higher (comes with Node.js)
-   **Git** for cloning the repository ([Download](https://git-scm.com/))
-   **MongoDB** database URL (cloud or local instance)
-   **Discord Bot Token** from Discord Developer Portal
-   **Discord Server** for testing

### Optional Requirements (for full features)

-   **Google Cloud Project** with APIs enabled:
    -   Google Generative AI API (Gemini)
    -   Google Translate API
    -   YouTube Data API
    -   Custom Search API
-   **Weather API key** (OpenWeatherMap or similar)
-   **Netlify account** (for OAuth2 callback deployment)

## 🎯 Step 1: Clone and Setup

### 1.1 Clone the Repository

```bash
git clone https://github.com/yourusername/project-kiyo.git
cd project-kiyo
```

### 1.2 Install Dependencies

```bash
npm ci
```

**Note:** Use `npm ci` (clean install) instead of `npm install` for reproducible builds in production.

### 1.3 Verify Installation

```bash
npm run lint
```

If ESLint passes without errors, your setup is correct.

## ⚙️ Step 2: Environment Configuration

### 2.1 Create `.env` File

Copy the template and create your `.env`:

```bash
cp .env.example .env
```

### 2.2 Configure Required Variables

Edit `.env` with your values:

```env
# ===== REQUIRED =====
DISCORD_TOKEN=your_discord_bot_token_here
CLIENTID=your_discord_client_id_here
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/kiyo?retryWrites=true&w=majority

# ===== OPTIONAL API KEYS =====
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# ===== DISCORD OAUTH2 (for YouTube Subscriber Roles) =====
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/callback

# ===== OAUTH2 SECURITY =====
# Generate a random 32-64 byte secret (use 'openssl rand -base64 48')
OAUTH_STATE_SECRET=your_random_secret_here_min_32_bytes

# ===== BOT CONFIGURATION =====
# Primary guild ID for testing (optional)
GUILDID=your_test_guild_id_here

# ===== LOGGING CONFIGURATION =====
LOG_LEVEL=INFO
# Levels: ERROR, WARN, INFO (default), DEBUG, SUCCESS
LOG_TO_FILE=true
LOG_FOLDER=logs

# ===== MUSIC CONFIGURATION (Optional) =====
YOUTUBE_MUSIC_ENABLED=true
```

### 2.3 Get Discord Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" → "Add Bot"
4. Under "TOKEN" click "Copy"
5. Paste into `.env` as `DISCORD_TOKEN`

### 2.4 Get MongoDB URL

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster
3. In "Database Access" create a database user
4. In "Network Access" allow your IP
5. Click "Connect" → "Connect your application"
6. Copy connection string to `.env`

#### Option B: Local MongoDB

```bash
# Install MongoDB Community Edition
# Then use:
MONGODB_URL=mongodb://localhost:27017/kiyo
```

### 2.5 Get API Keys (Optional)

#### Google Generative AI (Gemini)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Add to `.env` as `GEMINI_API_KEY`

#### Google Cloud APIs

1. Create [Google Cloud Project](https://console.cloud.google.com/)
2. Enable APIs:
    - Cloud Translation API
    - YouTube Data API
    - Custom Search API
3. Create Service Account key
4. Download JSON key file
5. Add `GOOGLE_API_KEY` to `.env`

#### Weather API

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get API key from account
3. Add to `.env` as `WEATHER_API_KEY`

## 🔧 Step 3: Discord Bot Configuration

### 3.1 Bot Permissions

When inviting your bot to a server, ensure these permissions:

```
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Mention @everyone
- Manage Messages
- Manage Channels
- Manage Roles
- Kick Members
- Ban Members
- Timeout Members
- Use Voice
- Connect
- Speak
- Manage Webhooks
```

**Permissions Integer:** `1099511627867`

### 3.2 Invite URL

Create invite URL with correct permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099511627867&scope=bot%20applications.commands
```

### 3.3 Slash Commands Registration

Commands are registered automatically on first startup. If needed, force refresh:

```bash
# Add to development code temporarily:
await client.application?.commands.set(commands);
```

## 🎮 Step 4: First Run

### 4.1 Development Mode

```bash
npm run dev
```

Expected output:

```
[INFO] Bot started successfully!
[INFO] Ready as: YourBotName#1234
[SUCCESS] Loaded 100 commands
[SUCCESS] Loaded 14 events
```

### 4.2 Production Mode

```bash
npm start
```

### 4.3 Debug Mode (if issues arise)

```bash
npm run dev:debug
```

Then connect debugger to `http://localhost:9229`

## 🧪 Step 5: Verify Functionality

### 5.1 Test Basic Commands

In Discord server, try:

-   `/help` - Should list all commands
-   `/ping` - Should respond with bot latency
-   `/server` - Should show server info
-   `/user` - Should show your user info

### 5.2 Test Auto-Moderation

Only with admin permissions:

-   `/automod status` - Show mod settings
-   `/automod enable` - Enable auto-mod
-   Test spam detection by sending messages quickly

### 5.3 Test Logging

Check `logs/` directory:

```bash
ls logs/
tail -f logs/bot-2025-12-20.log
```

## 🎬 Step 6: YouTube Subscriber Roles Setup (Optional)

### 6.1 Initial Configuration

Admin command in Discord:

```
/yt_sub_role_config
```

This opens a dialog to:

1. Connect YouTube channel
2. Set subscriber tier roles
3. Configure verification requirements

### 6.2 Deploy OAuth2 Callback Server

To Netlify (recommended):

```bash
cd deployments/netlify-oauth
npm install
npm run build
netlify deploy
```

See [Netlify Deployment Guide](youtube-subscriber-roles/NETLIFY_DEPLOYMENT_GUIDE.md) for details.

### 6.3 Test OAuth2 Flow

1. Run `/get_yt_sub_role` in Discord
2. Click authorization link
3. Authorize YouTube access
4. Verify roles are assigned

## 📊 Step 7: Monitoring & Logging

### 7.1 Enable File Logging

In `.env`:

```env
LOG_TO_FILE=true
LOG_FOLDER=logs
```

### 7.2 Log Levels

Set appropriate level in `.env`:

```env
LOG_LEVEL=INFO
# Options: ERROR, WARN, INFO, DEBUG, SUCCESS
```

### 7.3 Monitor Bot Health

```bash
# View recent logs
tail -f logs/bot-*.log

# Check specific module
grep "COMMANDS" logs/bot-*.log
```

### 7.4 Discord Log Channels

Configure where bot posts logs:

```
/setlogchannel #bot-logs
```

Bot will send:

-   Auto-moderation actions
-   Command errors
-   Database issues
-   Security events

## 🚀 Step 8: Production Deployment

### 8.1 Prepare for Production

```bash
# Clean test files
npm run cleanup

# Verify code quality
npm run lint

# Final test
npm start
```

### 8.2 Hosting Options

#### Option A: Heroku (Free tier ending)

1. Push to Heroku using Git
2. Set environment variables in Heroku dashboard
3. Bot runs continuously

#### Option B: VPS/Dedicated Server

1. Install Node.js on server
2. Upload project files
3. Use process manager (PM2):
    ```bash
    npm install -g pm2
    pm2 start src/index.js --name "kiyo"
    pm2 logs kiyo
    ```

#### Option C: Docker Container

1. Create Dockerfile (if not exists):

    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY . .
    RUN npm ci --only=production
    CMD ["node", "src/index.js"]
    ```

2. Build and run:
    ```bash
    docker build -t kiyo .
    docker run -d -e DISCORD_TOKEN=$TOKEN kiyo
    ```

### 8.3 Process Management (PM2)

```bash
# Start bot
pm2 start src/index.js --name "project-kiyo"

# Restart on file changes
pm2 restart "project-kiyo"

# View logs
pm2 logs "project-kiyo"

# Monitor
pm2 monit

# Start on system reboot
pm2 startup
pm2 save
```

### 8.4 Database Backups

Set up automated MongoDB backups:

```bash
# Monthly backup
0 0 1 * * mongodump --uri "$MONGODB_URL" --out /backups/kiyo-$(date +\%Y\%m\%d)
```

## 🔧 Troubleshooting

### Bot won't start

**Error:** `Cannot find module`

```bash
# Solution
npm install
npm ci
```

**Error:** `DISCORD_TOKEN is not set`

```bash
# Check .env file exists and has DISCORD_TOKEN
cat .env | grep DISCORD_TOKEN
```

### Commands not showing

**Solution:** Commands auto-register on startup

```bash
# If missing, restart bot:
npm run dev
# Wait 1-2 minutes for registration
```

### MongoDB connection fails

**Check connection string:**

```bash
# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URL)"
```

### API key errors

**Error:** `GEMINI_API_KEY not set`

```bash
# Add to .env and restart
GEMINI_API_KEY=your_key_here
npm run dev
```

### Memory usage high

**Solution:** Enable GC logging:

```bash
npm run dev:trace
```

## 📚 Next Steps

1. **Read Documentation:**

    - [Project Structure](PROJECT_STRUCTURE.md)
    - [Auto-Moderation Guide](AUTO_MODERATION.md)
    - [Logging System](LOGGING_SYSTEM.md)

2. **Explore Features:**

    - `/help` command in Discord
    - Check each command category
    - Review database schemas

3. **Customize:**

    - Create custom commands (see `customCommands.js`)
    - Add server-specific settings
    - Tune auto-moderation thresholds

4. **Extend:**
    - Create new features in `src/features/`
    - Add new event handlers
    - Develop community integrations

## 📞 Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review error logs in `/logs/`
3. Check Discord.js documentation
4. Open GitHub issue with error details

## ✅ Setup Checklist

-   [ ] Node.js and npm installed
-   [ ] Repository cloned
-   [ ] Dependencies installed (`npm ci`)
-   [ ] `.env` file created with required variables
-   [ ] Discord bot token obtained
-   [ ] MongoDB URL configured
-   [ ] Bot runs without errors (`npm run dev`)
-   [ ] Commands appear in Discord
-   [ ] Basic commands tested
-   [ ] Logging working
-   [ ] (Optional) OAuth2 deployed for subscriber roles
-   [ ] (Optional) API keys configured

---

**Congratulations!** Your Project Kiyo Discord bot is ready to use! 🎉

For detailed feature documentation, see [CODEBASE_OVERVIEW.md](CODEBASE_OVERVIEW.md).
