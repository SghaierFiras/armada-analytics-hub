/**
 * Ordering Behavior Page Module
 * Handles time-based ordering pattern analysis
 */

import ChartFactory from '../components/ChartFactory.js';
import appState from '../state/appState.js';
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters.js';
import { setHTML, setText, showLoading, showError } from '../utils/domUtils.js';

/**
 * OrderingBehaviorPage Class
 */
export class OrderingBehaviorPage {
  constructor() {
    this.charts = {};
    this.containerId = 'orderingBehavior';
    this.rawData = null;
    this.currentPeriod = 'all';
    this.currentMerchantFilters = {
      search: '',
      period: 'all',
      rank: 'all'
    };
  }

  /**
   * Load page
   */
  async load(filters = {}) {
    console.log('[OrderingBehaviorPage] Loading ordering behavior analysis');

    appState.setLoading('orderingBehavior', true);
    appState.setError('orderingBehavior', null);

    this.destroyCharts();

    try {
      await this.loadData();
      this.renderStats();
      this.renderCharts();
      this.setupFilters();
      appState.setLoading('orderingBehavior', false);
    } catch (error) {
      console.error('[OrderingBehaviorPage] Error loading page:', error);
      appState.setError('orderingBehavior', error.message);
      appState.setLoading('orderingBehavior', false);
      showError(this.containerId, 'Failed to load ordering behavior: ' + error.message);
    }
  }

