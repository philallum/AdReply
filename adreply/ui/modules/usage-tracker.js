// Usage tracking and statistics
class UsageTrackerManager {
    constructor() {
        this.usageTracker = null;
        this.initializeUsageTracker();
    }

    initializeUsageTracker() {
        try {
            console.log('AdReply: Attempting to initialize usage tracker...');
            console.log('AdReply: UsageTracker available?', typeof UsageTracker !== 'undefined');
            
            if (typeof UsageTracker !== 'undefined') {
                this.usageTracker = new UsageTracker();
                console.log('AdReply: ✅ Usage tracker initialized successfully in sidebar');
            } else {
                console.warn('AdReply: ❌ UsageTracker class not available - check if usage-tracker.js is loaded');
            }
        } catch (error) {
            console.error('AdReply: ❌ Error initializing usage tracker:', error);
        }
    }

    async recordAdUsage(templateId, variantIndex, commentText, currentPost) {
        try {
            if (!this.usageTracker) {
                console.warn('AdReply: Usage tracker not initialized');
                return { success: false, error: 'Usage tracker not initialized' };
            }

            // Get current Facebook group ID
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('facebook.com')) {
                console.log('AdReply: Not on Facebook, skipping usage recording');
                return { success: false, error: 'Not on Facebook' };
            }

            // Extract group ID from URL
            let groupId = 'facebook.com';
            const groupMatch = tab.url.match(/\/groups\/([^\/\?]+)/);
            if (groupMatch) {
                groupId = `facebook.com/groups/${groupMatch[1]}`;
            } else {
                // Use page URL as fallback
                groupId = tab.url.split('?')[0];
            }

            // Get post content for context
            const postContent = currentPost?.content || '';

            // Record the usage
            await this.usageTracker.recordUsage(
                templateId,
                groupId,
                postContent,
                {
                    variantIndex: variantIndex,
                    commentText: commentText.substring(0, 100),
                    tabUrl: tab.url
                }
            );

            console.log('AdReply: Usage recorded:', {
                templateId,
                variantIndex,
                groupId,
                timestamp: new Date().toISOString()
            });



            return { success: true, groupId };

        } catch (error) {
            console.error('AdReply: Error recording ad usage:', error);
            throw error;
        }
    }





    async checkDailyUsageLimit(isProLicense = false) {
        try {
            if (isProLicense) {
                return { canUse: true, remaining: 'unlimited' };
            }

            if (!this.usageTracker) {
                console.warn('AdReply: Usage tracker not initialized');
                return { canUse: true, remaining: 3 }; // Default to allowing usage if tracker fails
            }

            // Get usage from last 24 hours
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            // Get all usage records from storage
            const result = await chrome.storage.local.get(['usageHistory']);
            const usageHistory = result.usageHistory || [];
            
            // Count usage in last 24 hours
            const recentUsage = usageHistory.filter(record => {
                const recordTime = new Date(record.timestamp);
                return recordTime >= yesterday;
            });

            const usageCount = recentUsage.length;
            const maxUsage = 3; // Free users get 3 uses per 24 hours
            const remaining = Math.max(0, maxUsage - usageCount);
            
            return {
                canUse: usageCount < maxUsage,
                remaining: remaining,
                usedToday: usageCount,
                maxUsage: maxUsage,
                resetTime: recentUsage.length > 0 ? 
                    new Date(Math.min(...recentUsage.map(r => new Date(r.timestamp).getTime())) + 24 * 60 * 60 * 1000) : 
                    null
            };

        } catch (error) {
            console.error('AdReply: Error checking daily usage limit:', error);
            return { canUse: true, remaining: 3 }; // Default to allowing usage if check fails
        }
    }

    getUsageTracker() {
        return this.usageTracker;
    }
}

export default UsageTrackerManager;