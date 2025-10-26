/**
 * Usage Tracker for AdReply Extension
 * Tracks ad variation usage per Facebook group with 24-hour rotation
 */

class UsageTracker {
    constructor() {
        this.storageKey = 'adreply_usage_tracking';
        this.cleanupInterval = null;
        this.init();
    }

    async init() {
        // Set up periodic cleanup (every 6 hours)
        this.cleanupInterval = setInterval(() => {
            this.performMaintenanceCleanup();
        }, 6 * 60 * 60 * 1000);

        // Perform initial cleanup
        await this.performMaintenanceCleanup();
    }

    /**
     * Record usage of an ad variation in a specific group
     */
    async recordUsage(templateId, variantIndex, groupId, postContent = '', metadata = {}) {
        try {
            const usageRecord = {
                templateId: templateId,
                variantIndex: variantIndex || 0,
                groupId: groupId,
                timestamp: new Date().toISOString(),
                postContent: (postContent || '').substring(0, 100),
                usageId: this.generateUUID(),
                metadata: {
                    postUrl: window.location?.href || '',
                    userAgent: (navigator.userAgent || '').substring(0, 100),
                    extensionVersion: chrome.runtime?.getManifest()?.version || '1.0.0',
                    ...metadata
                }
            };

            console.log('AdReply: Recording usage:', {
                templateId,
                variantIndex,
                groupId,
                timestamp: usageRecord.timestamp
            });

            // Get existing usage data
            const usageData = await this.getUsageData();
            
            // Initialize group array if it doesn't exist
            if (!usageData[groupId]) {
                usageData[groupId] = [];
            }

            // Add new usage record
            usageData[groupId].push(usageRecord);

            // Save updated data
            await this.saveUsageData(usageData);

            console.log('AdReply: Usage recorded successfully');
            return usageRecord;

        } catch (error) {
            console.error('AdReply: Error recording usage:', error);
            throw error;
        }
    }

    /**
     * Get usage history for a specific group within specified hours
     */
    async getGroupUsage(groupId, hoursBack = 24) {
        try {
            const usageData = await this.getUsageData();
            const groupUsage = usageData[groupId] || [];

            if (hoursBack === null) {
                return groupUsage; // Return all usage
            }

            // Filter by time window
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

            const recentUsage = groupUsage.filter(record => {
                const recordTime = new Date(record.timestamp);
                return recordTime > cutoffTime;
            });

            console.log(`AdReply: Found ${recentUsage.length} usage records in last ${hoursBack} hours for group ${groupId}`);
            return recentUsage;

        } catch (error) {
            console.error('AdReply: Error getting group usage:', error);
            return [];
        }
    }

    /**
     * Check if a specific variation was recently used in a group
     */
    async isVariationRecentlyUsed(templateId, variantIndex, groupId, hoursBack = 24) {
        try {
            const recentUsage = await this.getGroupUsage(groupId, hoursBack);
            
            const isUsed = recentUsage.some(record => 
                record.templateId === templateId && 
                record.variantIndex === (variantIndex || 0)
            );

            if (isUsed) {
                const usageRecord = recentUsage.find(record => 
                    record.templateId === templateId && 
                    record.variantIndex === (variantIndex || 0)
                );
                
                console.log(`AdReply: Variation ${templateId}[${variantIndex}] was used in group ${groupId} at ${usageRecord.timestamp}`);
            }

            return isUsed;

        } catch (error) {
            console.error('AdReply: Error checking variation usage:', error);
            return false; // Conservative: assume not used if error
        }
    }

    /**
     * Get the oldest usage time for a template variation in a group
     */
    async getOldestUsage(templateId, variantIndex, groupId) {
        try {
            const allUsage = await this.getGroupUsage(groupId, null); // Get all usage
            
            const templateUsage = allUsage
                .filter(record => 
                    record.templateId === templateId && 
                    record.variantIndex === (variantIndex || 0)
                )
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            return templateUsage.length > 0 ? templateUsage[0] : null;

        } catch (error) {
            console.error('AdReply: Error getting oldest usage:', error);
            return null;
        }
    }

