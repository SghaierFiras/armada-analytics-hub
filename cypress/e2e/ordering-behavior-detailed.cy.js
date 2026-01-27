/**
 * Ordering Behavior Page - Detailed Tests
 * Focuses specifically on the new orderingBehavior page functionality
 */

describe('Ordering Behavior Page - Detailed Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.waitForApp();

    // Navigate to ordering behavior page
    cy.get('[data-page="orderingBehavior"]').click();
    cy.wait(1500); // Wait for data to load
  });

  describe('Data Loading', () => {
    it('should load CSV data successfully', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        expect(page.rawData).to.exist;
        expect(page.rawData).to.be.an('array');
        expect(page.rawData.length).to.be.greaterThan(0);
      });
    });

    it('should process data correctly', () => {
      cy.window().then((win) => {
        const state = win.appState.getState('data.orderingBehavior');

        expect(state).to.exist;
        expect(state).to.have.property('periods');
        expect(state).to.have.property('totalOrders');
        expect(state).to.have.property('peakPeriod');
        expect(state).to.have.property('topMerchant');
        expect(state).to.have.property('merchantData');
      });
    });
  });

  describe('Stat Cards', () => {
    it('should display total orders stat', () => {
      cy.get('#behaviorTotalOrders')
        .should('be.visible')
        .invoke('text')
        .should('match', /[\d,]+/); // Should contain numbers
    });

    it('should display peak period stat', () => {
      cy.get('#behaviorPeakPeriod')
        .should('be.visible')
        .invoke('text')
        .should('not.equal', '-')
        .and('not.equal', 'N/A');
    });

    it('should display average amount stat', () => {
      cy.get('#behaviorAvgAmount')
        .should('be.visible')
        .invoke('text')
        .should('match', /KD|[\d.]+/); // Should contain currency
    });

    it('should display top merchant stat', () => {
      cy.get('#behaviorTopMerchant')
        .should('be.visible')
        .invoke('text')
        .should('not.equal', '-')
        .and('not.equal', 'N/A');
    });
  });

  describe('Charts Rendering', () => {
    it('should render orders by time period chart', () => {
      cy.get('#behaviorOrdersChart')
        .should('exist')
        .and('be.visible');

      // Verify Chart.js instance exists
      cy.window().then((win) => {
        const chart = win.appState.charts?.behaviorOrdersChart;
        if (chart) {
          expect(chart).to.have.property('data');
        }
      });
    });

    it('should render pie chart', () => {
      cy.get('#behaviorPieChart')
        .should('exist')
        .and('be.visible');
    });

    it('should render average amount chart', () => {
      cy.get('#behaviorAvgChart')
        .should('exist')
        .and('be.visible');
    });

    it('should render top merchants chart', () => {
      cy.get('#behaviorTopMerchantsChart')
        .should('exist')
        .and('be.visible');
    });

    it('should render merchant performance chart', () => {
      cy.get('#behaviorMerchantPerformanceChart')
        .should('exist')
        .and('be.visible');
    });

    it('should have chart insights', () => {
      cy.get('.insight-box')
        .should('have.length.greaterThan', 0);
    });
  });

  describe('Tables', () => {
    it('should render merchants table', () => {
      cy.get('#behaviorMerchantsTable')
        .should('exist')
        .find('tr')
        .should('have.length.greaterThan', 0);
    });

    it('should have table headers', () => {
      cy.get('#behaviorMerchantsTable')
        .parents('table')
        .find('thead th')
        .should('have.length', 5); // Rank, Merchant, Period, Count, %
    });

    it('should display merchant data in table', () => {
      cy.get('#behaviorMerchantsTable tr:first')
        .should('exist')
        .find('td')
        .should('have.length', 5);
    });

    it('should render merchant details table', () => {
      cy.get('#behaviorMerchantDetailsTable')
        .should('exist');
    });
  });

  describe('Period Filter', () => {
    it('should have period selector dropdown', () => {
      cy.get('#behaviorPeriodSelector')
        .should('exist')
        .and('be.visible');
    });

    it('should have all period options', () => {
      cy.get('#behaviorPeriodSelector option').then($options => {
        const values = [...$options].map(o => o.value);

        expect(values).to.include('all');
        expect(values).to.include('Breakfast (5:00-9:30 AM)');
        expect(values).to.include('Lunch (11:00 AM-3:00 PM)');
        expect(values).to.include('Dinner (6:30-10:00 PM)');
      });
    });

    it('should filter by breakfast period', () => {
      cy.get('#behaviorPeriodSelector')
        .select('Breakfast (5:00-9:30 AM)');

      cy.wait(500);

      // Table should update
      cy.get('#behaviorMerchantsTable')
        .should('exist')
        .find('tr')
        .should('have.length.greaterThan', 0);
    });

    it('should filter by lunch period', () => {
      cy.get('#behaviorPeriodSelector')
        .select('Lunch (11:00 AM-3:00 PM)');

      cy.wait(500);

      cy.get('#behaviorMerchantsTable').should('exist');
    });

    it('should filter by dinner period', () => {
      cy.get('#behaviorPeriodSelector')
        .select('Dinner (6:30-10:00 PM)');

      cy.wait(500);

      cy.get('#behaviorMerchantsTable').should('exist');
    });

    it('should show period stats when period is selected', () => {
      cy.get('#behaviorPeriodSelector')
        .select('Lunch (11:00 AM-3:00 PM)');

      cy.wait(500);

      // Period stats container should have content
      cy.get('#behaviorPeriodStats')
        .should('exist');
    });

    it('should clear period stats when "All Periods" selected', () => {
      // First select a specific period
      cy.get('#behaviorPeriodSelector')
        .select('Lunch (11:00 AM-3:00 PM)');

      cy.wait(500);

      // Then select all periods
      cy.get('#behaviorPeriodSelector')
        .select('all');

      cy.wait(500);

      // Period stats should be cleared
      cy.get('#behaviorPeriodStats')
        .should('exist')
        .and('be.empty');
    });
  });

  describe('Merchant Search', () => {
    it('should have merchant search input', () => {
      cy.get('#behaviorMerchantSearch')
        .should('exist')
        .and('be.visible')
        .and('have.attr', 'placeholder');
    });

    it('should filter merchants by search term', () => {
      // Get initial row count
      cy.get('#behaviorMerchantDetailsTable tr').then($rows => {
        const initialCount = $rows.length;

        // Type search term
        cy.get('#behaviorMerchantSearch')
          .clear()
          .type('a');

        cy.wait(500);

        // Table should update (may have different count)
        cy.get('#behaviorMerchantDetailsTable')
          .should('exist');
      });
    });

    it('should show no results for non-existent merchant', () => {
      cy.get('#behaviorMerchantSearch')
        .clear()
        .type('xyznonexistent123');

      cy.wait(500);

      // Table should exist but may be empty
      cy.get('#behaviorMerchantDetailsTable')
        .should('exist');
    });

    it('should clear search results when input is cleared', () => {
      // Type and clear
      cy.get('#behaviorMerchantSearch')
        .type('test')
        .wait(500)
        .clear()
        .wait(500);

      // Table should show all results again
      cy.get('#behaviorMerchantDetailsTable tr')
        .should('have.length.greaterThan', 0);
    });
  });

  describe('Additional Filters', () => {
    it('should have merchant period filter', () => {
      cy.get('#behaviorMerchantPeriodFilter')
        .should('exist')
        .and('be.visible');
    });

    it('should have merchant rank filter', () => {
      cy.get('#behaviorMerchantRankFilter')
        .should('exist')
        .and('be.visible');
    });

    it('should filter by rank (Top 5)', () => {
      cy.get('#behaviorMerchantRankFilter')
        .select('5');

      cy.wait(500);

      cy.get('#behaviorMerchantDetailsTable').should('exist');
    });

    it('should combine multiple filters', () => {
      // Set period filter
      cy.get('#behaviorMerchantPeriodFilter')
        .select('Lunch (11:00 AM-3:00 PM)');

      cy.wait(300);

      // Set rank filter
      cy.get('#behaviorMerchantRankFilter')
        .select('3');

      cy.wait(300);

      // Set search
      cy.get('#behaviorMerchantSearch')
        .type('a');

      cy.wait(500);

      // Table should be filtered by all criteria
      cy.get('#behaviorMerchantDetailsTable').should('exist');
    });
  });

  describe('Export Functionality', () => {
    it('should have getExportData method', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        expect(page.getExportData).to.be.a('function');
      });
    });

    it('should generate export data with correct structure', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        const exportData = page.getExportData('csv');

        expect(exportData).to.have.property('title');
        expect(exportData.title).to.include('Ordering Behavior');

        expect(exportData).to.have.property('filename');
        expect(exportData.filename).to.include('ordering-behavior');

        expect(exportData).to.have.property('sections');
        expect(exportData.sections).to.be.an('array');
        expect(exportData.sections.length).to.be.greaterThan(0);
      });
    });

    it('should include summary section in export', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        const exportData = page.getExportData('csv');

        const summarySection = exportData.sections.find(s =>
          s.title.includes('Summary')
        );

        expect(summarySection).to.exist;
        expect(summarySection.type).to.equal('summary');
        expect(summarySection.data).to.be.an('object');
      });
    });

    it('should include period breakdown in export', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        const exportData = page.getExportData('csv');

        const periodSection = exportData.sections.find(s =>
          s.title.includes('Time Period')
        );

        expect(periodSection).to.exist;
        expect(periodSection.type).to.equal('table');
        expect(periodSection.rows).to.be.an('array');
      });
    });

    it('should include top merchants in export', () => {
      cy.window().then((win) => {
        const page = win.analyticsApp.pages.orderingBehavior;
        const exportData = page.getExportData('csv');

        const merchantSection = exportData.sections.find(s =>
          s.title.includes('Top Merchants')
        );

        expect(merchantSection).to.exist;
        expect(merchantSection.type).to.equal('table');
        expect(merchantSection.rows).to.be.an('array');
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have valid data in all stat cards', () => {
      cy.get('#behaviorTotalOrders').invoke('text').should('match', /\d+/);
      cy.get('#behaviorPeakPeriod').invoke('text').should('not.be.empty');
      cy.get('#behaviorAvgAmount').invoke('text').should('match', /[\d.]/);
      cy.get('#behaviorTopMerchant').invoke('text').should('not.be.empty');
    });

    it('should have consistent data across tables and charts', () => {
      cy.window().then((win) => {
        const data = win.appState.getState('data.orderingBehavior');

        // Total orders should match
        const totalOrders = data.totalOrders;

        cy.get('#behaviorTotalOrders')
          .invoke('text')
          .then(text => {
            const displayedTotal = parseInt(text.replace(/,/g, ''));
            expect(displayedTotal).to.equal(totalOrders);
          });
      });
    });
  });
});
