# MongoDB Production Database - Comprehensive Data Analysis Report

**Database:** heroku_v801wdr2 (MongoDB Atlas)
**Analysis Period:** 2023-2025
**Report Generated:** January 2026
**Analyst:** Data Analysis Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Overview](#database-overview)
3. [2025 Performance Metrics](#2025-performance-metrics)
4. [Quarterly Trends Analysis](#quarterly-trends-analysis)
5. [Merchant Performance Analysis](#merchant-performance-analysis)
6. [Branch & Geographical Analysis](#branch--geographical-analysis)
7. [Critical Issues & Recommendations](#critical-issues--recommendations)
8. [Growth Opportunities](#growth-opportunities)
9. [Appendix: Technical Details](#appendix-technical-details)

---

## Executive Summary

### Key Findings

**Overall Performance 2025:**
- **Total Orders:** 1,244,725 (+3.24% YoY)
- **Delivery Trips:** 1,082,603 (+2.49% YoY)
- **Completion Rate:** 90.92%
- **Canceled Trips:** 98,297 (9.08%)

**Major Concerns:**
1. Growth slowdown: 12.82% (2023→2024) dropped to 3.24% (2024→2025)
2. Q4 2025 declined -5.81% vs Q4 2024
3. Completion rate declining: 91.75% (2023) → 90.92% (2025)
4. Several high-volume merchants have below-target completion rates

**Opportunities:**
1. Explosive growth merchants: My Favorite Bakery (+4,642%), China zong (+5,923%)
2. High-performing multi-branch operations: Trolley New (97.2% completion across 6 branches)
3. Geographic expansion potential in Salmiya, Ardiya, and Mahboula areas

---

## Database Overview

### Collections Summary

**Total Collections:** 97
**Total Documents:** Billions across all collections

**Key Collections:**
- **orders:** 5,711,551 documents (37 indexes)
- **deliverytrips:** 4,745,547 documents (7 indexes)
- **merchants:** 26,181 active merchants (4 indexes)
- **branches:** 13,074 branches (4 indexes)
- **drivers:** 13,143 drivers (12 indexes)
- **orderlogs:** 214,113,315 documents (3 indexes)
- **driverlogs:** 1,053,340,745 documents (1 index)
- **orderlocations:** 2,506,462,729 documents (3 indexes)

**Operational Collections:**
- **deliveryrequests:** 19,038,218 documents
- **dispatchsnapshots:** 41,942,932 documents
- **stationmetrics:** 40,452,790 documents
- **OrganizerLogs:** 8,450,202 documents

**Customer & Transaction Data:**
- **merchantcustomers:** 3,085,028 customers
- **transactions:** 4,239,289 transactions
- **invoices:** 4,288,508 invoices
- **addresses:** 2,040,538 addresses

---

## 2025 Performance Metrics

### Annual Summary

| Metric | 2023 | 2024 | 2025 | Change (24→25) |
|--------|------|------|------|----------------|
| **Orders** | 1,068,649 | 1,205,610 | 1,244,725 | +3.24% |
| **Delivery Trips** | 968,778 | 1,056,352 | 1,082,603 | +2.49% |
| **Completed Trips** | 888,852 | 961,323 | 984,306 | +2.39% |
| **Canceled Trips** | 79,922 | 95,029 | 98,297 | +3.44% |
| **Completion Rate** | 91.75% | 91.00% | 90.92% | -0.08% |

### Key Observations

1. **Slowing Growth:** Year-over-year growth decelerated significantly
   - 2023→2024: +12.82% orders
   - 2024→2025: +3.24% orders (73% slower growth)

2. **Declining Service Quality:** Completion rate trending downward
   - 2023: 91.75%
   - 2024: 91.00% (-0.75%)
   - 2025: 90.92% (-0.08%)

3. **Increasing Cancellations:** Canceled trips growing faster than completed trips
   - Completed trips: +2.39%
   - Canceled trips: +3.44%

---

## Quarterly Trends Analysis

### 2025 Quarterly Performance

| Quarter | Orders | YoY Growth | Delivery Trips | Completion Rate |
|---------|--------|------------|----------------|-----------------|
| **Q1** | 316,724 | +10.47% | 273,616 | 90.10% |
| **Q2** | 315,921 | +0.98% | 280,768 | 90.60% |
| **Q3** | 316,719 | +8.28% | 275,396 | 92.43% ⭐ |
| **Q4** | 295,361 | -5.81% ⚠️ | 252,823 | 90.52% |

### Analysis by Quarter

**Q1 2025: Strong Start**
- 316,724 orders (+10.47% YoY)
- Best opening quarter performance
- 90.10% completion rate

**Q2 2025: Plateau**
- 315,921 orders (+0.98% YoY)
- Growth nearly flat
- Slight improvement in completion (90.60%)

**Q3 2025: Peak Performance**
- 316,719 orders (+8.28% YoY)
- **Highest completion rate: 92.43%**
- Best operational efficiency of the year

**Q4 2025: Concerning Decline**
- 295,361 orders (-5.81% YoY) ⚠️
- Only quarter with negative growth
- 10.32% decline in delivery trips vs Q4 2024
- **Requires immediate investigation**

### Historical Comparison (2023-2025)

**Order Growth by Year:**
- 2023 Total: 1,068,649
- 2024 Total: 1,205,610 (+12.82%)
- 2025 Total: 1,244,725 (+3.24%)

**Completion Rate Trends:**
| Year | Rate | Change |
|------|------|--------|
| 2023 | 91.75% | Baseline |
| 2024 | 91.00% | -0.75% |
| 2025 | 90.92% | -0.08% |

---

## Merchant Performance Analysis

### Top 10 Merchants by Order Volume (2025)

| Rank | Merchant Name | Orders 2025 | Growth | Completion | Status |
|------|---------------|-------------|--------|------------|--------|
| 1 | Mais Alghanim | 84,225 | +26.0% | 86.1% | ⚠️ Below target |
| 2 | Cari | 50,702 | NEW | 95.6% | ✅ Excellent |
| 3 | Trolley New | 40,622 | -32.6% | 96.6% | ⚠️ Declining |
| 4 | Zyda | 34,738 | +28.6% | 89.6% | ⚠️ Below target |
| 5 | Ever bakery | 28,833 | -46.6% | 79.3% | 🚨 Critical |
| 6 | Kuwait London Company | 23,730 | -45.4% | 85.7% | 🚨 Declining |
| 7 | Alowaid | 23,559 | NEW | 89.5% | ✅ Good |
| 8 | Eat Smart | 18,224 | +66.2% | 90.2% | ✅ Growing |
| 9 | The Noodle Club | 16,877 | +12.1% | 92.5% | ✅ Stable |
| 10 | Kharafi Global On Demand | 16,169 | -7.6% | 92.5% | ⚠️ Slight decline |

### Market Concentration

- **Top 10 merchants:** 337,679 orders (50.86% of analyzed volume)
- **Total merchants analyzed:** 100
- **Total active merchants:** 25,682

### Fastest Growing Merchants (>50% Growth, Min 1,000 Orders)

| Rank | Merchant | Orders 2024 | Orders 2025 | Growth | Completion |
|------|----------|-------------|-------------|--------|------------|
| 1 | Zaatar W Zeit | 10 | 3,673 | +36,630% | 88.2% |
| 2 | China zong | 46 | 2,771 | +5,924% | 94.6% |
| 3 | **My Favorite Bakery** | 261 | 12,377 | **+4,642%** | **97.1%** ⭐ |
| 4 | Gourmet Kwt | 148 | 3,572 | +2,314% | 94.5% |
| 5 | Yabani restaurant | 159 | 3,641 | +2,190% | 93.9% |
| 6 | Star World Electronics | 225 | 3,019 | +1,242% | 85.6% |
| 7 | Bakery House | 619 | 4,465 | +621% | 89.4% |
| 8 | Phet Phet | 412 | 2,673 | +549% | 96.4% |
| 9 | CRO Bakery | 1,030 | 5,585 | +442% | 87.5% |
| 10 | Offside Juice | 2,143 | 9,983 | +366% | 91.9% |

**Winner: My Favorite Bakery**
- Explosive 4,642% growth
- Outstanding 97.1% completion rate
- Perfect combination of growth + quality

### Declining Merchants (Negative Growth, Top by Volume)

| Rank | Merchant | Orders 2024 | Orders 2025 | Decline | Lost Orders |
|------|----------|-------------|-------------|---------|-------------|
| 1 | **Mishmash** | 48,183 | 11,134 | **-76.9%** | 37,049 🚨 |
| 2 | **Ever bakery** | 54,002 | 28,833 | **-46.6%** | 25,169 🚨 |
| 3 | **Kuwait London Company** | 43,450 | 23,730 | **-45.4%** | 19,720 🚨 |
| 4 | Trolley New | 60,278 | 40,622 | -32.6% | 19,656 |
| 5 | Dlly.o.Mlly | 15,661 | 7,405 | -52.7% | 8,256 |

**Critical Issues:**
- Mishmash lost 77% of orders (catastrophic decline)
- Ever bakery declining AND has worst completion rate (79.3%)
- Kuwait London Company lost nearly half its volume

### Low Completion Rate Merchants (<85%, Min 500 Orders)

| Rank | Merchant | Orders | Trips | Completed | Canceled | Rate |
|------|----------|--------|-------|-----------|----------|------|
| 1 | **Ever bakery** | 28,833 | 16,252 | 12,886 | 3,366 | **79.3%** 🚨 |
| 2 | **Fam New** | 10,170 | 9,157 | 7,023 | 2,134 | **76.7%** 🚨 |
| 3 | Get Dukan | 7,335 | 5,071 | 4,241 | 830 | 83.6% |

**Immediate Action Required:**
- Ever bakery: Declining volume + worst completion rate
- Fam New: Growing orders (+95.6%) but failing delivery (76.7%)
- These merchants need urgent operational intervention

### Excellence Awards (>95% Completion, Min 1,000 Orders)

| Rank | Merchant | Orders | Trips | Completion | Growth |
|------|----------|--------|-------|------------|--------|
| 1 | **Dlly.o.Mlly** | 7,405 | 7,350 | **97.7%** ⭐ | -52.7% |
| 2 | **My Favorite Bakery** | 12,377 | 12,406 | **97.1%** ⭐ | +4,642% |
| 3 | Trolley New | 40,622 | 40,724 | 96.6% | -32.6% |
| 4 | KAWKAW | 7,180 | 7,149 | 96.6% | +11.6% |
| 5 | King's Coffee | 7,113 | 6,889 | 96.1% | -38.6% |
| 6 | ORU ROASTERS | 6,902 | 6,753 | 95.4% | -22.1% |
| 7 | Blue Zone | 6,722 | 6,175 | 95.6% | +13.8% |
| 8 | Cari | 50,702 | 32,257 | 95.6% | NEW |

**Note:** Dlly.o.Mlly maintains 97.7% completion despite 52.7% decline in orders

---

## Branch & Geographical Analysis

### Top 10 Branches by Order Volume (2025)

| Rank | Branch Name | Merchant | Location | Orders | Growth | Completion |
|------|-------------|----------|----------|--------|--------|------------|
| 1 | Mais Alghanim Fintas | Mais Alghanim | Fintas | 30,756 | +45.1% | 87.9% |
| 2 | Mais AlGhanim Ardiya | Mais Alghanim | Ardiya | 30,458 | +55.1% | 83.4% ⚠️ |
| 3 | Ever Bakery-qibla | Ever bakery | Qibla | 28,833 | -46.6% | 79.3% 🚨 |
| 4 | OAK AND SMOKE SHUWAIKH | OAK AND SMOKE | Shuwaikh | 15,274 | +95.1% | 93.9% |
| 5 | My Favorite Bakery - Shaab | My Favorite Bakery | Shaab | 12,377 | +4,642% | 97.1% ⭐ |
| 6 | Juna Bakery - Shuwaikh | Juna Bakery | Shuwaikh | 11,925 | +27.3% | 91.4% |
| 7 | Hatch Chicken (KLC) Ardiya | Kuwait London Company | Ardiya | 11,129 | -30.5% | 82.9% |
| 8 | Wadees - West abu fatera | Wadees | West Abu Fatera | 10,270 | NEW | 87.9% |
| 9 | Fam New -Qibla | Fam New | Qibla | 10,170 | +95.6% | 76.7% 🚨 |
| 10 | Kabab Abo Raad - Ardiya | Kabab Abo Raad | Ardiya | 9,578 | +64.2% | 87.9% |

### Branch Performance Statistics

**Total Branches Analyzed:** 100 (top performers)
**Total Orders:** 527,345
**Overall Growth:** +29.83%
**Overall Completion Rate:** 90.68%
**Average Orders per Branch:** 5,273

### Explosive Growth Branches (>100% Growth, Min 500 Orders)

| Rank | Branch | Merchant | Orders 24 | Orders 25 | Growth |
|------|--------|----------|-----------|-----------|--------|
| 1 | Teta's- Hateen | Teta's kw | 7 | 3,780 | **+53,900%** 🚀 |
| 2 | china zong - salmiya | China zong | 46 | 2,771 | +5,924% |
| 3 | My Favorite Bakery - Shaab | My Favorite Bakery | 261 | 12,377 | +4,642% |
| 4 | Yabani restaurant - west abu | Yabani restaurant | 159 | 3,641 | +2,190% |
| 5 | Zest - salmiya | Zest Restaurant | 118 | 2,606 | +2,109% |

### Geographic Hotspots

**High-Volume Areas:**
1. **Fintas:** 30,756 orders (single branch)
2. **Ardiya:** Multiple high-performing branches (30,458 + 11,129 + 9,578)
3. **Qibla:** 28,833 + 10,170 orders (but quality issues)
4. **Shuwaikh:** 15,274 + 11,925 orders (good quality)

**Growth Hotspots:**
1. **Salmiya:** Multiple branches showing explosive growth
2. **Mahboula:** Eat Smart +522%, multiple others growing
3. **Ardiya:** Strong merchant presence and growth

**Areas of Concern:**
1. **Qibla:** High volume but poor completion rates
2. Several branches in established areas declining

### Multi-Branch Success Stories

**Mais Alghanim (7 branches):**
- Total: 82,605 orders (+25.4%)
- Average: 11,801 orders/branch
- Issue: 86% completion (below target)

**Trolley New (6 branches):**
- Total: 23,648 orders (+32.2%)
- **Excellent: 97.2% completion** ⭐
- Consistent quality across all locations

**Alowaid (4 branches):**
- Total: 22,820 orders (all in 2025)
- 89.4% completion
- Successful multi-location launch

### Critical Branch Issues

**Al Nasser Sport - Qibla:**
- 4,210 orders
- **2.0% completion rate** (only 10 completed out of 506 trips!) 🚨
- Likely system issue or wrong business classification
- **Requires immediate investigation**

**Fam New - Qibla:**
- 10,170 orders (+95.6% growth)
- **76.7% completion rate** 🚨
- Growing demand but failing to deliver
- 2,134 canceled trips

**Ever Bakery - Qibla:**
- 28,833 orders (-46.6% decline)
- **79.3% completion rate** 🚨
- Double problem: losing customers AND poor service

---

## Critical Issues & Recommendations

### 🚨 Critical Issues Requiring Immediate Action

#### 1. Al Nasser Sport - 2% Completion Rate
**Status:** Emergency
**Issue:** Only 10 completed deliveries out of 506 trips (2.0%)
**Impact:** 4,210 orders affected
**Recommended Actions:**
- Immediate investigation - potential system integration issue
- Verify if business should be on delivery platform
- Review account setup and operational procedures
- Consider temporary suspension until resolved

#### 2. Ever Bakery - Declining & Poor Performance
**Status:** Critical
**Issues:**
- 46.6% decline in orders (lost 25,169 orders)
- 79.3% completion rate (worst among high-volume merchants)
- 3,366 canceled trips

**Recommended Actions:**
- Conduct operational audit
- Review merchant capacity vs. demand
- Investigate cancellation reasons
- Implement performance improvement plan or consider off-boarding

#### 3. Fam New - Growth Without Quality
**Status:** Critical
**Issues:**
- 95.6% order growth but only 76.7% completion
- 2,134 canceled trips
- Rapid expansion without operational readiness

**Recommended Actions:**
- Capacity assessment and planning
- Operational training and support
- Consider limiting order intake until quality improves
- Monitor weekly until sustained improvement

#### 4. Q4 2025 Decline
**Status:** High Priority
**Issue:** Only quarter with negative growth (-5.81%)
**Impact:** Market share loss and momentum decline
**Recommended Actions:**
- Deep-dive analysis into Q4 factors:
  - Seasonal patterns
  - Competitive pressure
  - Service quality issues
  - Marketing effectiveness
- Develop Q1 2026 recovery plan

#### 5. Mais Alghanim - Volume Leader with Quality Gap
**Status:** Medium Priority
**Issues:**
- #1 by volume (84,225 orders) but 86.1% completion
- Below platform average (90.92%)
- 7 branches with inconsistent performance

**Recommended Actions:**
- Branch-by-branch performance review
- Best practice sharing across locations
- Targeted improvement program for low-performing branches

### ⚠️ Strategic Concerns

#### Slowing Growth Trajectory
- 2023→2024: +12.82%
- 2024→2025: +3.24% (73% slower)

**Recommendations:**
- Market expansion strategy
- Customer retention programs
- Competitive analysis
- Product/service innovation

#### Declining Completion Rates
- 2023: 91.75%
- 2025: 90.92%

**Recommendations:**
- Platform-wide quality initiative
- Driver training and incentives
- Merchant support programs
- Technology improvements for dispatch

#### High-Volume Merchant Attrition
- Mishmash: -76.9%
- Kuwait London Company: -45.4%
- Trolley New: -32.6%

**Recommendations:**
- Merchant retention program
- Account management for top merchants
- Competitive benchmarking
- Win-back campaigns for churned volume

---

## Growth Opportunities

### 🚀 High-Potential Growth Strategies

#### 1. Replicate Success Models

**My Favorite Bakery Model:**
- 4,642% growth with 97.1% completion
- **Action:** Case study and replication framework
- **Target:** Apply to similar bakery/food merchants
- **Expected Impact:** 10-15 merchants achieving 100%+ growth

**Trolley New Multi-Branch Excellence:**
- 6 branches with 97.2% completion
- **Action:** Best practice documentation
- **Target:** Merchants with 3+ branches
- **Expected Impact:** 2-3% improvement in multi-branch completion rates

#### 2. Geographic Expansion

**Salmiya Growth Hotspot:**
- Multiple branches showing 200%+ growth
- Strong consumer demand
- **Action:** Targeted merchant acquisition in Salmiya
- **Expected Impact:** 15-20 new branches, 50,000+ new orders

**Mahboula Opportunity:**
- Eat Smart +522% growth
- Underserved area with high demand
- **Action:** Merchant recruitment campaign
- **Expected Impact:** 10-15 new branches, 30,000+ orders

**Ardiya Consolidation:**
- Already strong presence
- Multiple successful merchants
- **Action:** Fill category gaps (grocery, pharmacy)
- **Expected Impact:** 10,000+ incremental orders

#### 3. Fast-Growing Merchant Support Program

**Target Merchants:**
- China zong (+5,924%)
- Yabani restaurant (+2,190%)
- Offside Juice (+366%)
- 10+ others with 100%+ growth

**Program Components:**
- Dedicated account management
- Operational support
- Marketing co-investment
- Technology integration assistance

**Expected Outcomes:**
- Sustain 50%+ growth rates
- Improve completion rates to 95%+
- 100,000+ incremental orders in 2026

#### 4. Quality Recovery Programs

**High-Volume, Low-Quality Merchants:**
- Mais Alghanim (86.1%)
- Kuwait London Company (85.7%)
- Ever bakery (79.3%)

**Program Elements:**
- Root cause analysis
- Operational consulting
- Technology improvements
- Performance incentives

**Expected Outcomes:**
- 5-10% improvement in completion rates
- Reduced churn
- Better customer satisfaction

#### 5. New Merchant Categories

**Success in New Entrants:**
- Cari: 2,996 branches, 50,702 orders (NEW)
- Alowaid: 4 branches, 22,820 orders (NEW)

**Expansion Opportunities:**
- Grocery chains
- Pharmacy chains
- Electronics retailers
- Fashion/retail

**Expected Impact:**
- 50-100 new merchants
- 200,000+ new orders
- Platform diversification

### 📈 Growth Projections for 2026

**Conservative Scenario:**
- Implement 2-3 initiatives
- 8-10% order growth
- Target: 1,350,000 orders

**Moderate Scenario:**
- Implement 4-5 initiatives
- Fix critical quality issues
- 15-18% order growth
- Target: 1,450,000 orders

**Aggressive Scenario:**
- Full implementation of all initiatives
- Major quality improvements
- Geographic expansion
- 25-30% order growth
- Target: 1,600,000 orders

---

## Appendix: Technical Details

### Analysis Scripts

All analysis scripts are available in `/Users/sghaier/Desktop/Warehouse/Armada/`:

1. **testConnection.js** - Database connection test
2. **listCollections.js** - Collection inventory
3. **quickListCollections.js** - Fast collection listing
4. **query2025Stats.js** - 2025 summary statistics
5. **quarterlyComparison.js** - Quarterly trends 2023-2025
6. **merchantAnalysis.js** - Basic merchant performance
7. **deepMerchantAnalysis.js** - Detailed merchant analysis with names
8. **geographicalAnalysis.js** - Area-based analysis (initial)
9. **geographicalAnalysisV2.js** - Branch location analysis

### Database Connection Details

**Connection String:** MongoDB Atlas (Production)
**Database Name:** heroku_v801wdr2
**Access Level:** Read-only analysis
**Query Performance:** Optimized with indexed queries

### Data Quality Notes

1. **Revenue Data:** Not populated in some queries (shows 0.00)
   - Order totals may need separate analysis
   - Consider joining with transaction data

2. **Geographic Data:**
   - Branch-to-area relationships partially incomplete
   - Analysis focused on branch-level data instead
   - Area/governorate analysis needs enhancement

3. **Date Ranges:**
   - 2023: Full year
   - 2024: Full year
   - 2025: Full year
   - Data current as of analysis date

4. **Sample Sizes:**
   - Top 100 merchants analyzed in detail
   - Top 100 branches analyzed in detail
   - Full population used for aggregate statistics

### Methodology

**Analysis Approach:**
1. MongoDB aggregation pipelines for performance
2. Cross-collection joins using $lookup
3. Time-series analysis by quarter
4. Year-over-year comparisons
5. Cohort analysis by merchant and branch

**Key Metrics Calculated:**
- Order counts and growth rates
- Delivery trip completion rates
- Cancellation rates
- Geographic distribution
- Merchant performance scores

**Quality Thresholds:**
- Target completion rate: 95%
- Acceptable completion rate: 90%+
- Warning level: 85-90%
- Critical level: <85%

---

## Report Metadata

**Analysis Tools:** Node.js, MongoDB Node Driver, MongoDB Aggregation Framework
**Data Sources:** Production MongoDB Atlas cluster
**Analysis Period:** January 2023 - December 2025
**Report Version:** 1.0
**Last Updated:** January 2026

**Prepared By:** Data Analysis Team
**Reviewed By:** [Pending]
**Distribution:** Internal - Management Team

---

## Next Steps

### Recommended Actions (30 Days)

1. **Week 1:**
   - Emergency investigation: Al Nasser Sport 2% completion
   - Initiate Ever bakery and Fam New improvement programs
   - Q4 decline root cause analysis

2. **Week 2:**
   - Launch My Favorite Bakery success replication study
   - Begin Salmiya merchant recruitment
   - Implement high-growth merchant support program

3. **Week 3:**
   - Roll out Mais Alghanim quality improvement program
   - Develop merchant retention strategy for declining accounts
   - Create 2026 growth plan based on opportunities identified

4. **Week 4:**
   - Review progress on all initiatives
   - Finalize 2026 targets and budgets
   - Prepare board presentation

### Ongoing Monitoring

**Weekly Dashboards:**
- Order volume and growth trends
- Completion rates by merchant/branch
- Critical issue tracking

**Monthly Reviews:**
- Merchant performance scorecards
- Geographic expansion progress
- Quality improvement metrics

**Quarterly Analysis:**
- Comprehensive performance review
- Strategic initiative assessment
- Market trends and competitive analysis

---

*End of Report*
