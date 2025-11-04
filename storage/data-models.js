/**
 * Data Models and Validation Schemas for AdReply Extension
 * Defines TypeScript-like interfaces and validation functions for all data models
 */

/**
 * Template Model
 * Represents an individual advertisement comment template without variants
 */
class Template {
  constructor(data = {}) {
    this.id = data.id || '';
    this.label = data.label || '';
    this.category = data.category || 'custom';
    this.keywords = data.keywords || [];
    this.template = data.template || '';
    this.isPrebuilt = data.isPrebuilt || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.usageCount = data.usageCount || 0;
  }

  /**
   * Validate template data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.id || typeof this.id !== 'string' || this.id.trim().length === 0) {
      errors.push('Template ID is required and must be a non-empty string');
    }

    if (!this.label || typeof this.label !== 'string' || this.label.trim().length === 0) {
      errors.push('Template label is required and must be a non-empty string');
    }

    if (!this.template || typeof this.template !== 'string' || this.template.trim().length === 0) {
      errors.push('Template content is required and must be a non-empty string');
    }

    // Category validation
    if (!this.category || typeof this.category !== 'string' || this.category.trim().length === 0) {
      errors.push('Template category is required and must be a non-empty string');
    }

    // Array fields
    if (!Array.isArray(this.keywords)) {
      errors.push('Keywords must be an array');
    } else {
      this.keywords.forEach((keyword, index) => {
        if (typeof keyword !== 'string') {
          errors.push(`Keyword at index ${index} must be a string`);
        }
      });
    }

    // Boolean fields
    if (typeof this.isPrebuilt !== 'boolean') {
      errors.push('isPrebuilt must be a boolean');
    }

    // Date fields
    if (this.createdAt && !this.isValidISODate(this.createdAt)) {
      errors.push('Created date must be a valid ISO date string');
    }

    if (this.updatedAt && !this.isValidISODate(this.updatedAt)) {
      errors.push('Updated date must be a valid ISO date string');
    }

    // Usage count
    if (typeof this.usageCount !== 'number' || this.usageCount < 0) {
      errors.push('Usage count must be a non-negative number');
    }

    // Business rules
    if (this.label && this.label.length > 100) {
      errors.push('Template label must be 100 characters or less');
    }

    if (this.template && this.template.length > 1000) {
      errors.push('Template content must be 1000 characters or less');
    }

    if (this.keywords && this.keywords.length > 20) {
      errors.push('Template can have at most 20 keywords');
    }

    if (this.category && this.category.length > 50) {
      errors.push('Template category must be 50 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize template data
   * @returns {Template} Sanitized template
   */
  sanitize() {
    const sanitized = new Template({
      id: this.sanitizeString(this.id),
      label: this.sanitizeString(this.label),
      category: this.sanitizeString(this.category),
      template: this.sanitizeString(this.template),
      keywords: this.keywords.map(k => this.sanitizeString(k)).filter(k => k.length > 0),
      isPrebuilt: this.isPrebuilt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      usageCount: this.usageCount
    });

    return sanitized;
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      label: this.label,
      category: this.category,
      keywords: this.keywords,
      template: this.template,
      isPrebuilt: this.isPrebuilt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      usageCount: this.usageCount
    };
  }

  /**
   * Create template from plain object
   * @param {Object} data - Plain object data
   * @returns {Template}
   */
  static fromObject(data) {
    return new Template(data);
  }

  // Utility methods
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;')
              .trim();
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * Category Model
 * Represents a template category for organizing templates by business niche
 */
