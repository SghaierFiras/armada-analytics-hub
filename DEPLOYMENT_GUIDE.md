# Deployment Guide - Armada Analytics Hub with Authentication

## ⚠️ Important: Why Netlify Alone Won't Work

**Problem:** Netlify only serves static files (HTML, CSS, JS). It cannot run Node.js servers or handle OAuth callbacks.

**Your auth-server.js needs:**
- Node.js runtime ✗ (Not available on Netlify)
- Express server ✗ (Not available on Netlify)
- Session management ✗ (Not available on Netlify)
- OAuth callbacks ✗ (Not available on Netlify)

**Solution:** Deploy the backend to a Node.js hosting platform, and optionally keep frontend on Netlify.

---

## 🚀 Recommended Deployment Strategy

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Railway.app   │◄────────│  Users visiting  │
│  (Backend API)  │         │   your-app.up    │
│                 │         │   .railway.app   │
│ - auth-server.js│         └──────────────────┘
│ - OAuth routes  │
│ - Session mgmt  │
│ - Protected API │
└─────────────────┘
        │
        ▼
   MongoDB Atlas
```

---

## Option 1: Railway.app (Recommended - Easiest)

### Why Railway?
- ✅ Free $5/month credit (no credit card required initially)
- ✅ Automatic Node.js detection
- ✅ GitHub integration for auto-deploys
- ✅ Easy environment variable management
- ✅ Custom domains supported
- ✅ Built-in HTTPS

### Step-by-Step Deployment

#### 1. Create Railway Account

1. Go to <https://railway.app>
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### 2. Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `Armada` repository
4. Railway will automatically detect it's a Node.js app

#### 3. Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
MONGODB_URI=mongodb+srv://firas_db_user:qZWkt031JJIOPQQy@production.g8vjv.mongodb.net/
SLACK_CLIENT_ID=41353267588.10339254799907
SLACK_CLIENT_SECRET=212bb7b28d2e062568e968030c9cdf65
SESSION_SECRET=48b31d6b5f40f73628a880685eb2a6c35775e25a180d7c184bd382d049367bba
RESTRICT_DOMAIN=true
ALLOWED_DOMAIN=armadadelivery.com
NODE_ENV=production
PORT=3000
```

**Important:** Leave PORT as 3000 or use Railway's automatic PORT variable.

#### 4. Update Slack Callback URL

1. Railway will give you a URL like: `https://your-app-name.up.railway.app`
2. Go to <https://api.slack.com/apps>
3. Select your "Armada Analytics Hub" app
4. Go to **OAuth & Permissions**
5. Add new redirect URL: `https://your-app-name.up.railway.app/auth/slack/callback`
6. Click **Save URLs**

#### 5. Update Your .env (Local Development)

Add Railway callback for local testing:

```env
SLACK_CALLBACK_URL=https://your-app-name.up.railway.app/auth/slack/callback
```

#### 6. Deploy

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

Railway will:
1. Detect `package.json`
2. Run `npm install`
3. Start with `npm start` or `node auth-server.js`
4. Provide HTTPS URL

#### 7. Test Your Deployment

Visit: `https://your-app-name.up.railway.app`

You should:
- See the login page
- Be able to click "Sign in with Slack"
- Complete OAuth flow
- Access the dashboard

---

## Option 2: Render.com (Free Tier, Popular)

### Step-by-Step

#### 1. Create Render Account

1. Go to <https://render.com>
2. Sign up with GitHub
3. Authorize Render

#### 2. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: armada-analytics-hub
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node auth-server.js`
   - **Plan**: Free

#### 3. Add Environment Variables

In Render dashboard, go to **Environment** and add all variables from `.env`.

#### 4. Update Slack Callback

Use Render's URL: `https://armada-analytics-hub.onrender.com/auth/slack/callback`

#### 5. Deploy

Render automatically builds and deploys.

**Note:** Free tier spins down after inactivity (30 min), causing slow first load.

---

## Option 3: Heroku (Reliable, Paid)

### Setup

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create armada-analytics-hub

# Add environment variables
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set SLACK_CLIENT_ID="41353267588.10339254799907"
heroku config:set SLACK_CLIENT_SECRET="212bb7b28d2e062568e968030c9cdf65"
heroku config:set SESSION_SECRET="48b31d6b..."
heroku config:set RESTRICT_DOMAIN=true
heroku config:set ALLOWED_DOMAIN=armadadelivery.com
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

Callback URL: `https://armada-analytics-hub.herokuapp.com/auth/slack/callback`

---

