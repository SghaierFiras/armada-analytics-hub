# Manual Testing Guide - Analytics Dashboard

Since Cypress has compatibility issues on your system, use this comprehensive manual testing checklist.

## Prerequisites

1. **Server Running**: `node auth-server.js`
2. **Browser**: Chrome, Firefox, or Safari
3. **Authentication**: Complete Slack OAuth login first

## Testing URL

Open: `http://localhost:3000`

---

## Test 1: Application Initialization ✅

### Steps:
1. Open browser DevTools (F12) → Console tab
2. Navigate to `http://localhost:3000/login`
3. Complete Slack OAuth login
4. Dashboard should load at `http://localhost:3000/`

### Verify:
- [ ] No red errors in console
- [ ] See message: `[App] Initialization complete`
- [ ] Type in console: `window.analyticsApp`
  - **Expected**: Should return an object (not undefined)
- [ ] Type in console: `window.analyticsApp.pages`
  - **Expected**: Should show 5 pages: `{home, merchants, orders, performance, orderingBehavior}`
- [ ] Type in console: `window.navigateTo`
  - **Expected**: Should return a function (not undefined)

### Screenshot:
Take screenshot of console showing no errors

---

## Test 2: Navigation - All 5 Pages ✅

### Test 2.1: Home Page
**Steps:**
1. Click "Overview" in sidebar (🏠 icon)

**Verify:**
- [ ] Page content changes
- [ ] "Overview" sidebar item has blue/highlighted background
- [ ] URL shows: `http://localhost:3000/#home` or `http://localhost:3000/`
- [ ] Console logs: `[App] Navigating to: home`

### Test 2.2: Platform Performance
**Steps:**
1. Click "Platform Performance" in sidebar (📈 icon)

**Verify:**
- [ ] Page content changes to performance metrics
- [ ] "Platform Performance" sidebar item highlighted
- [ ] URL shows: `http://localhost:3000/#performance`
- [ ] Console logs: `[App] Navigating to: performance`

### Test 2.3: Merchants
**Steps:**
1. Click "Merchants" in sidebar (🏪 icon)

**Verify:**
- [ ] Merchant analytics page displays
- [ ] "Merchants" sidebar item highlighted
- [ ] URL shows: `http://localhost:3000/#merchants`
- [ ] Console logs: `[App] Navigating to: merchants`

### Test 2.4: Orders & Delivery
**Steps:**
1. Click "Orders & Delivery" in sidebar (📦 icon)

**Verify:**
- [ ] Orders page displays
- [ ] "Orders & Delivery" sidebar item highlighted
- [ ] URL shows: `http://localhost:3000/#orders`
- [ ] Console logs: `[App] Navigating to: orders`

### Test 2.5: Ordering Behavior ⭐ (NEW PAGE)
**Steps:**
1. Click "Ordering Behavior" in sidebar (🕐 icon)

**Verify:**
- [ ] Ordering behavior analysis page displays
- [ ] "Ordering Behavior" sidebar item highlighted
- [ ] URL shows: `http://localhost:3000/#orderingBehavior`
- [ ] Console logs: `[App] Navigating to: orderingBehavior`
- [ ] Page header shows: "Ordering Behavior Analysis"

### Screenshot:
Take screenshot of each page

---

## Test 3: Ordering Behavior Page - Detailed ⭐

Navigate to Ordering Behavior page for these tests.

### Test 3.1: Stat Cards
**Verify:**
- [ ] "Total Orders" shows a number (not "-")
- [ ] "Peak Period" shows a time period name (not "N/A")
- [ ] "Avg Order Amount" shows currency (KD X.XX)
- [ ] "Top Merchant" shows merchant name (not "-")

