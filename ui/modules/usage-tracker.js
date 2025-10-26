// Usage tracking and statistics
class UsageTrackerManager {
    constructor() {
        this.usageTracker = null;
        this.initializeUsageTracker();
    }

    initializeUsageTracker() {
        try {
            if (typeof UsageTracker !== 'undefined') {
                this.usageTracker = new UsageTracker();
                console.log('AdReply: Usage tracker initialized in sidebar');
            } else {
                console.warn('AdReply: UsageTracker class not available');
            }
        } catch (error) {
            console.error('AdReply: Error initializing usage tracker:', error);
        }
    }

    async recordAdUsage(templateId, variantIndex, commentText, currentPost) {
        try {
            if (!this.usageTracker) {
                console.warn('AdReply: Usage tracker not initialized');
                return;
            }

            // Get current Facebook group ID
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('facebook.com')) {
                console.log('AdReply: Not on Facebook, skipping usage recording');
                return;
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
                variantIndex,
                groupId,
                postContent,
                {
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

    async getUsageStats(currentGroupId) {
        try {
            if (!this.usageTracker) {
                return null;
            }

            // Get usage data
            const usageData = await this.usageTracker.getUsageData();
            const groupSummary = await this.usageTracker.getGroupSummary(currentGroupId);
            
            return {
                usageData,
                groupSummary,
                currentGroupId
            };
        } catch (error) {
            console.error('AdReply: Error loading usage stats:', error);
            throw error;
        }
    }

    async exportUsageData() {
        try {
            if (!this.usageTracker) {
                throw new Error('Usage tracker not available');
            }

            const exportData = await this.usageTracker.exportUsageData();
            
            if (!exportData) {
                throw new Error('No usage data to export');
            }

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `adreply-usage-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true };
            
        } catch (error) {
            console.error('AdReply: Error exporting usage data:', error);
            throw error;
        }
    }

    async clearUsageHistory() {
        try {
            if (!this.usageTracker) {
                throw new Error('Usage tracker not available');
            }

            // Clear all usage data
            await this.usageTracker.saveUsageData({});
            
            return { success: true };
            
        } catch (error) {
            console.error('AdReply: Error clearing usage history:', error);
            throw error;
        }
    }

    getUsageTracker() {
        return this.usageTracker;
    }
}

export default UsageTrackerManager;