/**
 * Popup script for YouTube Shorts Blocker V3
 * Handles individual feature toggles including sidebar sections
 */

// Toggle elements
const toggles = {
  blockUrls: document.getElementById('blockUrls'),
  hideSidebar: document.getElementById('hideSidebar'),
  hideShelves: document.getElementById('hideShelves'),
  hideExplore: document.getElementById('hideExplore'),
  hideMoreFromYouTube: document.getElementById('hideMoreFromYouTube')
};

const status = document.getElementById('status');

// Default settings
const DEFAULT_SETTINGS = {
  blockUrls: true,
  hideSidebar: true,
  hideShelves: true,
  hideExplore: false,
  hideMoreFromYouTube: false
};

// Load saved settings
chrome.storage.local.get(['settings'], (result) => {
  const settings = { ...DEFAULT_SETTINGS, ...result.settings };

  // Apply to toggles
  Object.keys(toggles).forEach(key => {
    if (toggles[key]) {
      toggles[key].checked = settings[key];
    }
  });

  updateStatus(settings);
});

// Handle toggle changes
function handleToggleChange() {
  const settings = {};
  Object.keys(toggles).forEach(key => {
    if (toggles[key]) {
      settings[key] = toggles[key].checked;
    }
  });

  // Save settings
  chrome.storage.local.set({ settings }, () => {
    updateStatus(settings);

    // Notify content scripts
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settingsChanged',
          settings: settings
        }).catch(() => {
          // Tab might not have content script loaded yet
        });
      });
    });

    // Notify background script to update DNR rules
    chrome.runtime.sendMessage({
      type: 'updateDNRRules',
      blockUrls: settings.blockUrls
    }).catch(() => {
      // Background script might not be ready
    });
  });
}

// Attach listeners to all toggles
Object.values(toggles).forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('change', handleToggleChange);
  }
});

function updateStatus(settings) {
  const allSettings = Object.values(settings);
  const enabledCount = allSettings.filter(Boolean).length;
  const totalCount = allSettings.length;

  if (enabledCount === totalCount) {
    status.textContent = 'All features enabled';
    status.className = 'status enabled';
  } else if (enabledCount === 0) {
    status.textContent = 'All features disabled';
    status.className = 'status disabled';
  } else {
    status.textContent = `${enabledCount} of ${totalCount} features enabled`;
    status.className = 'status partial';
  }
}
