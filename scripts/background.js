// AdReply Background Service Worker
// Handles extension lifecycle, license validation, and side panel management

console.log('AdReply background service worker loaded');

// Initialize extension on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('AdReply extension started');
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AdReply extension installed:', details.reason);
  
  // Set up default settings on first install
  if (details.reason === 'install') {
    initializeDefaultSettings();
  }
});

// Handle action button click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  // Open side panel for the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Initialize default settings
async function initializeDefaultSettings() {
  const defaultSettings = {
    ai: {
      provider: "off",
      geminiApiKey: "",
      openaiApiKey: "",
      enabled: false
    },
    ui: {
      sidebarWidth: 320,
      theme: "light",
      showUpgradePrompts: true
    },
    templates: {
      maxSuggestions: 3,
      enableRotation: true,
      preventRepetition: true
    }
  };
  
  const defaultLicense = {
    status: "free",
    tier: "free",
    features: []
  };
  
  try {
    await chrome.storage.local.set({
      settings: defaultSettings,
      license: defaultLicense
    });
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
}