## Option 4: DigitalOcean App Platform

### Setup

1. Go to <https://cloud.digitalocean.com/apps>
2. Click **Create App**
3. Connect GitHub repository
4. Configure:
   - **Type**: Web Service
   - **Run Command**: `node auth-server.js`
   - **HTTP Port**: 3000
5. Add environment variables
6. Deploy

Callback URL: `https://armada-analytics-hub-xxxxx.ondigitalocean.app/auth/slack/callback`

---

## Hybrid Approach: Backend on Railway + Frontend on Netlify

If you want to keep Netlify for the frontend:

### Architecture

```
Frontend (Netlify)          Backend (Railway)
┌──────────────┐           ┌──────────────┐
│ Static HTML  │──API─────►│ auth-server  │
│ CSS, Images  │  calls    │ OAuth routes │
└──────────────┘           └──────────────┘
```

### Issues with This Approach:
- Cross-origin cookies (CORS complexity)
- Need to proxy API calls
- More complex setup
- **Not recommended** unless you have specific reasons

**Better:** Host everything on Railway or Render.

---

## 📋 Post-Deployment Checklist

### After deploying to Railway/Render/Heroku:

- [ ] Server is running (check logs)
- [ ] Environment variables are set
- [ ] MongoDB connection works
- [ ] Updated Slack app redirect URLs
- [ ] Can access login page
- [ ] Slack OAuth flow completes
- [ ] User can log in successfully
- [ ] All dashboard pages load
- [ ] Logout works correctly
- [ ] Domain restriction works (if enabled)

---

## 🔧 Updating Your Current .env

Your `.env` currently has:

```env
SLACK_CALLBACK_URL=https://armada-analytics-hub.netlify.app/auth/slack/callback
NODE_ENV=production
```

This needs to change to your **backend hosting URL**:

```env
# After deploying to Railway:
SLACK_CALLBACK_URL=https://your-app.up.railway.app/auth/slack/callback

# Or Render:
SLACK_CALLBACK_URL=https://armada-analytics-hub.onrender.com/auth/slack/callback

# Or Heroku:
SLACK_CALLBACK_URL=https://armada-analytics-hub.herokuapp.com/auth/slack/callback
```

---

## 🚨 Common Issues

### Issue 1: "Page not found" on Netlify

**Cause:** Trying to access Node.js routes on a static host.

**Fix:** Deploy backend to Railway/Render/Heroku.

### Issue 2: "Redirect URI mismatch"

**Cause:** Slack callback URL doesn't match deployment URL.

**Fix:**
1. Get your deployment URL from Railway/Render
2. Update Slack app redirect URLs
3. Update `SLACK_CALLBACK_URL` in environment variables

### Issue 3: "Cannot connect to MongoDB"

**Cause:** Firewall or incorrect connection string.

**Fix:**
1. Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
2. Verify `MONGODB_URI` in environment variables

### Issue 4: Session doesn't persist

**Cause:** Cookie security settings.

**Fix:** Ensure `NODE_ENV=production` and using HTTPS.

---

## 🎯 Quick Start (Railway - 10 Minutes)

1. **Sign up at Railway.app** (1 min)
2. **Connect GitHub repo** (1 min)
3. **Add environment variables** (3 min)
4. **Wait for deployment** (2 min)
5. **Update Slack callback URL** (2 min)
6. **Test!** (1 min)

**Total:** ~10 minutes to full deployment

---

## 💡 Recommendation

For your use case (private company analytics with authentication):

**Best Choice: Railway.app**

Why?
- Fastest setup
- Free tier sufficient for your needs
- Automatic HTTPS
- Easy to manage
- Good performance
- Simple environment variable management

Alternative: **Render.com** (if you prefer more established service)

---

## 📞 Need Help?

If you encounter issues during deployment:

1. Check Railway/Render logs for errors
2. Verify all environment variables are set
3. Ensure Slack redirect URLs match deployment URL
4. Test MongoDB connection from deployment platform

---

## 🔒 Security Notes

### Production Checklist

- [x] `NODE_ENV=production` set
- [x] Secure session secret generated
- [x] HTTPS enabled (automatic on Railway/Render)
- [x] Domain restriction configured
- [x] MongoDB Atlas firewall configured
- [ ] Consider adding rate limiting
- [ ] Set up monitoring/alerts
- [ ] Regular security updates

---

## 📚 Files Created for Deployment

- `railway.json` - Railway configuration
- `Procfile` - Heroku configuration
- Package.json already has `"start": "node auth-server.js"`

You're ready to deploy! 🚀
