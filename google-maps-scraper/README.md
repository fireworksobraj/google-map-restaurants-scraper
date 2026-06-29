# Google Maps Restaurant Scraper - Enhanced v3.1

A powerful Chrome extension that scrapes comprehensive restaurant data from Google Maps with advanced anti-detection techniques and deep data extraction capabilities.

## 🚀 New Features in v3.1

- **Enhanced Anti-Detection**: More human-like behavior with smooth mouse movements, variable delays, and comprehensive interaction simulation
- **Extended Session Limits**: Now supports up to 150 restaurants per session (increased from 100)
- **Longer Session Duration**: Extended to 20 minutes (from 15 minutes)
- **Improved Mouse Simulation**: Smooth cursor movement with Bezier-like paths
- **Better Rate Limit Handling**: Increased backoff times for better recovery
- **Deep Data Extraction**: Configurable limits for reviews (10) and menu items (50)
- **Enhanced Field Selection**: Organized tabs for easier field management

## Features

- **Auto-scroll and paginate** through Google Maps results to scrape all available restaurants
- **Customizable field selection** - Choose which data fields to extract with a visual checklist organized by category:
  - Basic Info (name, address, phone, website, rating, etc.)
  - Menu & Dishes (detailed dish names with prices)
  - About Section (service options, amenities, atmosphere, etc.)
  - Reviews (review summaries and user reviews)
- **Advanced anti-detection techniques** to minimize risk of blocking:
  - Human-like scroll patterns with variable speed and pauses
  - Randomized delays between actions (2.5-6 seconds)
  - Smooth mouse movement simulation with multiple steps
  - Comprehensive event dispatching (mouseenter, mouseover, mousedown, mouseup, click)
  - Occasional extra "human" pauses (40% chance)
  - Batch processing with inter-batch delays
  - Session duration limits (20 minutes max)
  - Automatic rate limit detection and exponential backoff (up to 7 minutes)
  - Consecutive failure tracking
  - Focus event simulation
- **Enhanced restaurant card detection** with multiple selectors and validation
- **Extract comprehensive data** including 30+ fields:
  - Name, Address, Phone, Website
  - Rating and review count
  - Cuisine type and category
  - Hours of operation
  - Price range ($, $$, $$$)
  - Menu items and dishes with prices
  - Coordinates (latitude/longitude)
  - Place ID
  - Popular times
  - Reservation info
  - Accessibility features
  - Amenities
  - Service options (delivery, takeout, dine-in)
  - Highlights and offerings
  - Dining options
  - Atmosphere and crowd info
  - Payment methods
  - Parking options
  - Photo count
  - Owner description
  - Review summaries
