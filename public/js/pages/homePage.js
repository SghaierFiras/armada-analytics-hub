/**
 * Home Page Module
 * Handles overview dashboard with high-level metrics
 */

import ChartFactory from '../components/charts/ChartFactory.js';
import StatCard from '../components/StatCard.js';
import apiService from '../services/apiService.js';
import appState from '../state/appState.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';
import { setHTML, showLoading, showError } from '../utils/domUtils.js';

/**
 * HomePage Class
 */
export class HomePage {
  constructor() {
    this.charts = {};
    this.containerId = 'homePage';
  }

  /**
   * Load page
   */
  async load() {
    console.log('[HomePage] Loading overview dashboard');

    appState.setLoading('home', true);
    appState.setError('home', null);

    this.destroyCharts();

    try {
      await this.loadData();
      this.renderStats();
      this.renderCharts();
      appState.setLoading('home', false);
    } catch (error) {
      console.error('[HomePage] Error loading page:', error);
      appState.setError('home', error.message);
      appState.setLoading('home', false);
      showError(this.containerId, 'Failed to load overview: ' + error.message);
    }
  }

  /**
   * Load data from multiple API endpoints
   */
  async loadData() {
    // Load data from all endpoints in parallel
    const [merchantData, orderData, performanceData] = await Promise.all([
      apiService.getMerchantAnalytics({ year: 'all' }).catch(err => {
        console.warn('Failed to load merchant data:', err);
        return null;
      }),
      apiService.getOrderAnalytics({ year: 'all' }).catch(err => {
        console.warn('Failed to load order data:', err);
        return null;
      }),
      apiService.getPerformanceMetrics({ year: 'all' }).catch(err => {
        console.warn('Failed to load performance data:', err);
        return null;
      })
    ]);

    // Store in state
    const homeData = {
      merchants: merchantData,
      orders: orderData,
      performance: performanceData
    };

    appState.setData('home', homeData);
    return homeData;
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const data = appState.getState('data.home');
    if (!data) return;

    const stats = [];

    // Merchant stats
    if (data.merchants) {
      stats.push({
        title: 'Total Merchants',
        value: data.merchants.totalMerchants || 0,
        subtitle: `${data.merchants.activeMerchants || 0} active`,
        format: 'number',
        icon: '🏪',
        color: 'primary'
      });

      stats.push({
        title: 'Multi-Branch',
        value: data.merchants.multiBranchCount || 0,
        subtitle: 'Merchants with multiple locations',
        format: 'number',
        icon: '🏢',
        color: 'info'
      });
    }

    // Order stats
    if (data.orders) {
      const growth = this.calculateGrowth(data.orders.annual);

      stats.push({
        title: 'Total Orders',
        value: data.orders.totalOrders || 0,
        format: 'number',
        icon: '📦',
        color: 'success',
        trend: growth,
        trendLabel: 'YoY'
      });

      stats.push({
        title: 'Latest Year',
        value: data.orders.latestYearOrders || 0,
        subtitle: 'Current year orders',
        format: 'number',
        icon: '📊',
        color: 'warning'
      });
    }

    // Performance stats
    if (data.performance) {
      const completionRate = parseFloat(data.performance.completionRates?.trips?.overall?.rate || 0);

      stats.push({
        title: 'Completion Rate',
        value: completionRate,
        format: 'percent',
        icon: '✅',
        color: completionRate >= 90 ? 'success' : 'warning'
      });

      stats.push({
        title: 'Performance Score',
        value: data.performance.performanceScore?.score || 0,
        subtitle: data.performance.performanceScore?.rating || 'N/A',
        format: 'number',
        icon: '⭐',
        color: 'primary'
      });
    }

    const statsHTML = StatCard.renderGrid(stats, 3);
    setHTML('#homeStats', statsHTML);
  }

  /**
   * Calculate YoY growth from annual data
   * @param {array} annual - Annual data
   * @returns {number} Growth percentage
   */
  calculateGrowth(annual) {
    if (!annual || annual.length < 2) return 0;

    const latest = annual[annual.length - 1].totalOrders;
    const previous = annual[annual.length - 2].totalOrders;

    if (previous === 0) return 0;

    return ((latest - previous) / previous) * 100;
  }

