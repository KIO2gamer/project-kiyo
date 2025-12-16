# 🏗️ Netlify Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DISCORD USERS                               │
│                                                                 │
│  User runs: /get_yt_sub_role                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Click "Authorize"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              DISCORD APPLICATION                                │
│         (Discord Developer Portal)                              │
│                                                                 │
│  OAuth2 Redirect URI:                                          │
│  https://your-site-name.netlify.app/callback                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Authorize Code
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NETLIFY DEPLOYMENT                            │
│            (Global CDN - Automatic HTTPS)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PUBLIC FILES                                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  /          → index.html (Landing Page)                 │  │
│  │  /health    → /.netlify/functions/health.js            │  │
│  │  /callback  → /.netlify/functions/callback.js          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NETLIFY FUNCTIONS (Serverless)                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  callback.js:                                           │  │
│  │  • Receive authorization code                           │  │
│  │  • Exchange code for access token                       │  │
│  │  • Fetch user info from Discord API                    │  │
│  │  • Get YouTube connection                              │  │
│  │  • Store token in MongoDB                              │  │
│  │  • Return success/warning/error page                   │  │
│  │                                                          │  │
│  │  health.js:                                            │  │
│  │  • Return service health status                        │  │
│  │  • JSON response with version info                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ENVIRONMENT VARIABLES (Secure)                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • DISCORD_CLIENT_ID                                    │  │
│  │  • DISCORD_CLIENT_SECRET                                │  │
│  │  • DISCORD_REDIRECT_URI                                 │  │
│  │  • MONGODB_URL                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  netlify.toml:                                                 │
│  • Configuration for build and functions                       │
│  • Routing rules                                              │
│  • Environment setup                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  DISCORD API     │  │  MONGODB CLOUD   │
        │                  │  │                  │
        │ • Get user info  │  │ • Store tokens   │
        │ • Get connected  │  │ • Auto-expire    │
        │   accounts       │  │   after 1 hour   │
        └──────────────────┘  └──────────────────┘
                    │                  │
                    └────┬─────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  DISCORD BOT (Your Server)    │
         │                               │
         │  • Receives token from        │
         │    MongoDB                    │
         │  • Uses token to check        │
         │    YouTube subscriber count   │
         │  • Assigns roles to user      │
         └───────────────────────────────┘
```

---

## Data Flow Sequence

```
1. User runs: /get_yt_sub_role
   └─> Bot sends "Authorize" button with Discord OAuth2 link

2. User clicks "Authorize"
   └─> Redirected to Discord OAuth2 consent screen

3. User grants permission
   └─> Discord redirects to: https://your-site-name.netlify.app/callback?code=XXXXX

4. Netlify Function (callback.js) receives request
   └─> Validates request
   └─> Exchanges code for Discord access token (via Discord API)
   └─> Fetches user info (Discord API)
   └─> Fetches user connections including YouTube (Discord API)
   └─> Stores access token in MongoDB with 1-hour expiry
   └─> Returns success/warning page to user

5. User sees: "Authorization Successful!" (or warning if no YouTube connection)
   └─> User can close window and return to Discord

6. Bot detects authorization completion
   └─> Retrieves stored token from MongoDB
   └─> Uses token to fetch YouTube subscriber count
   └─> Assigns roles based on subscriber count
   └─> Confirms completion to user in Discord
```

---

## Deployment Options Architecture

### Option 1: Drag & Drop

```
Your Computer          →    Netlify Dashboard    →    Global CDN
  (netlify-oauth/)          (Upload UI)           (your-site.netlify.app)
                                                        ↓
                                        Automatic HTTPS + Global Distribution
```

### Option 2: Netlify CLI

```
Your Computer        →    Netlify Auth    →    Your Netlify Account    →    CDN
  (netlify deploy)        (Credentials)        (Automatic Upload)     (Deploy)
                                                        ↓
                                        Automatic HTTPS + Global Distribution
```

### Option 3: Git Integration

```
GitHub Repo    →    Netlify GitHub App    →    Automatic Build & Deploy    →    CDN
  (Push)           (Webhook)                  (netlify.toml → Build)      (Live)
                                                        ↓
                                        Automatic HTTPS + Global Distribution
```

---

## Security Architecture

```
┌─────────────────────────────────────────┐
│        PUBLIC INTERNET                  │
│                                         │
│  • Discord OAuth2 Flow (HTTPS only)    │
│  • API Endpoints (HTTPS with CORS)     │
└────────────────────┬────────────────────┘
                     │ HTTPS Encrypted
                     ▼
