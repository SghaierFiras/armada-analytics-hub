// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable Cypress's default behavior of failing on uncaught exceptions
// (useful during development when dealing with external scripts)
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // only log the error instead
  console.error('Uncaught exception:', err);

  // Don't fail tests on CSP violations or module loading issues during initial setup
  if (err.message.includes('CSP') || err.message.includes('Failed to load')) {
    return false;
  }

  return true;
});
