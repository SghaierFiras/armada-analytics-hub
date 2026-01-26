// Chart.js configuration
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';

// Color palette
const colors = {
    primary: '#2563eb',
    secondary: '#3b82f6',
    light: '#60a5fa',
    lighter: '#93c5fd',
    lightest: '#dbeafe',
    dark: '#1e40af',
    darker: '#1e3a8a',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
};

// Global state
let currentPage = 'home';
let allCharts = {};
let filters = {
    merchants: { year: 'all', size: 'all', area: 'all' },
    orders: { year: 'all', quarter: 'all', status: 'all' },
    performance: { year: 'all', quarter: 'all', month: 'all' }
};

// ============= DATA STRUCTURES =============

// Merchant Data
const merchantData = {
    all: {
        totalMerchants: 2151,
        activeMerchants: { 2023: 1192, 2024: 1461, 2025: 1498 },
        totalOrders: 3513640,
        totalBranches: 1124,
        avgOrders: 827,
        completionRate: 90.94,
        businessSize: {
            micro: { count: 1383, avgOrders: 25, totalOrders: 34575, pct: 59.23, completion: 85.2 },
            small: { count: 680, avgOrders: 361, totalOrders: 245480, pct: 29.12, completion: 89.5 },
            medium: { count: 250, avgOrders: 2648, totalOrders: 662000, pct: 10.71, completion: 91.2 },
            large: { count: 20, avgOrders: 19011, totalOrders: 380220, pct: 0.86, completion: 88.9 },
            enterprise: { count: 2, avgOrders: 57989, totalOrders: 115978, pct: 0.09, completion: 86.8 }
        },
        multiBranch: [
            { name: 'Trolley New', branches: 37, orders: 113269, avgPerBranch: 3061 },
            { name: 'Mishmash', branches: 14, orders: 97321, avgPerBranch: 6952 },
            { name: 'Zyda', branches: 348, orders: 61551, avgPerBranch: 177 },
            { name: 'Cari', branches: 2910, orders: 50702, avgPerBranch: 17 },
            { name: 'Eat Smart', branches: 17, orders: 41447, avgPerBranch: 2438 },
            { name: 'HOMEY', branches: 84, orders: 38249, avgPerBranch: 455 }
        ],
        geographic: {
            salmiya: { merchants: 125, orders: 180000, completion: 92.1 },
            kuwait_city: { merchants: 145, orders: 165000, completion: 89.8 },
            hawally: { merchants: 98, orders: 142000, completion: 91.3 },
            fintas: { merchants: 67, orders: 120000, completion: 88.9 },
            mahboula: { merchants: 54, orders: 98000, completion: 90.5 }
        },
        growthCohorts: {
            explosive: { count: 229, orders2024: 38717, orders2025: 182016, change: 370.1 },
            highGrowth: { count: 77, orders2024: 66204, orders2025: 115981, change: 75.2 },
            moderate: { count: 85, orders2024: 196712, orders2025: 244256, change: 24.2 },
            stable: { count: 32, orders2024: 32153, orders2025: 33492, change: 4.2 },
            declining: { count: 547, orders2024: 827208, orders2025: 450778, change: -45.5 },
            new: { count: 528, orders2024: 0, orders2025: 212858, change: null },
            churned: { count: 491, orders2024: 44616, orders2025: 0, change: -100 }
        }
    }
};

// Orders Data
const ordersData = {
    annual: {
        2023: { orders: 1068649, trips: 968778, completed: 888852, canceled: 79926, completionRate: 91.75, growth: null },
        2024: { orders: 1205610, trips: 1054352, completed: 962323, canceled: 92029, completionRate: 91.27, growth: 12.82 },
        2025: { orders: 1239381, trips: 1078998, completed: 981142, canceled: 97856, completionRate: 90.94, growth: 2.80 }
    },
    monthly: {
        2023: [
            { month: 'Jan', orders: 73559, trips: 68152, completed: 62919, completion: 92.32, yoy: null, mom: null },
            { month: 'Feb', orders: 72137, trips: 65944, completed: 60094, completion: 91.13, yoy: null, mom: -1.93 },
            { month: 'Mar', orders: 91712, trips: 77928, completed: 68274, completion: 87.61, yoy: null, mom: 27.14 },
            { month: 'Apr', orders: 98834, trips: 83276, completed: 73231, completion: 87.94, yoy: null, mom: 7.77 },
            { month: 'May', orders: 84751, trips: 77058, completed: 70859, completion: 91.96, yoy: null, mom: -14.25 },
            { month: 'Jun', orders: 93163, trips: 83948, completed: 76663, completion: 91.32, yoy: null, mom: 9.93 },
            { month: 'Jul', orders: 85234, trips: 78320, completed: 72678, completion: 92.80, yoy: null, mom: -8.51 },
            { month: 'Aug', orders: 86063, trips: 79658, completed: 74006, completion: 92.90, yoy: null, mom: 0.97 },
            { month: 'Sep', orders: 89106, trips: 83169, completed: 77008, completion: 92.59, yoy: null, mom: 3.54 },
            { month: 'Oct', orders: 93337, trips: 86225, completed: 80155, completion: 92.96, yoy: null, mom: 4.75 },
            { month: 'Nov', orders: 100373, trips: 92158, completed: 85933, completion: 93.25, yoy: null, mom: 7.54 },
            { month: 'Dec', orders: 100380, trips: 92942, completed: 87032, completion: 93.64, yoy: null, mom: 0.01 }
        ],
        2024: [
            { month: 'Jan', orders: 86791, trips: 80271, completed: 75196, completion: 93.68, yoy: 17.99, mom: -13.54 },
            { month: 'Feb', orders: 88818, trips: 80664, completed: 74463, completion: 92.31, yoy: 23.12, mom: 2.34 },
            { month: 'Mar', orders: 111101, trips: 91963, completed: 81548, completion: 88.67, yoy: 21.14, mom: 25.09 },
            { month: 'Apr', orders: 99669, trips: 83617, completed: 75794, completion: 90.64, yoy: 0.84, mom: -10.29 },
            { month: 'May', orders: 107947, trips: 93727, completed: 85562, completion: 91.29, yoy: 27.37, mom: 8.31 },
            { month: 'Jun', orders: 105229, trips: 89147, completed: 80694, completion: 90.52, yoy: 12.95, mom: -2.52 },
            { month: 'Jul', orders: 99185, trips: 83680, completed: 75908, completion: 90.71, yoy: 16.37, mom: -5.74 },
            { month: 'Aug', orders: 95666, trips: 85806, completed: 78478, completion: 91.46, yoy: 11.16, mom: -3.55 },
            { month: 'Sep', orders: 97638, trips: 85556, completed: 77116, completion: 90.14, yoy: 9.58, mom: 2.06 },
            { month: 'Oct', orders: 107789, trips: 95086, completed: 86027, completion: 90.47, yoy: 15.48, mom: 10.40 },
            { month: 'Nov', orders: 99861, trips: 91264, completed: 83368, completion: 91.35, yoy: -0.51, mom: -7.36 },
            { month: 'Dec', orders: 105916, trips: 95571, completed: 87169, completion: 91.21, yoy: 5.52, mom: 6.06 }
        ],
        2025: [
            { month: 'Jan', orders: 99021, trips: 90619, completed: 83809, completion: 92.49, yoy: 14.09, mom: -6.51 },
            { month: 'Feb', orders: 97151, trips: 87412, completed: 79730, completion: 91.21, yoy: 9.38, mom: -1.89 },
            { month: 'Mar', orders: 120552, trips: 95585, completed: 83001, completion: 86.83, yoy: 8.51, mom: 24.09 },
            { month: 'Apr', orders: 95223, trips: 85530, completed: 77506, completion: 90.62, yoy: -4.46, mom: -21.01 },
            { month: 'May', orders: 109928, trips: 98537, completed: 89553, completion: 90.88, yoy: 1.84, mom: 15.44 },
            { month: 'Jun', orders: 110770, trips: 96701, completed: 87306, completion: 90.28, yoy: 5.27, mom: 0.77 },
            { month: 'Jul', orders: 102426, trips: 92458, completed: 85139, completion: 92.08, yoy: 3.27, mom: -7.53 },
            { month: 'Aug', orders: 107405, trips: 92656, completed: 86371, completion: 93.22, yoy: 12.27, mom: 4.86 },
            { month: 'Sep', orders: 106888, trips: 90282, completed: 83030, completion: 91.97, yoy: 9.47, mom: -0.48 },
            { month: 'Oct', orders: 104346, trips: 90139, completed: 81754, completion: 90.70, yoy: -3.19, mom: -2.38 },
            { month: 'Nov', orders: 89842, trips: 77832, completed: 70368, completion: 90.41, yoy: -10.03, mom: -13.90 },
            { month: 'Dec', orders: 95829, trips: 81247, completed: 73685, completion: 90.69, yoy: -9.52, mom: 6.66 }
        ]
    },
    quarterly: {
        2023: [
            { quarter: 'Q1', orders: 237408, trips: 212024, completion: 90.22 },
            { quarter: 'Q2', orders: 276748, trips: 244282, completion: 90.37 },
            { quarter: 'Q3', orders: 260403, trips: 241147, completion: 92.76 },
            { quarter: 'Q4', orders: 294090, trips: 271325, completion: 93.29 }
        ],
        2024: [
            { quarter: 'Q1', orders: 286710, trips: 252898, completion: 91.42 },
            { quarter: 'Q2', orders: 312845, trips: 266491, completion: 90.83 },
            { quarter: 'Q3', orders: 292489, trips: 255042, completion: 90.77 },
            { quarter: 'Q4', orders: 313566, trips: 281921, completion: 91.01 }
        ],
        2025: [
            { quarter: 'Q1', orders: 316724, trips: 273616, completion: 90.10 },
            { quarter: 'Q2', orders: 315921, trips: 280768, completion: 90.60 },
            { quarter: 'Q3', orders: 316719, trips: 275396, completion: 92.43 },
            { quarter: 'Q4', orders: 290017, trips: 249218, completion: 90.61 }
        ]
    }
};

