# Slash Commands

This document provides an overview of 100 slash commands available in this discord bot. Each command is located in the [`src/bot/commands`](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands) folder.

## Some Common Commands Information

### Moderation Commands

-   **/ban**

    -   **Description:** Bans a member from the server with the specified reason.
    -   **Usage:** `/ban target:@user [reason:"ban reason"]`
    -   **Examples:**
        -   `/ban target:@user123`
        -   `/ban target:@user123 reason:"Severe rule violation"`

-   **/kick**

    -   **Description:** Kicks a member from the server with the specified reason.
    -   **Usage:** `/kick target:@user [reason:"kick reason"]`
    -   **Examples:**
        -   `/kick target:@user123`
        -   `/kick target:@user123 reason:"Violating server rules"`

-   **/timeout**

    -   **Description:** Timeouts a member for the specified duration and reason.
    -   **Usage:** `/timeout target:@user amount:"duration" [reason:"timeout reason"]`
    -   **Examples:**
        -   `/timeout target:@user123 amount:"1h"`
        -   `/timeout target:@user123 amount:"30m" reason:"Being disruptive"`

### Utility Commands

-   **/photo**

    -   **Description:** Searches for and displays photos from Pexels based on your query. You can customize the number of photos, orientation, size, and even request a random photo.
    -   **Usage:** `/photo <query:search_term> [count:1-5] [orientation:landscape/portrait/square] [size:small/medium/large] [random:true/false]`
    -   **Examples:**
        -   `/photo sunset count:3 orientation:landscape`
        -   `/photo cat random:true`

-   **/userinfo**

    -   **Description:** Shows information about a user, either the user who executed the command or a specified user. This includes their username, ID, roles, join date, status, activity, and more.
    -   **Usage:** `/user_info [target]`
    -   **Examples:**
        -   `/user_info`
        -   `/user_info target:@user123`

-   **/serverinfo**

    -   **Description:** Displays comprehensive information about the current Discord server, including its name, owner, creation date, member count, channels, roles, emojis, and more.
    -   **Usage:** `/server_info`

### Fun Commands

-   **/8ball**

    -   **Description:** Ask a question to the magic 8-ball and receive a mystical (and often hilarious) response.
    -   **Usage:** `/8ball <question>`
    -   **Examples:**
        -   `/8ball Will I win the lottery?`

-   **/roll**

    -   **Description:** Simulates a dice roll and displays the corresponding dice face.
    -   **Usage:** `/roll`

-   **/coin_flip**

    -   **Description:** Flips a coin and optionally places a bet on heads or tails.
    -   **Usage:** `/coin_flip [bet]`
    -   **Examples:**
        -   `/coin_flip`
        -   `/coin_flip bet:heads`

-   **/meme**

    -   **Description:** Fetches and displays a random, SFW meme from the internet.
    -   **Usage:** `/meme`

## Command Categories

- [Admin Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/admin)
- [Discord Channels Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/admin)
- [Custom Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/customs)
- [Fun Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/fun)
- [Games Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/games)
- [Info Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/info)
- [Moderation Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/moderation)
- [Music Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/music)
- [Roles Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/roles)
- [Setup Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/setup)
- [Ticket Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/tickets)
- [Utility Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/utility)
- [Youtube Commands](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands/youtube)

## Adding New Commands

To add a new command, create a new file in the [`src/bot/commands`](https://github.com/KIO2gamer/project-kiyo/tree/main/src/bot/commands) folder and follow the existing command structure.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/KIO2gamer/project-kiyo/blob/main/LICENSE.md)
