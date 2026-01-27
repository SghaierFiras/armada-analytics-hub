const apicache = require('apicache');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Cache Middleware
 * Response caching for improved performance
 * Uses apicache with memory storage
 */

// Initialize cache
const cache = apicache.middleware;

/**
 * Cache configuration options
 */
const cacheOptions = {
  // Only cache successful GET requests
  statusCodes: {
    include: [200]
  },

  // Custom cache key generator
  // Include query parameters in cache key
  appendKey: (req, res) => {
    return req.originalUrl || req.url;
  },

  // Log cache hits and misses
  debug: config.env !== 'production',

  // Track performance
  trackPerformance: true,

  // Headers to exclude from caching
  excludeHeaders: [
    'set-cookie',
    'x-csrf-token'
  ]
};

/**
 * Standard cache middleware for analytics endpoints
 * Caches for 5 minutes (configurable in config)
 */
const analyticsCache = cache(
  `${config.cache.ttlSeconds} seconds`,
  (req, res) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return false;
    }

    // Only cache successful responses
    if (res.statusCode !== 200) {
      return false;
    }

    // Don't cache if user is authenticated (personalized data)
    if (req.user) {
      return false;
    }

    return true;
  },
  cacheOptions
);

/**
 * Short-term cache (1 minute)
 * For frequently changing data
 */
const shortCache = cache(
  '1 minute',
  (req, res) => {
    return req.method === 'GET' && res.statusCode === 200;
  },
  cacheOptions
);

/**
 * Long-term cache (15 minutes)
 * For relatively static data
 */
const longCache = cache(
  '15 minutes',
  (req, res) => {
    return req.method === 'GET' && res.statusCode === 200;
  },
  cacheOptions
);

/**
 * Custom cache duration middleware
 * @param {number} minutes - Cache duration in minutes
 */
const customCache = (minutes) => {
  return cache(
    `${minutes} minutes`,
    (req, res) => {
      return req.method === 'GET' && res.statusCode === 200;
    },
    cacheOptions
  );
};

/**
 * Clear cache for specific route or all routes
 * @param {string} target - Route to clear, or 'all' for everything
 */
const clearCache = (target = null) => {
  if (target === null || target === 'all') {
    apicache.clear();
    logger.info('Cache cleared: all routes');
  } else {
    apicache.clear(target);
    logger.info('Cache cleared', { target });
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache performance stats
 */
const getCacheStats = () => {
  const performance = apicache.getPerformance();
  const index = apicache.getIndex();

  return {
    performance,
    index,
    summary: {
      totalEntries: Object.keys(index).length,
      totalHits: performance.hits || 0,
      totalMisses: performance.misses || 0,
      hitRate: performance.hits && performance.misses
        ? ((performance.hits / (performance.hits + performance.misses)) * 100).toFixed(2) + '%'
        : 'N/A'
    }
  };
};

/**
 * Middleware to add cache headers
 * Informs clients about cache status
 */
const cacheHeaders = (req, res, next) => {
  const isCached = req.apicacheGroup;

  if (isCached) {
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Group', req.apicacheGroup);
  } else {
    res.set('X-Cache', 'MISS');
  }

  next();
};

/**
 * Middleware to prevent caching
 * Use for sensitive or personalized data
 */
const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

/**
 * Cache warming function
 * Pre-populate cache with common queries
 */
const warmCache = async (app) => {
  logger.info('Starting cache warming...');

  try {
    // Common endpoints to warm
    const endpoints = [
      '/api/merchants/analytics?year=2025',
      '/api/orders/analytics?year=2025',
      '/api/performance/annual'
    ];

    // Simulate requests to populate cache
    for (const endpoint of endpoints) {
      try {
        // Note: This would need actual implementation with request simulation
        logger.debug('Cache warming endpoint', { endpoint });
      } catch (error) {
        logger.warn('Failed to warm cache for endpoint', { endpoint, error: error.message });
      }
    }

    logger.info('Cache warming completed');
  } catch (error) {
    logger.error('Cache warming failed', { error: error.message });
  }
};

/**
 * Scheduled cache clearing
 * Clear cache at regular intervals
 */
const scheduleCacheClear = (intervalMinutes = 60) => {
  setInterval(() => {
    logger.info('Scheduled cache clear running');
    clearCache();
  }, intervalMinutes * 60 * 1000);

  logger.info('Scheduled cache clearing enabled', {
    interval: `${intervalMinutes} minutes`
  });
};

/**
 * Cache monitoring middleware
 * Logs cache performance metrics periodically
 */
const monitorCache = () => {
  setInterval(() => {
    const stats = getCacheStats();
    logger.info('Cache statistics', stats.summary);
  }, 5 * 60 * 1000); // Every 5 minutes
};

module.exports = {
  analyticsCache,
  shortCache,
  longCache,
  customCache,
  clearCache,
  getCacheStats,
  cacheHeaders,
  noCache,
  warmCache,
  scheduleCacheClear,
  monitorCache
};
