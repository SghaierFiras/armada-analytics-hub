require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SlackStrategy = require('passport-slack-oauth2').Strategy;
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('armada_analytics');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Configure Passport Slack Strategy
function configurePassport() {
    passport.use(new SlackStrategy({
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: process.env.SLACK_CALLBACK_URL || 'http://localhost:3000/auth/slack/callback',
        scope: ['identity.basic', 'identity.email', 'identity.avatar']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.user.email;

            // Optional: Domain restriction
            if (process.env.RESTRICT_DOMAIN === 'true') {
                const allowedDomain = process.env.ALLOWED_DOMAIN || 'armadadelivery.com';
                if (!email.endsWith(`@${allowedDomain}`)) {
                    return done(null, false, { message: `Access restricted to ${allowedDomain} domain only` });
                }
            }

            const user = {
                slackId: profile.user.id,
                email: email,
                name: profile.user.name,
                avatar: profile.user.image_192 || profile.user.image_512,
                team: profile.team?.name,
                accessToken: accessToken,
                lastLogin: new Date()
            };

            // Store or update user in database
            const usersCollection = db.collection('users');
            await usersCollection.updateOne(
                { slackId: user.slackId },
                { $set: user },
                { upsert: true }
            );

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));

    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.slackId);
    });

    // Deserialize user from session
    passport.deserializeUser(async (slackId, done) => {
        try {
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ slackId });
            done(null, user);
        } catch (error) {
            done(error);
        }
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
    await connectToMongo();

    // Create Express app
    const app = express();

    // Basic middleware
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session configuration
    app.use(session({
        secret: process.env.SESSION_SECRET || 'armada-analytics-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            dbName: 'armada_analytics',
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days
            autoRemove: 'disabled', // Disable auto-index creation if user lacks permissions
            touchAfter: 24 * 3600 // Lazy session update
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
    }));

    // Passport initialization (BEFORE configuring strategies)
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure Passport strategies (AFTER passport.initialize())
    configurePassport();

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
    app.get('/auth/slack', passport.authenticate('Slack'));

    app.get('/auth/slack/callback',
        passport.authenticate('Slack', { failureRedirect: '/login?error=access_denied' }),
        (req, res) => {
            // Successful authentication
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
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🚀 Armada Analytics Hub - Authentication Server');
        console.log('='.repeat(60));
        console.log(`\n📊 Server running at: http://localhost:${PORT}`);
        console.log(`🔒 Login page: http://localhost:${PORT}/login`);
        console.log(`\n🔐 Slack OAuth Status: ${process.env.SLACK_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`🌐 Domain Restriction: ${process.env.RESTRICT_DOMAIN === 'true' ? `✅ Enabled (@${process.env.ALLOWED_DOMAIN})` : '❌ Disabled'}`);
        console.log(`\n⚡ Press Ctrl+C to stop the server\n`);
        console.log('='.repeat(60));
    });
}

startServer().catch(console.error);
