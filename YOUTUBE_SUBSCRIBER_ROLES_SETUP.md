# YouTube Subscriber Roles Setup Guide

This guide will help you set up the YouTube subscriber role feature for your Discord bot.

## Overview

The YouTube subscriber role feature allows Discord users to automatically receive roles based on their YouTube channel's subscriber count. Users authenticate through Discord OAuth2, and the bot verifies their YouTube channel connection to assign appropriate roles.

## Prerequisites

1. **Discord Bot Application**: You need a Discord application with bot permissions
2. **YouTube Data API v3**: Access to YouTube Data API
3. **MongoDB Database**: For storing role configurations
4. **Web Server**: For OAuth2 callback handling

## Setup Steps

### 1. Discord Application Configuration

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2** → **General**
4. Add a redirect URI: `http://localhost:3000/callback` (or your domain)
5. Note down your **Client ID** and **Client Secret**

### 2. Environment Variables

Add these variables to your `.env` file:

```env
# OAuth2 Configuration (Required for YouTube Subscriber Roles)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/callback
OAUTH2_PORT=3000

# YouTube API (Required)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. YouTube Data API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### 4. Install Dependencies

The bot will automatically install the required dependencies. The new dependency added is:

-   `express` - For the OAuth2 callback server

### 5. Bot Permissions

Ensure your bot has these permissions in Discord servers:

-   `Manage Roles`
-   `Send Messages`
-   `Use Slash Commands`

## Usage

### For Server Administrators

#### 1. Configure Subscriber Tiers

Use the `/yt_sub_role_config` command to set up subscriber tiers:

```
/yt_sub_role_config action:setup
```

This will open a modal where you can define tiers in this format:

```
100:@Bronze Creator
1000:@Silver Creator
10000:@Gold Creator
100000:@Diamond Creator
```

#### 2. Manage Configuration

-   **View current config**: `/yt_sub_role_config action:view`
-   **Add new tier**: `/yt_sub_role_config action:add_tier`
-   **Remove tier**: `/yt_sub_role_config action:remove_tier`
-   **Toggle enable/disable**: `/yt_sub_role_config action:toggle`
-   **Clear all config**: `/yt_sub_role_config action:clear`

### For Users

#### 1. Connect YouTube to Discord

Before using the role command, users must:

1. Go to Discord Settings → Connections
2. Connect their YouTube channel
3. Make sure the connection is visible

#### 2. Get Subscriber Role

Use the command:

```
/get_yt_sub_role
```

This will:

1. Show available subscriber tiers
2. Provide an OAuth2 authorization link
3. Verify the user's YouTube subscriber count
4. Assign the appropriate role

## How It Works

### OAuth2 Flow

1. User runs `/get_yt_sub_role`
2. Bot generates OAuth2 authorization URL
3. User clicks the authorization link
4. User authorizes the bot to access their Discord connections
5. Bot stores temporary access token
6. User clicks "I've Already Authorized" button
7. Bot fetches user's Discord connections using stored token
8. Bot finds YouTube connection and gets channel ID
9. Bot uses YouTube API to get subscriber count
10. Bot assigns appropriate role based on subscriber count

### Security Features

-   **Temporary Token Storage**: OAuth2 tokens are stored temporarily (1 hour) and auto-deleted
-   **Ephemeral Responses**: Role assignment responses are private to the user
-   **Permission Checks**: Only users with appropriate permissions can configure roles
-   **Role Hierarchy**: Bot checks if it can manage the configured roles

## Troubleshooting

### Common Issues

1. **"OAuth2 not configured"**

    - Check that all OAuth2 environment variables are set
    - Verify Discord application OAuth2 settings

2. **"No YouTube connection found"**

    - User needs to connect YouTube to Discord
    - Connection must be visible (not hidden)

3. **"Channel not found or not public"**

    - YouTube channel must be public
    - Channel might be deleted or suspended

4. **"Cannot manage role"**
    - Bot's role must be higher than the configured subscriber roles
    - Bot needs "Manage Roles" permission

### Debug Steps

1. Check bot logs for OAuth2 server startup
2. Verify environment variables are loaded
3. Test OAuth2 callback URL accessibility
4. Check MongoDB connection for configuration storage
5. Verify YouTube API quota and permissions

## Database Schema

The feature uses these MongoDB collections:

### YTSubRoleConfig

```javascript
{
  guildId: String,
  subscriberTiers: [{
    minSubscribers: Number,
    roleId: String,
    tierName: String
  }],
  isEnabled: Boolean,
  lastUpdated: Date,
  updatedBy: String
}
```

### TempOAuth2Storage

```javascript
{
  userId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  createdAt: Date // Auto-expires after 1 hour
}
```

## API Endpoints

The bot creates these endpoints:

-   `GET /callback` - OAuth2 callback handler
-   `GET /health` - Health check endpoint

## Rate Limits

-   **YouTube API**: 10,000 units per day (default quota)
-   **Discord API**: Standard rate limits apply
-   **OAuth2**: No specific limits, but tokens expire

## Security Considerations

1. **Environment Variables**: Keep OAuth2 credentials secure
2. **HTTPS**: Use HTTPS in production for OAuth2 callbacks
3. **Token Storage**: Tokens are automatically cleaned up
4. **Permissions**: Verify bot permissions before role assignment
5. **Input Validation**: All user inputs are validated

## Production Deployment

For production deployment:

1. Use HTTPS for OAuth2 redirect URI
2. Set up proper domain for callback URL
3. Configure firewall rules for OAuth2 port
4. Monitor YouTube API quota usage
5. Set up proper logging and error handling

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Verify all prerequisites are met
3. Check bot logs for error messages
4. Ensure all environment variables are correctly set
