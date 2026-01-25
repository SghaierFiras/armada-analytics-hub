# 🚀 Quick Deploy to Railway.app (10 Minutes)

## Why This Error Happened

Your Netlify deployment shows "Page not found" because:
- **Netlify = Static hosting only** (HTML, CSS, JS files)
- **Your app needs = Node.js server** (for OAuth, sessions, authentication)

**Solution:** Deploy the Node.js backend to Railway.app

---

## Step 1: Create Railway Account (1 min)

1. Visit: <https://railway.app>
2. Click **"Login with GitHub"**
3. Authorize Railway

---

## Step 2: Deploy from GitHub (2 min)

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **Armada** repository
4. Railway auto-detects Node.js ✅

---

## Step 3: Add Environment Variables (3 min)

Click on your project → **Variables** tab → Add these:

```
MONGODB_URI = mongodb+srv://firas_db_user:qZWkt031JJIOPQQy@production.g8vjv.mongodb.net/

SLACK_CLIENT_ID = 41353267588.10339254799907

SLACK_CLIENT_SECRET = 212bb7b28d2e062568e968030c9cdf65

SESSION_SECRET = 48b31d6b5f40f73628a880685eb2a6c35775e25a180d7c184bd382d049367bba

RESTRICT_DOMAIN = true

ALLOWED_DOMAIN = armadadelivery.com

NODE_ENV = production

PORT = 3000
```

**Note:** Don't set `SLACK_CALLBACK_URL` yet - we need the Railway URL first!

---

## Step 4: Get Your Railway URL (1 min)

After deployment completes:

1. Go to **Settings** tab
2. Under **Domains**, you'll see: `your-app-name-production-xxxx.up.railway.app`
3. Copy this URL

Example: `armada-analytics-production-a1b2.up.railway.app`

---

## Step 5: Update Slack App (2 min)

1. Go to: <https://api.slack.com/apps/A08R27ECC53>
2. Click **OAuth & Permissions** (left sidebar)
3. Scroll to **Redirect URLs**
4. Click **Add New Redirect URL**
5. Paste: `https://your-railway-url.up.railway.app/auth/slack/callback`

   Example: `https://armada-analytics-production-a1b2.up.railway.app/auth/slack/callback`

6. Click **Save URLs**

---

## Step 6: Add Callback URL to Railway (1 min)

Back in Railway:

1. Go to **Variables** tab
2. Add new variable:
   ```
   SLACK_CALLBACK_URL = https://your-railway-url.up.railway.app/auth/slack/callback
   ```
3. Click **Add** (Railway will auto-redeploy)

---

## Step 7: Test Your Deployment! (1 min)

1. Visit: `https://your-railway-url.up.railway.app`
2. You should see the **login page**
3. Click **"Sign in with Slack"**
4. Complete OAuth flow
5. **Success!** You're logged in and can see your analytics

---

## 🎉 Done!

Your Armada Analytics Hub is now:
- ✅ Deployed with authentication
- ✅ Accessible at your Railway URL
- ✅ Protected with Slack OAuth
- ✅ Domain restricted to @armadadelivery.com
- ✅ Running with HTTPS

---

## 📝 Your URLs

**Old (Netlify - Not Working):**
- ❌ https://armada-analytics-hub.netlify.app

**New (Railway - Working!):**
- ✅ https://your-app-name.up.railway.app

---

## 🔄 Making Updates

When you push changes to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway automatically:
1. Detects the push
2. Rebuilds your app
3. Deploys the new version
4. Zero downtime! 🚀

---

## 💡 Custom Domain (Optional)

Want to use your own domain?

1. In Railway → **Settings** → **Domains**
2. Click **Custom Domain**
3. Add: `analytics.armadadelivery.com` (or any subdomain)
4. Update your DNS with Railway's CNAME
5. Railway auto-configures HTTPS

Then update Slack callback URL to use your custom domain.

---

## 🆘 Troubleshooting

### "Cannot access deployment"
- Check Railway logs (click on deployment)
- Verify all environment variables are set
- Make sure MongoDB URI is correct

### "Redirect URI mismatch"
- Ensure Slack callback URL exactly matches Railway URL
- Include `/auth/slack/callback` at the end
- Use `https://` not `http://`

### "Access Denied" after login
- Check `RESTRICT_DOMAIN=true` and `ALLOWED_DOMAIN`
- Make sure you're logging in with @armadadelivery.com email

---

## 📊 Costs

**Railway Free Tier:**
- $5 credit per month
- More than enough for your app
- No credit card required initially
- Upgrade to $5/month plan when needed

**Estimated usage:** ~$3-5/month for your analytics hub

---

## ✨ What's Next?

Your authentication system is now live! You can:

1. Share the Railway URL with your team
2. They can log in with Slack
3. Access all analytics dashboards
4. Logout when done

All data stays secure with:
- OAuth authentication
- Session management
- Domain restriction
- HTTPS encryption

---

## 📚 More Info

- Full deployment guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Authentication setup: [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)
- Quick start: [QUICKSTART.md](QUICKSTART.md)

**Questions?** Check the logs in Railway dashboard or refer to documentation.

---

**Your Armada Analytics Hub is ready to use! 🎊**
