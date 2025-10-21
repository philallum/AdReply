/**
 * Unified Storage Manager for AdReply Extension
 * Combines IndexedDB and Chrome storage managers with data models
 */

// Import storage managers and data models
// Note: In a Chrome extension, these would be loaded via script tags in manifest.json

class StorageManager {
  constructor() {
    this.indexedDB = new IndexedDBManager();
    this.chromeStorage = new ChromeStorageManager();
    this.dataMigration = new (window.AdReplyModels?.DataMigration || DataMigration)();
    
    // Data model classes
    this.models = window.AdReplyModels || {
      Template,
      GroupHistory,
      License,
      Settings,
      AISettings
    };
    
    this.initialized = false;
  }

  /**
   * Initialize all storage systems
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.indexedDB.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  // ===== TEMPLATE OPERATIONS =====

  /**
   * Save a template with validation
   * @param {Object} templateData - Template data to save
   * @returns {Promise<string>} Template ID
   */
  async saveTemplate(templateData) {
    await this.initialize();
    
    const template = this.models.Template.fromObject(templateData);
    const validation = template.validate();
    
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedTemplate = template.sanitize();
    return await this.indexedDB.saveTemplate(sanitizedTemplate.toObject());
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object|null>}
   */
  async getTemplate(templateId) {
    await this.initialize();
    
    const templateData = await this.indexedDB.getTemplate(templateId);
    if (!templateData) return null;
    
    return this.models.Template.fromObject(templateData).toObject();
  }

  /**
   * Get all templates with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getTemplates(filters = {}) {
    await this.initialize();
    
    const templatesData = await this.indexedDB.getTemplates(filters);
    return templatesData.map(data => this.models.Template.fromObject(data).toObject());
  }

  /**
   * Update template usage count
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async incrementTemplateUsage(templateId) {
    await this.initialize();
    return await this.indexedDB.incrementTemplateUsage(templateId);
  }

  /**
   * Delete template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    await this.initialize();
    return await this.indexedDB.deleteTemplate(templateId);
  }

  /**
   * Get template count for license validation
   * @returns {Promise<number>}
   */
  async getTemplateCount() {
    await this.initialize();
    
    const templates = await this.indexedDB.getTemplates();
    return templates.length;
  }

  // ===== GROUP OPERATIONS =====

  /**
   * Update group history with template usage
   * @param {string} groupId - Facebook group ID
   * @param {string} templateId - Template ID used
   * @param {number} variantIndex - Variant index used
   * @returns {Promise<void>}
   */
  async updateGroupHistory(groupId, templateId, variantIndex) {
    await this.initialize();
    return await this.indexedDB.updateGroupHistory(groupId, templateId, variantIndex);
  }

  /**
   * Get group history by group ID
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Object|null>}
   */
  async getGroupHistory(groupId) {
    await this.initialize();
    
    const groupData = await this.indexedDB.getGroupHistory(groupId);
    if (!groupData) return null;
    
    return this.models.GroupHistory.fromObject(groupData).toObject();
  }

  /**
   * Get all group histories
   * @returns {Promise<Array>}
   */
  async getAllGroupHistories() {
    await this.initialize();
    
    const groupsData = await this.indexedDB.getAllGroupHistories();
    return groupsData.map(data => this.models.GroupHistory.fromObject(data).toObject());
  }

  // ===== SETTINGS OPERATIONS =====

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const settingsData = await this.chromeStorage.getSettings();
    const settings = this.models.Settings.fromObject(settingsData);
    
    const validation = settings.validate();
    if (!validation.isValid) {
      console.warn('Settings validation failed, using defaults:', validation.errors);
      return new this.models.Settings().toObject();
    }
    
