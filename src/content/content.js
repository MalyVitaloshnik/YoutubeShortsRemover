/**
 * YouTube Shorts Blocker V3 - Content Script
 *
 * Features:
 * - blockUrls: Redirect Shorts URLs to homepage
 * - hideSidebar: Hide Shorts button in sidebar navigation
 * - hideShelves: Hide Shorts shelves on homepage and other pages
 * - hideExplore: Hide "Explore" section in sidebar
 * - hideMoreFromYouTube: Hide "More from YouTube" section in sidebar
 */

(function() {
  'use strict';

  // ============================================
  // STATE
  // ============================================

  let settings = {
    blockUrls: true,
    hideSidebar: true,
    hideShelves: true,
    hideExplore: false,
    hideMoreFromYouTube: false
  };

  let isInitialized = false;

  // ============================================
  // SELECTORS
  // ============================================

  // Sidebar Shorts button selectors
  const SIDEBAR_SHORTS_SELECTORS = [
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-guide-entry-renderer:has(a[href="/shorts/"])',
    'ytd-mini-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href="/shorts/"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
  ];

  // Shorts shelves selectors
  const SHELF_SELECTORS = [
    'ytd-reel-shelf-renderer',
    'ytd-reel-item-renderer',
    'ytd-shorts-remixing-shelf-renderer',
    // Parent containers that wrap Shorts shelves (subscriptions page, etc.)
    'ytd-rich-shelf-renderer:has(ytd-reel-shelf-renderer)',
    'ytd-rich-section-renderer:has(ytd-reel-shelf-renderer)',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    // Channel page Shorts tab
    'yt-tab-shape[tab-title="Shorts"]',
    'tp-yt-paper-tab:has(a[href*="/@"][href$="/shorts"])',
    // Mobile web
    'ytm-reel-shelf-renderer',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
  ];

  // Homepage Shorts video cards
  const HOMEPAGE_SHORTS_SELECTORS = [
    'ytd-rich-item-renderer:has(ytd-thumbnail[href*="/shorts/"])',
    'ytd-rich-item-renderer:has(a#thumbnail[href*="/shorts/"])',
  ];

  function normalizeSectionTitle(value) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Sidebar section titles (localized)
  const SECTION_TITLE_ALIASES = {
    explore: [
      'Explore',
      'Preskumat',
    ],
    moreFromYouTube: [
      'More from YouTube',
      'Viac z YouTube',
      'Viac od YouTube',
    ],
  };

  const EXPLORE_TITLES = new Set(
    SECTION_TITLE_ALIASES.explore.map(normalizeSectionTitle)
  );

  const MORE_FROM_YOUTUBE_TITLES = new Set(
    SECTION_TITLE_ALIASES.moreFromYouTube.map(normalizeSectionTitle)
  );

  const MORE_FROM_YOUTUBE_HOSTS = new Set([
    'studio.youtube.com',
    'music.youtube.com',
    'www.youtubekids.com',
  ]);

  const EXPLORE_PATHS = new Set([
    '/feed/explore',
    '/feed/trending',
    '/gaming',
    '/news',
    '/sports',
    '/learning',
    '/fashion',
    '/feed/storefront',
    '/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ',
  ]);

  const EXPLORE_MATCH_THRESHOLD = 2;
  const MORE_FROM_YOUTUBE_MATCH_THRESHOLD = 2;

  function countSectionMatches(section, predicate, threshold) {
    const seen = new Set();
    const links = section.querySelectorAll('a[href]');
    for (const link of links) {
      let url;
      try {
        url = new URL(link.href);
      } catch (e) {
        continue;
      }
      if (!predicate(url)) continue;
      const key = `${url.hostname}${url.pathname}`;
      if (!seen.has(key)) {
        seen.add(key);
        if (seen.size >= threshold) {
          break;
        }
      }
    }
    return seen.size;
  }

  function isExploreSection(section, titleText) {
    const normalizedTitle = normalizeSectionTitle(titleText);
    if (EXPLORE_TITLES.has(normalizedTitle)) return true;

    const matches = countSectionMatches(section, (url) => {
      if (!url.hostname.endsWith('youtube.com')) return false;
      return EXPLORE_PATHS.has(url.pathname);
    }, EXPLORE_MATCH_THRESHOLD);

    return matches >= EXPLORE_MATCH_THRESHOLD;
  }

  function isMoreFromYouTubeSection(section, titleText) {
    const normalizedTitle = normalizeSectionTitle(titleText);
    if (MORE_FROM_YOUTUBE_TITLES.has(normalizedTitle)) return true;

    const matches = countSectionMatches(
      section,
      (url) => MORE_FROM_YOUTUBE_HOSTS.has(url.hostname),
      MORE_FROM_YOUTUBE_MATCH_THRESHOLD
    );

    return matches >= MORE_FROM_YOUTUBE_MATCH_THRESHOLD;
  }

  // Debounce delay
  const DEBOUNCE_DELAY = 100;

  // ============================================
  // CSS INJECTION
  // ============================================

  const STYLE_ID = 'shorts-blocker-styles';

  function updateCSS() {
    // Remove existing styles
    const existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();

    // Build CSS based on current settings
    const rules = [];

    if (settings.hideSidebar) {
      rules.push(...SIDEBAR_SHORTS_SELECTORS);
    }

    if (settings.hideShelves) {
      rules.push(...SHELF_SELECTORS);
      rules.push(...HOMEPAGE_SHORTS_SELECTORS);
    }

    if (rules.length === 0) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      ${rules.join(',\n      ')} {
        display: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ============================================
  // URL REDIRECT
  // ============================================

  function checkAndRedirectShortsUrl() {
    if (!settings.blockUrls) return false;

    const path = window.location.pathname;

    if (path === '/shorts' ||
        path.startsWith('/shorts/') ||
        path === '/feed/shorts') {
      window.location.replace('https://www.youtube.com/');
      return true;
    }
    return false;
  }

  // ============================================
  // DOM HIDING
  // ============================================

  function hideElement(el) {
    if (el && el.style.display !== 'none') {
      el.style.display = 'none';
      el.dataset.shortsBlocked = 'true';
    }
  }

  function showElement(el) {
    if (el && el.dataset.shortsBlocked) {
      el.style.display = '';
      delete el.dataset.shortsBlocked;
    }
  }

  /**
   * Find sidebar sections by their title text and hide/show them
   */
  function updateSidebarSections() {
    // Find all guide section renderers
    const sections = document.querySelectorAll('ytd-guide-section-renderer');

    sections.forEach(section => {
      const titleElement = section.querySelector('#guide-section-title');
      if (!titleElement) return;

      const titleText = titleElement.textContent.trim();
      const exploreSection = isExploreSection(section, titleText);
      const moreFromYouTubeSection = isMoreFromYouTubeSection(section, titleText);

      // Handle "Explore" section
      if (exploreSection) {
        if (settings.hideExplore) {
          hideElement(section);
        } else {
          showElement(section);
        }
      }

      // Handle "More from YouTube" section
      if (moreFromYouTubeSection) {
        if (settings.hideMoreFromYouTube) {
          hideElement(section);
        } else {
          showElement(section);
        }
      }
    });
  }

  function findAndHideElements() {
    const selectorsToHide = [];

    if (settings.hideSidebar) {
      selectorsToHide.push(...SIDEBAR_SHORTS_SELECTORS);
    }

    if (settings.hideShelves) {
      selectorsToHide.push(...SHELF_SELECTORS);
      selectorsToHide.push(...HOMEPAGE_SHORTS_SELECTORS);
    }

    // Hide CSS-selectable elements
    selectorsToHide.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!el.dataset.shortsBlocked) {
            hideElement(el);
          }
        });
      } catch (e) {
        // Selector not supported
      }
    });

    // Hide text-based sidebar sections
    updateSidebarSections();
  }

  function showAllHidden() {
    document.querySelectorAll('[data-shorts-blocked="true"]').forEach(showElement);
  }

  // ============================================
  // DEBOUNCING
  // ============================================

  let debounceTimer = null;

  function debouncedCleanup() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!checkAndRedirectShortsUrl()) {
        findAndHideElements();
      }
    }, DEBOUNCE_DELAY);
  }

  // ============================================
  // MUTATION OBSERVER
  // ============================================

  function handleMutations(mutations) {
    const hasAdditions = mutations.some(m => m.addedNodes.length > 0);
    if (hasAdditions) {
      debouncedCleanup();
    }
  }

  const observer = new MutationObserver(handleMutations);

  // ============================================
  // HISTORY API HOOKS
  // ============================================

  function setupHistoryHooks() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      if (!checkAndRedirectShortsUrl()) {
        debouncedCleanup();
      }
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      if (!checkAndRedirectShortsUrl()) {
        debouncedCleanup();
      }
    };

    window.addEventListener('popstate', () => {
      if (!checkAndRedirectShortsUrl()) {
        debouncedCleanup();
      }
    });
  }

  // ============================================
  // YOUTUBE NAVIGATION HOOKS
  // ============================================

  function setupYouTubeNavigationHooks() {
    document.addEventListener('yt-navigate-finish', () => {
      if (!checkAndRedirectShortsUrl()) {
        debouncedCleanup();
      }
    });
    document.addEventListener('yt-page-data-updated', () => {
      if (!checkAndRedirectShortsUrl()) {
        debouncedCleanup();
      }
    });
  }

  // ============================================
  // SETTINGS UPDATE
  // ============================================

  function applySettings(newSettings) {
    const oldSettings = { ...settings };
    settings = { ...settings, ...newSettings };

    // Update CSS
    updateCSS();

    // Handle Shorts sidebar button
    if (oldSettings.hideSidebar && !settings.hideSidebar) {
      SIDEBAR_SHORTS_SELECTORS.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(showElement);
        } catch (e) {}
      });
    }

    // Handle Shorts shelves
    if (oldSettings.hideShelves && !settings.hideShelves) {
      [...SHELF_SELECTORS, ...HOMEPAGE_SHORTS_SELECTORS].forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(showElement);
        } catch (e) {}
      });
    }

    // Always update sidebar sections (handles both hide and show)
    updateSidebarSections();

    // If any hiding feature is enabled, run cleanup
    if (settings.hideSidebar || settings.hideShelves) {
      findAndHideElements();
    }

    // Check URL if blocking was just enabled
    if (!oldSettings.blockUrls && settings.blockUrls) {
      checkAndRedirectShortsUrl();
    }

    console.debug('[ShortsBlocker] Settings updated:', settings);
  }

  // ============================================
  // MESSAGE LISTENER
  // ============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsChanged') {
      applySettings(message.settings);
      sendResponse({ success: true });
    }
    // Legacy support
    if (message.type === 'toggleEnabled') {
      applySettings({
        blockUrls: message.enabled,
        hideSidebar: message.enabled,
        hideShelves: message.enabled
      });
      sendResponse({ success: true });
    }
    return true;
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        settings = { ...settings, ...result.settings };
      }

      // Apply CSS
      updateCSS();

      // Check URL on initial load
      if (checkAndRedirectShortsUrl()) {
        return;
      }

      // Initial cleanup
      findAndHideElements();

      // Setup hooks
      setupHistoryHooks();
      setupYouTubeNavigationHooks();

      // Start observing
      const targetNode = document.body || document.documentElement;
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      });

      console.debug('[ShortsBlocker] Initialized with settings:', settings);
    });
  }

  // Run when DOM is ready
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // Fallback
  window.addEventListener('load', () => {
    if (!checkAndRedirectShortsUrl()) {
      findAndHideElements();
    }
  });

})();
