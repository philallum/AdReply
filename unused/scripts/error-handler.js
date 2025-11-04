/**
 * Comprehensive Error Handling System for AdReply Extension
 * Provides error categorization, recovery strategies, and user-friendly notifications
 */

class ErrorHandler {
  constructor() {
    this.errorCategories = {
      STORAGE: 'storage',
      FACEBOOK: 'facebook',
      LICENSE: 'license',
      AI: 'ai',
      NETWORK: 'network',
      VALIDATION: 'validation',
      PERMISSION: 'permission',
      UNKNOWN: 'unknown'
    };

    this.errorSeverity = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2
    };

    this.errorHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Main error handling method
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Error handling result
   */
  async handleError(error, context = 'unknown', options = {}) {
    try {
      // Categorize the error
      const errorInfo = this.categorizeError(error, context);
      
      // Log the error
      this.logError(errorInfo);
      
      // Add to error history
      this.addToHistory(errorInfo);
      
      // Determine recovery strategy
      const recoveryStrategy = this.getRecoveryStrategy(errorInfo);
      
      // Execute recovery if possible
      let recoveryResult = null;
      if (recoveryStrategy && options.attemptRecovery !== false) {
        recoveryResult = await this.executeRecovery(recoveryStrategy, errorInfo, options);
      }
      
      // Generate user-friendly message
      const userMessage = this.generateUserMessage(errorInfo, recoveryResult);
      
      // Notify user if required
      if (this.shouldNotifyUser(errorInfo)) {
        await this.notifyUser(userMessage, errorInfo.severity);
      }
      
      return {
        success: recoveryResult?.success || false,
        error: errorInfo,
        recovery: recoveryResult,
        userMessage: userMessage,
        canRetry: this.canRetry(errorInfo)
      };
      
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      return {
        success: false,
        error: {
          category: this.errorCategories.UNKNOWN,
          severity: this.errorSeverity.HIGH,
          message: 'Error handling system failed',
          originalError: error
        },
        userMessage: 'An unexpected error occurred. Please try again.',
        canRetry: true
      };
    }
  }

  /**
   * Categorize error based on type and context
   * @param {Error} error - The error to categorize
   * @param {string} context - Context where error occurred
   * @returns {Object} Categorized error information
   */
  categorizeError(error, context) {
    const errorInfo = {
      originalError: error,
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      category: this.errorCategories.UNKNOWN,
      severity: this.errorSeverity.MEDIUM,
      code: error.code || null,
      retryable: false
    };

    // Storage errors
    if (this.isStorageError(error, context)) {
      errorInfo.category = this.errorCategories.STORAGE;
      errorInfo.severity = this.getStorageErrorSeverity(error);
      errorInfo.retryable = this.isStorageErrorRetryable(error);
    }
    // Facebook integration errors
    else if (this.isFacebookError(error, context)) {
      errorInfo.category = this.errorCategories.FACEBOOK;
      errorInfo.severity = this.errorSeverity.MEDIUM;
      errorInfo.retryable = true;
    }
    // License errors
    else if (this.isLicenseError(error, context)) {
      errorInfo.category = this.errorCategories.LICENSE;
      errorInfo.severity = this.errorSeverity.HIGH;
      errorInfo.retryable = this.isLicenseErrorRetryable(error);
    }
    // AI service errors
    else if (this.isAIError(error, context)) {
      errorInfo.category = this.errorCategories.AI;
      errorInfo.severity = this.errorSeverity.LOW;
      errorInfo.retryable = this.isAIErrorRetryable(error);
    }
    // Network errors
    else if (this.isNetworkError(error, context)) {
      errorInfo.category = this.errorCategories.NETWORK;
      errorInfo.severity = this.errorSeverity.MEDIUM;
      errorInfo.retryable = true;
    }
    // Validation errors
    else if (this.isValidationError(error, context)) {
      errorInfo.category = this.errorCategories.VALIDATION;
      errorInfo.severity = this.errorSeverity.LOW;
      errorInfo.retryable = false;
    }
    // Permission errors
    else if (this.isPermissionError(error, context)) {
      errorInfo.category = this.errorCategories.PERMISSION;
      errorInfo.severity = this.errorSeverity.HIGH;
      errorInfo.retryable = false;
    }

    return errorInfo;
  }

