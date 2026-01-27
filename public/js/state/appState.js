/**
 * Application State Management
 * Centralized state with pub-sub pattern for reactive updates
 */

/**
 * AppState Class
 * Manages global application state and notifies subscribers of changes
 */
export class AppState {
  constructor() {
    this.state = {
      // Current page
      currentPage: 'home',

      // Filters for each page
      filters: {
        merchants: {
          year: 'all',
          size: 'all',
          area: 'all'
        },
        orders: {
          year: 'all',
          quarter: 'all',
          status: 'all'
        },
        performance: {
          year: 'all',
          quarter: 'all',
          month: 'all'
        }
      },

      // Data for each page (cached from API)
      data: {
        merchants: null,
        orders: null,
        performance: null,
        geographic: null
      },

      // Chart instances
      charts: {},

      // Loading states
      loading: {
        merchants: false,
        orders: false,
        performance: false,
        geographic: false
      },

      // Error states
      errors: {
        merchants: null,
        orders: null,
        performance: null,
        geographic: null
      },

      // User info (from authentication)
      user: null,

      // UI states
      ui: {
        sidebarOpen: true,
        exportMenuOpen: false,
        currentTheme: 'light'
      }
    };

    // Subscribers: Map of state key to array of callback functions
    this.listeners = new Map();
  }

  /**
   * Get state value
   * @param {string} key - State key (supports nested keys with dot notation)
   * @returns {any} State value
   *
   * @example
   * getState('currentPage') // 'home'
   * getState('filters.merchants.year') // 'all'
   */
  getState(key) {
    return this.getNestedValue(this.state, key);
  }

  /**
   * Set state value and notify subscribers
   * @param {string} key - State key (supports nested keys with dot notation)
   * @param {any} value - New value
   *
   * @example
   * setState('currentPage', 'merchants')
   * setState('filters.merchants.year', '2025')
   */
  setState(key, value) {
    const oldValue = this.getState(key);

    // Set the value
    this.setNestedValue(this.state, key, value);

    // Notify subscribers
    this.notify(key, value, oldValue);
  }

