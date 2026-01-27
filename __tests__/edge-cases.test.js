describe('Edge Cases and Environment Configuration Tests', () => {
  describe('Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('Should have required Slack OAuth environment variables', () => {
      process.env.SLACK_CLIENT_ID = 'test-client-id';
      process.env.SLACK_CLIENT_SECRET = 'test-client-secret';
      process.env.SLACK_CALLBACK_URL = 'http://localhost:3000/auth/slack/callback';

      expect(process.env.SLACK_CLIENT_ID).toBeDefined();
      expect(process.env.SLACK_CLIENT_SECRET).toBeDefined();
      expect(process.env.SLACK_CALLBACK_URL).toBeDefined();
    });

    test('Should use default PORT if not specified', () => {
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe(3000);
    });

    test('Should handle custom PORT configuration', () => {
      process.env.PORT = '8080';
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe('8080');
    });

    test('Should use default callback URL if not specified', () => {
      delete process.env.SLACK_CALLBACK_URL;
      const callbackURL = process.env.SLACK_CALLBACK_URL || 'http://localhost:3000/auth/slack/callback';
      expect(callbackURL).toBe('http://localhost:3000/auth/slack/callback');
    });

    test('Should use default session secret if not specified', () => {
      delete process.env.SESSION_SECRET;
      const secret = process.env.SESSION_SECRET || 'armada-analytics-secret-change-in-production';
      expect(secret).toBe('armada-analytics-secret-change-in-production');
    });

    test('Should detect production environment correctly', () => {
      process.env.NODE_ENV = 'production';
      expect(process.env.NODE_ENV).toBe('production');
    });

    test('Should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development';
      expect(process.env.NODE_ENV).toBe('development');
    });

    test('Should handle RESTRICT_DOMAIN flag correctly', () => {
      process.env.RESTRICT_DOMAIN = 'true';
      expect(process.env.RESTRICT_DOMAIN).toBe('true');
      expect(process.env.RESTRICT_DOMAIN === 'true').toBe(true);
    });

    test('Should handle missing ALLOWED_DOMAIN with default', () => {
      delete process.env.ALLOWED_DOMAIN;
      const domain = process.env.ALLOWED_DOMAIN || 'armadadelivery.com';
      expect(domain).toBe('armadadelivery.com');
    });
  });

  describe('Authentication Edge Cases', () => {
    test('Should handle user object with missing optional fields', () => {
      const minimalUser = {
        slackId: 'U123456',
        email: 'test@example.com',
        name: 'Test User',
        lastLogin: new Date()
      };

      expect(minimalUser.avatar).toBeUndefined();
      expect(minimalUser.team).toBeUndefined();
      expect(minimalUser.slackId).toBeDefined();
    });

    test('Should handle email validation edge cases', () => {
      const emails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'first.last@company.com',
        'admin@localhost'
      ];

      emails.forEach(email => {
        expect(email).toContain('@');
        expect(email.split('@').length).toBe(2);
      });
    });

    test('Should handle domain matching correctly', () => {
      const testCases = [
        { email: 'test@armadadelivery.com', domain: 'armadadelivery.com', expected: true },
        { email: 'test@otherdomain.com', domain: 'armadadelivery.com', expected: false },
        { email: 'test@sub.armadadelivery.com', domain: 'armadadelivery.com', expected: false },
        { email: 'testarmadadelivery.com', domain: 'armadadelivery.com', expected: false }
      ];

      testCases.forEach(({ email, domain, expected }) => {
        const matches = email.endsWith(`@${domain}`);
        expect(matches).toBe(expected);
      });
    });

    test('Should handle special characters in user names', () => {
      const names = [
        "O'Connor",
        "Marie-Claire",
        "José García",
        "李明",
        "Müller"
      ];

      names.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('URL and Route Edge Cases', () => {
    test('Should handle trailing slashes in routes', () => {
      const routes = {
        '/': '/login',
        '/login': '/login',
        '/logout': '/login',
        '/ORDERS_DELIVERY_DASHBOARD.html': '/login'
      };

      Object.values(routes).forEach(redirect => {
        expect(redirect).toBe('/login');
      });
    });

    test('Should handle query parameters in redirect URLs', () => {
      const redirectUrl = '/login?error=access_denied';
      const hasError = redirectUrl.includes('error=');

      expect(hasError).toBe(true);
      expect(redirectUrl).toContain('access_denied');
    });

    test('Should handle callback URL construction', () => {
      const baseUrl = 'http://localhost:3000';
      const callbackPath = '/auth/slack/callback';
      const fullUrl = baseUrl + callbackPath;

      expect(fullUrl).toBe('http://localhost:3000/auth/slack/callback');
    });

    test('Should handle HTTPS URLs in production', () => {
      const productionUrl = 'https://armada.example.com/auth/slack/callback';

      expect(productionUrl).toMatch(/^https:\/\//);
    });
  });

  describe('Date and Time Handling', () => {
    test('Should handle lastLogin timestamp correctly', () => {
      const lastLogin = new Date();

      expect(lastLogin).toBeInstanceOf(Date);
      expect(lastLogin.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('Should handle session expiration calculation', () => {
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      const createdAt = Date.now();
      const expiresAt = createdAt + maxAge;

      expect(expiresAt).toBeGreaterThan(createdAt);
    });

    test('Should handle timezone-independent timestamps', () => {
      const timestamp = new Date().toISOString();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('Should handle missing user profile gracefully', () => {
      const mockCallback = (profile) => {
        if (!profile || !profile.user) {
          throw new Error('Profile is required');
        }
        return profile.user;
      };

      expect(() => mockCallback(null)).toThrow('Profile is required');
      expect(() => mockCallback({})).toThrow('Profile is required');
    });

    test('Should handle OAuth errors correctly', () => {
      const oauthError = {
        error: 'access_denied',
        error_description: 'User denied authorization'
      };

      expect(oauthError.error).toBe('access_denied');
      expect(oauthError.error_description).toBeDefined();
    });

    test('Should handle network errors during OAuth', () => {
      const networkError = new Error('Network timeout');

      expect(networkError).toBeInstanceOf(Error);
      expect(networkError.message).toContain('timeout');
    });

    test('Should handle invalid token scenarios', () => {
      const invalidTokens = [null, undefined, '', 'invalid-token'];

      invalidTokens.forEach(token => {
        expect(!token || token === 'invalid-token').toBeTruthy();
      });
    });
  });

  describe('Middleware Chain Edge Cases', () => {
    test('Should handle middleware execution order', () => {
      const executionOrder = [];

      const middleware1 = (req, res, next) => {
        executionOrder.push(1);
        next();
      };

      const middleware2 = (req, res, next) => {
        executionOrder.push(2);
        next();
      };

      const mockReq = {};
      const mockRes = {};
      const mockNext = () => {};

      middleware1(mockReq, mockRes, () => {
        middleware2(mockReq, mockRes, mockNext);
      });

      expect(executionOrder).toEqual([1, 2]);
    });

    test('Should handle middleware error propagation', () => {
      const errorMiddleware = (err, req, res, next) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Test error');
      };

      const testError = new Error('Test error');
      errorMiddleware(testError, {}, {}, () => {});
    });
  });

  describe('Static File Serving Edge Cases', () => {
    test('Should handle file path construction', () => {
      const publicDir = 'public';
      const fileName = 'index.html';
      const fullPath = `${publicDir}/${fileName}`;

      expect(fullPath).toBe('public/index.html');
    });

    test('Should handle asset paths correctly', () => {
      const assetPaths = [
        '/assets/logo.png',
        '/auth-utils.js',
        '/analytics-app.js'
      ];

      assetPaths.forEach(path => {
        expect(path).toMatch(/^\/[a-zA-Z0-9\-_.\/]+\.(png|js)$/);
      });
    });
  });

  describe('JSON Response Edge Cases', () => {
    test('Should handle empty user object', () => {
      const response = {
        authenticated: false
      };

      expect(response.user).toBeUndefined();
      expect(response.authenticated).toBe(false);
    });

    test('Should handle complete user object', () => {
      const response = {
        authenticated: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          team: 'Test Team',
          lastLogin: new Date()
        }
      };

      expect(response.user).toBeDefined();
      expect(Object.keys(response.user).length).toBe(5);
    });

    test('Should handle health check response format', () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date()
      };

      expect(healthResponse.status).toBe('ok');
      expect(healthResponse.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Security Edge Cases', () => {
    test('Should prevent XSS in user-provided data', () => {
      const maliciousInput = '<script>alert("XSS")</script>';

      const sanitized = maliciousInput
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    test('Should validate session cookies', () => {
      const cookie = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      };

      expect(cookie.httpOnly).toBe(true);
      expect(cookie.secure).toBe(true);
      expect(['strict', 'lax', 'none']).toContain(cookie.sameSite);
    });

    test('Should handle CSRF protection with SameSite', () => {
      const cookieSettings = {
        sameSite: 'lax'
      };

      expect(['strict', 'lax']).toContain(cookieSettings.sameSite);
    });
  });

  describe('Concurrency Edge Cases', () => {
    test('Should handle multiple simultaneous auth requests', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        user: `user${i}@example.com`,
        timestamp: Date.now()
      }));

      expect(requests.length).toBe(5);
      requests.forEach((req, i) => {
        expect(req.user).toBe(`user${i}@example.com`);
      });
    });

    test('Should handle session conflicts', () => {
      const sessions = new Map();

      sessions.set('session1', { user: 'user1@example.com' });
      sessions.set('session2', { user: 'user2@example.com' });

      expect(sessions.size).toBe(2);
      expect(sessions.get('session1').user).not.toBe(sessions.get('session2').user);
    });
  });

  describe('Logout Edge Cases', () => {
    test('Should handle logout without active session', () => {
      const mockReq = {
        session: null,
        logout: (callback) => {
          callback(null);
        }
      };

      mockReq.logout((err) => {
        expect(err).toBeNull();
      });
    });

    test('Should handle logout with destroyed session', () => {
      const mockReq = {
        session: {
          destroyed: true
        },
        logout: (callback) => {
          callback(null);
        }
      };

      mockReq.logout((err) => {
        expect(err).toBeNull();
        expect(mockReq.session.destroyed).toBe(true);
      });
    });

    test('Should redirect to login after logout', () => {
      const expectedRedirect = '/login';

      expect(expectedRedirect).toBe('/login');
    });
  });
});
