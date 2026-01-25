# 🚀 Armada Analytics Hub - Quick Start Guide

## What Was Implemented

A complete authentication system with:
- ✅ Slack OAuth 2.0 integration
- ✅ Session management with MongoDB
- ✅ Optional domain restriction (@armadadelivery.com)
- ✅ User profile display with avatar
- ✅ Protected dashboard routes
- ✅ Automatic authentication checks
- ✅ Logout functionality

## Files Created

### Backend
- **`auth-server.js`** - Main authentication server with Express.js
- **`.env`** - Environment configuration (update with your Slack credentials)

### Frontend
- **`public/login.html`** - Beautiful login page with Slack OAuth button
- **`public/auth-utils.js`** - Client-side authentication utility
- **`public/example-dashboard-integration.html`** - Integration example

### Documentation
- **`AUTHENTICATION_SETUP.md`** - Complete setup guide
- **`QUICKSTART.md`** - This file

## Getting Started in 3 Steps

### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Armada Analytics Hub"
4. Add redirect URL: `http://localhost:3000/auth/slack/callback`
5. Add scopes: `identity.basic`, `identity.email`, `identity.avatar`
6. Copy your Client ID and Client Secret

### Step 2: Configure Environment

Edit `.env` file and add your Slack credentials:

```env
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
```

To enable domain restriction (recommended):
```env
RESTRICT_DOMAIN=true
ALLOWED_DOMAIN=armadadelivery.com
```

### Step 3: Start the Server

```bash
npm start
```

Open http://localhost:3000 and log in with Slack!

## How It Works

### Authentication Flow

1. User visits any dashboard page (e.g., http://localhost:3000)
2. Server checks if user is authenticated
3. If not authenticated → redirect to `/login`
4. User clicks "Sign in with Slack"
5. Slack OAuth flow completes
6. User is redirected back to dashboard
7. Session is stored in MongoDB

### Domain Restriction (Optional)

When enabled:
- Only users with `@armadadelivery.com` emails can access
- Other domains will see "Access Denied" error
- Perfect for company-internal dashboards

### Protected Routes

All dashboard pages are automatically protected:
- `/` (index.html)
- `/ORDERS_DELIVERY_DASHBOARD.html`
- `/MERCHANT_ANALYTICS_DASHBOARD.html`
- `/PERFORMANCE_CHARTS.html`
- `/ordersBehaviorAnalysis.html`

## Integrating Auth into Your Dashboards

### Simple Integration (3 lines)

Add to any HTML file:

```html
<!-- 1. Include the auth script -->
<script src="/auth-utils.js"></script>

<!-- 2. Add user profile container in your sidebar -->
<div id="user-profile-container"></div>

<!-- That's it! Authentication is automatic -->
```

### What You Get

✅ Automatic authentication check on page load
✅ User profile display with avatar
✅ User name and email
✅ Logout button
✅ Redirect to login if not authenticated

See `public/example-dashboard-integration.html` for a complete example.

## API Endpoints

### Public
- `GET /login` - Login page
- `GET /auth/slack` - Start Slack OAuth
- `GET /auth/slack/callback` - OAuth callback

### Protected
- `GET /api/auth/status` - Check if authenticated
- `GET /api/auth/user` - Get user info
- `GET /logout` - Logout

## Testing

1. Start server: `npm start`
2. Visit: http://localhost:3000
3. Should redirect to login page
4. Click "Sign in with Slack"
5. Authorize the app
6. You'll be logged in and see your profile

## Domain Restriction Testing

To test domain restriction:

1. Enable in `.env`:
   ```env
   RESTRICT_DOMAIN=true
   ALLOWED_DOMAIN=armadadelivery.com
   ```

2. Try logging in with:
   - ✅ user@armadadelivery.com → Should work
   - ❌ user@gmail.com → Should be denied

## Production Deployment

### Before Deploying

1. **Update callback URL** in Slack app:
   ```
   https://your-domain.com/auth/slack/callback
   ```

2. **Generate secure session secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `.env` for production**:
   ```env
   NODE_ENV=production
   SLACK_CALLBACK_URL=https://your-domain.com/auth/slack/callback
   SESSION_SECRET=your_generated_secret
   RESTRICT_DOMAIN=true
   ```

4. **Deploy** to your platform (Heroku, AWS, etc.)

See `AUTHENTICATION_SETUP.md` for detailed deployment instructions.

## Troubleshooting

### "SLACK_CLIENT_ID is not defined"
→ Add your Slack credentials to `.env`

### "Redirect URL mismatch"
→ Make sure callback URL in `.env` matches Slack app settings

### "Access Denied"
→ Check if domain restriction is enabled and your email domain matches

### Sessions expire immediately
→ Check MongoDB connection

## Security Features

- ✅ Secure session management
- ✅ HTTP-only cookies
- ✅ MongoDB session storage
- ✅ Optional domain restriction
- ✅ No passwords stored
- ✅ OAuth 2.0 standard

## Next Steps

1. ✅ Set up Slack app (5 minutes)
2. ✅ Update `.env` with credentials
3. ✅ Test locally
4. ✅ Integrate into existing dashboards
5. ✅ Deploy to production

## Support

- Full setup guide: `AUTHENTICATION_SETUP.md`
- Integration example: `public/example-dashboard-integration.html`
- Server code: `auth-server.js`
- Client code: `public/auth-utils.js`

## Summary

You now have a complete, production-ready authentication system for your Armada Analytics Hub. Users can securely log in with their Slack accounts, and you can optionally restrict access to @armadadelivery.com domain only.

The system is:
- **Secure** - OAuth 2.0 with session management
- **Easy** - 3 lines of code to integrate
- **Flexible** - Optional domain restriction
- **Professional** - Beautiful login UI with user profiles

Happy analyzing! 📊