// ============= NAVIGATION =============

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggleIcon');
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');
    icon.textContent = sidebar.classList.contains('collapsed') || sidebar.classList.contains('open') ? '☰' : '✕';
}

function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    document.getElementById(page).classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');

    currentPage = page;

    // Load page content
    if (page === 'merchants') loadMerchantsPage();
    if (page === 'orders') loadOrdersPage();
    if (page === 'performance') loadPerformancePage();
    if (page === 'orderingBehavior') loadOrderingBehaviorPage();

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// ============= FILTER HANDLERS =============

// Setup filter event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Year button filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            const filterType = this.dataset.filter;
            const value = this.dataset.value;

            // Update active state
            document.querySelectorAll(`[data-page="${page}"][data-filter="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            // Update filter
            filters[page][filterType] = value;

            // Refresh page
            if (page === 'merchants') loadMerchantsPage();
            if (page === 'orders') loadOrdersPage();
            if (page === 'performance') loadPerformancePage();
        });
    });

    // Dropdown filters - Merchants
    document.getElementById('merchantSizeFilter').addEventListener('change', function() {
        filters.merchants.size = this.value;
        loadMerchantsPage();
    });

    document.getElementById('merchantAreaFilter').addEventListener('change', function() {
        filters.merchants.area = this.value;
        loadMerchantsPage();
    });

    // Dropdown filters - Orders
    document.getElementById('ordersQuarterFilter').addEventListener('change', function() {
        filters.orders.quarter = this.value;
        loadOrdersPage();
    });

    document.getElementById('ordersStatusFilter').addEventListener('change', function() {
        filters.orders.status = this.value;
        loadOrdersPage();
    });

    // Dropdown filters - Performance
    document.getElementById('performanceQuarterFilter').addEventListener('change', function() {
        filters.performance.quarter = this.value;
        loadPerformancePage();
    });

    document.getElementById('performanceMonthFilter').addEventListener('change', function() {
        filters.performance.month = this.value;
        loadPerformancePage();
    });
});

// ============= MERCHANTS PAGE =============

function loadMerchantsPage() {
    const { year, size, area } = filters.merchants;

    // Update subtitle
    let subtitle = 'Comprehensive Merchant Ecosystem Analysis (2023-2025)';
    if (year !== 'all' || size !== 'all' || area !== 'all') {
        const parts = [];
        if (year !== 'all') parts.push(`Year ${year}`);
        if (size !== 'all') parts.push(`${size.charAt(0).toUpperCase() + size.slice(1)} Businesses`);
        if (area !== 'all') parts.push(area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        subtitle = 'Filtered View: ' + parts.join(' | ');
    }
    document.getElementById('merchantSubtitle').textContent = subtitle;

    // Calculate stats
    const data = merchantData.all;
    let merchants = data.totalMerchants;
    let orders = data.totalOrders;
    let avgOrders = data.avgOrders;
    let branches = data.totalBranches;
    let completion = data.completionRate;

    // Apply year filter
    if (year !== 'all') {
        merchants = data.activeMerchants[year];
        const yearOrders = { 2023: 1068649, 2024: 1205610, 2025: 1239381 };
        orders = yearOrders[year];
        avgOrders = Math.round(orders / merchants);
    }

    // Apply size filter
    if (size !== 'all' && data.businessSize[size]) {
        const sizeData = data.businessSize[size];
        merchants = sizeData.count;
        orders = sizeData.totalOrders;
        avgOrders = sizeData.avgOrders;
        completion = sizeData.completion;
        branches = Math.round(data.totalBranches * (sizeData.pct / 100));
    }

    // Apply area filter
    if (area !== 'all' && data.geographic[area]) {
        const areaData = data.geographic[area];
        merchants = areaData.merchants;
        orders = areaData.orders;
        completion = areaData.completion;
        avgOrders = Math.round(orders / merchants);
        branches = Math.round(merchants * 0.15);
    }

    // Render stats
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${merchants.toLocaleString()}</div>
            <div class="stat-label">Total Merchants</div>
            <div class="stat-change positive">${year === 'all' ? '3-Year Unique Count' : year + ' Active'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(orders)}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-change neutral">Across all merchants</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${branches.toLocaleString()}</div>
            <div class="stat-label">Total Branches</div>
            <div class="stat-change neutral">Multi-location operations</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgOrders.toLocaleString()}</div>
            <div class="stat-label">Avg Orders/Merchant</div>
            <div class="stat-change neutral">Per merchant average</div>
        </div>
        <div class="stat-card ${completion >= 91 ? 'highlight' : 'warning'}">
            <div class="stat-value ${completion >= 91 ? 'success' : 'danger'}">${completion.toFixed(1)}%</div>
            <div class="stat-label">Completion Rate</div>
            <div class="stat-change ${completion >= 91 ? 'positive' : 'negative'}">${completion >= 91 ? 'Above target' : 'Below target'}</div>
        </div>
    `;
    document.getElementById('merchantStats').innerHTML = statsHTML;

    // Render charts
    renderMerchantCharts();
}

function renderMerchantCharts() {
    const { year, size, area } = filters.merchants;
    const data = merchantData.all;

    // Destroy existing charts
    Object.keys(allCharts).forEach(key => {
        if (key.startsWith('merchant')) {
            allCharts[key]?.destroy();
        }
    });

    const chartsHTML = `
        <div class="chart-container">
            <div class="chart-title">Business Size Distribution</div>
            <div class="chart-subtitle">Merchant segmentation by order volume</div>
            <canvas id="merchantSizeChart"></canvas>
            ${size === 'all' ? `
                <div class="insight-box warning">
                    <h4>⚠️ Key Insight</h4>
                    <p>59.23% are micro merchants (0-100 orders/yr) generating only 1% of revenue. Focus on scaling mid-tier merchants to enterprise level.</p>
                </div>
            ` : ''}
        </div>
        <div class="chart-container">
            <div class="chart-title">Order Volume by Business Size</div>
            <div class="chart-subtitle">Revenue concentration analysis</div>
            <canvas id="merchantOrdersChart"></canvas>
        </div>
        <div class="chart-container full-width">
            <div class="chart-title">Top Multi-Branch Merchants</div>
            <div class="chart-subtitle">Branch count and performance</div>
            <canvas id="merchantBranchChart"></canvas>
            <div class="insight-box success">
                <h4>📈 Key Insight</h4>
                <p>Top 3 merchants (Trolley New, Mishmash, Zyda) generate 272K orders. Enterprise retention programs critical for these high-value accounts.</p>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Geographic Distribution</div>
            <div class="chart-subtitle">Order volume by area</div>
            <canvas id="merchantGeoChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Growth Cohort Analysis</div>
            <div class="chart-subtitle">Merchant performance 2024 vs 2025</div>
            <canvas id="merchantGrowthChart"></canvas>
            <div class="insight-box warning">
                <h4>🚨 Critical Alert</h4>
                <p>547 merchants declining (-45.5% orders) + 491 churned = 1,038 at-risk accounts. Immediate intervention required to prevent revenue collapse.</p>
            </div>
        </div>
    `;
    document.getElementById('merchantCharts').innerHTML = chartsHTML;

    // Create charts
    createMerchantSizeChart();
    createMerchantOrdersChart();
    createMerchantBranchChart();
    createMerchantGeoChart();
    createMerchantGrowthChart();
}

