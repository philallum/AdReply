// Facebook-Safe Background Script for AdReply
console.log('AdReply: Background script loaded');

// Store recent posts for side panel access
let recentPosts = [];
let currentGroupInfo = null;

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('AdReply: Background received message:', message);

  try {
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true, active: true, background: 'working' });
        break;

      case 'NEW_POST':
        // Store new post from content script
        if (message.data) {
          const postData = {
            ...message.data,
            tabId: sender.tab?.id,
            timestamp: Date.now()
          };

          recentPosts.unshift(postData);

          // Keep only last 10 posts
          if (recentPosts.length > 10) {
            recentPosts = recentPosts.slice(0, 10);
          }

          console.log('AdReply: New post stored:', postData.content.substring(0, 50) + '...');

          // Notify side panel if it's open
          notifySidePanel('NEW_POST_AVAILABLE', postData);
        }
        sendResponse({ success: true });
        break;

      case 'GET_RECENT_POSTS':
        // Side panel requesting recent posts
        sendResponse({ success: true, posts: recentPosts });
        break;

      case 'GET_CURRENT_GROUP':
        // Side panel requesting current group info
        sendResponse({ success: true, groupInfo: currentGroupInfo });
        break;

      case 'CLEAR_POSTS':
        // Clear stored posts
        recentPosts = [];
        sendResponse({ success: true });
        break;

      case 'GROUP_INFO_UPDATED':
        // Update current group info from content script
        if (message.data) {
          currentGroupInfo = message.data;
          console.log('AdReply: Group info updated:', currentGroupInfo);
        }
        sendResponse({ success: true });
        break;

      case 'GET_STATUS':
        // Side panel requesting status
        sendResponse({
          success: true,
          active: true,
          groupInfo: currentGroupInfo,
          postsCount: recentPosts.length
        });
        break;

      case 'GET_LATEST_POST':
        // Side panel requesting latest post
        const latestPost = recentPosts.length > 0 ? recentPosts[0] : null;
        sendResponse({ success: true, post: latestPost });
        break;

      default:
        console.warn('AdReply: Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('AdReply: Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }

  return true; // Keep message channel open for async responses
});

// Function to notify side panel
function notifySidePanel(type, data) {
  try {
    // Try to send message to side panel
    chrome.runtime.sendMessage({
      type,
      data,
      source: 'background'
    }).catch(error => {
      // Side panel might not be open, which is fine
      console.debug('AdReply: Side panel not available:', error.message);
    });
  } catch (error) {
    console.debug('AdReply: Could not notify side panel:', error.message);
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('AdReply: Extension startup');
  recentPosts = [];
  currentGroupInfo = null;
});

// Handle extension install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AdReply: Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('AdReply: First time installation');
  } else if (details.reason === 'update') {
    console.log('AdReply: Extension updated');
  }

  // Enable left-click to open side panel
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    console.log('AdReply: Side panel behavior set - left-click will open panel');
  } catch (error) {
    console.warn('AdReply: setPanelBehavior failed:', error);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove posts from closed tab
  recentPosts = recentPosts.filter(post => post.tabId !== tabId);
  console.log('AdReply: Cleaned up posts from closed tab:', tabId);
});

// Handle content script injection when side panel opens
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Inject content script when Facebook pages finish loading
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com')) {
    try {
      // Test if content script is already running
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    } catch (error) {
      // Content script not running, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['scripts/content-minimal.js']
        });
        console.log('AdReply: Content script auto-injected on Facebook page');
      } catch (injectError) {
        console.log('AdReply: Could not inject content script:', injectError.message);
      }
    }
  }
});

console.log('AdReply: Background script initialized');

// Test side panel availability
if (chrome.sidePanel) {
  console.log('AdReply: Side panel API is available');
} else {
  console.error('AdReply: Side panel API is NOT available');
}

// Test action click registration
console.log('AdReply: Action click listener registered');