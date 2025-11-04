// Post analysis and suggestion generation
class PostAnalyzer {
    constructor(connectionManager, templateManager, usageTracker) {
        this.connectionManager = connectionManager;
        this.templateManager = templateManager;
        this.usageTracker = usageTracker;
        this.currentPost = null;
    }

    async generateSuggestions(postContent) {
        console.log('AdReply: Generating suggestions for post:', postContent.substring(0, 50) + '...');
        const suggestions = [];
        
        // Match templates based on keywords
        const matchedTemplates = await this.matchTemplatesWithPost(postContent);
        console.log('AdReply: Matched templates:', matchedTemplates.length);
        
        if (matchedTemplates.length > 0) {
            // Use matched templates
            for (const match of matchedTemplates.slice(0, 3)) { // Top 3 matches
                const template = match.template;
                const variant = match.variant;
                
                // Format the suggestion with URL appended
                let suggestion = variant || template.template;
                
                // Replace placeholders (basic implementation)
                suggestion = suggestion.replace(/{site}/g, template.url || 'our website');
                
                // Append URL if it exists and isn't already in the text
                if (template.url && !suggestion.includes(template.url)) {
                    suggestion += ` ${template.url}`;
                }
                
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
            for (const keyword of template.keywords) {
                const keywordLower = keyword.toLowerCase().trim();
                if (!keywordLower) continue; // Skip empty keywords
                
                // Check for exact word matches and partial matches
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
            
            console.log('AdReply: Template score:', template.label, score);
            
            if (score > 0) {
                // Add main template and variants
                this.addTemplateMatches(template, score, recentUsage, matches);
            }
        }
        
        return this.sortAndFilterMatches(matches);
    }

    addTemplateMatches(template, score, recentUsage, matches) {
        // Add main template (variant index 0)
        const isMainUsed = recentUsage.some(usage => 
            usage.templateId === template.id && usage.variantIndex === 0
        );
        
        matches.push({
            template,
            variant: template.template,
            variantIndex: 0,
            score,
            recentlyUsed: isMainUsed,
            lastUsed: isMainUsed ? recentUsage.find(u => u.templateId === template.id && u.variantIndex === 0)?.timestamp : null
        });
        
        // Add variants (variant index 1+)
        template.variants.forEach((variant, index) => {
            const variantIndex = index + 1;
            const isVariantUsed = recentUsage.some(usage => 
                usage.templateId === template.id && usage.variantIndex === variantIndex
            );
            
            matches.push({
                template,
                variant,
                variantIndex,
                score,
                recentlyUsed: isVariantUsed,
                lastUsed: isVariantUsed ? recentUsage.find(u => u.templateId === template.id && u.variantIndex === variantIndex)?.timestamp : null
            });
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
        const result = [...unusedMatches, ...recentlyUsedMatches];
        
        console.log('AdReply: Template matching results:', {
            totalMatches: result.length,
            unusedMatches: unusedMatches.length,
            recentlyUsedMatches: recentlyUsedMatches.length
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
}

export default PostAnalyzer;