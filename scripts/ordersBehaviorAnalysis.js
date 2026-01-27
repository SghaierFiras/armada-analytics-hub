// Global variables
let orderData = [];
let periodSummary = {};
let merchantTotals = {};

// Color scheme
const colors = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#0dcaf0',
    purple: '#6f42c1',
    periods: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
    ]
};

// Load CSV data
async function loadData() {
    try {
        console.log('Loading data...');
        const response = await fetch('/data/kuwait_ordering_with_avg_amounts_2025.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Data loaded, length:', text.length);

        orderData = parseCSV(text);

        if (orderData.length === 0) {
            throw new Error('No data parsed from CSV');
        }

        console.log('Processing data...');
        processData();

        console.log('Initializing dashboard...');
        initializeDashboard();

        console.log('Dashboard ready!');
    } catch (error) {
        console.error('Error loading data:', error);

        // Show user-friendly error
        const errorMsg = `
            <div class="alert alert-danger m-5" role="alert">
                <h4 class="alert-heading">Error Loading Data</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">
                    <strong>Solution:</strong> Please run the website using a local server:<br><br>
                    <strong>Windows:</strong> Double-click <code>run_server.bat</code><br>
                    <strong>Or manually:</strong> Run <code>python run_server.py</code> in the website folder
                </p>
            </div>
        `;

        document.querySelector('.container-fluid').innerHTML = errorMsg;
    }
}

// Parse CSV
function parseCSV(text) {
    // Remove BOM if present
    text = text.replace(/^\uFEFF/, '');

    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
        });

        data.push(row);
    }

    console.log('Parsed data:', data.length, 'rows');
    return data;
}

// Process data for summaries
function processData() {
    // Calculate period summaries
    orderData.forEach(row => {
        const period = row['Time Period'];
        if (!periodSummary[period]) {
            periodSummary[period] = {
                totalOrders: parseInt(row['Total Period Orders']) || 0,
                avgAmount: parseFloat(row['Avg Order Amount (KD)']) || 0,
                percentOfTotal: parseFloat(row['Period % of Total']) || 0
            };
        }

        // Calculate merchant totals across all periods
        const merchant = row['Merchant Name'];
        const orderCount = parseInt(row['Order Count']) || 0;

        if (!merchantTotals[merchant]) {
            merchantTotals[merchant] = 0;
        }
        merchantTotals[merchant] += orderCount;
    });
}

// Initialize dashboard
function initializeDashboard() {
    updateOverviewMetrics();
    createOverviewCharts();
    createTimePeriodAnalysis();
    createMerchantPerformance();
    setupEventListeners();
}

// Update overview metrics cards
function updateOverviewMetrics() {
    const totalOrders = Object.values(periodSummary).reduce((sum, p) => sum + p.totalOrders, 0);
    const avgAmount = Object.values(periodSummary).reduce((sum, p) => sum + p.avgAmount, 0) / Object.keys(periodSummary).length;

    // Find peak period
    const peakPeriod = Object.entries(periodSummary)
        .sort((a, b) => b[1].totalOrders - a[1].totalOrders)[0];

    // Find top merchant
    const topMerchant = Object.entries(merchantTotals)
        .sort((a, b) => b[1] - a[1])[0];

    document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
    document.getElementById('peakPeriod').textContent = peakPeriod[0].split('(')[0].trim();
    document.getElementById('avgOrderAmount').textContent = `KD ${avgAmount.toFixed(2)}`;
    document.getElementById('topMerchant').textContent = topMerchant[0];
}

// Create overview charts
function createOverviewCharts() {
    // Orders by Time Period Bar Chart
    const periods = Object.keys(periodSummary);
    const orderCounts = periods.map(p => periodSummary[p].totalOrders);

    new Chart(document.getElementById('ordersBarChart'), {
        type: 'bar',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                label: 'Orders',
                data: orderCounts,
                backgroundColor: colors.periods,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        }
    });

    // Order Distribution Pie Chart
    new Chart(document.getElementById('ordersPieChart'), {
        type: 'pie',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                data: orderCounts,
                backgroundColor: colors.periods
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Average Amount Chart
    const avgAmounts = periods.map(p => periodSummary[p].avgAmount);

    new Chart(document.getElementById('avgAmountChart'), {
        type: 'line',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: [{
                label: 'Average Order Amount (KD)',
                data: avgAmounts,
                borderColor: colors.success,
                backgroundColor: colors.success + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => `KD ${value}`
                    }
                }
            }
        }
    });
}

// Create Time Period Analysis
function createTimePeriodAnalysis() {
    // Update period selector
    updatePeriodAnalysis('all');
}

