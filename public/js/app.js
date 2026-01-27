/**
 * Analytics Application - Main Orchestrator
 * Reduced from 2,513 lines to ~200 lines
 * Delegates to modular page components
 */

import HomePage from './pages/homePage.js';
import MerchantsPage from './pages/merchantsPage.js';
import OrdersPage from './pages/ordersPage.js';
import PerformancePage from './pages/performancePage.js';
import ExportButton from './components/ExportButton.js';
import FilterPanel from './components/FilterPanel.js';
import appState from './state/appState.js';
import { show, hide, addClass, removeClass } from './utils/domUtils.js';

/**
 * AnalyticsApp Class
 * Main application orchestrator
 */
class AnalyticsApp {
  constructor() {
    // Initialize page modules
    this.pages = {
      home: new HomePage(),
      merchants: new MerchantsPage(),
      orders: new OrdersPage(),
      performance: new PerformancePage()
    };

    this.currentPage = 'home';
  }

  /**
   * Initialize application
   */
  async init() {
    console.log('[App] Initializing Analytics Hub...');

    // Setup navigation
    this.setupNavigation();

    // Setup filter panels
    this.setupFilters();

    // Setup export button
    this.setupExport();

    // Subscribe to state changes
    this.subscribeToState();

    // Load initial page
    await this.navigateTo('home');

    console.log('[App] Initialization complete');
  }

