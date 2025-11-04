/**
 * Configurable Logging System for AdReply Extension
 * Provides structured logging with different levels and privacy-compliant analytics
 */

class Logger {
  constructor(options = {}) {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };

    this.config = {
      level: options.level || this.logLevels.INFO,
      enableConsole: options.enableConsole !== false,
      enableStorage: options.enableStorage !== false,
      enableAnalytics: options.enableAnalytics !== false,
      maxStoredLogs: options.maxStoredLogs || 1000,
      maxLogAge: options.maxLogAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      component: options.component || 'AdReply',
      enableStackTrace: options.enableStackTrace !== false
    };

    this.logBuffer = [];
    this.analyticsBuffer = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();

    // Initialize storage if enabled
    if (this.config.enableStorage) {
      this.initializeStorage();
    }

    // Set up periodic cleanup
    this.setupCleanup();
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  error(message, data = {}, context = '') {
    this.log('ERROR', message, data, context);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  warn(message, data = {}, context = '') {
    this.log('WARN', message, data, context);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  info(message, data = {}, context = '') {
    this.log('INFO', message, data, context);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  debug(message, data = {}, context = '') {
    this.log('DEBUG', message, data, context);
  }

  /**
   * Log trace message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  trace(message, data = {}, context = '') {
    this.log('TRACE', message, data, context);
  }

  /**
   * Main logging method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   */
  log(level, message, data = {}, context = '') {
    const levelValue = this.logLevels[level];
    
    // Check if this level should be logged
    if (levelValue > this.config.level) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, data, context);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logToStorage(logEntry);
    }

    // Analytics logging (privacy-compliant)
    if (this.config.enableAnalytics && this.shouldLogToAnalytics(level)) {
      this.logToAnalytics(logEntry);
    }
  }

  /**
   * Create structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} context - Context information
   * @returns {Object} Log entry
   */
  createLogEntry(level, message, data, context) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: this.generateLogId(),
      timestamp: timestamp,
      level: level,
      component: this.config.component,
      context: context,
      message: message,
      sessionId: this.sessionId,
      data: this.sanitizeData(data)
    };

    // Add stack trace for errors and warnings if enabled
    if (this.config.enableStackTrace && (level === 'ERROR' || level === 'WARN')) {
      logEntry.stack = this.captureStackTrace();
    }

    // Add performance information
    logEntry.performance = {
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.startTime,
      memoryUsage: this.getMemoryUsage()
    };

