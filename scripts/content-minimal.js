/**
 * Facebook-Safe AdReply Content Script
 * Uses Shadow DOM and avoids Facebook's React roots to prevent detection/blocking
 * Fixes window.onunload issues by using pagehide and visibilitychange events
 */

// Immediate test to see if content script loads
console.log('AdReply: Content script starting to load...');
console.log('AdReply: Current URL:', window.location.href);
console.log('AdReply: Document ready state:', document.readyState);

class FacebookSafeIntegration {
    constructor() {
        this.currentGroupId = null;
        this.isActive = false;
        this.shadowRoot = null;
        this.observers = [];
        this.lastPostContent = '';
        this.uiContainer = null;
        
        // Safe selectors that don't interfere with Facebook's React
        this.selectors = {
            posts: '[role="article"], [data-testid="post"], .userContentWrapper',
            postContent: '[data-ad-preview="message"], .userContent, [data-testid="post_message"], [data-testid="message_text"], .text_exposed_root, ._5pbx',
            groupIndicator: '[href*="/groups/"]',
            messageOverlay: '[role="dialog"] [role="article"], [data-testid="message_overlay"] [role="article"]',
            postOverlay: '[role="dialog"] [role="article"], [data-testid="post_overlay"] [role="article"]'
        };

        this.throttleDelay = 3000; // Longer delay to avoid detection
        this.lastOperation = 0;
    }

    async initialize() {
        if (this.isActive) return;

        // Initialize on Facebook pages
        if (!window.location.hostname.includes('facebook.com')) return;

        this.isActive = true;
        this.currentGroupId = this.extractGroupId();
        
        console.log('AdReply: Initializing on Facebook page:', window.location.pathname);

        // Wait for page stability before injecting UI
        await this.waitForPageStability();

        // Create Shadow DOM container
        this.createShadowContainer();

        // Set up passive observation
        this.setupPassiveObserver();
        
        // Do an immediate check for posts
        setTimeout(() => {
            this.checkForNewContent();
        }, 3000);

        // Set up message handling
        this.setupMessageHandler();

        console.log('AdReply: Facebook-safe mode initialized for group:', this.currentGroupId);
    }

    isOnGroupPage() {
        return window.location.pathname.includes('/groups/') || 
               window.location.pathname.includes('/messages/') ||
               this.hasMessageOverlay() ||
               this.hasPostOverlay();
    }

    hasMessageOverlay() {
        // Check for message overlay/modal
        return document.querySelector('[role="dialog"][aria-label*="message"]') ||
               document.querySelector('[data-testid="message_overlay"]') ||
               document.querySelector('.uiLayer[data-testid*="message"]');
    }

    hasPostOverlay() {
        // Check for post overlay/modal
        return document.querySelector('[role="dialog"] [role="article"]') ||
               document.querySelector('[data-testid="post_overlay"]') ||
               document.querySelector('.uiLayer [role="article"]');
    }

    extractGroupId() {
        const match = window.location.pathname.match(/\/groups\/([^\/]+)/);
        return match ? match[1] : null;
    }

    async waitForPageStability() {
        // Use requestIdleCallback if available, otherwise setTimeout
        return new Promise(resolve => {
            if (window.requestIdleCallback) {
                requestIdleCallback(resolve, { timeout: 2000 });
            } else {
                setTimeout(resolve, 1000);
            }
        });
    }

    createShadowContainer() {
        try {
            // Create container as sibling to body, not child of Facebook's React roots
            this.uiContainer = document.createElement('div');
            this.uiContainer.id = 'adreply-shadow-host';
            this.uiContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0;
                height: 0;
                z-index: 999999;
                pointer-events: none;
            `;

            // Attach to document.documentElement to avoid Facebook's containers
            document.documentElement.appendChild(this.uiContainer);

            // Create shadow root for complete isolation
            this.shadowRoot = this.uiContainer.attachShadow({ mode: 'closed' });

            // Add minimal styles scoped to shadow root
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    all: initial;
                }
                .adreply-indicator {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 12px;
                    height: 12px;
                    background: #4CAF50;
                    border-radius: 50%;
                    opacity: 0.7;
                    pointer-events: none;
                    z-index: 999999;
                }
            `;
            this.shadowRoot.appendChild(style);

            // Add status indicator
            const indicator = document.createElement('div');
            indicator.className = 'adreply-indicator';
            indicator.title = 'AdReply Active';
            this.shadowRoot.appendChild(indicator);

            console.log('AdReply: Shadow DOM container created');
        } catch (error) {
            console.warn('AdReply: Could not create shadow container:', error);
        }
    }

