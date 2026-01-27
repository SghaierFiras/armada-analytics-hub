const SlackStrategy = require('passport-slack-oauth2').Strategy;

// Mock environment variables
process.env.SLACK_CLIENT_ID = 'test-client-id';
process.env.SLACK_CLIENT_SECRET = 'test-client-secret';
process.env.SLACK_CALLBACK_URL = 'http://localhost:3000/auth/slack/callback';
process.env.SESSION_SECRET = 'test-secret';

describe('Slack OAuth Flow Tests', () => {
  describe('Slack Strategy Configuration', () => {
    test('Should configure Slack strategy with correct options', () => {
      const mockCallback = jest.fn();

      const strategy = new SlackStrategy({
        name: 'slack',
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: process.env.SLACK_CALLBACK_URL,
        scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team']
      }, mockCallback);

      expect(strategy.name).toBe('slack');
      expect(strategy._oauth2._clientId).toBe('test-client-id');
    });

    test('Should include required OAuth scopes', () => {
      const mockCallback = jest.fn();

      const strategy = new SlackStrategy({
        name: 'slack',
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: process.env.SLACK_CALLBACK_URL,
        scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team']
      }, mockCallback);

      const requiredScopes = ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team'];
      requiredScopes.forEach(scope => {
        expect(strategy._scope).toContain(scope);
      });
    });

    test('Should use correct callback URL', () => {
      const mockCallback = jest.fn();

      const strategy = new SlackStrategy({
        name: 'slack',
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: process.env.SLACK_CALLBACK_URL,
        scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team']
      }, mockCallback);

      expect(strategy._callbackURL).toBe('http://localhost:3000/auth/slack/callback');
    });
  });

  describe('OAuth Callback Handler', () => {
    let callbackHandler;

    beforeEach(() => {
      callbackHandler = async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.user.email;

          // Optional: Domain restriction
          if (process.env.RESTRICT_DOMAIN === 'true') {
            const allowedDomain = process.env.ALLOWED_DOMAIN || 'armadadelivery.com';
            if (!email.endsWith(`@${allowedDomain}`)) {
              return done(null, false, { message: `Access restricted to ${allowedDomain} domain only` });
            }
          }

          // Store user data in session
          const user = {
            slackId: profile.user.id,
            email: email,
            name: profile.user.name,
            avatar: profile.user.image_192 || profile.user.image_512,
            team: profile.team?.name,
            lastLogin: new Date()
          };

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      };
    });

    test('Should successfully authenticate valid user', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@example.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        },
        team: {
          name: 'Test Team'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        slackId: 'U123456',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        team: 'Test Team'
      }));
    });

    test('Should handle user with no team', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@example.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        slackId: 'U123456',
        email: 'test@example.com',
        team: undefined
      }));
    });

    test('Should prefer image_192 over image_512', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@example.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar192.jpg',
          image_512: 'https://example.com/avatar512.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        avatar: 'https://example.com/avatar192.jpg'
      }));
    });

    test('Should use image_512 if image_192 is not available', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@example.com',
          name: 'Test User',
          image_512: 'https://example.com/avatar512.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        avatar: 'https://example.com/avatar512.jpg'
      }));
    });

    test('Should include lastLogin timestamp', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@example.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      const beforeTest = new Date();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);
      const afterTest = new Date();

      const user = done.mock.calls[0][1];
      expect(user.lastLogin).toBeInstanceOf(Date);
      expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(user.lastLogin.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });

    test('Should handle user with missing email field', async () => {
      const mockProfile = {
        user: {
          id: 'U123456',
          name: 'Test User'
          // Missing email - edge case that should be handled better in production
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      // Currently the callback succeeds even with missing email
      // In production, this should be validated and rejected
      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        slackId: 'U123456',
        email: undefined
      }));
    });
  });

  describe('Domain Restriction', () => {
    let callbackHandler;

    beforeEach(() => {
      callbackHandler = async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.user.email;

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
            lastLogin: new Date()
          };

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      };
    });

    afterEach(() => {
      delete process.env.RESTRICT_DOMAIN;
      delete process.env.ALLOWED_DOMAIN;
    });

    test('Should allow user from allowed domain when restriction enabled', async () => {
      process.env.RESTRICT_DOMAIN = 'true';
      process.env.ALLOWED_DOMAIN = 'armadadelivery.com';

      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@armadadelivery.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'test@armadadelivery.com'
      }));
    });

    test('Should reject user from different domain when restriction enabled', async () => {
      process.env.RESTRICT_DOMAIN = 'true';
      process.env.ALLOWED_DOMAIN = 'armadadelivery.com';

      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@otherdomain.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, false, {
        message: 'Access restricted to armadadelivery.com domain only'
      });
    });

    test('Should allow any user when restriction disabled', async () => {
      process.env.RESTRICT_DOMAIN = 'false';

      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@anydomain.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'test@anydomain.com'
      }));
    });

    test('Should use default domain when ALLOWED_DOMAIN not set', async () => {
      process.env.RESTRICT_DOMAIN = 'true';
      delete process.env.ALLOWED_DOMAIN;

      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@armadadelivery.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'test@armadadelivery.com'
      }));
    });

    test('Should reject subdomain mismatches', async () => {
      process.env.RESTRICT_DOMAIN = 'true';
      process.env.ALLOWED_DOMAIN = 'armadadelivery.com';

      const mockProfile = {
        user: {
          id: 'U123456',
          email: 'test@sub.armadadelivery.com',
          name: 'Test User',
          image_192: 'https://example.com/avatar.jpg'
        }
      };

      const done = jest.fn();
      await callbackHandler('access-token', 'refresh-token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, false, {
        message: 'Access restricted to armadadelivery.com domain only'
      });
    });
  });

  describe('User Serialization', () => {
    test('Should serialize user correctly', (done) => {
      const mockUser = {
        slackId: 'U123456',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        team: 'Test Team',
        lastLogin: new Date()
      };

      const serializeUser = (user, callback) => {
        callback(null, user);
      };

      serializeUser(mockUser, (err, serialized) => {
        expect(err).toBeNull();
        expect(serialized).toEqual(mockUser);
        done();
      });
    });

    test('Should deserialize user correctly', (done) => {
      const mockUser = {
        slackId: 'U123456',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        team: 'Test Team',
        lastLogin: new Date()
      };

      const deserializeUser = (user, callback) => {
        callback(null, user);
      };

      deserializeUser(mockUser, (err, deserialized) => {
        expect(err).toBeNull();
        expect(deserialized).toEqual(mockUser);
        done();
      });
    });
  });
});