  /**
   * Check if error is storage-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isStorageError(error, context) {
    const storageKeywords = ['indexeddb', 'storage', 'quota', 'database', 'transaction'];
    const message = error.message.toLowerCase();
    
    return storageKeywords.some(keyword => message.includes(keyword)) ||
           context.toLowerCase().includes('storage') ||
           error.name === 'QuotaExceededError' ||
           error.name === 'InvalidStateError';
  }

  /**
   * Get storage error severity
   * @param {Error} error - Storage error
   * @returns {string} Severity level
   */
  getStorageErrorSeverity(error) {
    if (error.name === 'QuotaExceededError') {
      return this.errorSeverity.HIGH;
    }
    if (error.message.includes('corruption') || error.message.includes('corrupt')) {
      return this.errorSeverity.CRITICAL;
    }
    return this.errorSeverity.MEDIUM;
  }

  /**
   * Check if storage error is retryable
   * @param {Error} error - Storage error
   * @returns {boolean}
   */
  isStorageErrorRetryable(error) {
    // Quota errors are not retryable without user action
    if (error.name === 'QuotaExceededError') {
      return false;
    }
    // Corruption errors are not retryable
    if (error.message.includes('corruption')) {
      return false;
    }
    // Most other storage errors can be retried
    return true;
  }