    setupPassiveObserver() {
        // Use minimal, throttled observation to avoid detection
        const observer = new MutationObserver(this.throttle(() => {
            this.checkForNewContent();
        }, this.throttleDelay));

        // Observe multiple areas including overlays and messages
        const feedSelectors = [
            '[role="main"] [role="feed"]',
            '[data-pagelet="GroupFeed"]',
            '.feed',
            '[role="dialog"]', // For overlays
            '[data-testid="message_overlay"]',
            '[data-testid="post_overlay"]',
            '.uiLayer' // Facebook's overlay container
        ];

        for (const selector of feedSelectors) {
            const feedArea = document.querySelector(selector);
            if (feedArea) {
                observer.observe(feedArea, {
                    childList: true,
                    subtree: true // Need subtree for overlays
                });
                this.observers.push(observer);
                console.log('AdReply: Observer attached to:', selector);
            }
        }

        // Also observe document body for dynamically added overlays
        const bodyObserver = new MutationObserver(this.throttle(() => {
            this.checkForOverlays();
        }, this.throttleDelay));

        bodyObserver.observe(document.body, {
            childList: true,
            subtree: false
        });
        this.observers.push(bodyObserver);
    }

    checkForNewContent() {
        try {
            // Check regular posts
            this.checkPosts();
            
            // Check overlays
            this.checkForOverlays();
        } catch (error) {
            // Silently handle errors to avoid detection
            console.debug('AdReply: Content check error:', error.message);
        }
    }

    checkPosts() {
        // Use passive, read-only operations
        const posts = document.querySelectorAll(this.selectors.posts);

        if (posts.length > 0) {
            // Get the most recent post that we haven't processed
            for (let i = posts.length - 1; i >= 0; i--) {
                const post = posts[i];
                if (!post.dataset.adreplyChecked) {
                    post.dataset.adreplyChecked = 'true';
                    
                    const content = this.extractContentPassively(post);
                    
                    if (content && content !== this.lastPostContent && content.length > 20) {
                        this.lastPostContent = content;
                        console.log('AdReply: New post detected:', content.substring(0, 50) + '...');
                        this.notifyExtension('NEW_POST', { 
                            content, 
                            groupId: this.currentGroupId || 'facebook',
                            timestamp: Date.now(),
                            source: 'post'
                        });
                        break; // Only process one new post at a time
                    }
                }
            }
        }
    }

    checkForOverlays() {
        // More comprehensive overlay detection
        const overlayContainers = [
            '[role="dialog"]',
            '[data-testid="modal-dialog"]',
            '.uiLayer',
            '[aria-modal="true"]',
            '.fbPhotoSnowlift', // Facebook photo viewer
            '[data-testid="photo-viewer"]'
        ];

        for (const containerSelector of overlayContainers) {
            const containers = document.querySelectorAll(containerSelector);
            
            for (const container of containers) {
                if (!container.dataset.adreplyOverlayContainer) {
                    container.dataset.adreplyOverlayContainer = 'true';
                    console.log('AdReply: Found overlay container:', containerSelector);
                    
                    // Look for posts within this container
                    const posts = container.querySelectorAll('[role="article"], [data-testid="post"], .userContentWrapper');
                    
                    for (const post of posts) {
                        if (!post.dataset.adreplyOverlayChecked) {
                            post.dataset.adreplyOverlayChecked = 'true';
                            
                            const content = this.extractContentPassively(post);
                            if (content && content !== this.lastPostContent && content.length > 10) {
                                this.lastPostContent = content;
                                this.notifyExtension('NEW_POST', { 
                                    content, 
                                    groupId: this.currentGroupId || 'overlay',
                                    timestamp: Date.now(),
                                    source: 'overlay'
                                });
                                console.log('AdReply: Detected post in overlay:', content.substring(0, 50) + '...');
                                return;
                            }
                        }
                    }
                    
                    // Also check for any text content in the overlay
                    const textContent = this.extractAnyTextFromOverlay(container);
                    if (textContent && textContent !== this.lastPostContent && textContent.length > 20) {
                        this.lastPostContent = textContent;
                        this.notifyExtension('NEW_POST', { 
                            content: textContent, 
                            groupId: this.currentGroupId || 'overlay',
                            timestamp: Date.now(),
                            source: 'overlay_text'
                        });
                        console.log('AdReply: New overlay post detected:', textContent.substring(0, 50) + '...');
                        return;
                    }
                }
            }
        }
    }

