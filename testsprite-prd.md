# Armada Analytics Hub - Product Requirements Document

## Project Overview
Armada Analytics Hub is a secure, authenticated web application for delivery analytics and performance tracking. It provides multiple dashboards protected by Slack OAuth2 authentication with optional domain restriction.

## Core Features

### 1. Authentication System
- **Slack OAuth2 Integration**: Users authenticate via Slack using passport-slack-oauth2
- **Session Management**: Express-session with in-memory storage, 7-day cookie expiration
- **Domain Restriction**: Optional feature to restrict access to specific email domains (e.g., @armadadelivery.com)
- **User Profile**: Stores Slack ID, email, name, avatar, team, and last login timestamp

### 2. Protected Routes
All dashboard routes require authentication:
- `/` - Main dashboard (index.html)
- `/ORDERS_DELIVERY_DASHBOARD.html` - Orders and delivery analytics
- `/MERCHANT_ANALYTICS_DASHBOARD.html` - Merchant performance metrics
- `/PERFORMANCE_CHARTS.html` - Performance visualization charts
- `/ordersBehaviorAnalysis.html` - Order behavior analysis

### 3. API Endpoints
- `GET /api/auth/status` - Check authentication status (public)
- `GET /api/auth/user` - Get authenticated user details (protected)
- `GET /health` - Health check endpoint
- `GET /auth/slack` - Initiate Slack OAuth flow
- `GET /auth/slack/callback` - Slack OAuth callback handler
- `GET /logout` - Logout and session destruction
- `GET /login` - Login page (redirects to dashboard if already authenticated)

### 4. Static Assets
- Public assets (JS, CSS, images) served without authentication
- Auth utility scripts available for client-side authentication checks

## Technical Requirements

### Environment Variables
- `SLACK_CLIENT_ID` - Slack OAuth client ID
- `SLACK_CLIENT_SECRET` - Slack OAuth client secret
- `SLACK_CALLBACK_URL` - OAuth callback URL
- `SESSION_SECRET` - Secret for session encryption
- `RESTRICT_DOMAIN` - Enable/disable domain restriction (true/false)
- `ALLOWED_DOMAIN` - Allowed email domain (e.g., armadadelivery.com)
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)

### Security Features
- HTTPS-only cookies in production
- httpOnly cookies to prevent XSS
- SameSite: lax cookie policy
- Trust proxy for reverse proxy support (Railway, Heroku)
- Domain-based access control

### Dependencies
- express ^5.2.1
- passport ^0.7.0
- passport-slack-oauth2 ^1.2.0
- express-session ^1.18.2
- cookie-parser ^1.4.7
- dotenv ^17.2.3

## Test Coverage Requirements

### Critical Paths to Test
1. **Authentication Flow**
   - Successful Slack OAuth login
   - Failed authentication (denied access)
   - Domain restriction enforcement
   - Callback error handling

2. **Session Management**
   - Session persistence across requests
   - Session serialization/deserialization
   - Session expiration handling
   - Logout functionality

3. **Authorization**
   - Protected routes redirect unauthenticated users
   - Authenticated users can access protected routes
   - ensureAuthenticated middleware functionality

4. **API Endpoints**
   - Auth status returns correct authenticated state
   - User endpoint requires authentication
   - User endpoint returns correct user data
   - Health check always returns 200

5. **Error Handling**
   - OAuth callback failures
   - Missing environment variables
   - Invalid sessions
   - Server errors return 500

6. **Edge Cases**
   - Already authenticated users accessing /login
   - Direct access to callback URL
   - Logout with destroyed session
   - Missing or invalid cookies

## Success Criteria
- 90%+ test coverage
- All critical authentication paths tested
- All API endpoints validated
- Session management verified
- Security features confirmed working
- Error scenarios handled gracefully
