/**
 * Migration Manager for AdReply Extension
 * Handles migration from variant-based templates to individual templates
 * and ensures backward compatibility during the transition
 */

class MigrationManager {
  constructor(storageManager, categoryManager) {
    this.storageManager = storageManager;
    this.categoryManager = categoryManager;
    this.migrationKey = 'adreply_migration_status';
    this.currentVersion = 2; // Version 2: Individual templates with categories
    this.backupKey = 'adreply_pre_migration_backup';
  }

  /**
   * Check if migration is needed
   * @returns {Promise<boolean>} True if migration is needed
   */
  async isMigrationNeeded() {
    try {
      const migrationStatus = await this.getMigrationStatus();
      return migrationStatus.version < this.currentVersion;
    } catch (error) {
      console.error('MigrationManager: Error checking migration status:', error);
      return true; // Assume migration needed if we can't check
    }
  }

  /**
   * Get current migration status
   * @returns {Promise<Object>} Migration status object
   */
  async getMigrationStatus() {
    try {
      const result = await chrome.storage.local.get([this.migrationKey]);
      return result[this.migrationKey] || {
        version: 0,
        lastMigration: null,
        migrationsCompleted: []
      };
    } catch (error) {
      console.error('MigrationManager: Error getting migration status:', error);
      return {
        version: 0,
        lastMigration: null,
        migrationsCompleted: []
      };
    }
  }