    extractAnyTextFromOverlay(container) {
        // Try multiple text extraction methods for overlays
        const textSelectors = [
            '[data-testid="post_message"]',
            '[data-ad-preview="message"]',
            '.userContent',
            '.text_exposed_root',
            '._5pbx',
            '[data-testid="message_text"]',
            '.x1iorvi4', // Facebook's text class
            '[dir="auto"]', // Auto-direction text
            'span[lang]', // Language-tagged spans
            'p', 'div[role="text"]'
        ];

        for (const selector of textSelectors) {
            const elements = container.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent || element.innerText || '';
                if (text.trim().length > 20) {
                    return text.trim();
                }
            }
        }

        // Fallback: get any substantial text content
        const allText = container.textContent || container.innerText || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 10);
        
        if (lines.length > 0) {
            // Return the longest meaningful line
            return lines.reduce((longest, current) => 
                current.length > longest.length ? current : longest
            );
        }

        return '';
    }

    extractContentPassively(postElement) {
        try {
            // Use only safe, read-only operations
            const contentSelectors = this.selectors.postContent.split(', ');
            
            for (const selector of contentSelectors) {
                const contentEl = postElement.querySelector(selector);
                if (contentEl) {
                    const text = contentEl.textContent || contentEl.innerText || '';
                    if (text.trim().length > 0) {
                        return text.trim();
                    }
                }
            }
            return '';
        } catch (error) {
            return '';
        }
    }

    setupMessageHandler() {
        // Minimal message handling with error protection
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                switch (message.type) {
                    case 'GET_GROUP_ID':
                        sendResponse({ success: true, groupId: this.currentGroupId });
                        break;
                    case 'GET_LAST_POST':
                        sendResponse({ success: true, content: this.lastPostContent });
                        break;
                    case 'GET_STATUS':
                        sendResponse({ 
                            success: true, 
                            active: this.isActive,
                            groupId: this.currentGroupId,
                            hasContent: !!this.lastPostContent
                        });
                        break;
                    case 'PING':
                        sendResponse({ success: true, pong: true });
                        break;
                    case 'DEBUG_OVERLAYS':
                        const overlays = this.debugOverlays();
                        sendResponse({ success: true, overlays });
                        break;
                    case 'FORCE_CHECK':
                        this.checkForNewContent();
                        this.checkForOverlays();
                        sendResponse({ success: true, message: 'Force check completed' });
                        break;
                    case 'INSERT_COMMENT':
                        const insertResult = this.insertCommentIntoFacebook(message.text);
                        sendResponse(insertResult);
                        break;
                    default:
                        sendResponse({ success: false, error: 'Unknown message type' });
                }
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        });
    }

    notifyExtension(type, data) {
        try {
            chrome.runtime.sendMessage({ 
                type, 
                data, 
                source: 'facebook_safe_content',
                timestamp: Date.now()
            });
        } catch (error) {
            // Silently handle messaging errors
            console.debug('AdReply: Messaging error:', error.message);
        }
    }

    throttle(func, delay) {
        return (...args) => {
            const now = Date.now();
            if (now - this.lastOperation >= delay) {
                this.lastOperation = now;
                return func.apply(this, args);
            }
        };
    }

    cleanup() {
        // Clean up observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];

        // Remove shadow container
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }
        this.uiContainer = null;
        this.shadowRoot = null;

        // Reset state
        this.isActive = false;
        this.lastPostContent = '';

        console.log('AdReply: Facebook-safe integration cleaned up');
    }

    debugOverlays() {
        const overlayInfo = [];
        
        // Check all possible overlay containers
        const selectors = [
            '[role="dialog"]',
            '[data-testid="modal-dialog"]', 
            '.uiLayer',
            '[aria-modal="true"]',
            '.fbPhotoSnowlift'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                overlayInfo.push({
                    selector,
                    count: elements.length,
                    visible: Array.from(elements).some(el => el.offsetParent !== null),
                    hasArticles: Array.from(elements).some(el => el.querySelector('[role="article"]')),
                    hasText: Array.from(elements).some(el => (el.textContent || '').length > 50)
                });
            }
        }

        console.log('AdReply: Overlay debug info:', overlayInfo);
        return overlayInfo;
    }

    insertCommentIntoFacebook(commentText) {
        try {
            // Facebook comment box selectors (multiple fallbacks)
            const commentSelectors = [
                '[data-testid="comment-composer"] [contenteditable="true"]',
                '[aria-label*="comment" i] [contenteditable="true"]',
                '[placeholder*="comment" i]',
                'div[contenteditable="true"][data-text="Write a comment..."]',
                'div[contenteditable="true"][data-text*="comment" i]',
                '.notranslate[contenteditable="true"]',
                '[role="textbox"][contenteditable="true"]'
            ];

            let commentBox = null;
            
            // Try to find comment box
            for (const selector of commentSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    // Check if element is visible and not disabled
                    if (element.offsetParent !== null && !element.disabled) {
                        commentBox = element;
                        break;
                    }
                }
                if (commentBox) break;
            }

            if (!commentBox) {
                return { 
                    success: false, 
                    error: 'Could not find Facebook comment box. Please click on a post first.' 
                };
            }

            // Focus the comment box
            commentBox.focus();
            
            // Clear existing content
            commentBox.innerHTML = '';
            
            // Insert the comment text
            if (commentBox.tagName.toLowerCase() === 'textarea') {
                // For textarea elements
                commentBox.value = commentText;
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // For contenteditable divs
                commentBox.textContent = commentText;
                
                // Trigger input events to notify Facebook
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.dispatchEvent(new Event('keyup', { bubbles: true }));
                commentBox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Set cursor to end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(commentBox);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            console.log('AdReply: Comment inserted successfully:', commentText.substring(0, 50) + '...');
            
            return { 
                success: true, 
                message: 'Comment inserted successfully' 
            };

        } catch (error) {
            console.error('AdReply: Error inserting comment:', error);
            return { 
                success: false, 
                error: 'Failed to insert comment: ' + error.message 
            };
        }
    }
}

