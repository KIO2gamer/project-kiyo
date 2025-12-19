# Auto-Moderation System

A comprehensive auto-moderation system for your Discord bot that helps keep your server safe and organized.

## Features

### 🚫 Spam Detection

-   Detects when users send too many messages in a short time
-   Detects duplicate message spam
-   Configurable thresholds and actions
-   Automatically deletes spam messages

### 📢 Mass Mention Protection

-   Prevents users from mentioning too many people at once
-   Protects against @everyone/@here abuse
-   Configurable mention limits

### 🔗 Link Filtering

-   Blocks unauthorized links
-   Whitelist system for approved domains
-   Protects against phishing and malicious links

### 🔗 Discord Invite Filter

-   Automatically removes Discord invite links
-   Prevents server advertising
-   Configurable actions

### 🤬 Bad Word Filter

-   Custom blacklist of inappropriate words
-   Automatically removes messages containing blacklisted terms
-   Private word list (only visible to admins)

### 🔠 Caps Lock Detection

-   Detects excessive use of capital letters
-   Configurable percentage threshold
-   Minimum message length requirement

### 😀 Emoji Spam Detection

-   Prevents excessive emoji usage
-   Configurable emoji limits
-   Detects both Unicode and custom emojis

### 🛡️ Anti-Raid Protection

-   Detects suspicious join patterns
-   Automatically takes action on potential raiders
-   Configurable thresholds and time windows

### 🚫 Ignore Lists

-   Ignore specific channels (e.g., bot commands channel)
-   Ignore specific roles (e.g., trusted members, moderators)
-   Administrators always bypass auto-mod

## Commands

All commands require Administrator permission.

### Basic Setup

```
/automod enable                  - Enable auto-moderation
/automod disable                 - Disable auto-moderation
/automod setlog #channel         - Set log channel for auto-mod actions
/automod status                  - View current configuration
```

### Feature Configuration

```
/automod spam enabled:true max_messages:5 time_window:5 action:timeout
/automod mentions enabled:true max_mentions:5 action:timeout
/automod invites enabled:true action:delete
/automod links enabled:true whitelist:youtube.com,twitter.com
/automod badwords enabled:true words:word1,word2,word3
/automod caps enabled:true percentage:70
/automod emojis enabled:true max_emojis:10
/automod antiraid enabled:true join_threshold:10 time_window:10
```

### Ignore Lists

```
/automod ignore channel:#channel        - Ignore a channel
/automod ignore role:@role              - Ignore a role
/automod unignore channel:#channel      - Remove channel from ignore list
/automod unignore role:@role            - Remove role from ignore list
```

## Actions

Auto-moderation can take the following actions:

-   **Warn**: Send a DM warning to the user
-   **Delete**: Delete the offending message
-   **Timeout**: Temporarily mute the user
-   **Kick**: Remove the user from the server
-   **Ban**: Permanently ban the user

## Quick Start Guide

1. **Enable Auto-Moderation**

    ```
    /automod enable
    ```

2. **Set a Log Channel**

    ```
    /automod setlog #mod-logs
    ```

3. **Configure Basic Protection** (Recommended for most servers)

    ```
    /automod spam enabled:true
    /automod mentions enabled:true
    /automod invites enabled:true
    ```

4. **Optional: Add Ignore Rules**

    ```
    /automod ignore channel:#bot-commands
    /automod ignore role:@Trusted Members
    ```

5. **Check Your Configuration**
    ```
    /automod status
    ```

## Default Settings

When you first enable auto-moderation, these are the default settings:

| Feature        | Enabled | Settings                                 |
| -------------- | ------- | ---------------------------------------- |
| Spam Detection | ✅      | 5 messages per 5 seconds, timeout action |
| Mass Mentions  | ✅      | 5 mentions max, timeout action           |
| Invite Filter  | ✅      | Delete action                            |
| Link Filter    | ❌      | Empty whitelist                          |
| Bad Words      | ❌      | Empty word list                          |
| Caps Filter    | ❌      | 70% threshold                            |
| Emoji Spam     | ❌      | 10 emojis max                            |
| Anti-Raid      | ❌      | 10 joins per 10 seconds                  |

## Best Practices

1. **Always set a log channel** - This helps you monitor auto-mod actions and adjust settings as needed

2. **Start with basic protection** - Enable spam, mentions, and invites first, then add more filters as needed

3. **Use ignore lists wisely** - Add bot command channels and trusted member roles to prevent false positives

4. **Test your settings** - Use a test account or alt to verify your auto-mod is working as expected

5. **Adjust thresholds** - If you get too many false positives, increase the thresholds; if raiders slip through, decrease them

6. **Monitor logs** - Regularly check your mod logs to see if the system needs adjustment

## Example Configurations

### Casual Community Server

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:7 time_window:5
/automod mentions enabled:true max_mentions:10
/automod invites enabled:true
```

### Strict Professional Server

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:4 time_window:5
/automod mentions enabled:true max_mentions:3
/automod invites enabled:true
/automod links enabled:true whitelist:company.com,trusted-partner.com
/automod caps enabled:true percentage:60
```

### Gaming Community

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true
/automod mentions enabled:true max_mentions:15
/automod invites enabled:true
/automod emojis enabled:true max_emojis:15
```

## Troubleshooting

### Auto-mod isn't working

-   Make sure auto-mod is enabled: `/automod status`
-   Check that the bot has proper permissions
-   Verify the channel/user isn't in the ignore list

### Too many false positives

-   Increase thresholds (max_messages, max_mentions, etc.)
-   Add trusted roles to ignore list
-   Adjust percentage thresholds for caps filter

### Bot is timing itself out

-   Make sure the bot's role is in the ignored roles list
-   Give the bot Administrator permission

### Anti-raid not triggering

-   Verify anti-raid is enabled
-   Check that join_threshold and time_window are appropriate
-   Ensure the bot has Ban/Kick permissions

## Technical Details

### Database Schema

Auto-moderation settings are stored in MongoDB using the `AutoModConfig` schema.

### Event Handlers

-   `auto_moderation.js` - Main message monitoring
-   `member_join_antiraid.js` - Anti-raid protection

### Memory Management

The system uses in-memory caching for recent messages and joins, which is automatically cleaned every minute to prevent memory leaks.

## Support

If you encounter any issues or have suggestions for improvement, please open an issue on the GitHub repository.
