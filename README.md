<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/6wj0hh6.jpg" alt="Project logo"></a>
</p>

<h3 align="center">Kiyo - All in One Discord Bot</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/KIO2gamer/discordbot)](https://github.com/KIO2gamer/discordbot/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/KIO2gamer/discordbot)](https://github.com/KIO2gamer/discordbot/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

<p align="center"> Kiyo is a versatile and dynamic Discord bot designed to enhance your server experience. It offers a wide range of functionalities, including moderation tools, fun and engaging games, and customized commands. 
    <br> 
</p>

## 📝 Table of Contents

-   [About](#about)
-   [Features](#features)
-   [Getting Started](#getting_started)
-   [Commands](#commands)
-   [Built Using](#built_using)
-   [Contributing](#contributing)
-   [Authors](#authors)
-   [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

Kiyo is built to be a jack-of-all-trades, aiming to provide a little something for everyone.  It's built with [Discord.js](https://discord.js.org/) and utilizes a [MongoDB](https://www.mongodb.com/) database for persistent storage. 

## ✨ Features  <a name = "features"></a>

Here are some of Kiyo's key features:

- **Moderation:** Keep your server clean and organized with commands for:
    - Kicking/banning users
    - Managing roles
    - Deleting messages in bulk
    - Setting up custom welcome messages
- **Fun & Games:** Engage your community with:
    - Fun commands (e.g., 8ball, dice rolling, memes)
    - Mini-games 
- **Utility:** Make life easier with:
    - Information lookup (weather, definitions)
    - Reminders 
    - Polls 
    - Custom command creation 

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js and npm:**  You'll need Node.js (version 16.6.0 or higher recommended) and npm installed. You can download them from [https://nodejs.org/](https://nodejs.org/).
- **MongoDB Account:** You'll need a free MongoDB Atlas account to store your bot's data. Sign up at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
- **Discord Bot Application:**  Follow these steps to create a Discord bot application and get your bot token:
    1. Go to the Discord Developer Portal: [https://discord.com/developers/applications](https://discord.com/developers/applications)
    2. Click on "New Application" and give your application a name.
    3. Go to the "Bot" tab within your application settings.
    4. Click on "Add Bot" and confirm. 
    5. **Keep your bot token secret!** This is like a password for your bot. 

### Installing

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/KIO2gamer/discordbot.git
   cd discordbot
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configuration:** 
   1. Create a .env file in the root directory of the project.
   2. Add the following to your .env file, replacing the placeholders with your actual credentials:
   ```bash
   TOKEN=YOUR_DISCORD_BOT_TOKEN
   MONGODB_URI=YOUR_MONGODB_CONNECTION_URI
   ```

4. **Start the bot:**
   ```bash
   npm run
   ```
   For development (with hot-reloading):
   ```bash
   npm run dev
   ```

## 🎮 Commands <a name = "commands"></a>

Kiyo uses slash commands (introduced in Discord API v9). Here's a glimpse of Kiyo's command categories:

-  **Fun/Entertainment:**
   |Command|Description|
   | --- | --- |
   | /8ball <question\> | Ask the magic 8-ball a question. |
   | /roll  | Roll a dice with a specified number of sides.|
   | /meme | Get a random meme.|

-  **Moderation:**
    |Command|Description|
    | --- | --- |
    | /kick \<target> \<reason> | Kick a user from the server.|
    | /ban \<target> \<reason> | Ban a user from the server.|
    | /purge \<target> \<number> | Delete a specified number of messages in the current channel.|

**And more!** Kiyo offers a variety of commands for utility, information, and custom features. You can use the `/help` command within your Discord server to see a full list of available commands and their descriptions.

## ⛏️ Build Using <a name = "built_using"></a>

-   [Node.js](https://nodejs.org/en/) - Server Environment
-   [Discord.js](https://discord.js.org/) - Discord API Wrapper
-   [MongoDB](https://www.mongodb.com/) - Database

## Contributing <a name = "contributing"></a>

If you'd like to contribute to Kiyo, please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

We welcome all contributions to make Kiyo even better!

## ✍️ Authors <a name = "authors"></a>

- [@KIO2gamer](https://github.com/KIO2gamer) - Initial Work and Idea

## 🎉 Acknowledgments <a name = "authors"></a>

- A big thank you to the Discord.js community for the fantastic library and support.
- Thanks to all the contributors (Use `/credits` in Discord) who have helped make Kiyo possible!
