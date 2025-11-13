// Post analysis and suggestion generation
class PostAnalyzer {
    constructor(connectionManager, templateManager, usageTracker, keywordLearningEngine = null) {
        this.connectionManager = connectionManager;
        this.templateManager = templateManager;
        this.usageTracker = usageTracker;
        this.keywordLearningEngine = keywordLearningEngine;
        this.currentPost = null;
        this.currentMatches = []; // Store current matches for learning
        this.ignoreTimers = new Map(); // Track ignore timers for suggestions
    }

    async generateSuggestions(postContent, isProLicense = false) {
        console.log('AdReply: Generating suggestions for post:', postContent.substring(0, 50) + '...');
        
        // Check daily usage limit for free users
        if (!isProLicense) {
            try {
                // Import the usage tracker manager to check limits
                const usageResult = await chrome.storage.local.get(['usageHistory']);
                const usageHistory = usageResult.usageHistory || [];
                
                // Count usage in last 24 hours
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const recentUsage = usageHistory.filter(record => {
                    const recordTime = new Date(record.timestamp);
                    return recordTime >= yesterday;
                });
                
                if (recentUsage.length >= 3) {
                    // User has exceeded daily limit
                    const oldestUsage = Math.min(...recentUsage.map(r => new Date(r.timestamp).getTime()));
                    const resetTime = new Date(oldestUsage + 24 * 60 * 60 * 1000);
                    const hoursUntilReset = Math.ceil((resetTime - now) / (1000 * 60 * 60));
                    
                    return [{
                        text: `⏰ Daily limit reached (3/3 suggestions used). Upgrade to Pro for unlimited suggestions or wait ${hoursUntilReset} hours for reset.`,
                        templateId: 'limit_reached',
                        templateLabel: 'Usage Limit',
                        isLimitMessage: true
                    }];
                }
            } catch (error) {
                console.error('AdReply: Error checking usage limit:', error);
            }
        }
        
        const suggestions = [];

        // Get default promo URL from settings
        let defaultPromoUrl = '';
        try {
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            defaultPromoUrl = result.defaultPromoUrl || '';
        } catch (error) {
            console.warn('AdReply: Could not get default promo URL:', error);
        }
        
        // Match templates based on keywords
        const matchedTemplates = await this.matchTemplatesWithPost(postContent);
        console.log('AdReply: Matched templates:', matchedTemplates.length);
        
        // Store matches for learning engine
        this.currentMatches = matchedTemplates;
        
        // Record matches with keyword learning engine
        if (this.keywordLearningEngine && matchedTemplates.length > 0) {
            try {
                // Extract all keywords from matched templates
                const allKeywords = matchedTemplates.flatMap(match => 
                    (match.template.keywords || []).filter(k => !k.startsWith('-'))
                );
                await this.keywordLearningEngine.recordMatch(postContent, matchedTemplates, allKeywords);
            } catch (error) {
                console.error('AdReply: Error recording matches with learning engine:', error);
            }
        }
        
        if (matchedTemplates.length > 0) {
            // Use matched templates
            for (const match of matchedTemplates) { // All matches - 24h usage tracking provides natural rotation
                const template = match.template;
                const variant = match.variant;
                
                // Format the suggestion with URL replacement
                let suggestion = variant || template.template;

                // Get the URL to use (template URL takes priority over default)
                const urlToUse = template.url || defaultPromoUrl;
                
                console.log('AdReply: Processing template:', template.label);
                console.log('AdReply: Template URL:', template.url);
                console.log('AdReply: Default URL:', defaultPromoUrl);
                console.log('AdReply: URL to use:', urlToUse);
                console.log('AdReply: Original suggestion:', suggestion);

                // Replace {url} placeholder with the URL
                if (suggestion.includes('{url}')) {
                    suggestion = suggestion.replace(/{url}/g, urlToUse);
                    console.log('AdReply: After {url} replacement:', suggestion);
                }
                
                // Replace {site} placeholder for backward compatibility
                if (suggestion.includes('{site}')) {
                    suggestion = suggestion.replace(/{site}/g, urlToUse || 'our website');
                    console.log('AdReply: After {site} replacement:', suggestion);
                }
                
                // If no placeholder was found but we have a URL, append it
                if (!suggestion.includes('{url}') && !suggestion.includes('{site}') && urlToUse) {
                    // Check if the suggestion already ends with a URL
                    const urlPattern = /https?:\/\/[^\s]+$/;
                    if (!urlPattern.test(suggestion.trim())) {
                        suggestion = suggestion.trim() + ' ' + urlToUse;
                        console.log('AdReply: After URL append:', suggestion);
                    }
                }
                
                console.log('AdReply: Final suggestion:', suggestion);
                
                suggestions.push({
                    text: suggestion,
                    templateId: template.id,
                    templateLabel: template.label,
                    variantIndex: match.variantIndex || 0
                });
            }
        } else {
            console.log('AdReply: No template matches, using fallback suggestions');
            suggestions.push(...await this.generateFallbackSuggestions(postContent));
        }
        
        return suggestions;
    }