// Global instance
let facebookSafeIntegration = null;

// Safe initialization function
function initializeSafely() {
    try {
        // Initialize on Facebook pages (groups, messages, or with overlays)
        const shouldInitialize = window.location.hostname.includes('facebook.com') && (
            window.location.pathname.includes('/groups/') ||
            window.location.pathname.includes('/messages/') ||
            document.querySelector('[role="dialog"]') ||
            true // Always initialize on Facebook for overlay detection
        );

        if (shouldInitialize) {
            console.log('AdReply: Initializing Facebook-safe mode');
            
            if (!facebookSafeIntegration) {
                facebookSafeIntegration = new FacebookSafeIntegration();
            }
            
            facebookSafeIntegration.initialize();
            
            // Set global markers for testing
            window.adReplyActive = true;
            window.facebookSafeIntegration = facebookSafeIntegration;
        } else {
            console.log('AdReply: Not on Facebook, skipping initialization');
            
            // Clean up if we're not on Facebook
            if (facebookSafeIntegration) {
                facebookSafeIntegration.cleanup();
                facebookSafeIntegration = null;
            }
        }
    } catch (error) {
        console.error('AdReply: Safe initialization error:', error);
    }
}

// Initialize based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSafely);
} else {
    // Use requestIdleCallback for better performance
    if (window.requestIdleCallback) {
        requestIdleCallback(initializeSafely, { timeout: 1000 });
    } else {
        setTimeout(initializeSafely, 500);
    }
}

