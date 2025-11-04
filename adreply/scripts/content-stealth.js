/**
 * Stealth Facebook Integration for AdReply
 * Uses minimal, non-intrusive methods to avoid Facebook's detection systems
 */

class StealthFacebookIntegration {
    constructor() {
        this.currentGroupId = null;
        this.isActive = false;
        this.lastPostContent = '';
        this.observers = [];

        // Use minimal, passive selectors
        this.selectors = {
            // Only use stable, non-intrusive selectors
            posts: '[role="article"]',
            postContent: '[data-ad-preview="message"], .userContent',
            groupIndicator: '[href*="/groups/"]'
        };

        // Throttle operations to avoid detection
        this.throttleDelay = 2000; // 2 seconds between operations
        this.lastOperation = 0;
    }

    initialize() {
        if (this.isActive) return;

        // Only initialize on group pages
        if (!this.isOnGroupPage()) return;

        this.isActive = true;
        this.currentGroupId = this.extractGroupId();

        // Use passive observation only
        this.setupPassiveObserver();

        // Set up minimal message handling
        this.setupMessageHandler();

        console.log('AdReply: Stealth mode initialized for group:', this.currentGroupId);
    }

    isOnGroupPage() {
        return window.location.pathname.includes('/groups/');
    }

    extractGroupId() {
        const match = window.location.pathname.match(/\/groups\/([^\/]+)/);
        return match ? match[1] : null;
    }

    setupPassiveObserver() {
        // Use minimal, throttled observation
        const observer = new MutationObserver(this.throttle(() => {
            this.checkForNewContent();
        }, this.throttleDelay));

        // Only observe specific areas, not the entire page
        const feedArea = document.querySelector('[role="main"]');
        if (feedArea) {
            observer.observe(feedArea, {
                childList: true,
                subtree: false // Minimal observation
            });
            this.observers.push(observer);
        }
    }

    checkForNewContent() {
        try {
            // Passively check for new posts without aggressive DOM manipulation
            const posts = document.querySelectorAll(this.selectors.posts);

            if (posts.length > 0) {
                const latestPost = posts[posts.length - 1];
                const content = this.extractContentPassively(latestPost);

                if (content && content !== this.lastPostContent) {
                    this.lastPostContent = content;
                    this.notifyExtension('NEW_POST', { content, groupId: this.currentGroupId });
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
            const contentEl = postElement.querySelector(this.selectors.postContent);
            return contentEl ? contentEl.textContent.trim() : '';
        } catch (error) {
            return '';
        }
    }

    setupMessageHandler() {
        // Minimal message handling
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                switch (message.type) {
                    case 'GET_GROUP_ID':
                        sendResponse({ groupId: this.currentGroupId });
                        break;
                    case 'GET_LAST_POST':
                        sendResponse({ content: this.lastPostContent });
                        break;
                    case 'PING':
                        sendResponse({ active: this.isActive });
                        break;
                    default:
                        sendResponse({ error: 'Unknown message type' });
                }
            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
    }

    notifyExtension(type, data) {
        try {
            chrome.runtime.sendMessage({ type, data, source: 'stealth_content' });
        } catch (error) {
            // Silently handle messaging errors
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
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.isActive = false;
    }
}

// Initialize with minimal footprint
let stealthIntegration = null;

// Add global markers for testing
window.adReplyLoaded = true;
console.log('AdReply: Content script loaded');

// Function to initialize safely
function initializeSafely() {
    try {
        if (window.location.pathname.includes('/groups/')) {
            console.log('AdReply: Initializing on group page');
            stealthIntegration = new StealthFacebookIntegration();
            stealthIntegration.initialize();
            window.adReplyActive = true;
            window.stealthIntegration = stealthIntegration; // Make globally accessible for testing
        } else {
            console.log('AdReply: Not on group page, skipping initialization');
        }
    } catch (error) {
        console.error('AdReply: Initialization error:', error);
    }
}

// Try immediate initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSafely);
} else {
    initializeSafely();
}

// Also try delayed initialization as backup
setTimeout(initializeSafely, 2000);

// Use visibilitychange instead of beforeunload (Facebook blocks beforeunload)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && stealthIntegration) {
        // Page is being hidden, clean up
        stealthIntegration.cleanup();
    }
});

// Also clean up on page navigation (using pagehide which is more reliable)
window.addEventListener('pagehide', () => {
    if (stealthIntegration) {
        stealthIntegration.cleanup();
    }
});