### Test 3.2: Charts (All 5)
**Verify all charts are visible:**
- [ ] **Chart 1**: "Orders by Time Period" - Bar chart with 6 bars
- [ ] **Chart 2**: "Order Distribution" - Pie/Doughnut chart with colored segments
- [ ] **Chart 3**: "Average Order Amount by Time Period" - Bar chart showing KD amounts
- [ ] **Chart 4**: "Top 5 Merchants" - Horizontal bar chart with merchant names
- [ ] **Chart 5**: "Merchant Performance Across Time Periods" - Multi-colored grouped bars

### Test 3.3: Tables
**Verify tables have data:**
- [ ] "Top Merchants by Time Period" table has rows with:
  - Rank numbers
  - Merchant names
  - Order counts
  - Percentages
- [ ] "Merchant Details" table has rows with merchant data

### Test 3.4: Period Filter
**Steps:**
1. Find "Select Time Period" dropdown
2. Select "Breakfast (5:00-9:30 AM)"

**Verify:**
- [ ] Dropdown changes to "Breakfast"
- [ ] Top merchants table updates (shows different data)
- [ ] Period stats cards appear below dropdown

**Repeat with:**
- [ ] "Lunch (11:00 AM-3:00 PM)"
- [ ] "Dinner (6:30-10:00 PM)"
- [ ] "All Periods" (should clear period stats)

### Test 3.5: Merchant Search
**Steps:**
1. Find "Search Merchants" input field
2. Type: "a" (lowercase)

**Verify:**
- [ ] Merchant Details table updates as you type
- [ ] Shows only merchants with "a" in their name

**Steps:**
3. Clear the search box

**Verify:**
- [ ] Table shows all merchants again

### Test 3.6: Rank Filter
**Steps:**
1. Find "Filter by Rank" dropdown
2. Select "Top 5"

**Verify:**
- [ ] Merchant Details table shows only top 5 ranked merchants per period

### Test 3.7: Combined Filters
**Steps:**
1. Set Period Filter to "Lunch"
2. Set Rank Filter to "Top 3"
3. Type "test" in Search box

**Verify:**
- [ ] Table filters by all three criteria simultaneously
- [ ] No JavaScript errors in console

### Screenshot:
Take screenshot showing all charts and filters

---

## Test 4: Browser Navigation ✅

### Test 4.1: Browser Back Button
**Steps:**
1. Click Merchants page
2. Click Orders page
3. Click Ordering Behavior page
4. Press browser BACK button (←)

**Verify:**
- [ ] Returns to Orders page
- [ ] URL updates correctly
- [ ] Page content changes

### Test 4.2: Browser Forward Button
**Steps:**
1. After going back, press browser FORWARD button (→)

**Verify:**
- [ ] Returns to Ordering Behavior page
- [ ] URL updates correctly
- [ ] Page content changes

### Test 4.3: Direct URL with Hash
**Steps:**
1. Open new browser tab
2. Navigate directly to: `http://localhost:3000/#merchants`

**Verify:**
- [ ] Merchants page loads directly
- [ ] No need to click navigation

---

## Test 5: Page Refresh ✅

**Steps:**
1. Navigate to any page (e.g., Ordering Behavior)
2. Press F5 or Cmd+R to refresh

**Verify:**
- [ ] Page reloads successfully
- [ ] Dashboard still works
- [ ] All navigation still functional
- [ ] Console shows: `[App] Initialization complete`

---

## Test 6: Export Functionality ✅

**Steps:**
1. Navigate to Ordering Behavior page
2. In browser console, type:
   ```javascript
   window.analyticsApp.pages.orderingBehavior.getExportData('csv')
   ```

**Verify:**
- [ ] Returns an object (not error)
- [ ] Object has properties: `title`, `filename`, `sections`
- [ ] `sections` is an array with data

**Repeat for other pages:**
```javascript
window.analyticsApp.pages.home.getExportData('csv')
window.analyticsApp.pages.merchants.getExportData('csv')
window.analyticsApp.pages.orders.getExportData('csv')
window.analyticsApp.pages.performance.getExportData('csv')
```

