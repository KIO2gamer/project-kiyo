# 📝 Universal Logging System

Project Kiyo features a comprehensive universal logging system that provides consistent logging across terminal output, file storage, Discord channels, and the web dashboard.

## 🎯 **Features**

### **Multi-Output Logging**
- **Terminal**: Colored, formatted console output with timestamps
- **File Storage**: Optional file logging with daily rotation
- **Discord Integration**: Send important logs to Discord channels
- **Dashboard**: Real-time log viewing in the web interface
- **Log History**: In-memory storage for dashboard access

### **Log Levels**
- **ERROR**: Critical errors and exceptions
- **WARN**: Warnings and non-critical issues
- **INFO**: General information and status updates
- **DEBUG**: Detailed debugging information
- **SUCCESS**: Success messages and confirmations

### **Specialized Modules**
- **BOT**: Core bot operations
- **COMMANDS**: Command execution and usage
- **EVENTS**: Discord event handling
- **DATABASE**: Database operations
- **DASHBOARD**: Web dashboard activities
- **API**: External API interactions
- **SECURITY**: Security-related events

## 🚀 **Usage**

### **Basic Logging Methods**

```javascript
const Logger = require("./utils/logger");

// Basic logging with automatic module detection
await Logger.error("Something went wrong");
await Logger.warn("This is a warning");
await Logger.info("General information");
await Logger.success("Operation completed");
await Logger.debug("Debug information");

// Logging with custom modules
await Logger.log("CUSTOM_MODULE", "Custom message", "info");
```

### **Specialized Module Methods**

```javascript
// Bot-specific logging
await Logger.bot("Bot started successfully", "success");
await Logger.bot("Connection established", "info");

// Command logging
await Logger.command("Help command executed", "info");
await Logger.commandUsage("ping", user, guild, true);

// Event logging
await Logger.event("Guild member joined", "info");

// Database logging
await Logger.database("User data updated", "info");

// Dashboard logging
await Logger.dashboard("Settings updated", "info");

// API logging
await Logger.api("YouTube API request successful", "info");

// Security logging
await Logger.security("Unauthorized access attempt", "warn");
```

### **Advanced Logging**

```javascript
// Error logging with context
await Logger.errorWithContext(error, {
    command: "ping",
    user: "User#1234",
    guild: "My Server",
    channel: "general"
});

// Direct Discord logging
await Logger.logToDiscord("Important message", "warn", "SECURITY");
```

## ⚙️ **Configuration**

### **Environment Variables**

```env
# Log Level (ERROR=0, WARN=1, INFO=2, DEBUG=3)
LOG_LEVEL=INFO

# File Logging
LOG_TO_FILE=true
LOG_FOLDER=logs

# Debug Mode
DEBUG=false
```

### **Discord Integration Setup**

#### **Method 1: Using Dashboard**
1. Go to Dashboard → Monitoring
2. Select server and channel in "Discord Logging Configuration"
3. Click "Set Log Channel"
4. Test with "Send Test Log"

#### **Method 2: Using Discord Command**
```
/setlogchannel [channel]
```

#### **Method 3: Programmatically**
```javascript
// Set Discord client for logging
Logger.setDiscordClient(client);

// Set specific log channel
Logger.setLogChannel("1234567890123456789");
```

## 🎛️ **Dashboard Integration**

### **Real-time Log Viewing**
- Access logs at `/dashboard/monitoring`
- Filter by log level and module
- Auto-refresh every 30 seconds
- Auto-scroll to latest logs
- Clear log history

### **API Endpoints**
```javascript
// Get logs
GET /api/logs?level=error&module=bot&limit=100

// Clear log history
DELETE /api/logs

// Set Discord log channel
POST /api/logs/discord-channel
{
    "guildId": "123456789",
    "channelId": "987654321"
}

// Send test log to Discord
POST /api/logs/test-discord
```

## 🔧 **Advanced Features**

### **Log Filtering**
Only important logs are sent to Discord to avoid spam:
- ERROR level logs
- WARN level logs
- SECURITY module logs
- DATABASE module logs
- DEPLOY module logs

### **File Rotation**
- Daily log files: `YYYY-MM-DD.log`
- Automatic directory creation
- Configurable log folder location

### **Memory Management**
- In-memory log history limited to 1000 entries
- Automatic cleanup of old entries
- Efficient storage for dashboard access

### **Error Handling**
- Graceful fallback if Discord logging fails
- No infinite loops from logging errors
- Robust file system error handling

## 📊 **Log Format**

### **Terminal Output**
```
[14:30:25] ✓ [BOT] Bot started successfully
[14:30:26] ℹ [COMMANDS] Help command executed by User#1234
[14:30:27] ⚠ [API] Rate limit approaching for YouTube API
[14:30:28] ✖ [ERROR] Database connection failed
```

### **File Output**
```
2024-01-15 14:30:25 [SUCCESS] [BOT] Bot started successfully
2024-01-15 14:30:26 [INFO] [COMMANDS] Help command executed by User#1234
2024-01-15 14:30:27 [WARN] [API] Rate limit approaching for YouTube API
2024-01-15 14:30:28 [ERROR] [ERROR] Database connection failed
```

### **Discord Output**
Rich embeds with:
- Color-coded by log level/module
- Timestamp
- Module and level information
- Truncated messages (max 2000 characters)
- Appropriate emojis

## 🛡️ **Security Considerations**

### **Sensitive Data Protection**
- Automatic filtering of tokens and secrets
- Safe error message formatting
- Context sanitization

### **Permission Checks**
- Verify bot permissions before Discord logging
- Channel accessibility validation
- User permission verification for log channel setup

### **Rate Limiting**
- Built-in Discord rate limit handling
- Efficient batching for high-volume logging
- Fallback mechanisms

## 🔍 **Troubleshooting**

### **Common Issues**

**Logs not appearing in Discord:**
- Check bot permissions in log channel
- Verify log channel is set correctly
- Ensure bot has "Send Messages" and "Embed Links" permissions

**File logging not working:**
- Check LOG_TO_FILE environment variable
- Verify write permissions in log folder
- Check disk space availability

**Dashboard logs not updating:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check auto-refresh is enabled

### **Debug Mode**
Enable debug logging for troubleshooting:
```env
LOG_LEVEL=DEBUG
DEBUG=true
```

## 📈 **Performance**

### **Optimizations**
- Asynchronous logging operations
- Efficient memory usage
- Minimal performance impact
- Smart Discord filtering

### **Monitoring**
- Log performance metrics
- Memory usage tracking
- Error rate monitoring
- Response time measurement

## 🔄 **Migration from Old System**

The new logging system is backward compatible:

```javascript
// Old way (still works)
Logger.log("BOT", "Message");

// New way (recommended)
await Logger.bot("Message");
```

All existing log calls will continue to work while gaining the benefits of the new universal system.

## 🎯 **Best Practices**

### **Log Level Guidelines**
- **ERROR**: Use for exceptions and critical failures
- **WARN**: Use for recoverable issues and important notices
- **INFO**: Use for general operational information
- **DEBUG**: Use for detailed troubleshooting information

### **Message Formatting**
- Keep messages concise but informative
- Include relevant context (user, guild, command)
- Use consistent formatting across modules
- Avoid logging sensitive information

### **Performance Tips**
- Use appropriate log levels
- Avoid excessive debug logging in production
- Use context objects for structured data
- Batch related log entries when possible

## 🚀 **Future Enhancements**

Planned improvements:
- Log aggregation and analytics
- Custom log formatters
- External logging service integration
- Advanced filtering and search
- Log retention policies
- Performance metrics dashboard