# ✅ Netlify Deployment Checklist

Use this checklist to ensure your Netlify deployment is successful.

## 📋 Pre-Deployment Checklist

### Environment & Tools

-   [ ] Netlify CLI installed: `npm install -g netlify-cli`
-   [ ] Node.js version 18+ installed
-   [ ] Netlify account created at [netlify.com](https://netlify.com)
-   [ ] Git configured (if using Git integration)

### Credentials Gathered

-   [ ] `DISCORD_CLIENT_ID` = `1370207378791989338`
-   [ ] `DISCORD_CLIENT_SECRET` = Have it handy (from `.env`)
-   [ ] `MONGODB_URL` = Have it handy (from `.env`)

### Code Verification

-   [ ] `netlify.toml` exists in root directory
-   [ ] `netlify/functions/callback.js` exists
-   [ ] `netlify/functions/health.js` exists
-   [ ] `public/index.html` exists
-   [ ] `package.json` exists in `deployments/netlify-oauth`

## 🚀 Deployment Steps

### Step 1: Prepare Files

-   [ ] Navigate to project root directory
-   [ ] Ensure `deployments/netlify-oauth` folder exists
-   [ ] Verify all configuration files are in place

### Step 2: Choose Deployment Method

#### Option A: Drag & Drop

-   [ ] Create ZIP file of `netlify-oauth` contents
-   [ ] Go to [Netlify Dashboard](https://app.netlify.com)
-   [ ] Click "Add new site" → "Deploy manually"
-   [ ] Drag and drop the ZIP file
-   [ ] Wait for deployment to complete
-   [ ] Note the URL provided

#### Option B: Netlify CLI

-   [ ] Run: `netlify login`
-   [ ] Navigate: `cd deployments/netlify-oauth`
-   [ ] Run: `netlify deploy --prod`
-   [ ] Note the URL provided

#### Option C: Git Integration

-   [ ] Push `netlify-oauth` to GitHub
-   [ ] Connect GitHub to Netlify
-   [ ] Wait for auto-deployment
-   [ ] Note the URL provided

### Step 3: Set Environment Variables

-   [ ] Go to Netlify Site settings
-   [ ] Click "Environment variables"
-   [ ] Add `DISCORD_CLIENT_ID`
-   [ ] Add `DISCORD_CLIENT_SECRET`
-   [ ] Add `DISCORD_REDIRECT_URI` (with your Netlify URL)
-   [ ] Add `MONGODB_URL`
-   [ ] **Trigger a rebuild** to apply changes

### Step 4: Update Discord Developer Portal

-   [ ] Go to [Discord Developer Portal](https://discord.com/developers/applications)
-   [ ] Select your bot application
-   [ ] Go to OAuth2 → General
-   [ ] Update redirect URI to: `https://your-site-name.netlify.app/callback`
-   [ ] Click "Save Changes"

### Step 5: Update Bot Configuration

-   [ ] Open your bot's `.env` file
-   [ ] Find `DISCORD_REDIRECT_URI`
-   [ ] Update to: `https://your-site-name.netlify.app/callback`
-   [ ] Save the file

### Step 6: Restart Bot

-   [ ] Stop the running bot (if any)
-   [ ] Run: `node src/index.js`
-   [ ] Verify bot is online in Discord

## 🧪 Testing Checklist

### Basic Health Checks

-   [ ] Visit: `https://your-site-name.netlify.app`

    -   [ ] Landing page loads
    -   [ ] Service status shows "✅ Online"

-   [ ] Visit: `https://your-site-name.netlify.app/health`
    -   [ ] Returns JSON with `"status": "OK"`

### OAuth2 Flow Test

-   [ ] In Discord, run: `/get_yt_sub_role`
    -   [ ] Button "Authorize" appears
    -   [ ] Click button
    -   [ ] Redirected to Netlify callback
    -   [ ] See success message
    -   [ ] Token stored in MongoDB (check logs)

### Edge Cases

-   [ ] Test without YouTube connection linked
    -   [ ] Should see warning message
-   [ ] Test with invalid credentials (simulate by changing env var)
    -   [ ] Should see error message
-   [ ] Test from different Discord servers
    -   [ ] Should work consistently

## 📊 Monitoring Setup (Optional)

-   [ ] Set up Netlify notifications
    -   [ ] Site settings → Notifications
-   [ ] Enable Slack/Email notifications
-   [ ] Monitor function logs regularly
-   [ ] Set up monthly MongoDB backup reminder

## 🔐 Security Verification

-   [ ] Environment variables are **not** in version control
-   [ ] `.env` file is in `.gitignore`
-   [ ] No secrets exposed in GitHub/public repos
-   [ ] CORS headers are properly configured
-   [ ] HTTPS is enabled (automatic on Netlify)
-   [ ] MongoDB IP whitelist includes Netlify IPs

## 📝 Documentation

-   [ ] Bookmark [NETLIFY_IMPLEMENTATION_GUIDE.md](../docs/NETLIFY_IMPLEMENTATION_GUIDE.md)
-   [ ] Save Netlify site dashboard URL
-   [ ] Document your custom domain (if used)
-   [ ] Keep Discord app credentials secure

## 🎯 After Deployment

-   [ ] Users can now use `/get_yt_sub_role` without local development
-   [ ] Bot can be deployed anywhere (no local OAuth server needed)
-   [ ] Scale globally without infrastructure changes
-   [ ] Monitor usage in Netlify analytics

## 🆘 If Something Goes Wrong

### Deployment Failed

1. [ ] Check Netlify deploy logs
2. [ ] Verify `netlify.toml` syntax
3. [ ] Ensure all required files exist
4. [ ] Check Node.js version compatibility

### OAuth2 Not Working

1. [ ] Check Netlify environment variables
2. [ ] Verify Discord redirect URI matches exactly
3. [ ] Check MongoDB connection in Netlify logs
4. [ ] Review function logs in Netlify dashboard

### Need Rollback?

1. [ ] Go to Netlify Site settings → Deploys
2. [ ] Find the previous successful deployment
3. [ ] Click "Publish deploy"
4. [ ] Service reverts to previous version

## 📞 Support Resources

-   **Netlify Help**: https://docs.netlify.com
-   **Discord Docs**: https://discord.com/developers/docs
-   **MongoDB Support**: https://docs.mongodb.com
-   **Project Guide**: See [NETLIFY_IMPLEMENTATION_GUIDE.md](../docs/NETLIFY_IMPLEMENTATION_GUIDE.md)

---

## ✨ Completion Status

When all items are checked:

-   ✅ Your Netlify OAuth2 service is **live**
-   ✅ Discord bot is **configured**
-   ✅ Users can **authorize**
-   ✅ Tokens are **secure**
-   ✅ Service is **monitored**

**You're ready for production! 🚀**

---

**Last Updated**: January 2025
**Status**: Ready for Deployment