**Verify:**
- [ ] All pages return export data
- [ ] No errors

---

## Test 7: Console Error Check ✅

**Throughout all tests, monitor console for:**

### ❌ Should NOT see:
- "navigateTo is not defined"
- "Uncaught ReferenceError"
- "Failed to load module script"
- "CSP violation" or "Refused to execute inline"
- "404 Not Found" for any .js files

### ✅ Should see:
- "[App] DOM loaded, initializing app..."
- "[App] Initialization complete"
- "[App] Navigating to: [pageName]"
- "[HomePage] Loading overview dashboard"
- "[OrderingBehaviorPage] Loading ordering behavior analysis"

---

## Test 8: Performance Check ✅

**Steps:**
1. Open DevTools (F12) → Network tab
2. Refresh page (F5)

**Verify:**
- [ ] `/js/app.js` - Status 200 (not 404)
- [ ] `/js/pages/orderingBehaviorPage.js` - Status 200 (not 404)
- [ ] `/data/kuwait_ordering_with_avg_amounts_2025.csv` - Status 200 (not 404)
- [ ] All module files load successfully

**Verify load times:**
- [ ] Initial page load < 3 seconds
- [ ] Navigation between pages < 1 second

---

## Test 9: Multiple Browser Test ✅

**Repeat Tests 1-8 in:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Verify:**
- [ ] All functionality works in all browsers
- [ ] No browser-specific errors

---

## Test 10: Mobile Responsive Test 📱

**Steps:**
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" icon (phone/tablet icon)
3. Select "iPhone 12 Pro" or similar

**Verify:**
- [ ] Sidebar is visible/usable
- [ ] Navigation works on mobile
- [ ] Charts render correctly
- [ ] Tables are scrollable
- [ ] No horizontal overflow

---

## Critical Success Criteria ✅

**The fix is successful if ALL of the following are true:**

### Functional:
- ✅ All 5 sidebar items respond to clicks
- ✅ Page content changes when navigating
- ✅ Active sidebar item highlights correctly
- ✅ URL hash updates on each navigation
- ✅ Browser back/forward buttons work
- ✅ Ordering Behavior page fully functional

### Technical:
- ✅ Console shows "[App] Initialization complete"
- ✅ NO CSP violations
- ✅ NO module loading errors
- ✅ NO "navigateTo is not defined" errors
- ✅ `window.analyticsApp.pages` shows 5 pages
- ✅ `window.analyticsApp.pages.orderingBehavior` exists

---

## Troubleshooting

### Issue: "navigateTo is not defined"
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R) to clear cache

### Issue: Ordering Behavior page doesn't load
**Check console for:**
- Module loading errors
- 404 on orderingBehaviorPage.js
- CSV data loading errors

### Issue: Charts don't appear
**Check:**
- Wait 2-3 seconds after navigation
- Check Network tab for CSV file (should be 200 OK)
- Check console for Chart.js errors

### Issue: Navigation doesn't work
**Check:**
- data-page attributes exist in HTML
- Console shows navigation logs
- No JavaScript errors blocking execution

---

## Testing Checklist Summary

| Test Category | Status | Notes |
|--------------|--------|-------|
| Application Init | ⬜ | All 5 pages loaded? |
| Navigation (5 pages) | ⬜ | All clickable? |
| Ordering Behavior | ⬜ | Charts + tables? |
| Browser Nav | ⬜ | Back/forward? |
| Page Refresh | ⬜ | Still works? |
| Export | ⬜ | All pages? |
| Console Errors | ⬜ | None? |
| Performance | ⬜ | < 3s load? |
| Multiple Browsers | ⬜ | Chrome, Firefox? |
| Mobile | ⬜ | Responsive? |

---

## Results

**Date Tested:** _____________

**Tested By:** _____________

**Browser:** _____________

**Pass/Fail:** _____________

**Issues Found:** _____________

**Screenshots Attached:** Yes / No
