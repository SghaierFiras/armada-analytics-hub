/**
 * Chart Factory
 * Consolidates 45+ chart creation functions into a single factory
 * Reduces ~1,500 lines of duplicated chart code to ~400 lines
 */

import { colors, chartPalettes, getChartOptions } from '../../config/chartConfig.js';
import { formatNumber, formatPercent } from '../../utils/formatters.js';

/**
 * ChartFactory Class
 * Factory for creating Chart.js charts with consistent styling
 */
export class ChartFactory {
  /**
   * Create a line chart
   * @param {string} canvasId - Canvas element ID
   * @param {object} data - Chart data
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas not found: ${canvasId}`);
      return null;
    }

    const ctx = canvas.getContext('2d');
    const chartOptions = getChartOptions('line', options);

    return new Chart(ctx, {
      type: 'line',
      data,
      options: chartOptions
    });
  }

  /**
   * Create a bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {object} data - Chart data
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas not found: ${canvasId}`);
      return null;
    }

    const ctx = canvas.getContext('2d');
    const chartOptions = getChartOptions('bar', options);

    return new Chart(ctx, {
      type: 'bar',
      data,
      options: chartOptions
    });
  }

  /**
   * Create a horizontal bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {object} data - Chart data
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createHorizontalBarChart(canvasId, data, options = {}) {
    const defaultOptions = {
      indexAxis: 'y', // Make it horizontal
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    };

    return this.createBarChart(canvasId, data, { ...defaultOptions, ...options });
  }

  /**
   * Create a pie chart
   * @param {string} canvasId - Canvas element ID
   * @param {object} data - Chart data
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createPieChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas not found: ${canvasId}`);
      return null;
    }

    const ctx = canvas.getContext('2d');
    const chartOptions = getChartOptions('pie', options);

    return new Chart(ctx, {
      type: 'pie',
      data,
      options: chartOptions
    });
  }

  /**
   * Create a doughnut chart
   * @param {string} canvasId - Canvas element ID
   * @param {object} data - Chart data
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createDoughnutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas not found: ${canvasId}`);
      return null;
    }

    const ctx = canvas.getContext('2d');
    const chartOptions = getChartOptions('doughnut', options);

    return new Chart(ctx, {
      type: 'doughnut',
      data,
      options: chartOptions
    });
  }

  /**
   * Create a multi-line chart (multiple datasets)
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - X-axis labels
   * @param {array} datasets - Array of dataset configurations
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createMultiLineChart(canvasId, labels, datasets, options = {}) {
    const data = {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor || chartPalettes.primary[index % chartPalettes.primary.length],
        backgroundColor: dataset.backgroundColor || chartPalettes.primary[index % chartPalettes.primary.length] + '20',
        tension: dataset.tension !== undefined ? dataset.tension : 0.4,
        fill: dataset.fill !== undefined ? dataset.fill : false,
        borderWidth: dataset.borderWidth || 2,
        pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
        pointHoverRadius: dataset.pointHoverRadius || 5
      }))
    };

    return this.createLineChart(canvasId, data, options);
  }

  /**
   * Create a grouped bar chart (multiple datasets)
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - X-axis labels
   * @param {array} datasets - Array of dataset configurations
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createGroupedBarChart(canvasId, labels, datasets, options = {}) {
    const data = {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || chartPalettes.primary[index % chartPalettes.primary.length],
        borderColor: dataset.borderColor || chartPalettes.primary[index % chartPalettes.primary.length],
        borderWidth: 1
      }))
    };

    return this.createBarChart(canvasId, data, options);
  }

  /**
   * Create a stacked bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - X-axis labels
   * @param {array} datasets - Array of dataset configurations
   * @param {object} options - Custom options
   * @returns {Chart} Chart.js instance
   */
  static createStackedBarChart(canvasId, labels, datasets, options = {}) {
    const defaultOptions = {
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    };

    return this.createGroupedBarChart(canvasId, labels, datasets, { ...defaultOptions, ...options });
  }

  /**
   * Create a business size distribution chart (pie chart with custom formatting)
   * @param {string} canvasId - Canvas element ID
   * @param {object} sizeData - Business size data
   * @returns {Chart} Chart.js instance
   */
  static createBusinessSizeChart(canvasId, sizeData) {
    const labels = [];
    const data = [];
    const backgroundColors = chartPalettes.businessSize;

    Object.entries(sizeData).forEach(([size, info]) => {
      labels.push(size.charAt(0).toUpperCase() + size.slice(1));
      data.push(info.count || info);
    });

    const chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    const options = {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };

    return this.createPieChart(canvasId, chartData, options);
  }