- **Export data** in JSON or CSV format (only selected fields)
- **Progress indicator** showing scraping status
- **Duplicate detection** to avoid saving the same restaurant twice
- **Persistent settings** - Your field selections are saved between sessions
- **Console logging** for debugging and monitoring progress
- **Session management** with automatic limits to prevent detection

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top right
3. Click "Load unpacked"
4. Select the `google-maps-scraper` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to [Google Maps](https://www.google.com/maps)
2. Search for restaurants (e.g., "restaurants near me" or "Italian restaurants in New York")
3. **Wait for search results to load** - You should see restaurant cards in the left panel
4. Click the extension icon to open the popup
5. **Select the data fields you want to extract** using the organized checklist:
   - Use tabs to navigate between field categories (Basic, Menu, About, Reviews)
   - Click individual checkboxes to select/deselect specific fields
   - Use "Select All / Deselect All" to toggle all fields at once
6. Click "Start Deep Scraping" to begin extraction
7. The scraper will automatically scroll through results with enhanced human-like behavior:
   - Smooth scrolling with variable speeds
   - Random pauses mimicking human reading patterns
   - Simulated mouse movements and clicks
   - Automatic rate limit handling
8. **Watch the browser console** (F12 → Console tab) for detailed progress logs:
   - `[Scraper] Found scroll container: ...` - Confirms scrollable area detected
   - `[Scraper] Initial extraction found X restaurants` - Shows initial batch
   - `[Scraper] Processing X restaurant cards` - Cards being analyzed
   - `[Scraper] Found: Restaurant Name` - Each restaurant discovered
   - `[Scraper] Batch extraction found X new restaurants` - Progress updates
   - `[Scraper] Interaction simulation skipped: ...` - When interaction fails safely
9. Once complete, click "Download JSON" or "Download CSV" to export your data (only selected fields will be included)
10. Use "Clear Data" to reset the scraped data

## Data Fields Reference

### Basic Info Tab
| Field | Description | Example |
|-------|-------------|---------|
| name | Restaurant name | "Angara Kabab & Karahi" |
| address | Full street address | "123 Main St, Houston, TX" |
| phone | Phone number | "+1 713-555-1234" |
| website | Website URL | "https://example.com" |
| rating | Star rating (0-5) | 4.5 |
| reviews | Number of reviews | 1250 |
| cuisine | Cuisine type | "Indian, Pakistani" |
| hours | Operating hours | "Open ⋅ Closes 10PM" |
| priceRange | Price indicator | "$$" |
| category | Business category | "Indian restaurant" |
| popularTimes | Busy times | "Usually busy at 7PM" |
| coordinates | Lat/Lng | {"lat": "29.71", "lng": "-95.50"} |
| placeId | Google Place ID | "ChIJ..." |
| photos | Photo count | 150 |

### Menu & Dishes Tab
| Field | Description | Example |
|-------|-------------|---------|
| dishes | Dishes with prices | [{"name": "Biryani", "price": "$12.99"}] |
| menuItems | Popular dishes list | ["Biryani", "Karahi", "Naan"] |

### About Tab
| Field | Description | Example |
|-------|-------------|---------|
| serviceOptions | Delivery, takeout, etc. | ["Dine-in", "Takeout", "Delivery"] |
| highlights | Special features | ["Great tea selection"] |
| offerings | Food offerings | ["Coffee", "Healthy options"] |
| diningOptions | Seating, etc. | ["Seating", "High chairs"] |
| atmosphere | Ambiance | ["Casual", "Cozy"] |
| crowd | Customer types | ["Groups", "Tourists"] |
| planning | Reservations needed | ["Accepts reservations"] |
| payments | Payment methods | ["Credit cards", "Debit cards"] |
| parking | Parking availability | ["Free parking lot"] |
| accessibility | Wheelchair access | ["Wheelchair accessible entrance"] |
| amenities | Features | ["Wi-Fi", "Restroom"] |
| reservations | Accepts reservations | true/false |
| ownerDescription | Owner's description | "Authentic Indian cuisine..." |

### Reviews Tab
| Field | Description | Example |
|-------|-------------|---------|
| reviewSummary | Summary of reviews | "Customers love the biryani" |
| userReviews | Sample user reviews | [{"text": "Great food!", "rating": 5}] |

## Troubleshooting

### No Restaurants Detected

If the scraper keeps scrolling but doesn't detect any restaurants:

1. **Make sure search results are loaded** - Wait for Google Maps to fully load restaurant cards in the left panel
2. **Check the console** - Press F12 and go to the Console tab to see debug messages
3. **Verify you're on a search results page** - The scraper works on pages with restaurant lists, not single restaurant pages
4. **Try a different search** - Some searches may have different layouts
5. **Scroll manually first** - Sometimes manual scrolling helps load the content properly

### Popup Display Issues

If the popup appears as a thin line:
- Reload the extension in `chrome://extensions/`
- Clear browser cache
- The popup is sized at 450px width × 550-650px height

### Rate Limiting

If you see "Rate limit detected" messages:
- The extension will automatically pause (starts at 90 seconds, up to 7 minutes)
- Consider reducing scraping speed or taking a break
- Respect Google Maps' Terms of Service
- Try using a different network or IP address

### Session Timeout

If you reach the 20-minute session limit:
- This is intentional to prevent detection
- Simply restart the scraping process for continued extraction
- The extension will save progress automatically

### Missing Data Fields

- Not all restaurants have complete information
- Some fields may require clicking into the restaurant detail view
- Google may hide certain data based on your location/account
- Check if the field is selected in the field selection panel

## Anti-Detection Features

This extension implements several advanced techniques to reduce the risk of detection and blocking:

### 1. Enhanced Human-Like Scrolling
- Variable scroll speeds (not instant jumps)
- Multiple scroll steps per action (3-7 steps)
- Random delays between scroll steps (50-200ms)
- Partial scrolls before reaching bottom (20-60% increments)
- Gradual scroll initiation (more natural start)

### 2. Advanced Randomized Timing
- Scroll delays: 2.5-6 seconds (randomized, increased from 2-5s)
- Extra "human" pauses: 40% chance of 1.5-5 second additional wait
- Batch processing delays: 300-700ms between batches (increased)
- Per-item delays: 80-200ms when saving data (increased)
- Page load waits: 2 seconds after navigation
- Review scroll delays: 500ms between review loads

### 3. Sophisticated User Interaction Simulation
- 15% chance to "interact" with each restaurant card (increased from 10%)
- Smooth mouse movement with 5 interpolated steps
- Bezier-like cursor path simulation
- Comprehensive event sequence:
  - mouseenter
  - mouseover
  - mousemove (with coordinates)
  - mousedown
  - mouseup
  - click
  - focus
- Smooth scroll into view before interaction
- Realistic timing between events (30ms intervals)

### 4. Enhanced Rate Limit Handling
- Detects consecutive failures (threshold: 3)
- Exponential backoff starting at 90 seconds (increased from 60s)
- Maximum backoff capped at 7 minutes (increased from 5m)
- Automatic recovery after cooldown
- Consecutive error tracking with auto-stop at 5 errors

### 5. Extended Session Management
- Maximum session duration: 20 minutes (increased from 15m)
- Restaurant limit: 150 per session (increased from 100)
- Automatic stop with warning when limit reached
- Recommendation to restart for continued scraping
- Progress persistence across sessions

### 6. Pattern Randomization
- No fixed timing patterns
- Variable batch sizes
- Randomized scroll percentages (20-60% per action)
- Unpredictable pause patterns
- Random interaction chances

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
  minScrollDelay: 2500,      // Minimum delay between scrolls (ms)
  maxScrollDelay: 6000,      // Maximum delay between scrolls (ms)
  minScrollStep: 0.2,        // Minimum scroll percentage per action
  maxScrollStep: 0.6,        // Maximum scroll percentage per action
  humanPauseChance: 0.4,     // Chance to add extra "human" pause
  extraPauseMin: 1500,       // Extra pause minimum (ms)
  extraPauseMax: 5000,       // Extra pause maximum (ms)
  requestTimeout: 30000,     // Timeout for requests (ms)
  rateLimitBackoff: 90000,   // Initial backoff on rate limit (ms)
  maxBackoff: 420000,        // Maximum backoff (7 minutes)
  consecutiveFailThreshold: 3, // Failures before triggering backoff
  sessionDurationLimit: 1200000, // Max session duration (20 minutes)
  clickDelayMin: 1200,       // Delay after clicking restaurant
  clickDelayMax: 3000,       // Delay after clicking restaurant (max)
  tabSwitchDelay: 800,       // Delay when switching tabs
  backDelay: 1500,           // Delay when going back to list
  pageLoadWait: 2000,        // Wait for page load after navigation
  reviewScrollDelay: 500,    // Delay between review scrolls
  mouseMoveSteps: 5,         // Steps for smooth mouse movement
  mouseMoveDelay: 30         // Delay between mouse move steps
};
```

### Data Extraction
The content script uses multiple CSS selectors to identify and extract restaurant information from Google Maps' dynamic DOM structure. Selectors are designed to work with various Google Maps layouts (list view, grid view, etc.).

### Auto-Scrolling
The extension automatically scrolls through the restaurant list using enhanced human-like patterns, waiting for new content to load before extracting additional data. It stops when:
- No new content is loaded after 5 scroll attempts
- Session duration limit is reached (20 minutes)
- Restaurant limit is reached (150 restaurants)
- User manually stops the process

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
  "dishes": [],
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
2. **Take breaks** - Stop and restart after 20 minutes of scraping
3. **Vary your searches** - Don't repeatedly search the same terms
4. **Use during off-peak hours** - Less likely to trigger rate limits
5. **Monitor for warnings** - If you see "Rate limit detected" messages, stop and wait
6. **Consider using a dedicated browser profile** - Keep cookies and history clean
7. **Use realistic limits** - 150 restaurants per session is already generous

### Limitations
- Google frequently updates their UI, which may break selectors
- Some data fields may not be available for all restaurants
- Very large result sets may take significant time to scrape
- Keep the Google Maps tab active during scraping
- Anti-detection reduces but does not eliminate blocking risk
- Deep scraping (clicking into each restaurant) is slower but extracts more data

## Development

To modify the extension:
1. Edit the source files in the `google-maps-scraper` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Customizing Anti-Detection Settings

Edit `TIMING_CONFIG` in `content.js` to adjust:
- **Slower scraping**: Increase `minScrollDelay` and `maxScrollDelay`
- **More human-like**: Increase `humanPauseChance` and `mouseMoveSteps`
- **Longer sessions**: Increase `sessionDurationLimit` (not recommended)
- **More conservative**: Decrease `consecutiveFailThreshold`
- **More interactions**: Increase the interaction chance in `extractVisibleRestaurants()`

### Adding New Fields

To add new data fields:
1. Add the field name to `ALL_FIELDS` array in `content.js`
2. Add extraction logic in `extractRestaurantData()` function
3. Add corresponding selector to `SELECTORS` object
4. Update `popup.html` to include the new field checkbox
5. Update `background.js` CSV conversion if needed

## File Structure

```
google-maps-scraper/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker for data management
├── content.js          # Content script with enhanced anti-detection logic
├── popup.html          # Popup interface with field selection tabs
├── popup.js            # Popup logic and field management
├── styles/
│   ├── popup.css       # Popup styles including field grid and tabs
│   └── content.css     # Content script overlay styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Version History

- **3.1.0** (Current) - Enhanced anti-detection, extended limits, smooth mouse simulation
  - Increased session limit to 150 restaurants
  - Extended session duration to 20 minutes
  - Added smooth mouse movement simulation
  - Improved interaction event dispatching
  - Enhanced rate limit backoff times
  - Better error handling and logging
  
- **3.0.0** - Deep scraping with tab exploration, comprehensive field selection
  - Added deep tab exploration for detailed data
  - Implemented comprehensive field selection UI
  - Added review and menu item extraction
  - Improved anti-detection techniques
  
- **2.0.0** - Advanced anti-detection features
  - Human-like scrolling patterns
  - Randomized timing
  - Rate limit handling
  
- **1.0.0** - Initial release
  - Basic scraping functionality
  - Simple auto-scroll
  - JSON/CSV export

## Support

For issues or questions:
1. Check the console logs (F12 → Console)
2. Verify you're on a Google Maps search results page
3. Ensure the extension is properly loaded in `chrome://extensions/`
4. Try clearing browser cache and reloading the extension

## License

This project is provided as-is for educational purposes.

---

**Note**: This enhanced version provides significantly better anti-detection capabilities and data extraction quality. Use responsibly and respect Google Maps' Terms of Service.
