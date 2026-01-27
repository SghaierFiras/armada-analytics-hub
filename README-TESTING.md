# Armada Analytics - Cypress Testing Guide

## Setup

### 1. Install Cypress and Dependencies

```bash
npm install --save-dev cypress start-server-and-test
```

### 2. Verify Installation

```bash
npx cypress verify
```

## Running Tests

### Interactive Mode (Cypress UI)

**Start server and open Cypress:**
```bash
npm run test:e2e:open
```

This will:
1. Start your Node server on port 3000
2. Open Cypress Test Runner UI
3. You can click on tests to run them interactively

**Or run separately:**
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Open Cypress
npm run cypress:open
```

### Headless Mode (CI/CD)

**Run all tests headlessly:**
```bash
npm run test:e2e
```

**Or run specific test file:**
```bash
npx cypress run --spec "cypress/e2e/dashboard.cy.js"
npx cypress run --spec "cypress/e2e/ordering-behavior-detailed.cy.js"
```

**Run with specific browser:**
```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

## Test Files

### 1. `dashboard.cy.js` - Main Dashboard Tests
Comprehensive tests covering:
- Application initialization
- Navigation system (all 5 pages)
- Page content rendering
- Filter functionality
- Export functionality
- Browser compatibility
- Error handling
- Performance

**Run only dashboard tests:**
```bash
npx cypress run --spec "cypress/e2e/dashboard.cy.js"
```

### 2. `ordering-behavior-detailed.cy.js` - Ordering Behavior Specific Tests
Detailed tests for the orderingBehavior page:
- CSV data loading
- Data processing
- Stat cards
- All 5 charts
- Tables rendering
- Period filters
- Merchant search
- Rank filters
- Export functionality
- Data integrity

**Run only ordering behavior tests:**
```bash
npx cypress run --spec "cypress/e2e/ordering-behavior-detailed.cy.js"
```

## Authentication Notes

### Current Setup
The tests use a custom `cy.login()` command that attempts to visit the authenticated page directly.

### For Production Testing
You may need to:

1. **Mock Slack OAuth** - Add a test bypass route in development:
   ```javascript
   // In auth-server.js (development only)
   if (process.env.NODE_ENV === 'development') {
     app.get('/test-login', (req, res) => {
       req.session.user = { /* test user */ };
       res.redirect('/');
     });
   }
   ```

2. **Use Real Auth** - Update `cypress/support/commands.js`:
   ```javascript
   Cypress.Commands.add('login', () => {
     cy.visit('/test-login'); // Your test login route
     cy.wait(1000);
   });
   ```

3. **Session Persistence** - Use cy.session() for faster tests:
   ```javascript
   cy.session('user-session', () => {
     // Login once, reuse session
   });
   ```

## Debugging

### View Test Videos
After running tests headlessly, videos are saved to:
```
cypress/videos/
```

### View Screenshots
Failed tests automatically capture screenshots:
```
cypress/screenshots/
```

### Open Cypress DevTools
In interactive mode:
1. Click on a test
2. Chrome DevTools opens automatically
3. See console logs, network requests, etc.

### Enable Debug Logs
```bash
DEBUG=cypress:* npx cypress run
```

## Custom Commands

### Navigation
```javascript
cy.navigateToPage('merchants') // Navigate using window.navigateTo
cy.verifyPageVisible('merchants') // Verify page is visible
cy.verifyActiveNav('merchants') // Verify sidebar item is active
```

### App Initialization
```javascript
cy.waitForApp() // Wait for window.analyticsApp to be ready
```

### Charts
```javascript
cy.verifyChartsRendered(['chartId1', 'chartId2']) // Verify charts exist
```

## Test Coverage

### ✅ Covered Features
- All 5 page navigation (home, merchants, orders, performance, orderingBehavior)
- Data-page attribute navigation
- URL hash updates
- Browser back/forward buttons
- Page content rendering
- Stat cards
- All charts (5 in ordering behavior page)
- Tables
- Filters (period, search, rank)
- Export functionality
- Error handling
- CSP compliance
- Module loading

### 📋 Additional Tests to Add
- Real Slack OAuth flow
- API endpoint testing
- Database operations
- Mobile responsive design
- Accessibility (a11y)
- Load testing

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/cypress.yml`:

```yaml
name: Cypress Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
          browser: chrome

      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

## Troubleshooting

### Tests Fail with "navigateTo is not defined"
**Solution**: Ensure app initializes before running tests. Increase wait time in `cy.waitForApp()`.

### Charts Don't Render
**Solution**: Charts may need data to load. Increase wait time after navigation.

### CSP Violations
**Solution**: We've fixed inline onclick handlers. If issues persist, check `security.js` CSP config.

### Module Loading Errors
**Solution**: Verify all ES6 modules are accessible at `/js/` path.

### Port 3000 Already in Use
**Solution**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use data-* attributes** - Better than CSS selectors for test stability
3. **Avoid hard waits** - Use cy.wait() sparingly, prefer assertions
4. **Clean up after tests** - Reset state between tests
5. **Use custom commands** - Reuse common operations
6. **Test user flows** - Not just individual features
7. **Add meaningful assertions** - Test behavior, not implementation

## Results Interpretation

### Passed Tests ✅
- All features working as expected
- Ready for deployment

### Failed Tests ❌
- Check video/screenshot
- Review console logs
- Debug in interactive mode
- Fix issue and re-run

### Flaky Tests ⚠️
- May need better waits
- Could indicate race conditions
- Needs investigation

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands)
- [CI/CD Integration](https://docs.cypress.io/guides/continuous-integration/introduction)
