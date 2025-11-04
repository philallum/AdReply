/**
 * Error Handling and Logging Integration for AdReply Extension
 * Integrates error handling and logging into existing components
 */

// Import error handler and logger
// Note: In Chrome extension, these would be loaded via script tags in manifest.json

/**
 * Enhanced Storage Manager with Error Handling and Logging
 */
class EnhancedStorageManager extends StorageManager {
  constructor() {
    super();
    this.errorHandler = new ErrorHandler();
    this.logger = getLogger().createChildLogger('StorageManager');
    this.performance = getPerformanceMonitor();
  }

  async initialize() {
    this.performance.startTimer('storage_initialization');
    
    try {
      this.logger.info('Initializing storage manager');
      await super.initialize();
      this.logger.info('Storage manager initialized successfully');
      
      this.performance.endTimer('storage_initialization');
      return true;
    } catch (error) {
      this.performance.endTimer('storage_initialization');
      
      const result = await this.errorHandler.handleError(error, 'storage_initialization', {
        retryFunction: () => super.initialize(),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.error('Failed to initialize storage manager', { error: error.message });
        throw error;
      }
      
      return true;
    }
  }

  async saveTemplate(templateData) {
    this.performance.startTimer('save_template');
    
    try {
      this.logger.debug('Saving template', { templateId: templateData.id, label: templateData.label });
      
      const result = await super.saveTemplate(templateData);
      
      this.logger.info('Template saved successfully', { templateId: result });
      this.performance.endTimer('save_template');
      
      return result;
    } catch (error) {
      this.performance.endTimer('save_template');
      
      const result = await this.errorHandler.handleError(error, 'save_template', {
        retryFunction: () => super.saveTemplate(templateData),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.error('Failed to save template', { 
          error: error.message, 
          templateId: templateData.id 
        });
        throw error;
      }
      
      return result.recovery?.result;
    }
  }

  async getTemplates(filters = {}) {
    this.performance.startTimer('get_templates');
    
    try {
      this.logger.debug('Retrieving templates', { filters });
      
      const templates = await super.getTemplates(filters);
      
      this.logger.debug('Templates retrieved', { count: templates.length });
      this.performance.endTimer('get_templates');
      
      return templates;
    } catch (error) {
      this.performance.endTimer('get_templates');
      
      const result = await this.errorHandler.handleError(error, 'get_templates', {
        retryFunction: () => super.getTemplates(filters),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.error('Failed to retrieve templates', { error: error.message, filters });
        return []; // Return empty array as fallback
      }
      
      return result.recovery?.result || [];
    }
  }
}

/**
 * Enhanced Template Engine with Error Handling and Logging
 */
class EnhancedTemplateEngine extends TemplateEngine {
  constructor(storageManager, aiService = null, licenseManager = null) {
    super(storageManager, aiService, licenseManager);
    this.errorHandler = new ErrorHandler();
    this.logger = getLogger().createChildLogger('TemplateEngine');
    this.performance = getPerformanceMonitor();
    this.debug = getDebugTools();
  }

  async getSuggestions(postContent, groupId, options = {}) {
    this.performance.startTimer('get_suggestions');
    
    try {
      this.logger.info('Getting suggestions for post', { 
        groupId, 
        postLength: postContent.length,
        options 
      });
      
      // Step 1: Match templates
      this.performance.startTimer('match_templates');
      const matchedTemplates = await this.matchTemplates(postContent, groupId);
      this.performance.endTimer('match_templates');
      
      this.logger.debug('Templates matched', { 
        matchCount: matchedTemplates.length,
        postContent: postContent.substring(0, 100) + '...'
      });
      
      if (matchedTemplates.length === 0) {
        this.logger.info('No templates matched for post content');
        this.debug.logTemplateMatching(postContent, [], [], []);
        this.performance.endTimer('get_suggestions');
        return [];
      }
      
      // Step 2: Apply rotation
      this.performance.startTimer('apply_rotation');
      const rotatedTemplates = await this.rotateTemplates(matchedTemplates, groupId);
      this.performance.endTimer('apply_rotation');
      
      this.logger.debug('Rotation applied', { 
        beforeRotation: matchedTemplates.length,
        afterRotation: rotatedTemplates.length
      });
      
      // Step 3: Generate suggestions
      this.performance.startTimer('generate_suggestions');
      const suggestions = await this.generateSuggestions(rotatedTemplates, groupId, options.maxSuggestions);
      this.performance.endTimer('generate_suggestions');
      
      this.logger.info('Suggestions generated', { 
        suggestionCount: suggestions.length,
        topScore: suggestions[0]?.score || 0
      });
      
      // Log debug information
      this.debug.logTemplateMatching(
        postContent,
        await this.storageManager.getTemplates(),
        matchedTemplates,
        suggestions
      );
      
      this.performance.endTimer('get_suggestions');
      return suggestions;
      
    } catch (error) {
      this.performance.endTimer('get_suggestions');
      
      const result = await this.errorHandler.handleError(error, 'get_suggestions', {
        retryFunction: () => super.getSuggestions(postContent, groupId, options),
        enableRetry: true,
        fallbackFunction: () => this.getFallbackSuggestions(postContent, groupId)
      });
      
      if (!result.success) {
        this.logger.error('Failed to get suggestions', { 
          error: error.message, 
          groupId, 
          postLength: postContent.length 
        });
        
        // Return fallback suggestions
        return this.getFallbackSuggestions(postContent, groupId);
      }
      
      return result.recovery?.result || [];
    }
  }

  async getFallbackSuggestions(postContent, groupId) {
    try {
      this.logger.info('Generating fallback suggestions');
      
      // Simple fallback: get most used templates
      const templates = await this.storageManager.getTemplates();
      const sortedByUsage = templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      const topTemplates = sortedByUsage.slice(0, 3);
      
      const fallbackSuggestions = topTemplates.map((template, index) => ({
        id: `fallback_${template.id}_${Date.now()}_${index}`,
        templateId: template.id,
        template: template,
        text: template.template,
        originalText: template.template,
        variantIndex: 0,
        isMainTemplate: true,
        score: 0.5,
        matchedKeywords: [],
        rank: index + 1,
        confidence: 'low',
        fallback: true
      }));
      
      this.logger.info('Fallback suggestions generated', { count: fallbackSuggestions.length });
      return fallbackSuggestions;
      
    } catch (fallbackError) {
      this.logger.error('Failed to generate fallback suggestions', { error: fallbackError.message });
      return [];
    }
  }
}

/**
 * Enhanced Facebook Integration with Error Handling and Logging
 */
class EnhancedFacebookIntegration extends FacebookIntegration {
  constructor() {
    super();
    this.errorHandler = new ErrorHandler();
    this.logger = getLogger().createChildLogger('FacebookIntegration');
    this.performance = getPerformanceMonitor();
    this.debug = getDebugTools();
  }

  initialize() {
    try {
      this.logger.info('Initializing Facebook integration');
      super.initialize();
      this.logger.info('Facebook integration initialized successfully');
      
      this.debug.logFacebookIntegration('initialize', {}, true);
    } catch (error) {
      this.logger.error('Failed to initialize Facebook integration', { error: error.message });
      this.debug.logFacebookIntegration('initialize', {}, false, error.message);
      throw error;
    }
  }

  async insertComment(commentText) {
    this.performance.startTimer('insert_comment');
    
    try {
      this.logger.info('Inserting comment', { textLength: commentText.length });
      
      const result = await super.insertComment(commentText);
      
      this.logger.info('Comment inserted successfully');
      this.debug.logFacebookIntegration('insert_comment', { textLength: commentText.length }, true);
      
      this.performance.endTimer('insert_comment');
      return result;
      
    } catch (error) {
      this.performance.endTimer('insert_comment');
      
      const result = await this.errorHandler.handleError(error, 'insert_comment', {
        retryFunction: () => super.insertComment(commentText),
        enableRetry: true
      });
      
      this.debug.logFacebookIntegration('insert_comment', { textLength: commentText.length }, result.success, error.message);
      
      if (!result.success) {
        this.logger.error('Failed to insert comment', { 
          error: error.message, 
          textLength: commentText.length 
        });
        throw error;
      }
      
      return result.recovery?.result;
    }
  }

  processPost(postElement) {
    try {
      this.performance.startTimer('process_post');
      
      super.processPost(postElement);
      
      this.performance.endTimer('process_post');
      this.debug.logFacebookIntegration('process_post', {}, true);
      
    } catch (error) {
      this.performance.endTimer('process_post');
      
      this.logger.warn('Failed to process post', { error: error.message });
      this.debug.logFacebookIntegration('process_post', {}, false, error.message);
      
      // Don't throw error for post processing failures - just log and continue
    }
  }
}

/**
 * Enhanced AI Service with Error Handling and Logging
 */
class EnhancedAIService extends AIService {
  constructor(storageManager) {
    super(storageManager);
    this.errorHandler = new ErrorHandler();
    this.logger = getLogger().createChildLogger('AIService');
    this.performance = getPerformanceMonitor();
  }

  async rephraseComment(originalText, context = '') {
    this.performance.startTimer('ai_rephrase');
    
    try {
      this.logger.info('Rephrasing comment with AI', { 
        textLength: originalText.length,
        hasContext: !!context 
      });
      
      const result = await super.rephraseComment(originalText, context);
      
      this.logger.info('Comment rephrased successfully', { 
        originalLength: originalText.length,
        rephrasedLength: result.length
      });
      
      this.performance.endTimer('ai_rephrase');
      return result;
      
    } catch (error) {
      this.performance.endTimer('ai_rephrase');
      
      const result = await this.errorHandler.handleError(error, 'ai_rephrase', {
        retryFunction: () => super.rephraseComment(originalText, context),
        enableRetry: true,
        fallbackFunction: () => originalText // Return original text as fallback
      });
      
      if (!result.success) {
        this.logger.warn('AI rephrasing failed, using original text', { 
          error: error.message,
          textLength: originalText.length
        });
        return originalText;
      }
      
      return result.recovery?.result || originalText;
    }
  }

  async generateTemplates(nicheDescription, count = 5) {
    this.performance.startTimer('ai_generate');
    
    try {
      this.logger.info('Generating templates with AI', { 
        nicheLength: nicheDescription.length,
        requestedCount: count
      });
      
      const templates = await super.generateTemplates(nicheDescription, count);
      
      this.logger.info('Templates generated successfully', { 
        generatedCount: templates.length
      });
      
      this.performance.endTimer('ai_generate');
      return templates;
      
    } catch (error) {
      this.performance.endTimer('ai_generate');
      
      const result = await this.errorHandler.handleError(error, 'ai_generate', {
        retryFunction: () => super.generateTemplates(nicheDescription, count),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.error('AI template generation failed', { 
          error: error.message,
          nicheDescription: nicheDescription.substring(0, 100)
        });
        return [];
      }
      
      return result.recovery?.result || [];
    }
  }
}

/**
 * Enhanced License Manager with Error Handling and Logging
 */
class EnhancedLicenseManager extends LicenseManager {
  constructor(storageManager) {
    super(storageManager);
    this.errorHandler = new ErrorHandler();
    this.logger = getLogger().createChildLogger('LicenseManager');
    this.performance = getPerformanceMonitor();
  }

  async validateLicense(token) {
    this.performance.startTimer('license_validation');
    
    try {
      this.logger.info('Validating license token');
      
      const result = await super.validateLicense(token);
      
      this.logger.info('License validation completed', { 
        isValid: result.isValid,
        tier: result.license?.tier
      });
      
      this.performance.endTimer('license_validation');
      return result;
      
    } catch (error) {
      this.performance.endTimer('license_validation');
      
      const result = await this.errorHandler.handleError(error, 'license_validation', {
        retryFunction: () => super.validateLicense(token),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.error('License validation failed', { error: error.message });
        
        // Return invalid license result as fallback
        return {
          isValid: false,
          error: error.message,
          license: null
        };
      }
      
      return result.recovery?.result;
    }
  }

  async performMonthlyCheck() {
    this.performance.startTimer('monthly_license_check');
    
    try {
      this.logger.info('Performing monthly license check');
      
      const result = await super.performMonthlyCheck();
      
      this.logger.info('Monthly license check completed');
      this.performance.endTimer('monthly_license_check');
      
      return result;
      
    } catch (error) {
      this.performance.endTimer('monthly_license_check');
      
      const result = await this.errorHandler.handleError(error, 'monthly_license_check', {
        retryFunction: () => super.performMonthlyCheck(),
        enableRetry: true
      });
      
      if (!result.success) {
        this.logger.warn('Monthly license check failed', { error: error.message });
        // Continue with grace period or offline mode
      }
      
      return result.recovery?.result;
    }
  }
}

/**
 * Initialize enhanced components with error handling and logging
 * @param {Object} options - Initialization options
 * @returns {Object} Enhanced component instances
 */
async function initializeEnhancedComponents(options = {}) {
  try {
    // Initialize logging system
    const logging = initializeLogging({
      debugMode: options.debugMode || false,
      level: options.logLevel || 2
    });

    logging.logger.info('Initializing enhanced AdReply components');

    // Initialize enhanced storage manager
    const storageManager = new EnhancedStorageManager();
    await storageManager.initialize();

    // Initialize enhanced license manager
    const licenseManager = new EnhancedLicenseManager(storageManager);
    await licenseManager.initialize();

    // Initialize enhanced AI service
    const aiService = new EnhancedAIService(storageManager);
    await aiService.initialize();

    // Initialize enhanced template engine
    const templateEngine = new EnhancedTemplateEngine(storageManager, aiService, licenseManager);

    // Initialize enhanced Facebook integration
    const facebookIntegration = new EnhancedFacebookIntegration();

    logging.logger.info('All enhanced components initialized successfully');

    return {
      storageManager,
      licenseManager,
      aiService,
      templateEngine,
      facebookIntegration,
      logging
    };

  } catch (error) {
    console.error('Failed to initialize enhanced components:', error);
    throw error;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EnhancedStorageManager,
    EnhancedTemplateEngine,
    EnhancedFacebookIntegration,
    EnhancedAIService,
    EnhancedLicenseManager,
    initializeEnhancedComponents
  };
} else {
  window.EnhancedStorageManager = EnhancedStorageManager;
  window.EnhancedTemplateEngine = EnhancedTemplateEngine;
  window.EnhancedFacebookIntegration = EnhancedFacebookIntegration;
  window.EnhancedAIService = EnhancedAIService;
  window.EnhancedLicenseManager = EnhancedLicenseManager;
  window.initializeEnhancedComponents = initializeEnhancedComponents;
}