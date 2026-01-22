# Armada Analytics Hub - Authentication Setup Guide

This guide explains how to set up Slack OAuth authentication for the Armada Analytics Hub.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Slack OAuth App Setup](#slack-oauth-app-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Domain Restriction](#domain-restriction)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

The authentication system provides:
- **Slack OAuth 2.0** integration for secure login
- **Session management** using MongoDB
- **Domain restriction** (optional) to limit access to specific email domains
- **User profile** display and management
- **Protected routes** requiring authentication

## Prerequisites

Before setting up authentication, ensure you have:
- Node.js installed (v14 or higher)
- MongoDB Atlas account (already configured)
- Slack workspace with admin access to create apps
- All npm dependencies installed

## Slack OAuth App Setup

### Step 1: Create a Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter the following details:
   - **App Name**: `Armada Analytics Hub`
   - **Workspace**: Select your Armada workspace
5. Click **"Create App"**

### Step 2: Configure OAuth & Permissions

1. In your Slack app dashboard, go to **"OAuth & Permissions"** in the left sidebar
2. Scroll down to **"Redirect URLs"** section
3. Click **"Add New Redirect URL"**
4. Add your callback URL:
   - For local development: `http://localhost:3000/auth/slack/callback`
   - For production: `https://your-domain.com/auth/slack/callback`
5. Click **"Save URLs"**

### Step 3: Add OAuth Scopes

Still in **"OAuth & Permissions"**, scroll down to **"Scopes"** section:

Under **"User Token Scopes"**, add the following scopes:
- `identity.basic` - View basic information about the user
- `identity.email` - View the user's email address
- `identity.avatar` - View the user's profile picture

### Step 4: Get Your Credentials

1. Go to **"Basic Information"** in the left sidebar
2. Scroll down to **"App Credentials"** section
3. Copy the following values:
   - **Client ID**
   - **Client Secret**

Keep these credentials secure - you'll need them for the `.env` file.

## Environment Configuration

Update your `.env` file with the Slack OAuth credentials:

```env
# MongoDB Atlas Connection String (already configured)
MONGODB_URI=your_mongodb_uri

# Slack OAuth Configuration
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
SLACK_CALLBACK_URL=http://localhost:3000/auth/slack/callback

# Session Configuration
# Generate a random string for production (use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=change_this_to_a_random_string_in_production

# Domain Restriction (set to 'true' to enable)
RESTRICT_DOMAIN=true
ALLOWED_DOMAIN=armadadelivery.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Generate a Secure Session Secret

For production, generate a secure random session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace `SESSION_SECRET` in your `.env` file.

## Running the Application

### Development Mode

Start the authentication server:

```bash
npm start
```

The server will start at `http://localhost:3000`

You should see output like:
```
============================================================
🚀 Armada Analytics Hub - Authentication Server
============================================================

📊 Server running at: http://localhost:3000
🔒 Login page: http://localhost:3000/login

🔐 Slack OAuth Status: ✅ Configured
🌐 Domain Restriction: ✅ Enabled (@armadadelivery.com)

⚡ Press Ctrl+C to stop the server

============================================================
```

### Accessing the Application

1. Open your browser and go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Click **"Sign in with Slack"**
4. Authorize the app in Slack
5. You'll be redirected back to the dashboard

## Domain Restriction

The application supports restricting access to specific email domains.

### Enable Domain Restriction

In your `.env` file:

```env
RESTRICT_DOMAIN=true
ALLOWED_DOMAIN=armadadelivery.com
```

When enabled:
- Only users with `@armadadelivery.com` email addresses can log in
- Other users will see an "Access Denied" error
- The login page will display a badge showing the domain restriction

### Disable Domain Restriction

To allow any Slack user to log in:

```env
RESTRICT_DOMAIN=false
```

## Deployment

### For Netlify (Static + Serverless)

1. **Update Callback URL**: In Slack app settings, add production URL:
   ```
   https://your-netlify-domain.netlify.app/auth/slack/callback
   ```

2. **Update Environment Variables**: In Netlify dashboard, add all environment variables from `.env`

3. **Deploy**: Use Netlify CLI or connect your Git repository

### For Heroku

1. **Create Heroku App**:
   ```bash
   heroku create armada-analytics-hub
   ```

2. **Set Environment Variables**:
   ```bash
   heroku config:set SLACK_CLIENT_ID=your_client_id
   heroku config:set SLACK_CLIENT_SECRET=your_client_secret
   heroku config:set SLACK_CALLBACK_URL=https://your-app.herokuapp.com/auth/slack/callback
   heroku config:set SESSION_SECRET=your_random_secret
   heroku config:set RESTRICT_DOMAIN=true
   heroku config:set ALLOWED_DOMAIN=armadadelivery.com
   heroku config:set MONGODB_URI=your_mongodb_uri
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

### For AWS/Digital Ocean/Custom Server

1. Install Node.js on your server
2. Clone your repository
3. Create `.env` file with production values
4. Install dependencies: `npm install`
5. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start auth-server.js --name armada-analytics
   pm2 save
   pm2 startup
   ```

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use HTTPS in production** - Set `NODE_ENV=production` to enable secure cookies
3. **Rotate session secret** periodically
4. **Keep Slack credentials secure** - Don't share or expose them
5. **Enable domain restriction** for production use
6. **Regular security updates**: Keep dependencies updated

## User Management

### Viewing Users

Users are stored in MongoDB in the `armada_analytics` database, `users` collection.

To view all authenticated users:

```javascript
// Connect to MongoDB and query users
db.users.find({}).pretty()
```

### User Data Structure

```json
{
  "slackId": "U1234567890",
  "email": "user@armadadelivery.com",
  "name": "John Doe",
  "avatar": "https://...",
  "team": "Armada",
  "accessToken": "xoxp-...",
  "lastLogin": "2024-01-21T12:00:00.000Z"
}
```

## Troubleshooting

### Error: "SLACK_CLIENT_ID is not defined"

**Solution**: Make sure you've added your Slack credentials to the `.env` file.

### Error: "Redirect URL mismatch"

**Solution**: Ensure the `SLACK_CALLBACK_URL` in `.env` matches the redirect URL configured in your Slack app settings.

### Error: "Access Denied"

**Solutions**:
- Check if domain restriction is enabled
- Verify the user's email domain matches `ALLOWED_DOMAIN`
- Check Slack app scopes include `identity.email`

### Users can't log in

**Check**:
1. Slack app is installed in your workspace
2. OAuth scopes are correctly set
3. Redirect URLs are properly configured
4. MongoDB is accessible
5. Server is running

### Session expires immediately

**Solutions**:
- Check MongoDB connection
- Verify `SESSION_SECRET` is set
- Ensure cookies are enabled in browser
- Check if `NODE_ENV` is set correctly

### MongoDB "not authorized" error on createIndexes

**Error**: `MongoServerError: not authorized on armada_analytics to execute command { createIndexes: "sessions"...`

**Solution**: This error occurs when the MongoDB user doesn't have permission to create indexes. The auth-server is already configured to handle this with `autoRemove: 'disabled'`. The sessions will still work, but won't be automatically cleaned up by TTL indexes.

**To grant permissions** (if you have admin access):

1. Go to MongoDB Atlas Dashboard
2. Navigate to Database Access
3. Edit the user's permissions
4. Grant "readWrite" role on `armada_analytics` database

## API Endpoints

### Public Endpoints
- `GET /login` - Login page
- `GET /auth/slack` - Initiate Slack OAuth flow
- `GET /auth/slack/callback` - OAuth callback
- `GET /health` - Health check

### Protected Endpoints
- `GET /` - Main dashboard (requires authentication)
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/user` - Get user information
- `GET /logout` - Logout user

All dashboard HTML files require authentication to access.

## Support

For issues or questions:
1. Check this documentation first
2. Review server logs for error messages
3. Check Slack app configuration
4. Verify environment variables
5. Test with domain restriction disabled

## Next Steps

After setting up authentication:
1. Test the login flow with different users
2. Verify domain restriction works as expected
3. Configure production deployment
4. Set up monitoring and logging
5. Consider adding role-based access control if needed