  /**
   * Render all charts
   */
  renderCharts() {
    const data = appState.getState('data.home');
    if (!data) return;

    this.renderOverviewChart(data);
    this.renderBusinessSizeChart(data);
    this.renderPerformanceTrendChart(data);
  }

  /**
   * Render overview chart (annual trends)
   */
  renderOverviewChart(data) {
    if (!data.orders?.annual || data.orders.annual.length === 0) return;

    const labels = data.orders.annual.map(d => d._id.toString());
    const orderData = data.orders.annual.map(d => d.totalOrders);

    this.charts.overview = ChartFactory.createGrowthChart(
      'homeOverviewChart',
      labels,
      orderData,
      'Annual Orders'
    );

    appState.storeChart('homeOverviewChart', this.charts.overview);
  }

  /**
   * Render business size distribution chart
   */
  renderBusinessSizeChart(data) {
    if (!data.merchants?.sizeDistribution) return;

    const sizes = data.merchants.sizeDistribution;
    const labels = Object.keys(sizes).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const counts = Object.values(sizes).map(s => s.count || s);

    const chartData = {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#2563eb', // Micro
          '#3b82f6', // Small
          '#10b981', // Medium
          '#f59e0b', // Large
          '#ef4444'  // Enterprise
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.charts.businessSize = ChartFactory.createDoughnutChart(
      'homeBusinessSizeChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Merchant Distribution by Size'
          }
        }
      }
    );

    appState.storeChart('homeBusinessSizeChart', this.charts.businessSize);
  }

  /**
   * Render performance trend chart
   */
  renderPerformanceTrendChart(data) {
    if (!data.performance?.completionRates?.trips?.byPeriod) return;

    const periods = data.performance.completionRates.trips.byPeriod;

    // Take last 12 months or quarters
    const recentPeriods = periods.slice(-12);
    const labels = recentPeriods.map((p, i) => `Period ${i + 1}`);
    const rates = recentPeriods.map(p => p.completionRate || 0);

    this.charts.performanceTrend = ChartFactory.createCompletionRateChart(
      'homePerformanceChart',
      labels,
      rates,
      'Completion Rate Trend'
    );

    appState.storeChart('homePerformanceChart', this.charts.performanceTrend);
  }

  /**
   * Destroy all charts
   */
  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      ChartFactory.destroy(chart);
    });
    this.charts = {};
  }

  /**
   * Get export data
   * @param {string} format - Export format
   * @returns {object} Export configuration
   */
  getExportData(format) {
    const data = appState.getState('data.home');

    if (!data) {
      throw new Error('No data available to export');
    }

    const sections = [];

    // Overview summary
    const summary = {};

    if (data.merchants) {
      summary['Total Merchants'] = formatNumber(data.merchants.totalMerchants || 0);
      summary['Active Merchants'] = formatNumber(data.merchants.activeMerchants || 0);
      summary['Multi-Branch Merchants'] = formatNumber(data.merchants.multiBranchCount || 0);
    }

    if (data.orders) {
      summary['Total Orders'] = formatNumber(data.orders.totalOrders || 0);
      summary['Latest Year Orders'] = formatNumber(data.orders.latestYearOrders || 0);
    }

    if (data.performance) {
      summary['Completion Rate'] = (data.performance.completionRates?.trips?.overall?.rate || 0) + '%';
      summary['Performance Score'] = (data.performance.performanceScore?.score || 0) + '/100';
    }

    sections.push({
      title: 'Overview Summary',
      type: 'summary',
      data: summary
    });

    // Annual trends
    if (data.orders?.annual) {
      const annualRows = data.orders.annual.map(d => [
        d._id,
        formatNumber(d.totalOrders)
      ]);

      sections.push({
        title: 'Annual Order Trends',
        type: 'table',
        headers: ['Year', 'Total Orders'],
        rows: annualRows
      });
    }

    return {
      title: 'Analytics Hub - Overview',
      filename: 'analytics-overview',
      data,
      filters: {},
      sections
    };
  }
}

export default HomePage;
