/**
 * Keyword Learning Engine for AdReply Extension
 * Tracks user behavior and optimizes keyword relevance through machine learning
 */

class KeywordLearningEngine {
  constructor(storageManager = null) {
    this.storageManager = storageManager;
    this.STORAGE_KEY = 'keywordStats';
    this.pendingUpdates = new Map(); // Batch updates for performance
    this.updateTimer = null;
  }

  /**
   * Record when templates are shown (matched) to the user
   * @param {string} postContent - The post content that triggered the match
   * @param {Array} matchedTemplates - Array of matched template objects with scores
   * @param {Array} keywords - Keywords that contributed to the matches
   * @returns {Promise<void>}
   */
  async recordMatch(postContent, matchedTemplates, keywords) {
    try {
      if (!matchedTemplates || matchedTemplates.length === 0) {
        return;
      }

      console.log('KeywordLearning: Recording matches for', matchedTemplates.length, 'templates');

      // Get current stats
      const stats = await this.getKeywordStats();

      // Process each matched template
      for (const match of matchedTemplates) {
        const template = match.template || match;
        const categoryId = template.category || 'custom';
        const templateKeywords = template.keywords || [];

        // Initialize category if needed
        if (!stats[categoryId]) {
          stats[categoryId] = {};
        }

        // Record match for each keyword in the template
        for (const keyword of templateKeywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          // Skip negative keywords (they don't contribute to matches)
          if (keywordLower.startsWith('-')) {
            continue;
          }

          // Initialize keyword stats if needed
          if (!stats[categoryId][keywordLower]) {
            stats[categoryId][keywordLower] = {
              keyword: keywordLower,
              categoryId: categoryId,
              matches: 0,
              chosen: 0,
              ignored: 0,
              score: 0.0,
              lastUpdated: new Date().toISOString()
            };
          }

          // Increment match count
          stats[categoryId][keywordLower].matches++;
          stats[categoryId][keywordLower].lastUpdated = new Date().toISOString();
        }
      }

      // Save updated stats
      await this.saveKeywordStats(stats);

      console.log('KeywordLearning: Match recording complete');

    } catch (error) {
      console.error('KeywordLearning: Error recording match:', error);
    }
  }

