# Google Maps Restaurant Scraper

A Chrome extension that scrapes restaurant data from Google Maps and extracts comprehensive details for each restaurant.

## Features

- **Auto-scroll and paginate** through Google Maps results to scrape all available restaurants
- **Customizable field selection** - Choose which data fields to extract with a visual checklist
- **Advanced anti-detection techniques** to minimize risk of blocking:
  - Human-like scroll patterns with variable speed and pauses
  - Randomized delays between actions (2-5 seconds)
  - Occasional extra "human" pauses
  - Batch processing with inter-batch delays
  - Simulated user interactions (hover events)
  - Session duration limits (15 minutes max)
  - Automatic rate limit detection and exponential backoff
  - Consecutive failure tracking
- **Extract comprehensive data** including:
  - Name
  - Address
  - Phone number
  - Website
  - Rating and review count
  - Cuisine type
  - Hours of operation
  - Price range
  - Menu items (when available)
  - Coordinates (latitude/longitude)
  - Place ID
  - Category
  - Popular times
  - Reservation info
  - Accessibility features
  - Amenities
  - Photo count
- **Export data** in JSON or CSV format (only selected fields)
- **Progress indicator** showing scraping status
- **Duplicate detection** to avoid saving the same restaurant twice
- **Persistent settings** - Your field selections are saved between sessions

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top right
3. Click "Load unpacked"
4. Select the `google-maps-scraper` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to [Google Maps](https://www.google.com/maps)
2. Search for restaurants (e.g., "restaurants near me" or "Italian restaurants in New York")
3. Click the extension icon to open the popup
4. **Select the data fields you want to extract** using the checklist:
   - Click individual checkboxes to select/deselect specific fields
   - Use "Select All / Deselect All" to toggle all fields at once
5. Click "Start Scraping" to begin extraction
6. The scraper will automatically scroll through results with human-like behavior
7. Once complete, click "JSON" or "CSV" to download your data (only selected fields will be included)
8. Use "Clear" to reset the scraped data

## Anti-Detection Features

This extension implements several advanced techniques to reduce the risk of detection and blocking:

### 1. Human-Like Scrolling
- Variable scroll speeds (not instant jumps)
- Multiple scroll steps per action (3-7 steps)
- Random delays between scroll steps (50-200ms)
- Partial scrolls before reaching bottom

### 2. Randomized Timing
- Scroll delays: 2-5 seconds (randomized)
- Extra "human" pauses: 30% chance of 1-4 second additional wait
- Batch processing delays: 200-500ms between batches
- Per-item delays: 50-150ms when saving data

### 3. User Interaction Simulation
- 10% chance to "hover" over each restaurant card
- Smooth scroll into view
- Mouse event dispatching (mouseenter, mouseover, mousemove, focus)

### 4. Rate Limit Handling
- Detects consecutive failures (threshold: 3)
- Exponential backoff starting at 60 seconds
- Maximum backoff capped at 5 minutes
- Automatic recovery after cooldown

### 5. Session Management
- Maximum session duration: 15 minutes
- Automatic stop with warning when limit reached
- Recommendation to restart for continued scraping

### 6. Pattern Randomization
- No fixed timing patterns
- Variable batch sizes
- Randomized scroll percentages (30-70% per action)

## Data Fields Available

| Field | Description |
|-------|-------------|
| Name | Restaurant name |
| Address | Full street address |
| Phone Number | Contact phone number |
| Website | Restaurant website URL |
| Rating | Star rating (e.g., 4.5) |
| Reviews Count | Number of reviews |
| Cuisine Type | Type of cuisine (e.g., Italian, Chinese) |
| Hours of Operation | Opening hours |
| Price Range | Price indicator ($, $$, $$$) |
| Menu Items | List of menu items shown |
| Coordinates | Latitude and longitude |
| Place ID | Google's unique place identifier |
| Category | Business category |
| Popular Times | Busy hour information |
| Reservation Info | Reservation availability |
| Accessibility | Accessibility features |
| Amenities | Available amenities |
| Photo Count | Number of photos |

## File Structure

```
google-maps-scraper/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker for data management
├── content.js          # Content script with anti-detection logic
├── popup.html          # Popup interface with field selection
├── popup.js            # Popup logic and field management
├── styles/
│   ├── popup.css       # Popup styles including field grid
│   └── content.css     # Content script overlay styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Technical Details

### Manifest V3
This extension uses Chrome's Manifest V3, the latest extension platform with improved security and performance.

### Permissions
- `activeTab`: Access to the active Google Maps tab
- `storage`: Store scraped restaurant data and user preferences
- `downloads`: Download exported data files

### Anti-Detection Configuration

The following parameters can be adjusted in `content.js` under `TIMING_CONFIG`:

```javascript
const TIMING_CONFIG = {
  minScrollDelay: 2000,      // Minimum delay between scrolls (ms)
  maxScrollDelay: 5000,      // Maximum delay between scrolls (ms)
  minScrollStep: 0.3,        // Minimum scroll percentage per action
  maxScrollStep: 0.7,        // Maximum scroll percentage per action
  humanPauseChance: 0.3,     // Chance to add extra "human" pause
  extraPauseMin: 1000,       // Extra pause minimum (ms)
  extraPauseMax: 4000,       // Extra pause maximum (ms)
  requestTimeout: 30000,     // Timeout for requests (ms)
  rateLimitBackoff: 60000,   // Initial backoff on rate limit (ms)
  maxBackoff: 300000,        // Maximum backoff (5 minutes)
  consecutiveFailThreshold: 3, // Failures before triggering backoff
  sessionDurationLimit: 900000 // Max session duration (15 minutes)
};
```

### Data Extraction
The content script uses multiple CSS selectors to identify and extract restaurant information from Google Maps' dynamic DOM structure. Selectors are designed to work with various Google Maps layouts (list view, grid view, etc.).

### Auto-Scrolling
The extension automatically scrolls through the restaurant list using human-like patterns, waiting for new content to load before extracting additional data. It stops when no new content is loaded after multiple scroll attempts or when the session duration limit is reached.

## Output Format

### JSON Example
```json
{
  "name": "Restaurant Name",
  "address": "123 Main St, City, State 12345",
  "phone": "+1 555-123-4567",
  "website": "https://example.com",
  "rating": 4.5,
  "reviews": 1234,
  "cuisineType": "Italian",
  "hours": "Open ⋅ Closes 10PM",
  "priceRange": "$$",
  "menuItems": [],
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "placeId": "...",
  "scrapedAt": "2024-01-15T10:30:00.000Z"
}
```

### CSV Columns
Name, Address, Phone, Website, Rating, Reviews, Cuisine Type, Hours, Price Range, Menu Items, Latitude, Longitude, Place ID, Scraped At

## Important Notes

### Terms of Service
⚠️ **Please respect Google Maps' Terms of Service.** This extension is provided for educational purposes. Ensure you have the right to scrape data from Google Maps for your intended use case. Consider:
- Rate limiting and reasonable delays (built into this extension)
- Not overloading Google's servers
- Complying with applicable laws and regulations
- Using data responsibly and ethically
- Understanding that scraping may violate Google's ToS

### Best Practices to Avoid Detection
1. **Use moderate search queries** - Don't scrape entire cities in one session
2. **Take breaks** - Stop and restart after 15 minutes of scraping
3. **Vary your searches** - Don't repeatedly search the same terms
4. **Use during off-peak hours** - Less likely to trigger rate limits
5. **Monitor for warnings** - If you see "Rate limit detected" messages, stop and wait
6. **Consider using a dedicated browser profile** - Keep cookies and history clean

### Limitations
- Google frequently updates their UI, which may break selectors
- Some data fields may not be available for all restaurants
- Very large result sets may take significant time to scrape
- Keep the Google Maps tab active during scraping
- Anti-detection reduces but does not eliminate blocking risk

## Troubleshooting

### No restaurants found
- Make sure you're on a search results page with visible restaurant listings
- Try scrolling manually first to load more results
- Refresh the page and try again

### Scraping stops prematurely
- Check if you've reached the end of available results
- Check if session timeout was reached (15 minute limit)
- Try reducing network latency
- Increase the MAX_SCROLL_ATTEMPTS value in content.js

### Rate limit detected
- Stop scraping immediately
- Wait at least 5-10 minutes before trying again
- Consider reducing scroll speed in TIMING_CONFIG
- Try using a different IP address or network

### Missing data fields
- Not all restaurants have complete information
- Some fields may require clicking into the restaurant detail view
- Google may hide certain data based on your location/account

## Development

To modify the extension:
1. Edit the source files in the `google-maps-scraper` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Customizing Anti-Detection Settings

Edit `TIMING_CONFIG` in `content.js` to adjust:
- Slower scraping: Increase `minScrollDelay` and `maxScrollDelay`
- More human-like: Increase `humanPauseChance`
- Longer sessions: Increase `sessionDurationLimit` (not recommended)
- More conservative: Decrease `consecutiveFailThreshold`

## License

This project is provided as-is for educational purposes.

## Version History

- **2.0.0** - Added advanced anti-detection features, human-like scrolling, rate limit handling
- **1.0.0** - Initial release with core scraping functionality
