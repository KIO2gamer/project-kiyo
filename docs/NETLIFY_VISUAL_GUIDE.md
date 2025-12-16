# 📸 Visual Deployment Guide

## Step-by-Step Deployment (With Screenshots Reference)

### Method 1: Drag & Drop (Easiest)

#### Step 1: Create Netlify Account

```
1. Go to https://netlify.com
2. Click "Sign up"
3. Choose GitHub/GitLab/Email signup
4. Verify email
   ✅ You're logged in!
```

#### Step 2: Start New Deployment

```
Netlify Dashboard
    ↓
"Add new site"
    ↓
"Deploy manually"
    ↓
Ready for file upload
```

#### Step 3: Upload Your Files

```
1. Open File Explorer
2. Navigate to: project-kiyo\deployments\netlify-oauth
3. Drag the ENTIRE FOLDER into Netlify
   (or select the folder when prompted)

   Uploading...
   Processing...

4. ✅ Deployment complete!
5. Copy your URL: https://amazing-name.netlify.app
```

---

### Method 2: Netlify CLI

#### Step 1: Open Terminal

```bash
# Windows: Open PowerShell or Command Prompt
# Mac/Linux: Open Terminal
```

#### Step 2: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 3: Login

```bash
netlify login
# Browser opens automatically
# Click "Authorize"
# ✅ Authenticated!
```

#### Step 4: Deploy

```bash
cd deployments/netlify-oauth
netlify deploy --prod

# You'll see:
# ✔ Deploy complete
# ✔ Live URL: https://your-site-name.netlify.app
```

---

### Configuration Steps (All Methods)

#### Step 1: Get Your Netlify URL

```
After deployment, you have:
https://YOUR-SITE-NAME.netlify.app

Note this down! You'll need it 👆
```

#### Step 2: Add Environment Variables

```
Netlify Dashboard
    ↓
Your Site
    ↓
Site Settings
    ↓
Build & Deploy
    ↓
Environment
    ↓
Edit Variables
```

#### Step 3: Add These Variables

```
Name: DISCORD_CLIENT_ID
Value: 1370207378791989338

Name: DISCORD_CLIENT_SECRET
Value: WLlKzDzHdHigPHIkdKw7H_Jllfa4IV7e

Name: DISCORD_REDIRECT_URI
Value: https://YOUR-SITE-NAME.netlify.app/callback
        ↑ Replace with your actual URL!

Name: MONGODB_URL
Value: mongodb+srv://utsabsengupta4:24DD6ORG8vqpMY9d@kiyo-discord-bot.uz3sqyy.mongodb.net/
```

#### Step 4: Save & Trigger Rebuild

```
✓ Save changes
↓
"Trigger deploy"
↓
Watch the build log
↓
✅ "Published" = Success!
```

---

## Discord Developer Portal Update

#### Step 1: Open Developer Portal

```
https://discord.com/developers/applications
    ↓
Select Your Bot
    ↓
OAuth2 → General
```

#### Step 2: Find Redirect URIs

```
You see:
- Old: http://localhost:3001/auth/discord/callback
- New: https://YOUR-SITE-NAME.netlify.app/callback
```

#### Step 3: Update

```
1. Remove old URI (if exists)
2. Add new Netlify URL
3. Click "Save Changes"
   ✅ Updated!
```

---

## Update Your Bot's Configuration

#### File: `.env`

```
OLD:
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback

NEW:
DISCORD_REDIRECT_URI=https://YOUR-SITE-NAME.netlify.app/callback
↑ Use the URL from Netlify
```

#### Step 1: Edit `.env`

```
1. Open: .env (in project root)
2. Find line with DISCORD_REDIRECT_URI
3. Change to your Netlify URL
4. Save file
```

#### Step 2: Restart Bot

```bash
# Stop current bot (Ctrl+C)
node src/index.js
# Bot restarts with new configuration
```

---

## Testing Your Deployment

### Test 1: Check Landing Page

```
Open in browser:
https://YOUR-SITE-NAME.netlify.app

You should see:
┌──────────────────────────────┐
│ 🔗 Discord OAuth2 Callback   │
│                              │
│ Service is working           │
│ Status: ✅ Online            │
└──────────────────────────────┘
```

### Test 2: Check Health Endpoint

```
Open in browser:
https://YOUR-SITE-NAME.netlify.app/health

You should see:
{
  "status": "OK",
  "service": "Discord OAuth2 Callback Handler",
  "version": "1.0.0"
}
```

### Test 3: Complete OAuth2 Flow

