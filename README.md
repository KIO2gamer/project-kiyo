# project-kiyo

A Discord bot which can be used for server management and members entertainment.

## Key Features

- **Database for Logging System:** Keep track of server activities with an integrated logging system.
- **Moderation Tools:** Manage your server effectively with powerful moderation tools.
- **Member Moderation Commands:** Ensure smooth operation with commands designed to moderate server members.

## Installation

To install and run the bot, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/project-kiyo.git
    cd project-kiyo
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Set up environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    DISCORD_TOKEN=your_discord_bot_token
    DATABASE_URL=your_database_url
    ```

4. **Run the bot:**
    ```bash
    npm start
    ```

## Usage

Once the bot is running, you can use the following commands for server management and member entertainment:

- **!log:** Log a message to the database.
- **!ban @user:** Ban a member from the server.
- **!kick @user:** Kick a member from the server.
- **!mute @user:** Mute a member in the server.
- **!unmute @user:** Unmute a member in the server.

## Contribution

We welcome contributions! To contribute, follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
