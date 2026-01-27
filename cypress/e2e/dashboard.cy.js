/**
 * Armada Analytics Dashboard - E2E Tests
 * Tests navigation, page transitions, and interactive elements
 */

describe('Analytics Dashboard', () => {
  beforeEach(() => {
    // Visit the application
    cy.login();
    cy.waitForApp();
  });

  describe('Application Initialization', () => {
    it('should load the application successfully', () => {
      cy.title().should('include', 'Analytics');

      // Verify main elements exist
      cy.get('#sidebar').should('exist');
      cy.get('.nav-menu').should('exist');
      cy.get('.page').should('exist');
    });

    it('should initialize window.analyticsApp', () => {
      cy.window().should('have.property', 'analyticsApp');

      cy.window().its('analyticsApp').should('be.an', 'object');
      cy.window().its('analyticsApp.pages').should('be.an', 'object');
    });

    it('should have all 5 page modules loaded', () => {
      cy.window().then((win) => {
        expect(win.analyticsApp.pages).to.have.property('home');
        expect(win.analyticsApp.pages).to.have.property('merchants');
        expect(win.analyticsApp.pages).to.have.property('orders');
        expect(win.analyticsApp.pages).to.have.property('performance');
        expect(win.analyticsApp.pages).to.have.property('orderingBehavior');
      });
    });

    it('should expose navigateTo function globally', () => {
      cy.window().its('navigateTo').should('be.a', 'function');
    });

    it('should not have CSP violations', () => {
      // Check that no CSP errors appear in console
      cy.window().then((win) => {
        const errors = [];
        const originalError = win.console.error;
        win.console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(win.console, args);
        };

        // Wait a bit for any errors to surface
        cy.wait(1000).then(() => {
          const cspErrors = errors.filter(e => e.includes('Content Security Policy'));
          expect(cspErrors).to.have.length(0);
        });
      });
    });
  });

  describe('Navigation System', () => {
    it('should have data-page attributes on all navigation items', () => {
      cy.get('[data-page="home"]').should('exist');
      cy.get('[data-page="performance"]').should('exist');
      cy.get('[data-page="merchants"]').should('exist');
      cy.get('[data-page="orders"]').should('exist');
      cy.get('[data-page="orderingBehavior"]').should('exist');
    });

    it('should navigate to home page by default', () => {
      cy.verifyPageVisible('home');
      cy.verifyActiveNav('home');
      cy.hash().should('be.empty').or('include', 'home');
    });

    it('should navigate to merchants page', () => {
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);

      cy.verifyPageVisible('merchants');
      cy.verifyActiveNav('merchants');
      cy.hash().should('include', 'merchants');
    });

    it('should navigate to orders page', () => {
      cy.get('[data-page="orders"]').click();
      cy.wait(500);

      cy.verifyPageVisible('orders');
      cy.verifyActiveNav('orders');
      cy.hash().should('include', 'orders');
    });

    it('should navigate to performance page', () => {
      cy.get('[data-page="performance"]').click();
      cy.wait(500);

      cy.verifyPageVisible('performance');
      cy.verifyActiveNav('performance');
      cy.hash().should('include', 'performance');
    });

    it('should navigate to ordering behavior page', () => {
      cy.get('[data-page="orderingBehavior"]').click();
      cy.wait(500);

      cy.verifyPageVisible('orderingBehavior');
      cy.verifyActiveNav('orderingBehavior');
      cy.hash().should('include', 'orderingBehavior');
    });

    it('should navigate through all pages sequentially', () => {
      const pages = [
        { name: 'home', id: 'home' },
        { name: 'performance', id: 'performance' },
        { name: 'merchants', id: 'merchants' },
        { name: 'orders', id: 'orders' },
        { name: 'orderingBehavior', id: 'orderingBehavior' }
      ];

      pages.forEach(page => {
        cy.get(`[data-page="${page.name}"]`).click();
        cy.wait(500);
        cy.verifyPageVisible(page.id);
        cy.verifyActiveNav(page.name);
      });
    });

    it('should update URL hash on navigation', () => {
      cy.get('[data-page="merchants"]').click();
      cy.hash().should('include', 'merchants');

      cy.get('[data-page="orders"]').click();
      cy.hash().should('include', 'orders');

      cy.get('[data-page="home"]').click();
      cy.hash().should('include', 'home');
    });

    it('should support browser back/forward navigation', () => {
      // Navigate to merchants
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);
      cy.hash().should('include', 'merchants');

      // Navigate to orders
      cy.get('[data-page="orders"]').click();
      cy.wait(500);
      cy.hash().should('include', 'orders');

      // Go back
      cy.go('back');
      cy.wait(500);
      cy.hash().should('include', 'merchants');
      cy.verifyPageVisible('merchants');

      // Go forward
      cy.go('forward');
      cy.wait(500);
      cy.hash().should('include', 'orders');
      cy.verifyPageVisible('orders');
    });

    it('should navigate using window.navigateTo', () => {
      cy.navigateToPage('merchants');
      cy.verifyPageVisible('merchants');

      cy.navigateToPage('orderingBehavior');
      cy.verifyPageVisible('orderingBehavior');

      cy.navigateToPage('home');
      cy.verifyPageVisible('home');
    });
  });

  describe('Ordering Behavior Page', () => {
    beforeEach(() => {
      cy.get('[data-page="orderingBehavior"]').click();
      cy.wait(1000); // Wait for data to load
    });

    it('should display ordering behavior page', () => {
      cy.verifyPageVisible('orderingBehavior');

      // Verify page header
      cy.get('#orderingBehavior .page-header h1')
        .should('contain', 'Ordering Behavior Analysis');
    });

    it('should display stat cards', () => {
      cy.get('#behaviorTotalOrders').should('exist').and('not.be.empty');
      cy.get('#behaviorPeakPeriod').should('exist').and('not.be.empty');
      cy.get('#behaviorAvgAmount').should('exist').and('not.be.empty');
      cy.get('#behaviorTopMerchant').should('exist').and('not.be.empty');
    });

    it('should render all charts', () => {
      const chartIds = [
        'behaviorOrdersChart',
        'behaviorPieChart',
        'behaviorAvgChart',
        'behaviorTopMerchantsChart',
        'behaviorMerchantPerformanceChart'
      ];

      cy.verifyChartsRendered(chartIds);
    });

    it('should display merchants table', () => {
      cy.get('#behaviorMerchantsTable')
        .should('exist')
        .find('tr')
        .should('have.length.greaterThan', 0);
    });

    it('should have period selector filter', () => {
      cy.get('#behaviorPeriodSelector')
        .should('exist')
        .and('be.visible');
    });

    it('should have merchant search input', () => {
      cy.get('#behaviorMerchantSearch')
        .should('exist')
        .and('be.visible')
        .and('have.attr', 'placeholder');
    });

    it('should filter merchants by search', () => {
      // Type in search box
      cy.get('#behaviorMerchantSearch')
        .type('test')
        .wait(500);

      // Table should update (or show no results)
      cy.get('#behaviorMerchantDetailsTable').should('exist');
    });

    it('should change period selector', () => {
      // Select a period
      cy.get('#behaviorPeriodSelector')
        .select('Lunch (11:00 AM-3:00 PM)')
        .wait(500);

      // Table should update
      cy.get('#behaviorMerchantsTable').should('exist');
    });

    it('should export ordering behavior data', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        expect(page.getExportData).to.be.a('function');

        const exportData = page.getExportData('csv');
        expect(exportData).to.have.property('title');
        expect(exportData).to.have.property('sections');
      });
    });
  });

  describe('Page Content Rendering', () => {
    it('should render home page content', () => {
      cy.get('[data-page="home"]').click();
      cy.wait(500);

      cy.get('#home').should('be.visible');
      cy.get('#home .page-header').should('exist');
    });

    it('should render merchants page content', () => {
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);

      cy.get('#merchants').should('be.visible');
      cy.get('#merchants .page-header').should('exist');
    });

    it('should render orders page content', () => {
      cy.get('[data-page="orders"]').click();
      cy.wait(500);

      cy.get('#orders').should('be.visible');
      cy.get('#orders .page-header').should('exist');
    });

    it('should render performance page content', () => {
      cy.get('[data-page="performance"]').click();
      cy.wait(500);

      cy.get('#performance').should('be.visible');
      cy.get('#performance .page-header').should('exist');
    });
  });

  describe('Filter Functionality', () => {
    it('should have filter panels on merchants page', () => {
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);

      cy.get('#merchantsFilters').should('exist');
    });

    it('should have filter panels on orders page', () => {
      cy.get('[data-page="orders"]').click();
      cy.wait(500);

      cy.get('#ordersFilters').should('exist');
    });

    it('should have filter panels on performance page', () => {
      cy.get('[data-page="performance"]').click();
      cy.wait(500);

      cy.get('#performanceFilters').should('exist');
    });

    it('should have filter panels on ordering behavior page', () => {
      cy.get('[data-page="orderingBehavior"]').click();
      cy.wait(500);

      cy.get('#orderingBehaviorFilters').should('exist');
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', () => {
      cy.get('#exportContainer').should('exist');
      cy.get('#exportBtn').should('exist');
    });

    it('should verify all pages support export', () => {
      cy.window().then((win) => {
        const pages = win.analyticsApp.pages;

        Object.keys(pages).forEach(pageName => {
          expect(pages[pageName].getExportData).to.be.a('function');
        });
      });
    });

    it('should call export for current page', () => {
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);

      cy.window().then((win) => {
        const page = win.analyticsApp.pages.merchants;
        const exportData = page.getExportData('csv');

        expect(exportData).to.be.an('object');
        expect(exportData).to.have.property('title');
        expect(exportData).to.have.property('filename');
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should work after page refresh', () => {
      cy.get('[data-page="merchants"]').click();
      cy.wait(500);
      cy.hash().should('include', 'merchants');

      cy.reload();
      cy.waitForApp();

      // Should maintain page or redirect
      cy.get('#sidebar').should('exist');
      cy.window().should('have.property', 'analyticsApp');
    });

    it('should handle direct URL with hash', () => {
      cy.visit('/#merchants');
      cy.waitForApp();

      // Should navigate to merchants page
      cy.wait(1000);
      cy.hash().should('include', 'merchants');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid page navigation gracefully', () => {
      cy.window().then((win) => {
        // Try to navigate to non-existent page
        win.navigateTo('nonexistent');

        // Should log error but not crash
        cy.wait(500);
        cy.window().should('have.property', 'analyticsApp');
      });
    });

    it('should not have undefined errors in console', () => {
      cy.window().then((win) => {
        const errors = [];
        const originalError = win.console.error;
        win.console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(win.console, args);
        };

        // Navigate through pages
        cy.get('[data-page="merchants"]').click();
        cy.wait(500);
        cy.get('[data-page="orderingBehavior"]').click();
        cy.wait(500);

        cy.then(() => {
          const undefinedErrors = errors.filter(e =>
            e.includes('undefined') || e.includes('not defined')
          );
          expect(undefinedErrors).to.have.length(0);
        });
      });
    });
  });

  describe('Performance', () => {
    it('should load pages within acceptable time', () => {
      const maxLoadTime = 3000; // 3 seconds

      const pages = ['home', 'merchants', 'orders', 'performance', 'orderingBehavior'];

      pages.forEach(page => {
        const start = Date.now();

        cy.get(`[data-page="${page}"]`).click();
        cy.wait(500);
        cy.verifyPageVisible(page);

        cy.then(() => {
          const loadTime = Date.now() - start;
          expect(loadTime).to.be.lessThan(maxLoadTime);
        });
      });
    });
  });
});
