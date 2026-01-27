/**
 * Export Button Component
 * Reusable export button with dropdown menu
 */

import ExportService from '../utils/exportUtils.js';

/**
 * ExportButton Class
 * Generates HTML for export button with dropdown
 */
export class ExportButton {
  /**
   * Render export button
   * @param {object} config - Button configuration
   * @param {string} config.id - Button ID
   * @param {array} config.formats - Export formats to include (default: ['csv', 'xlsx', 'pdf', 'json'])
   * @param {string} config.label - Button label (default: 'Export')
   * @param {string} config.buttonClass - Additional button classes
   * @returns {string} HTML string
   */
  static render(config = {}) {
    const {
      id = 'exportBtn',
      formats = ['csv', 'xlsx', 'pdf', 'json'],
      label = 'Export',
      buttonClass = ''
    } = config;

    const formatIcons = {
      csv: '📊',
      xlsx: '📈',
      pdf: '📄',
      json: '💾'
    };

    const formatLabels = {
      csv: 'Export as CSV',
      xlsx: 'Export as Excel',
      pdf: 'Export as PDF',
      json: 'Export as JSON'
    };

    const menuItems = formats.map(format => {
      return `
        <button
          class="export-menu-item"
          data-format="${format}"
          title="${formatLabels[format]}"
        >
          <span class="format-icon">${formatIcons[format]}</span>
          <span class="format-label">${format.toUpperCase()}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="export-container">
        <button id="${id}" class="btn-export ${buttonClass}">
          <span class="export-icon">⬇</span>
          <span class="export-label">${label}</span>
        </button>
        <div id="${id}-menu" class="export-menu">
          ${menuItems}
        </div>
      </div>
    `;
  }

  /**
   * Initialize export button event listeners
   * @param {string} buttonId - Button ID
   * @param {Function} onExport - Callback when export is triggered (format)
   */
  static init(buttonId, onExport) {
    const button = document.getElementById(buttonId);
    const menu = document.getElementById(`${buttonId}-menu`);

    if (!button || !menu) {
      console.error(`Export button or menu not found: ${buttonId}`);
      return;
    }

    // Toggle menu on button click
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    // Handle menu item clicks
    menu.addEventListener('click', (e) => {
      e.stopPropagation();

      const menuItem = e.target.closest('.export-menu-item');
      if (menuItem) {
        const format = menuItem.getAttribute('data-format');
        menu.classList.remove('active');

        if (onExport && typeof onExport === 'function') {
          onExport(format);
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('active');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        menu.classList.remove('active');
      }
    });
  }

  /**
   * Create export handler for a page
   * @param {string} pageName - Page name
   * @param {Function} getExportData - Function that returns export configuration
   * @returns {Function} Export handler function
   *
   * @example
   * const exportHandler = ExportButton.createExportHandler('merchants', (format) => {
   *   return {
   *     title: 'Merchant Analytics Report',
   *     filename: 'merchant-analytics',
   *     data: merchantData,
   *     filters: appState.getFilters('merchants'),
   *     sections: [...]
   *   };
   * });
   *
   * ExportButton.init('exportBtn', exportHandler);
   */
  static createExportHandler(pageName, getExportData) {
    return (format) => {
      try {
        const exportConfig = getExportData(format);

        if (!exportConfig) {
          console.error('Export configuration not provided');
          return;
        }

        ExportService.export({
          ...exportConfig,
          format
        });

        // Show success notification
        this.showNotification('Export successful', 'success');
      } catch (error) {
        console.error('Export failed:', error);
        this.showNotification('Export failed: ' + error.message, 'error');
      }
    };
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  static showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Hide and remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Disable export button
   * @param {string} buttonId - Button ID
   */
  static disable(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
      button.classList.add('disabled');
    }
  }

  /**
   * Enable export button
   * @param {string} buttonId - Button ID
   */
  static enable(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = false;
      button.classList.remove('disabled');
    }
  }

  /**
   * Update button label
   * @param {string} buttonId - Button ID
   * @param {string} label - New label
   */
  static updateLabel(buttonId, label) {
    const button = document.getElementById(buttonId);
    if (button) {
      const labelEl = button.querySelector('.export-label');
      if (labelEl) {
        labelEl.textContent = label;
      }
    }
  }
}

export default ExportButton;