    return logEntry;
  }

  /**
   * Log to console with appropriate formatting
   * @param {Object} logEntry - Log entry to output
   */
  logToConsole(logEntry) {
    const prefix = `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.component}]`;
    const message = logEntry.context ? 
      `${prefix} [${logEntry.context}] ${logEntry.message}` :
      `${prefix} ${logEntry.message}`;

    const consoleMethod = this.getConsoleMethod(logEntry.level);
    
    if (Object.keys(logEntry.data).length > 0) {
      consoleMethod(message, logEntry.data);
    } else {
      consoleMethod(message);
    }

    // Log stack trace separately for better readability
    if (logEntry.stack) {
      console.groupCollapsed('Stack Trace');
      console.log(logEntry.stack);
      console.groupEnd();
    }
  }

  /**
   * Get appropriate console method for log level
   * @param {string} level - Log level
   * @returns {Function} Console method
   */
  getConsoleMethod(level) {
    const methods = {
      ERROR: console.error,
      WARN: console.warn,
      INFO: console.info,
      DEBUG: console.debug,
      TRACE: console.trace
    };

    return methods[level] || console.log;
  }

  /**
   * Log to storage buffer
   * @param {Object} logEntry - Log entry to store
   */
  logToStorage(logEntry) {
    this.logBuffer.push(logEntry);

    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxStoredLogs) {
      this.logBuffer.splice(0, this.logBuffer.length - this.config.maxStoredLogs);
    }

    // Persist to storage periodically
    this.scheduleStoragePersist();
  }

  /**
   * Check if log should be sent to analytics
   * @param {string} level - Log level
   * @returns {boolean} Whether to log to analytics
   */
  shouldLogToAnalytics(level) {
    // Only log errors and warnings to analytics for privacy
    return level === 'ERROR' || level === 'WARN';
  }

  /**
   * Log to analytics buffer (privacy-compliant)
   * @param {Object} logEntry - Log entry to analyze
   */
  logToAnalytics(logEntry) {
    // Create privacy-compliant analytics entry
    const analyticsEntry = {
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      component: logEntry.component,
      context: logEntry.context,
      messageHash: this.hashMessage(logEntry.message), // Hash instead of raw message
      errorType: this.extractErrorType(logEntry),
      sessionId: logEntry.sessionId,
      performance: logEntry.performance
    };

    this.analyticsBuffer.push(analyticsEntry);

    // Maintain analytics buffer size
    if (this.analyticsBuffer.length > 100) {
      this.analyticsBuffer.splice(0, this.analyticsBuffer.length - 100);
    }
  }

  /**
   * Sanitize data to remove sensitive information
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'apikey', 'auth'];

    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      
      // Check if key contains sensitive information
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate very long strings
        sanitized[key] = value.substring(0, 100) + '...';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Capture stack trace
   * @returns {string} Stack trace
   */
  captureStackTrace() {
    try {
      const error = new Error();
      return error.stack || 'Stack trace not available';
    } catch (e) {
      return 'Failed to capture stack trace';
    }
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage data
   */
  getMemoryUsage() {
    try {
      if (performance && performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
    } catch (e) {
      // Memory API not available
    }
    
    return null;
  }

  /**
   * Hash message for privacy-compliant analytics
   * @param {string} message - Message to hash
   * @returns {string} Hashed message
   */
  hashMessage(message) {
    // Simple hash function for privacy
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract error type from log entry
   * @param {Object} logEntry - Log entry
   * @returns {string} Error type
   */
  extractErrorType(logEntry) {
    if (logEntry.data && logEntry.data.error) {
      return logEntry.data.error.name || 'UnknownError';
    }
    
    // Try to extract from message
    const message = logEntry.message.toLowerCase();
    if (message.includes('network')) return 'NetworkError';
    if (message.includes('storage')) return 'StorageError';
    if (message.includes('facebook')) return 'FacebookError';
    if (message.includes('license')) return 'LicenseError';
    if (message.includes('ai')) return 'AIError';
    
    return 'GeneralError';
  }

  /**
   * Initialize storage for persistent logging
   */
  async initializeStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Load existing logs from storage
        const result = await chrome.storage.local.get(['adreply_logs']);
        if (result.adreply_logs) {
          this.logBuffer = result.adreply_logs.filter(log => 
            Date.now() - new Date(log.timestamp).getTime() < this.config.maxLogAge
          );
        }
      }
    } catch (error) {
      console.warn('Failed to initialize log storage:', error);
    }
  }

  /**
   * Schedule storage persistence
   */
  scheduleStoragePersist() {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persistToStorage();
    }, 5000); // Persist every 5 seconds
  }

  /**
   * Persist logs to storage
   */
  async persistToStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          adreply_logs: this.logBuffer
        });
      }
    } catch (error) {
      console.warn('Failed to persist logs to storage:', error);
    }
  }

  /**
   * Set up periodic cleanup of old logs
   */
  setupCleanup() {
    // Clean up every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old logs
   */
  cleanupOldLogs() {
    const now = Date.now();
    const maxAge = this.config.maxLogAge;

    // Clean log buffer
    this.logBuffer = this.logBuffer.filter(log => 
      now - new Date(log.timestamp).getTime() < maxAge
    );

    // Clean analytics buffer
    this.analyticsBuffer = this.analyticsBuffer.filter(log => 
      now - new Date(log.timestamp).getTime() < maxAge
    );
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique log ID
   * @returns {string} Log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logs with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    let logs = [...this.logBuffer];

    if (filters.level) {
      const levelValue = this.logLevels[filters.level.toUpperCase()];
      logs = logs.filter(log => this.logLevels[log.level] <= levelValue);
    }

    if (filters.component) {
      logs = logs.filter(log => log.component === filters.component);
    }

    if (filters.context) {
      logs = logs.filter(log => log.context.includes(filters.context));
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.context.toLowerCase().includes(searchTerm)
      );
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get analytics data (privacy-compliant)
   * @param {Object} filters - Filter options
   * @returns {Array} Analytics data
   */
  getAnalytics(filters = {}) {
    let analytics = [...this.analyticsBuffer];

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      analytics = analytics.filter(entry => new Date(entry.timestamp) >= sinceDate);
    }

    return analytics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Export logs for debugging
   * @param {Object} options - Export options
   * @returns {Object} Exported log data
   */
  exportLogs(options = {}) {
    const logs = this.getLogs(options.filters || {});
    
    return {
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      component: this.config.component,
      totalLogs: logs.length,
      config: {
        level: Object.keys(this.logLevels)[this.config.level],
        maxStoredLogs: this.config.maxStoredLogs,
        maxLogAge: this.config.maxLogAge
      },
      logs: options.includeData ? logs : logs.map(log => ({
        ...log,
        data: Object.keys(log.data).length > 0 ? '[DATA_PRESENT]' : {}
      }))
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logBuffer = [];
    this.analyticsBuffer = [];
    
    // Clear from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['adreply_logs']).catch(error => {
        console.warn('Failed to clear logs from storage:', error);
      });
    }
  }

  /**
   * Update logging configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Create a child logger with specific context
   * @param {string} context - Context for child logger
   * @returns {Object} Child logger
   */
  createChildLogger(context) {
    return {
      error: (message, data) => this.error(message, data, context),
      warn: (message, data) => this.warn(message, data, context),
      info: (message, data) => this.info(message, data, context),
      debug: (message, data) => this.debug(message, data, context),
      trace: (message, data) => this.trace(message, data, context)
    };
  }
}

