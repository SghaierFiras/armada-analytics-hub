/**
 * Chart Configuration
 * Centralized configuration for all Chart.js charts
 */

// Configure Chart.js defaults
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#374151';

/**
 * Color Palette
 * Consistent color scheme across all charts
 */
export const colors = {
  primary: '#2563eb',
  secondary: '#3b82f6',
  light: '#60a5fa',
  lighter: '#93c5fd',
  lightest: '#dbeafe',
  dark: '#1e40af',
  darker: '#1e3a8a',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
  gray: '#6b7280'
};

/**
 * Color Palettes for Charts
 */
export const chartPalettes = {
  // Primary palette for main charts
  primary: [
    colors.primary,
    colors.secondary,
    colors.light,
    colors.success,
    colors.warning,
    colors.info,
    colors.purple,
    colors.pink
  ],

  // Business size palette
  businessSize: [
    colors.primary,   // Micro
    colors.secondary, // Small
    colors.success,   // Medium
    colors.warning,   // Large
    colors.danger     // Enterprise
  ],

  // Status palette
  status: [
    colors.success,   // Completed
    colors.danger,    // Canceled
    colors.warning,   // Pending
    colors.info       // In Progress
  ],

  // Growth palette
  growth: [
    colors.success,   // Explosive
    colors.info,      // High Growth
    colors.primary,   // Moderate
    colors.warning,   // Stable
    colors.danger,    // Declining
    colors.gray       // Churned/New
  ],

  // Geographic palette
  geographic: [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.info,
    colors.warning,
    colors.purple,
    colors.pink,
    colors.teal
  ]
};

/**
 * Default Chart Options
 * Base configuration that can be overridden per chart
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        usePointStyle: true,
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 13,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      cornerRadius: 6,
      displayColors: true,
      intersect: false,
      mode: 'index'
    }
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
};

/**
 * Chart Type Specific Options
 */
export const chartTypeOptions = {
  line: {
    ...defaultChartOptions,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  },

  bar: {
    ...defaultChartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  },

  pie: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: true,
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      }
    }
  },

  doughnut: {
    ...defaultChartOptions,
    cutout: '60%',
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      }
    }
  }
};

/**
 * Helper function to merge chart options
 * @param {string} type - Chart type (line, bar, pie, doughnut)
 * @param {object} customOptions - Custom options to merge
 * @returns {object} Merged options
 */
export function getChartOptions(type, customOptions = {}) {
  const baseOptions = chartTypeOptions[type] || defaultChartOptions;
  return mergeDeep(baseOptions, customOptions);
}

/**
 * Deep merge utility for nested objects
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function mergeDeep(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default {
  colors,
  chartPalettes,
  defaultChartOptions,
  chartTypeOptions,
  getChartOptions
};
