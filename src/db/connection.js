const { MongoClient } = require('mongodb');
const config = require('../config');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

/**
 * MongoDB Connection Singleton
 * Provides a single, reusable database connection with connection pooling
 * Eliminates the need for duplicated connection code across 16+ scripts
 */
class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   * Uses connection pooling for efficient resource usage
   */
  async connect() {
    if (this.isConnected && this.client) {
      logger.debug('Using existing MongoDB connection');
      return this.db;
    }

    try {
      logger.info('Connecting to MongoDB...', {
        database: config.database.name,
        poolSize: config.database.options.maxPoolSize
      });

      this.client = new MongoClient(config.database.uri, config.database.options);
      await this.client.connect();

      this.db = this.client.db(config.database.name);
      this.isConnected = true;

      logger.info('Successfully connected to MongoDB', {
        database: config.database.name
      });

      // Handle connection events
      this.client.on('connectionPoolCreated', () => {
        logger.debug('MongoDB connection pool created');
      });

      this.client.on('connectionPoolClosed', () => {
        logger.debug('MongoDB connection pool closed');
      });

      this.client.on('error', (error) => {
        logger.errorWithContext(error, { context: 'MongoDB connection error' });
        this.isConnected = false;
      });

      return this.db;
    } catch (error) {
      this.isConnected = false;
      logger.errorWithContext(error, {
        context: 'Failed to connect to MongoDB',
        uri: config.database.uri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@') // Hide credentials in logs
      });
      throw new DatabaseError(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  /**
   * Get database instance
   * Ensures connection exists before returning
   */
  async getDb() {
    if (!this.isConnected || !this.db) {
      await this.connect();
    }
    return this.db;
  }

  /**
   * Get a specific collection
   * @param {string} collectionName - Name of the collection
   * @returns {Collection} MongoDB collection
   */
  async getCollection(collectionName) {
    const db = await this.getDb();
    return db.collection(collectionName);
  }

  /**
   * Close database connection
   * Should be called when application shuts down
   */
  async close() {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.db = null;
        this.client = null;
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.errorWithContext(error, { context: 'Error closing MongoDB connection' });
        throw new DatabaseError(`Failed to close MongoDB connection: ${error.message}`);
      }
    }
  }

  /**
   * Check if connection is healthy
   * @returns {Promise<boolean>}
   */
  async ping() {
    try {
      if (!this.isConnected || !this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.errorWithContext(error, { context: 'MongoDB ping failed' });
      return false;
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection stats
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      database: config.database.name,
      hasClient: !!this.client,
      hasDb: !!this.db
    };
  }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing MongoDB connection');
  await dbConnection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing MongoDB connection');
  await dbConnection.close();
  process.exit(0);
});

module.exports = dbConnection;
