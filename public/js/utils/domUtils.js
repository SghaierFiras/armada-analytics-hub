/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Show element(s)
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 */
export function show(selector) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.style.display = 'block';
  });
}

/**
 * Hide element(s)
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 */
export function hide(selector) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Toggle element visibility
 * @param {string|HTMLElement} selector - Element or selector
 */
export function toggle(selector) {
  const element = getElement(selector);
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Update text content of element
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} text - Text content
 */
export function setText(selector, text) {
  const element = getElement(selector);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Update HTML content of element
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} html - HTML content
 */
export function setHTML(selector, html) {
  const element = getElement(selector);
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Add class to element(s)
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @param {string} className - Class name to add
 */
export function addClass(selector, className) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.classList.add(className);
  });
}

/**
 * Remove class from element(s)
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @param {string} className - Class name to remove
 */
export function removeClass(selector, className) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.classList.remove(className);
  });
}

/**
 * Toggle class on element(s)
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @param {string} className - Class name to toggle
 */
export function toggleClass(selector, className) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.classList.toggle(className);
  });
}

/**
 * Check if element has class
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
export function hasClass(selector, className) {
  const element = getElement(selector);
  return element ? element.classList.contains(className) : false;
}

/**
 * Get element value (for inputs)
 * @param {string|HTMLElement} selector - Element or selector
 * @returns {string}
 */
export function getValue(selector) {
  const element = getElement(selector);
  return element ? element.value : '';
}

/**
 * Set element value (for inputs)
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} value - Value to set
 */
export function setValue(selector, value) {
  const element = getElement(selector);
  if (element) {
    element.value = value;
  }
}

/**
 * Get element attribute
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} attrName - Attribute name
 * @returns {string}
 */
export function getAttribute(selector, attrName) {
  const element = getElement(selector);
  return element ? element.getAttribute(attrName) : null;
}

/**
 * Set element attribute
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} attrName - Attribute name
 * @param {string} value - Attribute value
 */
export function setAttribute(selector, attrName, value) {
  const element = getElement(selector);
  if (element) {
    element.setAttribute(attrName, value);
  }
}

/**
 * Remove element attribute
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} attrName - Attribute name
 */
export function removeAttribute(selector, attrName) {
  const element = getElement(selector);
  if (element) {
    element.removeAttribute(attrName);
  }
}

/**
 * Add event listener
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function on(selector, event, handler) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.addEventListener(event, handler);
  });
}

/**
 * Remove event listener
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function off(selector, event, handler) {
  const elements = getElements(selector);
  elements.forEach(el => {
    el.removeEventListener(event, handler);
  });
}

/**
 * Create element
 * @param {string} tag - HTML tag name
 * @param {object} options - Element options (className, id, attributes, etc.)
 * @param {string} content - Text or HTML content
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}, content = '') {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.id) {
    element.id = options.id;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options.styles) {
    Object.entries(options.styles).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }

  if (content) {
    if (options.html) {
      element.innerHTML = content;
    } else {
      element.textContent = content;
    }
  }

  return element;
}

/**
 * Append child element
 * @param {string|HTMLElement} parentSelector - Parent element or selector
 * @param {HTMLElement} child - Child element to append
 */
export function append(parentSelector, child) {
  const parent = getElement(parentSelector);
  if (parent && child) {
    parent.appendChild(child);
  }
}

/**
 * Remove element
 * @param {string|HTMLElement} selector - Element or selector
 */
export function remove(selector) {
  const element = getElement(selector);
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Clear element content
 * @param {string|HTMLElement} selector - Element or selector
 */
export function clear(selector) {
  const element = getElement(selector);
  if (element) {
    element.innerHTML = '';
  }
}

/**
 * Show loading spinner in element
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} message - Loading message (optional)
 */
export function showLoading(selector, message = 'Loading...') {
  const element = getElement(selector);
  if (element) {
    element.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Show error message in element
 * @param {string|HTMLElement} selector - Element or selector
 * @param {string} message - Error message
 */
export function showError(selector, message) {
  const element = getElement(selector);
  if (element) {
    element.innerHTML = `
      <div class="error-container">
        <p class="error-message">${message}</p>
      </div>
    `;
  }
}

/**
 * Scroll to element
 * @param {string|HTMLElement} selector - Element or selector
 * @param {object} options - Scroll options
 */
export function scrollTo(selector, options = { behavior: 'smooth', block: 'start' }) {
  const element = getElement(selector);
  if (element) {
    element.scrollIntoView(options);
  }
}

// ============= HELPER FUNCTIONS =============

/**
 * Get single element
 * @param {string|HTMLElement} selector - Element or selector
 * @returns {HTMLElement|null}
 */
function getElement(selector) {
  if (typeof selector === 'string') {
    return document.querySelector(selector);
  }
  return selector instanceof HTMLElement ? selector : null;
}

/**
 * Get multiple elements
 * @param {string|HTMLElement|HTMLElement[]} selector - Element(s) or selector
 * @returns {HTMLElement[]}
 */
function getElements(selector) {
  if (typeof selector === 'string') {
    return Array.from(document.querySelectorAll(selector));
  }
  if (Array.isArray(selector)) {
    return selector.filter(el => el instanceof HTMLElement);
  }
  if (selector instanceof HTMLElement) {
    return [selector];
  }
  return [];
}

export default {
  show,
  hide,
  toggle,
  setText,
  setHTML,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  getValue,
  setValue,
  getAttribute,
  setAttribute,
  removeAttribute,
  on,
  off,
  createElement,
  append,
  remove,
  clear,
  showLoading,
  showError,
  scrollTo
};
