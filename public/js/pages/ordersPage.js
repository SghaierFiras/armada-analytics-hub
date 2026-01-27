/**
 * Orders Page Module
 * Handles order analytics dashboard
 */

import ChartFactory from '../components/charts/ChartFactory.js';
import StatCard from '../components/StatCard.js';
import apiService from '../services/apiService.js';
import appState from '../state/appState.js';
import { formatNumber, formatPercent, formatMonth } from '../utils/formatters.js';
import { setHTML, showLoading, showError } from '../utils/domUtils.js';
import ExportService from '../utils/exportUtils.js';

/**
 * OrdersPage Class
 */
export class OrdersPage {
  constructor() {
    this.charts = {};
    this.containerId = 'ordersPage';
  }

  /**
   * Load page with filters
   * @param {object} filters - Filter parameters
   */
  async load(filters = {}) {
    console.log('[OrdersPage] Loading with filters:', filters);

    appState.setLoading('orders', true);
    appState.setError('orders', null);

    this.destroyCharts();

    try {
      await this.loadData(filters);
      this.renderStats();
      this.renderCharts();
      appState.setLoading('orders', false);
    } catch (error) {
      console.error('[OrdersPage] Error loading page:', error);
      appState.setError('orders', error.message);
      appState.setLoading('orders', false);
      showError(this.containerId, 'Failed to load order analytics: ' + error.message);
    }
  }

  /**
   * Load data from API
   * @param {object} filters - Filter parameters
   */
  async loadData(filters) {
    const data = await apiService.getOrderAnalytics(filters);
    appState.setData('orders', data);
    return data;
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const data = appState.getState('data.orders');
    if (!data) return;

    // Calculate completion rate
    const completionRate = data.completionRate?.overall || '0';

    // Calculate growth
    const latestYear = data.latestYearOrders || 0;
    const previousYear = data.annual && data.annual.length >= 2 ? data.annual[data.annual.length - 2].totalOrders : 0;
    const growth = previousYear > 0 ? ((latestYear - previousYear) / previousYear * 100) : 0;

    const statsHTML = StatCard.renderGrid([
      {
        title: 'Total Orders',
        value: data.totalOrders || 0,
        format: 'number',
        icon: '📦',
        color: 'primary',
        trend: growth,
        trendLabel: 'vs last year'
      },
      {
        title: 'Latest Year Orders',
        value: latestYear,
        format: 'number',
        icon: '📊',
        color: 'info'
      },
      {
        title: 'Completion Rate',
        value: parseFloat(completionRate),
        format: 'percent',
        icon: '✅',
        color: 'success'
      },
      {
        title: 'YoY Growth',
        value: growth,
        format: 'percent',
        icon: growth >= 0 ? '📈' : '📉',
        color: growth >= 0 ? 'success' : 'danger'
      }
    ], 4);

    setHTML('#orderStats', statsHTML);
  }

  /**
   * Render all charts
   */
  renderCharts() {
    const data = appState.getState('data.orders');
    if (!data) return;

    this.renderAnnualChart(data);
    this.renderMonthlyChart(data);
    this.renderQuarterlyChart(data);
    this.renderStatusChart(data);
    this.renderCompletionRateChart(data);
  }

  /**
   * Render annual orders chart
   */
  renderAnnualChart(data) {
    if (!data.annual || data.annual.length === 0) return;

    const labels = data.annual.map(d => d._id.toString());
    const orders = data.annual.map(d => d.totalOrders);

    this.charts.annual = ChartFactory.createGrowthChart(
      'ordersAnnualChart',
      labels,
      orders,
      'Total Orders'
    );

    appState.storeChart('ordersAnnualChart', this.charts.annual);
  }

  /**
   * Render monthly orders chart
   */
  renderMonthlyChart(data) {
    if (!data.monthly || data.monthly.length === 0) return;

    const labels = data.monthly.map(d => formatMonth(d._id));
    const orders = data.monthly.map(d => d.totalOrders);
    const completed = data.monthly.map(d => d.completed || 0);
    const canceled = data.monthly.map(d => d.canceled || 0);

    const datasets = [
      {
        label: 'Total Orders',
        data: orders,
        borderColor: '#2563eb',
        backgroundColor: '#2563eb20',
        tension: 0.4,
        fill: true
      }
    ];

    // Only add completed/canceled if we have data
    if (completed.some(v => v > 0)) {
      datasets.push({
        label: 'Completed',
        data: completed,
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        tension: 0.4,
        fill: false
      });
    }

    if (canceled.some(v => v > 0)) {
      datasets.push({
        label: 'Canceled',
        data: canceled,
        borderColor: '#ef4444',
        backgroundColor: '#ef444420',
        tension: 0.4,
        fill: false
      });
    }

    this.charts.monthly = ChartFactory.createMultiLineChart(
      'ordersMonthlyChart',
      labels,
      datasets,
      {
        plugins: {
          title: {
            display: true,
            text: 'Monthly Orders Trend'
          }
        }
      }
    );

    appState.storeChart('ordersMonthlyChart', this.charts.monthly);
  }