function createMerchantSizeChart() {
    const { size } = filters.merchants;
    const data = merchantData.all.businessSize;

    const bgColors = [
        size === 'all' || size === 'micro' ? colors.lightest : '#e5e7eb',
        size === 'all' || size === 'small' ? colors.lighter : '#e5e7eb',
        size === 'all' || size === 'medium' ? colors.light : '#e5e7eb',
        size === 'all' || size === 'large' ? colors.secondary : '#e5e7eb',
        size === 'all' || size === 'enterprise' ? colors.primary : '#e5e7eb',
    ];

    allCharts.merchantSize = new Chart(document.getElementById('merchantSizeChart'), {
        type: 'doughnut',
        data: {
            labels: ['Micro (0-100)', 'Small (100-1K)', 'Medium (1K-10K)', 'Large (10K-50K)', 'Enterprise (50K+)'],
            datasets: [{
                data: [data.micro.count, data.small.count, data.medium.count, data.large.count, data.enterprise.count],
                backgroundColor: bgColors,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createMerchantOrdersChart() {
    const { size } = filters.merchants;
    const data = merchantData.all.businessSize;

    const sortedData = [
        { label: 'Medium', orders: data.medium.totalOrders },
        { label: 'Large', orders: data.large.totalOrders },
        { label: 'Small', orders: data.small.totalOrders },
        { label: 'Enterprise', orders: data.enterprise.totalOrders },
        { label: 'Micro', orders: data.micro.totalOrders }
    ];

    const bgColors = sortedData.map(item => {
        if (size !== 'all' && item.label.toLowerCase() !== size) return '#e5e7eb';
        switch(item.label) {
            case 'Micro': return colors.lightest;
            case 'Small': return colors.lighter;
            case 'Medium': return colors.light;
            case 'Large': return colors.secondary;
            case 'Enterprise': return colors.primary;
            default: return colors.light;
        }
    });

    allCharts.merchantOrders = new Chart(document.getElementById('merchantOrdersChart'), {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.label),
            datasets: [{
                label: 'Total Orders',
                data: sortedData.map(d => d.orders),
                backgroundColor: bgColors
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createMerchantBranchChart() {
    const data = [...merchantData.all.multiBranch].sort((a, b) => b.orders - a.orders);

    allCharts.merchantBranch = new Chart(document.getElementById('merchantBranchChart'), {
        type: 'bar',
        data: {
            labels: data.map(m => m.name),
            datasets: [{
                label: 'Branches',
                data: data.map(m => m.branches),
                backgroundColor: colors.lighter,
                yAxisID: 'y'
            }, {
                label: 'Total Orders',
                data: data.map(m => m.orders),
                backgroundColor: colors.primary,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Branches', color: colors.dark }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Orders', color: colors.dark },
                    grid: { drawOnChartArea: false },
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });
}

function createMerchantGeoChart() {
    const { area } = filters.merchants;
    const data = merchantData.all.geographic;
    const sortedAreas = Object.keys(data).sort((a, b) => data[b].orders - data[a].orders);

    const bgColors = sortedAreas.map(a =>
        area !== 'all' && a !== area ? '#e5e7eb' : colors.secondary
    );

    allCharts.merchantGeo = new Chart(document.getElementById('merchantGeoChart'), {
        type: 'bar',
        data: {
            labels: sortedAreas.map(a => a.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
            datasets: [{
                label: 'Order Volume',
                data: sortedAreas.map(a => data[a].orders),
                backgroundColor: bgColors
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createMerchantGrowthChart() {
    const data = merchantData.all.growthCohorts;
    const sortedCohorts = [
        { label: 'Declining\n(<0%)', count: data.declining.count, color: colors.danger },
        { label: 'New\n(2025)', count: data.new.count, color: colors.info },
        { label: 'Churned', count: data.churned.count, color: '#9ca3af' },
        { label: 'Explosive\n(>100%)', count: data.explosive.count, color: colors.success },
        { label: 'Moderate\n(10-50%)', count: data.moderate.count, color: colors.light },
        { label: 'High\n(50-100%)', count: data.highGrowth.count, color: colors.secondary },
        { label: 'Stable\n(0-10%)', count: data.stable.count, color: colors.warning }
    ];

    allCharts.merchantGrowth = new Chart(document.getElementById('merchantGrowthChart'), {
        type: 'bar',
        data: {
            labels: sortedCohorts.map(c => c.label),
            datasets: [{
                label: 'Merchant Count',
                data: sortedCohorts.map(c => c.count),
                backgroundColor: sortedCohorts.map(c => c.color)
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// ============= ORDERS PAGE =============

function loadOrdersPage() {
    const { year, quarter, status } = filters.orders;

    // Update subtitle
    let subtitle = 'Operational Performance Analysis (2023-2025)';
    if (year !== 'all' || quarter !== 'all' || status !== 'all') {
        const parts = [];
        if (year !== 'all') parts.push(`Year ${year}`);
        if (quarter !== 'all') parts.push(quarter);
        if (status !== 'all') parts.push(`${status.charAt(0).toUpperCase() + status.slice(1)} Only`);
        subtitle = 'Filtered View: ' + parts.join(' | ');
    }
    document.getElementById('ordersSubtitle').textContent = subtitle;

    // Calculate stats
    let totalOrders = 0, totalTrips = 0, totalCompleted = 0, totalCanceled = 0;
    let completionRate = 0, growth = 0;

    if (year === 'all') {
        totalOrders = 3513640;
        totalTrips = 3102128;
        totalCompleted = 2832317;
        totalCanceled = 269811;
        completionRate = 90.94;
        growth = 8.1;
    } else {
        const yearData = ordersData.annual[year];
        totalOrders = yearData.orders;
        totalTrips = yearData.trips;
        totalCompleted = yearData.completed;
        totalCanceled = yearData.canceled;
        completionRate = yearData.completionRate;
        growth = yearData.growth || 0;

        if (quarter !== 'all') {
            const qIndex = parseInt(quarter.charAt(1)) - 1;
            const qData = ordersData.quarterly[year][qIndex];
            totalOrders = qData.orders;
            totalTrips = qData.trips;
            completionRate = qData.completion;
            totalCompleted = Math.round(totalTrips * (completionRate / 100));
            totalCanceled = totalTrips - totalCompleted;
        }
    }

    if (status === 'completed') {
        totalOrders = totalCompleted;
        totalCanceled = 0;
    } else if (status === 'canceled') {
        totalOrders = totalCanceled;
        totalCompleted = 0;
    }

    const avgDaily = Math.round(totalOrders / 365);
    const failureRate = 100 - completionRate;
    const conversionRate = (totalTrips / totalOrders * 100).toFixed(1);

    // Render stats
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${formatNumber(totalOrders)}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-change positive">+${growth.toFixed(1)}% YoY Growth</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(totalTrips)}</div>
            <div class="stat-label">Delivery Trips</div>
            <div class="stat-change neutral">${conversionRate}% conversion</div>
        </div>
        <div class="stat-card highlight">
            <div class="stat-value success">${formatNumber(totalCompleted)}</div>
            <div class="stat-label">Completed</div>
            <div class="stat-change positive">${completionRate.toFixed(1)}% success rate</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-value danger">${formatNumber(totalCanceled)}</div>
            <div class="stat-label">Canceled</div>
            <div class="stat-change negative">${failureRate.toFixed(1)}% failure rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgDaily.toLocaleString()}</div>
            <div class="stat-label">Avg Daily Orders</div>
            <div class="stat-change neutral">Per operational day</div>
        </div>
        <div class="stat-card ${growth >= 5 ? 'highlight' : 'warning'}">
            <div class="stat-value ${growth >= 5 ? 'success' : 'danger'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</div>
            <div class="stat-label">YoY Growth Rate</div>
            <div class="stat-change ${growth >= 5 ? 'positive' : 'negative'}">${year === 'all' ? '2024 → 2025' : 'vs prev year'}</div>
        </div>
    `;
    document.getElementById('ordersStats').innerHTML = statsHTML;

    // Render charts
    renderOrdersCharts();
}

function renderOrdersCharts() {
    // Destroy existing charts
    Object.keys(allCharts).forEach(key => {
        if (key.startsWith('orders')) {
            allCharts[key]?.destroy();
        }
    });

    const chartsHTML = `
        <div class="chart-container full-width">
            <div class="chart-title">Annual Performance Trend</div>
            <div class="chart-subtitle">Year-over-year comparison</div>
            <canvas id="ordersAnnualChart"></canvas>
            <div class="insight-box warning">
                <h4>⚠️ Growth Deceleration</h4>
                <p>Growth slowing: 12.82% (2024) → 2.80% (2025). Merchant churn (547 declining + 491 churned) driving this decline. Urgent retention initiatives needed.</p>
            </div>
        </div>
        <div class="chart-container full-width">
            <div class="chart-title">Monthly Order Volume</div>
            <div class="chart-subtitle">3-year trend analysis</div>
            <canvas id="ordersMonthlyChart"></canvas>
            <div class="insight-box">
                <h4>📊 Seasonal Patterns</h4>
                <p>March peaks at 107K avg. Q4 2025 shows -10% decline (Nov: -10.03%, Dec: -9.52%) - correlates with merchant churn spike. Q1 2026 recovery critical.</p>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Quarterly Performance</div>
            <div class="chart-subtitle">Orders by quarter</div>
            <canvas id="ordersQuarterlyChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Completion Rate Trends</div>
            <div class="chart-subtitle">vs 95% target</div>
            <canvas id="ordersCompletionChart"></canvas>
            <div class="insight-box warning">
                <h4>🎯 Missing Target</h4>
                <p>Consistently below 95% target. March 2025 hit 86.83% - investigate root cause. Quality improvement program needed to reach industry standard.</p>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Order Status Distribution</div>
            <div class="chart-subtitle">Completed vs canceled</div>
            <canvas id="ordersStatusChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Top 10 Performing Months</div>
            <div class="chart-subtitle">Highest volume months</div>
            <canvas id="ordersTopMonthsChart"></canvas>
        </div>
    `;
    document.getElementById('ordersCharts').innerHTML = chartsHTML;

    // Create charts
    createOrdersAnnualChart();
    createOrdersMonthlyChart();
    createOrdersQuarterlyChart();
    createOrdersCompletionChart();
    createOrdersStatusChart();
    createOrdersTopMonthsChart();
}

function createOrdersAnnualChart() {
    const years = ['2023', '2024', '2025'];
    const orders = years.map(y => ordersData.annual[y].orders);
    const trips = years.map(y => ordersData.annual[y].trips);
    const completed = years.map(y => ordersData.annual[y].completed);

    allCharts.ordersAnnual = new Chart(document.getElementById('ordersAnnualChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Orders',
                data: orders,
                backgroundColor: colors.light
            }, {
                label: 'Delivery Trips',
                data: trips,
                backgroundColor: colors.secondary
            }, {
                label: 'Completed',
                data: completed,
                backgroundColor: colors.success
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000000).toFixed(1) + 'M' }
                }
            }
        }
    });
}

function createOrdersMonthlyChart() {
    const { year } = filters.orders;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let datasets = [];
    if (year === 'all') {
        datasets = [
            {
                label: '2023',
                data: ordersData.monthly[2023].map(m => m.orders),
                borderColor: colors.lighter,
                backgroundColor: 'rgba(147, 197, 253, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: '2024',
                data: ordersData.monthly[2024].map(m => m.orders),
                borderColor: colors.secondary,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: '2025',
                data: ordersData.monthly[2025].map(m => m.orders),
                borderColor: colors.primary,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }
        ];
    } else {
        datasets = [{
            label: year,
            data: ordersData.monthly[year].map(m => m.orders),
            borderColor: colors.primary,
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5
        }];
    }

    allCharts.ordersMonthly = new Chart(document.getElementById('ordersMonthlyChart'), {
        type: 'line',
        data: { labels: months, datasets },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });
}

function createOrdersQuarterlyChart() {
    const { year } = filters.orders;
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    let data, labels;
    if (year === 'all') {
        labels = ['2023 Q1', '2023 Q2', '2023 Q3', '2023 Q4',
                  '2024 Q1', '2024 Q2', '2024 Q3', '2024 Q4',
                  '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4'];
        data = [
            ...ordersData.quarterly[2023].map(q => q.orders),
            ...ordersData.quarterly[2024].map(q => q.orders),
            ...ordersData.quarterly[2025].map(q => q.orders)
        ];
    } else {
        labels = quarters;
        data = ordersData.quarterly[year].map(q => q.orders);
    }

    allCharts.ordersQuarterly = new Chart(document.getElementById('ordersQuarterlyChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Orders',
                data,
                backgroundColor: colors.secondary
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createOrdersCompletionChart() {
    const { year } = filters.orders;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let datasets = [];
    if (year === 'all') {
        datasets = [
            {
                label: '2023',
                data: ordersData.monthly[2023].map(m => m.completion),
                borderColor: colors.lighter,
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 3
            },
            {
                label: '2024',
                data: ordersData.monthly[2024].map(m => m.completion),
                borderColor: colors.secondary,
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 3
            },
            {
                label: '2025',
                data: ordersData.monthly[2025].map(m => m.completion),
                borderColor: colors.primary,
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 4
            },
            {
                label: 'Target (95%)',
                data: Array(12).fill(95),
                borderColor: colors.success,
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            }
        ];
    } else {
        datasets = [
            {
                label: `${year} Completion`,
                data: ordersData.monthly[year].map(m => m.completion),
                borderColor: colors.primary,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5
            },
            {
                label: 'Target (95%)',
                data: Array(12).fill(95),
                borderColor: colors.success,
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            }
        ];
    }

    allCharts.ordersCompletion = new Chart(document.getElementById('ordersCompletionChart'), {
        type: 'line',
        data: { labels: months, datasets },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 80,
                    max: 100,
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
}

function createOrdersStatusChart() {
    const years = ['2023', '2024', '2025'];
    const completed = years.map(y => ordersData.annual[y].completed);
    const canceled = years.map(y => ordersData.annual[y].canceled);

    allCharts.ordersStatus = new Chart(document.getElementById('ordersStatusChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Completed',
                data: completed,
                backgroundColor: colors.success
            }, {
                label: 'Canceled',
                data: canceled,
                backgroundColor: colors.danger
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000000).toFixed(1) + 'M' }
                }
            }
        }
    });
}

function createOrdersTopMonthsChart() {
    const allMonths = [];
    ['2023', '2024', '2025'].forEach(year => {
        ordersData.monthly[year].forEach(m => {
            allMonths.push({ label: `${m.month} ${year}`, orders: m.orders, year });
        });
    });

    const top10 = allMonths.sort((a, b) => b.orders - a.orders).slice(0, 10);
    const bgColors = top10.map(m => {
        if (m.year === '2023') return colors.lighter;
        if (m.year === '2024') return colors.secondary;
        return colors.primary;
    });

    allCharts.ordersTopMonths = new Chart(document.getElementById('ordersTopMonthsChart'), {
        type: 'bar',
        data: {
            labels: top10.map(m => m.label),
            datasets: [{
                label: 'Orders',
                data: top10.map(m => m.orders),
                backgroundColor: bgColors
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ============= PERFORMANCE PAGE =============

function loadPerformancePage() {
    const { year, quarter, month } = filters.performance;

    // Update subtitle
    let subtitle = 'Comprehensive 3-Year Analysis (2023-2025)';
    if (year !== 'all' || quarter !== 'all' || month !== 'all') {
        const parts = [];
        if (year !== 'all') parts.push(`Year ${year}`);
        if (quarter !== 'all') parts.push(quarter);
        if (month !== 'all') parts.push(month);
        subtitle = 'Filtered View: ' + parts.join(' | ');
    }
    document.getElementById('performanceSubtitle').textContent = subtitle;

    // Calculate stats
    let totalOrders = 0, totalTrips = 0, completionRate = 0, growth = 0;
    let merchants = 0, avgOrders = 0;

    if (year === 'all') {
        totalOrders = 3513640;
        totalTrips = 3102128;
        completionRate = 90.94;
        growth = 8.1;
        merchants = 2151;
        avgOrders = 827;
    } else {
        const yearData = ordersData.annual[year];
        totalOrders = yearData.orders;
        totalTrips = yearData.trips;
        completionRate = yearData.completionRate;
        growth = yearData.growth || 0;
        merchants = merchantData.all.activeMerchants[year];
        avgOrders = Math.round(totalOrders / merchants);

        if (quarter !== 'all') {
            const qIndex = parseInt(quarter.charAt(1)) - 1;
            const qData = ordersData.quarterly[year][qIndex];
            totalOrders = qData.orders;
            totalTrips = qData.trips;
            completionRate = qData.completion;
        }

        if (month !== 'all') {
            const monthData = ordersData.monthly[year].find(m => m.month === month);
            if (monthData) {
                totalOrders = monthData.orders;
                totalTrips = monthData.trips;
                completionRate = monthData.completion;
                growth = monthData.yoy || 0;
            }
        }
    }

    // Render stats
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${formatNumber(totalOrders)}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-change positive">Platform-wide</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(totalTrips)}</div>
            <div class="stat-label">Delivery Trips</div>
            <div class="stat-change neutral">${((totalTrips/totalOrders)*100).toFixed(1)}% conversion</div>
        </div>
        <div class="stat-card ${completionRate >= 91 ? 'highlight' : 'warning'}">
            <div class="stat-value ${completionRate >= 91 ? 'success' : 'danger'}">${completionRate.toFixed(1)}%</div>
            <div class="stat-label">Completion Rate</div>
            <div class="stat-change ${completionRate >= 91 ? 'positive' : 'negative'}">${completionRate >= 91 ? 'Good' : 'Needs improvement'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${merchants.toLocaleString()}</div>
            <div class="stat-label">Active Merchants</div>
            <div class="stat-change neutral">${year === 'all' ? 'Unique count' : year}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgOrders.toLocaleString()}</div>
            <div class="stat-label">Avg Orders/Merchant</div>
            <div class="stat-change neutral">Per merchant</div>
        </div>
        <div class="stat-card ${growth >= 5 ? 'highlight' : 'warning'}">
            <div class="stat-value ${growth >= 5 ? 'success' : 'danger'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</div>
            <div class="stat-label">Growth Rate</div>
            <div class="stat-change ${growth >= 5 ? 'positive' : 'negative'}">YoY change</div>
        </div>
    `;
    document.getElementById('performanceStats').innerHTML = statsHTML;

    // Render charts
    renderPerformanceCharts();
}

function renderPerformanceCharts() {
    // Destroy existing charts
    Object.keys(allCharts).forEach(key => {
        if (key.startsWith('performance')) {
            allCharts[key]?.destroy();
        }
    });

    const chartsHTML = `
        <div class="chart-container full-width">
            <div class="chart-title">3-Year Performance Overview</div>
            <div class="chart-subtitle">Orders, trips, and completion trends</div>
            <canvas id="performanceOverviewChart"></canvas>
            <div class="insight-box success">
                <h4>📊 Platform Growth</h4>
                <p>3.51M total orders across 3 years. Strong 2024 growth (+12.82%) offset by 2025 deceleration (+2.80%). Strategic intervention needed to restore momentum.</p>
            </div>
        </div>
        <div class="chart-container full-width">
            <div class="chart-title">Monthly Trends Analysis</div>
            <div class="chart-subtitle">36-month performance tracking</div>
            <canvas id="performanceMonthlyChart"></canvas>
            <div class="insight-box">
                <h4>🔍 Pattern Recognition</h4>
                <p>Clear seasonality: Q2 (Apr-Jun) and Q4 (Oct-Dec) strongest. Q4 2025 anomaly (-10% decline) requires immediate investigation - likely merchant churn impact.</p>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Quarterly Comparison</div>
            <div class="chart-subtitle">3-year quarterly breakdown</div>
            <canvas id="performanceQuarterlyChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Completion Rate Trajectory</div>
            <div class="chart-subtitle">Quality metrics over time</div>
            <canvas id="performanceCompletionChart"></canvas>
            <div class="insight-box warning">
                <h4>⚠️ Quality Decline</h4>
                <p>Downward trend: 91.75% (2023) → 90.94% (2025). Gap to 95% target widening. Root causes: March 2025 spike (86.83%), operational issues, merchant quality degradation.</p>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Growth Rate Evolution</div>
            <div class="chart-subtitle">YoY percentage changes</div>
            <canvas id="performanceGrowthChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Merchant Activity Trends</div>
            <div class="chart-subtitle">Active merchant count by year</div>
            <canvas id="performanceMerchantsChart"></canvas>
            <div class="insight-box success">
                <h4>📈 Merchant Growth</h4>
                <p>Active merchants: 1,192 (2023) → 1,498 (2025) = +25.7%. But 547 declining + 491 churned = 48% churn risk. Net growth masking underlying fragility.</p>
            </div>
        </div>
    `;
    document.getElementById('performanceCharts').innerHTML = chartsHTML;

    // Create charts
    createPerformanceOverviewChart();
    createPerformanceMonthlyChart();
    createPerformanceQuarterlyChart();
    createPerformanceCompletionChart();
    createPerformanceGrowthChart();
    createPerformanceMerchantsChart();
}

function createPerformanceOverviewChart() {
    const years = ['2023', '2024', '2025'];
    const orders = years.map(y => ordersData.annual[y].orders);
    const trips = years.map(y => ordersData.annual[y].trips);
    const completion = years.map(y => ordersData.annual[y].completionRate);

    allCharts.performanceOverview = new Chart(document.getElementById('performanceOverviewChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Orders',
                data: orders,
                backgroundColor: colors.secondary,
                yAxisID: 'y'
            }, {
                label: 'Trips',
                data: trips,
                backgroundColor: colors.light,
                yAxisID: 'y'
            }, {
                label: 'Completion %',
                data: completion,
                type: 'line',
                borderColor: colors.success,
                borderWidth: 3,
                yAxisID: 'y1',
                fill: false,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { callback: v => (v/1000000).toFixed(1) + 'M' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    min: 85,
                    max: 95,
                    grid: { drawOnChartArea: false },
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
}

function createPerformanceMonthlyChart() {
    const { year } = filters.performance;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let datasets = [];
    if (year === 'all') {
        datasets = [
            {
                label: '2023',
                data: ordersData.monthly[2023].map(m => m.orders),
                borderColor: colors.lighter,
                backgroundColor: 'rgba(147, 197, 253, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: '2024',
                data: ordersData.monthly[2024].map(m => m.orders),
                borderColor: colors.secondary,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: '2025',
                data: ordersData.monthly[2025].map(m => m.orders),
                borderColor: colors.primary,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }
        ];
    } else {
        datasets = [{
            label: year,
            data: ordersData.monthly[year].map(m => m.orders),
            borderColor: colors.primary,
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5
        }];
    }

    allCharts.performanceMonthly = new Chart(document.getElementById('performanceMonthlyChart'), {
        type: 'line',
        data: { labels: months, datasets },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });
}

function createPerformanceQuarterlyChart() {
    const labels = ['2023 Q1', '2023 Q2', '2023 Q3', '2023 Q4',
                    '2024 Q1', '2024 Q2', '2024 Q3', '2024 Q4',
                    '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4'];
    const data = [
        ...ordersData.quarterly[2023].map(q => q.orders),
        ...ordersData.quarterly[2024].map(q => q.orders),
        ...ordersData.quarterly[2025].map(q => q.orders)
    ];

    allCharts.performanceQuarterly = new Chart(document.getElementById('performanceQuarterlyChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Orders',
                data,
                backgroundColor: colors.secondary
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createPerformanceCompletionChart() {
    const years = ['2023', '2024', '2025'];
    const completion = years.map(y => ordersData.annual[y].completionRate);

    allCharts.performanceCompletion = new Chart(document.getElementById('performanceCompletionChart'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Completion Rate',
                data: completion,
                borderColor: colors.primary,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6
            }, {
                label: 'Target (95%)',
                data: [95, 95, 95],
                borderColor: colors.success,
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 85,
                    max: 100,
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
}

function createPerformanceGrowthChart() {
    const years = ['2024', '2025'];
    const growth = [12.82, 2.80];

    allCharts.performanceGrowth = new Chart(document.getElementById('performanceGrowthChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'YoY Growth %',
                data: growth,
                backgroundColor: [colors.success, colors.warning]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v + '%' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createPerformanceMerchantsChart() {
    const years = ['2023', '2024', '2025'];
    const merchants = years.map(y => merchantData.all.activeMerchants[y]);

    allCharts.performanceMerchants = new Chart(document.getElementById('performanceMerchantsChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Active Merchants',
                data: merchants,
                backgroundColor: colors.secondary
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// ============= UTILITY FUNCTIONS =============

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
}

// ============= EXPORT FUNCTIONALITY =============

// Toggle export menu
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');

    exportBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        exportMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!exportMenu.contains(e.target) && !exportBtn.contains(e.target)) {
            exportMenu.classList.remove('active');
        }
    });
});

function handleExport(format) {
    document.getElementById('exportMenu').classList.remove('active');

    const page = currentPage;
    const timestamp = new Date().toISOString().split('T')[0];

    switch(page) {
        case 'home':
            exportHomePage(format, timestamp);
            break;
        case 'merchants':
            exportMerchantsPage(format, timestamp);
            break;
        case 'orders':
            exportOrdersPage(format, timestamp);
            break;
        case 'performance':
            exportPerformancePage(format, timestamp);
            break;
        default:
            alert('Export not available for this page');
    }
}

// ============= HOME PAGE EXPORT =============

function exportHomePage(format, timestamp) {
    const data = {
        title: 'Analytics Hub - Overview',
        date: timestamp,
        summary: {
            'Total Merchants': '2,151',
            'Total Branches': '1,124',
            'Merchant Retention': '39.5%',
            'Total Orders': '3.51M',
            'Completion Rate': '90.9%',
            'YoY Growth': '+8.1%'
        }
    };

    if (format === 'csv') {
        exportHomeCSV(data, timestamp);
    } else if (format === 'xlsx') {
        exportHomeXLSX(data, timestamp);
    } else if (format === 'pdf') {
        exportHomePDF(data, timestamp);
    }
}

function exportHomeCSV(data, timestamp) {
    let csv = 'Analytics Hub - Overview\n';
    csv += `Export Date: ${timestamp}\n\n`;
    csv += 'Metric,Value\n';

    Object.entries(data.summary).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
    });

    downloadFile(csv, `analytics-overview-${timestamp}.csv`, 'text/csv');
}

function exportHomeXLSX(data, timestamp) {
    const ws_data = [
        ['Analytics Hub - Overview'],
        [`Export Date: ${timestamp}`],
        [],
        ['Metric', 'Value'],
        ...Object.entries(data.summary)
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Set column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    XLSX.writeFile(wb, `analytics-overview-${timestamp}.xlsx`);
}

function exportHomePDF(data, timestamp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text('Analytics Hub - Overview', 14, 20);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${timestamp}`, 14, 28);

    // Summary table
    const tableData = Object.entries(data.summary).map(([key, value]) => [key, value]);

    doc.autoTable({
        startY: 35,
        head: [['Metric', 'Value']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 }
    });

    doc.save(`analytics-overview-${timestamp}.pdf`);
}

// ============= MERCHANTS PAGE EXPORT =============

function exportMerchantsPage(format, timestamp) {
    const { year, size, area } = filters.merchants;
    const data = merchantData.all;

    // Build export data structure
    const exportData = {
        title: 'Merchant Analytics Report',
        date: timestamp,
        filters: { year, size, area },
        businessSize: Object.entries(data.businessSize).map(([key, val]) => ({
            size: key.charAt(0).toUpperCase() + key.slice(1),
            count: val.count,
            avgOrders: val.avgOrders,
            totalOrders: val.totalOrders,
            percentage: val.pct.toFixed(2) + '%',
            completion: val.completion.toFixed(1) + '%'
        })),
        multiBranch: data.multiBranch.map(m => ({
            merchant: m.name,
            branches: m.branches,
            orders: m.orders,
            avgPerBranch: m.avgPerBranch
        })),
        geographic: Object.entries(data.geographic).map(([key, val]) => ({
            area: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            merchants: val.merchants,
            orders: val.orders,
            completion: val.completion.toFixed(1) + '%'
        })),
        growthCohorts: Object.entries(data.growthCohorts).map(([key, val]) => ({
            cohort: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            merchants: val.count,
            orders2024: val.orders2024,
            orders2025: val.orders2025,
            change: val.change !== null ? val.change.toFixed(1) + '%' : 'N/A'
        }))
    };

    if (format === 'csv') {
        exportMerchantsCSV(exportData, timestamp);
    } else if (format === 'xlsx') {
        exportMerchantsXLSX(exportData, timestamp);
    } else if (format === 'pdf') {
        exportMerchantsPDF(exportData, timestamp);
    }
}

function exportMerchantsCSV(data, timestamp) {
    let csv = 'Merchant Analytics Report\n';
    csv += `Export Date: ${timestamp}\n`;
    csv += `Filters: Year=${data.filters.year}, Size=${data.filters.size}, Area=${data.filters.area}\n\n`;

    // Business Size
    csv += 'BUSINESS SIZE DISTRIBUTION\n';
    csv += 'Size,Count,Avg Orders,Total Orders,Percentage,Completion Rate\n';
    data.businessSize.forEach(row => {
        csv += `${row.size},${row.count},${row.avgOrders},${row.totalOrders},${row.percentage},${row.completion}\n`;
    });

    csv += '\nMULTI-BRANCH MERCHANTS\n';
    csv += 'Merchant,Branches,Orders,Avg Per Branch\n';
    data.multiBranch.forEach(row => {
        csv += `${row.merchant},${row.branches},${row.orders},${row.avgPerBranch}\n`;
    });

    csv += '\nGEOGRAPHIC DISTRIBUTION\n';
    csv += 'Area,Merchants,Orders,Completion Rate\n';
    data.geographic.forEach(row => {
        csv += `${row.area},${row.merchants},${row.orders},${row.completion}\n`;
    });

    csv += '\nGROWTH COHORTS (2024 vs 2025)\n';
    csv += 'Cohort,Merchants,Orders 2024,Orders 2025,Change\n';
    data.growthCohorts.forEach(row => {
        csv += `${row.cohort},${row.merchants},${row.orders2024},${row.orders2025},${row.change}\n`;
    });

    downloadFile(csv, `merchant-analytics-${timestamp}.csv`, 'text/csv');
}

function exportMerchantsXLSX(data, timestamp) {
    const wb = XLSX.utils.book_new();

    // Business Size sheet
    const ws1_data = [
        ['Business Size Distribution'],
        [],
        ['Size', 'Count', 'Avg Orders', 'Total Orders', 'Percentage', 'Completion Rate'],
        ...data.businessSize.map(r => [r.size, r.count, r.avgOrders, r.totalOrders, r.percentage, r.completion])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1_data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Business Size');

    // Multi-Branch sheet
    const ws2_data = [
        ['Multi-Branch Merchants'],
        [],
        ['Merchant', 'Branches', 'Orders', 'Avg Per Branch'],
        ...data.multiBranch.map(r => [r.merchant, r.branches, r.orders, r.avgPerBranch])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2_data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Multi-Branch');

    // Geographic sheet
    const ws3_data = [
        ['Geographic Distribution'],
        [],
        ['Area', 'Merchants', 'Orders', 'Completion Rate'],
        ...data.geographic.map(r => [r.area, r.merchants, r.orders, r.completion])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3_data);
    XLSX.utils.book_append_sheet(wb, ws3, 'Geographic');

    // Growth Cohorts sheet
    const ws4_data = [
        ['Growth Cohorts (2024 vs 2025)'],
        [],
        ['Cohort', 'Merchants', 'Orders 2024', 'Orders 2025', 'Change'],
        ...data.growthCohorts.map(r => [r.cohort, r.merchants, r.orders2024, r.orders2025, r.change])
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(ws4_data);
    XLSX.utils.book_append_sheet(wb, ws4, 'Growth Cohorts');

    XLSX.writeFile(wb, `merchant-analytics-${timestamp}.xlsx`);
}

function exportMerchantsPDF(data, timestamp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text('Merchant Analytics Report', 14, 20);

    // Date and Filters
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${timestamp}`, 14, 28);
    doc.text(`Filters: Year=${data.filters.year}, Size=${data.filters.size}, Area=${data.filters.area}`, 14, 34);

    let yPos = 45;

    // Business Size
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Business Size Distribution', 14, yPos);
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        head: [['Size', 'Count', 'Avg Orders', 'Total Orders', '%', 'Completion']],
        body: data.businessSize.map(r => [r.size, r.count, r.avgOrders, r.totalOrders, r.percentage, r.completion]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Multi-Branch (only if fits on page)
    if (yPos < 230) {
        doc.setFontSize(14);
        doc.text('Top Multi-Branch Merchants', 14, yPos);
        yPos += 5;

        doc.autoTable({
            startY: yPos,
            head: [['Merchant', 'Branches', 'Orders', 'Avg/Branch']],
            body: data.multiBranch.slice(0, 6).map(r => [r.merchant, r.branches, r.orders, r.avgPerBranch]),
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 8 }
        });
    }

    // New page for remaining data
    doc.addPage();
    yPos = 20;

    // Geographic
    doc.setFontSize(14);
    doc.text('Geographic Distribution', 14, yPos);
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        head: [['Area', 'Merchants', 'Orders', 'Completion']],
        body: data.geographic.map(r => [r.area, r.merchants, r.orders, r.completion]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Growth Cohorts
    doc.setFontSize(14);
    doc.text('Growth Cohorts (2024 vs 2025)', 14, yPos);
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        head: [['Cohort', 'Merchants', '2024 Orders', '2025 Orders', 'Change']],
        body: data.growthCohorts.map(r => [r.cohort, r.merchants, r.orders2024, r.orders2025, r.change]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
    });

    doc.save(`merchant-analytics-${timestamp}.pdf`);
}

// ============= ORDERS PAGE EXPORT =============

function exportOrdersPage(format, timestamp) {
    const { year, quarter, status } = filters.orders;

    // Build monthly data
    const monthlyData = [];
    if (year === 'all') {
        ['2023', '2024', '2025'].forEach(y => {
            ordersData.monthly[y].forEach(m => {
                monthlyData.push({
                    period: `${m.month} ${y}`,
                    orders: m.orders,
                    trips: m.trips,
                    completed: m.completed,
                    completion: m.completion.toFixed(1) + '%',
                    yoy: m.yoy !== null ? m.yoy.toFixed(1) + '%' : 'N/A',
                    mom: m.mom !== null ? m.mom.toFixed(1) + '%' : 'N/A'
                });
            });
        });
    } else {
        ordersData.monthly[year].forEach(m => {
            monthlyData.push({
                period: `${m.month} ${year}`,
                orders: m.orders,
                trips: m.trips,
                completed: m.completed,
                completion: m.completion.toFixed(1) + '%',
                yoy: m.yoy !== null ? m.yoy.toFixed(1) + '%' : 'N/A',
                mom: m.mom !== null ? m.mom.toFixed(1) + '%' : 'N/A'
            });
        });
    }

    const exportData = {
        title: 'Orders & Delivery Analytics',
        date: timestamp,
        filters: { year, quarter, status },
        monthly: monthlyData,
        annual: Object.entries(ordersData.annual).map(([y, data]) => ({
            year: y,
            orders: data.orders,
            trips: data.trips,
            completed: data.completed,
            canceled: data.canceled,
            completionRate: data.completionRate.toFixed(1) + '%',
            growth: data.growth !== null ? data.growth.toFixed(1) + '%' : 'N/A'
        }))
    };

    if (format === 'csv') {
        exportOrdersCSV(exportData, timestamp);
    } else if (format === 'xlsx') {
        exportOrdersXLSX(exportData, timestamp);
    } else if (format === 'pdf') {
        exportOrdersPDF(exportData, timestamp);
    }
}

function exportOrdersCSV(data, timestamp) {
    let csv = 'Orders & Delivery Analytics Report\n';
    csv += `Export Date: ${timestamp}\n`;
    csv += `Filters: Year=${data.filters.year}, Quarter=${data.filters.quarter}, Status=${data.filters.status}\n\n`;

    // Annual Summary
    csv += 'ANNUAL SUMMARY\n';
    csv += 'Year,Orders,Trips,Completed,Canceled,Completion Rate,YoY Growth\n';
    data.annual.forEach(row => {
        csv += `${row.year},${row.orders},${row.trips},${row.completed},${row.canceled},${row.completionRate},${row.growth}\n`;
    });

    csv += '\nMONTHLY BREAKDOWN\n';
    csv += 'Period,Orders,Trips,Completed,Completion Rate,YoY Growth,MoM Growth\n';
    data.monthly.forEach(row => {
        csv += `${row.period},${row.orders},${row.trips},${row.completed},${row.completion},${row.yoy},${row.mom}\n`;
    });

    downloadFile(csv, `orders-analytics-${timestamp}.csv`, 'text/csv');
}

function exportOrdersXLSX(data, timestamp) {
    const wb = XLSX.utils.book_new();

    // Annual Summary sheet
    const ws1_data = [
        ['Annual Summary'],
        [],
        ['Year', 'Orders', 'Trips', 'Completed', 'Canceled', 'Completion Rate', 'YoY Growth'],
        ...data.annual.map(r => [r.year, r.orders, r.trips, r.completed, r.canceled, r.completionRate, r.growth])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1_data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Annual Summary');

    // Monthly Breakdown sheet
    const ws2_data = [
        ['Monthly Breakdown'],
        [],
        ['Period', 'Orders', 'Trips', 'Completed', 'Completion Rate', 'YoY Growth', 'MoM Growth'],
        ...data.monthly.map(r => [r.period, r.orders, r.trips, r.completed, r.completion, r.yoy, r.mom])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2_data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Breakdown');

    XLSX.writeFile(wb, `orders-analytics-${timestamp}.xlsx`);
}

function exportOrdersPDF(data, timestamp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text('Orders & Delivery Analytics', 14, 20);

    // Date and Filters
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${timestamp}`, 14, 28);
    doc.text(`Filters: Year=${data.filters.year}, Quarter=${data.filters.quarter}, Status=${data.filters.status}`, 14, 34);

    // Annual Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Annual Summary', 14, 45);

    doc.autoTable({
        startY: 50,
        head: [['Year', 'Orders', 'Trips', 'Completed', 'Canceled', 'Completion', 'Growth']],
        body: data.annual.map(r => [r.year, r.orders, r.trips, r.completed, r.canceled, r.completionRate, r.growth]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
    });

    // Monthly Breakdown (new page)
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Monthly Breakdown', 14, 20);

    doc.autoTable({
        startY: 25,
        head: [['Period', 'Orders', 'Trips', 'Completed', 'Completion', 'YoY', 'MoM']],
        body: data.monthly.map(r => [r.period, r.orders, r.trips, r.completed, r.completion, r.yoy, r.mom]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7 }
    });

    doc.save(`orders-analytics-${timestamp}.pdf`);
}

// ============= PERFORMANCE PAGE EXPORT =============

function exportPerformancePage(format, timestamp) {
    const { year, quarter, month } = filters.performance;

    // Build comprehensive monthly data
    const monthlyData = [];
    ['2023', '2024', '2025'].forEach(y => {
        ordersData.monthly[y].forEach(m => {
            monthlyData.push({
                period: `${m.month} ${y}`,
                quarter: 'Q' + Math.ceil(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m.month) / 3),
                orders: m.orders,
                trips: m.trips,
                completed: m.completed,
                completion: m.completion.toFixed(1) + '%',
                yoy: m.yoy !== null ? m.yoy.toFixed(1) + '%' : 'N/A'
            });
        });
    });

    const exportData = {
        title: 'Platform Performance Analytics',
        date: timestamp,
        filters: { year, quarter, month },
        monthly: monthlyData,
        annual: Object.entries(ordersData.annual).map(([y, data]) => ({
            year: y,
            orders: data.orders,
            trips: data.trips,
            completionRate: data.completionRate.toFixed(1) + '%',
            growth: data.growth !== null ? data.growth.toFixed(1) + '%' : 'N/A',
            merchants: merchantData.all.activeMerchants[y],
            avgOrdersPerMerchant: Math.round(data.orders / merchantData.all.activeMerchants[y])
        }))
    };

    if (format === 'csv') {
        exportPerformanceCSV(exportData, timestamp);
    } else if (format === 'xlsx') {
        exportPerformanceXLSX(exportData, timestamp);
    } else if (format === 'pdf') {
        exportPerformancePDF(exportData, timestamp);
    }
}

function exportPerformanceCSV(data, timestamp) {
    let csv = 'Platform Performance Analytics Report\n';
    csv += `Export Date: ${timestamp}\n`;
    csv += `Filters: Year=${data.filters.year}, Quarter=${data.filters.quarter}, Month=${data.filters.month}\n\n`;

    // Annual Performance
    csv += 'ANNUAL PERFORMANCE\n';
    csv += 'Year,Orders,Trips,Completion Rate,YoY Growth,Active Merchants,Avg Orders/Merchant\n';
    data.annual.forEach(row => {
        csv += `${row.year},${row.orders},${row.trips},${row.completionRate},${row.growth},${row.merchants},${row.avgOrdersPerMerchant}\n`;
    });

    csv += '\nMONTHLY PERFORMANCE (3-YEAR HISTORY)\n';
    csv += 'Period,Quarter,Orders,Trips,Completed,Completion Rate,YoY Growth\n';
    data.monthly.forEach(row => {
        csv += `${row.period},${row.quarter},${row.orders},${row.trips},${row.completed},${row.completion},${row.yoy}\n`;
    });

    downloadFile(csv, `performance-analytics-${timestamp}.csv`, 'text/csv');
}

function exportPerformanceXLSX(data, timestamp) {
    const wb = XLSX.utils.book_new();

    // Annual Performance sheet
    const ws1_data = [
        ['Annual Performance'],
        [],
        ['Year', 'Orders', 'Trips', 'Completion Rate', 'YoY Growth', 'Active Merchants', 'Avg Orders/Merchant'],
        ...data.annual.map(r => [r.year, r.orders, r.trips, r.completionRate, r.growth, r.merchants, r.avgOrdersPerMerchant])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1_data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Annual Performance');

    // Monthly Performance sheet
    const ws2_data = [
        ['Monthly Performance (3-Year History)'],
        [],
        ['Period', 'Quarter', 'Orders', 'Trips', 'Completed', 'Completion Rate', 'YoY Growth'],
        ...data.monthly.map(r => [r.period, r.quarter, r.orders, r.trips, r.completed, r.completion, r.yoy])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2_data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Performance');

    XLSX.writeFile(wb, `performance-analytics-${timestamp}.xlsx`);
}

function exportPerformancePDF(data, timestamp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text('Platform Performance Analytics', 14, 20);

    // Date and Filters
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${timestamp}`, 14, 28);
    doc.text(`Filters: Year=${data.filters.year}, Quarter=${data.filters.quarter}, Month=${data.filters.month}`, 14, 34);

    // Annual Performance
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Annual Performance', 14, 45);

    doc.autoTable({
        startY: 50,
        head: [['Year', 'Orders', 'Trips', 'Completion', 'Growth', 'Merchants', 'Avg/Merchant']],
        body: data.annual.map(r => [r.year, r.orders, r.trips, r.completionRate, r.growth, r.merchants, r.avgOrdersPerMerchant]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
    });

    // Monthly Performance (new page)
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Monthly Performance (3-Year History)', 14, 20);

    doc.autoTable({
        startY: 25,
        head: [['Period', 'Q', 'Orders', 'Trips', 'Completed', 'Completion', 'YoY']],
        body: data.monthly.map(r => [r.period, r.quarter, r.orders, r.trips, r.completed, r.completion, r.yoy]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 6.5 }
    });

    doc.save(`performance-analytics-${timestamp}.pdf`);
}

// ============= UTILITY FUNCTIONS =============

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============= ORDERING BEHAVIOR PAGE =============

let behaviorData = [];
let behaviorPeriodSummary = {};
let behaviorMerchantTotals = {};

// Load ordering behavior data
async function loadOrderingBehaviorData() {
    try {
        const response = await fetch('data/kuwait_ordering_with_avg_amounts_2025.csv');
        const text = await response.text();

        // Parse CSV
        const lines = text.replace(/^\uFEFF/, '').split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        behaviorData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || '';
            });
            behaviorData.push(row);
        }

        // Process data
        processBehaviorData();

        console.log('Ordering behavior data loaded:', behaviorData.length, 'rows');
    } catch (error) {
        console.error('Error loading ordering behavior data:', error);
    }
}

function processBehaviorData() {
    behaviorPeriodSummary = {};
    behaviorMerchantTotals = {};

    behaviorData.forEach(row => {
        const period = row['Time Period'];
        if (!behaviorPeriodSummary[period]) {
            behaviorPeriodSummary[period] = {
                totalOrders: parseInt(row['Total Period Orders']) || 0,
                avgAmount: parseFloat(row['Avg Order Amount (KD)']) || 0,
                percentOfTotal: parseFloat(row['Period % of Total']) || 0
            };
        }

        const merchant = row['Merchant Name'];
        const orderCount = parseInt(row['Order Count']) || 0;

        if (!behaviorMerchantTotals[merchant]) {
            behaviorMerchantTotals[merchant] = 0;
        }
        behaviorMerchantTotals[merchant] += orderCount;
    });
}

function loadOrderingBehaviorPage() {
    if (behaviorData.length === 0) {
        loadOrderingBehaviorData().then(() => {
            initializeOrderingBehaviorPage();
        });
    } else {
        initializeOrderingBehaviorPage();
    }
}

function initializeOrderingBehaviorPage() {
    updateBehaviorMetrics();
    createBehaviorCharts();
    setupBehaviorEventListeners();
    updateBehaviorPeriodAnalysis('all');
    updateBehaviorMerchantTable();
}

function updateBehaviorMetrics() {
    const totalOrders = Object.values(behaviorPeriodSummary).reduce((sum, p) => sum + p.totalOrders, 0);
    const avgAmount = Object.values(behaviorPeriodSummary).reduce((sum, p) => sum + p.avgAmount, 0) / Object.keys(behaviorPeriodSummary).length;

    const peakPeriod = Object.entries(behaviorPeriodSummary)
        .sort((a, b) => b[1].totalOrders - a[1].totalOrders)[0];

    const topMerchant = Object.entries(behaviorMerchantTotals)
        .sort((a, b) => b[1] - a[1])[0];

    document.getElementById('behaviorTotalOrders').textContent = totalOrders.toLocaleString();
    document.getElementById('behaviorPeakPeriod').textContent = peakPeriod[0].split('(')[0].trim();
    document.getElementById('behaviorAvgAmount').textContent = `KD ${avgAmount.toFixed(2)}`;
    document.getElementById('behaviorTopMerchant').textContent = topMerchant[0];
}

function createBehaviorCharts() {
    const periods = Object.keys(behaviorPeriodSummary);
    const orderCounts = periods.map(p => behaviorPeriodSummary[p].totalOrders);
    const avgAmounts = periods.map(p => behaviorPeriodSummary[p].avgAmount);

    const periodColors = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af', '#1e3a8a'];

    // Orders Bar Chart
    allCharts.behaviorOrders = new Chart(document.getElementById('behaviorOrdersChart'), {
        type: 'bar',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                label: 'Orders',
                data: orderCounts,
                backgroundColor: periodColors,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Orders: ${context.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });

    // Pie Chart
    allCharts.behaviorPie = new Chart(document.getElementById('behaviorPieChart'), {
        type: 'doughnut',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                data: orderCounts,
                backgroundColor: periodColors,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Average Amount Chart
    allCharts.behaviorAvg = new Chart(document.getElementById('behaviorAvgChart'), {
        type: 'line',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                label: 'Avg Order Amount (KD)',
                data: avgAmounts,
                borderColor: colors.success,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: colors.success,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (context) => `KD ${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 11,
                    max: 15,
                    ticks: { callback: v => `KD ${v}` }
                }
            }
        }
    });

    // Top Merchants Chart
    const topMerchants = Object.entries(behaviorMerchantTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    allCharts.behaviorTopMerchants = new Chart(document.getElementById('behaviorTopMerchantsChart'), {
        type: 'bar',
        data: {
            labels: topMerchants.map(m => m[0]),
            datasets: [{
                label: 'Total Orders',
                data: topMerchants.map(m => m[1]),
                backgroundColor: colors.primary,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Orders: ${context.parsed.x.toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });

    // Merchant Performance Chart
    createBehaviorMerchantPerformanceChart();
}

function createBehaviorMerchantPerformanceChart() {
    const topMerchants = Object.entries(behaviorMerchantTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(m => m[0]);

    const periods = Object.keys(behaviorPeriodSummary);
    const periodColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    const datasets = topMerchants.map((merchant, index) => {
        const data = periods.map(period => {
            const row = behaviorData.find(r => r['Merchant Name'] === merchant && r['Time Period'] === period);
            return row ? parseInt(row['Order Count']) : 0;
        });

        return {
            label: merchant,
            data: data,
            borderColor: periodColors[index],
            backgroundColor: periodColors[index] + '20',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
        };
    });

    allCharts.behaviorMerchantPerformance = new Chart(document.getElementById('behaviorMerchantPerformanceChart'), {
        type: 'line',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} orders`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => (v/1000).toFixed(0) + 'K' }
                }
            }
        }
    });
}

function updateBehaviorPeriodAnalysis(selectedPeriod) {
    const filteredData = selectedPeriod === 'all'
        ? behaviorData
        : behaviorData.filter(row => row['Time Period'] === selectedPeriod);

    // Update stats cards
    if (selectedPeriod === 'all') {
        const cardsHTML = Object.entries(behaviorPeriodSummary).map(([period, stats]) => `
            <div class="stat-card">
                <div class="stat-label">${period.split('(')[0].trim()}</div>
                <div class="stat-value">${stats.totalOrders.toLocaleString()}</div>
                <div class="stat-change neutral">KD ${stats.avgAmount.toFixed(2)} avg</div>
            </div>
        `).join('');
        document.getElementById('behaviorPeriodStats').innerHTML = cardsHTML;
    } else {
        const stats = behaviorPeriodSummary[selectedPeriod];
        const cardsHTML = `
            <div class="stat-card highlight">
                <div class="stat-label">Total Orders</div>
                <div class="stat-value success">${stats.totalOrders.toLocaleString()}</div>
                <div class="stat-change positive">Selected period</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Order Amount</div>
                <div class="stat-value">KD ${stats.avgAmount.toFixed(2)}</div>
                <div class="stat-change neutral">Per order</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">% of Total Orders</div>
                <div class="stat-value">${stats.percentOfTotal.toFixed(1)}%</div>
                <div class="stat-change neutral">Platform share</div>
            </div>
        `;
        document.getElementById('behaviorPeriodStats').innerHTML = cardsHTML;
    }

    // Update merchants table
    const tableBody = document.getElementById('behaviorMerchantsTable');
    tableBody.innerHTML = filteredData.map(row => {
        const isTopRank = parseInt(row['Rank']) <= 3;
        return `
            <tr style="border-bottom: 1px solid #f1f5f9; ${isTopRank ? 'background: #f0f9ff;' : ''}">
                <td style="padding: 12px;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: ${isTopRank ? '#3b82f6' : '#e2e8f0'}; color: ${isTopRank ? 'white' : '#64748b'}; border-radius: 6px; font-weight: 700; font-size: 13px;">
                        ${row['Rank']}
                    </span>
                </td>
                <td style="padding: 12px; font-weight: ${isTopRank ? '600' : '400'}; color: ${isTopRank ? '#0f172a' : '#475569'};">${row['Merchant Name']}</td>
                <td style="padding: 12px; color: #64748b;">${row['Time Period'].split('(')[0].trim()}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #0f172a;">${parseInt(row['Order Count']).toLocaleString()}</td>
                <td style="padding: 12px; text-align: right; color: #64748b;">${row['Percentage of Period']}%</td>
            </tr>
        `;
    }).join('');
}

function updateBehaviorMerchantTable(filters = {}) {
    let filteredData = [...behaviorData];

    if (filters.period && filters.period !== 'all') {
        filteredData = filteredData.filter(row => row['Time Period'] === filters.period);
    }

    if (filters.rank && filters.rank !== 'all') {
        const maxRank = parseInt(filters.rank);
        filteredData = filteredData.filter(row => parseInt(row['Rank']) <= maxRank);
    }

    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = filteredData.filter(row =>
            row['Merchant Name'].toLowerCase().includes(searchTerm)
        );
    }

    filteredData.sort((a, b) => parseInt(b['Order Count']) - parseInt(a['Order Count']));

    const tableBody = document.getElementById('behaviorMerchantDetailsTable');
    tableBody.innerHTML = filteredData.map(row => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 500; color: #0f172a;">${row['Merchant Name']}</td>
            <td style="padding: 12px; color: #64748b;">${row['Time Period'].split('(')[0].trim()}</td>
            <td style="padding: 12px; text-align: center;">
                <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-weight: 600; font-size: 12px;">
                    #${row['Rank']}
                </span>
            </td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #0f172a;">${parseInt(row['Order Count']).toLocaleString()}</td>
            <td style="padding: 12px; text-align: right; color: #64748b;">${row['Percentage of Period']}%</td>
        </tr>
    `).join('');
}

function setupBehaviorEventListeners() {
    document.getElementById('behaviorPeriodSelector')?.addEventListener('change', (e) => {
        updateBehaviorPeriodAnalysis(e.target.value);
    });

    const merchantSearch = document.getElementById('behaviorMerchantSearch');
    const merchantPeriodFilter = document.getElementById('behaviorMerchantPeriodFilter');
    const merchantRankFilter = document.getElementById('behaviorMerchantRankFilter');

    const updateFilters = () => {
        updateBehaviorMerchantTable({
            search: merchantSearch?.value || '',
            period: merchantPeriodFilter?.value || 'all',
            rank: merchantRankFilter?.value || 'all'
        });
    };

    merchantSearch?.addEventListener('input', updateFilters);
    merchantPeriodFilter?.addEventListener('change', updateFilters);
    merchantRankFilter?.addEventListener('change', updateFilters);
}

// Initialize on load
window.addEventListener('load', function() {
    console.log('Analytics Hub loaded successfully');
});
