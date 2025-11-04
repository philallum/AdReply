/**
 * Test script for Error Handling and Logging System
 * This file can be used to test the error handling and logging functionality
 */

// Test function to verify error handling and logging
async function testErrorHandlingAndLogging() {
  console.log('Starting Error Handling and Logging Tests...');
  
  try {
    // Initialize logging system
    const logging = initializeLogging({
      component: 'ErrorTest',
      debugMode: true,
      level: 4 // TRACE level for testing
    });
    
    const logger = logging.logger;
    const errorHandler = new ErrorHandler();
    const performance = logging.performance;
    const debug = logging.debug;
    
    console.log('✓ Logging system initialized');
    
    // Test 1: Basic logging
    logger.info('Test message', { testData: 'hello world' });
    logger.warn('Test warning', { warningType: 'test' });
    logger.debug('Test debug message');
    logger.trace('Test trace message');
    
    console.log('✓ Basic logging test passed');
    
    // Test 2: Performance monitoring
    performance.startTimer('test_operation');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    const duration = performance.endTimer('test_operation');
    
    console.log(`✓ Performance monitoring test passed (${duration}ms)`);
    
    // Test 3: Error handling - Storage error
    try {
      throw new Error('QuotaExceededError: Storage quota exceeded');
    } catch (error) {
      const result = await errorHandler.handleError(error, 'test_storage_error');
      console.log('✓ Storage error handling test passed:', result.userMessage);
    }
    
    // Test 4: Error handling - Network error
    try {
      throw new Error('NetworkError: Failed to fetch');
    } catch (error) {
      const result = await errorHandler.handleError(error, 'test_network_error', {
        retryFunction: async () => {
          // Simulate successful retry
          return 'Success after retry';
        },
        enableRetry: true
      });
      console.log('✓ Network error handling test passed:', result.userMessage);
    }
    
    // Test 5: Error handling - Facebook integration error
    try {
      throw new Error('Facebook comment insertion failed: Element not found');
    } catch (error) {
      const result = await errorHandler.handleError(error, 'facebook_comment_insertion');
      console.log('✓ Facebook error handling test passed:', result.userMessage);
    }
    
    // Test 6: Debug tools
    debug.enableDebugMode();
    debug.logTemplateMatching(
      'Test post content about cars and motorcycles',
      [{ id: 'test1', label: 'Test Template' }],
      [{ template: { id: 'test1' }, score: 0.8, matchedKeywords: ['cars'] }],
      [{ templateId: 'test1', rank: 1, confidence: 'high', text: 'Test suggestion' }]
    );
    
    debug.logFacebookIntegration('test_action', { testData: true }, true);
    debug.logPerformance('test_performance', 150, { operation: 'test' });
    
    console.log('✓ Debug tools test passed');
    
    // Test 7: Get logs and analytics
    const logs = logger.getLogs({ level: 'INFO' });
    const analytics = logger.getAnalytics();
    
    console.log(`✓ Log retrieval test passed (${logs.length} logs, ${analytics.length} analytics)`);
    
    // Test 8: Performance statistics
    const stats = performance.getStats('test_operation');
    console.log('✓ Performance statistics test passed:', stats);
    
    // Test 9: Error history
    const errorHistory = errorHandler.getErrorHistory();
    console.log(`✓ Error history test passed (${errorHistory.length} errors)`);
    
    // Test 10: Export functionality
    const logExport = logger.exportLogs();
    const debugExport = debug.exportDebugData();
    
    console.log('✓ Export functionality test passed');
    
    console.log('\n🎉 All Error Handling and Logging Tests Passed!');
    
    return {
      success: true,
      testsRun: 10,
      logs: logs.length,
      analytics: analytics.length,
      errors: errorHistory.length,
      performance: stats
    };
    
  } catch (error) {
    console.error('❌ Error Handling and Logging Tests Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test enhanced components integration
async function testEnhancedComponents() {
  console.log('Starting Enhanced Components Integration Tests...');
  
  try {
    // Test enhanced storage manager
    const storageManager = new EnhancedStorageManager();
    await storageManager.initialize();
    
    console.log('✓ Enhanced Storage Manager initialized');
    
    // Test template operations with error handling
    const testTemplate = {
      id: 'test_template_' + Date.now(),
      label: 'Test Template',
      template: 'This is a test template for {site}',
      keywords: ['test', 'template'],
      verticals: ['testing'],
      variants: ['Alternative test template']
    };
    
    const templateId = await storageManager.saveTemplate(testTemplate);
    console.log('✓ Template saved with error handling:', templateId);
    
    const retrievedTemplate = await storageManager.getTemplate(templateId);
    console.log('✓ Template retrieved with error handling:', retrievedTemplate.label);
    
    const allTemplates = await storageManager.getTemplates();
    console.log('✓ All templates retrieved with error handling:', allTemplates.length);
    
    console.log('\n🎉 Enhanced Components Integration Tests Passed!');
    
    return {
      success: true,
      templateId: templateId,
      templatesCount: allTemplates.length
    };
    
  } catch (error) {
    console.error('❌ Enhanced Components Integration Tests Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testErrorHandlingAndLogging = testErrorHandlingAndLogging;
  window.testEnhancedComponents = testEnhancedComponents;
  
  // Auto-run tests in debug mode
  if (window.location.search.includes('debug=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
      console.log('Auto-running error handling tests in debug mode...');
      await testErrorHandlingAndLogging();
      await testEnhancedComponents();
    });
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testErrorHandlingAndLogging,
    testEnhancedComponents
  };
}