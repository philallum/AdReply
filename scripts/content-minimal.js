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
        this.currentUser = null;
        this.userProfileCache = null;
        this.usageTracker = null;
        
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
        
        // Content script is now ready for manual analysis requests
        console.log('AdReply: Ready for manual post analysis');

        // Initialize usage tracker
        this.initializeUsageTracker();

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
        console.log('AdReply: Checking posts, found:', posts.length, 'elements');

        if (posts.length > 0) {
            // Get the most recent post that we haven't processed
            for (let i = posts.length - 1; i >= 0; i--) {
                const post = posts[i];
                if (!post.dataset.adreplyChecked) {
                    post.dataset.adreplyChecked = 'true';
                    
                    const content = this.extractContentPassively(post);
                    console.log('AdReply: Extracted content from post:', content ? content.substring(0, 50) + '...' : 'none');
                    
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
        } else {
            console.log('AdReply: No posts found with selectors:', this.selectors.posts);
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

        console.log('AdReply: Checking for overlays...');
        let totalOverlays = 0;

        for (const containerSelector of overlayContainers) {
            const containers = document.querySelectorAll(containerSelector);
            totalOverlays += containers.length;
            if (containers.length > 0) {
                console.log('AdReply: Found', containers.length, 'containers for selector:', containerSelector);
            }
            
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
                    const cleanText = this.cleanExtractedText(text);
                    if (cleanText && cleanText.length > 0) {
                        return cleanText;
                    }
                }
            }
            return '';
        } catch (error) {
            return '';
        }
    }

    cleanExtractedText(text) {
        if (!text) return '';
        
        const trimmed = text.trim();
        
        // Filter out Facebook's technical data
        if (trimmed.startsWith('{"require":[') || 
            trimmed.startsWith('{"__bbox"') ||
            trimmed.startsWith('{"__ar":') ||
            trimmed.includes('qplTagServerJS') ||
            trimmed.includes('makehaste_min_rc') ||
            trimmed.includes('comet_preloader') ||
            trimmed.length < 10 ||
            trimmed.length > 2000) {
            return '';
        }
        
        // Filter out common Facebook UI elements
        const uiElements = [
            'Like', 'Comment', 'Share', 'React', 'Reply',
            'See more', 'See less', 'Show more', 'Show less',
            'Translate', 'Edit', 'Delete', 'Report',
            'minutes ago', 'hours ago', 'days ago', 'weeks ago',
            'Just now', 'Yesterday', 'Sponsored'
        ];
        
        // If text is only UI elements, skip it
        if (uiElements.some(element => trimmed === element)) {
            return '';
        }
        
        // Return clean text if it looks like actual content
        return trimmed;
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
                    case 'DEBUG_COMMENTS':
                        this.debugCommentDetection().then(debugInfo => {
                            sendResponse({ success: true, debugInfo });
                        }).catch(error => {
                            sendResponse({ success: false, error: error.message });
                        });
                        return true; // Keep message channel open for async response
                        break;
                    case 'FORCE_CHECK':
                        this.checkForNewContent();
                        this.checkForOverlays();
                        sendResponse({ success: true, message: 'Force check completed' });
                        break;

                    case 'ANALYZE_CURRENT_POST':
                        console.log('AdReply: Manual post analysis requested');
                        this.analyzeCurrentPost().then(analysisResult => {
                            sendResponse(analysisResult);
                        }).catch(error => {
                            sendResponse({
                                success: false,
                                error: 'Analysis failed: ' + error.message
                            });
                        });
                        return true; // Keep message channel open for async response
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

    async debugCommentDetection() {
        console.log('AdReply: Running comment detection debug...');
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            userProfile: null,
            posts: [],
            comments: [],
            errors: []
        };

        try {
            // Get user profile
            debugInfo.userProfile = await this.getCurrentUser();
            
            // Find all posts on page
            const postSelectors = ['[role="article"]', '[data-testid="post"]'];
            for (const selector of postSelectors) {
                const posts = document.querySelectorAll(selector);
                debugInfo.posts.push({
                    selector,
                    count: posts.length,
                    elements: Array.from(posts).map(post => ({
                        hasContent: !!this.extractContentPassively(post),
                        contentPreview: this.extractContentPassively(post)?.substring(0, 50) + '...'
                    }))
                });
            }

            // Check comments on first post if available
            const firstPost = document.querySelector('[role="article"]');
            if (firstPost) {
                const commentCheck = await this.checkForUserComments(firstPost);
                debugInfo.comments = {
                    hasUserComments: commentCheck.hasUserComments,
                    commentCount: commentCheck.commentCount,
                    userCommentTexts: commentCheck.userCommentTexts,
                    skipReason: commentCheck.skipReason
                };
            }

        } catch (error) {
            debugInfo.errors.push(error.message);
        }

        console.log('AdReply: Comment detection debug info:', debugInfo);
        return debugInfo;
    }

    initializeUsageTracker() {
        // Usage tracker will be handled by the sidebar
        console.log('AdReply: Usage tracking will be handled by sidebar');
    }

    async getCurrentUser() {
        // Return cached user if available and recent (within 5 minutes)
        if (this.userProfileCache && 
            Date.now() - this.userProfileCache.timestamp < 300000) {
            return this.userProfileCache;
        }

        console.log('AdReply: Detecting current Facebook user...');

        // Facebook user profile selectors (priority order)
        const userSelectors = [
            // Account switcher (most reliable)
            '[data-testid="nav_account_switcher"] [role="button"]',
            '[aria-label*="Your profile"] img',
            
            // Profile links in navigation
            'a[href*="/me/"]',
            '[data-testid="blue_bar_profile_link"]',
            
            // Account name in navigation
            'div[data-testid="nav_account_switcher"] span',
            '[aria-label*="Account"] span',
            
            // Profile image in top bar
            '[data-testid="nav_account_switcher"] img',
            'img[alt*="profile"]',
            
            // Fallback selectors
            '[role="banner"] a[href*="facebook.com/profile"]',
            '[role="banner"] a[href*="facebook.com/me"]'
        ];

        let userProfile = {
            name: null,
            profileUrl: null,
            profileId: null,
            avatarUrl: null,
            cached: true,
            timestamp: Date.now()
        };

        try {
            for (const selector of userSelectors) {
                const elements = document.querySelectorAll(selector);
                
                for (const element of elements) {
                    // Extract name from various sources
                    if (!userProfile.name) {
                        userProfile.name = element.getAttribute('aria-label') ||
                                         element.textContent?.trim() ||
                                         element.getAttribute('alt') ||
                                         element.getAttribute('title');
                        
                        // Clean up common Facebook UI text
                        if (userProfile.name) {
                            userProfile.name = userProfile.name
                                .replace(/Your profile|Account|Profile|Menu/gi, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                            
                            // Skip if it's just generic text
                            if (userProfile.name.length < 2 || 
                                ['Menu', 'Profile', 'Account'].includes(userProfile.name)) {
                                userProfile.name = null;
                            }
                        }
                    }

                    // Extract profile URL
                    if (!userProfile.profileUrl && element.href) {
                        if (element.href.includes('/me/') || 
                            element.href.includes('/profile/') ||
                            element.href.includes('facebook.com/')) {
                            userProfile.profileUrl = element.href;
                            
                            // Extract profile ID from URL
                            const profileMatch = element.href.match(/\/profile\/(\d+)/);
                            const userMatch = element.href.match(/facebook\.com\/([^\/\?]+)/);
                            
                            if (profileMatch) {
                                userProfile.profileId = profileMatch[1];
                            } else if (userMatch && !userMatch[1].includes('me')) {
                                userProfile.profileId = userMatch[1];
                            }
                        }
                    }

                    // Extract avatar URL
                    if (!userProfile.avatarUrl && element.tagName === 'IMG' && element.src) {
                        userProfile.avatarUrl = element.src;
                    }

                    // If we have enough info, break
                    if (userProfile.name && (userProfile.profileUrl || userProfile.profileId)) {
                        break;
                    }
                }

                if (userProfile.name && (userProfile.profileUrl || userProfile.profileId)) {
                    break;
                }
            }

            // Additional extraction from page metadata
            if (!userProfile.name || !userProfile.profileId) {
                // Try to get user info from page scripts or meta tags
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const content = script.textContent || '';
                    
                    // Look for user data in Facebook's page data
                    const userMatch = content.match(/"USER_ID":"(\d+)"/);
                    const nameMatch = content.match(/"name":"([^"]+)"/);
                    
                    if (userMatch && !userProfile.profileId) {
                        userProfile.profileId = userMatch[1];
                    }
                    
                    if (nameMatch && !userProfile.name) {
                        userProfile.name = nameMatch[1];
                    }
                    
                    if (userProfile.name && userProfile.profileId) break;
                }
            }

            // Cache the result
            this.userProfileCache = userProfile;
            this.currentUser = userProfile;

            console.log('AdReply: User profile detected:', {
                name: userProfile.name,
                hasProfileUrl: !!userProfile.profileUrl,
                hasProfileId: !!userProfile.profileId,
                hasAvatar: !!userProfile.avatarUrl
            });

            return userProfile;

        } catch (error) {
            console.warn('AdReply: Error detecting user profile:', error);
            
            // Return cached profile if available
            if (this.userProfileCache) {
                return this.userProfileCache;
            }
            
            // Return empty profile
            return {
                name: null,
                profileUrl: null,
                profileId: null,
                avatarUrl: null,
                cached: false,
                timestamp: Date.now()
            };
        }
    }

    async checkForUserComments(postElement) {
        console.log('AdReply: Checking for existing user comments...');
        
        try {
            // Get current user profile
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser.name && !currentUser.profileId) {
                console.log('AdReply: Cannot check comments - user profile not detected');
                return {
                    hasUserComments: false,
                    commentCount: 0,
                    userCommentTexts: [],
                    skipReason: 'User profile not detected'
                };
            }

            // Facebook comment selectors for different contexts
            const commentSelectors = [
                // Regular post comments
                '[role="article"] [data-testid="comment"]',
                '[role="article"] .UFIComment',
                '[role="article"] [aria-label*="Comment"]',
                
                // Overlay/modal comments  
                '[role="dialog"] [data-testid="comment"]',
                '[role="dialog"] .UFIComment',
                '[role="dialog"] [aria-label*="Comment"]',
                
                // Alternative comment structures
                '[data-testid="UFI2Comment/root"]',
                '.UFIComment',
                '[role="article"] div[dir="auto"]'
            ];

            let allComments = [];
            
            // Find the post container (could be the element itself or a parent)
            let searchContainer = postElement;
            
            // If we're in an overlay, search within the overlay
            const overlay = document.querySelector('[role="dialog"], .uiLayer');
            if (overlay && overlay.contains(postElement)) {
                searchContainer = overlay;
            }

            // Collect all comments from different selectors
            for (const selector of commentSelectors) {
                const comments = searchContainer.querySelectorAll(selector);
                allComments.push(...Array.from(comments));
            }

            // Remove duplicates
            allComments = [...new Set(allComments)];
            
            console.log(`AdReply: Found ${allComments.length} total comments to check`);

            let userComments = [];
            let userCommentTexts = [];

            for (const comment of allComments) {
                try {
                    // Look for comment author information
                    const authorSelectors = [
                        'a[role="link"][href*="/profile/"]',
                        'a[role="link"][href*="/user/"]',
                        'a[href*="facebook.com/profile"]',
                        'a[href*="facebook.com/"]',
                        'strong a',
                        'h3 a',
                        '[data-testid="comment_author_name"]'
                    ];

                    let isUserComment = false;
                    let commentAuthor = null;

                    for (const authorSelector of authorSelectors) {
                        const authorElements = comment.querySelectorAll(authorSelector);
                        
                        for (const authorElement of authorElements) {
                            const authorName = authorElement.textContent?.trim();
                            const authorHref = authorElement.href;

                            // Check if this matches the current user
                            if (authorName && currentUser.name) {
                                // Normalize names for comparison
                                const normalizedAuthor = authorName.toLowerCase().trim();
                                const normalizedUser = currentUser.name.toLowerCase().trim();
                                
                                if (normalizedAuthor === normalizedUser) {
                                    isUserComment = true;
                                    commentAuthor = authorName;
                                    break;
                                }
                            }

                            // Check profile URL/ID match
                            if (authorHref && currentUser.profileId) {
                                if (authorHref.includes(currentUser.profileId) ||
                                    (currentUser.profileUrl && authorHref === currentUser.profileUrl)) {
                                    isUserComment = true;
                                    commentAuthor = authorName || 'You';
                                    break;
                                }
                            }
                        }

                        if (isUserComment) break;
                    }

                    if (isUserComment) {
                        userComments.push(comment);
                        
                        // Extract comment text for debugging
                        const commentText = comment.textContent?.trim() || '';
                        if (commentText.length > 0 && commentText.length < 500) {
                            userCommentTexts.push(commentText.substring(0, 100) + '...');
                        }
                        
                        console.log('AdReply: Found user comment by:', commentAuthor);
                    }
                } catch (commentError) {
                    console.debug('AdReply: Error checking individual comment:', commentError);
                }
            }

            const result = {
                hasUserComments: userComments.length > 0,
                commentCount: userComments.length,
                userCommentTexts: userCommentTexts,
                skipReason: userComments.length > 0 ? 
                    `You have already commented on this post (${userComments.length} comment${userComments.length > 1 ? 's' : ''})` : 
                    null
            };

            console.log('AdReply: Comment check result:', {
                hasUserComments: result.hasUserComments,
                commentCount: result.commentCount,
                userProfile: currentUser.name || currentUser.profileId
            });

            return result;

        } catch (error) {
            console.warn('AdReply: Error checking for user comments:', error);
            
            // Conservative approach: if we can't check, allow analysis to proceed
            return {
                hasUserComments: false,
                commentCount: 0,
                userCommentTexts: [],
                skipReason: 'Comment detection failed'
            };
        }
    }

    simulateRealisticTyping(commentBox, text) {
        return new Promise((resolve) => {
            let currentIndex = 0;
            const paragraph = commentBox.querySelector('p');
            
            const typeNextCharacter = () => {
                if (currentIndex >= text.length) {
                    resolve();
                    return;
                }
                
                const char = text[currentIndex];
                const currentText = text.substring(0, currentIndex + 1);
                
                // Update the paragraph content
                if (paragraph) {
                    paragraph.textContent = currentText;
                }
                
                // Create realistic keyboard events
                const keydownEvent = new KeyboardEvent('keydown', {
                    key: char,
                    char: char,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                    bubbles: true,
                    cancelable: true
                });
                
                const keypressEvent = new KeyboardEvent('keypress', {
                    key: char,
                    char: char,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                    bubbles: true,
                    cancelable: true
                });
                
                const inputEvent = new InputEvent('input', {
                    inputType: 'insertText',
                    data: char,
                    bubbles: true,
                    cancelable: true
                });
                
                const keyupEvent = new KeyboardEvent('keyup', {
                    key: char,
                    char: char,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                    bubbles: true,
                    cancelable: true
                });
                
                // Dispatch events in order
                commentBox.dispatchEvent(keydownEvent);
                commentBox.dispatchEvent(keypressEvent);
                commentBox.dispatchEvent(inputEvent);
                commentBox.dispatchEvent(keyupEvent);
                
                currentIndex++;
                
                // Continue with next character after a small delay
                setTimeout(typeNextCharacter, 50); // 50ms delay between characters
            };
            
            typeNextCharacter();
        });
    }

    async analyzeCurrentPost() {
        console.log('AdReply: Analyzing current post...');
        
        // Clear previous content to force fresh analysis
        this.lastPostContent = '';
        
        // Reset all checked flags to allow re-scanning
        document.querySelectorAll('[data-adreply-checked]').forEach(el => {
            delete el.dataset.adreplyChecked;
        });
        document.querySelectorAll('[data-adreply-overlay-checked]').forEach(el => {
            delete el.dataset.adreplyOverlayChecked;
        });
        document.querySelectorAll('[data-adreply-overlay-container]').forEach(el => {
            delete el.dataset.adreplyOverlayContainer;
        });
        
        try {
            // Try multiple methods to find post content and the post element
            let content = null;
            let postElement = null;
            let groupId = this.currentGroupId;
            
            // Method 1: Look for posts in overlays/modals first
            const overlaySelectors = [
                '[role="dialog"] [role="article"]',
                '[aria-modal="true"] [role="article"]',
                '.uiLayer [role="article"]'
            ];
            
            for (const selector of overlaySelectors) {
                const overlayPosts = document.querySelectorAll(selector);
                if (overlayPosts.length > 0) {
                    postElement = overlayPosts[0];
                    content = this.extractContentPassively(postElement);
                    if (content && content.length > 20) {
                        console.log('AdReply: Found content in overlay:', content.substring(0, 50) + '...');
                        break;
                    }
                }
            }
            
            // Method 2: Look for regular posts on the page
            if (!content) {
                const posts = document.querySelectorAll('[role="article"]');
                for (const post of posts) {
                    const postContent = this.extractContentPassively(post);
                    if (postContent && postContent.length > 20) {
                        postElement = post;
                        content = postContent;
                        console.log('AdReply: Found content in regular post:', content.substring(0, 50) + '...');
                        break;
                    }
                }
            }
            
            // Method 3: Extract meaningful text from visible elements
            if (!content) {
                // Look for specific text-containing elements that are likely to be posts
                const textSelectors = [
                    '[data-testid="post_message"]',
                    '.userContent',
                    '[data-ad-preview="message"]',
                    '.text_exposed_root',
                    'div[dir="auto"]',
                    'span[dir="auto"]'
                ];
                
                for (const selector of textSelectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = this.cleanExtractedText(element.textContent || element.innerText || '');
                        if (text && text.length > 20 && text.length < 1000) {
                            // Find the closest article element
                            postElement = element.closest('[role="article"]') || element;
                            content = text;
                            console.log('AdReply: Found content from text selector:', content.substring(0, 50) + '...');
                            break;
                        }
                    }
                    if (content) break;
                }
                
                // Final fallback: look for any meaningful text blocks
                if (!content) {
                    const allText = document.body.textContent || '';
                    const lines = allText.split('\n')
                        .map(line => this.cleanExtractedText(line))
                        .filter(line => line && line.length > 30 && line.length < 500)
                        .slice(0, 5);
                    
                    if (lines.length > 0) {
                        content = lines.reduce((longest, current) => 
                            current.length > longest.length ? current : longest
                        );
                        postElement = document.body; // Fallback container
                        console.log('AdReply: Found content from page text:', content.substring(0, 50) + '...');
                    }
                }
            }
            
            if (content && postElement) {
                // NEW: Check for existing user comments before proceeding
                console.log('AdReply: Checking for existing user comments...');
                const commentCheck = await this.checkForUserComments(postElement);
                
                if (commentCheck.hasUserComments) {
                    console.log('AdReply: Skipping analysis - user has already commented');
                    return {
                        success: true,
                        skipped: true,
                        skipReason: commentCheck.skipReason,
                        userComments: commentCheck.userCommentTexts,
                        content: content,
                        groupId: groupId || 'manual',
                        method: 'manual_analysis_skipped'
                    };
                }
                
                // Proceed with normal analysis if no user comments found
                console.log('AdReply: No user comments found, proceeding with analysis');
                return {
                    success: true,
                    content: content,
                    groupId: groupId || 'manual',
                    method: 'manual_analysis'
                };
            } else {
                return {
                    success: false,
                    error: 'No post content found on current page'
                };
            }
            
        } catch (error) {
            console.error('AdReply: Error analyzing post:', error);
            return {
                success: false,
                error: 'Analysis failed: ' + error.message
            };
        }
    }

    insertCommentIntoFacebook(commentText) {
        try {
            // Facebook comment box selectors (prioritizing overlay/modal comment boxes)
            const commentSelectors = [
                // Overlay/Modal comment boxes (highest priority)
                '[role="dialog"] [aria-label*="Write a public comment"] [contenteditable="true"]',
                '[role="dialog"] .notranslate[contenteditable="true"][role="textbox"]',
                '[role="dialog"] [data-lexical-editor="true"]',
                
                // General overlay comment boxes
                '.uiLayer [aria-label*="comment" i] [contenteditable="true"]',
                '.uiLayer .notranslate[contenteditable="true"]',
                
                // Standard page comment boxes
                '[data-testid="comment-composer"] [contenteditable="true"]',
                '[aria-label*="Write a public comment"] [contenteditable="true"]',
                '[aria-label*="comment" i] [contenteditable="true"]',
                '.notranslate[contenteditable="true"][role="textbox"]',
                '[data-lexical-editor="true"]',
                'div[contenteditable="true"][data-text="Write a comment..."]',
                '[role="textbox"][contenteditable="true"]'
            ];

            let commentBox = null;
            
            // Try to find comment box, prioritizing visible ones in overlays
            for (const selector of commentSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    // Check if element is visible and not disabled
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && 
                                    element.offsetParent !== null && 
                                    !element.disabled &&
                                    getComputedStyle(element).visibility !== 'hidden';
                    
                    if (isVisible) {
                        commentBox = element;
                        console.log('AdReply: Found comment box with selector:', selector);
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
            commentBox.click();
            
            console.log('AdReply: Comment box found, attempting insertion...');
            console.log('AdReply: Comment box type:', commentBox.tagName, 'has lexical:', commentBox.hasAttribute('data-lexical-editor'));
            
            // Handle Facebook's Lexical editor with realistic typing simulation
            if (commentBox.hasAttribute('data-lexical-editor')) {
                console.log('AdReply: Using realistic typing simulation for Lexical editor');
                
                commentBox.focus();
                commentBox.click();
                
                // Clear existing content
                const paragraph = commentBox.querySelector('p');
                if (paragraph) {
                    paragraph.innerHTML = '<br>';
                }
                
                // Use a more realistic typing approach
                this.simulateRealisticTyping(commentBox, commentText);
                
            } else if (commentBox.tagName.toLowerCase() === 'textarea') {
                // For textarea elements
                commentBox.value = commentText;
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.log('AdReply: Using contenteditable method');
                
                // For regular contenteditable divs
                commentBox.textContent = commentText;
                
                // Trigger input events
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.dispatchEvent(new Event('keyup', { bubbles: true }));
                commentBox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Method 2: Try Selection API approach
            setTimeout(() => {
                const currentContent = commentBox.textContent || commentBox.value || '';
                if (!currentContent.includes(commentText)) {
                    console.log('AdReply: Trying Selection API approach...');
                    
                    try {
                        commentBox.focus();
                        
                        // Use Selection API to insert text
                        const selection = window.getSelection();
                        const range = document.createRange();
                        
                        if (commentBox.hasAttribute('data-lexical-editor')) {
                            const paragraph = commentBox.querySelector('p');
                            if (paragraph) {
                                // Clear paragraph
                                paragraph.innerHTML = '';
                                
                                // Create text node
                                const textNode = document.createTextNode(commentText);
                                paragraph.appendChild(textNode);
                                
                                // Set selection
                                range.setStart(textNode, 0);
                                range.setEnd(textNode, commentText.length);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                
                                // Trigger events
                                const inputEvent = new InputEvent('input', {
                                    inputType: 'insertText',
                                    data: commentText,
                                    bubbles: true
                                });
                                commentBox.dispatchEvent(inputEvent);
                                
                                console.log('AdReply: Selection API method completed');
                            }
                        }
                    } catch (selectionError) {
                        console.log('AdReply: Selection API failed:', selectionError.message);
                        
                        // Final fallback: Just copy to clipboard for manual paste
                        navigator.clipboard.writeText(commentText).then(() => {
                            console.log('AdReply: Text copied to clipboard as final fallback');
                        }).catch(() => {
                            console.log('AdReply: All methods failed');
                        });
                    }
                }
            }, 1000); // Longer delay to let typing simulation complete

            // Set cursor to end
            setTimeout(() => {
                try {
                    const range = document.createRange();
                    const selection = window.getSelection();
                    
                    if (commentBox.hasAttribute('data-lexical-editor')) {
                        const paragraph = commentBox.querySelector('p');
                        if (paragraph && paragraph.firstChild) {
                            range.setStart(paragraph.firstChild, paragraph.textContent.length);
                            range.setEnd(paragraph.firstChild, paragraph.textContent.length);
                        }
                    } else {
                        range.selectNodeContents(commentBox);
                        range.collapse(false);
                    }
                    
                    selection.removeAllRanges();
                    selection.addRange(range);
                    commentBox.focus();
                } catch (rangeError) {
                    console.log('AdReply: Could not set cursor position:', rangeError.message);
                }
            }, 100);

            // Verify insertion worked
            setTimeout(() => {
                const finalContent = commentBox.textContent || commentBox.value || '';
                if (finalContent.includes(commentText)) {
                    console.log('AdReply: Comment insertion verified successful');
                } else {
                    console.log('AdReply: Comment insertion may have failed, trying direct DOM manipulation...');
                    
                    // Last resort: direct DOM manipulation
                    if (commentBox.hasAttribute('data-lexical-editor')) {
                        const paragraph = commentBox.querySelector('p');
                        if (paragraph) {
                            paragraph.innerHTML = commentText;
                            paragraph.setAttribute('dir', 'auto');
                        }
                    } else {
                        commentBox.innerHTML = commentText;
                    }
                    
                    // Trigger final events
                    commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                    commentBox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, 500);
            
            console.log('AdReply: Comment insertion attempted:', commentText.substring(0, 50) + '...');
            
            return { 
                success: true, 
                message: 'Comment insertion attempted' 
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