class Category {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.isPrebuilt = data.isPrebuilt || false;
    this.templateCount = data.templateCount || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Validate category data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.id || typeof this.id !== 'string' || this.id.trim().length === 0) {
      errors.push('Category ID is required and must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Category name is required and must be a non-empty string');
    }

    // Optional fields validation
    if (this.description && typeof this.description !== 'string') {
      errors.push('Category description must be a string');
    }

    if (typeof this.isPrebuilt !== 'boolean') {
      errors.push('isPrebuilt must be a boolean');
    }

    if (typeof this.templateCount !== 'number' || this.templateCount < 0) {
      errors.push('Template count must be a non-negative number');
    }

    // Date fields
    if (this.createdAt && !this.isValidISODate(this.createdAt)) {
      errors.push('Created date must be a valid ISO date string');
    }

    // Business rules
    if (this.name && this.name.length > 100) {
      errors.push('Category name must be 100 characters or less');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Category description must be 500 characters or less');
    }

    if (this.id && this.id.length > 50) {
      errors.push('Category ID must be 50 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize category data
   * @returns {Category} Sanitized category
   */
  sanitize() {
    return new Category({
      id: this.sanitizeString(this.id),
      name: this.sanitizeString(this.name),
      description: this.sanitizeString(this.description),
      isPrebuilt: this.isPrebuilt,
      templateCount: this.templateCount,
      createdAt: this.createdAt
    });
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isPrebuilt: this.isPrebuilt,
      templateCount: this.templateCount,
      createdAt: this.createdAt
    };
  }

  /**
   * Create category from plain object
   * @param {Object} data - Plain object data
   * @returns {Category}
   */
  static fromObject(data) {
    return new Category(data);
  }

  // Utility methods
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;')
              .trim();
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * Group History Model
 * Tracks template usage history for Facebook groups
 */
class GroupHistory {
  constructor(data = {}) {
    this.groupId = data.groupId || '';
    this.name = data.name || '';
    this.lastTemplateId = data.lastTemplateId || null;
    this.lastVariantIndex = data.lastVariantIndex || 0;
    this.lastUsedAt = data.lastUsedAt || null;
    this.totalComments = data.totalComments || 0;
  }

  /**
   * Validate group history data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.groupId || typeof this.groupId !== 'string' || this.groupId.trim().length === 0) {
      errors.push('Group ID is required and must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Group name is required and must be a non-empty string');
    }

    // Optional fields validation
    if (this.lastTemplateId !== null && (typeof this.lastTemplateId !== 'string' || this.lastTemplateId.trim().length === 0)) {
      errors.push('Last template ID must be null or a non-empty string');
    }

    if (typeof this.lastVariantIndex !== 'number' || this.lastVariantIndex < 0) {
      errors.push('Last variant index must be a non-negative number');
    }

    if (this.lastUsedAt !== null && !this.isValidISODate(this.lastUsedAt)) {
      errors.push('Last used date must be null or a valid ISO date string');
    }

    if (typeof this.totalComments !== 'number' || this.totalComments < 0) {
      errors.push('Total comments must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize group history data
   * @returns {GroupHistory} Sanitized group history
   */
  sanitize() {
    return new GroupHistory({
      groupId: this.sanitizeString(this.groupId),
      name: this.sanitizeString(this.name),
      lastTemplateId: this.lastTemplateId ? this.sanitizeString(this.lastTemplateId) : null,
      lastVariantIndex: this.lastVariantIndex,
      lastUsedAt: this.lastUsedAt,
      totalComments: this.totalComments
    });
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      groupId: this.groupId,
      name: this.name,
      lastTemplateId: this.lastTemplateId,
      lastVariantIndex: this.lastVariantIndex,
      lastUsedAt: this.lastUsedAt,
      totalComments: this.totalComments
    };
  }

  /**
   * Create group history from plain object
   * @param {Object} data - Plain object data
   * @returns {GroupHistory}
   */
  static fromObject(data) {
    return new GroupHistory(data);
  }

  // Utility methods
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;')
              .trim();
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * License Model
 * Represents user license and subscription information
 */
class License {
  constructor(data = {}) {
    this.token = data.token || '';
    this.status = data.status || 'free'; // 'free', 'pro', 'expired', 'revoked'
    this.tier = data.tier || 'free'; // 'free', 'pro'
    this.plan = data.plan || null; // 'monthly', 'yearly', null
    this.expiresAt = data.expiresAt || null;
    this.lastValidatedAt = data.lastValidatedAt || null;
    this.gracePeriodEnds = data.gracePeriodEnds || null;
    this.features = data.features || [];
  }

  /**
   * Validate license data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Status validation
    const validStatuses = ['free', 'pro', 'expired', 'revoked'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`License status must be one of: ${validStatuses.join(', ')}`);
    }

    // Tier validation
    const validTiers = ['free', 'pro'];
    if (!validTiers.includes(this.tier)) {
      errors.push(`License tier must be one of: ${validTiers.join(', ')}`);
    }

    // Plan validation
    const validPlans = ['monthly', 'yearly', null];
    if (!validPlans.includes(this.plan)) {
      errors.push('License plan must be "monthly", "yearly", or null');
    }

    // Token validation (basic)
    if (this.token && typeof this.token !== 'string') {
      errors.push('License token must be a string');
    }

    // Date validations
    if (this.expiresAt !== null && !this.isValidISODate(this.expiresAt)) {
      errors.push('Expires date must be null or a valid ISO date string');
    }

    if (this.lastValidatedAt !== null && !this.isValidISODate(this.lastValidatedAt)) {
      errors.push('Last validated date must be null or a valid ISO date string');
    }

    if (this.gracePeriodEnds !== null && !this.isValidISODate(this.gracePeriodEnds)) {
      errors.push('Grace period end date must be null or a valid ISO date string');
    }

    // Features validation
    if (!Array.isArray(this.features)) {
      errors.push('Features must be an array');
    } else {
      const validFeatures = ['unlimited_templates', 'ai_integration', 'ad_packs', 'priority_support'];
      this.features.forEach((feature, index) => {
        if (typeof feature !== 'string') {
          errors.push(`Feature at index ${index} must be a string`);
        } else if (!validFeatures.includes(feature)) {
          errors.push(`Invalid feature: ${feature}. Valid features: ${validFeatures.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if license has specific feature
   * @param {string} feature - Feature to check
   * @returns {boolean}
   */
  hasFeature(feature) {
    return this.features.includes(feature);
  }

  /**
   * Check if license is currently valid
   * @returns {boolean}
   */
  isValid() {
    if (this.status === 'revoked') return false;
    if (this.status === 'free') return true;
    
    if (this.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(this.expiresAt);
      
      if (now > expiryDate) {
        // Check grace period
        if (this.gracePeriodEnds) {
          const gracePeriodEnd = new Date(this.gracePeriodEnds);
          return now <= gracePeriodEnd;
        }
        return false;
      }
    }
    
    return this.status === 'pro';
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      token: this.token,
      status: this.status,
      tier: this.tier,
      plan: this.plan,
      expiresAt: this.expiresAt,
      lastValidatedAt: this.lastValidatedAt,
      gracePeriodEnds: this.gracePeriodEnds,
      features: this.features
    };
  }

  /**
   * Create license from plain object
   * @param {Object} data - Plain object data
   * @returns {License}
   */
  static fromObject(data) {
    return new License(data);
  }

  // Utility methods
  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * Settings Model
 * Represents user application settings
 */
class Settings {
  constructor(data = {}) {
    this.ui = {
      sidebarWidth: 320,
      theme: 'light',
      showUpgradePrompts: true,
      ...data.ui
    };
    
    this.templates = {
      maxSuggestions: 3,
      enableRotation: true,
      preventRepetition: true,
      ...data.templates
    };
  }

  /**
   * Validate settings data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // UI settings validation
    if (this.ui) {
      if (typeof this.ui.sidebarWidth !== 'number' || this.ui.sidebarWidth < 200 || this.ui.sidebarWidth > 600) {
        errors.push('Sidebar width must be a number between 200 and 600');
      }

      if (!['light', 'dark'].includes(this.ui.theme)) {
        errors.push('Theme must be "light" or "dark"');
      }

      if (typeof this.ui.showUpgradePrompts !== 'boolean') {
        errors.push('Show upgrade prompts must be a boolean');
      }
    }

    // Template settings validation
    if (this.templates) {
      if (typeof this.templates.maxSuggestions !== 'number' || this.templates.maxSuggestions < 1 || this.templates.maxSuggestions > 10) {
        errors.push('Max suggestions must be a number between 1 and 10');
      }

      if (typeof this.templates.enableRotation !== 'boolean') {
        errors.push('Enable rotation must be a boolean');
      }

      if (typeof this.templates.preventRepetition !== 'boolean') {
        errors.push('Prevent repetition must be a boolean');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      ui: { ...this.ui },
      templates: { ...this.templates }
    };
  }

  /**
   * Create settings from plain object
   * @param {Object} data - Plain object data
   * @returns {Settings}
   */
  static fromObject(data) {
    return new Settings(data);
  }
}

/**
 * AI Settings Model
 * Represents AI integration settings
 */
class AISettings {
  constructor(data = {}) {
    this.provider = data.provider || 'off'; // 'off', 'gemini', 'openai'
    this.geminiApiKey = data.geminiApiKey || '';
    this.openaiApiKey = data.openaiApiKey || '';
    this.enabled = data.enabled || false;
  }

  /**
   * Validate AI settings data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Provider validation
    const validProviders = ['off', 'gemini', 'openai'];
    if (!validProviders.includes(this.provider)) {
      errors.push(`AI provider must be one of: ${validProviders.join(', ')}`);
    }

    // API key validation
    if (typeof this.geminiApiKey !== 'string') {
      errors.push('Gemini API key must be a string');
    }

    if (typeof this.openaiApiKey !== 'string') {
      errors.push('OpenAI API key must be a string');
    }

    if (typeof this.enabled !== 'boolean') {
      errors.push('Enabled must be a boolean');
    }

    // Business rules
    if (this.enabled && this.provider === 'off') {
      errors.push('Cannot enable AI with provider set to "off"');
    }

    if (this.enabled && this.provider === 'gemini' && !this.geminiApiKey.trim()) {
      errors.push('Gemini API key is required when Gemini provider is enabled');
    }

    if (this.enabled && this.provider === 'openai' && !this.openaiApiKey.trim()) {
      errors.push('OpenAI API key is required when OpenAI provider is enabled');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      provider: this.provider,
      geminiApiKey: this.geminiApiKey,
      openaiApiKey: this.openaiApiKey,
      enabled: this.enabled
    };
  }

  /**
   * Create AI settings from plain object
   * @param {Object} data - Plain object data
   * @returns {AISettings}
   */
  static fromObject(data) {
    return new AISettings(data);
  }
}

/**
 * Data Migration Utilities
 * Handles schema changes and data migrations
 */
class DataMigration {
  constructor() {
    this.currentVersion = 1;
  }

  /**
   * Migrate data from old version to current version
   * @param {Object} data - Data to migrate
   * @param {number} fromVersion - Source version
   * @returns {Object} Migrated data
   */
  migrate(data, fromVersion) {
    if (fromVersion >= this.currentVersion) {
      return data; // No migration needed
    }

    let migratedData = { ...data };

    // Migration from version 0 to 1 (example)
    if (fromVersion < 1) {
      migratedData = this.migrateToV1(migratedData);
    }

    return migratedData;
  }

  /**
   * Migrate to version 1
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  migrateToV1(data) {
    // Migration: Convert variant-based templates to individual templates
    if (data.templates) {
      const migratedTemplates = [];
      
      data.templates.forEach(template => {
        // Create main template (convert from old structure)
        const mainTemplate = {
          ...template,
          category: template.category || 'custom',
          isPrebuilt: template.isPrebuilt || false,
          usageCount: template.usageCount || 0,
          createdAt: template.createdAt || new Date().toISOString(),
          updatedAt: template.updatedAt || new Date().toISOString()
        };
        
        // Remove old fields
        delete mainTemplate.variants;
        delete mainTemplate.verticals;
        
        migratedTemplates.push(mainTemplate);
        
        // Convert variants to individual templates if they exist
        if (template.variants && Array.isArray(template.variants)) {
          template.variants.forEach((variant, index) => {
            const variantTemplate = {
              id: `${template.id}_variant_${index + 1}`,
              label: `${template.label} (Variant ${index + 1})`,
              category: template.category || 'custom',
              keywords: template.keywords || [],
              template: variant,
              isPrebuilt: template.isPrebuilt || false,
              createdAt: template.createdAt || new Date().toISOString(),
              updatedAt: template.updatedAt || new Date().toISOString(),
              usageCount: 0
            };
            migratedTemplates.push(variantTemplate);
          });
        }
      });
      
      data.templates = migratedTemplates;
    }

    return data;
  }

  /**
   * Validate data structure and perform migration if needed
   * @param {Object} data - Data to validate and migrate
   * @param {number} version - Data version
   * @returns {Object} Validated and migrated data
   */
  validateAndMigrate(data, version = 0) {
    // Migrate data if needed
    const migratedData = this.migrate(data, version);

    // Validate migrated data
    const validationResults = {
      templates: [],
      groups: [],
      license: null,
      settings: null,
      aiSettings: null
    };

    // Validate templates
    if (migratedData.templates) {
      migratedData.templates.forEach((templateData, index) => {
        const template = Template.fromObject(templateData);
        const validation = template.validate();
        if (!validation.isValid) {
          console.warn(`Template ${index} validation failed:`, validation.errors);
        } else {
          validationResults.templates.push(template.sanitize().toObject());
        }
      });
    }

    // Validate groups
    if (migratedData.groups) {
      migratedData.groups.forEach((groupData, index) => {
        const group = GroupHistory.fromObject(groupData);
        const validation = group.validate();
        if (!validation.isValid) {
          console.warn(`Group ${index} validation failed:`, validation.errors);
        } else {
          validationResults.groups.push(group.sanitize().toObject());
        }
      });
    }

    // Validate license
    if (migratedData.license) {
      const license = License.fromObject(migratedData.license);
      const validation = license.validate();
      if (!validation.isValid) {
        console.warn('License validation failed:', validation.errors);
      } else {
        validationResults.license = license.toObject();
      }
    }

    // Validate settings
    if (migratedData.settings) {
      const settings = Settings.fromObject(migratedData.settings);
      const validation = settings.validate();
      if (!validation.isValid) {
        console.warn('Settings validation failed:', validation.errors);
      } else {
        validationResults.settings = settings.toObject();
      }
    }

    // Validate AI settings
    if (migratedData.aiSettings) {
      const aiSettings = AISettings.fromObject(migratedData.aiSettings);
      const validation = aiSettings.validate();
      if (!validation.isValid) {
        console.warn('AI Settings validation failed:', validation.errors);
      } else {
        validationResults.aiSettings = aiSettings.toObject();
      }
    }

    return validationResults;
  }
}

// Export all models and utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Template,
    Category,
    GroupHistory,
    License,
    Settings,
    AISettings,
    DataMigration
  };
} else {
  window.AdReplyModels = {
    Template,
    Category,
    GroupHistory,
    License,
    Settings,
    AISettings,
    DataMigration
  };
}