```
Discord Server:
/get_yt_sub_role
    ↓
Click "Authorize"
    ↓
See loading screen
    ↓
Redirected to Netlify
    ↓
See success page:
   "Authorization Successful!"

✅ Working!
```

---

## Visual Checklist

### ✅ Before Deployment

```
☐ Read documentation (optional but recommended)
☐ Have Discord bot credentials ready
☐ Have MongoDB URL ready
☐ Netlify account created
☐ Project folder ready to upload
```

### ✅ During Deployment

```
☐ Upload files to Netlify
☐ Get Netlify URL
☐ Add environment variables
☐ Trigger rebuild
☐ Wait for "Published" status
```

### ✅ After Deployment

```
☐ Update Discord Developer Portal
☐ Update bot's .env file
☐ Restart Discord bot
☐ Test landing page
☐ Test health endpoint
☐ Test complete OAuth2 flow
```

---

## What You'll See in Netlify Dashboard

```
Netlify Dashboard
├── Site Overview
│   ├── Site name: "YOUR-SITE-NAME.netlify.app"
│   ├── Status: "Published" ✅
│   ├── Last deploy: Just now
│   └── Production: Domain active
│
├── Deploys
│   ├── Latest (Current): Your recent upload
│   ├── Status: Success ✅
│   └── Previous versions available
│
├── Functions
│   ├── callback.js
│   │   ├── Invocations: (count)
│   │   └── Status: Active ✅
│   └── health.js
│       ├── Invocations: (count)
│       └── Status: Active ✅
│
└── Site Settings
    ├── Environment variables: Set ✅
    ├── Domain: YOUR-SITE-NAME.netlify.app
    └── Build: Auto
```

---

## Troubleshooting Visual Guide

### Problem: OAuth fails after deployment

```
Check List:
1. Netlify URL → Discord Developer Portal
   URL matches exactly? ✅ YES / ❌ NO

2. Environment variables in Netlify
   All 4 variables set? ✅ YES / ❌ NO

3. Bot .env file updated
   Uses new Netlify URL? ✅ YES / ❌ NO

4. Bot restarted
   Restarted after .env change? ✅ YES / ❌ NO

If all ✅ → Should work!
If any ❌ → Fix that item
```

### Problem: MongoDB error

```
Fix:
1. Netlify Dashboard
2. Environment → MONGODB_URL
3. Paste full connection string
4. Click "Trigger deploy"
5. Wait for "Published" ✅
```

### Problem: "Unknown Interaction" in Discord

```
Check:
1. Bot running? ✅
2. Bot config updated? ✅
3. Bot restarted? ✅
4. Give it 1-2 minutes ⏳
5. Try again
```

---

## URL Customization (Optional)

```
Default Netlify URL:
https://fancy-adjective-12345.netlify.app

Customize to:
https://my-discord-oauth.netlify.app

How:
1. Netlify Dashboard
2. Site settings
3. Domain management
4. Change site name
5. ✅ Applied!
```

---

## After Everything is Working

```
Celebrate! 🎉

Your bot now has:
✅ Production OAuth2 service
✅ Global availability
✅ Automatic HTTPS
✅ Automatic scaling
✅ Professional monitoring

Users worldwide can now:
✅ Authorize with OAuth2
✅ Get verified YouTube subscriber roles
✅ All secure and fast
```

---

## Quick Reference Links

| What                         | Where                                       |
| ---------------------------- | ------------------------------------------- |
| **Create Netlify Account**   | https://netlify.com                         |
| **Netlify Dashboard**        | https://app.netlify.com                     |
| **Discord Developer Portal** | https://discord.com/developers/applications |
| **This Project Docs**        | `docs/NETLIFY_*` files                      |
| **After Deployment**         | `https://YOUR-SITE-NAME.netlify.app`        |

---

## File Locations

```
Your Project:
├── deployments/
│   └── netlify-oauth/        ← Upload this folder
│       ├── netlify/functions/
│       ├── public/
│       ├── netlify.toml
│       └── package.json
│
├── .env                      ← Update this file
│
└── docs/
    ├── NETLIFY_IMPLEMENTATION_GUIDE.md
    ├── NETLIFY_DEPLOYMENT_CHECKLIST.md
    └── NETLIFY_ARCHITECTURE.md
```

---

**Ready? Pick a deployment method and go! 🚀**

-   **Easiest**: Drag & Drop
-   **Recommended**: CLI
-   **Best for Teams**: Git Integration

See [NETLIFY_IMPLEMENTATION_GUIDE.md](./docs/NETLIFY_IMPLEMENTATION_GUIDE.md) for detailed help!
