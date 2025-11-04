// AdReply Content Script
// Integrates with Facebook's DOM to detect posts and enable comment insertion

// Simple logging for content script
const logger = {
  info: (msg, data) => console.log(`[AdReply] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[AdReply] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[AdReply] ${msg}`, data || ''),
  debug: (msg, data) => console.debug(`[AdReply] ${msg}`, data || '')
};

// Simple error handler
const errorHandler = {
  handleError: (error, context) => {
    logger.error(`Error in ${context}:`, error.message);
  }
};

logger.info('AdReply content script loaded on Facebook');

class FacebookIntegration {
  constructor() {
    this.currentGroupId = null;
    this.currentUrl = null;
    this.postObserver = null;
    this.navigationObserver = null;
    this.lastProcessedPost = null;
    this.isInitialized = false;
    this.state = {
      groupInfo: null,
      lastActivity: null,
      processedPosts: new Set()
    };
    
    // Facebook selectors (robust with fallbacks)
    this.selectors = {
      posts: [
        '[data-pagelet="FeedUnit_0"]',
        '[data-pagelet^="FeedUnit_"]',
        '[role="article"]',
        '.userContentWrapper',
        '[data-testid="story-subtitle"]'
      ],
      postContent: [
        '[data-testid="post_message"]',
        '.userContent',
        '[data-ad-preview="message"]',
        '.text_exposed_root',
        '.kvgmc6g5'
      ],
      groupName: [
        '[data-testid="breadcrumb"] a[href*="/groups/"]',
        'h1[data-testid="group_name"]',
        '.groupsCoverTitle',
        'h1 a[href*="/groups/"]'
      ]
    };
    
    // Bind methods to preserve context
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('AdReply: Initializing Facebook integration');
    this.isInitialized = true;
    
    // Store initial URL
    this.currentUrl = window.location.href;
    
    // Extract initial group information
    this.updateGroupInfo();
    
    // Set up navigation monitoring
    this.setupNavigationObserver();
    
    // Set up DOM observers for post detection
    this.setupPostObserver();
    
    // Listen for messages from side panel
    this.setupMessageListener();
    
    // Process any existing posts on page load
    this.processExistingPosts();
    
    console.log('AdReply: Facebook integration initialized for group:', this.currentGroupId);
  }

