# 🚀 Netlify Deployment Guide for OAuth2 Callback

This guide will help you deploy the OAuth2 callback service to Netlify, making it accessible to users worldwide.

## 🎯 Why Netlify?

-   **Free hosting** for the OAuth2 callback service
-   **Global CDN** for fast access worldwide
-   **Automatic HTTPS** for secure OAuth2 flows
-   **Serverless functions** that scale automatically
-   **Easy deployment** with simple drag-and-drop or CLI

## 📋 Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com) (free)
2. **Discord Application**: Your bot application in Discord Developer Portal
3. **MongoDB Database**: Your existing MongoDB connection (same as bot)

## 🚀 Deployment Options

### Option 1: Quick Deploy (Drag & Drop)

1. **Prepare the files**:

    - Navigate to the `netlify-oauth` folder in your project
    - Zip the entire folder contents (not the folder itself)

2. **Deploy to Netlify**:

    - Go to [netlify.com](https://netlify.com) and login
    - Click "Add new site" → "Deploy manually"
    - Drag and drop the zip file or select it
    - Wait for deployment to complete

3. **Get your URL**:
    - After deployment, you'll get a URL like: `https://amazing-site-name.netlify.app`
    - You can customize this in Site settings → Domain management

### Option 2: CLI Deploy (Recommended)

1. **Install Netlify CLI**:

    ```bash
    npm install -g netlify-cli
    ```

2. **Navigate to the OAuth folder**:

    ```bash
    cd netlify-oauth
    ```

3. **Run the deployment script**:

    ```bash
    ./deploy.sh
    ```

    Or manually:

    ```bash
    netlify login
    npm install
    netlify deploy --prod
    ```

### Option 3: Git Integration

1. **Push to GitHub**:

    - Create a new repository with just the `netlify-oauth` folder contents
    - Push to GitHub

2. **Connect to Netlify**:
    - In Netlify dashboard, click "Add new site" → "Import from Git"
    - Connect your GitHub repository
    - Set build settings:
        - Build command: `npm run build`
        - Publish directory: `public`
        - Functions directory: `netlify/functions`

## ⚙️ Configuration

### 1. Set Environment Variables in Netlify

Go to your Netlify site dashboard → Site settings → Environment variables:

```env
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://your-netlify-site.netlify.app/callback
MONGODB_URL=your_mongodb_connection_string_here
```

**Important**: The `DISCORD_REDIRECT_URI` must match your Netlify site URL exactly!

### 2. Update Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2** → **General**
4. Update the redirect URI to: `https://your-netlify-site.netlify.app/callback`
5. Save changes

### 3. Update Your Bot Configuration

In your Discord bot's `.env` file:

```env
# OAuth2 Configuration
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://your-netlify-site.netlify.app/callback
USE_LOCAL_OAUTH=false

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## 🧪 Testing Your Deployment

### 1. Check Service Health

Visit: `https://your-netlify-site.netlify.app/health`

You should see:

```json
{
    "status": "OK",
    "timestamp": "2025-01-16T...",
    "service": "Discord OAuth2 Callback Handler",
    "version": "1.0.0"
}
```

### 2. Test the Main Page

Visit: `https://your-netlify-site.netlify.app`

You should see a beautiful landing page with service information.

### 3. Test OAuth2 Flow

1. Start your Discord bot
2. Run `/test_yt_setup` to verify configuration
3. Try `/get_yt_sub_role` to test the complete OAuth2 flow

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:

    ```
    ❌ Problem: Discord redirect URI doesn't match
    ✅ Solution: Ensure Discord app redirect URI exactly matches your Netlify URL
    ```

2. **"Environment variables not found"**:

    ```
    ❌ Problem: Netlify environment variables not set
    ✅ Solution: Check Site settings → Environment variables in Netlify dashboard
    ```

3. **"MongoDB connection failed"**:

    ```
    ❌ Problem: MongoDB connection string incorrect or network blocked
    ✅ Solution: Verify connection string and allow all IPs (0.0.0.0/0) in MongoDB Atlas
    ```

4. **Function timeout**:
    ```
    ❌ Problem: Netlify function timeout (10s on free tier)
    ✅ Solution: Optimize database queries or upgrade Netlify plan
    ```

### Debug Steps

1. **Check Netlify Function Logs**:

    - Go to Netlify dashboard → Functions tab
    - Click on your function to see logs

2. **Test Endpoints**:

    ```bash
    curl https://your-netlify-site.netlify.app/health
    ```

3. **Verify Environment Variables**:
    - Check if all required variables are set in Netlify
    - Redeploy after adding variables

## 🎨 Customization

### Custom Domain (Optional)

1. **Buy a domain** or use an existing one
2. **In Netlify dashboard**:
    - Go to Site settings → Domain management
    - Add custom domain
    - Follow DNS configuration instructions
3. **Update configurations**:
    - Update Discord redirect URI to use your custom domain
    - Update bot's `.env` file

### Styling

The callback pages use modern glassmorphism design. To customize:

1. Edit `netlify-oauth/netlify/functions/callback.js`
2. Modify the CSS in the `generateSuccessPage`, `generateWarningPage`, and `generateErrorPage` functions
3. Redeploy to Netlify

## 📊 Monitoring

### Netlify Analytics

-   **Function invocations**: Monitor OAuth2 callback usage
-   **Error rates**: Track failed authentications
-   **Performance**: Monitor response times

### MongoDB Monitoring

-   **Connection pooling**: Netlify functions reuse connections
-   **Token cleanup**: Automatic cleanup after 1 hour
-   **Storage usage**: Monitor temporary token storage

## 🔒 Security Best Practices

### Already Implemented

-   ✅ **HTTPS only**: Netlify provides automatic HTTPS
-   ✅ **CORS headers**: Proper cross-origin handling
-   ✅ **Input validation**: All parameters validated
-   ✅ **Token expiration**: 1-hour auto-cleanup
-   ✅ **Error handling**: No sensitive data in error messages

### Additional Recommendations

1. **Monitor logs** regularly for suspicious activity
2. **Rotate secrets** periodically (Discord client secret)
3. **Use MongoDB Atlas** with IP whitelisting when possible
4. **Enable Netlify security headers** in netlify.toml

## 💰 Cost Considerations

### Netlify Free Tier Limits

-   **Function invocations**: 125,000/month
-   **Function runtime**: 100 hours/month
-   **Bandwidth**: 100GB/month
-   **Build minutes**: 300/month

### Scaling

For high-traffic bots:

-   **Netlify Pro**: $19/month for higher limits
-   **MongoDB Atlas**: Consider dedicated clusters
-   **CDN**: Netlify's global CDN handles traffic automatically

## 🎉 Success!

Once deployed, your OAuth2 callback service will be:

-   🌍 **Globally accessible** via Netlify's CDN
-   🔒 **Secure** with automatic HTTPS
-   ⚡ **Fast** with edge deployment
-   📈 **Scalable** with serverless functions
-   💰 **Free** on Netlify's generous free tier

Your Discord bot users can now authenticate from anywhere in the world! 🚀

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Netlify function logs
3. Test each component individually
4. Verify all environment variables are set correctly

The OAuth2 callback service is now production-ready and globally accessible! 🎊
