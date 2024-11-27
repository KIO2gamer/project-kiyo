# Kiyo Discord Bot Commands

This document provides an overview of all the slash commands available in the Kiyo Discord Bot. Each command is located in the `src/bot/commands` folder.

## Commands

### Moderation Commands

-   **/ban**

    -   **Description:** Bans a user from the server.
    -   **Usage:** `/ban @user [reason]`

-   **/kick**

    -   **Description:** Kicks a user from the server.
    -   **Usage:** `/kick @user [reason]`

-   **/mute**

    -   **Description:** Mutes a user in the server.
    -   **Usage:** `/mute @user [duration]`

-   **/unmute**
    -   **Description:** Unmutes a user in the server.
    -   **Usage:** `/unmute @user`

### Entertainment Commands

-   **/meme**

    -   **Description:** Fetches a random meme.
    -   **Usage:** `/meme`

-   **/joke**

    -   **Description:** Tells a random joke.
    -   **Usage:** `/joke`

-   **/quote**
    -   **Description:** Provides a random inspirational quote.
    -   **Usage:** `/quote`

### Utility Commands

-   **/ping**

    -   **Description:** Checks the bot's latency.
    -   **Usage:** `/ping`

-   **/userinfo**

    -   **Description:** Displays information about a user.
    -   **Usage:** `/userinfo @user`

-   **/serverinfo**
    -   **Description:** Displays information about the server.
    -   **Usage:** `/serverinfo`

### Music Commands

-   **/play**

    -   **Description:** Plays a song from YouTube.
    -   **Usage:** `/play [song name or URL]`

-   **/skip**

    -   **Description:** Skips the current song.
    -   **Usage:** `/skip`

-   **/stop**
    -   **Description:** Stops the music and clears the queue.
    -   **Usage:** `/stop`

### Fun Commands

-   **/8ball**

    -   **Description:** Answers a yes/no question.
    -   **Usage:** `/8ball [question]`

-   **/roll**

    -   **Description:** Rolls a dice.
    -   **Usage:** `/roll [number of sides]`

-   **/flip**
    -   **Description:** Flips a coin.
    -   **Usage:** `/flip`

## Adding New Commands

To add a new command, create a new file in the `src/bot/commands` folder and follow the existing command structure.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/KIO2gamer/project-kiyo/blob/main/LICENSE.md)
