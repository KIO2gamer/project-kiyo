# Project Kiyo

A streamlined multipurpose Discord bot built with [discord.js](https://discord.js.org/) featuring slash commands and essential API integrations. This codebase has been cleaned up and optimized for better maintainability and security.

## Features

### Core Functionality

-   **Moderation Commands:** Comprehensive server management with bans, kicks, timeouts, channel locks, and role-based commands
-   **Information & Search:** User info, server info, avatar lookups, help system, and bot statistics
-   **Utility Commands:** Translations, weather details, calculator, polls, reminders, and status checks
-   **Admin & Configuration:** Channel management, custom commands, embed creation, and bot configuration

### API Integrations

-   **Google Generative AI:** AI-powered chat responses and content generation
-   **Google APIs:** Translation services and search functionality
-   **Weather API:** Real-time weather information
-   **YouTube Data API:** Channel statistics and subscriber verification
-   **External APIs:** Photo search and various web services

### Featured Capabilities

-   **🎬 YouTube Subscriber Roles:** Automatically assign Discord roles based on YouTube subscriber count with OAuth2 verification
-   **Levels & Experience:** User XP tracking and leaderboards
-   **Role Management:** Automated role assignment and management
-   **Fun Commands:** Entertainment commands including games, trivia, and interactive features
-   **Database Integration:** MongoDB for persistent data storage

### 🏗️ **Project Structure**

This project follows a feature-based organization for better maintainability:

```
project-kiyo/
├── 📁 src/                          # Main source code
│   ├── 📁 commands/                 # Discord commands by category (89 total)
│   ├── 📁 api/                      # Express API server for dashboard
│   ├── 📁 features/                 # Feature-based organization
│   │   └── 📁 youtube-subscriber-roles/  # YouTube subscriber role feature
│   ├── 📁 database/                 # MongoDB schemas
│   ├── 📁 events/                   # Discord.js event handlers
│   └── 📁 utils/                    # Utility functions
├── 📁 dashboard/                    # Web dashboard (React + Vite + Tailwind)
├── 📁 docs/                         # Documentation
├── 📁 deployments/                  # External service deployments
│   └── 📁 netlify-oauth/            # Netlify OAuth2 callback service
└── 📁 assets/                       # Static assets
```

See [📁 Project Structure Documentation](docs/PROJECT_STRUCTURE.md) for detailed information.

## Installation

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/yourusername/project-kiyo.git
    cd project-kiyo
    ```

2. **Install Dependencies:**
    ```bash
    npm ci
    ```
3. **Environment Variables:**

    Create a `.env` file in the project root with the following keys (see `.env.example` for reference):

    ```
    # Required
    DISCORD_TOKEN=your_discord_token
    CLIENTID=your_client_id
    MONGODB_URL=your_mongodb_url

    # Optional API Keys
    GEMINI_API_KEY=your_gemini_api_key
    GOOGLE_API_KEY=your_google_api_key
    WEATHER_API_KEY=your_weather_api_key

    # Optional Configuration
    GUILDID=your_primary_guild_id
    LOG_LEVEL=INFO
    LOG_TO_FILE=false
    LOG_FOLDER=logs
    ```

4. **Prepare Git Hooks (if needed):**
    ```bash
    npm run prepare
    ```

## Usage

-   **Run the Bot:**

    ```bash
    npm start
    ```

-   **Development Mode:**

    ```bash
    npm run dev
    ```

-   **Code Quality:**
    ```bash
    npm run lint      # Run ESLint with auto-fix
    npm run format    # Format code with Prettier
    ```

## Dashboard (web + API)

The dashboard lives in `dashboard/` (Vite + React + Tailwind) and talks to the bot-hosted Express API under `/api`.

1. **Environment:** set the new variables (see `.env.example`):
    - `DASHBOARD_CLIENT_ID`, `DASHBOARD_CLIENT_SECRET`, `DASHBOARD_REDIRECT_URI`
    - `DASHBOARD_BASE_URL`, `DASHBOARD_SESSION_SECRET`, `DASHBOARD_API_PORT`, `DASHBOARD_ALLOW_ORIGINS`
2. **Install dashboard deps:**
    ```bash
    npm install --prefix dashboard
    ```
3. **Run dev servers:**
    ```bash
    npm run dev          # bot + API (port from DASHBOARD_API_PORT)
    npm run dev:dash     # dashboard UI (defaults to http://localhost:5173)
    ```
4. **Build dashboard:**
    ```bash
    npm run build:dash   # outputs to dashboard/dist
    ```
    The API only starts when the dashboard env vars are present; otherwise it logs a warning and skips.

## Dashboard Deployment (Netlify)

Deploy the dashboard to your existing Netlify site with automatic builds from GitHub.

### Setup

1. **Connect your GitHub repo** to Netlify (if not already done)

2. **Configure environment variables** in Netlify UI:

    - Go to **Site Settings** → **Build & Deploy** → **Environment**
    - Add the following (see `.netlify.env.example` for reference):
        - `DASHBOARD_CLIENT_ID`, `DASHBOARD_CLIENT_SECRET`
        - `DASHBOARD_REDIRECT_URI` (your Netlify URL + `/callback`)
        - `DASHBOARD_BASE_URL` (your Netlify URL)
        - `DASHBOARD_SESSION_SECRET` (generate a random secure string)
        - `DASHBOARD_API_PORT=3001`
        - `DASHBOARD_ALLOW_ORIGINS` (your Netlify URL)

3. **Update Discord OAuth Redirect URIs**:

    - Go to [Discord Developer Portal](https://discord.com/developers/applications)
    - Select your app → **OAuth2** → **General**
    - Add your Netlify URL as a valid redirect URI: `https://your-site.netlify.app/callback`

4. **Deploy**:
    - Push to your `main` or `dev` branch
    - Netlify automatically builds and deploys the dashboard
    - The site will serve `dashboard/dist` with OAuth and serverless functions enabled

### How It Works

-   **`netlify.toml`** configures the build:
    -   Builds dashboard via `npm run build:dash`
    -   Publishes `dashboard/dist` as the site root
    -   Mounts OAuth serverless functions at `/.netlify/functions/`
    -   Routes API calls to the backend
    -   Redirects SPA routes to `index.html` for React Router

### Local Testing

```bash
npm install -g netlify-cli
netlify dev
```

This runs the full stack locally with Netlify emulation.

## Project Structure

```
src/
├── commands/           # Organized command categories (89 total commands)
│   ├── Admin_And_Configuration/    # 20 commands
│   ├── API_Integrations/          # 7 commands
│   ├── Fun_And_Entertainment/     # 11 commands
│   ├── Information_And_Search/    # 12 commands
│   ├── Levels_And_Experience/     # 3 commands
│   ├── Moderation/                # 18 commands
│   ├── Role_Management/           # 5 commands
│   └── Utility/                   # 13 commands
├── api/               # Express API server (679 lines)
│   └── server.js      # Dashboard backend API
├── database/          # MongoDB schemas and models
├── events/            # Discord event listeners
├── features/          # Feature-based organization
│   └── youtube-subscriber-roles/  # YouTube subscriber role feature
├── utils/             # Utility modules and helpers
└── index.js           # Main bot entry point

dashboard/             # Web dashboard frontend
├── src/               # React components
│   ├── App.jsx        # Main app component
│   ├── api.js         # API client
│   └── main.jsx       # Entry point
├── dist/              # Build output
└── vite.config.js     # Vite configuration
```

### Key Dependencies

**Core Dependencies (20 total):**

-   **discord.js** - Discord API wrapper
-   **mongoose** - MongoDB object modeling
-   **express** - Web framework for API server
-   **@google/generative-ai** - Google AI integration
-   **googleapis** - Google APIs client
-   **axios** - HTTP client for API requests
-   **mathjs** - Mathematical operations
-   **mathjax-full** - LaTeX rendering support
-   **moment** - Date/time manipulation
-   **@iamtraction/google-translate** - Translation services
-   **chalk** - Terminal colors and styling
-   **dotenv** - Environment variable management
-   **he** - HTML entity encoding/decoding
-   **ms** - Time string parsing
-   **node-cache** - In-memory caching
-   **cors** - CORS middleware
-   **cookie-parser** - Cookie parsing
-   **jsonwebtoken** - JWT authentication
-   **sharp** - Image processing
-   **zod** - Schema validation

## Recent Cleanup & Optimization

This codebase has undergone significant cleanup and optimization:

### Removed Dependencies & Features

-   **Music functionality:** Removed incomplete music commands and related dependencies (`discord-player`, `@discordjs/opus`, `@discordjs/voice`, `ytdl-core`, `play-dl`, `ffmpeg-static`)
-   **Unused utilities:** Removed redundant terminal styling packages (`boxen`, `figures`)
-   **Security improvements:** Removed eval command and other potentially dangerous development artifacts
-   **Broken API integrations:** Cleaned up non-functional API commands and deprecated services
-   **Low-value commands:** Removed overly specific meme commands and development-only features

### Code Quality Improvements

-   **Consolidated utilities:** Merged redundant error handling and string manipulation functions
-   **Cleaned configurations:** Streamlined environment variables and removed unused options
-   **Removed broken features:** Eliminated non-functional API integrations and low-value commands
-   **Enhanced security:** Removed eval command and other security risks

### Performance Benefits

-   **Optimized dependency footprint:** 20 essential production dependencies
-   **Faster startup times:** Eliminated unused imports and optimized loading
-   **Better maintainability:** Cleaner code structure and consolidated functionality
-   **Enhanced security:** Removed dangerous commands and improved error handling
-   **Streamlined configuration:** Simplified environment variables and removed unused options
-   **Modern web dashboard:** React + Vite for fast development and builds
-   **Full-featured API:** Express server with authentication and authorization

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

This project is licensed under the [MIT License](./LICENSE).

---

_For more details, see inline code comments and the project docs._