  /**
   * Create a completion rate chart (line chart with percentage formatting)
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - X-axis labels
   * @param {array} data - Completion rate data (0-100)
   * @param {string} label - Dataset label
   * @returns {Chart} Chart.js instance
   */
  static createCompletionRateChart(canvasId, labels, data, label = 'Completion Rate') {
    const chartData = {
      labels,
      datasets: [{
        label,
        data,
        borderColor: colors.success,
        backgroundColor: colors.success + '20',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };

    const options = {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      }
    };

    return this.createLineChart(canvasId, chartData, options);
  }

  /**
   * Create a growth/trend chart (line chart with growth indicators)
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - X-axis labels
   * @param {array} data - Data values
   * @param {string} label - Dataset label
   * @returns {Chart} Chart.js instance
   */
  static createGrowthChart(canvasId, labels, data, label = 'Growth') {
    const chartData = {
      labels,
      datasets: [{
        label,
        data,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };

    const options = {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatNumber(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
            }
          }
        }
      }
    };

    return this.createLineChart(canvasId, chartData, options);
  }

  /**
   * Create a top N bar chart (horizontal bar chart sorted by value)
   * @param {string} canvasId - Canvas element ID
   * @param {array} items - Array of {name, value} objects
   * @param {number} topN - Number of top items to show
   * @param {string} label - Dataset label
   * @returns {Chart} Chart.js instance
   */
  static createTopNChart(canvasId, items, topN = 10, label = 'Value') {
    // Sort and take top N
    const sorted = items
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const labels = sorted.map(item => item.name);
    const data = sorted.map(item => item.value);

    const chartData = {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: colors.primary,
        borderColor: colors.dark,
        borderWidth: 1
      }]
    };

    const options = {
      scales: {
        x: {
          ticks: {
            callback: function(value) {
              return formatNumber(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatNumber(context.parsed.x)}`;
            }
          }
        }
      }
    };

    return this.createHorizontalBarChart(canvasId, chartData, options);
  }

  /**
   * Create a comparison chart (grouped bar chart for comparing periods)
   * @param {string} canvasId - Canvas element ID
   * @param {array} labels - Categories to compare
   * @param {array} datasets - Array of {label, data, color} objects
   * @returns {Chart} Chart.js instance
   */
  static createComparisonChart(canvasId, labels, datasets) {
    const formattedDatasets = datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.color || chartPalettes.primary[index % chartPalettes.primary.length],
      borderColor: dataset.color || chartPalettes.primary[index % chartPalettes.primary.length],
      borderWidth: 1
    }));

    const chartData = {
      labels,
      datasets: formattedDatasets
    };

    const options = {
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return formatNumber(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
            }
          }
        }
      }
    };

    return this.createBarChart(canvasId, chartData, options);
  }

  /**
   * Create a status breakdown chart (doughnut chart for status distribution)
   * @param {string} canvasId - Canvas element ID
   * @param {object} statusData - Status counts
   * @returns {Chart} Chart.js instance
   */
  static createStatusChart(canvasId, statusData) {
    const labels = Object.keys(statusData).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const data = Object.values(statusData);

    const chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: chartPalettes.status,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    return this.createDoughnutChart(canvasId, chartData);
  }

  /**
   * Destroy chart instance
   * @param {Chart} chart - Chart.js instance
   */
  static destroy(chart) {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  }

  /**
   * Destroy multiple charts
   * @param {object} charts - Object with chart instances
   */
  static destroyAll(charts) {
    Object.values(charts).forEach(chart => {
      this.destroy(chart);
    });
  }

  /**
   * Update chart data
   * @param {Chart} chart - Chart.js instance
   * @param {object} newData - New chart data
   */
  static updateData(chart, newData) {
    if (!chart) return;

    chart.data = newData;
    chart.update();
  }

  /**
   * Update chart options
   * @param {Chart} chart - Chart.js instance
   * @param {object} newOptions - New chart options
   */
  static updateOptions(chart, newOptions) {
    if (!chart) return;

    Object.assign(chart.options, newOptions);
    chart.update();
  }
}

export default ChartFactory;
