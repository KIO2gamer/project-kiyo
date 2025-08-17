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
-   **External APIs:** Photo search and various web services

### Additional Features

-   **Levels & Experience:** User XP tracking and leaderboards
-   **Role Management:** Automated role assignment and management
-   **Fun Commands:** Entertainment commands including games, trivia, and interactive features
-   **Database Integration:** MongoDB for persistent data storage

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

## Project Structure

```
src/
├── commands/           # Organized command categories (84 total commands)
│   ├── Admin_And_Configuration/    # 18 commands
│   ├── API_Integrations/          # 6 commands
│   ├── Fun_And_Entertainment/     # 12 commands
│   ├── Information_And_Search/    # 12 commands
│   ├── Levels_And_Experience/     # 3 commands
│   ├── Moderation/                # 18 commands
│   ├── Role_Management/           # 5 commands
│   └── Utility/                   # 10 commands
├── database/          # MongoDB schemas and models
├── events/            # Discord event listeners
├── utils/             # Utility modules and helpers
└── index.js           # Main bot entry point
```

### Key Dependencies

**Core Dependencies (13 total):**

-   **discord.js** - Discord API wrapper
-   **mongoose** - MongoDB object modeling
-   **@google/generative-ai** - Google AI integration
-   **googleapis** - Google APIs client
-   **axios** - HTTP client for API requests
-   **mathjs** - Mathematical operations
-   **moment** - Date/time manipulation
-   **@iamtraction/google-translate** - Translation services
-   **chalk** - Terminal colors and styling
-   **dotenv** - Environment variable management
-   **he** - HTML entity encoding/decoding
-   **ms** - Time string parsing
-   **node-cache** - In-memory caching

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

-   **52% smaller dependency footprint:** Reduced from 27 to 13 production dependencies
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
