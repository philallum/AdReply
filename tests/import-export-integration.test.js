/**
 * Integration Tests for Import/Export Functionality
 * Tests Ad Pack import/export, backup/restore, and data migration
 */

// Test suite for Import/Export Integration
async function runImportExportIntegrationTests() {
  const runner = new TestRunner();
  
  // Test: Ad Pack Import Integration
  runner.test('ImportExportIntegration - Import Ad Packs correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Create test Ad Pack data
    const testAdPack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: [
        {
          id: 'imported_template_1',
          label: 'Imported Automotive Template',
          template: 'Great car! For automotive services, check us out - {site}',
          keywords: ['automotive', 'car', 'services'],
          verticals: ['automotive'],
          variants: ['Nice ride! We offer automotive services - {site}']
        },
        {
          id: 'imported_template_2',
          label: 'Imported Fitness Template',
          template: 'Looking strong! Need a personal trainer? Contact us - {site}',
          keywords: ['fitness', 'training', 'personal'],
          verticals: ['fitness'],
          variants: []
        }
      ],
      metadata: {
        totalTemplates: 2,
        exportType: 'full'
      }
    };
    
    // Test import process
    const importResult = await mockStorageManager.importAdPack(testAdPack);
    
    Assert.equal(importResult.imported, 2, 'Should import all templates');
    Assert.equal(importResult.skipped, 0, 'Should not skip any templates on first import');
    Assert.equal(importResult.errors.length, 0, 'Should have no import errors');
    
    // Verify templates were imported
    const importedTemplates = await mockStorageManager.getTemplates();
    Assert.equal(importedTemplates.length, 2, 'Should have imported templates in storage');
    
    const template1 = await mockStorageManager.getTemplate('imported_template_1');
    Assert.equal(template1.label, 'Imported Automotive Template', 'Should preserve template data');
    Assert.arrayEqual(template1.keywords, ['automotive', 'car', 'services'], 'Should preserve keywords');
    
    // Test duplicate import (should skip)
    const duplicateImportResult = await mockStorageManager.importAdPack(testAdPack);
    Assert.equal(duplicateImportResult.imported, 0, 'Should not import duplicates');
    Assert.equal(duplicateImportResult.skipped, 2, 'Should skip all duplicate templates');
  });

  // Test: Ad Pack Export Integration
  runner.test('ImportExportIntegration - Export Ad Packs correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Add test templates
    const testTemplates = [
      {
        id: 'export_template_1',
        label: 'Export Test Template 1',
        template: 'Template 1 content - {site}',
        keywords: ['export', 'test'],
        verticals: ['testing']
      },
      {
        id: 'export_template_2',
        label: 'Export Test Template 2',
        template: 'Template 2 content - {site}',
        keywords: ['export', 'test'],
        verticals: ['testing']
      },
      {
        id: 'export_template_3',
        label: 'Different Category Template',
        template: 'Different category - {site}',
        keywords: ['different'],
        verticals: ['other']
      }
    ];
    
    for (const template of testTemplates) {
      await mockStorageManager.saveTemplate(template);
    }
    
    // Test full export
    const fullExport = await mockStorageManager.exportTemplates();
    
    Assert.equal(fullExport.version, 1, 'Should have correct version');
    Assert.true(typeof fullExport.exportedAt === 'string', 'Should have export timestamp');
    Assert.equal(fullExport.templates.length, 3, 'Should export all templates');
    Assert.equal(fullExport.metadata.totalTemplates, 3, 'Should have correct metadata');
    Assert.equal(fullExport.metadata.exportType, 'full', 'Should indicate full export');
    
    // Test selective export
    const selectiveExport = await mockStorageManager.exportTemplates(['export_template_1', 'export_template_2']);
    
    Assert.equal(selectiveExport.templates.length, 2, 'Should export selected templates only');
    Assert.equal(selectiveExport.metadata.exportType, 'selective', 'Should indicate selective export');
    
    const exportedIds = selectiveExport.templates.map(t => t.id);
    Assert.includes(exportedIds, 'export_template_1', 'Should include selected template 1');
    Assert.includes(exportedIds, 'export_template_2', 'Should include selected template 2');
    Assert.notIncludes(exportedIds, 'export_template_3', 'Should not include unselected template');
  });

  // Test: Backup and Restore Integration
  runner.test('ImportExportIntegration - Backup and restore data correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Create comprehensive test data
    const testData = {
      templates: [
        {
          id: 'backup_template_1',
          label: 'Backup Template 1',
          template: 'Backup test template 1',
          keywords: ['backup', 'test'],
          verticals: ['testing']
        }
      ],
      settings: {
        ui: {
          theme: 'dark',
          sidebarWidth: 350
        },
        templates: {
          maxSuggestions: 5
        }
      },
      aiSettings: {
        provider: 'gemini',
        enabled: true
      }
    };
    
    // Set up initial data
    await mockStorageManager.saveTemplate(testData.templates[0]);
    await mockStorageManager.saveSettings(testData.settings);
    await mockStorageManager.saveAISettings(testData.aiSettings);
    
    // Create backup
    const backup = await mockStorageManager.createBackup();
    
    Assert.equal(backup.version, 1, 'Should have correct backup version');
    Assert.true(typeof backup.createdAt === 'string', 'Should have creation timestamp');
    Assert.true(typeof backup.data === 'object', 'Should have data object');
    Assert.equal(backup.data.templates.length, 1, 'Should backup templates');
    Assert.equal(backup.data.settings.ui.theme, 'dark', 'Should backup settings');
    Assert.equal(backup.data.aiSettings.provider, 'gemini', 'Should backup AI settings');
    
    // Clear all data
    await mockStorageManager.clearAllData();
    
    // Verify data is cleared
    const clearedTemplates = await mockStorageManager.getTemplates();
    Assert.equal(clearedTemplates.length, 0, 'Should have no templates after clear');
    
    // Restore from backup
    const restoreResult = await mockStorageManager.restoreFromBackup(backup);
    
    Assert.equal(restoreResult.templates.imported, 1, 'Should restore templates');
    Assert.true(restoreResult.settings.restored, 'Should restore settings');
    Assert.true(restoreResult.aiSettings.restored, 'Should restore AI settings');
    Assert.equal(restoreResult.templates.errors.length, 0, 'Should have no restore errors');
    
    // Verify restored data
    const restoredTemplates = await mockStorageManager.getTemplates();
    Assert.equal(restoredTemplates.length, 1, 'Should have restored templates');
    Assert.equal(restoredTemplates[0].id, 'backup_template_1', 'Should restore correct template');
    
    const restoredSettings = await mockStorageManager.getSettings();
    Assert.equal(restoredSettings.ui.theme, 'dark', 'Should restore settings');
    
    const restoredAISettings = await mockStorageManager.getAISettings();
    Assert.equal(restoredAISettings.provider, 'gemini', 'Should restore AI settings');
  });

  // Test: Data Migration Integration
  runner.test('ImportExportIntegration - Handle data migration correctly', async () => {
    const dataMigration = new DataMigration();
    
    // Test migration from version 0 (old format)
    const oldFormatData = {
      templates: [
        {
          id: 'old_format_template',
          label: 'Old Format Template',
          template: 'Old format template content'
          // Missing: usageCount, variants, timestamps
        }
      ]
    };
    
    const migratedData = dataMigration.validateAndMigrate(oldFormatData, 0);
    
    Assert.true(Array.isArray(migratedData.templates), 'Should return migrated templates');
    Assert.equal(migratedData.templates.length, 1, 'Should preserve valid templates');
    
    const migratedTemplate = migratedData.templates[0];
    Assert.equal(migratedTemplate.id, 'old_format_template', 'Should preserve template ID');
    Assert.equal(migratedTemplate.usageCount, 0, 'Should add default usage count');
    Assert.true(Array.isArray(migratedTemplate.variants), 'Should add variants array');
    Assert.true(typeof migratedTemplate.createdAt === 'string', 'Should add created timestamp');
    Assert.true(typeof migratedTemplate.updatedAt === 'string', 'Should add updated timestamp');
    
    // Test migration with invalid data (should be filtered out)
    const invalidData = {
      templates: [
        {
          id: 'valid_template',
          label: 'Valid Template',
          template: 'Valid content',
          keywords: ['valid'],
          verticals: ['test']
        },
        {
          // Invalid: missing required fields
          id: '',
          label: '',
          template: ''
        }
      ]
    };
    
    const filteredMigration = dataMigration.validateAndMigrate(invalidData, 0);
    Assert.equal(filteredMigration.templates.length, 1, 'Should filter out invalid templates');
    Assert.equal(filteredMigration.templates[0].id, 'valid_template', 'Should preserve valid templates');
  });

  // Test: File Format Validation
  runner.test('ImportExportIntegration - Validate file formats correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Test valid Ad Pack format
    const validAdPack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: [
        {
          id: 'valid_template',
          label: 'Valid Template',
          template: 'Valid template content',
          keywords: ['valid'],
          verticals: ['test']
        }
      ],
      metadata: {
        totalTemplates: 1,
        exportType: 'full'
      }
    };
    
    const validResult = await mockStorageManager.importAdPack(validAdPack);
    Assert.equal(validResult.imported, 1, 'Should import valid Ad Pack');
    
    // Test invalid Ad Pack formats
    const invalidFormats = [
      null,
      {},
      { templates: null },
      { templates: 'not-an-array' },
      { templates: [] }, // Empty templates
      { version: 'invalid', templates: [] }
    ];
    
    for (const invalidFormat of invalidFormats) {
      try {
        await mockStorageManager.importAdPack(invalidFormat);
        Assert.true(false, `Should reject invalid format: ${JSON.stringify(invalidFormat)}`);
      } catch (error) {
        Assert.includes(error.message, 'Invalid Ad Pack', 'Should provide appropriate error message');
      }
    }
  });

  // Test: Large Dataset Handling
  runner.test('ImportExportIntegration - Handle large datasets efficiently', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Create large dataset
    const largeTemplateSet = [];
    for (let i = 0; i < 100; i++) {
      largeTemplateSet.push({
        id: `large_template_${i}`,
        label: `Large Template ${i}`,
        template: `Template content ${i} - {site}`,
        keywords: [`keyword${i}`, 'large', 'test'],
        verticals: ['large_test'],
        variants: [`Variant ${i} - {site}`]
      });
    }
    
    const largeAdPack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: largeTemplateSet,
      metadata: {
        totalTemplates: 100,
        exportType: 'full'
      }
    };
    
    // Test import performance
    const importStart = Date.now();
    const importResult = await mockStorageManager.importAdPack(largeAdPack);
    const importTime = Date.now() - importStart;
    
    Assert.equal(importResult.imported, 100, 'Should import all templates');
    Assert.lessThan(importTime, 5000, 'Should import large dataset in reasonable time');
    
    // Test export performance
    const exportStart = Date.now();
    const exportResult = await mockStorageManager.exportTemplates();
    const exportTime = Date.now() - exportStart;
    
    Assert.equal(exportResult.templates.length, 100, 'Should export all templates');
    Assert.lessThan(exportTime, 2000, 'Should export large dataset in reasonable time');
    
    // Verify data integrity
    const allTemplates = await mockStorageManager.getTemplates();
    Assert.equal(allTemplates.length, 100, 'Should maintain all templates in storage');
    
    // Spot check a few templates
    const template50 = await mockStorageManager.getTemplate('large_template_50');
    Assert.equal(template50.label, 'Large Template 50', 'Should preserve template data integrity');
  });

  // Test: Concurrent Import/Export Operations
  runner.test('ImportExportIntegration - Handle concurrent operations safely', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Create multiple Ad Packs for concurrent import
    const adPacks = [];
    for (let i = 0; i < 5; i++) {
      adPacks.push({
        version: 1,
        exportedAt: new Date().toISOString(),
        templates: [
          {
            id: `concurrent_template_${i}`,
            label: `Concurrent Template ${i}`,
            template: `Concurrent template content ${i}`,
            keywords: [`concurrent${i}`],
            verticals: ['concurrent']
          }
        ],
        metadata: {
          totalTemplates: 1,
          exportType: 'selective'
        }
      });
    }
    
    // Test concurrent imports
    const importPromises = adPacks.map(adPack => mockStorageManager.importAdPack(adPack));
    const importResults = await Promise.all(importPromises);
    
    // Verify all imports succeeded
    importResults.forEach((result, index) => {
      Assert.equal(result.imported, 1, `Import ${index} should succeed`);
      Assert.equal(result.errors.length, 0, `Import ${index} should have no errors`);
    });
    
    // Verify all templates were imported
    const allTemplates = await mockStorageManager.getTemplates();
    Assert.equal(allTemplates.length, 5, 'Should import all concurrent templates');
    
    // Test concurrent exports
    const exportPromises = [
      mockStorageManager.exportTemplates(['concurrent_template_0', 'concurrent_template_1']),
      mockStorageManager.exportTemplates(['concurrent_template_2', 'concurrent_template_3']),
      mockStorageManager.exportTemplates(['concurrent_template_4'])
    ];
    
    const exportResults = await Promise.all(exportPromises);
    
    Assert.equal(exportResults[0].templates.length, 2, 'First export should have 2 templates');
    Assert.equal(exportResults[1].templates.length, 2, 'Second export should have 2 templates');
    Assert.equal(exportResults[2].templates.length, 1, 'Third export should have 1 template');
  });

  // Test: Error Recovery and Rollback
  runner.test('ImportExportIntegration - Handle errors and rollback correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Add some existing templates
    await mockStorageManager.saveTemplate({
      id: 'existing_template',
      label: 'Existing Template',
      template: 'Existing content',
      keywords: ['existing'],
      verticals: ['test']
    });
    
    // Create Ad Pack with mix of valid and invalid templates
    const mixedAdPack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: [
        {
          id: 'valid_new_template',
          label: 'Valid New Template',
          template: 'Valid new content',
          keywords: ['valid', 'new'],
          verticals: ['test']
        },
        {
          // Invalid: missing required fields
          id: '',
          label: '',
          template: '',
          keywords: null,
          verticals: null
        },
        {
          id: 'another_valid_template',
          label: 'Another Valid Template',
          template: 'Another valid content',
          keywords: ['another', 'valid'],
          verticals: ['test']
        }
      ],
      metadata: {
        totalTemplates: 3,
        exportType: 'full'
      }
    };
    
    // Test partial import with errors
    const importResult = await mockStorageManager.importAdPack(mixedAdPack);
    
    Assert.equal(importResult.imported, 2, 'Should import valid templates');
    Assert.equal(importResult.skipped, 0, 'Should not skip any templates');
    Assert.equal(importResult.errors.length, 1, 'Should report errors for invalid templates');
    
    // Verify valid templates were imported despite errors
    const validTemplate = await mockStorageManager.getTemplate('valid_new_template');
    Assert.true(validTemplate !== null, 'Should import valid template despite errors');
    
    const anotherValidTemplate = await mockStorageManager.getTemplate('another_valid_template');
    Assert.true(anotherValidTemplate !== null, 'Should import another valid template');
    
    // Verify existing data was not affected
    const existingTemplate = await mockStorageManager.getTemplate('existing_template');
    Assert.true(existingTemplate !== null, 'Should preserve existing templates');
    Assert.equal(existingTemplate.label, 'Existing Template', 'Should not modify existing templates');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runImportExportIntegrationTests = runImportExportIntegrationTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runImportExportIntegrationTests;
}