# Armada Analytics Hub - Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Armada Analytics Hub                          │
│                  (With Slack OAuth Authentication)                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │◄────►│ Auth Server  │◄────►│   MongoDB    │
│  (Frontend)  │      │  (Express)   │      │  (Database)  │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│    Slack     │      │  Dashboard   │
│    OAuth     │      │    Pages     │
└──────────────┘      └──────────────┘
```

## Component Architecture

### 1. Frontend Layer

```
public/
├── login.html                    # Login page with Slack button
├── auth-utils.js                 # Client-side auth utility
├── index.html                    # Main dashboard (protected)
├── ORDERS_DELIVERY_DASHBOARD.html      (protected)
├── MERCHANT_ANALYTICS_DASHBOARD.html   (protected)
├── PERFORMANCE_CHARTS.html            (protected)
└── ordersBehaviorAnalysis.html        (protected)
```

**Key Features:**
- `auth-utils.js` automatically checks authentication on every page load
- User profile rendered automatically in `#user-profile-container`
- Redirects to login if not authenticated
- Clean, reusable component

### 2. Backend Layer

```
auth-server.js
├── Express Server
├── Passport.js (OAuth middleware)
├── Session Management
├── Route Protection
└── User Management
```

**Routes:**
- `/login` - Public login page
- `/auth/slack` - Initiate OAuth
- `/auth/slack/callback` - OAuth callback
- `/api/auth/status` - Check auth status
- `/api/auth/user` - Get user info
- `/logout` - Logout
- `/*` - Protected dashboard routes

### 3. Database Layer

```
MongoDB (armada_analytics)
├── users Collection
│   ├── slackId (unique)
│   ├── email
│   ├── name
│   ├── avatar
│   └── lastLogin
└── sessions Collection
    ├── session ID
    ├── session data
    └── expiry
```

## Authentication Flow Diagram

```
┌──────────┐
│  User    │
│ Browser  │
└────┬─────┘
     │
     │ 1. Request dashboard
     ▼
┌─────────────────┐
│  auth-utils.js  │
│  (Client-side)  │
└────┬────────────┘
     │
     │ 2. Check /api/auth/status
     ▼
┌─────────────────┐        ┌──────────────┐
│  Auth Server    │───────►│   Session    │
│  (Express)      │◄───────│   Store      │
└────┬────────────┘        └──────────────┘
     │
     │ 3. Not authenticated?
     │    Redirect to /login
     ▼
┌─────────────────┐
│   Login Page    │
│  (login.html)   │
└────┬────────────┘
     │
     │ 4. Click "Sign in with Slack"
     ▼
┌─────────────────┐
│  Slack OAuth    │
│  (api.slack.com)│
└────┬────────────┘
     │
     │ 5. User authorizes
     │    Returns to /auth/slack/callback
     ▼
┌─────────────────┐
│  Auth Server    │
│  (Passport.js)  │
└────┬────────────┘
     │
     │ 6. Verify OAuth response
     │ 7. Check domain (if enabled)
     ▼
┌─────────────────┐        ┌──────────────┐
│  Create Session │───────►│   MongoDB    │
│  Store User     │◄───────│   Database   │
└────┬────────────┘        └──────────────┘
     │
     │ 8. Set session cookie
     │ 9. Redirect to dashboard
     ▼
┌─────────────────┐
│   Dashboard     │
│   (Protected)   │
└────┬────────────┘
     │
     │ 10. auth-utils.js loads user profile
     ▼
┌─────────────────┐
│  User Profile   │
│  Avatar, Name   │
│  Logout Button  │
└─────────────────┘
```

## Session Management

```
┌─────────────────────────────────────────────────────┐
│               Session Lifecycle                      │
└─────────────────────────────────────────────────────┘

Login (Slack OAuth)
    │
    ▼
Create Session in MongoDB
    │
    ├─ Session ID: random string
    ├─ User Data: {slackId, email, name}
    ├─ Created: timestamp
    └─ Expires: 7 days from creation
    │
    ▼
Set Cookie in Browser
    │
    ├─ Name: connect.sid
    ├─ HTTP-only: true
    ├─ Secure: true (production)
    └─ Max-Age: 7 days
    │
    ▼
User Requests Protected Route
    │
    ▼
Server Reads Cookie
    │
    ▼
Look Up Session in MongoDB
    │
    ├─ Session Found & Valid? ──► Allow Access
    │
    └─ Session Missing/Expired? ──► Redirect to Login
```

## Domain Restriction Flow

```
┌─────────────────────────────────────────────────────┐
│           Domain Restriction (Optional)              │
└─────────────────────────────────────────────────────┘

Environment Variable: RESTRICT_DOMAIN=true
Allowed Domain: armadadelivery.com

User Completes OAuth
    │
    ▼
Extract Email from Slack Profile
    │
    ▼
Check Domain Restriction Setting
    │
    ├─ RESTRICT_DOMAIN = false ──► Allow Login
    │
    └─ RESTRICT_DOMAIN = true
        │
        ▼
    Check Email Domain
        │
        ├─ Ends with @armadadelivery.com ──► Allow Login
        │
        └─ Different domain ──► Deny Access
            │
            ▼
        Redirect to /login?error=access_denied
```

