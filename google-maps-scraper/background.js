// Background service worker for Google Maps Restaurant Scraper
// Handles communication between popup and content script, manages data storage

// Initialize storage when extension loads
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    scrapedRestaurants: [],
    scrapingStatus: 'idle',
    scrapeProgress: { current: 0, total: 0 },
    lastScrapeTime: null,
    selectedFields: ['name', 'address', 'phone', 'website', 'rating', 'reviews', 'cuisine', 'hours', 'priceRange', 'menuItems', 'coordinates', 'placeId', 'category', 'popularTimes', 'reservations', 'accessibility', 'amenities', 'photos']
  });
});

// Message handler for communication with popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'START_SCRAPING':
        await startScraping();
        sendResponse({ success: true, status: 'started' });
        break;

      case 'STOP_SCRAPING':
        await stopScraping();
        sendResponse({ success: true, status: 'stopped' });
        break;

      case 'GET_STATUS':
        const status = await getStatus();
        sendResponse({ success: true, ...status });
        break;

      case 'SAVE_RESTAURANTS':
        await saveRestaurants(message.data);
        sendResponse({ success: true });
        break;

      case 'GET_RESTAURANTS':
        const restaurants = await getRestaurants();
        sendResponse({ success: true, data: restaurants });
        break;

      case 'CLEAR_DATA':
        await clearData();
        sendResponse({ success: true });
        break;

      case 'DOWNLOAD_DATA':
        await downloadData(message.format);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function startScraping() {
  // Get selected fields from storage
  const result = await chrome.storage.local.get('selectedFields');
  const selectedFields = result.selectedFields || [];
  
  await chrome.storage.local.set({
    scrapingStatus: 'scraping',
    scrapeProgress: { current: 0, total: 0 }
  });
  
  // Notify content script to start scraping with selected fields
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('google.com/maps')) {
    chrome.tabs.sendMessage(tab.id, { 
      type: 'START_SCRAPING',
      selectedFields: selectedFields
    });
  }
}

async function stopScraping() {
  await chrome.storage.local.set({ scrapingStatus: 'stopped' });
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('google.com/maps')) {
    chrome.tabs.sendMessage(tab.id, { type: 'STOP_SCRAPING' });
  }
}

async function getStatus() {
  const result = await chrome.storage.local.get([
    'scrapingStatus',
    'scrapeProgress',
    'lastScrapeTime'
  ]);
  return result;
}

async function saveRestaurants(restaurants) {
  const existing = await getRestaurants();
  const newRestaurants = [...existing];
  
  // Add new restaurants, avoiding duplicates by name and address
  for (const restaurant of restaurants) {
    const isDuplicate = newRestaurants.some(
      r => r.name === restaurant.name && r.address === restaurant.address
    );
    if (!isDuplicate) {
      newRestaurants.push(restaurant);
    }
  }
  
  await chrome.storage.local.set({
    scrapedRestaurants: newRestaurants,
    lastScrapeTime: new Date().toISOString()
  });
  
  // Update progress
  const progress = await chrome.storage.local.get(['scrapeProgress']);
  await chrome.storage.local.set({
    scrapeProgress: {
      current: newRestaurants.length,
      total: Math.max(progress.scrapeProgress?.total || 0, newRestaurants.length)
    }
  });
}

async function getRestaurants() {
  const result = await chrome.storage.local.get(['scrapedRestaurants']);
  return result.scrapedRestaurants || [];
}

async function clearData() {
  await chrome.storage.local.set({
    scrapedRestaurants: [],
    scrapingStatus: 'idle',
    scrapeProgress: { current: 0, total: 0 },
    lastScrapeTime: null
  });
}

async function downloadData(format = 'json') {
  const restaurants = await getRestaurants();
  const result = await chrome.storage.local.get('selectedFields');
  const selectedFields = result.selectedFields || [];
  
  if (restaurants.length === 0) {
    throw new Error('No data to download');
  }
  
  let content, mimeType, extension;
  
  if (format === 'csv') {
    content = convertToCSV(restaurants, selectedFields);
    mimeType = 'text/csv';
    extension = 'csv';
  } else {
    // Filter restaurant data to only include selected fields
    const filteredRestaurants = restaurants.map(r => {
      const filtered = {};
      selectedFields.forEach(field => {
        if (r[field] !== undefined) {
          filtered[field] = r[field];
        }
      });
      return filtered;
    });
    content = JSON.stringify(filteredRestaurants, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `google-maps-restaurants-${timestamp}.${extension}`;
  
  // Use downloads API to save the file
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
  
  // Clean up the object URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function convertToCSV(restaurants, selectedFields) {
  if (restaurants.length === 0) return '';
  
  // Field mapping for CSV headers
  const fieldLabels = {
    name: 'Name',
    address: 'Address',
    phone: 'Phone',
    website: 'Website',
    rating: 'Rating',
    reviews: 'Reviews',
    cuisine: 'Cuisine Type',
    hours: 'Hours',
    priceRange: 'Price Range',
    menuItems: 'Menu Items',
    coordinates: 'Coordinates',
    placeId: 'Place ID',
    category: 'Category',
    popularTimes: 'Popular Times',
    reservations: 'Reservations',
    accessibility: 'Accessibility',
    amenities: 'Amenities',
    photos: 'Photos'
  };
  
  // Build headers from selected fields
  const headers = selectedFields.map(field => fieldLabels[field] || field);
  
  const rows = restaurants.map(r => {
    return selectedFields.map(field => {
      let value = r[field];
      
      // Handle special cases
      if (field === 'menuItems' && Array.isArray(value)) {
        value = value.join('; ');
      } else if (field === 'coordinates' && value) {
        value = `${value.lat},${value.lng}`;
      } else if (field === 'hours' && typeof value === 'object') {
        value = Object.entries(value).map(([day, hours]) => `${day}: ${hours}`).join(' | ');
      } else if (Array.isArray(value)) {
        value = value.join('; ');
      }
      
      return escapeCSV(value || '');
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
