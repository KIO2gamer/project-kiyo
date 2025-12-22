# Project Kiyo

A streamlined multipurpose Discord bot built with [discord.js](https://discord.js.org/) featuring slash commands and essential API integrations. This codebase has been cleaned up and optimized for better maintainability and security.

## Features

### Core Functionality

-   **🛡️ Auto-Moderation:** Advanced auto-moderation system with spam detection, mass mention protection, link filtering, bad word filter, anti-raid protection, and more
-   **Moderation Commands:** Comprehensive server management with bans, kicks, timeouts, channel locks, and role-based commands
-   **Music Playback:** Full music support with play, queue, skip, pause, resume, volume control, and now playing display
-   **Support Tickets:** Create, manage, and close support tickets with dedicated ticket categories
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

-   **🎬 YouTube Subscriber Roles:** Automatically assign Discord roles based on YouTube subscriber count with OAuth2 verification (now with guild-scoped, signed state tokens for enhanced security)
-   **Levels & Experience:** User XP tracking and leaderboards
-   **Role Management:** Automated role assignment and management
-   **Fun Commands:** Entertainment commands including games, trivia, and interactive features
-   **Database Integration:** MongoDB for persistent data storage
-   **AI Chatbot:** Natural, conversational AI responses with tuned generation settings

### 🏗️ **Project Structure**

This project follows a feature-based organization for better maintainability:

```
project-kiyo/
├── 📁 src/                          # Main source code
│   ├── 📁 commands/                 # Discord commands by category (87 total)
│   ├── 📁 features/                 # Feature-based organization
│   │   └── 📁 youtube-subscriber-roles/  # YouTube subscriber role feature
│   ├── 📁 database/                 # MongoDB schemas (18 schemas)
│   ├── 📁 events/                   # Discord.js event handlers (25 handlers)
│   └── 📁 utils/                    # Utility functions (16 utilities)
├── 📁 docs/                         # Documentation
├── 📁 deployments/                  # External service deployments
│   └── 📁 netlify-oauth/            # Netlify OAuth2 callback service
└── 📁 assets/                       # Static assets
```

See [📁 Project Structure Documentation](docs/PROJECT_STRUCTURE.md) for detailed information.

### Documentation Reference

-   **[Installation & Setup Guide](docs/INSTALLATION_AND_SETUP.md)** - Complete setup instructions
-   **[Commands Reference](docs/COMMANDS_REFERENCE.md)** - All 87 commands quick reference
-   **[Codebase Overview](docs/CODEBASE_OVERVIEW.md)** - Architecture and component guide
-   **[Music & Support Features](docs/MUSIC_AND_SUPPORT.md)** - Music playback and ticket management guide
-   **[Auto-Moderation System](docs/AUTO_MODERATION.md)** - Comprehensive moderation documentation
-   **[Logging System](docs/LOGGING_SYSTEM.md)** - Universal logging documentation
-   **[YouTube Subscriber Roles](docs/youtube-subscriber-roles/YOUTUBE_SUBSCRIBER_ROLES_SETUP.md)** - Setup and usage guide
-   **[Project Structure](docs/PROJECT_STRUCTURE.md)** - File organization and architecture

### Developer Resources

-   **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
-   **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Solutions for common issues

## Installation

**Quick Start:** Follow our [Installation & Setup Guide](docs/INSTALLATION_AND_SETUP.md) for complete step-by-step instructions.

### Quick Version

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/yourusername/project-kiyo.git
    cd project-kiyo
    ```

2. **Install Dependencies:**

    ```bash
    npm ci
    ```

3. **Configure Environment:**

    - Copy `.env.example` to `.env`
    - Add `DISCORD_TOKEN`, `CLIENTID`, and `MONGODB_URL`
    - (Optional) Add API keys for additional features

4. **Start the Bot:**
    ```bash
    npm start              # Production
    npm run dev           # Development with auto-reload
    ```

For detailed setup with all available options, see [Installation & Setup Guide](docs/INSTALLATION_AND_SETUP.md).

## Environment Variables

**Required:**

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENTID=your_client_id
MONGODB_URL=your_mongodb_url
```

**Optional (for features):**

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
WEATHER_API_KEY=your_weather_api_key
YOUTUBE_API_KEY=your_youtube_api_key
DISCORD_CLIENT_SECRET=your_oauth2_secret    # For YouTube roles
LOG_LEVEL=INFO
LOG_TO_FILE=false
```

See `.env.example` for all available options and [Installation & Setup Guide](docs/INSTALLATION_AND_SETUP.md) for detailed configuration.

## Project Structure

```
src/
├── commands/           # Organized command categories (100 total commands)
│   ├── Admin_And_Configuration/    # 20 commands
│   ├── API_Integrations/          # 8 commands
│   ├── Fun_And_Entertainment/     # 11 commands
│   ├── Information_And_Search/    # 12 commands
│   ├── Levels_And_Experience/     # 4 commands
│   ├── Moderation/                # 19 commands
│   ├── Music/                     # 10 commands
│   ├── Role_Management/           # 5 commands
│   ├── Support_And_Tickets/       # 6 commands
│   └── Utility/                   # 5 commands
├── database/          # MongoDB schemas and models (17 schemas)
├── events/            # Discord event listeners (14 handlers)
├── features/          # Feature-based organization
│   └── youtube-subscriber-roles/  # YouTube subscriber role feature
├── utils/             # Utility modules and helpers (16 utilities)
└── index.js           # Main bot entry point
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

This codebase has undergone significant cleanup and optimization, with recent enhancements including

-   **jsonwebtoken** - JWT authentication
-   **sharp** - Image processing
-   **zod** - Schema validation

## Recent Cleanup & Optimization

This codebase has undergone significant cleanup and optimization:

### Removed Dependencies & Features

-   **Unused utilities:** Removed redundant terminal styling packages (`boxen`, `figures`)
-   **Security improvements:** Removed eval command and other potentially dangerous development artifacts
-   **Broken API integrations:** Cleaned up non-functional API commands and deprecated services
-   **Low-value commands:** Removed overly specific meme commands and development-only features

### Code Quality Improvements

-   **Consolidated utilities:** Merged redundant error handling and string manipulation functions
-   **Cleaned configurations:** Streamlined environment variables and removed unused options
-   **Removed broken features:** Eliminated non-functional API integrations and low-value commands
-   **Enhanced security:** Removed eval command and other security risks

### Recent Feature Updates

-   **Music System:** Full music playback support with queue management, volume control, and Now Playing display
-   **Ticket Support System:** Create, manage, and close support tickets with dedicated ticket categories
-   **Auto-Moderation Enhancements:** Richer audit logs with deletion status, message IDs, attachment counts, and jump links for easier moderation review
-   **AI Chatbot Tuning:** Optimized generation settings (temperature: 0.7, topK: 40) for steadier, more concise conversational responses
-   **YouTube OAuth2 Security:** Guild-scoped, HMAC-signed state tokens with 15-minute expiry and user/state cross-validation to prevent token replay and cross-guild misuse

### Performance Benefits

-   **Optimized dependency footprint:** 25 production dependencies with music and ticket support
-   **Faster startup times:** Eliminated unused imports and optimized loading
-   **Better maintainability:** Cleaner code structure and consolidated functionality
-   **Enhanced security:** Removed dangerous commands and improved error handling
-   **Streamlined configuration:** Simplified environment variables and removed unused options

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

This project is licensed under the [MIT License](./LICENSE).

---

_For more details, see inline code comments and the project docs._
