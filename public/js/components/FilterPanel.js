/**
 * Filter Panel Component
 * Reusable filter panel with event handling
 */

/**
 * FilterPanel Class
 * Generates HTML for filter panels with consistent styling
 */
export class FilterPanel {
  /**
   * Render a filter panel
   * @param {object} config - Panel configuration
   * @param {string} config.id - Panel ID
   * @param {array} config.filters - Array of filter configurations
   * @param {Function} config.onChange - Callback when filter changes
   * @returns {string} HTML string
   */
  static render(config) {
    const { id, filters, onChange } = config;

    const filtersHTML = filters.map(filter => {
      return this.renderFilter(filter);
    }).join('');

    return `
      <div class="filter-panel" id="${id}">
        <div class="filter-header">
          <h3>Filters</h3>
          <button class="btn-reset" data-action="reset-filters">Reset</button>
        </div>
        <div class="filter-controls">
          ${filtersHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render a single filter
   * @param {object} filter - Filter configuration
   * @param {string} filter.type - Filter type (select, input, date, range)
   * @param {string} filter.id - Filter ID
   * @param {string} filter.label - Filter label
   * @param {array} filter.options - Options for select filter
   * @param {any} filter.value - Current value
   * @returns {string} HTML string
   */
  static renderFilter(filter) {
    const { type, id, label, options = [], value = '', placeholder = '' } = filter;

    let inputHTML = '';

    switch (type) {
      case 'select':
        const optionsHTML = options.map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const selected = optValue === value ? 'selected' : '';
          return `<option value="${optValue}" ${selected}>${optLabel}</option>`;
        }).join('');

        inputHTML = `
          <select id="${id}" class="filter-select" data-filter="${id}">
            ${optionsHTML}
          </select>
        `;
        break;

      case 'input':
        inputHTML = `
          <input
            type="text"
            id="${id}"
            class="filter-input"
            data-filter="${id}"
            value="${value}"
            placeholder="${placeholder}"
          />
        `;
        break;

      case 'date':
        inputHTML = `
          <input
            type="date"
            id="${id}"
            class="filter-date"
            data-filter="${id}"
            value="${value}"
          />
        `;
        break;

      case 'range':
        const { min = 0, max = 100, step = 1 } = filter;
        inputHTML = `
          <div class="filter-range-container">
            <input
              type="range"
              id="${id}"
              class="filter-range"
              data-filter="${id}"
              min="${min}"
              max="${max}"
              step="${step}"
              value="${value || min}"
            />
            <span class="range-value" id="${id}-value">${value || min}</span>
          </div>
        `;
        break;

      case 'checkbox':
        const checked = value ? 'checked' : '';
        inputHTML = `
          <label class="filter-checkbox">
            <input
              type="checkbox"
              id="${id}"
              data-filter="${id}"
              ${checked}
            />
            <span class="checkbox-label">${filter.checkboxLabel || ''}</span>
          </label>
        `;
        break;

      default:
        inputHTML = `<span>Unknown filter type: ${type}</span>`;
    }

    return `
      <div class="filter-group">
        <label class="filter-label" for="${id}">${label}</label>
        ${inputHTML}
      </div>
    `;
  }

  /**
   * Initialize filter panel event listeners
   * @param {string} panelId - Panel ID
   * @param {Function} onChange - Callback when filter changes
   */
  static init(panelId, onChange) {
    const panel = document.getElementById(panelId);
    if (!panel) {
      console.error(`Filter panel not found: ${panelId}`);
      return;
    }

    // Handle filter changes
    panel.addEventListener('change', (e) => {
      if (e.target.hasAttribute('data-filter')) {
        const filterId = e.target.getAttribute('data-filter');
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else if (e.target.type === 'range') {
          value = e.target.value;
          // Update range value display
          const valueDisplay = document.getElementById(`${filterId}-value`);
          if (valueDisplay) {
            valueDisplay.textContent = value;
          }
        } else {
          value = e.target.value;
        }

        if (onChange && typeof onChange === 'function') {
          onChange(filterId, value);
        }
      }
    });

    // Handle reset button
    const resetBtn = panel.querySelector('[data-action="reset-filters"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Reset all filters to default values
        const filters = panel.querySelectorAll('[data-filter]');
        filters.forEach(filter => {
          if (filter.type === 'checkbox') {
            filter.checked = false;
          } else if (filter.type === 'range') {
            filter.value = filter.min;
            const valueDisplay = document.getElementById(`${filter.id}-value`);
            if (valueDisplay) {
              valueDisplay.textContent = filter.min;
            }
          } else if (filter.tagName === 'SELECT') {
            filter.selectedIndex = 0;
          } else {
            filter.value = '';
          }
        });

        // Trigger change event
        if (onChange && typeof onChange === 'function') {
          onChange('reset', null);
        }
      });
    }
  }

  /**
   * Get current filter values
   * @param {string} panelId - Panel ID
   * @returns {object} Filter values
   */
  static getValues(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return {};

    const values = {};
    const filters = panel.querySelectorAll('[data-filter]');

    filters.forEach(filter => {
      const filterId = filter.getAttribute('data-filter');
      if (filter.type === 'checkbox') {
        values[filterId] = filter.checked;
      } else if (filter.type === 'range') {
        values[filterId] = parseFloat(filter.value);
      } else {
        values[filterId] = filter.value;
      }
    });

    return values;
  }

  /**
   * Set filter values
   * @param {string} panelId - Panel ID
   * @param {object} values - Filter values to set
   */
  static setValues(panelId, values) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    Object.entries(values).forEach(([filterId, value]) => {
      const filter = panel.querySelector(`[data-filter="${filterId}"]`);
      if (!filter) return;

      if (filter.type === 'checkbox') {
        filter.checked = value;
      } else if (filter.type === 'range') {
        filter.value = value;
        const valueDisplay = document.getElementById(`${filterId}-value`);
        if (valueDisplay) {
          valueDisplay.textContent = value;
        }
      } else {
        filter.value = value;
      }
    });
  }

  /**
   * Disable all filters in panel
   * @param {string} panelId - Panel ID
   */
  static disable(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const filters = panel.querySelectorAll('[data-filter]');
    filters.forEach(filter => {
      filter.disabled = true;
    });
  }

  /**
   * Enable all filters in panel
   * @param {string} panelId - Panel ID
   */
  static enable(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const filters = panel.querySelectorAll('[data-filter]');
    filters.forEach(filter => {
      filter.disabled = false;
    });
  }
}

export default FilterPanel;
