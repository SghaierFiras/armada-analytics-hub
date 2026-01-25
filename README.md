# Armada Analytics Hub

A comprehensive analytics platform for monitoring and analyzing delivery operations, merchant performance, and ordering behaviors across Kuwait.

## 🔒 Authentication & Security

This platform now includes **Slack OAuth authentication** with optional domain restriction to ensure only authorized users can access your private company data.

**Quick Start:** See [QUICKSTART.md](QUICKSTART.md) for 3-step setup guide.

**Full Documentation:** See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) for detailed configuration.

## Overview

This project provides interactive dashboards and data analysis tools to gain insights into:
- Merchant performance metrics
- Order delivery analytics
- Geographical distribution analysis
- Seasonal ordering patterns
- Customer behavior trends

## Project Structure

```
Armada/
├── public/              # Web dashboards (protected by authentication)
│   ├── index.html       # Main Analytics Hub
│   ├── login.html       # Slack OAuth login page
│   ├── auth-utils.js    # Client-side auth utility
│   ├── example-dashboard-integration.html  # Integration example
│   ├── MERCHANT_ANALYTICS_DASHBOARD.html
│   ├── ORDERS_DELIVERY_DASHBOARD.html
│   ├── PERFORMANCE_CHARTS.html
│   └── ordersBehaviorAnalysis.html
├── scripts/             # Data analysis scripts
│   ├── analytics-app.js
│   ├── comprehensiveGlobalAnalysis.js
│   ├── comprehensiveMerchantAnalysis.js
│   ├── deepMerchantAnalysis.js
│   ├── generateOrderingBehaviorData.js
│   ├── geographicalAnalysis.js
│   ├── geographicalAnalysisV2.js
│   ├── merchantAnalysis.js
│   ├── monthlySeasonalAnalysis.js
│   ├── ordersBehaviorAnalysis.js
│   ├── quarterlyComparison.js
│   └── query2025Stats.js
├── docs/                # Analysis reports
│   ├── COMPREHENSIVE_DATA_ANALYSIS_REPORT.md
│   ├── COMPREHENSIVE_MERCHANT_REPORT.md
│   ├── DATA_ANALYSIS_REPORT.md
│   ├── EXECUTIVE_SUMMARY.md
│   ├── ORDERING_BEHAVIOR_INTEGRATION.md
│   └── ORDERS_BEHAVIOR_ANALYSIS.md
├── data/                # Data files
│   └── kuwait_ordering_with_avg_amounts_2025.csv
├── assets/              # Images and static assets
│   └── armada logo.png
├── auth-server.js       # Express authentication server
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── server.py            # Legacy local development server
├── QUICKSTART.md        # Quick start guide (3 steps)
└── AUTHENTICATION_SETUP.md  # Complete setup documentation

```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB connection (for data analysis scripts and user sessions)
- Slack workspace with admin access (for OAuth setup)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Armada
```

2. Install dependencies:
```bash
npm install
```

3. Set up Slack OAuth:
   - Go to <https://api.slack.com/apps>
   - Create a new app for your workspace
   - Configure OAuth redirect URL
   - Copy Client ID and Client Secret
   - See [QUICKSTART.md](QUICKSTART.md) for detailed steps

4. Configure environment variables:

   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   # Edit .env with your Slack credentials and MongoDB URI
   ```

### Running Locally

### With Authentication (Recommended)

Start the authentication server:

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be prompted to log in with Slack before accessing the dashboards.

### Without Authentication (Development Only)

Start the legacy Python server:
```bash
python3 server.py
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

**Note:** This bypasses authentication and should only be used for development.

#### Run Analysis Scripts

Execute any analysis script:
```bash
node scripts/comprehensiveGlobalAnalysis.js
```

## Deployment

### Netlify

This project is configured for automatic deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Netlify will automatically deploy the `public/` directory
3. The Analytics Hub will be accessible at your Netlify URL

Build settings:
- Build command: (none required)
- Publish directory: `public`

## Features

### Dashboards

- **Analytics Hub** - Main dashboard with overview of all metrics
- **Merchant Analytics** - Detailed merchant performance analysis
- **Orders & Delivery** - Order tracking and delivery performance
- **Performance Charts** - Visual performance indicators
- **Ordering Behavior** - Customer ordering pattern analysis

### Analysis Scripts

The `scripts/` directory contains various analysis tools for:
- Geographical analysis
- Seasonal trends
- Merchant deep-dive analysis
- Quarterly comparisons
- Order behavior patterns

## Documentation

Detailed analysis reports and findings are available in the [docs/](docs/) directory.

## License

ISC

## Contributing

For questions or contributions, please contact the project maintainer.
