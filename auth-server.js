require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const SlackStrategy = require('passport-slack-oauth2').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Configure Passport Slack Strategy
function configurePassport() {
    passport.use(new SlackStrategy({
        name: 'slack',
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: process.env.SLACK_CALLBACK_URL || 'http://localhost:3000/auth/slack/callback',
        scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Slack OAuth callback received for user:', profile.user.id);
            const email = profile.user.email;

            // Optional: Domain restriction
            if (process.env.RESTRICT_DOMAIN === 'true') {
                const allowedDomain = process.env.ALLOWED_DOMAIN || 'armadadelivery.com';
                if (!email.endsWith(`@${allowedDomain}`)) {
                    console.error(`❌ Access denied: ${email} not in allowed domain ${allowedDomain}`);
                    return done(null, false, { message: `Access restricted to ${allowedDomain} domain only` });
                }
            }

            // Store user data in session (no database write needed)
            const user = {
                slackId: profile.user.id,
                email: email,
                name: profile.user.name,
                avatar: profile.user.image_192 || profile.user.image_512,
                team: profile.team?.name,
                lastLogin: new Date()
            };

            console.log('✅ User authenticated:', email);
            return done(null, user);
        } catch (error) {
            console.error('❌ Error in Slack OAuth callback:', error);
            return done(error);
        }
    }));

    // Serialize user for session - store entire user object
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // Deserialize user from session - retrieve entire user object
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Start server
async function startServer() {
    // Create Express app
    const app = express();

    // Basic middleware
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Cookie-based session configuration (no database needed)
    app.use(cookieSession({
        name: 'armada-session',
        keys: [process.env.SESSION_SECRET || 'armada-analytics-secret-change-in-production'],
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }));

    // Passport initialization (BEFORE configuring strategies)
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure Passport strategies (AFTER passport.initialize())
    configurePassport();

    // Verify strategy registration
    if (passport._strategies && passport._strategies.slack) {
        console.log('✅ Slack strategy registered successfully');
    } else {
        console.error('❌ Slack strategy NOT registered - this will cause 500 errors');
    }

    // API endpoint to check auth status
    app.get('/api/auth/status', (req, res) => {
        if (req.isAuthenticated()) {
            res.json({
                authenticated: true,
                user: {
                    name: req.user.name,
                    email: req.user.email,
                    avatar: req.user.avatar
                }
            });
        } else {
            res.json({ authenticated: false });
        }
    });

    // API endpoint to get user info
    app.get('/api/auth/user', ensureAuthenticated, (req, res) => {
        res.json({
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            team: req.user.team,
            lastLogin: req.user.lastLogin
        });
    });

    // Authentication routes
    app.get('/auth/slack', passport.authenticate('slack'));

    app.get('/auth/slack/callback',
        passport.authenticate('slack', { failureRedirect: '/login?error=access_denied' }),
        (req, res) => {
            // Successful authentication
            console.log('✅ User authenticated successfully:', req.user.email);
            res.redirect('/');
        }
    );

    app.get('/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            req.session.destroy(() => {
                res.redirect('/login');
            });
        });
    });

    // Login page route
    app.get('/login', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.redirect('/');
        }
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });

    // Protect all dashboard routes
    app.get('/', ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.get('/ORDERS_DELIVERY_DASHBOARD.html', ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'ORDERS_DELIVERY_DASHBOARD.html'));
    });

    app.get('/MERCHANT_ANALYTICS_DASHBOARD.html', ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'MERCHANT_ANALYTICS_DASHBOARD.html'));
    });

    app.get('/PERFORMANCE_CHARTS.html', ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'PERFORMANCE_CHARTS.html'));
    });

    app.get('/ordersBehaviorAnalysis.html', ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'ordersBehaviorAnalysis.html'));
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date() });
    });

    // Serve static assets (JS, CSS, images) - these don't need protection
    app.use('/auth-utils.js', express.static(path.join(__dirname, 'public', 'auth-utils.js')));
    app.use('/assets', express.static(path.join(__dirname, 'assets')));

    // Serve other static files from public (for assets referenced in HTML)
    app.use(express.static('public'));

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method
        });
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(60));
        console.log('🚀 Armada Analytics Hub - Authentication Server');
        console.log('='.repeat(60));
        console.log(`\n📊 Server running at: http://0.0.0.0:${PORT}`);
        console.log(`🔒 Login page: http://localhost:${PORT}/login`);
        console.log(`\n🔐 Slack OAuth Status: ${process.env.SLACK_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`🌐 Domain Restriction: ${process.env.RESTRICT_DOMAIN === 'true' ? `✅ Enabled (@${process.env.ALLOWED_DOMAIN})` : '❌ Disabled'}`);
        console.log(`🍪 Session Storage: Cookie-based (no database required)`);
        console.log(`\n⚡ Press Ctrl+C to stop the server\n`);
        console.log('='.repeat(60));
    });
}

startServer().catch(console.error);