## Integration Architecture

### Adding Auth to New Dashboard

```
┌─────────────────────────────────────────────────────┐
│              Dashboard Integration                   │
└─────────────────────────────────────────────────────┘

Step 1: Include Auth Script
─────────────────────────────
<script src="/auth-utils.js"></script>

Step 2: Add Profile Container (in sidebar)
─────────────────────────────
<div id="user-profile-container"></div>

Step 3: Done!
─────────────────────────────
auth-utils.js automatically:
  ✓ Checks authentication
  ✓ Redirects if not logged in
  ✓ Shows user profile
  ✓ Adds logout button
```

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│               Security Layers                        │
└─────────────────────────────────────────────────────┘

Layer 1: Slack OAuth
────────────────────
✓ Industry standard OAuth 2.0
✓ No passwords stored
✓ Slack handles authentication
✓ User authorizes specific scopes

Layer 2: Session Security
────────────────────
✓ HTTP-only cookies (XSS protection)
✓ Secure flag in production (HTTPS-only)
✓ Random session IDs
✓ 7-day expiration
✓ MongoDB storage (not in-memory)

Layer 3: Domain Restriction (Optional)
────────────────────
✓ Email domain validation
✓ @armadadelivery.com only
✓ Rejects unauthorized domains

Layer 4: Route Protection
────────────────────
✓ Middleware checks every request
✓ Server-side validation
✓ No client-side bypass possible
✓ Automatic redirect to login

Layer 5: Data Protection
────────────────────
✓ User data in MongoDB
✓ Access tokens encrypted
✓ No sensitive data in logs
✓ CORS protection
```

## Data Flow

### Read Dashboard Data

```
User Browser
    │
    │ 1. GET /index.html
    ▼
Auth Middleware (ensureAuthenticated)
    │
    │ 2. Check session cookie
    ▼
Session Store (MongoDB)
    │
    │ 3. Validate session
    ▼
Send Dashboard HTML
    │
    │ 4. Load auth-utils.js
    ▼
GET /api/auth/user
    │
    │ 5. Return user profile
    ▼
Render User Profile in UI
```

### Logout Flow

```
User Clicks Logout
    │
    │ authManager.logout()
    ▼
GET /logout
    │
    ▼
req.logout() (Passport.js)
    │
    ▼
req.session.destroy()
    │
    ▼
Delete Session from MongoDB
    │
    ▼
Clear Cookie from Browser
    │
    ▼
Redirect to /login
```

## Deployment Architecture

### Development

```
http://localhost:3000
    │
    ├─ auth-server.js (Node.js)
    ├─ MongoDB Atlas (cloud)
    └─ Slack OAuth (dev app)
```

### Production

```
https://your-domain.com
    │
    ├─ Express Server (scaled)
    │   ├─ Instance 1
    │   ├─ Instance 2
    │   └─ Instance N
    │
    ├─ MongoDB Atlas (production)
    │   └─ Shared session store
    │
    └─ Slack OAuth (production app)
```

**Production Requirements:**
- HTTPS enabled (SSL/TLS)
- NODE_ENV=production
- Secure session secret
- Updated callback URL
- Domain restriction enabled

## Scalability

```
┌─────────────────────────────────────────────────────┐
│              Horizontal Scaling                      │
└─────────────────────────────────────────────────────┘

Load Balancer
    │
    ├─► Express Server 1 ─┐
    │                      │
    ├─► Express Server 2 ─┼─► MongoDB Atlas
    │                      │   (Shared Sessions)
    └─► Express Server 3 ─┘

✓ Stateless servers (sessions in MongoDB)
✓ Any server can handle any request
✓ Easy to add more instances
✓ MongoDB handles concurrent access
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────┐
│           What to Monitor                            │
└─────────────────────────────────────────────────────┘

1. Authentication Rate
   - Successful logins per hour
   - Failed login attempts
   - Domain restriction blocks

2. Session Health
   - Active sessions count
   - Session creation rate
   - Session expiration rate
   - MongoDB connection status

3. Performance
   - Auth check response time
   - OAuth callback latency
   - Dashboard load time

4. Errors
   - OAuth failures
   - Session store errors
   - Network issues
   - Slack API errors

5. Security
   - Unusual access patterns
   - Multiple failed logins
   - Domain restriction violations
   - Session hijacking attempts
```

## Technology Stack

```
Frontend:
├── HTML5
├── CSS3
├── Vanilla JavaScript
└── auth-utils.js (custom)

Backend:
├── Node.js
├── Express.js 5.x
├── Passport.js
└── passport-slack-oauth2

Session:
├── express-session
├── connect-mongo
└── cookie-parser

Database:
└── MongoDB Atlas

External:
└── Slack OAuth API
```

## Summary

This architecture provides:
- ✅ Secure authentication via Slack OAuth
- ✅ Persistent sessions with MongoDB
- ✅ Optional domain restriction
- ✅ Easy integration (3 lines)
- ✅ Scalable design
- ✅ Production-ready security
- ✅ Clear separation of concerns
- ✅ Maintainable codebase