  /**
   * Check if error is Facebook integration-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isFacebookError(error, context) {
    const facebookKeywords = ['facebook', 'comment', 'post', 'dom', 'selector'];
    const message = error.message.toLowerCase();
    
    return facebookKeywords.some(keyword => message.includes(keyword)) ||
           context.toLowerCase().includes('facebook') ||
           context.toLowerCase().includes('content');
  }

  /**
   * Check if error is license-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isLicenseError(error, context) {
    const licenseKeywords = ['license', 'token', 'jwt', 'expired', 'revoked', 'validation'];
    const message = error.message.toLowerCase();
    
    return licenseKeywords.some(keyword => message.includes(keyword)) ||
           context.toLowerCase().includes('license');
  }

  /**
   * Check if license error is retryable
   * @param {Error} error - License error
   * @returns {boolean}
   */
  isLicenseErrorRetryable(error) {
    const message = error.message.toLowerCase();
    
    // Network-related license errors are retryable
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }
    // Invalid or expired tokens are not retryable
    if (message.includes('invalid') || message.includes('expired') || message.includes('revoked')) {
      return false;
    }
    return true;
  }

  /**
   * Check if error is AI service-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isAIError(error, context) {
    const aiKeywords = ['ai', 'gemini', 'openai', 'api key', 'rate limit', 'quota'];
    const message = error.message.toLowerCase();
    
    return aiKeywords.some(keyword => message.includes(keyword)) ||
           context.toLowerCase().includes('ai');
  }

  /**
   * Check if AI error is retryable
   * @param {Error} error - AI error
   * @returns {boolean}
   */
  isAIErrorRetryable(error) {
    const message = error.message.toLowerCase();
    
    // Rate limit errors are retryable after delay
    if (message.includes('rate limit') || message.includes('quota')) {
      return true;
    }
    // Invalid API key errors are not retryable
    if (message.includes('invalid') && message.includes('key')) {
      return false;
    }
    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }
    return true;
  }

  /**
   * Check if error is network-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isNetworkError(error, context) {
    const networkKeywords = ['network', 'fetch', 'timeout', 'connection', 'offline'];
    const message = error.message.toLowerCase();
    
    return networkKeywords.some(keyword => message.includes(keyword)) ||
           error.name === 'NetworkError' ||
           error.name === 'TypeError' && message.includes('fetch');
  }

  /**
   * Check if error is validation-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isValidationError(error, context) {
    const validationKeywords = ['validation', 'invalid', 'required', 'format'];
    const message = error.message.toLowerCase();
    
    return validationKeywords.some(keyword => message.includes(keyword)) ||
           context.toLowerCase().includes('validation');
  }

  /**
   * Check if error is permission-related
   * @param {Error} error - Error to check
   * @param {string} context - Error context
   * @returns {boolean}
   */
  isPermissionError(error, context) {
    const permissionKeywords = ['permission', 'denied', 'unauthorized', 'forbidden'];
    const message = error.message.toLowerCase();
    
    return permissionKeywords.some(keyword => message.includes(keyword)) ||
           error.name === 'NotAllowedError';
  }

  /**
   * Get recovery strategy for error
   * @param {Object} errorInfo - Categorized error information
   * @returns {Object|null} Recovery strategy
   */
  getRecoveryStrategy(errorInfo) {
    const strategies = {
      [this.errorCategories.STORAGE]: this.getStorageRecoveryStrategy(errorInfo),
      [this.errorCategories.FACEBOOK]: this.getFacebookRecoveryStrategy(errorInfo),
      [this.errorCategories.LICENSE]: this.getLicenseRecoveryStrategy(errorInfo),
      [this.errorCategories.AI]: this.getAIRecoveryStrategy(errorInfo),
      [this.errorCategories.NETWORK]: this.getNetworkRecoveryStrategy(errorInfo),
      [this.errorCategories.VALIDATION]: null, // No automatic recovery for validation errors
      [this.errorCategories.PERMISSION]: null, // No automatic recovery for permission errors
      [this.errorCategories.UNKNOWN]: this.getGenericRecoveryStrategy(errorInfo)
    };

    return strategies[errorInfo.category];
  }

  /**
   * Get storage recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object|null} Recovery strategy
   */
  getStorageRecoveryStrategy(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('quota')) {
      return {
        type: 'quota_cleanup',
        action: 'cleanup_old_data',
        userAction: true,
        message: 'Storage quota exceeded. Clean up old templates?'
      };
    }
    
    if (message.includes('corruption')) {
      return {
        type: 'database_reset',
        action: 'reset_database',
        userAction: true,
        message: 'Database corruption detected. Reset storage?'
      };
    }
    
    if (errorInfo.retryable) {
      return {
        type: 'retry_with_backoff',
        action: 'retry_operation',
        userAction: false,
        maxRetries: 3
      };
    }
    
    return null;
  }

  /**
   * Get Facebook recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object} Recovery strategy
   */
  getFacebookRecoveryStrategy(errorInfo) {
    return {
      type: 'facebook_retry',
      action: 'retry_with_fallback',
      userAction: false,
      maxRetries: 3,
      fallbackSelectors: true
    };
  }

  /**
   * Get license recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object|null} Recovery strategy
   */
  getLicenseRecoveryStrategy(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return {
        type: 'license_retry',
        action: 'retry_validation',
        userAction: false,
        maxRetries: 2
      };
    }
    
    if (message.includes('expired')) {
      return {
        type: 'license_expired',
        action: 'start_grace_period',
        userAction: true,
        message: 'License expired. Start grace period?'
      };
    }
    
    return null;
  }

  /**
   * Get AI recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object} Recovery strategy
   */
  getAIRecoveryStrategy(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('rate limit')) {
      return {
        type: 'ai_rate_limit',
        action: 'wait_and_retry',
        userAction: false,
        delay: 60000, // 1 minute
        maxRetries: 1
      };
    }
    
    if (message.includes('quota')) {
      return {
        type: 'ai_quota',
        action: 'disable_ai_temporarily',
        userAction: true,
        message: 'AI quota exceeded. Disable AI features temporarily?'
      };
    }
    
    return {
      type: 'ai_fallback',
      action: 'fallback_to_basic',
      userAction: false,
      message: 'AI service unavailable, using basic matching'
    };
  }

  /**
   * Get network recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object} Recovery strategy
   */
  getNetworkRecoveryStrategy(errorInfo) {
    return {
      type: 'network_retry',
      action: 'retry_with_exponential_backoff',
      userAction: false,
      maxRetries: 3
    };
  }

  /**
   * Get generic recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Object} Recovery strategy
   */
  getGenericRecoveryStrategy(errorInfo) {
    if (errorInfo.retryable) {
      return {
        type: 'generic_retry',
        action: 'retry_operation',
        userAction: false,
        maxRetries: 2
      };
    }
    
    return null;
  }  /**

   * Execute recovery strategy
   * @param {Object} strategy - Recovery strategy to execute
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Recovery result
   */
  async executeRecovery(strategy, errorInfo, options = {}) {
    try {
      switch (strategy.type) {
        case 'retry_with_backoff':
        case 'facebook_retry':
        case 'license_retry':
        case 'network_retry':
        case 'generic_retry':
          return await this.executeRetryStrategy(strategy, errorInfo, options);
          
        case 'ai_rate_limit':
          return await this.executeAIRateLimitStrategy(strategy, errorInfo, options);
          
        case 'ai_fallback':
          return await this.executeAIFallbackStrategy(strategy, errorInfo, options);
          
        case 'quota_cleanup':
          return await this.executeQuotaCleanupStrategy(strategy, errorInfo, options);
          
        case 'database_reset':
          return await this.executeDatabaseResetStrategy(strategy, errorInfo, options);
          
        default:
          return {
            success: false,
            message: 'Unknown recovery strategy'
          };
      }
    } catch (recoveryError) {
      console.error('Recovery execution failed:', recoveryError);
      return {
        success: false,
        message: 'Recovery attempt failed',
        error: recoveryError
      };
    }
  }

  /**
   * Execute retry strategy with exponential backoff
   * @param {Object} strategy - Retry strategy
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Options including retry function
   * @returns {Promise<Object>} Retry result
   */
  async executeRetryStrategy(strategy, errorInfo, options) {
    const maxRetries = strategy.maxRetries || this.retryConfig.maxRetries;
    const retryFunction = options.retryFunction;
    
    if (!retryFunction) {
      return {
        success: false,
        message: 'No retry function provided'
      };
    }
    
    let lastError = errorInfo.originalError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        // Wait before retry (except first attempt)
        if (attempt > 1) {
          await this.delay(delay);
        }
        
        // Attempt retry
        const result = await retryFunction();
        
        return {
          success: true,
          message: `Operation succeeded on attempt ${attempt}`,
          attempts: attempt,
          result: result
        };
        
      } catch (retryError) {
        lastError = retryError;
        console.warn(`Retry attempt ${attempt}/${maxRetries} failed:`, retryError.message);
        
        // If this was the last attempt, don't continue
        if (attempt === maxRetries) {
          break;
        }
      }
    }
    
    return {
      success: false,
      message: `All ${maxRetries} retry attempts failed`,
      attempts: maxRetries,
      lastError: lastError
    };
  }

  /**
   * Execute AI rate limit strategy
   * @param {Object} strategy - Rate limit strategy
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Options
   * @returns {Promise<Object>} Strategy result
   */
  async executeAIRateLimitStrategy(strategy, errorInfo, options) {
    const delay = strategy.delay || 60000; // Default 1 minute
    
    console.log(`AI rate limit hit, waiting ${delay}ms before retry`);
    await this.delay(delay);
    
    if (options.retryFunction) {
      try {
        const result = await options.retryFunction();
        return {
          success: true,
          message: 'AI operation succeeded after rate limit delay',
          result: result
        };
      } catch (retryError) {
        return {
          success: false,
          message: 'AI operation failed after rate limit delay',
          error: retryError
        };
      }
    }
    
    return {
      success: true,
      message: 'Rate limit delay completed'
    };
  }

  /**
   * Execute AI fallback strategy
   * @param {Object} strategy - Fallback strategy
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Options
   * @returns {Promise<Object>} Strategy result
   */
  async executeAIFallbackStrategy(strategy, errorInfo, options) {
    // Disable AI temporarily and fall back to basic functionality
    try {
      if (options.fallbackFunction) {
        const result = await options.fallbackFunction();
        return {
          success: true,
          message: 'Fallback to basic functionality successful',
          result: result
        };
      }
      
      return {
        success: true,
        message: 'AI features disabled, using basic functionality'
      };
    } catch (fallbackError) {
      return {
        success: false,
        message: 'Fallback strategy failed',
        error: fallbackError
      };
    }
  }

  /**
   * Execute quota cleanup strategy
   * @param {Object} strategy - Cleanup strategy
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Options
   * @returns {Promise<Object>} Strategy result
   */
  async executeQuotaCleanupStrategy(strategy, errorInfo, options) {
    // This would typically require user confirmation
    // For now, just return a message indicating user action needed
    return {
      success: false,
      message: 'Storage quota exceeded. User action required to clean up data.',
      userActionRequired: true,
      actionType: 'quota_cleanup'
    };
  }

  /**
   * Execute database reset strategy
   * @param {Object} strategy - Reset strategy
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Options
   * @returns {Promise<Object>} Strategy result
   */
  async executeDatabaseResetStrategy(strategy, errorInfo, options) {
    // This would typically require user confirmation
    // For now, just return a message indicating user action needed
    return {
      success: false,
      message: 'Database corruption detected. User action required to reset storage.',
      userActionRequired: true,
      actionType: 'database_reset'
    };
  }

  /**
   * Generate user-friendly error message
   * @param {Object} errorInfo - Error information
   * @param {Object} recoveryResult - Recovery result
   * @returns {string} User-friendly message
   */
  generateUserMessage(errorInfo, recoveryResult) {
    // If recovery was successful, show success message
    if (recoveryResult && recoveryResult.success) {
      return this.getSuccessMessage(errorInfo.category, recoveryResult);
    }
    
    // Generate error message based on category
    const categoryMessages = {
      [this.errorCategories.STORAGE]: this.getStorageUserMessage(errorInfo),
      [this.errorCategories.FACEBOOK]: this.getFacebookUserMessage(errorInfo),
      [this.errorCategories.LICENSE]: this.getLicenseUserMessage(errorInfo),
      [this.errorCategories.AI]: this.getAIUserMessage(errorInfo),
      [this.errorCategories.NETWORK]: this.getNetworkUserMessage(errorInfo),
      [this.errorCategories.VALIDATION]: this.getValidationUserMessage(errorInfo),
      [this.errorCategories.PERMISSION]: this.getPermissionUserMessage(errorInfo),
      [this.errorCategories.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };
    
    return categoryMessages[errorInfo.category] || categoryMessages[this.errorCategories.UNKNOWN];
  }

  /**
   * Get success message after recovery
   * @param {string} category - Error category
   * @param {Object} recoveryResult - Recovery result
   * @returns {string} Success message
   */
  getSuccessMessage(category, recoveryResult) {
    const successMessages = {
      [this.errorCategories.STORAGE]: 'Storage operation completed successfully.',
      [this.errorCategories.FACEBOOK]: 'Facebook integration restored.',
      [this.errorCategories.LICENSE]: 'License validation successful.',
      [this.errorCategories.AI]: 'AI service restored.',
      [this.errorCategories.NETWORK]: 'Network connection restored.'
    };
    
    return successMessages[category] || 'Operation completed successfully.';
  }

  /**
   * Get storage error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getStorageUserMessage(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('quota')) {
      return 'Storage space is full. Please delete some old templates to continue.';
    }
    
    if (message.includes('corruption')) {
      return 'Data corruption detected. Your templates may need to be restored from backup.';
    }
    
    return 'There was a problem saving your data. Please try again.';
  }

  /**
   * Get Facebook error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getFacebookUserMessage(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('comment')) {
      return 'Unable to insert comment. Facebook may have changed their interface.';
    }
    
    if (message.includes('post')) {
      return 'Unable to detect Facebook posts. Please refresh the page and try again.';
    }
    
    return 'Facebook integration is having issues. Please refresh the page.';
  }

  /**
   * Get license error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getLicenseUserMessage(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('expired')) {
      return 'Your Pro license has expired. Please renew to continue using Pro features.';
    }
    
    if (message.includes('invalid')) {
      return 'Your license is invalid. Please check your license key.';
    }
    
    if (message.includes('network')) {
      return 'Unable to verify license due to network issues. Trying again...';
    }
    
    return 'There was a problem with your license. Please check your subscription.';
  }

  /**
   * Get AI error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getAIUserMessage(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('api key')) {
      return 'AI service configuration error. Please check your API key in settings.';
    }
    
    if (message.includes('rate limit')) {
      return 'AI service rate limit reached. Please wait a moment before trying again.';
    }
    
    if (message.includes('quota')) {
      return 'AI service quota exceeded. Please check your API usage or upgrade your plan.';
    }
    
    return 'AI service is temporarily unavailable. Using basic template matching instead.';
  }

  /**
   * Get network error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getNetworkUserMessage(errorInfo) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  /**
   * Get validation error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getValidationUserMessage(errorInfo) {
    return 'Please check your input and try again. Some required information may be missing or invalid.';
  }

  /**
   * Get permission error user message
   * @param {Object} errorInfo - Error information
   * @returns {string} User message
   */
  getPermissionUserMessage(errorInfo) {
    return 'Permission denied. Please check your browser settings and extension permissions.';
  }

  /**
   * Check if user should be notified of this error
   * @param {Object} errorInfo - Error information
   * @returns {boolean} Whether to notify user
   */
  shouldNotifyUser(errorInfo) {
    // Always notify for high and critical severity errors
    if (errorInfo.severity === this.errorSeverity.HIGH || 
        errorInfo.severity === this.errorSeverity.CRITICAL) {
      return true;
    }
    
    // Notify for medium severity errors in certain categories
    if (errorInfo.severity === this.errorSeverity.MEDIUM) {
      const notifyCategories = [
        this.errorCategories.STORAGE,
        this.errorCategories.LICENSE,
        this.errorCategories.PERMISSION
      ];
      return notifyCategories.includes(errorInfo.category);
    }
    
    // Don't notify for low severity errors
    return false;
  }

  /**
   * Notify user of error
   * @param {string} message - User message
   * @param {string} severity - Error severity
   * @returns {Promise<void>}
   */
  async notifyUser(message, severity) {
    try {
      // Try to send message to side panel if available
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'ERROR_NOTIFICATION',
          data: {
            message: message,
            severity: severity,
            timestamp: Date.now()
          }
        }).catch(() => {
          // Side panel might not be open, which is fine
          console.log('Could not send error notification to side panel');
        });
      }
      
      // For critical errors, also show browser notification if permitted
      if (severity === this.errorSeverity.CRITICAL) {
        await this.showBrowserNotification(message);
      }
      
    } catch (notificationError) {
      console.error('Failed to notify user:', notificationError);
    }
  }

  /**
   * Show browser notification for critical errors
   * @param {string} message - Notification message
   * @returns {Promise<void>}
   */
  async showBrowserNotification(message) {
    try {
      if (typeof chrome !== 'undefined' && chrome.notifications) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icons/icon48.png',
          title: 'AdReply Error',
          message: message
        });
      }
    } catch (error) {
      console.warn('Could not show browser notification:', error);
    }
  }

  /**
   * Check if error can be retried
   * @param {Object} errorInfo - Error information
   * @returns {boolean} Whether error can be retried
   */
  canRetry(errorInfo) {
    return errorInfo.retryable && 
           errorInfo.severity !== this.errorSeverity.CRITICAL &&
           !this.isRecentlyFailed(errorInfo);
  }

  /**
   * Check if similar error has failed recently
   * @param {Object} errorInfo - Error information
   * @returns {boolean} Whether similar error failed recently
   */
  isRecentlyFailed(errorInfo) {
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    return this.errorHistory.some(historyItem => {
      const timeDiff = now - new Date(historyItem.timestamp).getTime();
      return timeDiff < recentThreshold &&
             historyItem.category === errorInfo.category &&
             historyItem.context === errorInfo.context;
    });
  }

  /**
   * Log error for debugging and analytics
   * @param {Object} errorInfo - Error information
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorInfo);
        break;
      case 'warn':
        console.warn(logMessage, errorInfo);
        break;
      case 'info':
        console.info(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }

  /**
   * Get log level for error severity
   * @param {string} severity - Error severity
   * @returns {string} Log level
   */
  getLogLevel(severity) {
    const logLevels = {
      [this.errorSeverity.CRITICAL]: 'error',
      [this.errorSeverity.HIGH]: 'error',
      [this.errorSeverity.MEDIUM]: 'warn',
      [this.errorSeverity.LOW]: 'info'
    };
    
    return logLevels[severity] || 'log';
  }

  /**
   * Add error to history
   * @param {Object} errorInfo - Error information
   */
  addToHistory(errorInfo) {
    this.errorHistory.push({
      ...errorInfo,
      id: this.generateErrorId()
    });
    
    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.splice(0, this.errorHistory.length - this.maxHistorySize);
    }
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error history
   * @param {Object} filters - Optional filters
   * @returns {Array} Error history
   */
  getErrorHistory(filters = {}) {
    let history = [...this.errorHistory];
    
    if (filters.category) {
      history = history.filter(error => error.category === filters.category);
    }
    
    if (filters.severity) {
      history = history.filter(error => error.severity === filters.severity);
    }
    
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      history = history.filter(error => new Date(error.timestamp) >= sinceDate);
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
  }

  /**
   * Utility method to create delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a wrapper function that automatically handles errors
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for error handling
   * @param {Object} options - Error handling options
   * @returns {Function} Wrapped function
   */
  wrapWithErrorHandling(fn, context, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const result = await this.handleError(error, context, {
          ...options,
          retryFunction: options.enableRetry ? () => fn(...args) : null
        });
        
        if (result.success) {
          return result.recovery?.result;
        } else {
          throw error;
        }
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else {
  window.ErrorHandler = ErrorHandler;
}