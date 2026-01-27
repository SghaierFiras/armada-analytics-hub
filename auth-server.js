require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SlackStrategy = require('passport-slack-oauth2').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');

// Import new backend infrastructure
const config = require('./src/config');
const logger = require('./src/utils/logger');
const dbConnection = require('./src/db/connection');
const apiRoutes = require('./src/routes');

// Import new middleware
const { applySecurityMiddleware } = require('./src/middleware/security');
const { requestLogger } = require('./src/middleware/logging');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const PORT = config.port;

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
    console.log('🔐 Auth check:');
    console.log('  - isAuthenticated:', req.isAuthenticated());
    console.log('  - session.passport:', JSON.stringify(req.session?.passport));
    console.log('  - user:', req.user?.email || 'none');

    if (req.isAuthenticated()) {
        return next();
    }
    console.log('❌ Not authenticated, redirecting to login');
    res.redirect('/login');
}

// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await dbConnection.connect();
        logger.info('Database connection established');
    } catch (error) {
        logger.error('Failed to connect to database:', error);
        process.exit(1);
    }

    // Create Express app
    const app = express();

    // Apply security middleware (helmet, CORS, rate limiting, etc.)
    applySecurityMiddleware(app);

    // HTTP request logging
    app.use(requestLogger);

    // Basic middleware
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Express-session with in-memory store (native Passport support)
    app.use(session({
        secret: process.env.SESSION_SECRET || 'armada-analytics-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax'
        }
    }));

    // Passport initialization (BEFORE configuring strategies)
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure Passport strategies (AFTER passport.initialize())
    configurePassport();

    // Verify strategy registration
    if (passport._strategies && passport._strategies.slack) {
        logger.info('Slack strategy registered successfully');
    } else {
        logger.error('Slack strategy NOT registered - this will cause 500 errors');
    }

    // ============================================
    // NEW ANALYTICS API ROUTES (No authentication required)
    // ============================================
    app.use('/api', apiRoutes);
    logger.info('Analytics API routes mounted at /api');

    // ============================================
    // EXISTING AUTHENTICATION ENDPOINTS
    // ============================================

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
            console.log('📝 Session after auth:', JSON.stringify(req.session));
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
        console.log('Dashboard access - User:', req.user?.email);
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

    // Serve scripts and data directories for ordering behavior analysis
    app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
    app.use('/data', express.static(path.join(__dirname, 'data')));

    // Serve other static files from public (for assets referenced in HTML)
    app.use(express.static('public'));

    // ============================================
    // ERROR HANDLING
    // ============================================

    // Global error handler (from new middleware)
    app.use(errorHandler);

    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(60));
        console.log('🚀 Armada Analytics Hub - Server Started');
        console.log('='.repeat(60));
        console.log(`\n📊 Server running at: http://0.0.0.0:${PORT}`);
        console.log(`🔒 Login page: http://localhost:${PORT}/login`);
        console.log(`\n🔐 Slack OAuth: ${process.env.SLACK_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`🌐 Domain Restriction: ${process.env.RESTRICT_DOMAIN === 'true' ? `✅ Enabled (@${process.env.ALLOWED_DOMAIN})` : '❌ Disabled'}`);
        console.log(`💾 Session Storage: In-memory (express-session)`);
        console.log(`🗄️  Database: ${config.database.name}`);
        console.log(`\n📡 Analytics API Endpoints:`);
        console.log(`   - GET  /api/merchants/analytics`);
        console.log(`   - GET  /api/orders/analytics`);
        console.log(`   - GET  /api/performance/metrics`);
        console.log(`   - GET  /api/geographic/analysis`);
        console.log(`   - GET  /api/health (API health check)`);
        console.log(`\n📚 Full API documentation: See docs/API.md`);
        console.log(`\n⚡ Press Ctrl+C to stop the server\n`);
        console.log('='.repeat(60));

        logger.info('Server started successfully', {
            port: PORT,
            environment: config.env,
            database: config.database.name
        });
    });
}

startServer().catch(console.error);
