/**
 * Formatting Utilities
 * Consistent data formatting across the application
 */

/**
 * Format number with K/M suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: auto)
 * @returns {string} Formatted number
 *
 * @example
 * formatNumber(1500) // "1.5K"
 * formatNumber(1500000) // "1.50M"
 * formatNumber(500) // "500"
 */
export function formatNumber(num, decimals = null) {
  if (num === null || num === undefined) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    const formatted = (num / 1000000).toFixed(decimals !== null ? decimals : 2);
    return formatted + 'M';
  }

  if (absNum >= 1000) {
    const formatted = (num / 1000).toFixed(decimals !== null ? decimals : 1);
    return formatted + 'K';
  }

  return num.toLocaleString();
}

/**
 * Format number with commas (no suffixes)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 *
 * @example
 * formatNumberCommas(1500) // "1,500"
 * formatNumberCommas(1500000) // "1,500,000"
 * formatNumberCommas(1234.5678, 2) // "1,234.57"
 */
export function formatNumberCommas(num, decimals = 0) {
  if (num === null || num === undefined) return '0';

  const options = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };

  return num.toLocaleString('en-US', options);
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 *
 * @example
 * formatPercent(0.1234) // "12.3%"
 * formatPercent(0.1234, 2) // "12.34%"
 * formatPercent(85.5) // "85.5%" (if already as percentage)
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';

  // If value is already a percentage (> 1), use as is
  // If value is a decimal (< 1), multiply by 100
  const percentage = value > 1 ? value : value * 100;

  return percentage.toFixed(decimals) + '%';
}

/**
 * Format currency (KWD)
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default: 3 for KWD)
 * @returns {string} Formatted currency
 *
 * @example
 * formatCurrency(1234.567) // "KWD 1,234.567"
 * formatCurrency(1234.567, 2) // "KWD 1,234.57"
 */
export function formatCurrency(amount, decimals = 3) {
  if (amount === null || amount === undefined) return 'KWD 0.000';

  return 'KWD ' + formatNumberCommas(amount, decimals);
}

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format style ('short', 'long', 'iso')
 * @returns {string} Formatted date
 *
 * @example
 * formatDate(new Date(), 'short') // "1/27/2026"
 * formatDate(new Date(), 'long') // "January 27, 2026"
 * formatDate(new Date(), 'iso') // "2026-01-27"
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US');

    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'iso':
      return d.toISOString().split('T')[0];

    case 'datetime':
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

    default:
      return d.toLocaleDateString('en-US');
  }
}

/**
 * Format month name
 * @param {number} monthNumber - Month number (1-12)
 * @param {string} format - Format style ('short', 'long')
 * @returns {string} Formatted month name
 *
 * @example
 * formatMonth(1) // "Jan"
 * formatMonth(1, 'long') // "January"
 */
export function formatMonth(monthNumber, format = 'short') {
  if (monthNumber < 1 || monthNumber > 12) return '';

  const date = new Date(2000, monthNumber - 1, 1);

  if (format === 'long') {
    return date.toLocaleDateString('en-US', { month: 'long' });
  }

  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Format quarter
 * @param {number} quarterNumber - Quarter number (1-4)
 * @returns {string} Formatted quarter
 *
 * @example
 * formatQuarter(1) // "Q1"
 * formatQuarter(3) // "Q3"
 */
export function formatQuarter(quarterNumber) {
  if (quarterNumber < 1 || quarterNumber > 4) return '';
  return `Q${quarterNumber}`;
}

/**
 * Format duration (in seconds)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 *
 * @example
 * formatDuration(90) // "1m 30s"
 * formatDuration(3665) // "1h 1m 5s"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 *
 * @example
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format growth rate with arrow indicator
 * @param {number} value - Growth rate value
 * @param {number} decimals - Number of decimal places
 * @returns {object} Object with formatted value, arrow, and color
 *
 * @example
 * formatGrowth(12.5) // { value: "+12.5%", arrow: "↑", color: "success" }
 * formatGrowth(-5.2) // { value: "-5.2%", arrow: "↓", color: "danger" }
 */
export function formatGrowth(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return { value: 'N/A', arrow: '', color: 'secondary' };
  }

  const formatted = Math.abs(value).toFixed(decimals);

  if (value > 0) {
    return {
      value: `+${formatted}%`,
      arrow: '↑',
      color: 'success',
      isPositive: true
    };
  } else if (value < 0) {
    return {
      value: `-${formatted}%`,
      arrow: '↓',
      color: 'danger',
      isPositive: false
    };
  } else {
    return {
      value: `${formatted}%`,
      arrow: '→',
      color: 'secondary',
      isPositive: null
    };
  }
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 *
 * @example
 * truncateText("Long merchant name", 10) // "Long merch..."
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format change value (for comparison)
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {string} format - Format type ('number', 'percent')
 * @returns {string} Formatted change
 *
 * @example
 * formatChange(150, 100) // "+50 (+50.0%)"
 * formatChange(90, 100) // "-10 (-10.0%)"
 */
export function formatChange(current, previous, format = 'number') {
  if (!previous || previous === 0) return 'N/A';

  const diff = current - previous;
  const percentChange = ((diff / previous) * 100).toFixed(1);

  const sign = diff >= 0 ? '+' : '';
  const diffFormatted = format === 'number' ? formatNumber(diff) : diff.toFixed(1);

  return `${sign}${diffFormatted} (${sign}${percentChange}%)`;
}

export default {
  formatNumber,
  formatNumberCommas,
  formatPercent,
  formatCurrency,
  formatDate,
  formatMonth,
  formatQuarter,
  formatDuration,
  formatFileSize,
  formatGrowth,
  truncateText,
  formatChange
};