    return settings.toObject();
  }

  /**
   * Save user settings
   * @param {Object} settingsData - Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settingsData) {
    const settings = this.models.Settings.fromObject(settingsData);
    const validation = settings.validate();
    
    if (!validation.isValid) {
      throw new Error(`Settings validation failed: ${validation.errors.join(', ')}`);
    }
    
    return await this.chromeStorage.saveSettings(settings.toObject());
  }

  /**
   * Update specific setting
   * @param {string} path - Dot notation path
   * @param {any} value - Value to set
   * @returns {Promise<void>}
   */
  async updateSetting(path, value) {
    return await this.chromeStorage.updateSetting(path, value);
  }

  // ===== AI SETTINGS OPERATIONS =====

  /**
   * Get AI settings
   * @returns {Promise<Object>}
   */
  async getAISettings() {
    const aiSettingsData = await this.chromeStorage.getAISettings();
    const aiSettings = this.models.AISettings.fromObject(aiSettingsData);
    
    const validation = aiSettings.validate();
    if (!validation.isValid) {
      console.warn('AI Settings validation failed, using defaults:', validation.errors);
      return new this.models.AISettings().toObject();
    }
    
    return aiSettings.toObject();
  }

  /**
   * Save AI settings
   * @param {Object} aiSettingsData - AI settings to save
   * @returns {Promise<void>}
   */
  async saveAISettings(aiSettingsData) {
    const aiSettings = this.models.AISettings.fromObject(aiSettingsData);
    const validation = aiSettings.validate();
    
    if (!validation.isValid) {
      throw new Error(`AI Settings validation failed: ${validation.errors.join(', ')}`);
    }
    
    return await this.chromeStorage.saveAISettings(aiSettings.toObject());
  }

  // ===== LICENSE OPERATIONS =====

  /**
   * Get license data
   * @returns {Promise<Object|null>}
   */
  async getLicenseData() {
    const licenseData = await this.chromeStorage.getLicenseData();
    if (!licenseData) return null;
    
    const license = this.models.License.fromObject(licenseData);
    const validation = license.validate();
    
    if (!validation.isValid) {
      console.warn('License validation failed:', validation.errors);
      return null;
    }
    
    return license.toObject();
  }

  /**
   * Save license data
   * @param {Object} licenseData - License data to save
   * @returns {Promise<void>}
   */
  async saveLicenseData(licenseData) {
    const license = this.models.License.fromObject(licenseData);
    const validation = license.validate();
    
    if (!validation.isValid) {
      throw new Error(`License validation failed: ${validation.errors.join(', ')}`);
    }
    
    return await this.chromeStorage.saveLicenseData(license.toObject());
  }

  /**
   * Get license status
   * @returns {Promise<string>}
   */
  async getLicenseStatus() {
    return await this.chromeStorage.getLicenseStatus();
  }

  /**
   * Check if user has Pro license
   * @returns {Promise<boolean>}
   */
  async hasProLicense() {
    const status = await this.getLicenseStatus();
    return status === 'pro';
  }

  /**
   * Check if specific feature is available
   * @param {string} feature - Feature to check
   * @returns {Promise<boolean>}
   */
  async hasFeature(feature) {
    const licenseData = await this.getLicenseData();
    if (!licenseData) return false;
    
    const license = this.models.License.fromObject(licenseData);
    return license.hasFeature(feature);
  }

  /**
   * Clear license data
   * @returns {Promise<void>}
   */
  async clearLicenseData() {
    return await this.chromeStorage.clearLicenseData();
  }

  // ===== IMPORT/EXPORT OPERATIONS =====

  /**
   * Export templates as Ad Pack
   * @param {string[]} templateIds - Template IDs to export (null for all)
   * @returns {Promise<Object>} Ad Pack data
   */
  async exportTemplates(templateIds = null) {
    await this.initialize();
    
    let templates;
    if (templateIds) {
      templates = await Promise.all(
        templateIds.map(id => this.getTemplate(id))
      );
      templates = templates.filter(t => t !== null);
    } else {
      templates = await this.getTemplates();
    }
    
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: templates,
      metadata: {
        totalTemplates: templates.length,
        exportType: templateIds ? 'selective' : 'full'
      }
    };
  }

  /**
   * Import Ad Pack templates
   * @param {Object} adPackData - Ad Pack data to import
   * @returns {Promise<Object>} Import result
   */
  async importAdPack(adPackData) {
    await this.initialize();
    
    // Validate Ad Pack structure
    if (!adPackData || !adPackData.templates || !Array.isArray(adPackData.templates)) {
      throw new Error('Invalid Ad Pack format');
    }
    
    // Migrate data if needed
    const migratedData = this.dataMigration.validateAndMigrate(adPackData, adPackData.version || 0);
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    // Import each template
    for (const templateData of migratedData.templates) {
      try {
        // Check if template already exists
        const existing = await this.getTemplate(templateData.id);
        if (existing) {
          results.skipped++;
          continue;
        }
        
        await this.saveTemplate(templateData);
        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import template ${templateData.id}: ${error.message}`);
      }
    }
    
    return results;
  }

  // ===== BACKUP AND RESTORE =====

  /**
   * Create full backup of all data
   * @returns {Promise<Object>} Backup data
   */
  async createBackup() {
    await this.initialize();
    
    const [templates, groups, settings, aiSettings, licenseData] = await Promise.all([
      this.getTemplates(),
      this.getAllGroupHistories(),
      this.getSettings(),
      this.getAISettings(),
      this.getLicenseData()
    ]);
    
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      data: {
        templates,
        groups,
        settings,
        aiSettings,
        license: licenseData
      }
    };
  }

  /**
   * Restore from backup
   * @param {Object} backupData - Backup data to restore
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup(backupData) {
    await this.initialize();
    
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup format');
    }
    
    // Migrate data if needed
    const migratedData = this.dataMigration.validateAndMigrate(backupData.data, backupData.version || 0);
    
    const results = {
      templates: { imported: 0, errors: [] },
      settings: { restored: false, error: null },
      aiSettings: { restored: false, error: null }
    };
    
    // Restore templates
    if (migratedData.templates) {
      for (const templateData of migratedData.templates) {
        try {
          await this.saveTemplate(templateData);
          results.templates.imported++;
        } catch (error) {
          results.templates.errors.push(`Failed to restore template ${templateData.id}: ${error.message}`);
        }
      }
    }
    
    // Restore settings
    if (migratedData.settings) {
      try {
        await this.saveSettings(migratedData.settings);
        results.settings.restored = true;
      } catch (error) {
        results.settings.error = error.message;
      }
    }
    
    // Restore AI settings
    if (migratedData.aiSettings) {
      try {
        await this.saveAISettings(migratedData.aiSettings);
        results.aiSettings.restored = true;
      } catch (error) {
        results.aiSettings.error = error.message;
      }
    }
    
    return results;
  }

  // ===== UTILITY METHODS =====

  /**
   * Clear all data (for testing/reset)
   * @returns {Promise<void>}
   */
  async clearAllData() {
    await this.initialize();
    
    await Promise.all([
      this.indexedDB.clearAllData(),
      this.chromeStorage.clear()
    ]);
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    await this.initialize();
    
    const [templates, groups] = await Promise.all([
      this.getTemplates(),
      this.getAllGroupHistories()
    ]);
    
    return {
      templates: {
        count: templates.length,
        totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)
      },
      groups: {
        count: groups.length,
        totalComments: groups.reduce((sum, g) => sum + (g.totalComments || 0), 0)
      }
    };
  }

  /**
   * Close all storage connections
   */
  close() {
    this.indexedDB.close();
    this.initialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} else {
  window.StorageManager = StorageManager;
}