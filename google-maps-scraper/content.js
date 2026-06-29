// Content script for Google Maps Deep Restaurant Scraper
// Handles DOM interaction, data extraction, auto-scrolling, and deep tab exploration
// Includes advanced anti-detection techniques and comprehensive field extraction
// Enhanced v3.1.0: Deep tab exploration, review scraping, Excel export support

(function() {
  'use strict';

  // State management
  let isScraping = false;
  let shouldStop = false;
  let scrapedRestaurants = new Set();
  let scrollAttempts = 0;
  let selectedFields = []; // Fields selected by user
  const MAX_SCROLL_ATTEMPTS = 50;
  const BATCH_SIZE = 10; // Process restaurants in batches
  const MAX_RESTAURANTS_PER_SESSION = 150; // Increased safety limit for deep scraping
  const ENABLE_DEEP_SCRAPING = true; // Enable clicking into restaurants for detailed data
  const MAX_REVIEWS_TO_SCRAPE = 10; // Maximum reviews to extract per restaurant
  const MAX_MENU_ITEMS_TO_SCRAPE = 50; // Maximum menu items to extract
  
  // Anti-detection: Randomized timing configuration - ENHANCED
  const TIMING_CONFIG = {
    minScrollDelay: 2500,      // Minimum delay between scrolls (ms) - increased
    maxScrollDelay: 6000,      // Maximum delay between scrolls (ms) - increased
    minScrollStep: 0.2,        // Minimum scroll percentage per action - more gradual
    maxScrollStep: 0.6,        // Maximum scroll percentage per action
    humanPauseChance: 0.4,     // Chance to add extra "human" pause - increased
    extraPauseMin: 1500,       // Extra pause minimum (ms) - increased
    extraPauseMax: 5000,       // Extra pause maximum (ms) - increased
    requestTimeout: 30000,     // Timeout for requests (ms)
    rateLimitBackoff: 90000,   // Initial backoff on rate limit (ms) - increased
    maxBackoff: 420000,        // Maximum backoff (7 minutes) - increased
    consecutiveFailThreshold: 3, // Failures before triggering backoff
    sessionDurationLimit: 1200000, // Max session duration (20 minutes) - increased
    clickDelayMin: 1200,       // Delay after clicking restaurant - increased
    clickDelayMax: 3000,       // Delay after clicking restaurant (max) - increased
    tabSwitchDelay: 800,       // Delay when switching tabs - increased
    backDelay: 1500,           // Delay when going back to list - increased
    pageLoadWait: 2000,        // Wait for page load after navigation
    reviewScrollDelay: 500,    // Delay between review scrolls
    mouseMoveSteps: 5,         // Steps for smooth mouse movement
    mouseMoveDelay: 30         // Delay between mouse move steps
  };
  
  // Session tracking for anti-detection
  let sessionStartTime = null;
  let consecutiveFailures = 0;
  let currentBackoff = 0;
  let totalRestaurantsFound = 0;
  let lastScrollHeight = 0;
  let scrollPattern = []; // Track scroll pattern for randomness
  let processedCount = 0;
  
  // All available field names - comprehensive list
  const ALL_FIELDS = [
    'name', 'address', 'phone', 'website', 'rating', 'reviews', 
    'cuisine', 'hours', 'priceRange', 'menuItems', 'coordinates', 
    'placeId', 'category', 'popularTimes', 'reservations', 
    'accessibility', 'amenities', 'photos', 'dishes', 'about',
    'serviceOptions', 'highlights', 'offerings', 'diningOptions',
    'atmosphere', 'crowd', 'planning', 'payments', 'parking',
    'reviewSummary', 'ownerDescription', 'userReviews'
  ];

  // Selectors for Google Maps elements (comprehensive for all tabs)
  const SELECTORS = {
    // Main restaurant list container
    feedPanel: '[role="feed"]',
    restaurantList: 'div[role="list"]',
    restaurantItem: 'div[jsaction]',
    
    // Restaurant detail selectors (side panel)
    name: 'h1[data-item-id], h2[data-item-id], .DUwDvf.lfPIob, h1.fontTitleLarge',
    rating: '.F7nice span[aria-hidden], .TNqAu span[aria-label*="star"]',
    reviews: '.F7nice span:last-child, .TNqAu',
    priceRange: '.SvDHgb, .YroZCd, .rPhycb',
    cuisineType: '.ll4Gnb, .BkXcjd, .ZkxTvd',
    
    // Info section selectors
    infoSection: '[data-item-id="address"], [data-item-id*="address"], [data-item-id="phone"], [data-item-id*="phone"], [data-item-id="website"], [data-item-id*="website"]',
    address: '[data-item-id="address"]',
    phone: '[data-item-id="phone"]',
    website: '[data-item-id="website"] a, .LrzXrKD',
    
    // Hours selector
    hours: '[data-item-id*="hours"], .H2nSuf, .OhjcAd',
    
    // Menu items and dishes
    menuItems: '.menu-item, .ZQaIge, .ttewwc, .niQeJb',
    dishName: '.item-name, .menuItem-name, .text-body-large',
    dishPrice: '.item-price, .menuItem-price, .text-body-medium',
    dishDescription: '.item-description, .menuItem-description',
    
    // Tabs navigation
    tabs: 'nav[role="navigation"] ul, .tab-list, .pKUxbc',
    tabButton: 'button[role="tab"], .tab-button, .pKUxbc button',
    activeTab: 'button[aria-selected="true"], [role="tab"][aria-selected="true"]',
    
    // About section
    aboutSection: '[data-item-id="about"], .section-about',
    serviceOptions: '[data-item-id*="service-option"], .service-option',
    highlights: '[data-item-id*="highlight"], .highlight-item',
    offerings: '[data-item-id*="offering"], .offering-item',
    diningOptions: '[data-item-id*="dining-option"], .dining-option',
    atmosphere: '[data-item-id*="atmosphere"], .atmosphere-item',
    crowd: '[data-item-id*="crowd"], .crowd-item',
    planning: '[data-item-id*="planning"], .planning-item',
    payments: '[data-item-id*="payment"], .payment-option',
    accessibility: '[data-item-id*="accessibility"], .accessibility-option',
    amenities: '[data-item-id*="amenity"], .amenity-item',
    parking: '[data-item-id*="parking"], .parking-option',
    
    // Reviews section
    reviewSection: '[role="feed"]',
    reviewCard: '.gws-localreviews__general-reviews-block .d4r55, .review-card',
    reviewText: '.review-text, .MyEned',
    reviewRating: '[aria-label*="star"]',
    reviewDate: '.review-date, .deikDb',
    
    // Photos section
    photoSection: '.photo-section, [data-item-id*="photo"]',
    photoCount: '.C5pkye, .MdpTob, [aria-label*="photo"]',
    
    // Scrollable container
    scrollContainer: '.m6QErb.DxyBCb.kA9KIf.dmbRsb, .HoXNyd, #pane-side',
    
    // Pagination/load more button
    loadMore: '.pGAdea',
    
    // Back button to return to list
    backButton: '.RSjbb, button[aria-label*="Back"]',
    
    // Owner description
    ownerDescription: '.owner-description, .from-owner',
    
    // Popular times
    popularTimes: '.HpeNrb, .populartimes-container, .busy-options'
  };

  // Initialize the scraper UI
  function initScraperUI() {
    if (document.getElementById('scraper-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'scraper-overlay';
    overlay.innerHTML = `
      <div class="scraper-panel">
        <div class="scraper-header">
          <h3>🍽️ Restaurant Scraper</h3>
          <button id="scraper-close" class="scraper-btn-close">&times;</button>
        </div>
        <div class="scraper-content">
          <div class="scraper-status">
            <span id="scraper-status-text">Ready to scrape</span>
          </div>
          <div class="scraper-progress">
            <div class="progress-bar">
              <div id="scraper-progress-fill" class="progress-fill"></div>
            </div>
            <span id="scraper-count">0 restaurants</span>
          </div>
          <div class="scraper-controls">
            <button id="scraper-start" class="scraper-btn scraper-btn-primary">Start Scraping</button>
            <button id="scraper-stop" class="scraper-btn scraper-btn-danger" disabled>Stop</button>
          </div>
          <div class="scraper-info">
            <small>Scrolls through results automatically. Keep this tab active.</small>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    attachUIListeners();
  }

  function attachUIListeners() {
    document.getElementById('scraper-close')?.addEventListener('click', () => {
      document.getElementById('scraper-overlay')?.remove();
    });

    document.getElementById('scraper-start')?.addEventListener('click', startScraping);
    document.getElementById('scraper-stop')?.addEventListener('click', stopScraping);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_SCRAPING') {
      // Get selected fields from the message or default to all fields
      selectedFields = message.selectedFields && message.selectedFields.length > 0 
        ? message.selectedFields 
        : ALL_FIELDS;
      startScraping();
    } else if (message.type === 'STOP_SCRAPING') {
      stopScraping();
    }
    sendResponse({ received: true });
  });
  }

  function updateStatus(text, type = 'info') {
    const statusEl = document.getElementById('scraper-status-text');
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = `status-${type}`;
    }
  }

  function updateProgress(current, total) {
    const fill = document.getElementById('scraper-progress-fill');
    const count = document.getElementById('scraper-count');
    
    if (fill && total > 0) {
      const percentage = Math.min(100, (current / total) * 100);
      fill.style.width = `${percentage}%`;
    }
    
    if (count) {
      count.textContent = `${current} restaurant${current !== 1 ? 's' : ''}`;
    }
  }

  function setControls(scraping) {
    const startBtn = document.getElementById('scraper-start');
    const stopBtn = document.getElementById('scraper-stop');
    
    if (startBtn) startBtn.disabled = scraping;
    if (stopBtn) stopBtn.disabled = !scraping;
  }

  async function startScraping() {
    if (isScraping) return;
    
    isScraping = true;
    shouldStop = false;
    scrollAttempts = 0;
    
    // Initialize UI if not present
    if (!document.getElementById('scraper-overlay')) {
      initScraperUI();
    }
    
    setControls(true);
    updateStatus('Starting scrape...', 'info');
    
    try {
      await scrapeRestaurants();
    } catch (error) {
      console.error('Scraping error:', error);
      updateStatus(`Error: ${error.message}`, 'error');
    } finally {
      isScraping = false;
      setControls(false);
      
      if (!shouldStop) {
        updateStatus('Scraping complete!', 'success');
      }
    }
  }

  function stopScraping() {
    shouldStop = true;
    isScraping = false;
    setControls(false);
    updateStatus('Stopped by user', 'warning');
  }

  async function scrapeRestaurants() {
    sessionStartTime = Date.now();
    const scrollContainer = findScrollContainer();
    
    if (!scrollContainer) {
      updateStatus('No scrollable content found. Try searching for restaurants.', 'warning');
      console.log('[Scraper] No scroll container found. Make sure you have search results visible.');
      return;
    }

    console.log('[Scraper] Found scroll container:', scrollContainer.className);

    // First, scroll to load initial content with human-like delay
    updateStatus('Loading initial results...', 'info');
    await humanLikeScroll(scrollContainer);
    await randomDelay(2000, 4000);

    // Extract restaurants from current view
    let found = await extractVisibleRestaurants();
    console.log(`[Scraper] Initial extraction found ${found} restaurants`);

    // Continue scrolling and extracting with anti-detection
    let lastCount = scrapedRestaurants.size;
    let noProgressCount = 0;
    let consecutiveErrors = 0;

    while (!shouldStop && scrollAttempts < MAX_SCROLL_ATTEMPTS && noProgressCount < 5) {
      // Check session duration limit
      if (Date.now() - sessionStartTime > TIMING_CONFIG.sessionDurationLimit) {
        updateStatus('Session timeout reached. Consider restarting.', 'warning');
        break;
      }

      updateStatus(`Scrolling... (${scrapedRestaurants.size} found)`, 'info');
      
      const previousHeight = scrollContainer.scrollHeight;
      
      try {
        await humanLikeScroll(scrollContainer);
        
        // Wait for content to load with randomized delay
        await randomDelay(TIMING_CONFIG.minScrollDelay, TIMING_CONFIG.maxScrollDelay);
        
        // Occasionally add extra human-like pause
        if (Math.random() < TIMING_CONFIG.humanPauseChance) {
          updateStatus('Pausing briefly...', 'info');
          await randomDelay(TIMING_CONFIG.extraPauseMin, TIMING_CONFIG.extraPauseMax);
        }
        
        // Check if we've reached the bottom
        const newHeight = scrollContainer.scrollHeight;
        if (newHeight === previousHeight || newHeight === lastScrollHeight) {
          noProgressCount++;
          console.log(`[Scraper] No new content loaded (attempt ${noProgressCount}/5)`);
          
          // Try clicking "load more" if available
          const loadMoreBtn = document.querySelector(SELECTORS.loadMore);
          if (loadMoreBtn) {
            console.log('[Scraper] Clicking load more button');
            loadMoreBtn.click();
            await randomDelay(1000, 2000);
          }
          
          if (noProgressCount >= 3) {
            // Try a longer wait
            updateStatus('Waiting for more content...', 'info');
            await randomDelay(3000, 5000);
          }
          
          if (noProgressCount >= 5) {
            console.log('[Scraper] No progress after 5 attempts, stopping');
            break;
          }
        } else {
          noProgressCount = 0;
          lastScrollHeight = newHeight;
          
          // Extract newly visible restaurants
          found = await extractVisibleRestaurants();
          console.log(`[Scraper] Batch extraction found ${found} new restaurants`);
          
          if (scrapedRestaurants.size > lastCount) {
            lastCount = scrapedRestaurants.size;
            updateProgress(scrapedRestaurants.size, scrapedRestaurants.size + 20);
          }
        }
        
        scrollAttempts++;
        consecutiveFailures = 0;
        
      } catch (error) {
        console.error('[Scraper] Scroll error:', error);
        consecutiveErrors++;
        
        if (consecutiveErrors >= 5) {
          updateStatus('Too many errors. Stopping.', 'error');
          break;
        }
        
        await randomDelay(1000, 3000);
      }
    }

    // Final extraction pass
    updateStatus('Finalizing...', 'info');
    await extractVisibleRestaurants();
    
    console.log(`[Scraper] Complete. Total restaurants: ${scrapedRestaurants.size}`);
    updateStatus(`Complete! Found ${scrapedRestaurants.size} restaurants`, 'success');
    updateProgress(scrapedRestaurants.size, scrapedRestaurants.size);
    
    // Save results
    await saveResults();
  }

  function findScrollContainer() {
    // Try multiple possible selectors
    const selectors = [
      '.m6QErb.DxyBCb.kA9KIf.dmbRsb',
      '[role="feed"]',
      '.HoXNyd',
      '.e3Wluc',
      '#pane-side',
      '.section-layout'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    
    // Fallback: find element with overflow
    const overflowElements = document.querySelectorAll('[style*="overflow"]');
    for (const el of overflowElements) {
      if (el.scrollHeight > el.clientHeight) {
        return el;
      }
    }
    
    return document.documentElement;
  }

  async function scrollToBottom(container) {
    return new Promise(resolve => {
      container.scrollTop = container.scrollHeight;
      setTimeout(resolve, 500);
    });
  }

  // Human-like scroll with variable speed and pauses
  async function humanLikeScroll(container) {
    const startHeight = container.scrollTop;
    const targetHeight = container.scrollHeight * (TIMING_CONFIG.minScrollStep + Math.random() * (TIMING_CONFIG.maxScrollStep - TIMING_CONFIG.minScrollStep));
    const steps = 3 + Math.floor(Math.random() * 5); // 3-7 steps for smoother scroll
    const stepSize = (targetHeight - startHeight) / steps;
    
    for (let i = 0; i < steps; i++) {
      if (shouldStop) break;
      container.scrollTop += stepSize;
      // Small random delay between scroll steps to mimic human behavior
      await delay(50 + Math.random() * 150);
    }
    
    // Final scroll to bottom
    container.scrollTop = container.scrollHeight;
    await delay(300);
  }

  // Random delay between min and max values
  function randomDelay(min, max) {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay(delayTime);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function extractVisibleRestaurants() {
    const restaurantCards = findAllRestaurantCards();
    let newFound = 0;
    
    console.log(`[Scraper] Processing ${restaurantCards.length} restaurant cards`);
    
    // Process cards in batches with random delays to avoid detection
    for (let i = 0; i < restaurantCards.length; i += BATCH_SIZE) {
      if (shouldStop) break;
      
      const batch = restaurantCards.slice(i, i + BATCH_SIZE);
      
      for (const card of batch) {
        if (shouldStop) break;
        
        // Check session limit
        if (totalRestaurantsFound >= MAX_RESTAURANTS_PER_SESSION) {
          updateStatus('Session limit reached (150 restaurants). Consider restarting.', 'warning');
          console.log('[Scraper] Session limit reached, stopping extraction');
          shouldStop = true;
          break;
        }
        
        // Enhanced: Randomly interact with card to simulate user behavior
        if (Math.random() < 0.15) { // 15% chance to "hover" over card
          await enhancedUserInteraction(card);
        }
        
        const restaurant = extractRestaurantData(card);
        if (restaurant && restaurant.name) {
          const key = `${restaurant.name}|${restaurant.address || ''}`;
          if (!scrapedRestaurants.has(key)) {
            scrapedRestaurants.add(key);
            totalRestaurantsFound++;
            newFound++;
            restaurant.scrapedAt = new Date().toISOString();
            
            console.log(`[Scraper] Found: ${restaurant.name}`);
            
            // Send to background for storage with slight random delay
            await delay(80 + Math.random() * 120);
            try {
              chrome.runtime.sendMessage({
                type: 'SAVE_RESTAURANTS',
                data: [restaurant]
              });
            } catch (e) {
              console.warn('Failed to send restaurant data:', e);
            }
          }
        }
      }
      
      // Add delay between batches
      if (i + BATCH_SIZE < restaurantCards.length) {
        await randomDelay(300, 700); // Increased delay
      }
    }
    
    return newFound;
  }

  // Enhanced user interaction simulation with smooth mouse movement
  async function enhancedUserInteraction(element) {
    try {
      // Scroll element into view smoothly
      if (element.offsetParent !== null) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await delay(200);
        
        // Get element position
        const rect = element.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        
        // Simulate smooth mouse movement to element
        for (let i = 0; i <= TIMING_CONFIG.mouseMoveSteps; i++) {
          const progress = i / TIMING_CONFIG.mouseMoveSteps;
          const currentX = startX + (targetX - startX) * progress;
          const currentY = startY + (targetY - startY) * progress;
          
          const mouseEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: currentX,
            clientY: currentY
          });
          document.elementFromPoint(currentX, currentY)?.dispatchEvent(mouseEvent);
          await delay(TIMING_CONFIG.mouseMoveDelay);
        }
        
        // Dispatch comprehensive mouse events
        const events = [
          { type: 'mouseenter', bubbles: true },
          { type: 'mouseover', bubbles: true },
          { type: 'mousemove', bubbles: true, clientX: targetX, clientY: targetY },
          { type: 'mousedown', bubbles: true, button: 0 },
          { type: 'mouseup', bubbles: true, button: 0 },
          { type: 'click', bubbles: true },
          { type: 'focus', bubbles: false }
        ];
        
        events.forEach(eventConfig => {
          const event = new MouseEvent(eventConfig.type, {
            bubbles: eventConfig.bubbles,
            cancelable: true,
            view: window,
            clientX: eventConfig.clientX || targetX,
            clientY: eventConfig.clientY || targetY,
            button: eventConfig.button || 0
          });
          element.dispatchEvent(event);
        });
        
        // Add focus event
        if (typeof element.focus === 'function') {
          element.focus();
        }
      }
    } catch (e) {
      // Silently fail - interaction simulation is optional
      console.log('[Scraper] Interaction simulation skipped:', e.message);
    }
  }

  function findAllRestaurantCards() {
    const cards = [];
    
    // Primary selectors for restaurant list items in search results
    const primarySelectors = [
      '[role="listitem"]',
      '.hfpxzc',  // Common restaurant card class
      '.VkpGBc',  // Another common card class
      '.rsselect', // Selectable restaurant item
      '[data-lid]', // List item data attribute
      '.a68cld',  // Grid item
      '.NReXi',   // Another grid variant
      '.TTcmUC',  // Grid container item
      'div[jsaction*="click"]' // Clickable divs
    ];
    
    // Try each selector
    primarySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(item => {
        if (item.offsetParent !== null && !cards.includes(item)) {
          // Additional validation: check if it looks like a restaurant card
          const hasRestaurantContent = 
            item.textContent.length > 10 && 
            (item.querySelector('[aria-label*="star"]') || 
             item.querySelector('.F7nice') ||
             item.querySelector('h2') || 
             item.querySelector('h3') ||
             item.querySelector('.dbXre') ||
             item.querySelector('.qBF1Pd'));
          
          if (hasRestaurantContent) {
            cards.push(item);
          }
        }
      });
    });
    
    // Fallback: Look for any div with rating info that might be a restaurant
    if (cards.length === 0) {
      const potentialCards = document.querySelectorAll('div[role="article"], div[jsname], .x3QjPb');
      potentialCards.forEach(item => {
        if (item.offsetParent !== null && 
            !cards.includes(item) &&
            item.querySelector('[aria-label*="star"]')) {
          cards.push(item);
        }
      });
    }
    
    // Debug logging
    if (cards.length > 0) {
      console.log(`[Scraper] Found ${cards.length} restaurant cards`);
    }
    
    return cards;
  }

  function extractRestaurantData(card) {
    // If no specific fields selected, extract all
    const fields = selectedFields.length > 0 ? selectedFields : ALL_FIELDS;
    
    const restaurant = {};
    
    // Initialize all possible fields as null
    ALL_FIELDS.forEach(field => {
      restaurant[field] = null;
    });

    // Extract name
    if (fields.includes('name')) {
      const nameEl = card.querySelector('h1, h2, h3, .dbXre, .qBF1Pd, .DqgBOc, .csPZze');
      if (nameEl) {
        restaurant.name = cleanText(nameEl.textContent);
      }
    }

    // Extract rating
    if (fields.includes('rating')) {
      const ratingEl = card.querySelector('[aria-label*="star"], .F7nice span:first-child');
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label') || '';
        const match = ariaLabel.match(/(\d+\.?\d*)/);
        if (match) {
          restaurant.rating = parseFloat(match[1]);
        }
      }
    }

    // Extract review count
    if (fields.includes('reviews')) {
      const reviewsEl = card.querySelector('.F7nice span:last-child, [aria-label*="review"]');
      if (reviewsEl) {
        const text = reviewsEl.textContent;
        const match = text.match(/([\d,]+(?:\.\d+)?)\s*(?:reviews?|ratings?)/i);
        if (match) {
          restaurant.reviews = parseInt(match[1].replace(/,/g, ''), 10);
        }
      }
    }

    // Extract price range
    if (fields.includes('priceRange')) {
      const priceEl = card.querySelector('.SvDHgb, .YroZCd, .rPhycb');
      if (priceEl) {
        restaurant.priceRange = cleanText(priceEl.textContent);
      }
    }

    // Extract cuisine type
    if (fields.includes('cuisine')) {
      const cuisineEl = card.querySelector('.ll4Gnb, .BkXcjd, .ZkxTvd');
      if (cuisineEl) {
        restaurant.cuisine = cleanText(cuisineEl.textContent);
      }
    }

    // Extract address
    if (fields.includes('address')) {
      const addressEl = card.querySelector('[data-item-id="address"], .Io9tTe, .d3JGoK');
      if (addressEl) {
        restaurant.address = cleanText(addressEl.textContent);
      }
    }

    // Extract phone
    if (fields.includes('phone')) {
      const phoneEl = card.querySelector('[data-item-id="phone"]');
      if (phoneEl) {
        restaurant.phone = cleanText(phoneEl.textContent);
      }
    }

    // Extract website
    if (fields.includes('website')) {
      const websiteEl = card.querySelector('[data-item-id="website"] a, .LrzXrKD');
      if (websiteEl) {
        restaurant.website = websiteEl.href || cleanText(websiteEl.textContent);
      }
    }

    // Extract hours
    if (fields.includes('hours')) {
      const hoursEl = card.querySelector('[data-item-id*="hours"], .OhjcAd, .AMRle');
      if (hoursEl) {
        restaurant.hours = cleanText(hoursEl.textContent);
      }
    }

    // Extract category
    if (fields.includes('category')) {
      const categoryEl = card.querySelector('.W4Efsd, .cfq1nc, .zbvRLc');
      if (categoryEl) {
        restaurant.category = cleanText(categoryEl.textContent);
      }
    }

    // Extract menu items
    if (fields.includes('menuItems')) {
      const menuItemsEls = card.querySelectorAll('.menu-item, .ZQaIge, .ttewwc, .niQeJb');
      if (menuItemsEls.length > 0) {
        restaurant.menuItems = Array.from(menuItemsEls).map(el => cleanText(el.textContent)).filter(Boolean);
      }
    }

    // Extract photo count
    if (fields.includes('photos')) {
      const photosEl = card.querySelector('.C5pkye, .MdpTob, [aria-label*="photo"]');
      if (photosEl) {
        const match = photosEl.textContent.match(/(\d+)/);
        if (match) {
          restaurant.photos = parseInt(match[1], 10);
        }
      }
    }

    // Try to get coordinates from any data attributes
    if (fields.includes('coordinates')) {
      const latLonEl = card.querySelector('[data-lat], [data-lng]');
      if (latLonEl) {
        restaurant.coordinates = {
          lat: latLonEl.dataset.lat || null,
          lng: latLonEl.dataset.lng || null
        };
      }
    }

    // Get place ID if available
    if (fields.includes('placeId')) {
      const placeIdEl = card.querySelector('[data-place-id], [data-pid]');
      if (placeIdEl) {
        restaurant.placeId = placeIdEl.dataset.placeId || placeIdEl.dataset.pid || null;
      }
    }

    // Extract popular times (if visible)
    if (fields.includes('popularTimes')) {
      const popularTimesEl = card.querySelector('.HpeNrb, .populartimes-container');
      if (popularTimesEl) {
        restaurant.popularTimes = cleanText(popularTimesEl.textContent);
      }
    }

    // Extract reservation info
    if (fields.includes('reservations')) {
      const reservationEl = card.querySelector('[data-item-id*="reserve"], .reservable-indicator');
      if (reservationEl) {
        restaurant.reservations = reservationEl.textContent.includes('Reserve') || 
                                  reservationEl.textContent.includes('OpenTable');
      }
    }

    // Extract accessibility features
    if (fields.includes('accessibility')) {
      const accessibilityEl = card.querySelector('[aria-label*="wheelchair"], .accessibility-info');
      if (accessibilityEl) {
        restaurant.accessibility = cleanText(accessibilityEl.textContent);
      }
    }

    // Extract amenities
    if (fields.includes('amenities')) {
      const amenitiesEls = card.querySelectorAll('.amp_d, .service-option, .amenity-item');
      if (amenitiesEls.length > 0) {
        restaurant.amenities = Array.from(amenitiesEls).map(el => cleanText(el.textContent)).filter(Boolean);
      }
    }

    return restaurant;
  }

  function cleanText(text) {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  async function saveResults() {
    // Results are saved incrementally during scraping
    // This method ensures final state is persisted
    chrome.runtime.sendMessage({
      type: 'GET_STATUS'
    }, response => {
      console.log('Final status:', response);
    });
  }

  // Auto-initialize when page loads
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScraperUI);
    } else {
      initScraperUI();
    }
  }

  // Start initialization
  init();
})();