    async generateFallbackSuggestions(postContent) {
        const suggestions = [];
        
        try {
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            const defaultUrl = result.defaultPromoUrl || '';
            
            if (postContent.toLowerCase().includes('car') || postContent.toLowerCase().includes('auto')) {
                suggestions.push({
                    text: `Great car! For automotive services, check us out!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Auto Fallback'
                });
            }
            
            if (postContent.toLowerCase().includes('fitness') || postContent.toLowerCase().includes('gym')) {
                suggestions.push({
                    text: `Looking strong! Need a personal trainer? We can help!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Fitness Fallback'
                });
            }
            
            if (postContent.toLowerCase().includes('food') || postContent.toLowerCase().includes('restaurant')) {
                suggestions.push({
                    text: `Looks delicious! For catering services, contact us!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Food Fallback'
                });
            }
            
            // Default suggestion - always provide at least one
            if (suggestions.length === 0) {
                suggestions.push({
                    text: `Great post! Check out our services if you need help with this!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Default Fallback'
                });
            }
            
            console.log('AdReply: Generated fallback suggestions:', suggestions.length);
        } catch (error) {
            console.error('AdReply: Error generating fallback suggestions:', error);
            // Provide a basic fallback with URL
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            const defaultUrl = result.defaultPromoUrl || '';
            suggestions.push({
                text: `Great post! Check out our services if you need help with this!${defaultUrl ? ' ' + defaultUrl : ''}`,
                templateId: 'fallback',
                templateLabel: 'Basic Fallback'
            });
        }
        
        return suggestions;
    }

