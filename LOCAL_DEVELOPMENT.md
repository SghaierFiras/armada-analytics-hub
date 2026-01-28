# Local Development Guide - OAuth Setup

Since Slack requires HTTPS for OAuth redirect URLs (even for localhost), you have two options for local development:

## Option 1: Development Bypass Mode (Quickest)

Use this for rapid local development without OAuth. **Never use in production!**

### Setup

1. Update your `.env` file:
```env
NODE_ENV=development
SKIP_AUTH=true
```

2. Start the server:
```bash
npm start
```

3. Access the app directly:
```
http://localhost:3000/
```

### How It Works

- Skips OAuth authentication entirely
- Creates a mock development user automatically
- Only works when `NODE_ENV=development` (safety check)
- Perfect for working on dashboards, UI, and non-auth features

### Mock User Details

```javascript
{
  slackId: 'dev-user',
  email: 'dev@armadadelivery.com',
  name: 'Development User',
  avatar: 'https://via.placeholder.com/192',
  team: 'Development',
  lastLogin: new Date()
}
```

### When to Use

- ✅ Building/testing dashboard features
- ✅ Working on analytics visualizations
- ✅ Testing UI components
- ✅ Debugging non-auth functionality
- ❌ Testing OAuth flow
- ❌ Testing domain restrictions
- ❌ Production or staging environments

---

## Option 2: ngrok HTTPS Tunnel (For OAuth Testing)

Use this when you need to test the actual OAuth flow locally.

### Step 1: Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Windows/Linux:**
Download from https://ngrok.com/download

### Step 2: Sign Up for ngrok (Free)

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 3: Start Your Server

```bash
npm start
```

Server runs on `http://localhost:3000`

### Step 4: Create HTTPS Tunnel

In a **new terminal window**:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       Your Account (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the **HTTPS forwarding URL**: `https://abc123def456.ngrok.io`

### Step 5: Configure Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Select your app → **OAuth & Permissions**
3. Under **Redirect URLs**, add:
   ```
   https://abc123def456.ngrok.io/auth/slack/callback
   ```
4. Click **Save URLs**

### Step 6: Update Your `.env`

```env
NODE_ENV=development
SKIP_AUTH=false
SLACK_CALLBACK_URL=https://abc123def456.ngrok.io/auth/slack/callback
```

### Step 7: Restart Server

```bash
# Stop the server (Ctrl+C)
npm start
```

### Step 8: Test OAuth

Visit: `https://abc123def456.ngrok.io/login`

Click "Sign in with Slack" → Full OAuth flow works!

### Important ngrok Notes

- **Free tier**: URL changes every time you restart ngrok
- **Paid tier** ($8/month): Get a fixed subdomain like `https://armada-dev.ngrok.io`
- **Remember**: Update Slack redirect URL if ngrok URL changes
- **Debugging**: Visit `http://localhost:4040` to see all requests through ngrok

---

## Option 3: Production-Only Testing (Simplest)

Skip local OAuth entirely and test only on Railway:

### Setup

1. Keep only production URL in Slack:
   ```
   https://armada-analytics-hub.up.railway.app/auth/slack/callback
   ```

2. Use **Option 1 (Development Bypass)** for local work

3. Push changes to Railway to test OAuth:
   ```bash
   git add .
   git commit -m "Update auth flow"
   git push origin main
   ```

4. Test OAuth on Railway deployment

### Pros

- ✅ No local OAuth setup needed
- ✅ No ngrok subscription required
- ✅ Production-like testing environment

### Cons

- ❌ Can't test OAuth flow locally
- ❌ Slower iteration (push → deploy → test)

---

## Recommended Workflow

**For most development tasks:**
```env
# .env
NODE_ENV=development
SKIP_AUTH=true
```

**When testing OAuth specifically:**
- Use ngrok (Option 2), OR
- Test on Railway (Option 3)

**Before deploying to production:**
```env
# Production .env
NODE_ENV=production
SKIP_AUTH=false  # or remove this line entirely
SLACK_CALLBACK_URL=https://armada-analytics-hub.up.railway.app/auth/slack/callback
```

---

## Security Reminders

1. ✅ **NEVER** set `SKIP_AUTH=true` in production
2. ✅ **NEVER** commit `.env` files to git (already in `.gitignore`)
3. ✅ **ALWAYS** use HTTPS callback URLs in production
4. ✅ **REMOVE** ngrok URLs from Slack when done testing

---

## Troubleshooting

### "Please use https (for security)" in Slack

- ❌ Slack no longer accepts `http://localhost` URLs
- ✅ Use ngrok or development bypass mode

### ngrok URL expired

- Free tier ngrok URLs change on restart
- Update Slack redirect URL with new ngrok URL
- Consider paid ngrok plan for fixed URLs

### Development bypass not working

Check that **both** conditions are met:
- `SKIP_AUTH=true` in `.env`
- `NODE_ENV=development` in `.env`

### Can't access ngrok URL

- Check ngrok is running: `http://localhost:4040`
- Verify server is running on port 3000
- Confirm ngrok is forwarding to correct port

---

## Summary

| Option | Setup Time | OAuth Testing | Cost | Best For |
|--------|-----------|---------------|------|----------|
| **Development Bypass** | 1 min | ❌ No | Free | Daily development |
| **ngrok** | 5 min | ✅ Yes | Free/Paid | OAuth testing |
| **Production Only** | 0 min | ✅ Yes | Free | Simple workflows |

Choose based on your current needs!