  /**
   * Setup navigation handlers
   */
  setupNavigation() {
    // Navigation links
    const navLinks = document.querySelectorAll('[data-page]');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.getAttribute('data-page');
        this.navigateTo(pageName);
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.navigateTo(e.state.page, false);
      }
    });
  }

  /**
   * Navigate to page
   * @param {string} pageName - Page name
   * @param {boolean} pushState - Whether to push history state
   */
  async navigateTo(pageName, pushState = true) {
    console.log(`[App] Navigating to: ${pageName}`);

    // Validate page exists
    if (!this.pages[pageName]) {
      console.error(`[App] Page not found: ${pageName}`);
      return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      hide(page);
    });

    // Show target page
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
      show(pageElement);
    }

    // Update navigation active state
    document.querySelectorAll('[data-page]').forEach(link => {
      removeClass(link, 'active');
      if (link.getAttribute('data-page') === pageName) {
        addClass(link, 'active');
      }
    });

    // Update state
    this.currentPage = pageName;
    appState.setState('currentPage', pageName);

    // Push history state
    if (pushState) {
      history.pushState({ page: pageName }, '', `#${pageName}`);
    }

    // Load page data
    const filters = appState.getFilters(pageName);
    await this.loadPage(pageName, filters);
  }

  /**
   * Load page with filters
   * @param {string} pageName - Page name
   * @param {object} filters - Filter parameters
   */
  async loadPage(pageName, filters = {}) {
    const page = this.pages[pageName];

    if (!page) {
      console.error(`[App] Page not found: ${pageName}`);
      return;
    }

    try {
      await page.load(filters);
    } catch (error) {
      console.error(`[App] Error loading page ${pageName}:`, error);
    }
  }

  /**
   * Setup filter panels for each page
   */
  setupFilters() {
    // Merchants filters
    this.setupMerchantsFilters();

    // Orders filters
    this.setupOrdersFilters();

    // Performance filters
    this.setupPerformanceFilters();
  }

  /**
   * Setup merchants page filters
   */
  setupMerchantsFilters() {
    const filterConfig = {
      id: 'merchantsFilters',
      filters: [
        {
          type: 'select',
          id: 'merchantYear',
          label: 'Year',
          options: [
            { value: 'all', label: 'All Years' },
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' }
          ],
          value: 'all'
        },
        {
          type: 'select',
          id: 'merchantSize',
          label: 'Business Size',
          options: [
            { value: 'all', label: 'All Sizes' },
            { value: 'micro', label: 'Micro' },
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
            { value: 'enterprise', label: 'Enterprise' }
          ],
          value: 'all'
        },
        {
          type: 'select',
          id: 'merchantArea',
          label: 'Area',
          options: [
            { value: 'all', label: 'All Areas' }
          ],
          value: 'all'
        }
      ]
    };

    // Render and initialize
    const container = document.getElementById('merchantsFilters');
    if (container) {
      container.innerHTML = FilterPanel.render(filterConfig);
      FilterPanel.init('merchantsFilters', (filterId, value) => {
        this.handleFilterChange('merchants', filterId, value);
      });
    }
  }

  /**
   * Setup orders page filters
   */
  setupOrdersFilters() {
    const filterConfig = {
      id: 'ordersFilters',
      filters: [
        {
          type: 'select',
          id: 'orderYear',
          label: 'Year',
          options: [
            { value: 'all', label: 'All Years' },
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' }
          ],
          value: 'all'
        },
        {
          type: 'select',
          id: 'orderQuarter',
          label: 'Quarter',
          options: [
            { value: 'all', label: 'All Quarters' },
            { value: 'Q1', label: 'Q1' },
            { value: 'Q2', label: 'Q2' },
            { value: 'Q3', label: 'Q3' },
            { value: 'Q4', label: 'Q4' }
          ],
          value: 'all'
        },
        {
          type: 'select',
          id: 'orderStatus',
          label: 'Status',
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'completed', label: 'Completed' },
            { value: 'canceled', label: 'Canceled' }
          ],
          value: 'all'
        }
      ]
    };

    const container = document.getElementById('ordersFilters');
    if (container) {
      container.innerHTML = FilterPanel.render(filterConfig);
      FilterPanel.init('ordersFilters', (filterId, value) => {
        this.handleFilterChange('orders', filterId, value);
      });
    }
  }

  /**
   * Setup performance page filters
   */
  setupPerformanceFilters() {
    const filterConfig = {
      id: 'performanceFilters',
      filters: [
        {
          type: 'select',
          id: 'performanceYear',
          label: 'Year',
          options: [
            { value: 'all', label: 'All Years' },
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' }
          ],
          value: 'all'
        },
        {
          type: 'select',
          id: 'performanceQuarter',
          label: 'Quarter',
          options: [
            { value: 'all', label: 'All Quarters' },
            { value: 'Q1', label: 'Q1' },
            { value: 'Q2', label: 'Q2' },
            { value: 'Q3', label: 'Q3' },
            { value: 'Q4', label: 'Q4' }
          ],
          value: 'all'
        }
      ]
    };

    const container = document.getElementById('performanceFilters');
    if (container) {
      container.innerHTML = FilterPanel.render(filterConfig);
      FilterPanel.init('performanceFilters', (filterId, value) => {
        this.handleFilterChange('performance', filterId, value);
      });
    }
  }

  /**
   * Handle filter change
   * @param {string} pageName - Page name
   * @param {string} filterId - Filter ID
   * @param {any} value - Filter value
   */
  handleFilterChange(pageName, filterId, value) {
    console.log(`[App] Filter change: ${pageName}.${filterId} = ${value}`);

    if (filterId === 'reset') {
      // Reset all filters for this page
      appState.resetFilters(pageName);
    } else {
      // Update specific filter
      // Map filter IDs to filter keys
      const filterKey = filterId.replace(pageName.replace(/s$/, ''), '').toLowerCase();
      appState.setFilter(pageName, filterKey, value);
    }

    // Reload page with new filters
    const filters = appState.getFilters(pageName);
    this.loadPage(pageName, filters);
  }

  /**
   * Setup export button
   */
  setupExport() {
    const exportContainer = document.getElementById('exportContainer');
    if (!exportContainer) return;

    // Render export button
    exportContainer.innerHTML = ExportButton.render({
      id: 'exportBtn',
      formats: ['csv', 'xlsx', 'pdf', 'json']
    });

    // Initialize with handler
    ExportButton.init('exportBtn', (format) => {
      this.handleExport(format);
    });
  }

  /**
   * Handle export
   * @param {string} format - Export format
   */
  handleExport(format) {
    const page = this.pages[this.currentPage];

    if (!page || !page.getExportData) {
      console.error('[App] Current page does not support export');
      ExportButton.showNotification('Export not available for this page', 'error');
      return;
    }

    try {
      const exportConfig = page.getExportData(format);
      const ExportService = require('./utils/exportUtils.js').default;

      ExportService.export({
        ...exportConfig,
        format
      });

      ExportButton.showNotification('Export successful', 'success');
    } catch (error) {
      console.error('[App] Export failed:', error);
      ExportButton.showNotification('Export failed: ' + error.message, 'error');
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    // Subscribe to page changes
    appState.subscribe('currentPage', (newPage, oldPage) => {
      console.log(`[App] Page changed: ${oldPage} → ${newPage}`);
    });

    // Subscribe to filter changes
    appState.subscribe('filters.*', () => {
      console.log('[App] Filters updated');
    });

    // Subscribe to loading state
    appState.subscribeMultiple(
      ['loading.merchants', 'loading.orders', 'loading.performance'],
      (key, isLoading) => {
        const pageName = key.split('.')[1];
        console.log(`[App] ${pageName} loading: ${isLoading}`);
      }
    );
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOM loaded, initializing app...');
  const app = new AnalyticsApp();
  app.init();

  // Expose to window for debugging
  window.analyticsApp = app;
  window.appState = appState;

  // Expose navigateTo globally for onclick handlers in HTML
  window.navigateTo = (pageName) => app.navigateTo(pageName);
});

export default AnalyticsApp;
