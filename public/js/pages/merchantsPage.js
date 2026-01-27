/**
 * Merchants Page Module
 * Handles merchant analytics dashboard
 */

import ChartFactory from '../components/charts/ChartFactory.js';
import StatCard from '../components/StatCard.js';
import apiService from '../services/apiService.js';
import appState from '../state/appState.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';
import { setHTML, showLoading, showError } from '../utils/domUtils.js';
import ExportService from '../utils/exportUtils.js';

/**
 * MerchantsPage Class
 */
export class MerchantsPage {
  constructor() {
    this.charts = {};
    this.containerId = 'merchantsPage';
  }

  /**
   * Load page with filters
   * @param {object} filters - Filter parameters
   */
  async load(filters = {}) {
    console.log('[MerchantsPage] Loading with filters:', filters);

    // Set loading state
    appState.setLoading('merchants', true);
    appState.setError('merchants', null);

    // Destroy existing charts
    this.destroyCharts();

    try {
      // Load data from API
      await this.loadData(filters);

      // Render page
      this.renderStats();
      this.renderCharts();

      appState.setLoading('merchants', false);
    } catch (error) {
      console.error('[MerchantsPage] Error loading page:', error);
      appState.setError('merchants', error.message);
      appState.setLoading('merchants', false);
      showError(this.containerId, 'Failed to load merchant analytics: ' + error.message);
    }
  }

  /**
   * Load data from API
   * @param {object} filters - Filter parameters
   */
  async loadData(filters) {
    const data = await apiService.getMerchantAnalytics(filters);
    appState.setData('merchants', data);
    return data;
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const data = appState.getState('data.merchants');
    if (!data) return;

    const statsHTML = StatCard.renderGrid([
      {
        title: 'Total Merchants',
        value: data.totalMerchants || 0,
        format: 'number',
        icon: '🏪',
        color: 'primary'
      },
      {
        title: 'Active Merchants',
        value: data.activeMerchants || 0,
        format: 'number',
        icon: '✅',
        color: 'success'
      },
      {
        title: 'Multi-Branch',
        value: data.multiBranchCount || 0,
        format: 'number',
        icon: '🏢',
        color: 'info'
      },
      {
        title: 'Avg Orders/Merchant',
        value: data.avgOrdersPerMerchant || 0,
        format: 'number',
        icon: '📊',
        color: 'warning'
      }
    ], 4);

    setHTML('#merchantStats', statsHTML);
  }

  /**
   * Render all charts
   */
  renderCharts() {
    const data = appState.getState('data.merchants');
    if (!data) return;

    // Render individual charts
    this.renderSizeDistributionChart(data);
    this.renderOrdersDistributionChart(data);
    this.renderMultiBranchChart(data);
    this.renderGeographicChart(data);
    this.renderGrowthCohortsChart(data);
  }

