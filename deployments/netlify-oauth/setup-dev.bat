@echo off
REM Netlify Local Development Setup Script (Windows)
REM This script helps you set up and test Netlify locally

echo.
echo 🚀 Netlify Development Setup
echo ==============================
echo.

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Netlify CLI...
    call npm install -g netlify-cli
    if %errorlevel% equ 0 (
        echo ✅ Netlify CLI installed
        echo.
    ) else (
        echo ❌ Failed to install Netlify CLI
        exit /b 1
    )
)

REM Check if we're in the right directory
if not exist "netlify.toml" (
    echo ⚠️  netlify.toml not found. Make sure you're in the root directory.
    exit /b 1
)

REM Navigate to the netlify-oauth subdirectory
echo 📁 Setting up Netlify OAuth service...
cd deployments\netlify-oauth
if %errorlevel% neq 0 (
    echo ❌ Failed to navigate to deployments\netlify-oauth
    exit /b 1
)

REM Install dependencies
echo 📥 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 🧪 To test locally, run:
echo    netlify dev
echo.
echo This will start a local server at http://localhost:8888
echo.
echo 📋 Available endpoints:
echo    GET  http://localhost:8888/          - Landing page
echo    GET  http://localhost:8888/health    - Health check
echo    GET  http://localhost:8888/callback  - OAuth2 callback
echo.
echo 💡 Tip: Update your .env file with:
echo    DISCORD_REDIRECT_URI=http://localhost:8888/callback
echo.
pause
