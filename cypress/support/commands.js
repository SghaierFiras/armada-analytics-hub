// ***********************************************
// Custom commands for Armada Analytics Dashboard
// ***********************************************

/**
 * Login command - bypasses Slack OAuth for testing
 * Uses session cookie or direct navigation to authenticated page
 */
Cypress.Commands.add('login', () => {
  // Option 1: If you have a test user session, restore it
  // cy.session('user', () => {
  //   cy.visit('/login');
  //   // Perform OAuth flow or set cookies
  // });

  // Option 2: Visit authenticated endpoint directly
  // This assumes your server allows direct access after first auth
  cy.visit('/', { failOnStatusCode: false });

  // Wait for redirect to complete (if OAuth redirects)
  cy.url().then((url) => {
    if (url.includes('/login')) {
      cy.log('⚠️  Redirected to login - OAuth required');
      cy.log('For automated testing, consider adding a test auth bypass');
    }
  });
});

/**
 * Wait for app to initialize
 */
Cypress.Commands.add('waitForApp', () => {
  // Wait for the analytics app to be available
  cy.window().should('have.property', 'analyticsApp');

  // Wait for initialization message in console
  cy.window().its('analyticsApp').should('exist');

  // Give modules time to load
  cy.wait(1000);
});

/**
 * Check console for errors
 */
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    // Get console errors from window
    const errors = win.console._errors || [];

    // Filter out expected errors
    const criticalErrors = errors.filter(err => {
      const errStr = String(err);
      return !errStr.includes('CSP') &&
             !errStr.includes('favicon') &&
             !errStr.includes('sourcemap');
    });

    if (criticalErrors.length > 0) {
      cy.log('Console Errors:', criticalErrors);
    }

    expect(criticalErrors).to.have.length(0);
  });
});

/**
 * Navigate to page using window.navigateTo
 */
Cypress.Commands.add('navigateToPage', (pageName) => {
  cy.window().then((win) => {
    expect(win.navigateTo).to.be.a('function');
    win.navigateTo(pageName);
  });

  // Wait for navigation to complete
  cy.wait(500);

  // Verify URL hash
  cy.hash().should('include', pageName);
});

/**
 * Verify page is visible
 */
Cypress.Commands.add('verifyPageVisible', (pageId) => {
  cy.get(`#${pageId}`)
    .should('exist')
    .and('be.visible')
    .and('have.class', 'page');
});

/**
 * Verify active navigation item
 */
Cypress.Commands.add('verifyActiveNav', (pageName) => {
  cy.get(`[data-page="${pageName}"]`)
    .should('have.class', 'active');
});

/**
 * Check if charts are rendered
 */
Cypress.Commands.add('verifyChartsRendered', (canvasIds) => {
  canvasIds.forEach(id => {
    cy.get(`#${id}`)
      .should('exist')
      .and('be.visible');
  });
});
