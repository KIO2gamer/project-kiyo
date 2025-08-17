# Discord OAuth2 Callback Service

This is a Netlify-hosted service that handles Discord OAuth2 callbacks for the YouTube subscriber role Discord bot feature.

## 🚀 Quick Deploy to Netlify

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI**:

    ```bash
    npm install -g netlify-cli
    ```

2. **Login to Netlify**:

    ```bash
    netlify login
    ```

3. **Deploy from this directory**:
    ```bash
    cd netlify-oauth
    netlify deploy --prod
    ```

### Option 2: Deploy via Netlify Dashboard

1. **Create a new site** on [Netlify](https://netlify.com)
2. **Connect to Git** or **drag and drop** the `netlify-oauth` folder
3. **Set build settings**:
    - Build command: `npm run build`
    - Publish directory: `public`
    - Functions directory: `netlify/functions`

## 🔧 Environment Variables

Set these environment variables in your Netlify site settings:

```env
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://your-netlify-site.netlify.app/callback
MONGODB_URL=your_mongodb_connection_string_here
```

## 📋 Setup Steps

### 1. Deploy to Netlify

Deploy this service to Netlify using one of the methods above.

### 2. Get Your Netlify URL

After deployment, you'll get a URL like: `https://your-site-name.netlify.app`

### 3. Update Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **OAuth2** → **General**
4. Update the redirect URI to: `https://your-netlify-site.netlify.app/callback`

### 4. Update Bot Configuration

In your Discord bot's `.env` file, update:

```env
DISCORD_REDIRECT_URI=https://your-netlify-site.netlify.app/callback
```

### 5. Set Netlify Environment Variables

In your Netlify site dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add all the required environment variables listed above

## 🔗 Endpoints

-   `GET /` - Service information page
-   `GET /callback` - OAuth2 callback handler (main endpoint)
-   `GET /health` - Health check endpoint

## 🛠 Local Development

To test locally:

```bash
cd netlify-oauth
npm install
netlify dev
```

This will start a local development server at `http://localhost:8888`

## 🔒 Security Features

-   **CORS enabled** for cross-origin requests
-   **Temporary token storage** (auto-expires after 1 hour)
-   **Error handling** for all OAuth2 flow scenarios
-   **Input validation** for all parameters
-   **Secure MongoDB connection** with connection pooling

## 📊 How It Works

1. **User Authorization**: User clicks OAuth2 link in Discord bot
2. **Discord Redirect**: Discord redirects to `/callback` with authorization code
3. **Token Exchange**: Service exchanges code for access token
4. **User Data Fetch**: Service fetches user info and connections
5. **Token Storage**: Access token stored temporarily in MongoDB
6. **User Feedback**: User sees success/error page and returns to Discord
7. **Bot Verification**: Bot uses stored token to verify YouTube channel

## 🎨 Features

-   **Beautiful UI**: Modern, responsive design with glassmorphism effects
-   **User-Friendly**: Clear success, warning, and error pages
-   **Mobile Responsive**: Works on all device sizes
-   **Fast Performance**: Serverless functions with edge deployment
-   **Reliable**: Built on Netlify's robust infrastructure

## 🔍 Monitoring

-   Check service status at: `https://your-netlify-site.netlify.app/health`
-   Monitor function logs in Netlify dashboard
-   View real-time analytics in Netlify

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**

    - Ensure the redirect URI in Discord matches your Netlify URL exactly
    - Include `/callback` at the end

2. **"Environment variables not found"**

    - Check Netlify site settings → Environment variables
    - Redeploy after adding variables

3. **"MongoDB connection failed"**

    - Verify MongoDB connection string is correct
    - Ensure MongoDB allows connections from Netlify IPs (0.0.0.0/0)

4. **Function timeout**
    - Netlify functions have a 10-second timeout on free tier
    - Consider upgrading if needed

### Debug Steps

1. Check Netlify function logs
2. Test `/health` endpoint
3. Verify environment variables are set
4. Test OAuth2 flow step by step

## 📈 Scaling

This service is designed to handle:

-   **High traffic**: Serverless functions auto-scale
-   **Global users**: Edge deployment for low latency
-   **Concurrent requests**: MongoDB connection pooling
-   **Error recovery**: Comprehensive error handling

Perfect for Discord bots with thousands of users! 🚀