  /**
   * Load data from CSV file
   */
  async loadData() {
    try {
      const response = await fetch('/data/kuwait_ordering_with_avg_amounts_2025.csv');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }

      const csvText = await response.text();
      this.rawData = this.parseCSV(csvText);

      const processedData = this.processData(this.rawData);
      appState.setData('orderingBehavior', processedData);

      return processedData;
    } catch (error) {
      console.error('[OrderingBehaviorPage] Error loading data:', error);
      throw error;
    }
  }

  /**
   * Parse CSV data
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index].trim();
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Process raw data into structured format
   */
  processData(rawData) {
    const periods = {};
    let totalOrders = 0;
    let totalAmount = 0;
    const merchants = new Set();
    const merchantData = {};

    rawData.forEach(row => {
      const period = row['Time_Period'] || row['time_period'];
      const merchant = row['merchant_name'];
      const orderCount = parseInt(row['Order_Count'] || row['order_count'] || 0);
      const avgAmount = parseFloat(row['Avg_Order_Amount'] || row['avg_order_amount'] || 0);
      const percentOfPeriod = parseFloat(row['Percent_of_Period'] || row['percent_of_period'] || 0);
      const rank = parseInt(row['Rank'] || row['rank'] || 0);

      if (!periods[period]) {
        periods[period] = {
          name: period,
          totalOrders: 0,
          avgAmount: 0,
          merchants: [],
          count: 0
        };
      }

      periods[period].totalOrders += orderCount;
      periods[period].count++;
      periods[period].merchants.push({
        name: merchant,
        orderCount,
        avgAmount,
        percentOfPeriod,
        rank
      });

      totalOrders += orderCount;
      totalAmount += (orderCount * avgAmount);
      merchants.add(merchant);

      if (!merchantData[merchant]) {
        merchantData[merchant] = {
          name: merchant,
          totalOrders: 0,
          periods: {}
        };
      }

      merchantData[merchant].totalOrders += orderCount;
      merchantData[merchant].periods[period] = {
        orderCount,
        avgAmount,
        rank
      };
    });

    // Calculate average amounts for periods
    Object.keys(periods).forEach(period => {
      const avgSum = periods[period].merchants.reduce((sum, m) => sum + m.avgAmount, 0);
      periods[period].avgAmount = periods[period].count > 0 ? avgSum / periods[period].count : 0;

      // Sort merchants by order count
      periods[period].merchants.sort((a, b) => b.orderCount - a.orderCount);
    });

    // Find peak period
    let peakPeriod = null;
    let maxOrders = 0;
    Object.entries(periods).forEach(([name, data]) => {
      if (data.totalOrders > maxOrders) {
        maxOrders = data.totalOrders;
        peakPeriod = name;
      }
    });

    // Find top merchant
    let topMerchant = null;
    let topMerchantOrders = 0;
    Object.values(merchantData).forEach(m => {
      if (m.totalOrders > topMerchantOrders) {
        topMerchantOrders = m.totalOrders;
        topMerchant = m.name;
      }
    });

    return {
      periods,
      totalOrders,
      avgOrderAmount: totalOrders > 0 ? totalAmount / totalOrders : 0,
      peakPeriod,
      topMerchant,
      merchantCount: merchants.size,
      merchantData,
      rawData
    };
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const data = appState.getState('data.orderingBehavior');
    if (!data) return;

    setText('#behaviorTotalOrders', formatNumber(data.totalOrders));
    setText('#behaviorPeakPeriod', data.peakPeriod || 'N/A');
    setText('#behaviorAvgAmount', formatCurrency(data.avgOrderAmount));
    setText('#behaviorTopMerchant', data.topMerchant || 'N/A');
  }

  /**
   * Render all charts
   */
  renderCharts() {
    const data = appState.getState('data.orderingBehavior');
    if (!data) return;

    this.renderOrdersChart(data);
    this.renderPieChart(data);
    this.renderAvgAmountChart(data);
    this.renderTopMerchantsChart(data);
    this.renderMerchantPerformanceChart(data);
    this.renderMerchantsTable(data);
  }

  /**
   * Render orders by time period chart
   */
  renderOrdersChart(data) {
    const periods = Object.values(data.periods);
    const labels = periods.map(p => p.name);
    const values = periods.map(p => p.totalOrders);

    this.charts.orders = ChartFactory.createBarChart(
      'behaviorOrdersChart',
      {
        labels,
        datasets: [{
          label: 'Orders',
          data: values,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 2
        }]
      },
      {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    );

    appState.storeChart('behaviorOrdersChart', this.charts.orders);
  }

  /**
   * Render pie chart for order distribution
   */
  renderPieChart(data) {
    const periods = Object.values(data.periods);
    const labels = periods.map(p => p.name);
    const values = periods.map(p => p.totalOrders);

    const colors = [
      '#ef4444', // red
      '#f59e0b', // orange
      '#10b981', // green
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899'  // pink
    ];

    this.charts.pie = ChartFactory.createDoughnutChart(
      'behaviorPieChart',
      {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      {
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    );

    appState.storeChart('behaviorPieChart', this.charts.pie);
  }

  /**
   * Render average amount chart
   */
  renderAvgAmountChart(data) {
    const periods = Object.values(data.periods);
    const labels = periods.map(p => p.name);
    const values = periods.map(p => p.avgAmount);

    this.charts.avgAmount = ChartFactory.createBarChart(
      'behaviorAvgChart',
      {
        labels,
        datasets: [{
          label: 'Avg Amount (KD)',
          data: values,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 2
        }]
      },
      {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'KD ' + value.toFixed(2);
              }
            }
          }
        }
      }
    );

    appState.storeChart('behaviorAvgChart', this.charts.avgAmount);
  }

  /**
   * Render top merchants chart
   */
  renderTopMerchantsChart(data) {
    const merchants = Object.values(data.merchantData)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);

    const labels = merchants.map(m => m.name);
    const values = merchants.map(m => m.totalOrders);

    this.charts.topMerchants = ChartFactory.createBarChart(
      'behaviorTopMerchantsChart',
      {
        labels,
        datasets: [{
          label: 'Total Orders',
          data: values,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 2
        }]
      },
      {
        indexAxis: 'y', // Horizontal bar chart
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    );

    appState.storeChart('behaviorTopMerchantsChart', this.charts.topMerchants);
  }

  /**
   * Render merchant performance across periods
   */
  renderMerchantPerformanceChart(data) {
    const topMerchants = Object.values(data.merchantData)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);

    const periods = Object.keys(data.periods);
    const datasets = topMerchants.map((merchant, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      return {
        label: merchant.name,
        data: periods.map(period => merchant.periods[period]?.orderCount || 0),
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 2
      };
    });

    this.charts.merchantPerformance = ChartFactory.createBarChart(
      'behaviorMerchantPerformanceChart',
      {
        labels: periods,
        datasets
      },
      {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    );

    appState.storeChart('behaviorMerchantPerformanceChart', this.charts.merchantPerformance);
  }

  /**
   * Render merchants table
   */
  renderMerchantsTable(data) {
    const period = this.currentPeriod === 'all' ? null : this.currentPeriod;

    let merchants = [];
    if (period && data.periods[period]) {
      merchants = data.periods[period].merchants.slice(0, 10);
    } else {
      // Show top merchants across all periods
      merchants = Object.values(data.merchantData)
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 10)
        .map((m, index) => ({
          name: m.name,
          orderCount: m.totalOrders,
          rank: index + 1,
          percentOfPeriod: (m.totalOrders / data.totalOrders) * 100
        }));
    }

    const tableHTML = merchants.map(m => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; color: #64748b;">${m.rank}</td>
        <td style="padding: 12px; font-weight: 500;">${m.name}</td>
        <td style="padding: 12px; color: #64748b;">${period || 'All Periods'}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">${formatNumber(m.orderCount)}</td>
        <td style="padding: 12px; text-align: right; color: #3b82f6;">${formatPercent(m.percentOfPeriod)}</td>
      </tr>
    `).join('');

    setHTML('#behaviorMerchantsTable', tableHTML);
  }

  /**
   * Setup filters and event handlers
   */
  setupFilters() {
    // Period selector
    const periodSelector = document.getElementById('behaviorPeriodSelector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        this.currentPeriod = e.target.value;
        this.updatePeriodView();
      });
    }

    // Merchant search
    const merchantSearch = document.getElementById('behaviorMerchantSearch');
    if (merchantSearch) {
      merchantSearch.addEventListener('input', (e) => {
        this.currentMerchantFilters.search = e.target.value.toLowerCase();
        this.updateMerchantDetailsTable();
      });
    }

    // Merchant period filter
    const merchantPeriodFilter = document.getElementById('behaviorMerchantPeriodFilter');
    if (merchantPeriodFilter) {
      merchantPeriodFilter.addEventListener('change', (e) => {
        this.currentMerchantFilters.period = e.target.value;
        this.updateMerchantDetailsTable();
      });
    }

    // Merchant rank filter
    const merchantRankFilter = document.getElementById('behaviorMerchantRankFilter');
    if (merchantRankFilter) {
      merchantRankFilter.addEventListener('change', (e) => {
        this.currentMerchantFilters.rank = e.target.value;
        this.updateMerchantDetailsTable();
      });
    }
  }

  /**
   * Update view when period changes
   */
  updatePeriodView() {
    const data = appState.getState('data.orderingBehavior');
    if (!data) return;

    this.renderMerchantsTable(data);

    // Update period stats if container exists
    const periodStatsContainer = document.getElementById('behaviorPeriodStats');
    if (periodStatsContainer && this.currentPeriod !== 'all') {
      const periodData = data.periods[this.currentPeriod];
      if (periodData) {
        const statsHTML = `
          <div class="stat-card">
            <div class="stat-label">Period Orders</div>
            <div class="stat-value">${formatNumber(periodData.totalOrders)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Amount</div>
            <div class="stat-value">${formatCurrency(periodData.avgAmount)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Merchants</div>
            <div class="stat-value">${periodData.merchants.length}</div>
          </div>
        `;
        periodStatsContainer.innerHTML = statsHTML;
      }
    } else if (periodStatsContainer) {
      periodStatsContainer.innerHTML = '';
    }
  }

  /**
   * Update merchant details table based on filters
   */
  updateMerchantDetailsTable() {
    const data = appState.getState('data.orderingBehavior');
    if (!data) return;

    let rows = this.rawData;

    // Apply filters
    if (this.currentMerchantFilters.search) {
      rows = rows.filter(row =>
        (row.merchant_name || row['merchant_name']).toLowerCase()
          .includes(this.currentMerchantFilters.search)
      );
    }

    if (this.currentMerchantFilters.period !== 'all') {
      rows = rows.filter(row =>
        (row.Time_Period || row.time_period) === this.currentMerchantFilters.period
      );
    }

    if (this.currentMerchantFilters.rank !== 'all') {
      const maxRank = parseInt(this.currentMerchantFilters.rank);
      rows = rows.filter(row =>
        parseInt(row.Rank || row.rank) <= maxRank
      );
    }

    // Render filtered table
    const tableHTML = rows.slice(0, 50).map(row => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: 500;">${row.merchant_name || row['merchant_name']}</td>
        <td style="padding: 12px; color: #64748b;">${row.Time_Period || row.time_period}</td>
        <td style="padding: 12px; text-align: center; color: #64748b;">${row.Rank || row.rank}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">${formatNumber(parseInt(row.Order_Count || row.order_count))}</td>
        <td style="padding: 12px; text-align: right; color: #3b82f6;">${formatPercent(parseFloat(row.Percent_of_Period || row.percent_of_period))}</td>
      </tr>
    `).join('');

    setHTML('#behaviorMerchantDetailsTable', tableHTML);
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
    const data = appState.getState('data.orderingBehavior');

    if (!data) {
      throw new Error('No data available to export');
    }

    const sections = [];

    // Summary
    sections.push({
      title: 'Ordering Behavior Summary',
      type: 'summary',
      data: {
        'Total Orders': formatNumber(data.totalOrders),
        'Peak Period': data.peakPeriod,
        'Average Order Amount': formatCurrency(data.avgOrderAmount),
        'Top Merchant': data.topMerchant,
        'Total Merchants': formatNumber(data.merchantCount)
      }
    });

    // Period breakdown
    const periodRows = Object.values(data.periods).map(p => [
      p.name,
      formatNumber(p.totalOrders),
      formatCurrency(p.avgAmount),
      p.merchants.length
    ]);

    sections.push({
      title: 'Orders by Time Period',
      type: 'table',
      headers: ['Period', 'Total Orders', 'Avg Amount', 'Merchants'],
      rows: periodRows
    });

    // Top merchants
    const merchantRows = Object.values(data.merchantData)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 20)
      .map(m => [
        m.name,
        formatNumber(m.totalOrders),
        formatPercent((m.totalOrders / data.totalOrders) * 100)
      ]);

    sections.push({
      title: 'Top Merchants',
      type: 'table',
      headers: ['Merchant', 'Total Orders', '% of Total'],
      rows: merchantRows
    });

    return {
      title: 'Analytics Hub - Ordering Behavior',
      filename: 'ordering-behavior-analysis',
      data,
      filters: {},
      sections
    };
  }
}

export default OrderingBehaviorPage;
