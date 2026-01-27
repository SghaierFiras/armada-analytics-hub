/**
 * API Service
 * Handles all API requests with caching, error handling, and retry logic
 */

/**
 * API Service Class
 */
export class ApiService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {object} options - Request options
   * @returns {Promise} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    const url = this.buildURL(endpoint, params);
    const cacheKey = url;

    // Check cache first (unless disabled)
    if (!options.noCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[API Cache Hit] ${endpoint}`);
        return cached.data;
      } else {
        // Remove stale cache
        this.cache.delete(cacheKey);
      }
    }

    // Make request with retry logic
    const data = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Cache successful response
    if (!options.noCache) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body
   * @param {object} options - Request options
   * @returns {Promise} Response data
   */
  async post(endpoint, body = {}, options = {}) {
    const url = this.buildURL(endpoint);

    return this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  /**
   * Fetch with retry logic
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {Promise} Response data
   */
  async fetchWithRetry(url, options) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Check for API-level errors
        if (data.success === false) {
          throw new Error(data.message || 'API request failed');
        }

        return data.data || data;
      } catch (error) {
        lastError = error;
        console.error(`[API] Attempt ${attempt}/${this.retryAttempts} failed:`, error.message);

        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }

        // Wait before retrying (unless it's the last attempt)
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Build full URL with query parameters
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {string} Full URL
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin + this.baseURL);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Delay helper for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match (clears all if not provided)
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ============= MERCHANT API METHODS =============

  /**
   * Get merchant analytics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Merchant analytics data
   */
  async getMerchantAnalytics(filters = {}) {
    return this.get('/merchants/analytics', filters);
  }

  /**
   * Get merchant growth cohorts
   * @param {object} filters - Filter parameters
   * @returns {Promise} Growth cohorts data
   */
  async getMerchantGrowthCohorts(filters = {}) {
    return this.get('/merchants/growth-cohorts', filters);
  }

  /**
   * Get merchant size breakdown
   * @param {object} filters - Filter parameters
   * @returns {Promise} Size breakdown data
   */
  async getMerchantSizeBreakdown(filters = {}) {
    return this.get('/merchants/size-breakdown', filters);
  }

  /**
   * Get merchant geographic distribution
   * @param {object} filters - Filter parameters
   * @returns {Promise} Geographic data
   */
  async getMerchantGeographic(filters = {}) {
    return this.get('/merchants/geographic', filters);
  }

  /**
   * Get top merchants
   * @param {object} filters - Filter parameters
   * @returns {Promise} Top merchants data
   */
  async getTopMerchants(filters = {}) {
    return this.get('/merchants/top', filters);
  }

  // ============= ORDER API METHODS =============

  /**
   * Get order analytics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Order analytics data
   */
  async getOrderAnalytics(filters = {}) {
    return this.get('/orders/analytics', filters);
  }

  /**
   * Get monthly order data
   * @param {object} filters - Filter parameters
   * @returns {Promise} Monthly order data
   */
  async getMonthlyOrders(filters = {}) {
    return this.get('/orders/monthly', filters);
  }

  /**
   * Get quarterly order data
   * @param {object} filters - Filter parameters
   * @returns {Promise} Quarterly order data
   */
  async getQuarterlyOrders(filters = {}) {
    return this.get('/orders/quarterly', filters);
  }

  /**
   * Get order trends
   * @param {object} filters - Filter parameters
   * @returns {Promise} Order trends data
   */
  async getOrderTrends(filters = {}) {
    return this.get('/orders/trends', filters);
  }

  /**
   * Get order comparison
   * @param {object} filters - Filter parameters
   * @returns {Promise} Order comparison data
   */
  async getOrderComparison(filters = {}) {
    return this.get('/orders/comparison', filters);
  }

  // ============= PERFORMANCE API METHODS =============

  /**
   * Get performance metrics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Performance metrics data
   */
  async getPerformanceMetrics(filters = {}) {
    return this.get('/performance/metrics', filters);
  }

  /**
   * Get completion rates
   * @param {object} filters - Filter parameters
   * @returns {Promise} Completion rates data
   */
  async getCompletionRates(filters = {}) {
    return this.get('/performance/completion-rates', filters);
  }

  /**
   * Get efficiency metrics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Efficiency metrics data
   */
  async getEfficiencyMetrics(filters = {}) {
    return this.get('/performance/efficiency', filters);
  }

  /**
   * Get growth metrics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Growth metrics data
   */
  async getGrowthMetrics(filters = {}) {
    return this.get('/performance/growth', filters);
  }

  /**
   * Get annual performance
   * @param {object} filters - Filter parameters
   * @returns {Promise} Annual performance data
   */
  async getAnnualPerformance(filters = {}) {
    return this.get('/performance/annual', filters);
  }

  /**
   * Get monthly performance
   * @param {object} filters - Filter parameters
   * @returns {Promise} Monthly performance data
   */
  async getMonthlyPerformance(filters = {}) {
    return this.get('/performance/monthly', filters);
  }

  // ============= GEOGRAPHIC API METHODS =============

  /**
   * Get geographic analysis
   * @param {object} filters - Filter parameters
   * @returns {Promise} Geographic analysis data
   */
  async getGeographicAnalysis(filters = {}) {
    return this.get('/geographic/analysis', filters);
  }

  /**
   * Get area statistics
   * @param {string} area - Area name
   * @param {object} filters - Filter parameters
   * @returns {Promise} Area statistics data
   */
  async getAreaStats(area, filters = {}) {
    return this.get(`/geographic/area/${area}`, filters);
  }

  /**
   * Get governorate statistics
   * @param {object} filters - Filter parameters
   * @returns {Promise} Governorate statistics data
   */
  async getGovernorateStats(filters = {}) {
    return this.get('/geographic/governorates', filters);
  }

  /**
   * Compare multiple areas
   * @param {array} areas - Array of area names
   * @param {object} filters - Filter parameters
   * @returns {Promise} Comparison data
   */
  async compareAreas(areas, filters = {}) {
    return this.post('/geographic/compare', { areas, ...filters });
  }

  // ============= HEALTH CHECK =============

  /**
   * Check API health
   * @returns {Promise} Health check data
   */
  async checkHealth() {
    return this.get('/health', {}, { noCache: true });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