/**
 * Performance Monitor for tracking extension performance
 */
class PerformanceMonitor {
  constructor(logger) {
    this.logger = logger;
    this.metrics = new Map();
    this.timers = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} name - Operation name
   * @param {Object} metadata - Additional metadata
   */
  startTimer(name, metadata = {}) {
    this.timers.set(name, {
      startTime: performance.now(),
      metadata: metadata
    });
  }

  /**
   * End timing an operation
   * @param {string} name - Operation name
   * @returns {number} Duration in milliseconds
   */
  endTimer(name) {
    const timer = this.timers.get(name);
    if (!timer) {
      this.logger.warn('Timer not found', { name });
      return 0;
    }

    const duration = performance.now() - timer.startTime;
    this.timers.delete(name);

    // Record metric
    this.recordMetric(name, duration, timer.metadata);

    this.logger.debug('Performance timing', {
      operation: name,
      duration: duration,
      metadata: timer.metadata
    });

    return duration;
  }

  /**
   * Record a performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(name, value, metadata = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value: value,
      timestamp: Date.now(),
      metadata: metadata
    });

    // Keep only last 100 measurements per metric
    const measurements = this.metrics.get(name);
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }
  }

  /**
   * Get performance statistics for a metric
   * @param {string} name - Metric name
   * @returns {Object} Performance statistics
   */
  getStats(name) {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const values = measurements.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: measurements.length,
      sum: sum,
      avg: avg,
      min: min,
      max: max,
      p50: p50,
      p95: p95,
      p99: p99,
      recent: measurements.slice(-10) // Last 10 measurements
    };
  }

  /**
   * Get all performance metrics
   * @returns {Object} All metrics with statistics
   */
  getAllStats() {
    const stats = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  }
}/
**
 * Debug Tools for AdReply Extension
 * Provides debugging utilities for template matching and Facebook integration
 */
class DebugTools {
  constructor(logger) {
    this.logger = logger;
    this.debugMode = false;
    this.debugPanelVisible = false;
    this.debugData = {
      templateMatching: [],
      facebookIntegration: [],
      performance: [],
      errors: []
    };
  }

