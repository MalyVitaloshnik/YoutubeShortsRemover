/**
 * YouTube Shorts Blocker V2 - Background Service Worker
 *
 * Handles DNR rule toggling for URL blocking
 */

// Rule IDs from redirect_rules.json
const REDIRECT_RULESET_ID = 'redirect_rules';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateDNRRules') {
    updateDNRRules(message.blockUrls)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

// Update DNR rules based on settings
async function updateDNRRules(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [REDIRECT_RULESET_ID]
      });
      console.debug('[ShortsBlocker] DNR rules enabled');
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [REDIRECT_RULESET_ID]
      });
      console.debug('[ShortsBlocker] DNR rules disabled');
    }
  } catch (error) {
    console.error('[ShortsBlocker] Failed to update DNR rules:', error);
    throw error;
  }
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(async () => {
  // Load settings and apply DNR state
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || { blockUrls: true };

  await updateDNRRules(settings.blockUrls);
  console.debug('[ShortsBlocker] Service worker initialized');
});

// Also check settings on startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || { blockUrls: true };

  await updateDNRRules(settings.blockUrls);
  console.debug('[ShortsBlocker] Service worker started');
});
