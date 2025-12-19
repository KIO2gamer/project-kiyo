# 🛡️ Auto-Moderation Quick Reference

## Quick Setup (3 Steps)

```
1. /automod enable
2. /automod setlog #mod-logs
3. /automod spam enabled:true
```

## All Features At a Glance

| Feature               | Command             | Default      | What It Does                |
| --------------------- | ------------------- | ------------ | --------------------------- |
| 🚫 **Spam Detection** | `/automod spam`     | 5 msgs/5s    | Stops message flooding      |
| 📢 **Mass Mentions**  | `/automod mentions` | 5 mentions   | Prevents @mention abuse     |
| 🔗 **Invite Filter**  | `/automod invites`  | Enabled      | Removes Discord invites     |
| 🔗 **Link Filter**    | `/automod links`    | Disabled     | Whitelist-based URL control |
| 🤬 **Bad Words**      | `/automod badwords` | Disabled     | Custom word blacklist       |
| 🔠 **Caps Filter**    | `/automod caps`     | 70%          | Detects EXCESSIVE CAPS      |
| 😀 **Emoji Spam**     | `/automod emojis`   | 10 emojis    | Limits emoji usage          |
| 🛡️ **Anti-Raid**      | `/automod antiraid` | 10 joins/10s | Detects raid attempts       |

## Actions Available

| Action    | Effect             | Good For           |
| --------- | ------------------ | ------------------ |
| `warn`    | DM warning         | First offenses     |
| `delete`  | Remove message     | Content violations |
| `timeout` | Temporary mute     | Repeat offenders   |
| `kick`    | Remove from server | Serious violations |
| `ban`     | Permanent ban      | Severe cases/raids |

## Common Commands

### View Status

```
/automod status
```

### Enable Features

```
/automod spam enabled:true
/automod mentions enabled:true max_mentions:5 action:timeout
/automod invites enabled:true action:delete
/automod antiraid enabled:true join_threshold:10
```

### Ignore Channels/Roles

```
/automod ignore channel:#bot-commands
/automod ignore role:@Trusted Members
/automod unignore channel:#general
```

### Customize Settings

```
/automod spam max_messages:7 time_window:10 action:timeout
/automod links whitelist:youtube.com,twitter.com,github.com
/automod badwords words:bad1,bad2,bad3
/automod caps percentage:80
```

## Preset Configurations

### 🌟 Casual Server (Relaxed)

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:8 time_window:5
/automod mentions enabled:true max_mentions:10
/automod invites enabled:true
```

### 🏢 Professional Server (Strict)

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:4 time_window:5
/automod mentions enabled:true max_mentions:3
/automod invites enabled:true
/automod links enabled:true whitelist:company.com
/automod caps enabled:true percentage:60
```

### 🎮 Gaming Community (Balanced)

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:6 time_window:5
/automod mentions enabled:true max_mentions:8
/automod invites enabled:true
/automod emojis enabled:true max_emojis:12
/automod antiraid enabled:true join_threshold:15
```

### 🔒 High Security (Maximum Protection)

```
/automod enable
/automod setlog #mod-logs
/automod spam enabled:true max_messages:3 time_window:5 action:kick
/automod mentions enabled:true max_mentions:3 action:timeout
/automod invites enabled:true action:ban
/automod links enabled:true whitelist:trusted-site.com
/automod badwords enabled:true words:word1,word2,word3
/automod caps enabled:true percentage:50
/automod emojis enabled:true max_emojis:5
/automod antiraid enabled:true join_threshold:5 time_window:10
```

## Troubleshooting Quick Fixes

| Problem         | Solution                                 |
| --------------- | ---------------------------------------- |
| Not working     | Check `/automod status` - Is it enabled? |
| Bot is affected | Add bot's role to ignore list            |
| Too strict      | Increase thresholds or add ignore rules  |
| False positives | Add trusted roles to ignore list         |
| Missing logs    | Set log channel with `/automod setlog`   |

## Permission Requirements

-   **Bot needs:** `Timeout Members`, `Kick Members`, `Ban Members`, `Manage Messages`
-   **Command user needs:** `Administrator`
-   **Auto-bypassed:** Users with `Administrator` permission

## Testing Checklist

-   [ ] Enable auto-mod: `/automod enable`
-   [ ] Set log channel: `/automod setlog #logs`
-   [ ] Test spam: Send 6+ messages quickly
-   [ ] Test mentions: @mention 6+ users
-   [ ] Test invites: Post discord.gg/test
-   [ ] Check logs: View log channel for reports
-   [ ] Test ignore: Add channel and verify bypass
-   [ ] View config: Run `/automod status`

## Tips & Best Practices

✅ **DO:**

-   Set a log channel first thing
-   Start with basic features (spam, mentions, invites)
-   Add bot command channels to ignore list
-   Test with an alt account
-   Monitor logs regularly
-   Adjust thresholds based on your community

❌ **DON'T:**

-   Enable all features at max strictness immediately
-   Forget to set a log channel
-   Ignore false positive reports
-   Use ban action for minor violations
-   Forget to add trusted roles to ignore list

## Feature Matrix

| Feature   | Delete Msg | Warn | Timeout | Kick | Ban | Configurable |
| --------- | ---------- | ---- | ------- | ---- | --- | ------------ |
| Spam      | ✅         | ✅   | ✅      | ✅   | ✅  | Fully        |
| Mentions  | ✅         | ✅   | ✅      | ✅   | ✅  | Fully        |
| Invites   | ✅         | ✅   | ✅      | ✅   | ✅  | Action only  |
| Links     | ✅         | ✅   | ✅      | ✅   | ✅  | + Whitelist  |
| Bad Words | ✅         | ✅   | ✅      | ✅   | ✅  | + Word list  |
| Caps      | ✅         | ✅   | ❌      | ❌   | ❌  | + Percentage |
| Emoji     | ✅         | ✅   | ❌      | ❌   | ❌  | + Max count  |
| Anti-Raid | ❌         | ❌   | ❌      | ✅   | ✅  | + Threshold  |

## Status Emoji Legend

When viewing `/automod status`:

-   ✅ = Enabled
-   ❌ = Disabled
-   📝 = Log channel set
-   🚫 = Ignored channels/roles

## Quick Disable

To temporarily disable auto-mod without losing settings:

```
/automod disable
```

To re-enable:

```
/automod enable
```

## Support & Documentation

-   **Full Guide:** `docs/AUTO_MODERATION.md`
-   **Architecture:** `docs/AUTO_MODERATION_ARCHITECTURE.md`
-   **Commands:** All `/automod` subcommands have built-in help

---

**Remember:** Start simple, monitor, adjust. Auto-moderation should help your moderators, not replace them!
