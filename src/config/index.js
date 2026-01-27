const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Centralized configuration management
 * Validates and exports all application configuration
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    name: process.env.DB_NAME || 'heroku_v801wdr2',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Slack OAuth Configuration
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    callbackURL: process.env.SLACK_CALLBACK_URL
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  },

  // Security Configuration
  security: {
    trustProxy: process.env.NODE_ENV === 'production',
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
    restrictDomain: process.env.RESTRICT_DOMAIN === 'true',
    allowedDomain: process.env.ALLOWED_DOMAIN || 'armadadelivery.com'
  },

  // Cache Configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
    ttlSeconds: 5 * 60  // 5 minutes in seconds (for apicache)
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    // Log files directory
    errorLog: 'logs/error.log',
    combinedLog: 'logs/combined.log'
  }
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      `Please check your .env file against .env.example`
    );
  }

  // Validate MongoDB URI format
  if (!config.database.uri.startsWith('mongodb')) {
    throw new Error('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
  }

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535`);
  }
}

// Validate configuration on module load
validateConfig();

module.exports = config;