  /**
   * Enable debug mode
   */
  enableDebugMode() {
    this.debugMode = true;
    this.logger.info('Debug mode enabled');
    
    // Add debug panel to page if on Facebook
    if (window.location.hostname.includes('facebook.com')) {
      this.createDebugPanel();
    }
  }

  /**
   * Disable debug mode
   */
  disableDebugMode() {
    this.debugMode = false;
    this.logger.info('Debug mode disabled');
    this.removeDebugPanel();
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} Debug mode status
   */
  isDebugMode() {
    return this.debugMode;
  }

  /**
   * Log template matching debug information
   * @param {string} postContent - Post content being analyzed
   * @param {Array} templates - Available templates
   * @param {Array} matches - Matched templates with scores
   * @param {Array} suggestions - Final suggestions
   */
  logTemplateMatching(postContent, templates, matches, suggestions) {
    if (!this.debugMode) return;

    const debugInfo = {
      timestamp: Date.now(),
      postContent: postContent.substring(0, 200) + '...',
      postLength: postContent.length,
      totalTemplates: templates.length,
      matchedTemplates: matches.length,
      finalSuggestions: suggestions.length,
      matches: matches.map(match => ({
        templateId: match.template.id,
        label: match.template.label,
        score: match.score,
        matchedKeywords: match.matchedKeywords,
        aiEnhanced: match.aiEnhanced || false
      })),
      suggestions: suggestions.map(suggestion => ({
        templateId: suggestion.templateId,
        rank: suggestion.rank,
        score: suggestion.score,
        confidence: suggestion.confidence,
        text: suggestion.text.substring(0, 100) + '...'
      }))
    };

    this.debugData.templateMatching.push(debugInfo);
    this.logger.debug('Template matching analysis', debugInfo);

    // Update debug panel if visible
    if (this.debugPanelVisible) {
      this.updateDebugPanel();
    }
  }

  /**
   * Log Facebook integration debug information
   * @param {string} action - Action being performed
   * @param {Object} data - Action data
   * @param {boolean} success - Whether action succeeded
   * @param {string} error - Error message if failed
   */
  logFacebookIntegration(action, data, success, error = null) {
    if (!this.debugMode) return;

    const debugInfo = {
      timestamp: Date.now(),
      action: action,
      success: success,
      error: error,
      data: data
    };

    this.debugData.facebookIntegration.push(debugInfo);
    this.logger.debug('Facebook integration', debugInfo);

    // Update debug panel if visible
    if (this.debugPanelVisible) {
      this.updateDebugPanel();
    }
  }

  /**
   * Log performance debug information
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  logPerformance(operation, duration, metadata = {}) {
    if (!this.debugMode) return;

    const debugInfo = {
      timestamp: Date.now(),
      operation: operation,
      duration: duration,
      metadata: metadata
    };

    this.debugData.performance.push(debugInfo);
    this.logger.debug('Performance measurement', debugInfo);

    // Keep only last 50 performance entries
    if (this.debugData.performance.length > 50) {
      this.debugData.performance.splice(0, this.debugData.performance.length - 50);
    }
  }

  /**
   * Create debug panel on Facebook page
   */
  createDebugPanel() {
    if (document.getElementById('adreply-debug-panel')) {
      return; // Panel already exists
    }

    const panel = document.createElement('div');
    panel.id = 'adreply-debug-panel';
    panel.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 600px;
        background: #1e1e1e;
        color: #ffffff;
        border: 1px solid #333;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <div style="
          background: #333;
          padding: 8px 12px;
          border-bottom: 1px solid #444;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="font-weight: bold;">AdReply Debug</span>
          <div>
            <button id="adreply-debug-clear" style="
              background: #666;
              color: white;
              border: none;
              padding: 4px 8px;
              margin-right: 4px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 10px;
            ">Clear</button>
            <button id="adreply-debug-close" style="
              background: #d32f2f;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 10px;
            ">×</button>
          </div>
        </div>
        <div id="adreply-debug-content" style="
          padding: 12px;
          max-height: 500px;
          overflow-y: auto;
        ">
          <div>Debug panel initialized...</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.debugPanelVisible = true;

    // Add event listeners
    document.getElementById('adreply-debug-close').addEventListener('click', () => {
      this.removeDebugPanel();
    });

    document.getElementById('adreply-debug-clear').addEventListener('click', () => {
      this.clearDebugData();
    });

    this.updateDebugPanel();
  }

