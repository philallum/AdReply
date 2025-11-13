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
      preferredCategory: '',
      ...data.templates
    };
    
    // v2.0 fields
    this.businessDescription = data.businessDescription || '';
    this.companyUrl = data.companyUrl || '';
    this.aiProvider = data.aiProvider || 'gemini'; // 'gemini' | 'openai'
    this.aiKeyEncrypted = data.aiKeyEncrypted || '';
    this.onboardingCompleted = data.onboardingCompleted !== undefined ? data.onboardingCompleted : false;
    this.affiliateLinks = {
      default: '',
      categoryOverrides: {},
      ...(data.affiliateLinks || {})
    };
    this.adPackMetadata = data.adPackMetadata || [];
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

      if (typeof this.templates.preferredCategory !== 'string') {
        errors.push('Preferred category must be a string');
      }
    }

    // v2.0 fields validation
    if (typeof this.businessDescription !== 'string') {
      errors.push('Business description must be a string');
    }

    if (this.businessDescription && (this.businessDescription.length < 50 || this.businessDescription.length > 500)) {
      errors.push('Business description must be between 50 and 500 characters');
    }

    if (typeof this.companyUrl !== 'string') {
      errors.push('Company URL must be a string');
    }

    if (this.companyUrl && !this.isValidUrl(this.companyUrl)) {
      errors.push('Company URL must be a valid URL');
    }

    const validAIProviders = ['gemini', 'openai'];
    if (!validAIProviders.includes(this.aiProvider)) {
      errors.push(`AI provider must be one of: ${validAIProviders.join(', ')}`);
    }

    if (typeof this.aiKeyEncrypted !== 'string') {
      errors.push('AI key encrypted must be a string');
    }

    if (typeof this.onboardingCompleted !== 'boolean') {
      errors.push('Onboarding completed must be a boolean');
    }

    if (typeof this.affiliateLinks !== 'object' || this.affiliateLinks === null) {
      errors.push('Affiliate links must be an object');
    } else {
      if (typeof this.affiliateLinks.default !== 'string') {
        errors.push('Affiliate links default must be a string');
      }

      if (this.affiliateLinks.default && !this.isValidUrl(this.affiliateLinks.default)) {
        errors.push('Affiliate links default must be a valid URL');
      }

      if (typeof this.affiliateLinks.categoryOverrides !== 'object' || this.affiliateLinks.categoryOverrides === null) {
        errors.push('Affiliate links category overrides must be an object');
      } else {
        Object.entries(this.affiliateLinks.categoryOverrides).forEach(([categoryId, url]) => {
          if (typeof url !== 'string') {
            errors.push(`Affiliate link for category ${categoryId} must be a string`);
          } else if (url && !this.isValidUrl(url)) {
            errors.push(`Affiliate link for category ${categoryId} must be a valid URL`);
          }
        });
      }
    }

    if (!Array.isArray(this.adPackMetadata)) {
      errors.push('Ad Pack metadata must be an array');
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
      templates: { ...this.templates },
      businessDescription: this.businessDescription,
      companyUrl: this.companyUrl,
      aiProvider: this.aiProvider,
      aiKeyEncrypted: this.aiKeyEncrypted,
      onboardingCompleted: this.onboardingCompleted,
      affiliateLinks: {
        default: this.affiliateLinks.default,
        categoryOverrides: { ...this.affiliateLinks.categoryOverrides }
      },
      adPackMetadata: this.adPackMetadata || []
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

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false;
    }
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
 * KeywordStats Model (v2.0)
 * Tracks keyword performance for learning engine
 */
class KeywordStats {
  constructor(data = {}) {
    this.keyword = data.keyword || '';
    this.categoryId = data.categoryId || '';
    this.matches = data.matches || 0;
    this.chosen = data.chosen || 0;
    this.ignored = data.ignored || 0;
    this.score = data.score || 0.0;
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }

  /**
   * Validate keyword stats data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    if (!this.keyword || typeof this.keyword !== 'string' || this.keyword.trim().length === 0) {
      errors.push('Keyword is required and must be a non-empty string');
    }

    if (!this.categoryId || typeof this.categoryId !== 'string' || this.categoryId.trim().length === 0) {
      errors.push('Category ID is required and must be a non-empty string');
    }

    if (typeof this.matches !== 'number' || this.matches < 0) {
      errors.push('Matches must be a non-negative number');
    }

    if (typeof this.chosen !== 'number' || this.chosen < 0) {
      errors.push('Chosen must be a non-negative number');
    }

    if (typeof this.ignored !== 'number' || this.ignored < 0) {
      errors.push('Ignored must be a non-negative number');
    }

    if (typeof this.score !== 'number' || this.score < 0 || this.score > 1) {
      errors.push('Score must be a number between 0 and 1');
    }

    if (this.lastUpdated && !this.isValidISODate(this.lastUpdated)) {
      errors.push('Last updated must be a valid ISO date string');
    }

    if (this.chosen > this.matches) {
      errors.push('Chosen count cannot exceed matches count');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update score based on matches and chosen
   */
  updateScore() {
    this.score = this.matches > 0 ? this.chosen / this.matches : 0;
    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Check if keyword should be suggested for removal
   * @param {number} threshold - Score threshold (default 0.1)
   * @param {number} minMatches - Minimum matches required (default 20)
   * @returns {boolean}
   */
  shouldSuggestRemoval(threshold = 0.1, minMatches = 20) {
    return this.matches >= minMatches && this.score < threshold;
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      keyword: this.keyword,
      categoryId: this.categoryId,
      matches: this.matches,
      chosen: this.chosen,
      ignored: this.ignored,
      score: this.score,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Create keyword stats from plain object
   * @param {Object} data - Plain object data
   * @returns {KeywordStats}
   */
  static fromObject(data) {
    return new KeywordStats(data);
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * AdPack Model (v2.0)
 * Represents a portable collection of categories and templates
 */
class AdPack {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.niche = data.niche || '';
    this.version = data.version || '1.0.0';
    this.author = data.author || 'anonymous';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.categories = data.categories || [];
    this.metadata = {
      totalTemplates: 0,
      totalCategories: 0,
      downloadCount: 0,
      ...(data.metadata || {})
    };
  }

  /**
   * Validate ad pack data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    if (!this.id || typeof this.id !== 'string' || this.id.trim().length === 0) {
      errors.push('Ad Pack ID is required and must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      errors.push('Ad Pack name is required and must be a non-empty string');
    }

    if (!this.niche || typeof this.niche !== 'string' || this.niche.trim().length === 0) {
      errors.push('Ad Pack niche is required and must be a non-empty string');
    }

    if (!this.version || typeof this.version !== 'string' || !this.isValidVersion(this.version)) {
      errors.push('Ad Pack version must be a valid semantic version (e.g., 1.0.0)');
    }

    if (typeof this.author !== 'string') {
      errors.push('Ad Pack author must be a string');
    }

    if (typeof this.description !== 'string') {
      errors.push('Ad Pack description must be a string');
    }

    if (this.createdAt && !this.isValidISODate(this.createdAt)) {
      errors.push('Created date must be a valid ISO date string');
    }

    if (!Array.isArray(this.categories)) {
      errors.push('Categories must be an array');
    } else if (this.categories.length === 0) {
      errors.push('Ad Pack must contain at least one category');
    }

    if (typeof this.metadata !== 'object' || this.metadata === null) {
      errors.push('Metadata must be an object');
    } else {
      if (typeof this.metadata.totalTemplates !== 'number' || this.metadata.totalTemplates < 0) {
        errors.push('Metadata total templates must be a non-negative number');
      }

      if (typeof this.metadata.totalCategories !== 'number' || this.metadata.totalCategories < 0) {
        errors.push('Metadata total categories must be a non-negative number');
      }

      if (typeof this.metadata.downloadCount !== 'number' || this.metadata.downloadCount < 0) {
        errors.push('Metadata download count must be a non-negative number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update metadata based on categories
   */
  updateMetadata() {
    this.metadata.totalCategories = this.categories.length;
    this.metadata.totalTemplates = this.categories.reduce((sum, cat) => {
      return sum + (cat.templates ? cat.templates.length : 0);
    }, 0);
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      niche: this.niche,
      version: this.version,
      author: this.author,
      description: this.description,
      createdAt: this.createdAt,
      categories: this.categories,
      metadata: { ...this.metadata }
    };
  }

  /**
   * Create ad pack from plain object
   * @param {Object} data - Plain object data
   * @returns {AdPack}
   */
  static fromObject(data) {
    return new AdPack(data);
  }

  generateId() {
    return `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isValidVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * BackupDataV2 Model (v2.0)
 * Extended backup format including v2.0 features
 */
class BackupDataV2 {
  constructor(data = {}) {
    this.version = 2;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.data = {
      // v1 data
      templates: data.data?.templates || [],
      groups: data.data?.groups || [],
      settings: data.data?.settings || {},
      aiSettings: data.data?.aiSettings || {},
      license: data.data?.license || null,
      
      // v2 data
      keywordStats: data.data?.keywordStats || {},
      affiliateLinks: data.data?.affiliateLinks || { default: '', categoryOverrides: {} },
      adPackMetadata: data.data?.adPackMetadata || [],
      onboardingData: {
        businessDescription: '',
        aiProvider: '',
        completedAt: '',
        ...(data.data?.onboardingData || {})
      }
    };
  }

  /**
   * Validate backup data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    if (this.version !== 2) {
      errors.push('Backup version must be 2');
    }

    if (!this.createdAt || !this.isValidISODate(this.createdAt)) {
      errors.push('Created date must be a valid ISO date string');
    }

    if (typeof this.data !== 'object' || this.data === null) {
      errors.push('Backup data must be an object');
    } else {
      // Validate v1 data structures
      if (!Array.isArray(this.data.templates)) {
        errors.push('Templates must be an array');
      }

      if (!Array.isArray(this.data.groups)) {
        errors.push('Groups must be an array');
      }

      if (typeof this.data.settings !== 'object' || this.data.settings === null) {
        errors.push('Settings must be an object');
      }

      if (typeof this.data.aiSettings !== 'object' || this.data.aiSettings === null) {
        errors.push('AI Settings must be an object');
      }

      // Validate v2 data structures
      if (typeof this.data.keywordStats !== 'object' || this.data.keywordStats === null) {
        errors.push('Keyword stats must be an object');
      }

      if (typeof this.data.affiliateLinks !== 'object' || this.data.affiliateLinks === null) {
        errors.push('Affiliate links must be an object');
      } else {
        if (typeof this.data.affiliateLinks.default !== 'string') {
          errors.push('Affiliate links default must be a string');
        }

        if (typeof this.data.affiliateLinks.categoryOverrides !== 'object') {
          errors.push('Affiliate links category overrides must be an object');
        }
      }

      if (!Array.isArray(this.data.adPackMetadata)) {
        errors.push('Ad Pack metadata must be an array');
      }

      if (typeof this.data.onboardingData !== 'object' || this.data.onboardingData === null) {
        errors.push('Onboarding data must be an object');
      } else {
        if (typeof this.data.onboardingData.businessDescription !== 'string') {
          errors.push('Onboarding business description must be a string');
        }

        if (typeof this.data.onboardingData.aiProvider !== 'string') {
          errors.push('Onboarding AI provider must be a string');
        }

        if (typeof this.data.onboardingData.completedAt !== 'string') {
          errors.push('Onboarding completed at must be a string');
        }
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
      version: this.version,
      createdAt: this.createdAt,
      data: {
        templates: this.data.templates,
        groups: this.data.groups,
        settings: this.data.settings,
        aiSettings: this.data.aiSettings,
        license: this.data.license,
        keywordStats: this.data.keywordStats,
        affiliateLinks: {
          default: this.data.affiliateLinks.default,
          categoryOverrides: { ...this.data.affiliateLinks.categoryOverrides }
        },
        adPackMetadata: this.data.adPackMetadata,
        onboardingData: { ...this.data.onboardingData }
      }
    };
  }

  /**
   * Create backup data from plain object
   * @param {Object} data - Plain object data
   * @returns {BackupDataV2}
   */
  static fromObject(data) {
    return new BackupDataV2(data);
  }

  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }
}

/**
 * Data Migration Utilities
 * Handles schema changes and data migrations
 */
class DataMigration {
  constructor() {
    this.currentVersion = 2;
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

    // Migration from version 0 to 1
    if (fromVersion < 1) {
      migratedData = this.migrateToV1(migratedData);
    }

    // Migration from version 1 to 2
    if (fromVersion < 2) {
      migratedData = this.migrateToV2(migratedData);
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
   * Migrate to version 2
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  migrateToV2(data) {
    // Add v2.0 fields to settings
    if (data.settings) {
      data.settings = {
        ...data.settings,
        businessDescription: data.settings.businessDescription || '',
        companyUrl: data.settings.companyUrl || '',
        aiProvider: data.settings.aiProvider || 'gemini',
        aiKeyEncrypted: data.settings.aiKeyEncrypted || '',
        onboardingCompleted: data.settings.onboardingCompleted !== undefined ? data.settings.onboardingCompleted : true, // true for existing users
        affiliateLinks: data.settings.affiliateLinks || {
          default: '',
          categoryOverrides: {}
        }
      };
    }

    // Add v2.0 data structures if not present
    if (!data.keywordStats) {
      data.keywordStats = {};
    }

    if (!data.adPackMetadata) {
      data.adPackMetadata = [];
    }

    if (!data.onboardingData) {
      data.onboardingData = {
        businessDescription: '',
        aiProvider: '',
        completedAt: ''
      };
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
    KeywordStats,
    AdPack,
    BackupDataV2,
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
    KeywordStats,
    AdPack,
    BackupDataV2,
    DataMigration
  };
}