// Enhanced overlay detection on clicks and DOM changes
document.addEventListener('click', (e) => {
    // Detect clicks that might open overlays
    const target = e.target.closest('a, button, [role="button"], [data-testid*="post"], [href*="/posts/"]');
    if (target) {
        console.log('AdReply: Click detected, waiting for overlay...');
        
        // Multiple checks with different delays
        setTimeout(() => checkForNewOverlays(), 500);
        setTimeout(() => checkForNewOverlays(), 1500);
        setTimeout(() => checkForNewOverlays(), 3000);
    }
});

// Watch for new DOM elements (overlays)
const overlayWatcher = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if this is an overlay
                    if (node.matches && (
                        node.matches('[role="dialog"]') ||
                        node.matches('[aria-modal="true"]') ||
                        node.matches('.uiLayer') ||
                        node.querySelector('[role="dialog"]')
                    )) {
                        console.log('AdReply: New overlay detected in DOM');
                        setTimeout(() => checkForNewOverlays(), 100);
                        setTimeout(() => checkForNewOverlays(), 1000);
                    }
                }
            }
        }
    }
});

overlayWatcher.observe(document.body, {
    childList: true,
    subtree: true
});

function checkForNewOverlays() {
    if (facebookSafeIntegration) {
        console.log('AdReply: Checking for overlays...');
        facebookSafeIntegration.checkForOverlays();
        
        // Also force a general content check
        facebookSafeIntegration.checkForNewContent();
    }
}

// Handle page navigation (Facebook is SPA) - FIXED: No more window.onunload
let lastUrl = location.href;
const navigationObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('AdReply: Navigation detected, reinitializing');
        
        // Clean up current instance
        if (facebookSafeIntegration) {
            facebookSafeIntegration.cleanup();
            facebookSafeIntegration = null;
        }
        
        // Reinitialize after navigation
        setTimeout(initializeSafely, 1000);
    }
});

// Observe document for navigation changes
navigationObserver.observe(document, { subtree: true, childList: true });

// FIXED: Use visibilitychange instead of beforeunload (Facebook blocks beforeunload)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && facebookSafeIntegration) {
        console.log('AdReply: Page hidden, cleaning up');
        facebookSafeIntegration.cleanup();
    } else if (!document.hidden && window.location.pathname.includes('/groups/')) {
        console.log('AdReply: Page visible, reinitializing');
        setTimeout(initializeSafely, 500);
    }
});

// FIXED: Handle page unload with pagehide (more reliable than beforeunload)
window.addEventListener('pagehide', () => {
    if (facebookSafeIntegration) {
        facebookSafeIntegration.cleanup();
    }
    navigationObserver.disconnect();
});

// Periodic health check (less frequent to avoid detection)
setInterval(() => {
    try {
        const shouldBeActive = window.location.hostname.includes('facebook.com');
        const isActive = facebookSafeIntegration && facebookSafeIntegration.isActive;
        
        if (shouldBeActive && !isActive) {
            console.log('AdReply: Health check - reinitializing');
            initializeSafely();
        } else if (!shouldBeActive && isActive) {
            console.log('AdReply: Health check - cleaning up');
            if (facebookSafeIntegration) {
                facebookSafeIntegration.cleanup();
                facebookSafeIntegration = null;
            }
        }

        // Check for new overlays
        if (isActive && facebookSafeIntegration) {
            if (facebookSafeIntegration.hasMessageOverlay() || facebookSafeIntegration.hasPostOverlay()) {
                facebookSafeIntegration.checkForOverlays();
            }
        }
    } catch (error) {
        console.debug('AdReply: Health check error:', error.message);
    }
}, 3000); // 3 second intervals for better overlay detection

// Set global markers for extension detection
window.adReplyLoaded = true;
window.adReplyMinimalLoaded = true; // Keep for compatibility
console.log('AdReply: Facebook-safe content script loaded on:', window.location.href);

// Immediate initialization test
console.log('AdReply: Testing immediate initialization...');
setTimeout(() => {
    initializeSafely();
}, 1000);