    async matchTemplatesWithPost(postContent) {
        console.log('AdReply: Matching templates with post content:', postContent.substring(0, 100) + '...');
        
        const templates = this.templateManager.getTemplates();
        console.log('AdReply: Available templates:', templates.length);
        
        const matches = [];
        
        // Get user's preferred category
        let preferredCategory = null;
        try {
            const result = await chrome.storage.local.get(['settings']);
            preferredCategory = result.settings?.templates?.preferredCategory || null;
            console.log('AdReply: User preferred category:', preferredCategory);
        } catch (error) {
            console.warn('AdReply: Could not get preferred category:', error);
        }
        
        // Clean and split post content, removing punctuation for better matching
        const cleanedContent = postContent.toLowerCase().replace(/[^\w\s]/g, ' ');
        const postWords = cleanedContent.split(/\s+/).filter(word => word.length > 0);
        console.log('AdReply: Post words:', postWords.slice(0, 10)); // Show first 10 words
        console.log('AdReply: Original content:', postContent.substring(0, 100) + '...');
        console.log('AdReply: Cleaned content:', cleanedContent.substring(0, 100) + '...');
        
        // Get current group ID for usage filtering
        let currentGroupId = await this.getCurrentGroupId();
        
        // Get recent usage for this group
        let recentUsage = [];
        if (this.usageTracker) {
            try {
                recentUsage = await this.usageTracker.getGroupUsage(currentGroupId, 24);
            } catch (error) {
                console.warn('AdReply: Could not get usage history:', error);
            }
        }
        
        for (const template of templates) {
            let score = 0;
            
            console.log('AdReply: Checking template:', template.label, 'Keywords:', template.keywords);
            
            // Safety check for keywords
            if (!template.keywords || !Array.isArray(template.keywords)) {
                console.warn('AdReply: Template has invalid keywords:', template);
                continue;
            }
            
            // Calculate relevance score based on keyword matches
            let hasNegativeMatch = false;

            for (const keyword of template.keywords) {
                const keywordLower = keyword.toLowerCase().trim();
                if (!keywordLower) continue; // Skip empty keywords

                // Check if this is a negative keyword (starts with -)
                if (keywordLower.startsWith('-')) {
                    const negativeKeyword = keywordLower.substring(1); // Remove the - prefix
                    if (!negativeKeyword) continue; // Skip if empty after removing -

                    // Check if negative keyword is present in post
                    const exactNegativeMatch = postWords.includes(negativeKeyword);
                    const partialNegativeMatch = postWords.some(word => word.includes(negativeKeyword) && negativeKeyword.length > 2);

                    console.log(`AdReply: Testing negative keyword "${keyword}" (${negativeKeyword}) against post words:`, postWords);
                    console.log(`AdReply: Negative exact match for "${negativeKeyword}":`, exactNegativeMatch);
                    console.log(`AdReply: Negative partial match for "${negativeKeyword}":`, partialNegativeMatch);

                    if (exactNegativeMatch || partialNegativeMatch) {
                        hasNegativeMatch = true;
                        console.log('AdReply: ❌ Negative keyword match found:', keyword, '- template excluded');
                        break; // Exit early if negative keyword found
                    }
                } else {
                    // Regular positive keyword matching
                    const exactMatch = postWords.includes(keywordLower);
                    const partialMatch = postWords.some(word => word.includes(keywordLower) && keywordLower.length > 2);

                    console.log(`AdReply: Testing keyword "${keyword}" (${keywordLower}) against post words:`, postWords);
                    console.log(`AdReply: Exact match for "${keywordLower}":`, exactMatch);
                    console.log(`AdReply: Partial match for "${keywordLower}":`, partialMatch);

                    if (exactMatch || partialMatch) {
                        score += exactMatch ? 2 : 1; // Exact matches get higher score
                        console.log('AdReply: ✅ Keyword match found:', keyword, exactMatch ? '(exact)' : '(partial)', 'in post words');
                    } else {
                        console.log('AdReply: ❌ No match for keyword:', keyword);
                    }
                }
            }

            // If negative keyword matched, exclude this template completely
            if (hasNegativeMatch) {
                console.log('AdReply: Template excluded due to negative keyword match:', template.label);
                continue; // Skip this template entirely
            }

            // Add category priority bonus
            if (preferredCategory && template.category === preferredCategory) {
                score += 3; // Significant bonus for preferred category
                console.log('AdReply: Category bonus applied for:', template.label, 'Category:', template.category);
            }
            
            console.log('AdReply: Template score:', template.label, score);
            
            if (score > 0) {
                // Add main template and variants
                this.addTemplateMatches(template, score, recentUsage, matches);
            }
        }
        
        return this.sortAndFilterMatches(matches);
    }

    addTemplateMatches(template, score, recentUsage, matches) {
        // Add template (no variants system anymore - each template is individual)
        const isTemplateUsed = recentUsage.some(usage => 
            usage.templateId === template.id && usage.variantIndex === 0
        );
        
        matches.push({
            template,
            variant: template.template,
            variantIndex: 0,
            score,
            recentlyUsed: isTemplateUsed,
            lastUsed: isTemplateUsed ? recentUsage.find(u => u.templateId === template.id && u.variantIndex === 0)?.timestamp : null
        });
    }

    sortAndFilterMatches(matches) {
        // Separate unused and recently used
        const unusedMatches = matches.filter(m => !m.recentlyUsed);
        const recentlyUsedMatches = matches.filter(m => m.recentlyUsed);
        
        // Sort unused by score (highest first)
        unusedMatches.sort((a, b) => b.score - a.score);
        
        // Sort recently used by oldest first (for fallback)
        recentlyUsedMatches.sort((a, b) => {
            if (!a.lastUsed) return -1;
            if (!b.lastUsed) return 1;
            return new Date(a.lastUsed) - new Date(b.lastUsed);
        });
        
        // Return unused first, then recently used as fallback
        const allMatches = [...unusedMatches, ...recentlyUsedMatches];
        
        // Limit to top 3 suggestions
        const result = allMatches.slice(0, 3);
        
        console.log('AdReply: Template matching results:', {
            totalMatches: allMatches.length,
            unusedMatches: unusedMatches.length,
            recentlyUsedMatches: recentlyUsedMatches.length,
            returned: result.length
        });
        
        return result;
    }