  /**
   * Render quarterly comparison chart
   */
  renderQuarterlyChart(data) {
    if (!data.quarterly || data.quarterly.length === 0) return;

    const labels = data.quarterly.map(d => d._id);
    const orders = data.quarterly.map(d => d.totalOrders);

    const chartData = {
      labels,
      datasets: [{
        label: 'Orders',
        data: orders,
        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1
      }]
    };

    this.charts.quarterly = ChartFactory.createBarChart(
      'ordersQuarterlyChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Quarterly Orders Distribution'
          }
        }
      }
    );

    appState.storeChart('ordersQuarterlyChart', this.charts.quarterly);
  }

  /**
   * Render status breakdown chart
   */
  renderStatusChart(data) {
    if (!data.statusBreakdown || data.statusBreakdown.length === 0) return;

    const labels = data.statusBreakdown.map(s =>
      s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Unknown'
    );
    const counts = data.statusBreakdown.map(s => s.count);

    const chartData = {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.charts.status = ChartFactory.createDoughnutChart(
      'ordersStatusChart',
      chartData,
      {
        plugins: {
          title: {
            display: true,
            text: 'Order Status Breakdown'
          }
        }
      }
    );

    appState.storeChart('ordersStatusChart', this.charts.status);
  }

  /**
   * Render completion rate trend chart
   */
  renderCompletionRateChart(data) {
    if (!data.monthly || data.monthly.length === 0) return;

    const labels = data.monthly.map(d => formatMonth(d._id));

    // Calculate completion rates from monthly data
    const rates = data.monthly.map(d => {
      const total = d.totalOrders || 0;
      const completed = d.completed || 0;
      return total > 0 ? (completed / total * 100) : 0;
    });

    // Skip if no meaningful data
    if (rates.every(r => r === 0)) return;

    this.charts.completionRate = ChartFactory.createCompletionRateChart(
      'ordersCompletionChart',
      labels,
      rates,
      'Completion Rate'
    );

    appState.storeChart('ordersCompletionChart', this.charts.completionRate);
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
    const data = appState.getState('data.orders');
    const filters = appState.getFilters('orders');

    if (!data) {
      throw new Error('No data available to export');
    }

    const sections = [];

    // Summary section
    sections.push({
      title: 'Summary',
      type: 'summary',
      data: {
        'Total Orders': formatNumber(data.totalOrders || 0),
        'Latest Year Orders': formatNumber(data.latestYearOrders || 0),
        'Completion Rate': data.completionRate?.overall || '0%',
        'Status': data.statusBreakdown?.length > 0 ? 'Available' : 'N/A'
      }
    });

    // Annual data
    if (data.annual && data.annual.length > 0) {
      const annualRows = data.annual.map(d => [
        d._id,
        formatNumber(d.totalOrders)
      ]);

      sections.push({
        title: 'Annual Orders',
        type: 'table',
        headers: ['Year', 'Total Orders'],
        rows: annualRows
      });
    }

    // Monthly data
    if (data.monthly && data.monthly.length > 0) {
      const monthlyRows = data.monthly.map(d => [
        formatMonth(d._id),
        formatNumber(d.totalOrders),
        formatNumber(d.completed || 0),
        formatNumber(d.canceled || 0)
      ]);

      sections.push({
        title: 'Monthly Orders',
        type: 'table',
        headers: ['Month', 'Total Orders', 'Completed', 'Canceled'],
        rows: monthlyRows
      });
    }

    // Quarterly data
    if (data.quarterly && data.quarterly.length > 0) {
      const quarterlyRows = data.quarterly.map(d => [
        d._id,
        formatNumber(d.totalOrders),
        formatNumber(d.completed || 0),
        formatNumber(d.canceled || 0)
      ]);

      sections.push({
        title: 'Quarterly Orders',
        type: 'table',
        headers: ['Quarter', 'Total Orders', 'Completed', 'Canceled'],
        rows: quarterlyRows
      });
    }

    return {
      title: 'Order Analytics Report',
      filename: 'order-analytics',
      data,
      filters,
      sections
    };
  }
}

export default OrdersPage;
