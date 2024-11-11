# Kiyo Discord Bot

A versatile Discord bot with moderation, entertainment, and utility features. This bot is only for the [TKOD Discord server](https://discord.gg/y3GvzeZVJ3).

## Requirements

- Node.js >= 18.0.0
- npm

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/KIO2gamer/project-kiyo.git
    cd project-kiyo
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file and add your configuration:

    ```plaintext
    DISCORD_TOKEN=your_discord_token
    IGDB_CLIENT_SECRET=your_igdb_client_secret
    DISCORD_CLIENT_SECRET=your_discord_client_secret
    MONGODB_URI=your_mongodb_uri
    DISCORD_REDIRECT_URI=your_discord_redirect_uri
    GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id
    IGDB_CLIENT_ID=your_igdb_client_id
    DISCORD_CLIENT_ID=your_discord_client_id
    DISCORD_GUILD_IDS=your_discord_guild_ids
    GOOGLE_API_KEY=your_google_api_key
    YOUTUBE_API_KEY=your_youtube_api_key
    PEXELS_API_KEY=your_pexels_api_key
    WEATHER_API_KEY=your_weather_api_key
    TENOR_API_KEY=your_tenor_api_key
    GIPHY_API_KEY=your_giphy_api_key
    MUSIXMATCH_API_KEY=your_musixmatch_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4. Start the bot:

    ```sh
    npm start
    ```

## Running Tests

To run tests, use:

```sh
npm test
```

## Commands

### Moderation

- **Edit Reason**: Edits the reason for a specific log entry or a range of log entries.

  - Usage: `/edit_reason reason:"new reason" [lognumber] [logrange]`
  - Examples:
    - `/edit_reason reason:"Spamming" lognumber:5`
    - `/edit_reason reason:"Inappropriate behavior" logrange:10-15`
  - File: [commands/moderation/editReason.js](commands/moderation/editReason.js)

- **Warn**: Issues a warning to a user.
  - File: [commands/moderation/warn.js](commands/moderation/warn.js)

### Info

- **User Info**: Shows information about a user.

  - Usage: `/user_info [target]`
  - Examples:
    - `/user_info`
    - `/user_info @user`
  - File: [commands/info/userInfo.js](commands/info/userInfo.js)

- **Credits**: Shows an embed acknowledging and listing the contributors who helped create the bot.

  - Usage: `/credits`
  - Examples: `/credits`
  - File: [commands/info/credits.js](commands/info/credits.js)

- **Game Info**: Displays information about a game.
  - File: [commands/info/gameInfo.js](commands/info/gameInfo.js)

### Customs

- **Custom Edit**: Edits an existing custom command.
  - Usage: `/custom_edit <name:command_name_or_alias> <new_message:updated_response> [new_alias:new_alternate_name]`
  - Examples:
    - `/custom_edit name:hello new_message:Hello, world!`
    - `/custom_edit name:greet new_message:Welcome! new_alias:welcome`
  - File: [commands/customs/customEdit.js](commands/customs/customEdit.js)

### Roles

- **Edit Role in DB**: Edits the name and/or color of a role stored in the database.
  - Usage: `/edit_role_in_data <role:role> [name:new_name] [color:#hexcolor]`
  - Examples:
    - `/edit_role_in_data role:Moderators name:"Senior Moderators"`
    - `/edit_role_in_data role:VIP color:#FFD700`
  - File: [commands/roles/editRoleInDB.js](commands/roles/editRoleInDB.js)

### Utility

- **Modify Channel**: Updates the name of a channel.
  - File: [commands/utility/modifyChannel.js](commands/utility/modifyChannel.js)

## Deployment

1. Initialize a new Git repository:

    ```sh
    git init
    git add .
    git commit -m "Initial commit"
    ```

2. Add the remote repository and push the code:

    ```sh
    git remote add origin https://github.com/KIO2gamer/project-kiyo.git
    git branch -M main
    git push -u origin main
    ```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/KIO2gamer/project-kiyo/blob/main/LICENSE.md)
