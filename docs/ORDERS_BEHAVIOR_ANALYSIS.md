# Kuwait Ordering Behavior Dashboard 2025

An interactive web dashboard for visualizing Kuwait ordering behavior data across different time periods.

## Features

### 1. Overview Dashboard
- Key metrics cards showing total orders, peak period, average order amount, and top merchant
- Bar chart displaying orders by time period
- Pie chart showing order distribution
- Line chart showing average order amounts across periods

### 2. Time Period Analysis
- Detailed breakdown of ordering behavior across 6 time periods:
  - Breakfast (5:00-9:30 AM)
  - Morning Snack (9:30-11:00 AM)
  - Lunch (11:00 AM-3:00 PM)
  - Afternoon (3:00-6:30 PM)
  - Dinner (6:30-10:00 PM)
  - Late Night (10:00 PM-5:00 AM)
- Period selector to view specific time period details
- Comparison chart showing orders vs average amounts
- Top merchants table for each period

### 3. Merchant Performance
- Search functionality to find specific merchants
- Filter by time period and rank
- Performance chart showing top 5 merchants across all periods
- Detailed merchant performance table
- Top 5 merchants total orders visualization

## How to Use

### Option 1: Open Locally
1. Navigate to the `website` folder
2. Double-click `index.html` to open in your browser

### Option 2: Use a Local Server (Recommended)
```bash
# Navigate to the website folder
cd website

# Using Python 3
python -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000
```
Then open your browser and go to `http://localhost:8000`

### Option 3: Deploy to Web Hosting
You can deploy this to any static hosting service:
- **GitHub Pages**: Push to GitHub and enable Pages in repository settings
- **Netlify**: Drag and drop the `website` folder
- **Vercel**: Import the project from GitHub
- **AWS S3**: Upload to S3 bucket with static website hosting enabled

## Technologies Used

- **HTML5** - Structure
- **CSS3** with **Bootstrap 5** - Styling and responsive design
- **JavaScript (ES6+)** - Interactivity and data processing
- **Chart.js** - Data visualizations

## Data Source

The dashboard uses data from:
- `data/kuwait_ordering_with_avg_amounts_2025.csv`

This contains:
- 998,971 completed orders from Kuwait in 2025
- Order counts and percentages by time period
- Average order amounts per period
- Top 10 merchants for each time period

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Features Overview

### Interactive Charts
- Hover over charts to see detailed information
- Click period selectors to filter data
- Responsive design works on all screen sizes

### Search & Filter
- Search merchants by name
- Filter by time period
- Filter by rank (Top 1, 3, 5, 10)
- Real-time table updates

### Navigation
- Smooth scrolling between sections
- Sticky navigation bar
- Mobile-friendly menu

## Customization

To update the data:
1. Replace `data/kuwait_ordering_with_avg_amounts_2025.csv` with your new data
2. Ensure the CSV has the same column structure:
   - Time Period
   - Rank
   - Merchant Name
   - Merchant ID
   - Order Count
   - Percentage of Period
   - Total Period Orders
   - Period % of Total
   - Avg Order Amount (KD)

## License

This dashboard is created for internal data analysis purposes.

## Support

For questions or issues, please contact the development team.
