/**
 * Safe Background Script for AdReply
 * Minimal background operations to avoid Facebook detection
 */

// Minimal background script that doesn't trigger Facebook's anti-extension measures
class SafeBackgroundService {
  constructor() {
    this.isActive = false;
    this.currentTab = null;
  }

  initialize() {
    if (this.isActive) return;
    this.isActive = true;

    // Listen for tab updates (minimal monitoring)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url?.includes('facebook.com/groups/')) {
        this.currentTab = tab;
      }
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });

    // Handle side panel communication
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidepanel') {
        this.handleSidePanelConnection(port);
      }
    });

    console.log('AdReply: Safe background service initialized');
  }

  handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'NEW_POST':
          // Store the latest post data for side panel
          this.latestPost = message.data;
          sendResponse({ success: true });
          break;

        case 'GET_CURRENT_TAB':
          sendResponse({ tab: this.currentTab });
          break;

        case 'PING':
          sendResponse({ active: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  handleSidePanelConnection(port) {
    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'GET_LATEST_POST':
          port.postMessage({
            type: 'LATEST_POST',
            data: this.latestPost || null
          });
          break;

        case 'GET_STATUS':
          port.postMessage({
            type: 'STATUS',
            data: { active: this.isActive, tab: this.currentTab }
          });
          break;
      }
    });
  }
}

// Initialize the safe background service
const backgroundService = new SafeBackgroundService();
backgroundService.initialize();