  /**
   * Update migration status
   * @param {Object} status - New migration status
   * @returns {Promise<void>}
   */
  async updateMigrationStatus(status) {
    try {
      await chrome.storage.local.set({
        [this.migrationKey]: {
          ...status,
          lastMigration: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('MigrationManager: Error updating migration status:', error);
      throw error;
    }
  }

  /**
   * Create backup of existing data before migration
   * @returns {Promise<Object>} Backup result
   */
  async createPreMigrationBackup() {
    try {
      console.log('MigrationManager: Creating pre-migration backup...');
      
      // Get all existing data
      const allData = await this.storageManager.getAllData();
      
      // Create backup object
      const backup = {
        version: 1, // Pre-migration version
        createdAt: new Date().toISOString(),
        data: allData,
        metadata: {
          templateCount: allData.templates ? allData.templates.length : 0,
          groupCount: allData.groups ? allData.groups.length : 0,
          hasSettings: !!allData.settings,
          hasAISettings: !!allData.aiSettings,
          hasLicense: !!allData.license
        }
      };

      // Store backup
      await chrome.storage.local.set({
        [this.backupKey]: backup
      });

      console.log(`MigrationManager: Backup created with ${backup.metadata.templateCount} templates`);
      return {
        success: true,
        templateCount: backup.metadata.templateCount,
        backupSize: JSON.stringify(backup).length
      };

    } catch (error) {
      console.error('MigrationManager: Error creating backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform complete migration from version 1 to version 2
   * @returns {Promise<Object>} Migration result
   */
  async performMigration() {
    try {
      console.log('MigrationManager: Starting migration to version 2...');
      
      const migrationStatus = await this.getMigrationStatus();
      
      if (migrationStatus.version >= this.currentVersion) {
        console.log('MigrationManager: Migration not needed, already at current version');
        return {
          success: true,
          alreadyMigrated: true,
          version: migrationStatus.version
        };
      }

      // Step 1: Create backup
      const backupResult = await this.createPreMigrationBackup();
      if (!backupResult.success) {
        throw new Error(`Backup failed: ${backupResult.error}`);
      }

      // Step 2: Get existing data
      const existingData = await this.storageManager.getAllData();
      
      // Step 3: Migrate templates
      const templateMigrationResult = await this.migrateTemplates(existingData.templates || []);
      
      // Step 4: Migrate usage tracking data
      const usageTrackingResult = await this.migrateUsageTracking();
      
      // Step 5: Ensure categories exist
      await this.categoryManager.initialize();
      
      // Step 6: Save migrated data
      await this.storageManager.saveData({
        templates: templateMigrationResult.migratedTemplates
      });

      // Step 7: Update migration status
      await this.updateMigrationStatus({
        version: this.currentVersion,
        migrationsCompleted: ['templates_v1_to_v2', 'usage_tracking_v1_to_v2'],
        migrationResults: {
          templates: templateMigrationResult,
          usageTracking: usageTrackingResult,
          backup: backupResult
        }
      });

      console.log('MigrationManager: Migration completed successfully');
      
      return {
        success: true,
        version: this.currentVersion,
        results: {
          originalTemplates: templateMigrationResult.originalCount,
          migratedTemplates: templateMigrationResult.migratedCount,
          newTemplates: templateMigrationResult.newTemplatesCreated,
          usageRecordsMigrated: usageTrackingResult.recordsMigrated,
          backupCreated: backupResult.success
        }
      };

    } catch (error) {
      console.error('MigrationManager: Migration failed:', error);
      
      // Attempt to restore from backup
      await this.restoreFromBackup();
      
      return {
        success: false,
        error: error.message,
        restoredFromBackup: true
      };
    }
  }

  /**
   * Migrate templates from variant-based to individual templates
   * @param {Array} existingTemplates - Array of existing templates
   * @returns {Promise<Object>} Migration result
   */
  async migrateTemplates(existingTemplates) {
    try {
      console.log(`MigrationManager: Migrating ${existingTemplates.length} templates...`);
      
      const migratedTemplates = [];
      let newTemplatesCreated = 0;
      
      for (const template of existingTemplates) {
        // Check if template is already in new format
        if (this.isNewFormatTemplate(template)) {
          // Already migrated, keep as-is but ensure category is set
          const updatedTemplate = {
            ...template,
            category: template.category || 'custom',
            isPrebuilt: template.isPrebuilt || false,
            usageCount: template.usageCount || 0,
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          migratedTemplates.push(updatedTemplate);
          continue;
        }

        // Migrate old format template
        const migrationResult = await this.migrateIndividualTemplate(template);
        migratedTemplates.push(...migrationResult.templates);
        newTemplatesCreated += migrationResult.newTemplatesCreated;
      }

      console.log(`MigrationManager: Template migration completed. ${migratedTemplates.length} total templates, ${newTemplatesCreated} new templates created from variants`);
      
      return {
        success: true,
        originalCount: existingTemplates.length,
        migratedCount: migratedTemplates.length,
        newTemplatesCreated: newTemplatesCreated,
        migratedTemplates: migratedTemplates
      };

    } catch (error) {
      console.error('MigrationManager: Error migrating templates:', error);
      throw error;
    }
  }

  /**
   * Check if template is already in new format
   * @param {Object} template - Template to check
   * @returns {boolean} True if already in new format
   */
  isNewFormatTemplate(template) {
    // New format templates don't have variants array and have category field
    return !template.variants && template.hasOwnProperty('category');
  }

  /**
   * Migrate an individual template from old to new format
   * @param {Object} oldTemplate - Old format template
   * @returns {Promise<Object>} Migration result for this template
   */
  async migrateIndividualTemplate(oldTemplate) {
    try {
      const migratedTemplates = [];
      let newTemplatesCreated = 0;

      // Create main template (convert from old structure)
      const mainTemplate = {
        id: oldTemplate.id,
        label: oldTemplate.label || oldTemplate.name || 'Migrated Template',
        category: this.determineCategoryFromTemplate(oldTemplate),
        keywords: oldTemplate.keywords || [],
        template: oldTemplate.template || oldTemplate.text || '',
        isPrebuilt: oldTemplate.isPrebuilt || false,
        createdAt: oldTemplate.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: oldTemplate.usageCount || 0
      };

      migratedTemplates.push(mainTemplate);

      // Convert variants to individual templates if they exist
      if (oldTemplate.variants && Array.isArray(oldTemplate.variants) && oldTemplate.variants.length > 0) {
        for (let i = 0; i < oldTemplate.variants.length; i++) {
          const variant = oldTemplate.variants[i];
          
          // Skip empty variants
          if (!variant || typeof variant !== 'string' || variant.trim().length === 0) {
            continue;
          }

          const variantTemplate = {
            id: `${oldTemplate.id}_variant_${i + 1}`,
            label: `${mainTemplate.label} (Variant ${i + 1})`,
            category: mainTemplate.category,
            keywords: mainTemplate.keywords,
            template: variant.trim(),
            isPrebuilt: mainTemplate.isPrebuilt,
            createdAt: mainTemplate.createdAt,
            updatedAt: mainTemplate.updatedAt,
            usageCount: 0 // Variants start with 0 usage
          };

          migratedTemplates.push(variantTemplate);
          newTemplatesCreated++;
        }
      }

      return {
        success: true,
        templates: migratedTemplates,
        newTemplatesCreated: newTemplatesCreated
      };

    } catch (error) {
      console.error('MigrationManager: Error migrating individual template:', error);
      
      // Return minimal migration on error
      return {
        success: false,
        templates: [{
          id: oldTemplate.id || `migrated_${Date.now()}`,
          label: oldTemplate.label || oldTemplate.name || 'Migrated Template',
          category: 'custom',
          keywords: oldTemplate.keywords || [],
          template: oldTemplate.template || oldTemplate.text || '',
          isPrebuilt: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        }],
        newTemplatesCreated: 0,
        error: error.message
      };
    }
  }

  /**
   * Determine appropriate category for a template during migration
   * @param {Object} template - Template to categorize
   * @returns {string} Category ID
   */
  determineCategoryFromTemplate(template) {
    // If template already has a category, use it
    if (template.category && typeof template.category === 'string') {
      return template.category;
    }

    // Check if template has verticals (old system)
    if (template.verticals && Array.isArray(template.verticals) && template.verticals.length > 0) {
      // Map old verticals to new categories
      const verticalToCategoryMap = {
        'automotive': 'automotive',
        'motorcycles': 'automotive',
        'fitness': 'fitness',
        'food': 'food',
        'restaurants': 'food',
        'technology': 'technology',
        'tech': 'technology',
        'fashion': 'beauty',
        'home': 'home-services',
        'business': 'professional',
        'real-estate': 'real-estate',
        'realestate': 'real-estate',
        'health': 'healthcare',
        'healthcare': 'healthcare',
        'pets': 'pet-services',
        'events': 'events',
        'photography': 'photography',
        'crafts': 'crafts',
        'construction': 'construction',
        'transportation': 'transportation',
        'entertainment': 'entertainment',
        'retail': 'retail',
        'professional': 'professional',
        'legal': 'legal',
        'financial': 'financial',
        'education': 'education'
      };

      const firstVertical = template.verticals[0].toLowerCase();
      if (verticalToCategoryMap[firstVertical]) {
        return verticalToCategoryMap[firstVertical];
      }
    }

    // Try to infer category from keywords
    const inferredCategory = this.inferCategoryFromKeywords(template.keywords || []);
    if (inferredCategory) {
      return inferredCategory;
    }

    // Try to infer from template text
    const textInferredCategory = this.inferCategoryFromText(template.template || template.text || '');
    if (textInferredCategory) {
      return textInferredCategory;
    }

    // Default to custom category
    return 'custom';
  }

  /**
   * Infer category from template keywords
   * @param {Array} keywords - Template keywords
   * @returns {string|null} Inferred category or null
   */
  inferCategoryFromKeywords(keywords) {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return null;
    }

    // Define keyword patterns for each category
    const categoryKeywords = {
      'automotive': ['car', 'auto', 'vehicle', 'engine', 'repair', 'garage', 'mechanic', 'driving', 'motorcycle', 'bike'],
      'fitness': ['gym', 'workout', 'exercise', 'training', 'fitness', 'muscle', 'weight', 'health', 'sport'],
      'food': ['food', 'restaurant', 'cooking', 'recipe', 'meal', 'kitchen', 'chef', 'dining', 'catering'],
      'home-services': ['home', 'house', 'cleaning', 'repair', 'maintenance', 'plumbing', 'electrical', 'hvac'],
      'beauty': ['beauty', 'salon', 'hair', 'makeup', 'spa', 'skincare', 'cosmetics', 'nails'],
      'real-estate': ['real estate', 'property', 'house', 'home', 'apartment', 'rent', 'buy', 'sell'],
      'technology': ['tech', 'software', 'computer', 'app', 'digital', 'online', 'website', 'programming'],
      'healthcare': ['health', 'medical', 'doctor', 'clinic', 'therapy', 'treatment', 'wellness'],
      'pet-services': ['pet', 'dog', 'cat', 'veterinary', 'grooming', 'animal', 'vet'],
      'events': ['event', 'party', 'wedding', 'celebration', 'planning', 'catering'],
      'photography': ['photo', 'photography', 'camera', 'portrait', 'wedding', 'shoot'],
      'construction': ['construction', 'building', 'contractor', 'renovation', 'roofing'],
      'professional': ['business', 'consulting', 'marketing', 'professional', 'service']
    };

    // Count matches for each category
    const categoryScores = {};
    
    for (const [category, categoryKeywordList] of Object.entries(categoryKeywords)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        
        for (const categoryKeyword of categoryKeywordList) {
          if (keywordLower.includes(categoryKeyword) || categoryKeyword.includes(keywordLower)) {
            score++;
            break; // Only count once per keyword
          }
        }
      }
      
      if (score > 0) {
        categoryScores[category] = score;
      }
    }

    // Return category with highest score
    if (Object.keys(categoryScores).length > 0) {
      const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
        categoryScores[a] > categoryScores[b] ? a : b
      );
      return bestCategory;
    }

    return null;
  }

  /**
   * Infer category from template text content
   * @param {string} text - Template text
   * @returns {string|null} Inferred category or null
   */
  inferCategoryFromText(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    const textLower = text.toLowerCase();
    
    // Simple text-based category detection
    const textPatterns = {
      'automotive': /\b(car|auto|vehicle|engine|repair|garage|mechanic|driving|motorcycle|bike)\b/,
      'fitness': /\b(gym|workout|exercise|training|fitness|muscle|weight|health|sport)\b/,
      'food': /\b(food|restaurant|cooking|recipe|meal|kitchen|chef|dining|catering)\b/,
      'home-services': /\b(home|house|cleaning|repair|maintenance|plumbing|electrical|hvac)\b/,
      'beauty': /\b(beauty|salon|hair|makeup|spa|skincare|cosmetics|nails)\b/,
      'real-estate': /\b(real estate|property|house|home|apartment|rent|buy|sell)\b/,
      'technology': /\b(tech|software|computer|app|digital|online|website|programming)\b/,
      'healthcare': /\b(health|medical|doctor|clinic|therapy|treatment|wellness)\b/,
      'pet-services': /\b(pet|dog|cat|veterinary|grooming|animal|vet)\b/,
      'events': /\b(event|party|wedding|celebration|planning|catering)\b/,
      'photography': /\b(photo|photography|camera|portrait|wedding|shoot)\b/,
      'construction': /\b(construction|building|contractor|renovation|roofing)\b/,
      'professional': /\b(business|consulting|marketing|professional|service)\b/
    };

    for (const [category, pattern] of Object.entries(textPatterns)) {
      if (pattern.test(textLower)) {
        return category;
      }
    }

    return null;
  }

  /**
   * Migrate usage tracking data from variant-based to individual template tracking
   * @returns {Promise<Object>} Migration result
   */
  async migrateUsageTracking() {
    try {
      console.log('MigrationManager: Migrating usage tracking data...');
      
      // Get existing usage tracking data
      const usageTracker = new (window.UsageTracker || class { 
        async getUsageData() { return {}; }
        async saveUsageData() {}
      })();
      
      const existingUsageData = await usageTracker.getUsageData();
      let recordsMigrated = 0;
      
      // Convert variant-based usage records to individual template records
      for (const [groupId, usageRecords] of Object.entries(existingUsageData)) {
        if (!Array.isArray(usageRecords)) continue;
        
        for (const record of usageRecords) {
          // Check if record is already in new format
          if (record.templateId && !record.variantIndex) {
            continue; // Already migrated
          }
          
          // Convert old format record
          if (record.templateId && typeof record.variantIndex === 'number') {
            // Update record to remove variant index
            delete record.variantIndex;
            recordsMigrated++;
          }
        }
      }
      
      // Save updated usage data
      await usageTracker.saveUsageData(existingUsageData);
      
      console.log(`MigrationManager: Usage tracking migration completed. ${recordsMigrated} records updated`);
      
      return {
        success: true,
        recordsMigrated: recordsMigrated
      };

    } catch (error) {
      console.error('MigrationManager: Error migrating usage tracking:', error);
      return {
        success: false,
        error: error.message,
        recordsMigrated: 0
      };
    }
  }

  /**
   * Restore data from pre-migration backup
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup() {
    try {
      console.log('MigrationManager: Restoring from pre-migration backup...');
      
      const result = await chrome.storage.local.get([this.backupKey]);
      const backup = result[this.backupKey];
      
      if (!backup) {
        throw new Error('No backup found');
      }

      // Restore data
      await this.storageManager.saveData(backup.data);
      
      // Reset migration status
      await this.updateMigrationStatus({
        version: backup.version,
        migrationsCompleted: [],
        restoredFromBackup: true,
        restoredAt: new Date().toISOString()
      });

      console.log('MigrationManager: Successfully restored from backup');
      
      return {
        success: true,
        restoredTemplates: backup.metadata.templateCount
      };

    } catch (error) {
      console.error('MigrationManager: Error restoring from backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get migration summary for user display
   * @returns {Promise<Object>} Migration summary
   */
  async getMigrationSummary() {
    try {
      const migrationStatus = await this.getMigrationStatus();
      const isNeeded = await this.isMigrationNeeded();
      
      return {
        isNeeded: isNeeded,
        currentVersion: migrationStatus.version,
        targetVersion: this.currentVersion,
        lastMigration: migrationStatus.lastMigration,
        migrationsCompleted: migrationStatus.migrationsCompleted || [],
        results: migrationStatus.migrationResults || null
      };

    } catch (error) {
      console.error('MigrationManager: Error getting migration summary:', error);
      return {
        isNeeded: true,
        currentVersion: 0,
        targetVersion: this.currentVersion,
        error: error.message
      };
    }
  }

  /**
   * Clean up migration artifacts (backups, temporary data)
   * @param {boolean} keepBackup - Whether to keep the backup
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupMigrationArtifacts(keepBackup = true) {
    try {
      console.log('MigrationManager: Cleaning up migration artifacts...');
      
      const itemsToRemove = [];
      
      if (!keepBackup) {
        itemsToRemove.push(this.backupKey);
      }
      
      if (itemsToRemove.length > 0) {
        await chrome.storage.local.remove(itemsToRemove);
      }

      return {
        success: true,
        itemsRemoved: itemsToRemove.length,
        backupKept: keepBackup
      };

    } catch (error) {
      console.error('MigrationManager: Error cleaning up artifacts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MigrationManager;
} else {
  window.MigrationManager = MigrationManager;
}