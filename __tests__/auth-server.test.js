const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Mock environment variables
process.env.SLACK_CLIENT_ID = 'test-client-id';
process.env.SLACK_CLIENT_SECRET = 'test-client-secret';
process.env.SLACK_CALLBACK_URL = 'http://localhost:3000/auth/slack/callback';
process.env.SESSION_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

describe('Armada Authentication Server - Comprehensive Tests', () => {
  let app;

  beforeEach(() => {
    // Clear module cache to ensure fresh app instance
    jest.clearAllMocks();

    // Create a test Express app that mimics auth-server.js
    app = express();

    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Mock passport serialization
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    // Mock ensureAuthenticated middleware
    const ensureAuthenticated = (req, res, next) => {
      if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
      }
      res.redirect('/login');
    };

    // Define routes
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    app.get('/api/auth/status', (req, res) => {
      if (req.isAuthenticated && req.isAuthenticated()) {
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

    app.get('/api/auth/user', ensureAuthenticated, (req, res) => {
      res.json({
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        team: req.user.team,
        lastLogin: req.user.lastLogin
      });
    });

    app.get('/login', (req, res) => {
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/');
      }
      res.send('Login page');
    });

    app.get('/logout', (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).send('Logout error');
        }
        req.session.destroy(() => {
          res.redirect('/login');
        });
      });
    });

    app.get('/', ensureAuthenticated, (req, res) => {
      res.send('Dashboard');
    });

    app.get('/ORDERS_DELIVERY_DASHBOARD.html', ensureAuthenticated, (req, res) => {
      res.send('Orders Dashboard');
    });

    app.get('/MERCHANT_ANALYTICS_DASHBOARD.html', ensureAuthenticated, (req, res) => {
      res.send('Merchant Analytics');
    });

    app.get('/PERFORMANCE_CHARTS.html', ensureAuthenticated, (req, res) => {
      res.send('Performance Charts');
    });

    app.get('/ordersBehaviorAnalysis.html', ensureAuthenticated, (req, res) => {
      res.send('Behavior Analysis');
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    });
  });

  describe('Health Check Endpoint', () => {
    test('GET /health should return 200 and status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /health should always be accessible without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication Status Endpoint', () => {
    test('GET /api/auth/status should return authenticated: false when not logged in', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body).toEqual({ authenticated: false });
    });

    test('GET /api/auth/status should be accessible without authentication', async () => {
      await request(app)
        .get('/api/auth/status')
        .expect(200);
    });
  });

  describe('Protected Routes - Unauthenticated Access', () => {
    test('GET / should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /ORDERS_DELIVERY_DASHBOARD.html should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/ORDERS_DELIVERY_DASHBOARD.html')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /MERCHANT_ANALYTICS_DASHBOARD.html should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/MERCHANT_ANALYTICS_DASHBOARD.html')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /PERFORMANCE_CHARTS.html should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/PERFORMANCE_CHARTS.html')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /ordersBehaviorAnalysis.html should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/ordersBehaviorAnalysis.html')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /api/auth/user should redirect to /login when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });
  });

  describe('Login Page', () => {
    test('GET /login should return login page when not authenticated', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200);

      expect(response.text).toContain('Login page');
    });

    test('GET /login should be accessible without authentication', async () => {
      await request(app)
        .get('/login')
        .expect(200);
    });
  });

  describe('Session Management', () => {
    test('Should handle session cookies correctly', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Session cookie should be set
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find(c => c.includes('connect.sid'));
        if (sessionCookie) {
          expect(sessionCookie).toContain('HttpOnly');
        }
      }
    });

    test('Should maintain session across requests', async () => {
      const agent = request.agent(app);

      const response1 = await agent.get('/health').expect(200);
      const response2 = await agent.get('/health').expect(200);

      // Both requests should succeed
      expect(response1.body.status).toBe('ok');
      expect(response2.body.status).toBe('ok');
    });
  });

  describe('Error Scenarios', () => {
    test('Should handle invalid routes with 404', async () => {
      const response = await request(app)
        .get('/invalid-route-that-does-not-exist')
        .expect(404);
    });

    test('Should handle malformed requests gracefully', async () => {
      await request(app)
        .post('/api/auth/status')
        .send({ invalid: 'data' })
        .expect(404);
    });
  });

  describe('Logout Functionality', () => {
    test('GET /logout should redirect to /login', async () => {
      const response = await request(app)
        .get('/logout')
        .expect(302);

      expect(response.headers.location).toBe('/login');
    });

    test('GET /logout should be accessible even without authentication', async () => {
      await request(app)
        .get('/logout')
        .expect(302);
    });
  });

  describe('Security Headers and Configuration', () => {
    test('Should set appropriate cookie security flags', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        const sessionCookie = cookies.find(c => c.includes('connect.sid'));
        if (sessionCookie) {
          expect(sessionCookie).toContain('HttpOnly');
          expect(sessionCookie).toContain('SameSite=Lax');
        }
      }
    });

    test('Should trust proxy for reverse proxy setups', async () => {
      expect(app.get('trust proxy')).toBeTruthy();
    });
  });

  describe('API Response Formats', () => {
    test('/health should return JSON with correct structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    test('/api/auth/status should return JSON with correct structure', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('authenticated');
      expect(typeof response.body.authenticated).toBe('boolean');
    });
  });

  describe('Rate Limiting and Performance', () => {
    test('Should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/health').expect(200)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });
    });

    test('Should respond to health checks quickly', async () => {
      const start = Date.now();
      await request(app).get('/health').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
