/**
 * Facebook-Safe AdReply Content Script
 * Uses Shadow DOM and avoids Facebook's React roots to prevent detection/blocking
 */

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
            posts: '[role="article"]',
            postContent: '[data-ad-preview="message"], .userContent, [data-testid="post_message"]',
            groupIndicator: '[href*="/groups/"]',
            // Avoid Facebook's main containers
            avoidContainers: '[data-pagelet], [role="main"], #mount_0_0'
        };

        this.throttleDelay = 3000; // Longer delay to avoid detection
        this.lastOperation = 0;
    }

    async initialize() {
        if (this.isActive) return;

        // Only initialize on group pages
        if (!this.isOnGroupPage()) return;

        this.isActive = true;
        this.currentGroupId = this.extractGroupId();

        // Wait for page stability before injecting UI
        await this.waitForPageStability();

        // Create Shadow DOM container
        this.createShadowContainer();

        // Set up passive observation
        this.setupPassiveObserver();

        // Set up message handling
        this.setupMessageHandler();

        console.log('AdReply: Facebook-safe mode initialized for group:', this.currentGroupId);
    }

    isOnGroupPage() {
        return window.location.pathname.includes('/groups/');
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

        // Only observe the feed area, not Facebook's main containers
        const feedSelectors = [
            '[role="main"] [role="feed"]',
            '[data-pagelet="GroupFeed"]',
            '.feed'
        ];

        for (const selector of feedSelectors) {
            const feedArea = document.querySelector(selector);
            if (feedArea) {
                observer.observe(feedArea, {
                    childList: true,
                    subtree: false // Minimal observation depth
                });
                this.observers.push(observer);
                console.log('AdReply: Observer attached to:', selector);
                break;
            }
        }
    }

    checkForNewContent() {
        try {
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
                            this.notifyExtension('NEW_POST', { 
                                content, 
                                groupId: this.currentGroupId,
                                timestamp: Date.now()
                            });
                            break; // Only process one new post at a time
                        }
                    }
                }
            }
        } catch (error) {
            // Silently handle errors to avoid detection
            console.debug('AdReply: Content check error:', error.message);
        }
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
}

// Global instance
let facebookSafeIntegration = null;

// Safe initialization function
function initializeSafely() {
    try {
        if (window.location.pathname.includes('/groups/')) {
            console.log('AdReply: Initializing Facebook-safe mode on group page');
            
            if (!facebookSafeIntegration) {
                facebookSafeIntegration = new FacebookSafeIntegration();
            }
            
            facebookSafeIntegration.initialize();
            
            // Set global markers for testing
            window.adReplyActive = true;
            window.facebookSafeIntegration = facebookSafeIntegration;
        } else {
            console.log('AdReply: Not on group page, skipping initialization');
            
            // Clean up if we're not on a group page
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

// Handle page navigation (Facebook is SPA)
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

// Use visibilitychange instead of beforeunload (Facebook blocks beforeunload)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && facebookSafeIntegration) {
        console.log('AdReply: Page hidden, cleaning up');
        facebookSafeIntegration.cleanup();
    } else if (!document.hidden && window.location.pathname.includes('/groups/')) {
        console.log('AdReply: Page visible, reinitializing');
        setTimeout(initializeSafely, 500);
    }
});

// Handle page unload with pagehide (more reliable than beforeunload)
window.addEventListener('pagehide', () => {
    if (facebookSafeIntegration) {
        facebookSafeIntegration.cleanup();
    }
    navigationObserver.disconnect();
});

// Periodic health check (less frequent to avoid detection)
setInterval(() => {
    try {
        const shouldBeActive = window.location.pathname.includes('/groups/');
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
    } catch (error) {
        console.debug('AdReply: Health check error:', error.message);
    }
}, 5000); // 5 second intervals

// Set global markers for extension detection
window.adReplyLoaded = true;
console.log('AdReply: Facebook-safe content script loaded');