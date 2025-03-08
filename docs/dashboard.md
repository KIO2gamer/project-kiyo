# Kiyo Dashboard

Kiyo includes a web-based dashboard for managing your bot and viewing statistics.

## Features

- View bot statistics and server information
- Manage bot configuration for your servers
- View command usage and configure permissions
- Easy access to logs and analytics

## Setup

1. Add the following environment variables to your `.env` file:

```plaintext
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000
DASHBOARD_SECRET=your_random_secret_key
DASHBOARD_PORT=3000
```

2. Enable the OAuth2 redirects in your Discord Developer Portal:

    - Go to https://discord.com/developers/applications
    - Select your application
    - Navigate to OAuth2 > General
    - Add redirect URL: `http://localhost:3000/auth/discord/callback` (or your custom domain)
    - Save changes

3. Make sure your bot has the following scopes enabled:
    - `bot`
    - `identify`
    - `guilds`

## Accessing the Dashboard

Once your bot is running, you can access the dashboard at:

- Local development: http://localhost:3000 (or your configured port)
- Production: Your configured domain

## Navigation

The dashboard has the following main sections:

### Home

The landing page with general information about the bot and login options.

### Dashboard Overview

After logging in, you'll see:

- Bot statistics (servers, users, uptime, etc.)
- List of servers where you have management permissions

### Server Management

For each server, you can access:

- **Overview**: General server statistics and information
- **Commands**: Enable/disable and configure bot commands
- **Settings**: Configure bot behavior including:
    - Custom prefix
    - Welcome messages
    - Auto-moderation
    - Logging options

## Permissions

To access a server's settings in the dashboard:

1. You must have the "Manage Server" permission in that Discord server
2. The bot must be a member of that server

## Configuration Options

### General Settings

- **Custom Prefix**: Set a custom command prefix for text commands
- **Delete Commands**: Automatically delete command messages
- **Embed Color**: Use server color for embeds

### Welcome Messages

- Enable/disable welcome messages
- Select channel for welcome messages
- Customize welcome message text with placeholders

### Moderation

- Enable auto-moderation
- Configure filtered words
- Set up moderation logging

## Troubleshooting

### Can't see a server in the dashboard

- Verify you have "Manage Server" permissions
- Confirm the bot is in the server
- Try logging out and back in

### Settings not saving

- Check browser console for errors
- Ensure the bot has proper permissions in the server
- Verify your connection to the server

### Authentication errors

- Check that your environment variables are correctly set
- Verify OAuth2 redirect URLs in Discord Developer Portal
- Clear browser cookies and try again

## Development

To extend the dashboard:

1. Templates are in `src/dashboard/views/`
2. Routes are in `src/dashboard/routes/`
3. Static files are in `src/dashboard/public/`

Use the existing patterns for consistency when adding new features.