┌─────────────────────────────────────────┐
│        NETLIFY EDGE (CDN)               │
│                                         │
│  • Automatic SSL/TLS                   │
│  • DDoS Protection                     │
│  • Rate Limiting                       │
│  • CORS Headers                        │
└────────────────────┬────────────────────┘
                     │ Secure Function Calls
                     ▼
┌─────────────────────────────────────────┐
│    NETLIFY SERVERLESS FUNCTIONS         │
│                                         │
│  • No direct secret access             │
│  • Secrets from environment variables  │
│  • HTTPS communication only            │
│  • No data stored locally              │
└────────────────────┬────────────────────┘
                     │ Encrypted Connections
            ┌────────┴────────┐
            ▼                 ▼
    ┌──────────────┐    ┌──────────────┐
    │ Discord API  │    │  MongoDB     │
    │              │    │              │
    │ • HTTPS Only │    │ • SSL/TLS    │
    │ • Validated  │    │ • Auth Token │
    └──────────────┘    └──────────────┘
```

---

## Environment Isolation

```
┌─────────────────────────────────────────────────┐
│          LOCAL DEVELOPMENT                      │
│  .env (Local Machine - NOT in Git)             │
│  - DISCORD_REDIRECT_URI=localhost:3000         │
│  - All secrets exposed to your machine         │
│  - For testing only                            │
└─────────────────────────────────────────────────┘

                        ↓ Deploy

┌─────────────────────────────────────────────────┐
│        NETLIFY PRODUCTION                       │
│  Environment Variables (Netlify Dashboard)     │
│  - DISCORD_REDIRECT_URI=your-site.netlify.app │
│  - All secrets encrypted at rest              │
│  - Isolated per deployment                    │
│  - No local access                            │
└─────────────────────────────────────────────────┘

                        ↓ Use

┌─────────────────────────────────────────────────┐
│      DISCORD BOT (Server/VPS)                   │
│  .env (Update with Netlify URL)                │
│  - DISCORD_REDIRECT_URI=your-site.netlify.app │
│  - Points to production Netlify service       │
│  - Users hit Netlify instead of local server  │
└─────────────────────────────────────────────────┘
```

---

## Scaling Architecture

```
Initial Load: 1 User
┌────────────────────┐
│  Netlify Function  │
│   (No queue)       │
└────────────────────┘

Moderate Load: 100 Users/minute
┌────────────────────┐
│ Netlify Function 1 │
├────────────────────┤
│ Netlify Function 2 │ ← Auto-scale
├────────────────────┤
│ Netlify Function 3 │
└────────────────────┘

High Load: 1000+ Users/minute
┌────────────────────┐
│ Netlify Function 1 │
├────────────────────┤
│ Netlify Function 2 │
├────────────────────┤
│     ...            │ ← Automatic
├────────────────────┤
│ Netlify Function N │
└────────────────────┘
         ↓
     Global CDN
   (Distributed)
```

---

## File Organization After Deployment

```
Netlify Server (production)
│
├── index.html                  (Landing page)
├── /.netlify/functions/
│   ├── callback.js            (OAuth2 handler)
│   └── health.js              (Health check)
│
└── Environment Variables (Secure)
    ├── DISCORD_CLIENT_ID
    ├── DISCORD_CLIENT_SECRET
    ├── DISCORD_REDIRECT_URI
    └── MONGODB_URL
```

---

## Integration Points

```
Your Discord Bot                           Users' Computers
        │
        ├─ Stores Netlify URL in .env
        │
        ├─ When user runs /get_yt_sub_role
        │   └─ Creates OAuth2 link to Discord with redirect to Netlify
        │
        └─ Receives token from MongoDB after user authorizes
            └─ Uses token to fetch YouTube data
                └─ Assigns roles
```

---

## Monitoring Points

```
Netlify Dashboard
├── Deploys
│   └─ See deployment history
│   └─ View build logs
│   └─ Rollback if needed
│
├── Functions
│   └─ View execution logs
│   └─ Monitor errors
│   └─ Check performance
│
├── Analytics
│   └─ Bandwidth usage
│   └─ Request count
│   └─ Error rates
│
└── Settings
    └─ Environment variables
    └─ Domain configuration
    └─ Build settings
```

---

This architecture provides:

-   ✅ **Scalability**: Automatic horizontal scaling
-   ✅ **Reliability**: Global CDN with redundancy
-   ✅ **Security**: Encrypted connections and isolated secrets
-   ✅ **Performance**: Edge computing with automatic caching
-   ✅ **Cost**: Pay-as-you-go with free tier available
