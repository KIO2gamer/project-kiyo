# 🚀 Netlify Implementation Guide for Discord Bot

## Overview

Your Discord bot has a complete Netlify OAuth2 callback service ready to deploy. This guide walks you through deploying it to production.

## ✅ What's Already Done

-   ✅ Netlify functions created (`callback.js` and `health.js`)
-   ✅ HTML landing page with service information
-   ✅ `netlify.toml` configuration file
-   ✅ MongoDB integration for token storage
-   ✅ CORS headers configured for security
-   ✅ Error handling with user-friendly pages
-   ✅ YouTube connection detection

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Netlify Account

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Create a new account or log in to your existing account
3. Click "Add new site" from your dashboard

### Step 2: Deploy the Service

Choose one of these methods:

#### Option A: Drag & Drop (Easiest)

1. Navigate to `deployments/netlify-oauth` folder in your project
2. Select all contents in this folder (not the folder itself)
3. Compress them into a ZIP file
4. Go to Netlify dashboard → "Add new site" → "Deploy manually"
5. Drag and drop the ZIP file
6. Wait for deployment to complete
7. Note your Netlify URL (e.g., `https://your-site-name.netlify.app`)

#### Option B: Netlify CLI (Recommended)

1. **Install Netlify CLI** (if not already installed):

    ```bash
    npm install -g netlify-cli
    ```

2. **Navigate to the OAuth directory**:

    ```bash
    cd deployments/netlify-oauth
    ```

3. **Login to Netlify**:

    ```bash
    netlify login
    ```

4. **Deploy**:

    ```bash
    netlify deploy --prod
    ```

5. Note the deployment URL that appears

#### Option C: Git Integration

1. Create a new GitHub repository with the `netlify-oauth` folder contents
2. In Netlify, click "Add new site" → "Import from Git"
3. Connect your GitHub repository
4. Set build settings:
    - Build command: `npm run build`
    - Publish directory: `public`
    - Functions directory: `netlify/functions`
5. Click "Deploy site"

### Step 3: Configure Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Build & deploy** → **Environment**
3. Add these environment variables:

```env
DISCORD_CLIENT_ID=1370207378791989338
DISCORD_CLIENT_SECRET=WLlKzDzHdHigPHIkdKw7H_Jllfa4IV7e
DISCORD_REDIRECT_URI=https://YOUR-NETLIFY-SITE.netlify.app/callback
MONGODB_URL=mongodb+srv://utsabsengupta4:24DD6ORG8vqpMY9d@kiyo-discord-bot.uz3sqyy.mongodb.net/
```

**⚠️ Important**: Replace `YOUR-NETLIFY-SITE` with your actual Netlify site name!

### Step 4: Get Your Netlify URL

After deployment, your service will be live at:

```
https://your-site-name.netlify.app
```

You can customize the domain name in:
**Site settings** → **Domain management** → **Custom domain**

### Step 5: Update Discord Application Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2** → **General**
4. Update the redirect URI to your Netlify URL:
    ```
    https://your-site-name.netlify.app/callback
    ```
5. Click **Save Changes**

### Step 6: Update Your Bot's `.env` File

Update your bot's `.env` file with the Netlify URL:

```env
# OLD (local development)
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback

# NEW (production with Netlify)
DISCORD_REDIRECT_URI=https://your-site-name.netlify.app/callback
```

### Step 7: Restart Your Bot

Restart your Discord bot for the changes to take effect:

```bash
# Stop the current bot process
# Then restart it
node src/index.js
```

## 🧪 Testing Your Deployment

### Check Service Health

Visit your Netlify URL:

```
https://your-site-name.netlify.app/health
```

You should see:

```json
{
    "status": "OK",
    "timestamp": "2025-01-16T...",
    "service": "Discord OAuth2 Callback Handler",
    "version": "1.0.0"
}
```

### Check Landing Page

Visit:

```
https://your-site-name.netlify.app
```

You should see a beautiful landing page with service information and the status should show "✅ Online".

### Test the Complete OAuth2 Flow

1. Start your Discord bot
2. In your Discord server, run:
    ```
    /get_yt_sub_role
    ```
3. Click the "Authorize" button
4. You should be redirected to your Netlify callback service
5. After authorization, you'll see a success message

## 🔒 Security Best Practices

### 1. Protect Your Secret Keys

-   ✅ **DO**: Store secrets in Netlify environment variables
-   ✅ **DO**: Never commit `.env` file to GitHub
-   ❌ **DON'T**: Expose secrets in public repositories
-   ❌ **DON'T**: Share your Discord Client Secret publicly

### 2. MongoDB Security

Your MongoDB connection string is already securely stored in environment variables on Netlify.

### 3. CORS Configuration

The callback function allows cross-origin requests. If you need to restrict this, modify the CORS headers in `netlify/functions/callback.js`:

```javascript
const headers = {
    "Access-Control-Allow-Origin": "*", // Change to your domain if needed
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "text/html",
};
```

## 📊 Monitoring & Logs

### View Netlify Logs

1. Go to your Netlify site dashboard
2. Click **Functions** to see function execution logs
3. Click **Deploys** to see deployment history

### Monitor Discord Bot Logs

Your bot's logs should show successful OAuth2 exchanges:

```
[INFO] OAuth2 callback received for user: 123456789
[INFO] Token stored successfully
```

## 🆘 Troubleshooting

### Issue: "Invalid redirect URI" Error

**Solution**: Make sure the `DISCORD_REDIRECT_URI` in Netlify environment variables matches exactly with the URL in Discord Developer Portal.

### Issue: MongoDB Connection Error

**Solution**:

1. Verify `MONGODB_URL` is correctly set in Netlify
2. Check that your MongoDB IP whitelist allows Netlify's IP addresses
3. Test the connection locally first

### Issue: "Access Denied" When Authorizing

**Solution**:

1. Check that CORS headers are properly configured
2. Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
3. Ensure the Discord application's redirect URI matches

### Issue: Functions Not Working

**Solution**:

1. Check Netlify function logs: **Site settings** → **Functions**
2. Ensure all environment variables are set
3. Verify the `netlify.toml` file is in the root of the deployed folder

## 📈 Next Steps

After successful deployment:

1. **Monitor Usage**: Track how many users authorize through your OAuth2 service
2. **Optimize**: Review Netlify analytics for performance insights
3. **Scale**: Netlify automatically scales to handle increased traffic
4. **Backup**: Regularly backup your MongoDB data

## 🎓 Additional Resources

-   [Netlify Documentation](https://docs.netlify.com)
-   [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
-   [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
-   [MongoDB Documentation](https://docs.mongodb.com/)

## 💡 Tips

-   **Custom Domain**: Netlify allows you to connect a custom domain for professional appearance
-   **Auto-Deploy**: Connect your GitHub repo for automatic deploys on push
-   **Rollback**: You can easily rollback to previous deployments in Netlify
-   **Free SSL**: Netlify provides free HTTPS with automatic certificate management

---

**Need help?** Check the logs in Netlify dashboard or review the error messages in the browser console when testing.
