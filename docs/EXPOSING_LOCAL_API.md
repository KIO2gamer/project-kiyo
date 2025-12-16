# 🌐 Exposing Local API for Netlify Dashboard

Since your Discord bot + API runs locally, you need to expose it publicly so the Netlify-hosted dashboard can connect to it.

## Option 1: ngrok (Easiest, Free)

### Install ngrok

```bash
# Download from https://ngrok.com/download
# Or with Chocolatey:
choco install ngrok
```

### Expose your API

```bash
# Start your bot first
npm run dev

# In another terminal, expose port 3001
ngrok http 3001
```

You'll get a URL like: `https://abcd-1234.ngrok-free.app`

### Configure Netlify

1. Go to Netlify Site Settings → Build & Deploy → Environment
2. Add: `VITE_API_URL` = `https://abcd-1234.ngrok-free.app`
3. Redeploy your site

### Update your .env

```env
DASHBOARD_ALLOW_ORIGINS=https://kiyo-discord-bot.netlify.app,https://abcd-1234.ngrok-free.app
DASHBOARD_BASE_URL=https://kiyo-discord-bot.netlify.app
DASHBOARD_REDIRECT_URI=https://kiyo-discord-bot.netlify.app/callback
```

**Note**: Free ngrok URLs change every restart. For permanent URLs, upgrade to ngrok paid or use Cloudflare Tunnel.

---

## Option 2: Cloudflare Tunnel (Free, Permanent URL)

### Install cloudflared

```bash
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Or with Chocolatey:
choco install cloudflared
```

### Create a tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create kiyo-bot

# Route traffic to your local API
cloudflared tunnel route dns kiyo-bot bot.yourdomain.com
```

### Configure tunnel

Create `cloudflared-config.yml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json

ingress:
    - hostname: bot.yourdomain.com
      service: http://localhost:3001
    - service: http_status:404
```

### Run the tunnel

```bash
cloudflared tunnel run kiyo-bot
```

Your API is now at: `https://bot.yourdomain.com`

### Configure Netlify

Set `VITE_API_URL` = `https://bot.yourdomain.com`

---

## Option 3: Deploy Bot to Cloud (Recommended for Production)

For production, deploy your bot + API to:

-   **Railway** (easiest, generous free tier)
-   **Render** (free tier available)
-   **Fly.io** (free tier with 3 VMs)
-   **DigitalOcean App Platform** ($5/month)

This gives you a permanent URL without exposing your home IP.

---

## Testing Locally

For local development without ngrok:

```bash
# Terminal 1: Start bot + API
npm run dev

# Terminal 2: Start dashboard (uses proxy)
npm run dev:dash
```

The dev server proxies `/api` to `localhost:3001` automatically.

---

## Security Notes

1. **CORS**: Your API checks `DASHBOARD_ALLOW_ORIGINS` - make sure it includes your Netlify URL
2. **HTTPS**: ngrok/Cloudflare provide HTTPS automatically
3. **Rate Limiting**: Consider adding rate limits to your API endpoints
4. **Firewall**: If using ngrok/Cloudflare, your local firewall settings don't need changes

---

## Quick Start

```bash
# 1. Install ngrok
choco install ngrok

# 2. Start bot
npm run dev

# 3. In new terminal, expose API
ngrok http 3001

# 4. Copy the ngrok URL (https://xxxx.ngrok-free.app)

# 5. Add to Netlify: VITE_API_URL = <ngrok-url>

# 6. Update your .env:
#    DASHBOARD_ALLOW_ORIGINS=https://kiyo-discord-bot.netlify.app,<ngrok-url>

# 7. Restart bot, redeploy Netlify
```
