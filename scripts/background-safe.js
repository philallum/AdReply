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
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AdReply: Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('AdReply: First time installation');
  } else if (details.reason === 'update') {
    console.log('AdReply: Extension updated');
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove posts from closed tab
  recentPosts = recentPosts.filter(post => post.tabId !== tabId);
  console.log('AdReply: Cleaned up posts from closed tab:', tabId);
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  console.log('AdReply: Extension icon clicked, tab info:', {
    id: tab.id,
    url: tab.url,
    windowId: tab.windowId
  });

  try {
    // Inject content script if on Facebook and not already injected
    if (tab.url && tab.url.includes('facebook.com')) {
      try {
        // Test if content script is already running
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        console.log('AdReply: Content script already running');
      } catch (error) {
        // Content script not running, inject it
        console.log('AdReply: Injecting content script...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/content-minimal.js']
          });
          console.log('AdReply: Content script injected successfully');
        } catch (injectError) {
          console.error('AdReply: Failed to inject content script:', injectError);
        }
      }
    }

    // Try to open the side panel
    console.log('AdReply: Attempting to open side panel...');

    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('AdReply: Side panel opened successfully with windowId');
    } catch (windowError) {
      console.log('AdReply: WindowId method failed, trying tabId method:', windowError.message);

      try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('AdReply: Side panel opened successfully with tabId');
      } catch (tabError) {
        console.log('AdReply: TabId method failed, trying without parameters:', tabError.message);

        try {
          await chrome.sidePanel.open({});
          console.log('AdReply: Side panel opened successfully without parameters');
        } catch (noParamError) {
          console.error('AdReply: All side panel methods failed:', noParamError.message);

          // Ultimate fallback: try to create a popup window
          try {
            const popup = await chrome.windows.create({
              url: chrome.runtime.getURL('ui/sidepanel-safe.html'),
              type: 'popup',
              width: 400,
              height: 600,
              left: screen.width - 420,
              top: 100
            });
            console.log('AdReply: Opened as popup window:', popup.id);
          } catch (popupError) {
            console.error('AdReply: Popup fallback also failed:', popupError.message);
          }
        }
      }
    }

  } catch (error) {
    console.error('AdReply: Unexpected error in action click handler:', error);
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