    async getCurrentGroupId() {
        let currentGroupId = 'facebook.com';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.url.includes('facebook.com')) {
                const groupMatch = tab.url.match(/\/groups\/([^\/\?]+)/);
                if (groupMatch) {
                    currentGroupId = `facebook.com/groups/${groupMatch[1]}`;
                } else {
                    currentGroupId = tab.url.split('?')[0];
                }
            }
        } catch (error) {
            console.warn('AdReply: Could not get current group ID:', error);
        }
        return currentGroupId;
    }

    async analyzeCurrentPost() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('facebook.com')) {
                throw new Error('Please navigate to Facebook first');
            }
            
            // Ensure content script is injected
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['scripts/content-minimal.js']
                });
            } catch (injectError) {
                // Content script might already be injected, continue
            }
            
            // Clear previous posts from background
            await this.connectionManager.clearPosts();
            
            // Request post analysis
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_CURRENT_POST' });
            
            if (response && response.success) {
                if (response.skipped) {
                    return {
                        success: true,
                        skipped: true,
                        content: response.content,
                        groupId: response.groupId,
                        skipReason: response.skipReason,
                        userComments: response.userComments
                    };
                } else if (response.content) {
                    // Store the analyzed post
                    await this.connectionManager.storePost({
                        content: response.content,
                        groupId: response.groupId || 'manual',
                        timestamp: Date.now(),
                        source: 'manual_analysis'
                    });
                    
                    return {
                        success: true,
                        content: response.content,
                        groupId: response.groupId
                    };
                } else {
                    throw new Error('No post content found on current page');
                }
            } else {
                throw new Error(response?.error || 'No post content found on current page');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            throw error;
        }
    }

    setCurrentPost(postData) {
        this.currentPost = postData;
    }

    getCurrentPost() {
        return this.currentPost;
    }

    /**
     * Record template selection for keyword learning
     * @param {string} templateId - ID of selected template
     * @param {Object} template - Template object
     */
    async recordTemplateSelection(templateId, template) {
        if (!this.keywordLearningEngine || !template) {
            return;
        }

        try {
            const keywords = template.keywords || [];
            const categoryId = template.category || 'custom';
            
            await this.keywordLearningEngine.recordSelection(templateId, keywords, categoryId);
            
            // Clear any pending ignore timer for this template
            if (this.ignoreTimers.has(templateId)) {
                clearTimeout(this.ignoreTimers.get(templateId));
                this.ignoreTimers.delete(templateId);
            }
            
            console.log('AdReply: Recorded template selection for learning');
        } catch (error) {
            console.error('AdReply: Error recording template selection:', error);
        }
    }

    /**
     * Start ignore timer for a suggestion (10 seconds)
     * @param {string} templateId - ID of template being shown
     * @param {Object} template - Template object
     */
    startIgnoreTimer(templateId, template) {
        if (!this.keywordLearningEngine || !template) {
            return;
        }

        // Clear existing timer if any
        if (this.ignoreTimers.has(templateId)) {
            clearTimeout(this.ignoreTimers.get(templateId));
        }

        // Start 10-second timer
        const timer = setTimeout(async () => {
            try {
                const keywords = template.keywords || [];
                const categoryId = template.category || 'custom';
                
                await this.keywordLearningEngine.recordIgnore(templateId, keywords, categoryId);
                
                this.ignoreTimers.delete(templateId);
                console.log('AdReply: Recorded template ignore after 10 seconds');
            } catch (error) {
                console.error('AdReply: Error recording template ignore:', error);
            }
        }, 10000); // 10 seconds

        this.ignoreTimers.set(templateId, timer);
    }

    /**
     * Cancel ignore timer (called when user interacts with suggestion)
     * @param {string} templateId - ID of template
     */
    cancelIgnoreTimer(templateId) {
        if (this.ignoreTimers.has(templateId)) {
            clearTimeout(this.ignoreTimers.get(templateId));
            this.ignoreTimers.delete(templateId);
        }
    }

    /**
     * Clear all ignore timers
     */
    clearAllIgnoreTimers() {
        for (const timer of this.ignoreTimers.values()) {
            clearTimeout(timer);
        }
        this.ignoreTimers.clear();
    }

    /**
     * Set keyword learning engine
     * @param {KeywordLearningEngine} engine - Keyword learning engine instance
     */
    setKeywordLearningEngine(engine) {
        this.keywordLearningEngine = engine;
    }
}

export default PostAnalyzer;