// Update period analysis based on selection
function updatePeriodAnalysis(selectedPeriod) {
    const filteredData = selectedPeriod === 'all'
        ? orderData
        : orderData.filter(row => row['Time Period'] === selectedPeriod);

    // Update stats cards
    if (selectedPeriod === 'all') {
        const cardsHTML = Object.entries(periodSummary).map(([period, stats]) => `
            <div class="col-md-4">
                <div class="period-stat-card">
                    <h6>${period.split('(')[0].trim()}</h6>
                    <h3>${stats.totalOrders.toLocaleString()} orders</h3>
                    <p class="mb-0">Avg: KD ${stats.avgAmount.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
        document.getElementById('periodStatsCards').innerHTML = cardsHTML;
    } else {
        const stats = periodSummary[selectedPeriod];
        const cardsHTML = `
            <div class="col-md-4">
                <div class="card metric-card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Total Orders</h6>
                        <h3 class="card-title">${stats.totalOrders.toLocaleString()}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card metric-card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">Avg Order Amount</h6>
                        <h3 class="card-title">KD ${stats.avgAmount.toFixed(2)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card metric-card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">% of Total Orders</h6>
                        <h3 class="card-title">${stats.percentOfTotal.toFixed(1)}%</h3>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('periodStatsCards').innerHTML = cardsHTML;
    }

    // Update table
    const tableBody = document.getElementById('periodMerchantsTable').querySelector('tbody');
    tableBody.innerHTML = filteredData.map(row => `
        <tr>
            <td>${row['Rank']}</td>
            <td>${row['Merchant Name']}</td>
            <td>${row['Time Period'].split('(')[0].trim()}</td>
            <td>${parseInt(row['Order Count']).toLocaleString()}</td>
            <td>${row['Percentage of Period']}%</td>
        </tr>
    `).join('');
}

// Create Merchant Performance
function createMerchantPerformance() {
    // Top 5 Merchants Total Chart
    const topMerchants = Object.entries(merchantTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    new Chart(document.getElementById('topMerchantsChart'), {
        type: 'bar',
        data: {
            labels: topMerchants.map(m => m[0]),
            datasets: [{
                label: 'Total Orders',
                data: topMerchants.map(m => m[1]),
                backgroundColor: colors.primary,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
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
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        }
    });

    // Merchant Performance Across Periods
    updateMerchantPerformanceChart();

    // Update merchant details table
    updateMerchantTable();
}

// Update merchant performance chart
function updateMerchantPerformanceChart() {
    const topMerchants = Object.entries(merchantTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(m => m[0]);

    const periods = Object.keys(periodSummary);
    const datasets = topMerchants.map((merchant, index) => {
        const data = periods.map(period => {
            const row = orderData.find(r => r['Merchant Name'] === merchant && r['Time Period'] === period);
            return row ? parseInt(row['Order Count']) : 0;
        });

        return {
            label: merchant,
            data: data,
            backgroundColor: colors.periods[index],
            borderColor: colors.periods[index],
            borderWidth: 2
        };
    });

    const existingChart = Chart.getChart('merchantPerformanceChart');
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(document.getElementById('merchantPerformanceChart'), {
        type: 'line',
        data: {
            labels: periods.map(p => p.split('(')[0].trim()),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        }
    });
}

// Update merchant table
function updateMerchantTable(filters = {}) {
    let filteredData = [...orderData];

    // Apply filters
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

    // Sort by order count descending
    filteredData.sort((a, b) => parseInt(b['Order Count']) - parseInt(a['Order Count']));

    // Update table
    const tableBody = document.getElementById('merchantDetailsTable').querySelector('tbody');
    tableBody.innerHTML = filteredData.map(row => `
        <tr>
            <td>${row['Merchant Name']}</td>
            <td>${row['Time Period'].split('(')[0].trim()}</td>
            <td>${row['Rank']}</td>
            <td>${parseInt(row['Order Count']).toLocaleString()}</td>
            <td>${row['Percentage of Period']}%</td>
        </tr>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Period selector
    document.getElementById('periodSelector').addEventListener('change', (e) => {
        updatePeriodAnalysis(e.target.value);
    });

    // Merchant filters
    const merchantSearch = document.getElementById('merchantSearch');
    const merchantPeriodFilter = document.getElementById('merchantPeriodFilter');
    const merchantRankFilter = document.getElementById('merchantRankFilter');

    const updateFilters = () => {
        updateMerchantTable({
            search: merchantSearch.value,
            period: merchantPeriodFilter.value,
            rank: merchantRankFilter.value
        });
    };

    merchantSearch.addEventListener('input', updateFilters);
    merchantPeriodFilter.addEventListener('change', updateFilters);
    merchantRankFilter.addEventListener('change', updateFilters);

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadData);
