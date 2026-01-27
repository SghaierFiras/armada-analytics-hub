/**
 * Performance Page Module
 * Handles performance metrics dashboard
 */

import ChartFactory from '../components/charts/ChartFactory.js';
import StatCard from '../components/StatCard.js';
import apiService from '../services/apiService.js';
import appState from '../state/appState.js';
import { formatNumber, formatPercent, formatMonth } from '../utils/formatters.js';
import { setHTML, showLoading, showError } from '../utils/domUtils.js';
import ExportService from '../utils/exportUtils.js';

/**
 * PerformancePage Class
 */
export class PerformancePage {
  constructor() {
    this.charts = {};
    this.containerId = 'performancePage';
  }

  /**
   * Load page with filters
   * @param {object} filters - Filter parameters
   */
  async load(filters = {}) {
    console.log('[PerformancePage] Loading with filters:', filters);

    appState.setLoading('performance', true);
    appState.setError('performance', null);

    this.destroyCharts();

    try {
      await this.loadData(filters);
      this.renderStats();
      this.renderCharts();
      appState.setLoading('performance', false);
    } catch (error) {
      console.error('[PerformancePage] Error loading page:', error);
      appState.setError('performance', error.message);
      appState.setLoading('performance', false);
      showError(this.containerId, 'Failed to load performance metrics: ' + error.message);
    }
  }

  /**
   * Load data from API
   * @param {object} filters - Filter parameters
   */
  async loadData(filters) {
    const data = await apiService.getPerformanceMetrics(filters);
    appState.setData('performance', data);
    return data;
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const data = appState.getState('data.performance');
    if (!data) return;

    // Extract key metrics
    const completionRate = data.completionRates?.trips?.overall?.rate || '0';
    const ordersPerTrip = data.efficiencyMetrics?.ordersPerTrip?.avg || '0';
    const cancellationRate = data.efficiencyMetrics?.cancellationRate?.rate || '0';
    const performanceScore = data.performanceScore?.score || 0;

    const statsHTML = StatCard.renderGrid([
      {
        title: 'Trip Completion Rate',
        value: parseFloat(completionRate),
        format: 'percent',
        icon: '✅',
        color: parseFloat(completionRate) >= 90 ? 'success' : 'warning'
      },
      {
        title: 'Orders per Trip',
        value: ordersPerTrip,
        subtitle: 'Efficiency Metric',
        icon: '📦',
        color: 'info'
      },
      {
        title: 'Cancellation Rate',
        value: parseFloat(cancellationRate),
        format: 'percent',
        icon: '❌',
        color: parseFloat(cancellationRate) < 10 ? 'success' : 'danger'
      },
      {
        title: 'Performance Score',
        value: performanceScore,
        subtitle: data.performanceScore?.rating || 'N/A',
        icon: '⭐',
        color: performanceScore >= 80 ? 'success' : performanceScore >= 60 ? 'warning' : 'danger'
      }
    ], 4);

    setHTML('#performanceStats', statsHTML);
  }

  /**
   * Render all charts
   */
  renderCharts() {
    const data = appState.getState('data.performance');
    if (!data) return;

    this.renderCompletionRateChart(data);
    this.renderMonthlyPerformanceChart(data);
    this.renderEfficiencyChart(data);
    this.renderPerformanceScoreChart(data);
  }

  /**
   * Render completion rate trend chart
   */
  renderCompletionRateChart(data) {
    if (!data.completionRates?.trips?.byPeriod) return;

    const periods = data.completionRates.trips.byPeriod;
    const labels = periods.map(p => {
      if (p.period?.month) return formatMonth(p.period.month);
      if (p.period?.quarter) return `Q${p.period.quarter}`;
      return p._id?.month ? formatMonth(p._id.month) : 'N/A';
    });
    const rates = periods.map(p => p.completionRate || 0);

    this.charts.completionRate = ChartFactory.createCompletionRateChart(
      'performanceCompletionChart',
      labels,
      rates,
      'Trip Completion Rate'
    );

    appState.storeChart('performanceCompletionChart', this.charts.completionRate);
  }

  /**
   * Render monthly performance chart
   */
  renderMonthlyPerformanceChart(data) {
    if (!data.completionRates?.trips?.byPeriod) return;

    const periods = data.completionRates.trips.byPeriod;
    const labels = periods.map(p => {
      if (p.period?.month) return formatMonth(p.period.month);
      if (p._id?.month) return formatMonth(p._id.month);
      return 'N/A';
    });
    const totalTrips = periods.map(p => p.totalTrips || 0);
    const completed = periods.map(p => p.completed || 0);
    const canceled = periods.map(p => p.canceled || 0);

    const datasets = [
      {
        label: 'Total Trips',
        data: totalTrips,
        borderColor: '#2563eb',
        backgroundColor: '#2563eb20'
      },
      {
        label: 'Completed',
        data: completed,
        borderColor: '#10b981',
        backgroundColor: '#10b98120'
      },
      {
        label: 'Canceled',
        data: canceled,
        borderColor: '#ef4444',
        backgroundColor: '#ef444420'
      }
    ];

    this.charts.monthlyPerformance = ChartFactory.createMultiLineChart(
      'performanceMonthlyChart',
      labels,
      datasets,
      {
        plugins: {
          title: {
            display: true,
            text: 'Monthly Trip Performance'
          }
        }
      }
    );

    appState.storeChart('performanceMonthlyChart', this.charts.monthlyPerformance);
  }

