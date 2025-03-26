# ⚠️⚠️⚠️ THIS PROJECT IS NOW ARCHIVED. I AM REBUILDING THE WHOLE PROJECT IN A NEW REPOSITORY

# Project Kiyo

A multipurpose Discord bot built with [discord.js](https://discord.js.org/) featuring slash commands and various API integrations.

## Features

-   **Fun Commands:** Includes commands like `/chairhit`, `/echo`, `/rickroll`, `/snipe`, and more.
-   **Moderation Commands:** Manage bans, kicks, timeouts, channel locks, role-based commands, etc.
-   **Utility Commands:** Get user info, server info, translations, weather details, avatar lookups, and more.
-   **API Integrations:** Connects to external APIs (e.g. weather, Google Generative AI, etc.) for additional functionality.

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

    Create a `.env` file in the project root with the following keys (adjust values as needed):

    ```
    DISCORD_TOKEN=your_discord_token
    CLIENTID=your_client_id
    GUILDID=your_primary_guild_id
    MONGODB_URL=your_mongodb_url
    GEMINI_API_KEY=your_gemini_api_key
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

-   **Linting and Formatting:**
    ```bash
    npm run lint
    npm run format
    ```

## Project Structure

-   **`commands/`**: Contains organized command folders.
-   **`events/`**: Event listeners for Discord events.
-   **`utils/`**: Utility modules for error handling and logging.
-   **`.github/workflows/`**: GitHub CI/CD configurations.
-   **`package.json`**: Project metadata and scripts.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

This project is licensed under the [MIT License](./LICENSE).

---

_For more details, see inline code comments and the project docs._
