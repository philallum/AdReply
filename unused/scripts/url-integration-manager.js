/**
 * URL Integration Manager for AdReply Extension
 * Ensures all templates work with the promotional URL system
 * and provides fallback templates with URL placeholders
 */

class URLIntegrationManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.urlPlaceholder = '{url}';
    this.fallbackTemplates = this.createFallbackTemplates();
  }

  /**
   * Ensure template has URL placeholder
   * @param {Object} template - Template to check
   * @returns {Object} Template with URL placeholder ensured
   */
  ensureURLPlaceholder(template) {
    if (!template || !template.template) {
      return template;
    }

    let templateText = template.template;
    
    // Check if template already has a URL placeholder
    if (this.hasURLPlaceholder(templateText)) {
      return template;
    }

    // Add URL placeholder to the end if missing
    templateText = this.addURLPlaceholder(templateText);

    return {
      ...template,
      template: templateText
    };
  }

  /**
   * Check if template text contains URL placeholder
   * @param {string} templateText - Template text to check
   * @returns {boolean} True if contains URL placeholder
   */
  hasURLPlaceholder(templateText) {
    if (!templateText || typeof templateText !== 'string') {
      return false;
    }

    // Check for various URL placeholder formats
    const urlPatterns = [
      /\{url\}/i,
      /\{website\}/i,
      /\{site\}/i,
      /\{link\}/i,
      // Also check for actual URLs that might be hardcoded
      /https?:\/\/[^\s]+/i
    ];

    return urlPatterns.some(pattern => pattern.test(templateText));
  }

  /**
   * Add URL placeholder to template text
   * @param {string} templateText - Original template text
   * @returns {string} Template text with URL placeholder
   */
  addURLPlaceholder(templateText) {
    if (!templateText || typeof templateText !== 'string') {
      return templateText;
    }

    let text = templateText.trim();
    
    // Remove trailing punctuation to add URL before it
    const trailingPunctuation = text.match(/[.!?]+$/);
    if (trailingPunctuation) {
      text = text.slice(0, -trailingPunctuation[0].length);
    }

    // Add URL placeholder
    text += ` ${this.urlPlaceholder}`;

    // Add back trailing punctuation if it existed
    if (trailingPunctuation) {
      text += trailingPunctuation[0];
    }

    return text;
  }

  /**
   * Process all templates to ensure URL integration
   * @param {Array} templates - Array of templates to process
   * @returns {Array} Processed templates with URL placeholders
   */
  processTemplatesForURLIntegration(templates) {
    if (!Array.isArray(templates)) {
      return templates;
    }

    return templates.map(template => this.ensureURLPlaceholder(template));
  }

  /**
   * Get fallback templates with URL placeholders for when no matches are found
   * @param {string} userCategory - User's preferred category
   * @returns {Array} Array of fallback templates
   */
  getFallbackTemplates(userCategory = null) {
    let fallbacks = [...this.fallbackTemplates];

    // If user has a preferred category, prioritize fallbacks for that category
    if (userCategory) {
      const categoryFallbacks = fallbacks.filter(template => template.category === userCategory);
      const otherFallbacks = fallbacks.filter(template => template.category !== userCategory);
      
      // Put category-specific fallbacks first
      fallbacks = [...categoryFallbacks, ...otherFallbacks];
    }

    return fallbacks.slice(0, 3); // Return top 3 fallback templates
  }

  /**
   * Create default fallback templates with URL placeholders
   * @returns {Array} Array of fallback template objects
   */
  createFallbackTemplates() {
    return [
      {
        id: 'fallback_general_1',
        label: 'General Business Offer',
        category: 'professional',
        keywords: ['business', 'service', 'help', 'professional'],
        template: 'Great post! If you need professional help with this, we\'re here to assist! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_general_2',
        label: 'Service Availability',
        category: 'professional',
        keywords: ['service', 'available', 'help', 'support'],
        template: 'Nice! We offer services in this area if you\'re looking for professional help! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_general_3',
        label: 'Expert Assistance',
        category: 'professional',
        keywords: ['expert', 'assistance', 'professional', 'quality'],
        template: 'Excellent post! Our team specializes in this area - feel free to reach out! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_automotive',
        label: 'Automotive Services',
        category: 'automotive',
        keywords: ['car', 'auto', 'vehicle', 'repair'],
        template: 'Nice ride! If you ever need automotive services, we\'ve got you covered! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_home_services',
        label: 'Home Services',
        category: 'home-services',
        keywords: ['home', 'house', 'repair', 'maintenance'],
        template: 'Beautiful home! We provide professional home services if you need any help! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_fitness',
        label: 'Fitness Services',
        category: 'fitness',
        keywords: ['fitness', 'workout', 'health', 'training'],
        template: 'Great fitness motivation! We offer professional training services if interested! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_food',
        label: 'Food Services',
        category: 'food',
        keywords: ['food', 'restaurant', 'cooking', 'meal'],
        template: 'Looks delicious! Check out our food services for your next event! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      },
      {
        id: 'fallback_technology',
        label: 'Technology Services',
        category: 'technology',
        keywords: ['tech', 'computer', 'software', 'digital'],
        template: 'Great tech content! We provide professional technology services! {url}',
        isPrebuilt: true,
        isFallback: true,
        usageCount: 0
      }
    ];
  }

  /**
   * Validate promotional URL format
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validatePromotionalURL(url) {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL is required'
      };
    }

    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length === 0) {
      return {
        isValid: false,
        error: 'URL cannot be empty'
      };
    }

    // Check if URL has protocol
    if (!trimmedUrl.match(/^https?:\/\//i)) {
      // Try to fix by adding https://
      const fixedUrl = `https://${trimmedUrl}`;
      
      try {
        new URL(fixedUrl);
        return {
          isValid: true,
          correctedUrl: fixedUrl,
          warning: 'Added https:// protocol to URL'
        };
      } catch (error) {
        return {
          isValid: false,
          error: 'Invalid URL format'
        };
      }
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
      return {
        isValid: true,
        url: trimmedUrl
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Get user's promotional URL from storage
   * @returns {Promise<string|null>} User's promotional URL or null
   */
  async getUserPromotionalURL() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['defaultPromoUrl']);
        return result.defaultPromoUrl || null;
      }
      return null;
    } catch (error) {
      console.error('URLIntegrationManager: Error getting promotional URL:', error);
      return null;
    }
  }

  /**
   * Save user's promotional URL to storage
   * @param {string} url - URL to save
   * @returns {Promise<Object>} Save result
   */
  async saveUserPromotionalURL(url) {
    try {
      const validation = this.validatePromotionalURL(url);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const urlToSave = validation.correctedUrl || validation.url;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ defaultPromoUrl: urlToSave });
        
        return {
          success: true,
          url: urlToSave,
          warning: validation.warning || null
        };
      }

      return {
        success: false,
        error: 'Storage not available'
      };

    } catch (error) {
      console.error('URLIntegrationManager: Error saving promotional URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Replace URL placeholders in template text with actual promotional URL
   * @param {string} templateText - Template text with placeholders
   * @param {string} promotionalUrl - User's promotional URL
   * @returns {string} Text with URL placeholders replaced
   */
  replaceURLPlaceholders(templateText, promotionalUrl) {
    if (!templateText || typeof templateText !== 'string') {
      return templateText;
    }

    if (!promotionalUrl || typeof promotionalUrl !== 'string') {
      // If no promotional URL, remove the placeholder
      return templateText.replace(/\s*\{url\}\s*/gi, '').trim();
    }

    // Replace all URL-related placeholders
    let processedText = templateText;
    
    const urlPlaceholders = [
      /\{url\}/gi,
      /\{website\}/gi,
      /\{site\}/gi,
      /\{link\}/gi
    ];

    urlPlaceholders.forEach(placeholder => {
      processedText = processedText.replace(placeholder, promotionalUrl);
    });

    return processedText;
  }

  /**
   * Migrate existing templates to ensure URL integration
   * @returns {Promise<Object>} Migration result
   */
  async migrateTemplatesForURLIntegration() {
    try {
      console.log('URLIntegrationManager: Migrating templates for URL integration...');
      
      // Get all existing templates
      const allData = await this.storageManager.getAllData();
      const templates = allData.templates || [];
      
      let migratedCount = 0;
      const migratedTemplates = templates.map(template => {
        const originalTemplate = template.template;
        const processedTemplate = this.ensureURLPlaceholder(template);
        
        if (processedTemplate.template !== originalTemplate) {
          migratedCount++;
        }
        
        return processedTemplate;
      });

      // Save migrated templates
      await this.storageManager.saveData({ templates: migratedTemplates });

      console.log(`URLIntegrationManager: Migration completed. ${migratedCount} templates updated with URL placeholders`);
      
      return {
        success: true,
        totalTemplates: templates.length,
        migratedCount: migratedCount
      };

    } catch (error) {
      console.error('URLIntegrationManager: Error migrating templates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get URL integration status for all templates
   * @returns {Promise<Object>} Integration status
   */
  async getURLIntegrationStatus() {
    try {
      const allData = await this.storageManager.getAllData();
      const templates = allData.templates || [];
      
      let withURL = 0;
      let withoutURL = 0;
      
      templates.forEach(template => {
        if (this.hasURLPlaceholder(template.template)) {
          withURL++;
        } else {
          withoutURL++;
        }
      });

      const userURL = await this.getUserPromotionalURL();
      
      return {
        totalTemplates: templates.length,
        templatesWithURL: withURL,
        templatesWithoutURL: withoutURL,
        integrationPercentage: templates.length > 0 ? Math.round((withURL / templates.length) * 100) : 0,
        hasUserURL: !!userURL,
        userURL: userURL
      };

    } catch (error) {
      console.error('URLIntegrationManager: Error getting integration status:', error);
      return {
        totalTemplates: 0,
        templatesWithURL: 0,
        templatesWithoutURL: 0,
        integrationPercentage: 0,
        hasUserURL: false,
        userURL: null,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = URLIntegrationManager;
} else {
  window.URLIntegrationManager = URLIntegrationManager;
}