  /**
   * Render efficiency metrics chart
   */
  renderEfficiencyChart(data) {
    if (!data.efficiencyMetrics) return;

    const metrics = data.efficiencyMetrics;
    const ordersPerTrip = parseFloat(metrics.ordersPerTrip?.avg || 0);
    const cancellationRate = parseFloat(metrics.cancellationRate?.rate || 0);
    const consistencyScore = metrics.consistencyScore || 0;

    const chartData = {
      labels: ['Orders/Trip', 'Cancel Rate (%)', 'Consistency'],
      datasets: [{
        label: 'Efficiency Metrics',
        data: [ordersPerTrip, cancellationRate, consistencyScore],
        backgroundColor: ['#2563eb', '#ef4444', '#10b981'],
        borderWidth: 1
      }]
    };

    this.charts.efficiency = ChartFactory.createBarChart(
      'performanceEfficiencyChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Efficiency Metrics Overview'
          }
        }
      }
    );

    appState.storeChart('performanceEfficiencyChart', this.charts.efficiency);
  }

  /**
   * Render performance score breakdown chart
   */
  renderPerformanceScoreChart(data) {
    if (!data.performanceScore?.breakdown) return;

    const breakdown = data.performanceScore.breakdown;
    const labels = Object.keys(breakdown).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const scores = Object.values(breakdown);

    const chartData = {
      labels,
      datasets: [{
        label: 'Score',
        data: scores,
        backgroundColor: scores.map(score => {
          if (score >= 80) return '#10b981'; // Success
          if (score >= 60) return '#f59e0b'; // Warning
          return '#ef4444'; // Danger
        }),
        borderWidth: 1
      }]
    };

    this.charts.performanceScore = ChartFactory.createHorizontalBarChart(
      'performanceScoreChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Performance Score Breakdown'
          }
        },
        scales: {
          x: {
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    );

    appState.storeChart('performanceScoreChart', this.charts.performanceScore);
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
    const data = appState.getState('data.performance');
    const filters = appState.getFilters('performance');

    if (!data) {
      throw new Error('No data available to export');
    }

    const sections = [];

    // Summary section
    const completionRate = data.completionRates?.trips?.overall?.rate || '0';
    const ordersPerTrip = data.efficiencyMetrics?.ordersPerTrip?.avg || '0';

    sections.push({
      title: 'Performance Summary',
      type: 'summary',
      data: {
        'Total Orders': formatNumber(data.totalOrders || 0),
        'Total Trips': formatNumber(data.totalTrips || 0),
        'Trip Completion Rate': completionRate + '%',
        'Orders per Trip': ordersPerTrip,
        'Performance Score': (data.performanceScore?.score || 0) + '/100',
        'Performance Rating': data.performanceScore?.rating || 'N/A'
      }
    });

    // Monthly completion rates
    if (data.completionRates?.trips?.byPeriod) {
      const monthlyRows = data.completionRates.trips.byPeriod.map(p => [
        p._id?.month ? formatMonth(p._id.month) : 'N/A',
        formatNumber(p.totalTrips || 0),
        formatNumber(p.completed || 0),
        formatNumber(p.canceled || 0),
        (p.completionRate || 0).toFixed(2) + '%'
      ]);

      sections.push({
        title: 'Monthly Trip Performance',
        type: 'table',
        headers: ['Month', 'Total Trips', 'Completed', 'Canceled', 'Completion Rate'],
        rows: monthlyRows
      });
    }

    // Efficiency metrics
    if (data.efficiencyMetrics) {
      const metrics = data.efficiencyMetrics;
      sections.push({
        title: 'Efficiency Metrics',
        type: 'summary',
        data: {
          'Orders per Trip': metrics.ordersPerTrip?.avg || 'N/A',
          'Total Orders': formatNumber(metrics.ordersPerTrip?.totalOrders || 0),
          'Total Trips': formatNumber(metrics.ordersPerTrip?.totalTrips || 0),
          'Cancellation Rate': (metrics.cancellationRate?.rate || 0) + '%',
          'Consistency Score': (metrics.consistencyScore || 0).toFixed(2),
          'Efficiency Rating': metrics.insights?.efficiency || 'N/A',
          'Reliability Rating': metrics.insights?.reliability || 'N/A'
        }
      });
    }

    return {
      title: 'Performance Metrics Report',
      filename: 'performance-metrics',
      data,
      filters,
      sections
    };
  }
}

export default PerformancePage;
