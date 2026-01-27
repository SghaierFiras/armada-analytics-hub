/**
 * Stat Card Component
 * Reusable component for rendering statistic cards
 */

import { formatNumber, formatPercent, formatGrowth } from '../utils/formatters.js';

/**
 * StatCard Class
 * Generates HTML for statistic cards with consistent styling
 */
export class StatCard {
  /**
   * Render a single stat card
   * @param {object} config - Card configuration
   * @param {string} config.title - Card title
   * @param {string|number} config.value - Main value
   * @param {string} config.subtitle - Optional subtitle
   * @param {string} config.icon - Optional icon class/emoji
   * @param {string} config.trend - Optional trend value
   * @param {string} config.trendLabel - Optional trend label
   * @param {string} config.color - Optional color theme (primary, success, danger, warning, info)
   * @param {string} config.format - Value format (number, percent, currency, custom)
   * @returns {string} HTML string
   */
  static render(config) {
    const {
      title,
      value,
      subtitle = '',
      icon = '',
      trend = null,
      trendLabel = '',
      color = 'primary',
      format = 'number'
    } = config;

    // Format the value
    let formattedValue = value;
    if (format === 'number') {
      formattedValue = formatNumber(value);
    } else if (format === 'percent') {
      formattedValue = formatPercent(value);
    } else if (format === 'currency') {
      formattedValue = `KWD ${formatNumber(value)}`;
    }

    // Format trend if provided
    let trendHTML = '';
    if (trend !== null) {
      const growth = formatGrowth(trend);
      trendHTML = `
        <div class="stat-trend ${growth.color}">
          <span class="trend-arrow">${growth.arrow}</span>
          <span class="trend-value">${growth.value}</span>
          ${trendLabel ? `<span class="trend-label">${trendLabel}</span>` : ''}
        </div>
      `;
    }

    // Icon HTML
    const iconHTML = icon ? `<div class="stat-icon">${icon}</div>` : '';

    // Subtitle HTML
    const subtitleHTML = subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : '';

    return `
      <div class="stat-card ${color}">
        ${iconHTML}
        <div class="stat-content">
          <div class="stat-title">${title}</div>
          <div class="stat-value">${formattedValue}</div>
          ${subtitleHTML}
          ${trendHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render multiple stat cards
   * @param {array} configs - Array of card configurations
   * @returns {string} HTML string
   */
  static renderMultiple(configs) {
    return configs.map(config => this.render(config)).join('');
  }

  /**
   * Render stat cards in a grid
   * @param {array} configs - Array of card configurations
   * @param {number} columns - Number of columns (default: 4)
   * @returns {string} HTML string
   */
  static renderGrid(configs, columns = 4) {
    const cards = this.renderMultiple(configs);
    return `
      <div class="stat-grid" style="grid-template-columns: repeat(${columns}, 1fr);">
        ${cards}
      </div>
    `;
  }

  /**
   * Render a comparison card (side-by-side values)
   * @param {object} config - Comparison configuration
   * @param {string} config.title - Card title
   * @param {array} config.items - Array of {label, value, format} objects
   * @returns {string} HTML string
   */
  static renderComparison(config) {
    const { title, items } = config;

    const itemsHTML = items.map(item => {
      let formattedValue = item.value;
      if (item.format === 'number') {
        formattedValue = formatNumber(item.value);
      } else if (item.format === 'percent') {
        formattedValue = formatPercent(item.value);
      }

      return `
        <div class="comparison-item">
          <div class="comparison-label">${item.label}</div>
          <div class="comparison-value">${formattedValue}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="stat-card comparison-card">
        <div class="stat-title">${title}</div>
        <div class="comparison-items">
          ${itemsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render a metric card with progress bar
   * @param {object} config - Metric configuration
   * @param {string} config.title - Card title
   * @param {number} config.value - Current value
   * @param {number} config.target - Target value
   * @param {string} config.format - Value format
   * @returns {string} HTML string
   */
  static renderProgress(config) {
    const { title, value, target, format = 'number' } = config;

    let formattedValue = value;
    let formattedTarget = target;

    if (format === 'number') {
      formattedValue = formatNumber(value);
      formattedTarget = formatNumber(target);
    } else if (format === 'percent') {
      formattedValue = formatPercent(value);
      formattedTarget = formatPercent(target);
    }

    const percentage = Math.min((value / target) * 100, 100);
    const progressColor = percentage >= 100 ? 'success' : percentage >= 70 ? 'warning' : 'danger';

    return `
      <div class="stat-card progress-card">
        <div class="stat-title">${title}</div>
        <div class="progress-content">
          <div class="progress-values">
            <span class="current-value">${formattedValue}</span>
            <span class="target-value">of ${formattedTarget}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${progressColor}" style="width: ${percentage}%"></div>
          </div>
          <div class="progress-percentage">${percentage.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }

  /**
   * Render a mini stat card (compact version)
   * @param {object} config - Card configuration
   * @returns {string} HTML string
   */
  static renderMini(config) {
    const { title, value, format = 'number', color = 'primary' } = config;

    let formattedValue = value;
    if (format === 'number') {
      formattedValue = formatNumber(value);
    } else if (format === 'percent') {
      formattedValue = formatPercent(value);
    }

    return `
      <div class="stat-card mini ${color}">
        <div class="stat-title">${title}</div>
        <div class="stat-value">${formattedValue}</div>
      </div>
    `;
  }

  /**
   * Render stat cards with sparkline charts
   * @param {object} config - Configuration
   * @param {string} config.title - Card title
   * @param {string|number} config.value - Main value
   * @param {array} config.sparklineData - Array of values for sparkline
   * @param {string} config.trend - Trend value
   * @returns {string} HTML string with canvas element
   */
  static renderWithSparkline(config) {
    const { title, value, sparklineData = [], trend = null, format = 'number' } = config;

    let formattedValue = value;
    if (format === 'number') {
      formattedValue = formatNumber(value);
    } else if (format === 'percent') {
      formattedValue = formatPercent(value);
    }

    const canvasId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;

    // Format trend if provided
    let trendHTML = '';
    if (trend !== null) {
      const growth = formatGrowth(trend);
      trendHTML = `
        <div class="stat-trend ${growth.color}">
          <span class="trend-arrow">${growth.arrow}</span>
          <span class="trend-value">${growth.value}</span>
        </div>
      `;
    }

    return `
      <div class="stat-card sparkline-card">
        <div class="stat-content">
          <div class="stat-title">${title}</div>
          <div class="stat-value">${formattedValue}</div>
          ${trendHTML}
        </div>
        <div class="sparkline-container">
          <canvas id="${canvasId}" height="40"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Helper: Get color class from value and thresholds
   * @param {number} value - Value to evaluate
   * @param {object} thresholds - {success: number, warning: number}
   * @returns {string} Color class
   */
  static getColorFromThresholds(value, thresholds) {
    if (value >= thresholds.success) return 'success';
    if (value >= thresholds.warning) return 'warning';
    return 'danger';
  }
}

export default StatCard;