  /**
   * Remove debug panel
   */
  removeDebugPanel() {
    const panel = document.getElementById('adreply-debug-panel');
    if (panel) {
      panel.remove();
      this.debugPanelVisible = false;
    }
  }

  /**
   * Update debug panel content
   */
  updateDebugPanel() {
    const content = document.getElementById('adreply-debug-content');
    if (!content) return;

    const html = `
      <div style="margin-bottom: 16px;">
        <div style="color: #4fc3f7; font-weight: bold; margin-bottom: 8px;">Template Matching (${this.debugData.templateMatching.length})</div>
        ${this.debugData.templateMatching.slice(-3).map(item => `
          <div style="background: #2a2a2a; padding: 8px; margin-bottom: 4px; border-radius: 4px;">
            <div style="color: #81c784;">Post: ${item.postContent}</div>
            <div style="color: #ffb74d;">Matches: ${item.matchedTemplates}/${item.totalTemplates}</div>
            <div style="color: #f06292;">Suggestions: ${item.finalSuggestions}</div>
            ${item.suggestions.map(s => `
              <div style="margin-left: 12px; color: #b39ddb;">
                ${s.rank}. ${s.text} (${s.confidence})
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom: 16px;">
        <div style="color: #4fc3f7; font-weight: bold; margin-bottom: 8px;">Facebook Integration (${this.debugData.facebookIntegration.length})</div>
        ${this.debugData.facebookIntegration.slice(-5).map(item => `
          <div style="background: #2a2a2a; padding: 8px; margin-bottom: 4px; border-radius: 4px;">
            <div style="color: ${item.success ? '#81c784' : '#e57373'};">
              ${item.action}: ${item.success ? 'SUCCESS' : 'FAILED'}
            </div>
            ${item.error ? `<div style="color: #e57373; font-size: 10px;">${item.error}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom: 16px;">
        <div style="color: #4fc3f7; font-weight: bold; margin-bottom: 8px;">Performance (${this.debugData.performance.length})</div>
        ${this.debugData.performance.slice(-5).map(item => `
          <div style="background: #2a2a2a; padding: 8px; margin-bottom: 4px; border-radius: 4px;">
            <div style="color: #ffb74d;">${item.operation}: ${item.duration.toFixed(2)}ms</div>
          </div>
        `).join('')}
      </div>
    `;

    content.innerHTML = html;
  }

  /**
   * Clear debug data
   */
  clearDebugData() {
    this.debugData = {
      templateMatching: [],
      facebookIntegration: [],
      performance: [],
      errors: []
    };

    if (this.debugPanelVisible) {
      this.updateDebugPanel();
    }

    this.logger.info('Debug data cleared');
  }

  /**
   * Export debug data for analysis
   * @returns {Object} Debug data export
   */
  exportDebugData() {
    return {
      exportedAt: new Date().toISOString(),
      debugMode: this.debugMode,
      data: { ...this.debugData },
      summary: {
        templateMatchingEvents: this.debugData.templateMatching.length,
        facebookIntegrationEvents: this.debugData.facebookIntegration.length,
        performanceEvents: this.debugData.performance.length,
        errorEvents: this.debugData.errors.length
      }
    };
  }

  /**
   * Analyze template matching performance
   * @returns {Object} Analysis results
   */
  analyzeTemplateMatching() {
    const events = this.debugData.templateMatching;
    if (events.length === 0) {
      return { message: 'No template matching data available' };
    }

    const analysis = {
      totalEvents: events.length,
      averageMatches: events.reduce((sum, e) => sum + e.matchedTemplates, 0) / events.length,
      averageSuggestions: events.reduce((sum, e) => sum + e.finalSuggestions, 0) / events.length,
      matchRates: events.map(e => e.matchedTemplates / e.totalTemplates),
      commonTemplates: {},
      confidenceDistribution: { high: 0, medium: 0, low: 0, very_low: 0 }
    };

    // Analyze common templates
    events.forEach(event => {
      event.suggestions.forEach(suggestion => {
        const templateId = suggestion.templateId;
        analysis.commonTemplates[templateId] = (analysis.commonTemplates[templateId] || 0) + 1;
        analysis.confidenceDistribution[suggestion.confidence]++;
      });
    });

    return analysis;
  }

  /**
   * Analyze Facebook integration performance
   * @returns {Object} Analysis results
   */
  analyzeFacebookIntegration() {
    const events = this.debugData.facebookIntegration;
    if (events.length === 0) {
      return { message: 'No Facebook integration data available' };
    }

    const analysis = {
      totalEvents: events.length,
      successRate: events.filter(e => e.success).length / events.length,
      actionBreakdown: {},
      errorBreakdown: {}
    };

    events.forEach(event => {
      // Count actions
      analysis.actionBreakdown[event.action] = (analysis.actionBreakdown[event.action] || 0) + 1;
      
      // Count errors
      if (!event.success && event.error) {
        analysis.errorBreakdown[event.error] = (analysis.errorBreakdown[event.error] || 0) + 1;
      }
    });

    return analysis;
  }

  /**
   * Get debug summary for display
   * @returns {Object} Debug summary
   */
  getDebugSummary() {
    return {
      debugMode: this.debugMode,
      panelVisible: this.debugPanelVisible,
      dataPoints: {
        templateMatching: this.debugData.templateMatching.length,
        facebookIntegration: this.debugData.facebookIntegration.length,
        performance: this.debugData.performance.length,
        errors: this.debugData.errors.length
      },
      analyses: {
        templateMatching: this.analyzeTemplateMatching(),
        facebookIntegration: this.analyzeFacebookIntegration()
      }
    };
  }
}

// Global logger instance
let globalLogger = null;
let globalPerformanceMonitor = null;
let globalDebugTools = null;

/**
 * Initialize global logging system
 * @param {Object} options - Logger options
 */
function initializeLogging(options = {}) {
  globalLogger = new Logger({
    component: 'AdReply',
    level: options.debugMode ? 4 : 2, // TRACE in debug mode, INFO otherwise
    ...options
  });

  globalPerformanceMonitor = new PerformanceMonitor(globalLogger);
  globalDebugTools = new DebugTools(globalLogger);

  // Enable debug mode if requested
  if (options.debugMode) {
    globalDebugTools.enableDebugMode();
  }

  globalLogger.info('Logging system initialized', {
    level: Object.keys(globalLogger.logLevels)[globalLogger.config.level],
    debugMode: options.debugMode || false
  });

  return {
    logger: globalLogger,
    performance: globalPerformanceMonitor,
    debug: globalDebugTools
  };
}

/**
 * Get global logger instance
 * @returns {Logger} Logger instance
 */
function getLogger() {
  if (!globalLogger) {
    initializeLogging();
  }
  return globalLogger;
}

/**
 * Get global performance monitor
 * @returns {PerformanceMonitor} Performance monitor instance
 */
function getPerformanceMonitor() {
  if (!globalPerformanceMonitor) {
    initializeLogging();
  }
  return globalPerformanceMonitor;
}

/**
 * Get global debug tools
 * @returns {DebugTools} Debug tools instance
 */
function getDebugTools() {
  if (!globalDebugTools) {
    initializeLogging();
  }
  return globalDebugTools;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logger,
    PerformanceMonitor,
    DebugTools,
    initializeLogging,
    getLogger,
    getPerformanceMonitor,
    getDebugTools
  };
} else {
  window.Logger = Logger;
  window.PerformanceMonitor = PerformanceMonitor;
  window.DebugTools = DebugTools;
  window.initializeLogging = initializeLogging;
  window.getLogger = getLogger;
  window.getPerformanceMonitor = getPerformanceMonitor;
  window.getDebugTools = getDebugTools;
}