  /**
   * Update multiple state values at once
   * @param {object} updates - Object with key-value pairs to update
   *
   * @example
   * updateState({
   *   currentPage: 'merchants',
   *   'filters.merchants.year': '2025'
   * })
   */
  updateState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.setState(key, value);
    });
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function (newValue, oldValue)
   * @returns {Function} Unsubscribe function
   *
   * @example
   * const unsubscribe = subscribe('currentPage', (newPage, oldPage) => {
   *   console.log(`Page changed from ${oldPage} to ${newPage}`);
   * });
   * // Later: unsubscribe();
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    this.listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to multiple state keys
   * @param {array} keys - Array of state keys
   * @param {Function} callback - Callback function (key, newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribeMultiple(keys, callback) {
    const unsubscribers = keys.map(key => {
      return this.subscribe(key, (newValue, oldValue) => {
        callback(key, newValue, oldValue);
      });
    });

    // Return function that unsubscribes from all
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Notify subscribers of state change
   * @param {string} key - State key that changed
   * @param {any} newValue - New value
   * @param {any} oldValue - Old value
   */
  notify(key, newValue, oldValue) {
    // Notify exact key subscribers
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        callback(newValue, oldValue);
      });
    }

    // Notify wildcard subscribers (e.g., 'filters.*')
    const keyParts = key.split('.');
    for (let i = 0; i < keyParts.length; i++) {
      const wildcardKey = keyParts.slice(0, i + 1).join('.') + '.*';
      if (this.listeners.has(wildcardKey)) {
        this.listeners.get(wildcardKey).forEach(callback => {
          callback(newValue, oldValue);
        });
      }
    }
  }

  /**
   * Reset state to initial values
   * @param {string} key - Optional key to reset (resets all if not provided)
   */
  reset(key = null) {
    if (key) {
      const initialValue = this.getInitialValue(key);
      this.setState(key, initialValue);
    } else {
      // Reset entire state
      const oldState = { ...this.state };
      this.state = this.getInitialState();

      // Notify all subscribers
      Object.keys(oldState).forEach(key => {
        this.notify(key, this.state[key], oldState[key]);
      });
    }
  }

  /**
   * Get initial state
   * @returns {object} Initial state object
   */
  getInitialState() {
    return {
      currentPage: 'home',
      filters: {
        merchants: { year: 'all', size: 'all', area: 'all' },
        orders: { year: 'all', quarter: 'all', status: 'all' },
        performance: { year: 'all', quarter: 'all', month: 'all' }
      },
      data: {
        merchants: null,
        orders: null,
        performance: null,
        geographic: null
      },
      charts: {},
      loading: {
        merchants: false,
        orders: false,
        performance: false,
        geographic: false
      },
      errors: {
        merchants: null,
        orders: null,
        performance: null,
        geographic: null
      },
      user: null,
      ui: {
        sidebarOpen: true,
        exportMenuOpen: false,
        currentTheme: 'light'
      }
    };
  }

  /**
   * Get initial value for a specific key
   * @param {string} key - State key
   * @returns {any} Initial value
   */
  getInitialValue(key) {
    const initialState = this.getInitialState();
    return this.getNestedValue(initialState, key);
  }

  // ============= HELPER METHODS =============

  /**
   * Get nested value from object using dot notation
   * @param {object} obj - Object to traverse
   * @param {string} key - Dot notation key (e.g., 'filters.merchants.year')
   * @returns {any} Value
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) => {
      return current ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   * @param {object} obj - Object to modify
   * @param {string} key - Dot notation key
   * @param {any} value - Value to set
   */
  setNestedValue(obj, key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, prop) => {
      if (!current[prop]) {
        current[prop] = {};
      }
      return current[prop];
    }, obj);
    target[lastKey] = value;
  }

  // ============= CONVENIENCE METHODS =============

  /**
   * Set loading state
   * @param {string} page - Page name
   * @param {boolean} isLoading - Loading state
   */
  setLoading(page, isLoading) {
    this.setState(`loading.${page}`, isLoading);
  }

  /**
   * Set error state
   * @param {string} page - Page name
   * @param {string|null} error - Error message
   */
  setError(page, error) {
    this.setState(`errors.${page}`, error);
  }

  /**
   * Set page data
   * @param {string} page - Page name
   * @param {any} data - Page data
   */
  setData(page, data) {
    this.setState(`data.${page}`, data);
  }

  /**
   * Get page filters
   * @param {string} page - Page name
   * @returns {object} Filters
   */
  getFilters(page) {
    return this.getState(`filters.${page}`) || {};
  }

  /**
   * Set page filter
   * @param {string} page - Page name
   * @param {string} filterKey - Filter key
   * @param {any} value - Filter value
   */
  setFilter(page, filterKey, value) {
    this.setState(`filters.${page}.${filterKey}`, value);
  }

  /**
   * Reset page filters
   * @param {string} page - Page name
   */
  resetFilters(page) {
    this.reset(`filters.${page}`);
  }

  /**
   * Store chart instance
   * @param {string} chartId - Chart identifier
   * @param {object} chart - Chart.js instance
   */
  storeChart(chartId, chart) {
    this.setState(`charts.${chartId}`, chart);
  }

  /**
   * Get chart instance
   * @param {string} chartId - Chart identifier
   * @returns {object} Chart.js instance
   */
  getChart(chartId) {
    return this.getState(`charts.${chartId}`);
  }

  /**
   * Destroy chart instance
   * @param {string} chartId - Chart identifier
   */
  destroyChart(chartId) {
    const chart = this.getChart(chartId);
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
    this.setState(`charts.${chartId}`, null);
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    const charts = this.getState('charts');
    Object.keys(charts).forEach(chartId => {
      this.destroyChart(chartId);
    });
  }

  /**
   * Debug: Log current state
   */
  debug() {
    console.log('[AppState] Current State:', JSON.parse(JSON.stringify(this.state)));
    console.log('[AppState] Listeners:', this.listeners);
  }
}

// Create and export singleton instance
const appState = new AppState();
export default appState;