  /**
   * Render business size distribution chart
   */
  renderSizeDistributionChart(data) {
    if (!data.sizeDistribution) return;

    const sizes = data.sizeDistribution;
    const labels = Object.keys(sizes).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const counts = Object.values(sizes).map(s => s.count);

    const chartData = {
      labels,
      datasets: [{
        label: 'Merchant Count',
        data: counts,
        backgroundColor: [
          '#2563eb', // Micro - primary
          '#3b82f6', // Small - secondary
          '#10b981', // Medium - success
          '#f59e0b', // Large - warning
          '#ef4444'  // Enterprise - danger
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.charts.sizeDistribution = ChartFactory.createPieChart(
      'merchantSizeChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Business Size Distribution'
          }
        }
      }
    );

    // Store in state
    appState.storeChart('merchantSizeChart', this.charts.sizeDistribution);
  }

  /**
   * Render orders distribution by size chart
   */
  renderOrdersDistributionChart(data) {
    if (!data.sizeDistribution) return;

    const sizes = data.sizeDistribution;
    const labels = Object.keys(sizes).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const avgOrders = Object.values(sizes).map(s => s.avgOrders || 0);

    const chartData = {
      labels,
      datasets: [{
        label: 'Avg Orders',
        data: avgOrders,
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        borderWidth: 1
      }]
    };

    this.charts.ordersDistribution = ChartFactory.createBarChart(
      'merchantOrdersChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Average Orders by Business Size'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatNumber(value);
              }
            }
          }
        }
      }
    );

    appState.storeChart('merchantOrdersChart', this.charts.ordersDistribution);
  }

  /**
   * Render multi-branch merchants chart
   */
  renderMultiBranchChart(data) {
    if (!data.topMultiBranchMerchants || data.topMultiBranchMerchants.length === 0) return;

    const merchants = data.topMultiBranchMerchants.slice(0, 10);
    const labels = merchants.map(m => m.name);
    const branches = merchants.map(m => m.branches);

    const chartData = {
      labels,
      datasets: [{
        label: 'Number of Branches',
        data: branches,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      }]
    };

    this.charts.multiBranch = ChartFactory.createHorizontalBarChart(
      'merchantBranchChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Top Multi-Branch Merchants'
          }
        }
      }
    );

    appState.storeChart('merchantBranchChart', this.charts.multiBranch);
  }

  /**
   * Render geographic distribution chart
   */
  renderGeographicChart(data) {
    if (!data.geographicDistribution) return;

    const geoData = data.geographicDistribution;
    const labels = Object.keys(geoData).map(key =>
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    const merchantCounts = Object.values(geoData).map(g => g.merchants || 0);

    const chartData = {
      labels,
      datasets: [{
        label: 'Merchants',
        data: merchantCounts,
        backgroundColor: '#06b6d4',
        borderColor: '#0891b2',
        borderWidth: 1
      }]
    };

    this.charts.geographic = ChartFactory.createBarChart(
      'merchantGeoChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Geographic Distribution'
          }
        }
      }
    );

    appState.storeChart('merchantGeoChart', this.charts.geographic);
  }

  /**
   * Render growth cohorts chart
   */
  renderGrowthCohortsChart(data) {
    if (!data.growthCohorts) return;

    const cohorts = data.growthCohorts;
    const labels = Object.keys(cohorts).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    );
    const counts = Object.values(cohorts).map(c => c.count || 0);

    const chartData = {
      labels,
      datasets: [{
        label: 'Merchant Count',
        data: counts,
        backgroundColor: [
          '#10b981', // Explosive - success
          '#06b6d4', // High Growth - info
          '#2563eb', // Moderate - primary
          '#f59e0b', // Stable - warning
          '#ef4444', // Declining - danger
          '#8b5cf6', // New - purple
          '#6b7280'  // Churned - gray
        ],
        borderWidth: 1
      }]
    };

    this.charts.growthCohorts = ChartFactory.createBarChart(
      'merchantGrowthChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Growth Cohorts Analysis'
          }
        }
      }
    );

    appState.storeChart('merchantGrowthChart', this.charts.growthCohorts);
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
    const data = appState.getState('data.merchants');
    const filters = appState.getFilters('merchants');

    if (!data) {
      throw new Error('No data available to export');
    }

    const sections = [];

    // Summary section
    sections.push({
      title: 'Summary',
      type: 'summary',
      data: {
        'Total Merchants': data.totalMerchants || 0,
        'Active Merchants': data.activeMerchants || 0,
        'Multi-Branch Merchants': data.multiBranchCount || 0,
        'Average Orders per Merchant': formatNumber(data.avgOrdersPerMerchant || 0)
      }
    });

    // Business Size Distribution
    if (data.sizeDistribution) {
      const sizeRows = Object.entries(data.sizeDistribution).map(([size, info]) => [
        size.charAt(0).toUpperCase() + size.slice(1),
        info.count,
        formatNumber(info.avgOrders || 0),
        formatNumber(info.totalOrders || 0),
        formatPercent((info.percentage || 0) / 100)
      ]);

      sections.push({
        title: 'Business Size Distribution',
        type: 'table',
        headers: ['Size', 'Count', 'Avg Orders', 'Total Orders', 'Percentage'],
        rows: sizeRows
      });
    }

    // Multi-Branch Merchants
    if (data.topMultiBranchMerchants && data.topMultiBranchMerchants.length > 0) {
      const multiBranchRows = data.topMultiBranchMerchants.map(m => [
        m.name,
        m.branches,
        formatNumber(m.totalOrders || 0),
        formatNumber(m.avgOrdersPerBranch || 0)
      ]);

      sections.push({
        title: 'Top Multi-Branch Merchants',
        type: 'table',
        headers: ['Merchant', 'Branches', 'Total Orders', 'Avg per Branch'],
        rows: multiBranchRows
      });
    }

    // Growth Cohorts
    if (data.growthCohorts) {
      const cohortRows = Object.entries(data.growthCohorts).map(([cohort, info]) => [
        cohort.charAt(0).toUpperCase() + cohort.slice(1).replace(/([A-Z])/g, ' $1'),
        info.count,
        formatNumber(info.orders2024 || 0),
        formatNumber(info.orders2025 || 0),
        info.change !== null ? formatPercent(info.change / 100) : 'N/A'
      ]);

      sections.push({
        title: 'Growth Cohorts (2024 vs 2025)',
        type: 'table',
        headers: ['Cohort', 'Count', 'Orders 2024', 'Orders 2025', 'Change'],
        rows: cohortRows
      });
    }

    return {
      title: 'Merchant Analytics Report',
      filename: 'merchant-analytics',
      data,
      filters,
      sections
    };
  }
}

export default MerchantsPage;
