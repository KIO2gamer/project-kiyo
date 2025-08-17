#!/bin/bash

echo "🚀 Deploying Discord OAuth2 Callback Service to Netlify"
echo "=================================================="

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in
if ! netlify status &> /dev/null; then
    echo "🔐 Please login to Netlify..."
    netlify login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to production
echo "🚀 Deploying to production..."
netlify deploy --prod --dir=. --functions=netlify/functions

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your Netlify URL from the output above"
echo "2. Update your Discord application redirect URI to: https://your-site.netlify.app/callback"
echo "3. Set environment variables in Netlify dashboard:"
echo "   - DISCORD_CLIENT_ID"
echo "   - DISCORD_CLIENT_SECRET" 
echo "   - DISCORD_REDIRECT_URI"
echo "   - MONGODB_URL"
echo "4. Update your bot's .env file with the new DISCORD_REDIRECT_URI"
echo ""
echo "🔗 Useful links:"
echo "   - Netlify Dashboard: https://app.netlify.com"
echo "   - Discord Developer Portal: https://discord.com/developers/applications"
echo ""