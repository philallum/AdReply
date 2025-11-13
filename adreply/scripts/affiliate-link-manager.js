/**
 * Affiliate Link Manager for AdReply Extension
 * Manages affiliate links and template rendering with {{link}} placeholders
 */

class AffiliateLinkManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.cache = {
      defaultLink: null,
      categoryOverrides: {},
      companyUrl: null,
      lastUpdate: null
    };
  }

  /**
   * Initialize the manager and load settings from storage
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.loadSettings();
    } catch (error) {
      console.error('AffiliateLinkManager: Error initializing:', error);
    }
  }

  /**
   * Load affiliate link settings from storage
   * @returns {Promise<void>}
   */
  async loadSettings() {
    try {
      const settings = await this.storageManager.getSettings();
      
      this.cache.defaultLink = settings.affiliateLinks?.default || null;
      this.cache.categoryOverrides = settings.affiliateLinks?.categoryOverrides || {};
      this.cache.companyUrl = settings.companyUrl || null;
      this.cache.lastUpdate = Date.now();
      
      console.log('AffiliateLinkManager: Settings loaded', {
        hasDefaultLink: !!this.cache.defaultLink,
        overrideCount: Object.keys(this.cache.categoryOverrides).length,
        hasCompanyUrl: !!this.cache.companyUrl
      });
    } catch (error) {
      console.error('AffiliateLinkManager: Error loading settings:', error);
      // Initialize with empty values on error
      this.cache.defaultLink = null;
      this.cache.categoryOverrides = {};
      this.cache.companyUrl = null;
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length === 0) {
      return { isValid: false, error: 'URL cannot be empty' };
    }

    // Check if URL has a protocol
    if (!trimmedUrl.match(/^https?:\/\//i)) {
      return { isValid: false, error: 'URL must start with http:// or https://' };
    }

    // Try to parse URL
    try {
      const urlObj = new URL(trimmedUrl);
      
      // Check if hostname is valid
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return { isValid: false, error: 'Invalid URL hostname' };
      }

      return { isValid: true, url: trimmedUrl };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Set default affiliate link
   * @param {string} url - Default affiliate link URL
   * @returns {Promise<Object>} Result with success status
   */
  async setDefaultLink(url) {
    try {
      // Validate URL
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Get current settings
      const settings = await this.storageManager.getSettings();
      
      // Initialize affiliateLinks if not exists
      if (!settings.affiliateLinks) {
        settings.affiliateLinks = {
          default: '',
          categoryOverrides: {}
        };
      }

      // Update default link
      settings.affiliateLinks.default = validation.url;

      // Save to storage
      await this.storageManager.saveSettings(settings);

      // Update cache
      this.cache.defaultLink = validation.url;
      this.cache.lastUpdate = Date.now();

      console.log('AffiliateLinkManager: Default link set:', validation.url);

      return { success: true, url: validation.url };
    } catch (error) {
      console.error('AffiliateLinkManager: Error setting default link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set category-specific affiliate link override
   * @param {string} categoryId - Category ID
   * @param {string} url - Affiliate link URL for this category
   * @returns {Promise<Object>} Result with success status
   */
  async setCategoryLink(categoryId, url) {
    try {
      if (!categoryId) {
        return { success: false, error: 'Category ID is required' };
      }

      // If URL is empty, remove the override
      if (!url || url.trim().length === 0) {
        return await this.removeCategoryLink(categoryId);
      }

      // Validate URL
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Get current settings
      const settings = await this.storageManager.getSettings();
      
      // Initialize affiliateLinks if not exists
      if (!settings.affiliateLinks) {
        settings.affiliateLinks = {
          default: '',
          categoryOverrides: {}
        };
      }

      // Update category override
      settings.affiliateLinks.categoryOverrides[categoryId] = validation.url;

      // Save to storage
      await this.storageManager.saveSettings(settings);

      // Update cache
      this.cache.categoryOverrides[categoryId] = validation.url;
      this.cache.lastUpdate = Date.now();

      console.log('AffiliateLinkManager: Category link set:', categoryId, validation.url);

      return { success: true, categoryId, url: validation.url };
    } catch (error) {
      console.error('AffiliateLinkManager: Error setting category link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove category-specific affiliate link override
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Result with success status
   */
  async removeCategoryLink(categoryId) {
    try {
      if (!categoryId) {
        return { success: false, error: 'Category ID is required' };
      }

      // Get current settings
      const settings = await this.storageManager.getSettings();
      
      // Initialize affiliateLinks if not exists
      if (!settings.affiliateLinks) {
        settings.affiliateLinks = {
          default: '',
          categoryOverrides: {}
        };
      }

      // Remove category override
      delete settings.affiliateLinks.categoryOverrides[categoryId];

      // Save to storage
      await this.storageManager.saveSettings(settings);

      // Update cache
      delete this.cache.categoryOverrides[categoryId];
      this.cache.lastUpdate = Date.now();

      console.log('AffiliateLinkManager: Category link removed:', categoryId);

      return { success: true, categoryId };
    } catch (error) {
      console.error('AffiliateLinkManager: Error removing category link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appropriate affiliate link for a category
   * @param {string} categoryId - Category ID (optional)
   * @returns {string|null} Affiliate link URL or null if not configured
   */
  getLink(categoryId = null) {
    // Refresh cache if stale (older than 5 minutes)
    const cacheAge = Date.now() - (this.cache.lastUpdate || 0);
    if (cacheAge > 5 * 60 * 1000) {
      // Cache is stale, trigger async refresh but return cached value
      this.loadSettings().catch(err => 
        console.error('AffiliateLinkManager: Error refreshing cache:', err)
      );
    }

    // Check for category-specific override first
    if (categoryId && this.cache.categoryOverrides[categoryId]) {
      return this.cache.categoryOverrides[categoryId];
    }

    // Fall back to default link
    return this.cache.defaultLink;
  }

  /**
   * Get all affiliate link settings
   * @returns {Object} All affiliate link settings
   */
  getAllLinks() {
    return {
      default: this.cache.defaultLink,
      categoryOverrides: { ...this.cache.categoryOverrides }
    };
  }

  /**
   * Render template with {{link}} placeholder replacement and company URL appending
   * @param {string} templateText - Template text with placeholders
   * @param {string} categoryId - Category ID for category-specific links
   * @param {Object} settings - Settings object (optional, for company URL)
   * @returns {string} Rendered template text
   */
  renderTemplate(templateText, categoryId = null, settings = null) {
    if (!templateText || typeof templateText !== 'string') {
      return '';
    }

    let rendered = templateText;

    // Get appropriate affiliate link
    const affiliateLink = this.getLink(categoryId);

    // Replace {{link}} placeholder
    if (rendered.includes('{{link}}')) {
      if (affiliateLink) {
        // Replace {{link}} with actual affiliate link
        rendered = rendered.replace(/\{\{link\}\}/g, affiliateLink);
      } else {
        // Remove lines containing {{link}} placeholder if no link configured
        rendered = rendered
          .split('\n')
          .filter(line => !line.includes('{{link}}'))
          .join('\n')
          .trim();
      }
    }

    // Append company URL if configured (existing feature)
    const companyUrl = settings?.companyUrl || this.cache.companyUrl;
    if (companyUrl && companyUrl.trim().length > 0) {
      rendered = rendered.trim() + '\n\n' + companyUrl.trim();
    }

    return rendered;
  }

  /**
   * Preview template rendering with all placeholders replaced
   * @param {string} templateText - Template text
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Preview result with rendered text
   */
  async previewTemplate(templateText, categoryId = null) {
    try {
      // Ensure settings are loaded
      if (!this.cache.lastUpdate) {
        await this.loadSettings();
      }

      const settings = await this.storageManager.getSettings();
      const rendered = this.renderTemplate(templateText, categoryId, settings);

      return {
        success: true,
        original: templateText,
        rendered: rendered,
        affiliateLink: this.getLink(categoryId),
        companyUrl: settings.companyUrl || null,
        hasAffiliateLink: !!this.getLink(categoryId),
        hasCompanyUrl: !!(settings.companyUrl && settings.companyUrl.trim().length > 0)
      };
    } catch (error) {
      console.error('AffiliateLinkManager: Error previewing template:', error);
      return {
        success: false,
        error: error.message,
        original: templateText,
        rendered: templateText
      };
    }
  }

  /**
   * Clear all affiliate link settings
   * @returns {Promise<Object>} Result with success status
   */
  async clearAllLinks() {
    try {
      const settings = await this.storageManager.getSettings();
      
      settings.affiliateLinks = {
        default: '',
        categoryOverrides: {}
      };

      await this.storageManager.saveSettings(settings);

      // Clear cache
      this.cache.defaultLink = null;
      this.cache.categoryOverrides = {};
      this.cache.lastUpdate = Date.now();

      console.log('AffiliateLinkManager: All links cleared');

      return { success: true };
    } catch (error) {
      console.error('AffiliateLinkManager: Error clearing links:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AffiliateLinkManager;
} else {
  window.AffiliateLinkManager = AffiliateLinkManager;
}
