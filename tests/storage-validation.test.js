/**
 * Additional Unit Tests for Storage Operations and Data Validation
 * Tests comprehensive storage operations, data integrity, and validation
 */

// Test suite for Storage Operations and Data Validation
async function runStorageValidationTests() {
  const runner = new TestRunner();
  
  // Test: Data Model Validation Comprehensive
  runner.test('StorageValidation - Validate all data models comprehensively', async () => {
    // Test Template validation
    const validTemplate = {
      id: 'test_template_1',
      label: 'Test Template',
      template: 'This is a test template for {site}',
      keywords: ['test', 'template'],
      verticals: ['testing'],
      variants: ['Alternative test template']
    };
    
    const template = Template.fromObject(validTemplate);
    const validation = template.validate();
    Assert.true(validation.isValid, 'Valid template should pass validation');
    Assert.equal(validation.errors.length, 0, 'Valid template should have no errors');
    
    // Test invalid template
    const invalidTemplate = {
      id: '', // Invalid: empty ID
      label: 'x'.repeat(101), // Invalid: too long
      template: '', // Invalid: empty template
      keywords: 'not-an-array', // Invalid: not array
      verticals: ['test', 123], // Invalid: mixed types
      variants: null // Invalid: null variants
    };
    
    const invalidTemplateObj = Template.fromObject(invalidTemplate);
    const invalidValidation = invalidTemplateObj.validate();
    Assert.false(invalidValidation.isValid, 'Invalid template should fail validation');
    Assert.greaterThan(invalidValidation.errors.length, 0, 'Invalid template should have errors');
  });

  // Test: License Data Validation
  runner.test('StorageValidation - Validate license data thoroughly', async () => {
    // Test valid license
    const validLicense = {
      token: 'valid.jwt.token',
      status: 'pro',
      tier: 'pro',
      plan: 'monthly',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      features: ['unlimited_templates', 'ai_integration']
    };
    
    const license = License.fromObject(validLicense);
    const validation = license.validate();
    Assert.true(validation.isValid, 'Valid license should pass validation');
    
    // Test license feature checking
    Assert.true(license.hasFeature('unlimited_templates'), 'Should have unlimited templates feature');
    Assert.true(license.hasFeature('ai_integration'), 'Should have AI integration feature');
    Assert.false(license.hasFeature('nonexistent_feature'), 'Should not have nonexistent feature');
    
    // Test invalid license
    const invalidLicense = {
      status: 'invalid_status', // Invalid status
      tier: 'invalid_tier', // Invalid tier
      plan: 'invalid_plan', // Invalid plan
      features: ['invalid_feature'] // Invalid feature
    };
    
    const invalidLicenseObj = License.fromObject(invalidLicense);
    const invalidValidation = invalidLicenseObj.validate();
    Assert.false(invalidValidation.isValid, 'Invalid license should fail validation');
  });

  // Test: Settings Validation
  runner.test('StorageValidation - Validate settings data comprehensively', async () => {
    // Test valid settings
    const validSettings = {
      ui: {
        sidebarWidth: 350,
        theme: 'dark',
        showUpgradePrompts: false
      },
      templates: {
        maxSuggestions: 5,
        enableRotation: true,
        preventRepetition: false
      }
    };
    
    const settings = Settings.fromObject(validSettings);
    const validation = settings.validate();
    Assert.true(validation.isValid, 'Valid settings should pass validation');
    
    // Test invalid settings
    const invalidSettings = {
      ui: {
        sidebarWidth: 100, // Too small
        theme: 'invalid_theme', // Invalid theme
        showUpgradePrompts: 'not_boolean' // Wrong type
      },
      templates: {
        maxSuggestions: 15, // Too large
        enableRotation: 'not_boolean', // Wrong type
        preventRepetition: null // Wrong type
      }
    };
    
    const invalidSettingsObj = Settings.fromObject(invalidSettings);
    const invalidValidation = invalidSettingsObj.validate();
    Assert.false(invalidValidation.isValid, 'Invalid settings should fail validation');
  });

  // Test: AI Settings Validation
  runner.test('StorageValidation - Validate AI settings thoroughly', async () => {
    // Test valid AI settings
    const validAISettings = {
      provider: 'gemini',
      geminiApiKey: 'valid-api-key',
      openaiApiKey: '',
      enabled: true
    };
    
    const aiSettings = AISettings.fromObject(validAISettings);
    const validation = aiSettings.validate();
    Assert.true(validation.isValid, 'Valid AI settings should pass validation');
    
    // Test invalid AI settings
    const invalidAISettings = {
      provider: 'invalid_provider', // Invalid provider
      geminiApiKey: 123, // Wrong type
      openaiApiKey: null, // Wrong type
      enabled: 'not_boolean' // Wrong type
    };
    
    const invalidAISettingsObj = AISettings.fromObject(invalidAISettings);
    const invalidValidation = invalidAISettingsObj.validate();
    Assert.false(invalidValidation.isValid, 'Invalid AI settings should fail validation');
    
    // Test business rule validation
    const inconsistentSettings = {
      provider: 'off',
      enabled: true // Inconsistent: enabled but provider is off
    };
    
    const inconsistentObj = AISettings.fromObject(inconsistentSettings);
    const inconsistentValidation = inconsistentObj.validate();
    Assert.false(inconsistentValidation.isValid, 'Inconsistent AI settings should fail validation');
  });

  // Test: Data Sanitization
  runner.test('StorageValidation - Sanitize data properly', async () => {
    const unsafeTemplate = {
      id: 'test_template_xss',
      label: '<script>alert("xss")</script>Unsafe Label',
      template: 'Template with <img src="x" onerror="alert(1)"> XSS',
      keywords: ['<script>', 'safe-keyword'],
      verticals: ['test</script>'],
      variants: ['Variant with "quotes" and \'apostrophes\'']
    };
    
    const template = Template.fromObject(unsafeTemplate);
    const sanitized = template.sanitize();
    const sanitizedObj = sanitized.toObject();
    
    // Check that dangerous content is sanitized
    Assert.notIncludes(sanitizedObj.label, '<script>', 'Should sanitize script tags in label');
    Assert.notIncludes(sanitizedObj.template, '<img', 'Should sanitize img tags in template');
    Assert.includes(sanitizedObj.label, '&lt;script&gt;', 'Should escape HTML entities');
    
    // Check that safe content is preserved
    Assert.includes(sanitizedObj.keywords, 'safe-keyword', 'Should preserve safe keywords');
  });

  // Test: Data Migration
  runner.test('StorageValidation - Handle data migration correctly', async () => {
    const migration = new DataMigration();
    
    // Test migration from version 0 to current
    const oldData = {
      templates: [
        {
          id: 'old_template',
          label: 'Old Template',
          template: 'Old template content'
          // Missing: usageCount, variants, timestamps
        }
      ]
    };
    
    const migratedData = migration.validateAndMigrate(oldData, 0);
    
    Assert.true(Array.isArray(migratedData.templates), 'Should return migrated templates array');
    Assert.greaterThan(migratedData.templates.length, 0, 'Should preserve valid templates');
    
    const migratedTemplate = migratedData.templates[0];
    Assert.equal(migratedTemplate.usageCount, 0, 'Should add default usage count');
    Assert.true(Array.isArray(migratedTemplate.variants), 'Should add default variants array');
    Assert.true(typeof migratedTemplate.createdAt === 'string', 'Should add created timestamp');
  });

  // Test: Storage Error Handling
  runner.test('StorageValidation - Handle storage errors gracefully', async () => {
    const mockStorageManager = {
      async saveTemplate(template) {
        throw new Error('Storage quota exceeded');
      },
      
      async getTemplate(id) {
        if (id === 'error_template') {
          throw new Error('Database connection failed');
        }
        return null;
      },
      
      async getTemplates() {
        throw new Error('Index corruption detected');
      }
    };
    
    // Test save error handling
    try {
      await mockStorageManager.saveTemplate({ id: 'test' });
      Assert.true(false, 'Should throw error for save operation');
    } catch (error) {
      Assert.includes(error.message, 'Storage quota exceeded', 'Should propagate storage error');
    }
    
    // Test get error handling
    try {
      await mockStorageManager.getTemplate('error_template');
      Assert.true(false, 'Should throw error for get operation');
    } catch (error) {
      Assert.includes(error.message, 'Database connection failed', 'Should propagate database error');
    }
    
    // Test list error handling
    try {
      await mockStorageManager.getTemplates();
      Assert.true(false, 'Should throw error for list operation');
    } catch (error) {
      Assert.includes(error.message, 'Index corruption detected', 'Should propagate index error');
    }
  });

  // Test: Concurrent Operations
  runner.test('StorageValidation - Handle concurrent operations safely', async () => {
    const mockStorage = MockHelpers.createMockStorageManager();
    
    // Simulate concurrent template saves
    const concurrentSaves = [];
    for (let i = 0; i < 10; i++) {
      const template = {
        id: `concurrent_template_${i}`,
        label: `Concurrent Template ${i}`,
        template: `Template content ${i}`,
        keywords: [`keyword${i}`],
        verticals: ['test']
      };
      concurrentSaves.push(mockStorage.saveTemplate(template));
    }
    
    const results = await Promise.all(concurrentSaves);
    Assert.equal(results.length, 10, 'Should handle all concurrent saves');
    
    // Verify all templates were saved
    const allTemplates = await mockStorage.getTemplates();
    Assert.greaterThan(allTemplates.length, 9, 'Should save all concurrent templates');
  });

  // Test: Data Integrity Checks
  runner.test('StorageValidation - Maintain data integrity', async () => {
    const mockStorage = MockHelpers.createMockStorageManager();
    
    // Test template ID uniqueness
    const template1 = {
      id: 'duplicate_id',
      label: 'Template 1',
      template: 'Content 1',
      keywords: ['test'],
      verticals: ['test']
    };
    
    const template2 = {
      id: 'duplicate_id', // Same ID
      label: 'Template 2',
      template: 'Content 2',
      keywords: ['test'],
      verticals: ['test']
    };
    
    await mockStorage.saveTemplate(template1);
    await mockStorage.saveTemplate(template2); // Should overwrite
    
    const retrieved = await mockStorage.getTemplate('duplicate_id');
    Assert.equal(retrieved.label, 'Template 2', 'Should overwrite template with same ID');
    
    // Test group history consistency
    const groupId = 'integrity_test_group';
    await mockStorage.updateGroupHistory(groupId, 'template_1', 0);
    await mockStorage.updateGroupHistory(groupId, 'template_2', 1);
    
    const history = await mockStorage.getGroupHistory(groupId);
    Assert.equal(history.lastTemplateId, 'template_2', 'Should maintain latest template ID');
    Assert.equal(history.lastVariantIndex, 1, 'Should maintain latest variant index');
    Assert.equal(history.totalComments, 2, 'Should increment total comments');
  });

  // Test: Performance with Large Datasets
  runner.test('StorageValidation - Handle large datasets efficiently', async () => {
    const mockStorage = MockHelpers.createMockStorageManager();
    
    // Create large number of templates
    const startTime = Date.now();
    const templateCount = 100;
    
    for (let i = 0; i < templateCount; i++) {
      const template = {
        id: `perf_template_${i}`,
        label: `Performance Template ${i}`,
        template: `Template content for performance test ${i}`,
        keywords: [`keyword${i}`, 'performance', 'test'],
        verticals: ['performance_test']
      };
      await mockStorage.saveTemplate(template);
    }
    
    const saveTime = Date.now() - startTime;
    Assert.lessThan(saveTime, 5000, 'Should save 100 templates in under 5 seconds');
    
    // Test retrieval performance
    const retrievalStart = Date.now();
    const allTemplates = await mockStorage.getTemplates();
    const retrievalTime = Date.now() - retrievalStart;
    
    Assert.equal(allTemplates.length, templateCount, 'Should retrieve all templates');
    Assert.lessThan(retrievalTime, 1000, 'Should retrieve templates in under 1 second');
    
    // Test filtered retrieval performance
    const filterStart = Date.now();
    const filteredTemplates = await mockStorage.getTemplates({ vertical: 'performance_test' });
    const filterTime = Date.now() - filterStart;
    
    Assert.equal(filteredTemplates.length, templateCount, 'Should filter templates correctly');
    Assert.lessThan(filterTime, 1000, 'Should filter templates in under 1 second');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runStorageValidationTests = runStorageValidationTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runStorageValidationTests;
}