#!/bin/bash

# Netlify Local Development Setup Script
# This script helps you set up and test Netlify locally

echo "🚀 Netlify Development Setup"
echo "=============================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI installed"
    echo ""
fi

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "⚠️  netlify.toml not found. Make sure you're in the root directory."
    exit 1
fi

# Navigate to the netlify-oauth subdirectory
echo "📁 Setting up Netlify OAuth service..."
cd deployments/netlify-oauth || exit 1

# Install dependencies
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🧪 To test locally, run:"
echo "   netlify dev"
echo ""
echo "This will start a local server at http://localhost:8888"
echo ""
echo "📋 Available endpoints:"
echo "   GET  http://localhost:8888/          - Landing page"
echo "   GET  http://localhost:8888/health    - Health check"
echo "   GET  http://localhost:8888/callback  - OAuth2 callback"
echo ""
echo "💡 Tip: Update your .env file with:"
echo "   DISCORD_REDIRECT_URI=http://localhost:8888/callback"
echo ""