    /**
     * Get usage summary for a group
     */
    async getGroupSummary(groupId) {
        try {
            const allUsage = await this.getGroupUsage(groupId, null);
            const recentUsage = await this.getGroupUsage(groupId, 24);

            const templateStats = {};
            
            allUsage.forEach(record => {
                if (!templateStats[record.templateId]) {
                    templateStats[record.templateId] = {
                        lastUsed: record.timestamp,
                        variantUsage: {},
                        totalUsage: 0
                    };
                }

                const stats = templateStats[record.templateId];
                stats.totalUsage++;
                
                if (!stats.variantUsage[record.variantIndex]) {
                    stats.variantUsage[record.variantIndex] = 0;
                }
                stats.variantUsage[record.variantIndex]++;

                // Update last used if this is more recent
                if (new Date(record.timestamp) > new Date(stats.lastUsed)) {
                    stats.lastUsed = record.timestamp;
                }
            });

            return {
                groupId,
                totalUsages: allUsage.length,
                recentUsages: recentUsage.length,
                lastUsedAt: allUsage.length > 0 ? 
                    Math.max(...allUsage.map(r => new Date(r.timestamp).getTime())) : null,
                usedTemplates: templateStats
            };

        } catch (error) {
            console.error('AdReply: Error getting group summary:', error);
            return {
                groupId,
                totalUsages: 0,
                recentUsages: 0,
                lastUsedAt: null,
                usedTemplates: {}
            };
        }
    }

    /**
     * Clean up old usage records
     */
    async cleanupOldUsage(daysBack = 30) {
        try {
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - daysBack);

            const usageData = await this.getUsageData();
            let totalRemoved = 0;

            for (const groupId in usageData) {
                const originalCount = usageData[groupId].length;
                
                usageData[groupId] = usageData[groupId].filter(record => {
                    const recordTime = new Date(record.timestamp);
                    return recordTime > cutoffTime;
                });

                const removedCount = originalCount - usageData[groupId].length;
                totalRemoved += removedCount;

                // Remove empty group arrays
                if (usageData[groupId].length === 0) {
                    delete usageData[groupId];
                }
            }

            if (totalRemoved > 0) {
                await this.saveUsageData(usageData);
                console.log(`AdReply: Cleaned up ${totalRemoved} old usage records`);
            }

            return totalRemoved;

        } catch (error) {
            console.error('AdReply: Error during cleanup:', error);
            return 0;
        }
    }

    /**
     * Clear all usage data for a specific group
     */
    async clearGroupUsage(groupId) {
        try {
            const usageData = await this.getUsageData();
            
            if (usageData[groupId]) {
                const removedCount = usageData[groupId].length;
                delete usageData[groupId];
                
                await this.saveUsageData(usageData);
                console.log(`AdReply: Cleared ${removedCount} usage records for group ${groupId}`);
                return removedCount;
            }

            return 0;

        } catch (error) {
            console.error('AdReply: Error clearing group usage:', error);
            return 0;
        }
    }

    /**
     * Export all usage data
     */
    async exportUsageData() {
        try {
            const usageData = await this.getUsageData();
            
            const exportData = {
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                totalGroups: Object.keys(usageData).length,
                totalRecords: Object.values(usageData).reduce((sum, records) => sum + records.length, 0),
                data: usageData
            };

            return exportData;

        } catch (error) {
            console.error('AdReply: Error exporting usage data:', error);
            return null;
        }
    }

    /**
     * Perform maintenance cleanup
     */
    async performMaintenanceCleanup() {
        try {
            console.log('AdReply: Performing maintenance cleanup...');
            
            // Clean up records older than 30 days
            const removedCount = await this.cleanupOldUsage(30);
            
            // Check storage usage and warn if getting full
            const usageData = await this.getUsageData();
            const recordCount = Object.values(usageData).reduce((sum, records) => sum + records.length, 0);
            
            if (recordCount > 10000) {
                console.warn(`AdReply: Large usage database detected (${recordCount} records). Consider manual cleanup.`);
            }

            console.log('AdReply: Maintenance cleanup completed');
            return { removedCount, totalRecords: recordCount };

        } catch (error) {
            console.error('AdReply: Error during maintenance cleanup:', error);
            return { removedCount: 0, totalRecords: 0 };
        }
    }

    /**
     * Get usage data from storage
     */
    async getUsageData() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            return result[this.storageKey] || {};
        } catch (error) {
            console.error('AdReply: Error reading usage data:', error);
            return {};
        }
    }

    /**
     * Save usage data to storage
     */
    async saveUsageData(usageData) {
        try {
            await chrome.storage.local.set({
                [this.storageKey]: usageData
            });
        } catch (error) {
            console.error('AdReply: Error saving usage data:', error);
            throw error;
        }
    }

    /**
     * Generate UUID for usage records
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Cleanup on extension shutdown
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsageTracker;
} else if (typeof window !== 'undefined') {
    window.UsageTracker = UsageTracker;
}