  /**
   * Record when user selects a template
   * @param {string} templateId - ID of the selected template
   * @param {Array} keywords - Keywords from the selected template
   * @param {string} categoryId - Category ID of the template
   * @returns {Promise<void>}
   */
  async recordSelection(templateId, keywords, categoryId) {
    try {
      if (!keywords || keywords.length === 0) {
        console.warn('KeywordLearning: No keywords provided for selection');
        return;
      }

      console.log('KeywordLearning: Recording selection for template', templateId, 'with', keywords.length, 'keywords');

      // Get current stats
      const stats = await this.getKeywordStats();

      // Initialize category if needed
      if (!stats[categoryId]) {
        stats[categoryId] = {};
      }

      // Record selection for each keyword
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase().trim();
        
        // Skip negative keywords
        if (keywordLower.startsWith('-')) {
          continue;
        }

        // Initialize keyword stats if needed
        if (!stats[categoryId][keywordLower]) {
          stats[categoryId][keywordLower] = {
            keyword: keywordLower,
            categoryId: categoryId,
            matches: 0,
            chosen: 0,
            ignored: 0,
            score: 0.0,
            lastUpdated: new Date().toISOString()
          };
        }

        // Increment chosen count
        stats[categoryId][keywordLower].chosen++;
        stats[categoryId][keywordLower].lastUpdated = new Date().toISOString();

        // Recalculate score
        this.updateScore(stats[categoryId][keywordLower]);
      }

      // Save updated stats
      await this.saveKeywordStats(stats);

      console.log('KeywordLearning: Selection recording complete');

    } catch (error) {
      console.error('KeywordLearning: Error recording selection:', error);
    }
  }

  /**
   * Record when user ignores a suggestion (10-second timeout)
   * @param {string} templateId - ID of the ignored template
   * @param {Array} keywords - Keywords from the ignored template
   * @param {string} categoryId - Category ID of the template
   * @returns {Promise<void>}
   */
  async recordIgnore(templateId, keywords, categoryId) {
    try {
      if (!keywords || keywords.length === 0) {
        console.warn('KeywordLearning: No keywords provided for ignore');
        return;
      }

      console.log('KeywordLearning: Recording ignore for template', templateId, 'with', keywords.length, 'keywords');

      // Get current stats
      const stats = await this.getKeywordStats();

      // Initialize category if needed
      if (!stats[categoryId]) {
        stats[categoryId] = {};
      }

      // Record ignore for each keyword
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase().trim();
        
        // Skip negative keywords
        if (keywordLower.startsWith('-')) {
          continue;
        }

        // Initialize keyword stats if needed
        if (!stats[categoryId][keywordLower]) {
          stats[categoryId][keywordLower] = {
            keyword: keywordLower,
            categoryId: categoryId,
            matches: 0,
            chosen: 0,
            ignored: 0,
            score: 0.0,
            lastUpdated: new Date().toISOString()
          };
        }

        // Increment ignored count
        stats[categoryId][keywordLower].ignored++;
        stats[categoryId][keywordLower].lastUpdated = new Date().toISOString();

        // Recalculate score
        this.updateScore(stats[categoryId][keywordLower]);
      }

      // Save updated stats
      await this.saveKeywordStats(stats);

      console.log('KeywordLearning: Ignore recording complete');

    } catch (error) {
      console.error('KeywordLearning: Error recording ignore:', error);
    }
  }

  /**
   * Calculate and update score for a keyword stat
   * @param {Object} keywordStat - Keyword statistics object
   */
  updateScore(keywordStat) {
    if (keywordStat.matches > 0) {
      keywordStat.score = keywordStat.chosen / keywordStat.matches;
    } else {
      keywordStat.score = 0.0;
    }
  }

  /**
   * Calculate scores for all keywords
   * @returns {Promise<Object>} Updated keyword statistics with scores
   */
  async calculateScores() {
    try {
      const stats = await this.getKeywordStats();

      // Recalculate scores for all keywords
      for (const categoryId in stats) {
        for (const keyword in stats[categoryId]) {
          this.updateScore(stats[categoryId][keyword]);
        }
      }

      // Save updated stats
      await this.saveKeywordStats(stats);

      console.log('KeywordLearning: Scores recalculated for all keywords');

      return stats;

    } catch (error) {
      console.error('KeywordLearning: Error calculating scores:', error);
      return {};
    }
  }

  /**
   * Get keywords that should be suggested for removal
   * @param {number} threshold - Score threshold below which keywords are suggested for removal (default 0.1)
   * @param {number} minMatches - Minimum number of matches required before suggesting removal (default 20)
   * @returns {Promise<Array>} Array of keywords suggested for removal
   */
  async getSuggestedRemovals(threshold = 0.1, minMatches = 20) {
    try {
      const stats = await this.getKeywordStats();
      const suggestions = [];

      // Find underperforming keywords
      for (const categoryId in stats) {
        for (const keyword in stats[categoryId]) {
          const keywordStat = stats[categoryId][keyword];

          // Check if keyword meets removal criteria
          if (keywordStat.matches >= minMatches && keywordStat.score < threshold) {
            suggestions.push({
              keyword: keywordStat.keyword,
              categoryId: keywordStat.categoryId,
              matches: keywordStat.matches,
              chosen: keywordStat.chosen,
              ignored: keywordStat.ignored,
              score: keywordStat.score,
              reason: `Low performance: ${(keywordStat.score * 100).toFixed(1)}% selection rate after ${keywordStat.matches} matches`
            });
          }
        }
      }

      // Sort by score (worst first)
      suggestions.sort((a, b) => a.score - b.score);

      console.log('KeywordLearning: Found', suggestions.length, 'keywords suggested for removal');

      return suggestions;

    } catch (error) {
      console.error('KeywordLearning: Error getting suggested removals:', error);
      return [];
    }
  }

  /**
   * Get performance report for dashboard display
   * @returns {Promise<Object>} Performance report with keyword statistics
   */
  async getPerformanceReport() {
    try {
      const stats = await this.getKeywordStats();
      const report = {
        categories: {},
        summary: {
          totalKeywords: 0,
          totalMatches: 0,
          totalChosen: 0,
          totalIgnored: 0,
          averageScore: 0,
          learningKeywords: 0, // Keywords with < 10 matches
          performingKeywords: 0, // Keywords with score >= 0.5
          underperformingKeywords: 0 // Keywords with score < 0.1 and >= 20 matches
        }
      };

      let totalScore = 0;
      let keywordCount = 0;

      // Process each category
      for (const categoryId in stats) {
        const categoryStats = {
          categoryId: categoryId,
          keywords: [],
          totalMatches: 0,
          totalChosen: 0,
          totalIgnored: 0,
          averageScore: 0
        };

        let categoryTotalScore = 0;
        let categoryKeywordCount = 0;

        // Process each keyword in category
        for (const keyword in stats[categoryId]) {
          const keywordStat = stats[categoryId][keyword];

          // Add to category stats
          categoryStats.keywords.push({
            keyword: keywordStat.keyword,
            matches: keywordStat.matches,
            chosen: keywordStat.chosen,
            ignored: keywordStat.ignored,
            score: keywordStat.score,
            lastUpdated: keywordStat.lastUpdated,
            status: this.getKeywordStatus(keywordStat)
          });

          categoryStats.totalMatches += keywordStat.matches;
          categoryStats.totalChosen += keywordStat.chosen;
          categoryStats.totalIgnored += keywordStat.ignored;
          categoryTotalScore += keywordStat.score;
          categoryKeywordCount++;

          // Update summary
          report.summary.totalMatches += keywordStat.matches;
          report.summary.totalChosen += keywordStat.chosen;
          report.summary.totalIgnored += keywordStat.ignored;
          totalScore += keywordStat.score;
          keywordCount++;

          // Count keyword types
          if (keywordStat.matches < 10) {
            report.summary.learningKeywords++;
          }
          if (keywordStat.score >= 0.5 && keywordStat.matches >= 10) {
            report.summary.performingKeywords++;
          }
          if (keywordStat.score < 0.1 && keywordStat.matches >= 20) {
            report.summary.underperformingKeywords++;
          }
        }

        // Calculate category average score
        if (categoryKeywordCount > 0) {
          categoryStats.averageScore = categoryTotalScore / categoryKeywordCount;
        }

        // Sort keywords by score (descending)
        categoryStats.keywords.sort((a, b) => b.score - a.score);

        report.categories[categoryId] = categoryStats;
      }

      // Calculate overall average score
      if (keywordCount > 0) {
        report.summary.averageScore = totalScore / keywordCount;
      }

      report.summary.totalKeywords = keywordCount;

      console.log('KeywordLearning: Performance report generated:', {
        totalKeywords: report.summary.totalKeywords,
        totalMatches: report.summary.totalMatches,
        averageScore: report.summary.averageScore.toFixed(3)
      });

      return report;

    } catch (error) {
      console.error('KeywordLearning: Error generating performance report:', error);
      return {
        categories: {},
        summary: {
          totalKeywords: 0,
          totalMatches: 0,
          totalChosen: 0,
          totalIgnored: 0,
          averageScore: 0,
          learningKeywords: 0,
          performingKeywords: 0,
          underperformingKeywords: 0
        }
      };
    }
  }

  /**
   * Get status label for a keyword based on its statistics
   * @param {Object} keywordStat - Keyword statistics object
   * @returns {string} Status label
   */
  getKeywordStatus(keywordStat) {
    if (keywordStat.matches < 10) {
      return 'learning';
    }
    if (keywordStat.score >= 0.5) {
      return 'performing';
    }
    if (keywordStat.score < 0.1 && keywordStat.matches >= 20) {
      return 'underperforming';
    }
    return 'normal';
  }

  /**
   * Get keyword statistics from storage
   * @returns {Promise<Object>} Keyword statistics organized by category
   */
  async getKeywordStats() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([this.STORAGE_KEY]);
        return result[this.STORAGE_KEY] || {};
      }
      return {};
    } catch (error) {
      console.error('KeywordLearning: Error getting keyword stats:', error);
      return {};
    }
  }

  /**
   * Save keyword statistics to storage
   * @param {Object} stats - Keyword statistics to save
   * @returns {Promise<void>}
   */
  async saveKeywordStats(stats) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
        console.log('KeywordLearning: Stats saved to storage');
      }
    } catch (error) {
      console.error('KeywordLearning: Error saving keyword stats:', error);
    }
  }

  /**
   * Clean up orphaned keyword statistics for deleted categories/templates
   * @param {Array} validCategoryIds - Array of valid category IDs
   * @returns {Promise<number>} Number of orphaned entries removed
   */
  async cleanupOrphanedStats(validCategoryIds) {
    try {
      const stats = await this.getKeywordStats();
      let removedCount = 0;

      // Remove stats for categories that no longer exist
      for (const categoryId in stats) {
        if (!validCategoryIds.includes(categoryId)) {
          delete stats[categoryId];
          removedCount++;
          console.log('KeywordLearning: Removed orphaned category:', categoryId);
        }
      }

      if (removedCount > 0) {
        await this.saveKeywordStats(stats);
        console.log('KeywordLearning: Cleanup complete, removed', removedCount, 'orphaned categories');
      }

      return removedCount;

    } catch (error) {
      console.error('KeywordLearning: Error cleaning up orphaned stats:', error);
      return 0;
    }
  }

  /**
   * Reset statistics for a specific keyword
   * @param {string} categoryId - Category ID
   * @param {string} keyword - Keyword to reset
   * @returns {Promise<boolean>} Success status
   */
  async resetKeywordStats(categoryId, keyword) {
    try {
      const stats = await this.getKeywordStats();

      if (stats[categoryId] && stats[categoryId][keyword]) {
        stats[categoryId][keyword] = {
          keyword: keyword,
          categoryId: categoryId,
          matches: 0,
          chosen: 0,
          ignored: 0,
          score: 0.0,
          lastUpdated: new Date().toISOString()
        };

        await this.saveKeywordStats(stats);
        console.log('KeywordLearning: Reset stats for keyword:', keyword, 'in category:', categoryId);
        return true;
      }

      return false;

    } catch (error) {
      console.error('KeywordLearning: Error resetting keyword stats:', error);
      return false;
    }
  }

  /**
   * Remove statistics for a specific keyword
   * @param {string} categoryId - Category ID
   * @param {string} keyword - Keyword to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeKeywordStats(categoryId, keyword) {
    try {
      const stats = await this.getKeywordStats();

      if (stats[categoryId] && stats[categoryId][keyword]) {
        delete stats[categoryId][keyword];

        // Remove category if empty
        if (Object.keys(stats[categoryId]).length === 0) {
          delete stats[categoryId];
        }

        await this.saveKeywordStats(stats);
        console.log('KeywordLearning: Removed stats for keyword:', keyword, 'in category:', categoryId);
        return true;
      }

      return false;

    } catch (error) {
      console.error('KeywordLearning: Error removing keyword stats:', error);
      return false;
    }
  }

  /**
   * Export keyword statistics for backup
   * @returns {Promise<Object>} Exported keyword statistics
   */
  async exportStats() {
    try {
      const stats = await this.getKeywordStats();
      return {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        keywordStats: stats
      };
    } catch (error) {
      console.error('KeywordLearning: Error exporting stats:', error);
      return {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        keywordStats: {}
      };
    }
  }

  /**
   * Import keyword statistics from backup
   * @param {Object} exportedData - Exported keyword statistics
   * @param {boolean} merge - Whether to merge with existing data or replace
   * @returns {Promise<boolean>} Success status
   */
  async importStats(exportedData, merge = true) {
    try {
      if (!exportedData || !exportedData.keywordStats) {
        throw new Error('Invalid export data format');
      }

      if (merge) {
        // Merge with existing stats
        const existingStats = await this.getKeywordStats();
        const mergedStats = { ...existingStats };

        for (const categoryId in exportedData.keywordStats) {
          if (!mergedStats[categoryId]) {
            mergedStats[categoryId] = {};
          }

          for (const keyword in exportedData.keywordStats[categoryId]) {
            // Keep existing stats if they have more data
            const existing = mergedStats[categoryId][keyword];
            const imported = exportedData.keywordStats[categoryId][keyword];

            if (!existing || imported.matches > existing.matches) {
              mergedStats[categoryId][keyword] = imported;
            }
          }
        }

        await this.saveKeywordStats(mergedStats);
      } else {
        // Replace existing stats
        await this.saveKeywordStats(exportedData.keywordStats);
      }

      console.log('KeywordLearning: Stats imported successfully');
      return true;

    } catch (error) {
      console.error('KeywordLearning: Error importing stats:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeywordLearningEngine;
} else {
  window.KeywordLearningEngine = KeywordLearningEngine;
}