  setupPostObserver() {
    // Create observer to detect new posts being loaded
    this.postObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a post or contains posts
            const posts = this.findPosts(node);
            posts.forEach(post => this.processPost(post));
          }
        });
      });
    });

    // Start observing the main feed container
    const feedContainer = document.querySelector('[role="main"]') || 
                         document.querySelector('#stream_pagelet') ||
                         document.body;
    
    if (feedContainer) {
      this.postObserver.observe(feedContainer, {
        childList: true,
        subtree: true
      });
      console.log('AdReply: Post observer started');
    }
  }

  findPosts(container) {
    const posts = [];
    
    // Try each selector until we find posts
    for (const selector of this.selectors.posts) {
      const elements = container.querySelectorAll ? 
        container.querySelectorAll(selector) : 
        (container.matches && container.matches(selector) ? [container] : []);
      
      if (elements.length > 0) {
        posts.push(...elements);
        break;
      }
    }
    
    return posts;
  }

  processExistingPosts() {
    // Process posts that are already on the page
    const existingPosts = this.findPosts(document);
    console.log(`AdReply: Found ${existingPosts.length} existing posts`);
    
    existingPosts.forEach(post => this.processPost(post));
  }

  processPost(postElement) {
    // Generate unique ID for post
    const postId = this.generatePostId(postElement);
    
    // Avoid processing the same post multiple times
    if (postElement.dataset.adreplyProcessed || this.state.processedPosts.has(postId)) {
      return;
    }
    
    postElement.dataset.adreplyProcessed = 'true';
    this.state.processedPosts.add(postId);
    
    const postContent = this.extractPostContent(postElement);
    if (postContent && postContent.trim().length > 0) {
      console.log('AdReply: New post detected:', postContent.substring(0, 100) + '...');
      
      // Store the last processed post for the side panel
      this.lastProcessedPost = {
        id: postId,
        element: postElement,
        content: postContent,
        timestamp: Date.now()
      };
      
      // Update activity state
      this.state.lastActivity = {
        type: 'post_detected',
        timestamp: Date.now(),
        postId: postId
      };
      
      // Notify side panel about new post
      this.notifySidePanel('POST_DETECTED', {
        postId: postId,
        content: postContent,
        groupId: this.currentGroupId,
        groupInfo: this.state.groupInfo,
        timestamp: Date.now()
      });
    }
  }

  generatePostId(postElement) {
    // Try to find a unique identifier for the post
    const dataId = postElement.dataset.id || 
                  postElement.dataset.testid || 
                  postElement.id;
    
    if (dataId) return dataId;
    
    // Fallback: generate ID based on content and position
    const content = this.extractPostContent(postElement);
    const contentHash = this.simpleHash(content.substring(0, 100));
    const position = Array.from(postElement.parentNode?.children || []).indexOf(postElement);
    
    return `post_${contentHash}_${position}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  extractPostContent(postElement) {
    let content = '';
    
    // Try each content selector
    for (const selector of this.selectors.postContent) {
      const contentElement = postElement.querySelector(selector);
      if (contentElement) {
        content = contentElement.textContent || contentElement.innerText || '';
        if (content.trim().length > 0) {
          break;
        }
      }
    }
    
    // Clean up the content
    return content.trim().replace(/\s+/g, ' ');
  }

  extractGroupId() {
    // Extract group ID from URL
    const url = window.location.href;
    const groupMatch = url.match(/\/groups\/([^\/\?]+)/);
    return groupMatch ? groupMatch[1] : null;
  }

  extractGroupName() {
    // Try to extract group name from page elements
    for (const selector of this.selectors.groupName) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent || element.innerText || '';
      }
    }
    
    // Fallback to URL-based extraction
    const groupId = this.extractGroupId();
    return groupId ? `Group ${groupId}` : 'Unknown Group';
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        switch (message.type) {
          case 'GET_POST_CONTENT':
            const content = this.lastProcessedPost ? this.lastProcessedPost.content : '';
            sendResponse({ success: true, content });
            break;
            
          case 'GET_GROUP_ID':
            sendResponse({ success: true, groupId: this.currentGroupId });
            break;
            
          case 'GET_GROUP_INFO':
            sendResponse({ 
              success: true, 
              groupId: this.currentGroupId,
              groupName: this.extractGroupName(),
              url: window.location.href,
              state: this.state
            });
            break;
            
          case 'SYNC_STATE':
            this.syncStateWithSidePanel();
            sendResponse({ success: true });
            break;
            
          case 'RESET_STATE':
            this.resetProcessedPosts();
            sendResponse({ success: true });
            break;
            
          case 'INSERT_COMMENT':
            this.insertComment(message.text)
              .then(() => sendResponse({ success: true }))
              .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('AdReply: Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
  }

  notifySidePanel(type, data) {
    // Send message to side panel (if open)
    chrome.runtime.sendMessage({
      type,
      data,
      source: 'content_script'
    }).catch(error => {
      // Side panel might not be open, which is fine
      console.log('AdReply: Side panel not available:', error.message);
    });
  }

  async insertComment(commentText) {
    try {
      console.log('AdReply: Attempting to insert comment:', commentText);
      
      // Find the comment input box
      const commentBox = this.findCommentBox();
      if (!commentBox) {
        throw new Error('Comment input box not found');
      }
      
      // Focus the comment box to activate it
      this.focusCommentBox(commentBox);
      
      // Wait a moment for Facebook to initialize the comment box
      await this.delay(100);
      
      // Insert the text
      await this.insertTextIntoCommentBox(commentBox, commentText);
      
      // Trigger events to ensure Facebook recognizes the input
      this.triggerInputEvents(commentBox);
      
      console.log('AdReply: Comment inserted successfully');
      return true;
      
    } catch (error) {
      console.error('AdReply: Failed to insert comment:', error);
      throw error;
    }
  }

  findCommentBox() {
    // Multiple selectors for Facebook comment boxes (they change frequently)
    const commentSelectors = [
      // Modern Facebook selectors
      '[data-testid="comment"] [contenteditable="true"]',
      '[aria-label*="comment" i][contenteditable="true"]',
      '[aria-label*="Write a comment" i]',
      '[placeholder*="comment" i]',
      
      // Legacy selectors
      '.notranslate[contenteditable="true"]',
      '[data-testid="ufi_comment_composer"] [contenteditable="true"]',
      '.UFIAddCommentInput',
      
      // Generic contenteditable in comment areas
      '[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][data-text="Write a comment..."]'
    ];
    
    for (const selector of commentSelectors) {
      const elements = document.querySelectorAll(selector);
      
      // Find the most likely comment box (visible and in viewport)
      for (const element of elements) {
        if (this.isCommentBoxVisible(element)) {
          console.log('AdReply: Found comment box with selector:', selector);
          return element;
        }
      }
    }
    
    console.warn('AdReply: No suitable comment box found');
    return null;
  }

  isCommentBoxVisible(element) {
    // Check if element is visible and likely a comment box
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 && 
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      // Should be in or near the viewport
      rect.top < window.innerHeight + 200 &&
      rect.bottom > -200
    );
  }

  focusCommentBox(commentBox) {
    try {
      // Scroll into view if needed
      commentBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Focus the element
      commentBox.focus();
      
      // Click to ensure activation (some Facebook comment boxes need this)
      commentBox.click();
      
      console.log('AdReply: Comment box focused');
    } catch (error) {
      console.warn('AdReply: Error focusing comment box:', error);
    }
  }

  async insertTextIntoCommentBox(commentBox, text) {
    try {
      // Method 1: Direct content manipulation for contenteditable
      if (commentBox.contentEditable === 'true') {
        // Clear existing content
        commentBox.innerHTML = '';
        
        // Insert text as text node to avoid HTML injection
        const textNode = document.createTextNode(text);
        commentBox.appendChild(textNode);
        
        // Set cursor to end
        this.setCursorToEnd(commentBox);
      }
      // Method 2: For input elements
      else if (commentBox.tagName === 'INPUT' || commentBox.tagName === 'TEXTAREA') {
        commentBox.value = text;
      }
      // Method 3: Fallback using execCommand (deprecated but still works)
      else {
        commentBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      }
      
      console.log('AdReply: Text inserted into comment box');
    } catch (error) {
      console.error('AdReply: Error inserting text:', error);
      throw error;
    }
  }

  setCursorToEnd(element) {
    try {
      const range = document.createRange();
      const selection = window.getSelection();
      
      range.selectNodeContents(element);
      range.collapse(false); // Collapse to end
      
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      console.warn('AdReply: Could not set cursor position:', error);
    }
  }

  triggerInputEvents(element) {
    try {
      // Trigger various events that Facebook might be listening for
      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
        new KeyboardEvent('keyup', { bubbles: true, key: 'a' }),
        new Event('focus', { bubbles: true }),
        new Event('blur', { bubbles: true })
      ];
      
      events.forEach(event => {
        try {
          element.dispatchEvent(event);
        } catch (e) {
          // Some events might fail, continue with others
        }
      });
      
      // Re-focus after events
      element.focus();
      
      console.log('AdReply: Input events triggered');
    } catch (error) {
      console.warn('AdReply: Error triggering events:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setupNavigationObserver() {
    // Monitor URL changes for navigation detection
    window.addEventListener('popstate', this.handlePopState);
    
    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.handleUrlChange(), 100);
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.handleUrlChange(), 100);
    };
    
    // Also monitor for hash changes
    window.addEventListener('hashchange', this.handleUrlChange);
    
    // Set up mutation observer for dynamic content changes that might indicate navigation
    this.navigationObserver = new MutationObserver((mutations) => {
      // Check if significant DOM changes occurred that might indicate navigation
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.addedNodes.length > 0 &&
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node.querySelector('[role="main"]') || node.matches('[role="main"]'))
        )
      );
      
      if (hasSignificantChanges) {
        setTimeout(() => this.handleUrlChange(), 200);
      }
    });
    
    this.navigationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('AdReply: Navigation observer set up');
  }

  handlePopState(event) {
    console.log('AdReply: Pop state detected');
    this.handleUrlChange();
  }

  handleUrlChange() {
    const newUrl = window.location.href;
    
    if (newUrl !== this.currentUrl) {
      console.log('AdReply: URL change detected:', this.currentUrl, '->', newUrl);
      
      const wasOnGroupPage = this.currentUrl && this.currentUrl.includes('/groups/');
      const isOnGroupPage = newUrl.includes('/groups/');
      
      this.currentUrl = newUrl;
      
      if (wasOnGroupPage && !isOnGroupPage) {
        // Navigated away from groups
        console.log('AdReply: Navigated away from Facebook groups');
        this.handleNavigationAway();
      } else if (!wasOnGroupPage && isOnGroupPage) {
        // Navigated to groups
        console.log('AdReply: Navigated to Facebook groups');
        this.handleNavigationToGroups();
      } else if (isOnGroupPage) {
        // Navigated between groups or within same group
        const oldGroupId = this.currentGroupId;
        this.updateGroupInfo();
        
        if (oldGroupId !== this.currentGroupId) {
          console.log('AdReply: Group changed:', oldGroupId, '->', this.currentGroupId);
          this.handleGroupChange(oldGroupId, this.currentGroupId);
        } else {
          console.log('AdReply: Navigation within same group');
          this.handleIntraGroupNavigation();
        }
      }
    }
  }

  updateGroupInfo() {
    const newGroupId = this.extractGroupId();
    const groupName = this.extractGroupName();
    
    this.currentGroupId = newGroupId;
    this.state.groupInfo = {
      id: newGroupId,
      name: groupName,
      url: window.location.href,
      lastUpdated: Date.now()
    };
    
    // Notify side panel of group info update
    this.notifySidePanel('GROUP_INFO_UPDATED', this.state.groupInfo);
  }

  handleNavigationAway() {
    // Clean up when leaving groups
    this.resetState();
    this.notifySidePanel('NAVIGATION_AWAY', { from: 'groups' });
  }

  handleNavigationToGroups() {
    // Reinitialize when entering groups
    this.updateGroupInfo();
    this.resetProcessedPosts();
    
    // Wait for page to load then process existing posts
    setTimeout(() => {
      this.processExistingPosts();
    }, 1000);
    
    this.notifySidePanel('NAVIGATION_TO_GROUPS', this.state.groupInfo);
  }

  handleGroupChange(oldGroupId, newGroupId) {
    // Reset state for new group
    this.resetProcessedPosts();
    this.state.lastActivity = null;
    
    // Process posts in new group
    setTimeout(() => {
      this.processExistingPosts();
    }, 1000);
    
    this.notifySidePanel('GROUP_CHANGED', {
      oldGroupId,
      newGroupId,
      groupInfo: this.state.groupInfo
    });
  }

  handleIntraGroupNavigation() {
    // Handle navigation within the same group (e.g., different tabs, posts)
    setTimeout(() => {
      this.processExistingPosts();
    }, 500);
    
    this.notifySidePanel('INTRA_GROUP_NAVIGATION', {
      groupInfo: this.state.groupInfo,
      url: window.location.href
    });
  }

  resetState() {
    this.currentGroupId = null;
    this.state.groupInfo = null;
    this.state.lastActivity = null;
    this.resetProcessedPosts();
  }

  resetProcessedPosts() {
    this.state.processedPosts.clear();
    this.lastProcessedPost = null;
    
    // Remove processing markers from DOM
    document.querySelectorAll('[data-adreply-processed]').forEach(element => {
      delete element.dataset.adreplyProcessed;
    });
  }

  syncStateWithSidePanel() {
    // Send current state to side panel for synchronization
    this.notifySidePanel('STATE_SYNC', {
      groupInfo: this.state.groupInfo,
      lastActivity: this.state.lastActivity,
      processedPostsCount: this.state.processedPosts.size,
      url: window.location.href
    });
  }

  cleanup() {
    // Clean up observers
    if (this.postObserver) {
      this.postObserver.disconnect();
      this.postObserver = null;
    }
    
    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
      this.navigationObserver = null;
    }
    
    // Remove event listeners
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handleUrlChange);
    
    // Reset state
    this.resetState();
    this.isInitialized = false;
    
    console.log('AdReply: Facebook integration cleaned up');
  }
}

// Global instance with enhanced error handling
let facebookIntegration = null;

// Initialize when on Facebook group pages
function initializeFacebookIntegration() {
  try {
    if (window.location.href.includes('/groups/')) {
      logger.info('Facebook group detected, initializing integration');
      
      if (!facebookIntegration) {
        facebookIntegration = new FacebookIntegration();
      }
      
      facebookIntegration.initialize();
    } else {
      logger.debug('Not on a Facebook group page');
      
      // Clean up if we have an instance but we're not on groups
      if (facebookIntegration) {
        facebookIntegration.cleanup();
      }
    }
  } catch (error) {
    logger.error('Failed to initialize Facebook integration', { error: error.message });
    errorHandler.handleError(error, 'facebook_initialization');
  }
}

// Initialize on page load
initializeFacebookIntegration();

// Handle page unload - Facebook blocks beforeunload, so use pagehide and visibilitychange
window.addEventListener('pagehide', () => {
  if (facebookIntegration) {
    facebookIntegration.cleanup();
  }
});

// Handle visibility changes for better cleanup (when tab becomes hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && facebookIntegration) {
    facebookIntegration.cleanup();
  }
});

// Handle page navigation in SPA (Facebook uses pushState/replaceState)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Page navigation detected, reinitialize if needed
    setTimeout(initializeFacebookIntegration, 100);
  }
}).observe(document, { subtree: true, childList: true });

// Re-check initialization periodically (Facebook is a SPA)
setInterval(() => {
  try {
    const shouldBeActive = window.location.href.includes('/groups/');
    const isActive = facebookIntegration && facebookIntegration.isInitialized;
    
    if (shouldBeActive && !isActive) {
      logger.debug('Re-initializing Facebook integration');
      initializeFacebookIntegration();
    } else if (!shouldBeActive && isActive) {
      logger.debug('Cleaning up Facebook integration');
      if (facebookIntegration) {
        facebookIntegration.cleanup();
      }
    }
  } catch (error) {
    logger.warn('Error in periodic Facebook integration check', { error: error.message });
  }
}, 2000);