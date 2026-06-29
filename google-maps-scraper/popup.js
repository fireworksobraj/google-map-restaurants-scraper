// Popup script for Google Maps Restaurant Scraper
// Handles UI interactions and communication with background script

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnDownloadJson = document.getElementById('btn-download-json');
  const btnDownloadCsv = document.getElementById('btn-download-csv');
  const btnClear = document.getElementById('btn-clear');
  
  const statusText = document.getElementById('status-text');
  const statusDot = document.querySelector('.status-dot');
  const progressFill = document.getElementById('progress-fill');
  const progressCount = document.getElementById('progress-count');
  const progressPercent = document.getElementById('progress-percent');
  const lastScrapeSection = document.getElementById('last-scrape-section');
  const lastScrapeTime = document.getElementById('last-scrape-time');
  
  // Field selection elements
  const selectAllFields = document.getElementById('select-all-fields');
  const fieldCheckboxes = document.querySelectorAll('input[name="field"]');

  // Save selected fields to storage
  async function saveSelectedFields() {
    const selectedFields = Array.from(fieldCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    await chrome.storage.local.set({ selectedFields });
  }

  // Load selected fields from storage
  async function loadSelectedFields() {
    try {
      const result = await chrome.storage.local.get('selectedFields');
      if (result.selectedFields && Array.isArray(result.selectedFields)) {
        fieldCheckboxes.forEach(cb => {
          cb.checked = result.selectedFields.includes(cb.value);
        });
        updateSelectAllState();
      }
    } catch (error) {
      console.error('Error loading selected fields:', error);
    }
  }

  // Update Select All checkbox state
  function updateSelectAllState() {
    const allChecked = Array.from(fieldCheckboxes).every(cb => cb.checked);
    selectAllFields.checked = allChecked;
  }

  // Toggle all fields
  function toggleAllFields(checked) {
    fieldCheckboxes.forEach(cb => {
      cb.checked = checked;
    });
    saveSelectedFields();
  }

  // Update UI based on current status
  async function updateUI() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      
      if (response.success) {
        const status = response.scrapingStatus || 'idle';
        const progress = response.scrapeProgress || { current: 0, total: 0 };
        
        // Update status indicator
        updateStatusIndicator(status);
        
        // Update progress
        updateProgress(progress.current, progress.total);
        
        // Update button states
        btnStart.disabled = status === 'scraping';
        btnStop.disabled = status !== 'scraping';
        
        // Disable field selection while scraping
        const isScraping = status === 'scraping';
        selectAllFields.disabled = isScraping;
        fieldCheckboxes.forEach(cb => {
          cb.disabled = isScraping;
        });
        
        // Show last scrape time if available
        if (response.lastScrapeTime) {
          lastScrapeTime.textContent = formatDate(response.lastScrapeTime);
          lastScrapeSection.style.display = 'block';
        } else {
          lastScrapeSection.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  function updateStatusIndicator(status) {
    switch (status) {
      case 'scraping':
        statusText.textContent = 'Scraping in progress...';
        statusDot.className = 'status-dot scraping';
        break;
      case 'stopped':
        statusText.textContent = 'Stopped';
        statusDot.className = 'status-dot stopped';
        break;
      case 'complete':
        statusText.textContent = 'Complete';
        statusDot.className = 'status-dot complete';
        break;
      default:
        statusText.textContent = 'Idle';
        statusDot.className = 'status-dot idle';
    }
  }

  function updateProgress(current, total) {
    progressCount.textContent = `${current} restaurant${current !== 1 ? 's' : ''}`;
    
    if (total > 0) {
      const percent = Math.round((current / total) * 100);
      progressFill.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
    } else if (current > 0) {
      // If we have items but no total, show a minimum percentage
      progressFill.style.width = '10%';
      progressPercent.textContent = 'In progress...';
    } else {
      progressFill.style.width = '0%';
      progressPercent.textContent = '0%';
    }
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  // Event Listeners
  
  // Select All checkbox
  selectAllFields.addEventListener('change', (e) => {
    toggleAllFields(e.target.checked);
  });

  // Individual field checkboxes
  fieldCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveSelectedFields();
      updateSelectAllState();
    });
  });

  btnStart.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('google.com/maps')) {
        alert('Please navigate to Google Maps first.');
        return;
      }
      
      // Save selected fields before starting
      await saveSelectedFields();
      
      await chrome.runtime.sendMessage({ type: 'START_SCRAPING' });
      await updateUI();
    } catch (error) {
      console.error('Error starting scrape:', error);
      alert('Failed to start scraping. Please make sure you\'re on a Google Maps page.');
    }
  });

  btnStop.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' });
      await updateUI();
    } catch (error) {
      console.error('Error stopping scrape:', error);
    }
  });

  btnDownloadJson.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'DOWNLOAD_DATA', format: 'json' });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('No data to download or download failed.');
    }
  });

  btnDownloadCsv.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'DOWNLOAD_DATA', format: 'csv' });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('No data to download or download failed.');
    }
  });

  btnClear.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all scraped data?')) {
      try {
        await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
        await updateUI();
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  });

  // Initial UI update
  await updateUI();
  
  // Load saved field selections
  await loadSelectedFields();

  // Periodically update UI while popup is open
  setInterval(updateUI, 2000);
});
