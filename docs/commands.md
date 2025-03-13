# Kiyo Discord Bot Commands

This document provides an overview of the slash commands available in the Kiyo Discord bot. Each command is organized by category and located in the [`src/bot/commands`](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands) folder.

## Command Categories

Kiyo's commands are organized into the following categories for easy management:

- [Admin Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/admin)
- [Fun Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/fun)
- [Games Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/games)
- [Info Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/info)
- [Media Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/media)
- [Moderation Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/moderation)
- [Roles Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/roles)
- [Setup Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/setup)
- [Utility Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/utility)

## Popular Commands

### Moderation Commands

- **/ban**

    - **Description:** Bans a member from the server with the specified reason.
    - **Usage:** `/ban target:@user [reason:"ban reason"]`
    - **Examples:**
        - `/ban target:@user123`
        - `/ban target:@user123 reason:"Severe rule violation"`

- **/kick**

    - **Description:** Kicks a member from the server with the specified reason.
    - **Usage:** `/kick target:@user [reason:"kick reason"]`
    - **Examples:**
        - `/kick target:@user123`
        - `/kick target:@user123 reason:"Violating server rules"`

- **/timeout**

    - **Description:** Timeouts a member for the specified duration and reason.
    - **Usage:** `/timeout target:@user amount:"duration" [reason:"timeout reason"]`
    - **Examples:**
        - `/timeout target:@user123 amount:"1h"`
        - `/timeout target:@user123 amount:"30m" reason:"Being disruptive"`

- **/modify_channel**
    - **Description:** Modify various aspects of a channel including name, topic, and permissions.
    - **Usage:** `/modify_channel channel:#channel [name:"new name"] [topic:"new topic"]`
    - **Examples:**
        - `/modify_channel channel:#general name:"community-chat"`
        - `/modify_channel channel:#announcements topic:"Official server announcements"`

### Utility Commands

- **/photo**

    - **Description:** Searches for and displays photos from Pexels based on your query. You can customize the number of photos, orientation, size, and even request a random photo.
    - **Usage:** `/photo <query:search_term> [count:1-5] [orientation:landscape/portrait/square] [size:small/medium/large] [random:true/false]`
    - **Examples:**
        - `/photo sunset count:3 orientation:landscape`
        - `/photo cat random:true`

- **/user_info**

    - **Description:** Shows information about a user, either the user who executed the command or a specified user. This includes their username, ID, roles, join date, status, activity, and more.
    - **Usage:** `/user_info [target]`
    - **Examples:**
        - `/user_info`
        - `/user_info target:@user123`

- **/server_info**

    - **Description:** Displays comprehensive information about the current Discord server, including its name, owner, creation date, member count, channels, roles, emojis, and more.
    - **Usage:** `/server_info`

- **/translate**
    - **Description:** Translates text into the desired output language.
    - **Usage:** `/translate input:"text to translate" target_lang:"language code"`
    - **Examples:**
        - `/translate input:"Hello, world!" target_lang:es`
        - `/translate input:"Bonjour" target_lang:en`

### Fun Commands

- **/8ball**

    - **Description:** Ask a question to the magic 8-ball and receive a mystical (and often hilarious) response.
    - **Usage:** `/8ball <question>`
    - **Examples:**
        - `/8ball Will I win the lottery?`

- **/roll**

    - **Description:** Simulates a dice roll and displays the corresponding dice face.
    - **Usage:** `/roll`

- **/coin_flip**

    - **Description:** Flips a coin and optionally places a bet on heads or tails.
    - **Usage:** `/coin_flip [bet]`
    - **Examples:**
        - `/coin_flip`
        - `/coin_flip bet:heads`

- **/meme**
    - **Description:** Fetches and displays a random, SFW meme from the internet.
    - **Usage:** `/meme`

### Games Commands

- **/hangman**

    - **Description:** Start a game of hangman with a random word.
    - **Usage:** `/hangman`

- **/lyricwhiz**
    - **Description:** Test your knowledge of song lyrics in this interactive quiz game.
    - **Usage:** `/lyricwhiz`

### YouTube Integration

- **/get_yt_sub_role**
    - **Description:** Verify your YouTube channel using Discord OAuth2 and assign a role based on your subscriber count.
    - **Usage:** `/get_yt_sub_role`
    - **Process:**
        1. The command initiates an OAuth2 flow to connect your Discord account with YouTube
        2. After authorization, your YouTube subscriber count is verified
        3. You receive a role based on your subscriber milestone

## Admin Commands

- **/reload**
    - **Description:** Reloads a specific command, or all commands if no command is specified.
    - **Usage:** `/reload [command name]`
    - **Examples:**
        - `/reload` (reloads all commands)
        - `/reload ban` (reloads just the ban command)
    - **Permissions Required:** Administrator

## Adding New Commands

To add a new command to Kiyo, follow these steps:

1. Create a new JavaScript file in the appropriate category folder under `src/bot/commands/`
2. Follow the standard command structure:

    ```javascript
    const { SlashCommandBuilder } = require('discord.js');

    module.exports = {
    	description_full: 'Detailed description of what the command does',
    	usage: '/command_name <required_param> [optional_param]',
    	examples: ['/command_name example1', '/command_name example2'],
    	category: 'category_name',
    	data: new SlashCommandBuilder()
    		.setName('command_name')
    		.setDescription('Brief description of the command'),

    	async execute(interaction) {
    		// Command implementation
    	},
    };
    ```

3. Ensure your command has proper error handling
4. Add appropriate permission checks if needed
5. Test your command thoroughly before deployment

## Command Structure

Each command in Kiyo follows a consistent structure:

- data : SlashCommandBuilder object defining the command name, description, and parameters
- description_full : Detailed description of what the command does
- usage : How to use the command, including parameters
- examples : Example usages of the command
- category : The category the command belongs to
- execute : The function that runs when the command is invoked

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

**[MIT License](https://github.com/KIO2gamer/project-kiyo/blob/main/LICENSE.md)**
