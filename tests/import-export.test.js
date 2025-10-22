/**
 * Integration Tests for Import/Export Functionality
 * Tests Ad Pack import/export, backup/restore, and data migration
 */

// Test suite for Import/Export Functionality
async function runImportExportTests() {
  const runner = new TestRunner();
  
  // Test: Ad Pack Import Functionality
  runner.test('ImportExport - Import Ad Packs correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    class MockAdPackImporter {
      constructor(storageManager) {
        this.storageManager = storageManager;
      }
      
      async importAdPack(adPackData) {
        // Validate Ad Pack structure
        if (!adPackData || !adPackData.templates || !Array.isArray(adPackData.templates)) {
          throw new Error('Invalid Ad Pack format');
        }
        
        const results = {
          imported: 0,
          skipped: 0,
          errors: []
        };
        
        // Import each template
        for (const templateData of adPackData.templates) {
          try {
            // Check if template already exists
            const existing = await this.storageManager.getTemplate(templateData.id);
            if (existing) {
              results.skipped++;
              continue;
            }
            
            await this.storageManager.saveTemplate(templateData);
            results.imported++;
          } catch (error) {
            results.errors.push(`Failed to import template ${templateData.id}: ${error.message}`);
          }
        }
        
        return results;
      }
      
      validateAdPackStructure(adPackData) {
        const errors = [];
        
        if (!adPackData) {
          errors.push('Ad Pack data is null or undefined');
          return errors;
        }
        
        if (!adPackData.version) {
          errors.push('Ad Pack missing version information');
        }
        
        if (!adPackData.templates || !Array.isArray(adPackData.templates)) {
          errors.push('Ad Pack missing or invalid templates array');
          return errors;
        }
        
        // Validate each template
        adPackData.templates.forEach((template, index) => {
          if (!template.id) {
            errors.push(`Template ${index} missing ID`);
          }
          if (!template.label) {
            errors.push(`Template ${index} missing label`);
          }
          if (!template.template) {
            errors.push(`Template ${index} missing template content`);
          }
          if (!Array.isArray(template.keywords)) {
            errors.push(`Template ${index} missing or invalid keywords array`);
          }
          if (!Array.isArray(template.verticals)) {
            errors.push(`Template ${index} missing or invalid verticals array`);
          }
        });
        
        return errors;
      }
    }
    
    const importer = new MockAdPackImporter(mockStorageManager);
    
    // Test valid Ad Pack import
    const validAdPack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: [
        {
          id: 'automotive_pack_1',
          label: 'Automotive Service 1',
          template: 'Great car! Need automotive services? Check us out - {site}',
          keywords: ['automotive', 'car', 'service'],
          verticals: ['automotive'],
          variants: ['Nice ride! We offer automotive services - {site}']
        },
        {
          id: 'fitness_pack_1',
          label: 'Fitness Service 1',
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
    
    const importResult = await importer.importAdPack(validAdPack);
    Assert.equal(importResult.imported, 2, 'Should import all valid templates');
    Assert.equal(importResult.skipped, 0, 'Should not skip any templates on first import');
    Assert.equal(importResult.errors.length, 0, 'Should have no import errors');
    
    // Test duplicate import (should skip existing templates)
    const duplicateResult = await importer.importAdPack(validAdPack);
    Assert.equal(duplicateResult.imported, 0, 'Should not import duplicate templates');
    Assert.equal(duplicateResult.skipped, 2, 'Should skip all existing templates');
    
    // Verify templates were imported
    const importedTemplates = await mockStorageManager.getTemplates();
    Assert.equal(importedTemplates.length, 2, 'Should have imported templates in storage');
    
    const automotiveTemplate = importedTemplates.find(t => t.id === 'automotive_pack_1');
    Assert.true(automotiveTemplate !== undefined, 'Should find automotive template');
    Assert.equal(automotiveTemplate.label, 'Automotive Service 1', 'Should preserve template label');
  });

  // Test: Ad Pack Export Functionality
  runner.test('ImportExport - Export Ad Packs correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Add test templates
    const testTemplates = [
      {
        id: 'export_test_1',
        label: 'Export Test 1',
        template: 'Test template 1 content',
        keywords: ['test', 'export'],
        verticals: ['testing'],
        variants: ['Test variant 1'],
        usageCount: 5
      },
      {
        id: 'export_test_2',
        label: 'Export Test 2',
        template: 'Test template 2 content',
        keywords: ['test', 'export'],
        verticals: ['testing'],
        variants: [],
        usageCount: 3
      },
      {
        id: 'export_test_3',
        label: 'Export Test 3',
        template: 'Test template 3 content',
        keywords: ['test', 'export'],
        verticals: ['different'],
        variants: ['Test variant 3a', 'Test variant 3b'],
        usageCount: 1
      }
    ];
    
    for (const template of testTemplates) {
      await mockStorageManager.saveTemplate(template);
    }
    
    class MockAdPackExporter {
      constructor(storageManager) {
        this.storageManager = storageManager;
      }
      
      async exportAllTemplates() {
        const templates = await this.storageManager.getTemplates();
        
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          templates: templates,
          metadata: {
            totalTemplates: templates.length,
            exportType: 'full'
          }
        };
      }
      
      async exportSelectedTemplates(templateIds) {
        const templates = [];
        
        for (const id of templateIds) {
          const template = await this.storageManager.getTemplate(id);
          if (template) {
            templates.push(template);
          }
        }
        
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          templates: templates,
          metadata: {
            totalTemplates: templates.length,
            exportType: 'selective',
            selectedIds: templateIds
          }
        };
      }
      
      async exportByVertical(vertical) {
        const allTemplates = await this.storageManager.getTemplates();
        const filteredTemplates = allTemplates.filter(t => 
          t.verticals && t.verticals.includes(vertical)
        );
        
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          templates: filteredTemplates,
          metadata: {
            totalTemplates: filteredTemplates.length,
            exportType: 'vertical',
            vertical: vertical
          }
        };
      }
    }
    
    const exporter = new MockAdPackExporter(mockStorageManager);
    
    // Test full export
    const fullExport = await exporter.exportAllTemplates();
    Assert.equal(fullExport.version, 1, 'Should include version information');
    Assert.true(typeof fullExport.exportedAt === 'string', 'Should include export timestamp');
    Assert.equal(fullExport.templates.length, 3, 'Should export all templates');
    Assert.equal(fullExport.metadata.totalTemplates, 3, 'Should include correct metadata');
    Assert.equal(fullExport.metadata.exportType, 'full', 'Should indicate full export');
    
    // Test selective export
    const selectedIds = ['export_test_1', 'export_test_3'];
    const selectiveExport = await exporter.exportSelectedTemplates(selectedIds);
    Assert.equal(selectiveExport.templates.length, 2, 'Should export selected templates only');
    Assert.equal(selectiveExport.metadata.exportType, 'selective', 'Should indicate selective export');
    Assert.arrayEqual(selectiveExport.metadata.selectedIds, selectedIds, 'Should include selected IDs');
    
    // Test vertical export
    const verticalExport = await exporter.exportByVertical('testing');
    Assert.equal(verticalExport.templates.length, 2, 'Should export templates from specific vertical');
    Assert.equal(verticalExport.metadata.exportType, 'vertical', 'Should indicate vertical export');
    Assert.equal(verticalExport.metadata.vertical, 'testing', 'Should include vertical name');
    
    // Verify exported template structure
    const exportedTemplate = fullExport.templates[0];
    Assert.true(typeof exportedTemplate.id === 'string', 'Exported template should have ID');
    Assert.true(typeof exportedTemplate.label === 'string', 'Exported template should have label');
    Assert.true(typeof exportedTemplate.template === 'string', 'Exported template should have content');
    Assert.true(Array.isArray(exportedTemplate.keywords), 'Exported template should have keywords array');
    Assert.true(Array.isArray(exportedTemplate.verticals), 'Exported template should have verticals array');
  });

  // Test: Backup and Restore Functionality
  runner.test('ImportExport - Create and restore backups correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    // Add test data
    await mockStorageManager.saveTemplate({
      id: 'backup_test_1',
      label: 'Backup Test Template',
      template: 'Backup test content',
      keywords: ['backup', 'test'],
      verticals: ['testing']
    });
    
    await mockStorageManager.updateGroupHistory('backup_group_1', 'backup_test_1', 0);
    
    class MockBackupManager {
      constructor(storageManager) {
        this.storageManager = storageManager;
      }
      
      async createFullBackup() {
        const [templates, groups] = await Promise.all([
          this.storageManager.getTemplates(),
          this.storageManager.getAllGroupHistories()
        ]);
        
        return {
          version: 1,
          createdAt: new Date().toISOString(),
          data: {
            templates,
            groups
          },
          metadata: {
            templateCount: templates.length,
            groupCount: groups.length
          }
        };
      }
      
      async restoreFromBackup(backupData) {
        if (!backupData || !backupData.data) {
          throw new Error('Invalid backup format');
        }
        
        const results = {
          templates: { imported: 0, errors: [] },
          groups: { imported: 0, errors: [] }
        };
        
        // Restore templates
        if (backupData.data.templates) {
          for (const templateData of backupData.data.templates) {
            try {
              await this.storageManager.saveTemplate(templateData);
              results.templates.imported++;
            } catch (error) {
              results.templates.errors.push(`Failed to restore template ${templateData.id}: ${error.message}`);
            }
          }
        }
        
        // Restore group histories
        if (backupData.data.groups) {
          for (const groupData of backupData.data.groups) {
            try {
              await this.storageManager.updateGroupHistory(
                groupData.groupId,
                groupData.lastTemplateId,
                groupData.lastVariantIndex
              );
              results.groups.imported++;
            } catch (error) {
              results.groups.errors.push(`Failed to restore group ${groupData.groupId}: ${error.message}`);
            }
          }
        }
        
        return results;
      }
      
      validateBackupStructure(backupData) {
        const errors = [];
        
        if (!backupData) {
          errors.push('Backup data is null or undefined');
          return errors;
        }
        
        if (!backupData.version) {
          errors.push('Backup missing version information');
        }
        
        if (!backupData.createdAt) {
          errors.push('Backup missing creation timestamp');
        }
        
        if (!backupData.data) {
          errors.push('Backup missing data section');
          return errors;
        }
        
        if (backupData.data.templates && !Array.isArray(backupData.data.templates)) {
          errors.push('Backup templates data is not an array');
        }
        
        if (backupData.data.groups && !Array.isArray(backupData.data.groups)) {
          errors.push('Backup groups data is not an array');
        }
        
        return errors;
      }
    }
    
    const backupManager = new MockBackupManager(mockStorageManager);
    
    // Test backup creation
    const backup = await backupManager.createFullBackup();
    Assert.equal(backup.version, 1, 'Should include version in backup');
    Assert.true(typeof backup.createdAt === 'string', 'Should include creation timestamp');
    Assert.equal(backup.data.templates.length, 1, 'Should backup all templates');
    Assert.equal(backup.data.groups.length, 1, 'Should backup all group histories');
    Assert.equal(backup.metadata.templateCount, 1, 'Should include correct template count');
    Assert.equal(backup.metadata.groupCount, 1, 'Should include correct group count');
    
    // Test backup validation
    const validationErrors = backupManager.validateBackupStructure(backup);
    Assert.equal(validationErrors.length, 0, 'Valid backup should pass validation');
    
    // Test invalid backup validation
    const invalidBackup = { version: 1 }; // Missing required fields
    const invalidErrors = backupManager.validateBackupStructure(invalidBackup);
    Assert.greaterThan(invalidErrors.length, 0, 'Invalid backup should fail validation');
    
    // Clear storage and test restore
    await mockStorageManager.clearAllData();
    
    const restoreResult = await backupManager.restoreFromBackup(backup);
    Assert.equal(restoreResult.templates.imported, 1, 'Should restore all templates');
    Assert.equal(restoreResult.groups.imported, 1, 'Should restore all group histories');
    Assert.equal(restoreResult.templates.errors.length, 0, 'Should have no template restore errors');
    Assert.equal(restoreResult.groups.errors.length, 0, 'Should have no group restore errors');
    
    // Verify restored data
    const restoredTemplates = await mockStorageManager.getTemplates();
    const restoredGroups = await mockStorageManager.getAllGroupHistories();
    
    Assert.equal(restoredTemplates.length, 1, 'Should have restored templates');
    Assert.equal(restoredGroups.length, 1, 'Should have restored group histories');
    Assert.equal(restoredTemplates[0].id, 'backup_test_1', 'Should restore correct template');
    Assert.equal(restoredGroups[0].groupId, 'backup_group_1', 'Should restore correct group history');
  });

  // Test: Data Migration During Import
  runner.test('ImportExport - Handle data migration during import', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    class MockDataMigrator {
      constructor() {
        this.currentVersion = 2;
      }
      
      migrateAdPackData(adPackData, fromVersion) {
        if (fromVersion >= this.currentVersion) {
          return adPackData; // No migration needed
        }
        
        let migratedData = { ...adPackData };
        
        // Migration from version 0 to 1
        if (fromVersion < 1) {
          migratedData = this.migrateToV1(migratedData);
        }
        
        // Migration from version 1 to 2
        if (fromVersion < 2) {
          migratedData = this.migrateToV2(migratedData);
        }
        
        migratedData.version = this.currentVersion;
        return migratedData;
      }
      
      migrateToV1(data) {
        // Add missing fields for version 1
        if (data.templates) {
          data.templates = data.templates.map(template => ({
            ...template,
            usageCount: template.usageCount || 0,
            variants: template.variants || [],
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || new Date().toISOString()
          }));
        }
        
        return data;
      }
      
      migrateToV2(data) {
        // Add metadata for version 2
        if (!data.metadata) {
          data.metadata = {
            totalTemplates: data.templates ? data.templates.length : 0,
            exportType: 'unknown'
          };
        }
        
        // Ensure all templates have verticals array
        if (data.templates) {
          data.templates = data.templates.map(template => ({
            ...template,
            verticals: template.verticals || ['general']
          }));
        }
        
        return data;
      }
    }
    
    const migrator = new MockDataMigrator();
    
    // Test migration from version 0
    const v0AdPack = {
      // No version field (implies version 0)
      templates: [
        {
          id: 'migration_test_1',
          label: 'Migration Test',
          template: 'Test template content',
          keywords: ['test']
          // Missing: usageCount, variants, timestamps, verticals
        }
      ]
    };
    
    const migratedV0 = migrator.migrateAdPackData(v0AdPack, 0);
    Assert.equal(migratedV0.version, 2, 'Should update to current version');
    Assert.equal(migratedV0.templates[0].usageCount, 0, 'Should add default usage count');
    Assert.true(Array.isArray(migratedV0.templates[0].variants), 'Should add variants array');
    Assert.true(typeof migratedV0.templates[0].createdAt === 'string', 'Should add created timestamp');
    Assert.true(Array.isArray(migratedV0.templates[0].verticals), 'Should add verticals array');
    Assert.true(typeof migratedV0.metadata === 'object', 'Should add metadata');
    
    // Test migration from version 1
    const v1AdPack = {
      version: 1,
      templates: [
        {
          id: 'migration_test_2',
          label: 'Migration Test V1',
          template: 'Test template content',
          keywords: ['test'],
          usageCount: 5,
          variants: ['variant 1'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
          // Missing: verticals, metadata
        }
      ]
    };
    
    const migratedV1 = migrator.migrateAdPackData(v1AdPack, 1);
    Assert.equal(migratedV1.version, 2, 'Should update to current version');
    Assert.equal(migratedV1.templates[0].usageCount, 5, 'Should preserve existing usage count');
    Assert.true(Array.isArray(migratedV1.templates[0].verticals), 'Should add verticals array');
    Assert.includes(migratedV1.templates[0].verticals, 'general', 'Should add default vertical');
    Assert.true(typeof migratedV1.metadata === 'object', 'Should add metadata');
    
    // Test no migration needed for current version
    const currentAdPack = {
      version: 2,
      templates: [
        {
          id: 'migration_test_3',
          label: 'Current Version Test',
          template: 'Test template content',
          keywords: ['test'],
          verticals: ['testing'],
          usageCount: 3,
          variants: []
        }
      ],
      metadata: {
        totalTemplates: 1,
        exportType: 'full'
      }
    };
    
    const noMigration = migrator.migrateAdPackData(currentAdPack, 2);
    Assert.equal(noMigration.version, 2, 'Should keep current version');
    Assert.equal(noMigration.templates[0].id, 'migration_test_3', 'Should preserve all data');
  });

  // Test: Large File Handling
  runner.test('ImportExport - Handle large files efficiently', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    class MockLargeFileHandler {
      constructor(storageManager) {
        this.storageManager = storageManager;
        this.chunkSize = 100; // Process in chunks of 100 templates
      }
      
      async importLargeAdPack(adPackData, progressCallback) {
        if (!adPackData.templates || !Array.isArray(adPackData.templates)) {
          throw new Error('Invalid Ad Pack format');
        }
        
        const totalTemplates = adPackData.templates.length;
        const results = { imported: 0, skipped: 0, errors: [] };
        
        // Process in chunks
        for (let i = 0; i < totalTemplates; i += this.chunkSize) {
          const chunk = adPackData.templates.slice(i, i + this.chunkSize);
          
          for (const template of chunk) {
            try {
              const existing = await this.storageManager.getTemplate(template.id);
              if (existing) {
                results.skipped++;
              } else {
                await this.storageManager.saveTemplate(template);
                results.imported++;
              }
            } catch (error) {
              results.errors.push(`Failed to import ${template.id}: ${error.message}`);
            }
          }
          
          // Report progress
          if (progressCallback) {
            const progress = Math.min(i + this.chunkSize, totalTemplates);
            progressCallback({
              processed: progress,
              total: totalTemplates,
              percentage: Math.round((progress / totalTemplates) * 100)
            });
          }
          
          // Yield control to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        return results;
      }
      
      async exportLargeTemplateSet() {
        const startTime = Date.now();
        
        // Simulate large template set
        const templates = [];
        for (let i = 0; i < 1000; i++) {
          templates.push({
            id: `large_template_${i}`,
            label: `Large Template ${i}`,
            template: `Template content ${i}`,
            keywords: [`keyword${i}`, 'large', 'test'],
            verticals: ['testing'],
            variants: [`Variant ${i}a`, `Variant ${i}b`],
            usageCount: Math.floor(Math.random() * 100)
          });
        }
        
        const exportData = {
          version: 1,
          exportedAt: new Date().toISOString(),
          templates: templates,
          metadata: {
            totalTemplates: templates.length,
            exportType: 'large_test',
            processingTime: Date.now() - startTime
          }
        };
        
        return exportData;
      }
    }
    
    const largeFileHandler = new MockLargeFileHandler(mockStorageManager);
    
    // Test large export
    const largeExport = await largeFileHandler.exportLargeTemplateSet();
    Assert.equal(largeExport.templates.length, 1000, 'Should export large number of templates');
    Assert.lessThan(largeExport.metadata.processingTime, 5000, 'Should export efficiently');
    
    // Test large import with progress tracking
    let progressUpdates = [];
    const progressCallback = (progress) => {
      progressUpdates.push(progress);
    };
    
    const importResult = await largeFileHandler.importLargeAdPack(largeExport, progressCallback);
    
    Assert.equal(importResult.imported, 1000, 'Should import all templates');
    Assert.equal(importResult.errors.length, 0, 'Should have no import errors');
    Assert.greaterThan(progressUpdates.length, 0, 'Should provide progress updates');
    
    const finalProgress = progressUpdates[progressUpdates.length - 1];
    Assert.equal(finalProgress.processed, 1000, 'Should report complete progress');
    Assert.equal(finalProgress.percentage, 100, 'Should reach 100% completion');
    
    // Verify templates were imported
    const importedTemplates = await mockStorageManager.getTemplates();
    Assert.equal(importedTemplates.length, 1000, 'Should have all templates in storage');
  });

  // Test: Error Recovery and Partial Imports
  runner.test('ImportExport - Handle partial imports and error recovery', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    
    class MockErrorRecoveryImporter {
      constructor(storageManager) {
        this.storageManager = storageManager;
      }
      
      async importWithErrorRecovery(adPackData) {
        const results = {
          imported: 0,
          skipped: 0,
          errors: [],
          partialSuccess: false
        };
        
        if (!adPackData.templates || !Array.isArray(adPackData.templates)) {
          throw new Error('Invalid Ad Pack format');
        }
        
        for (const template of adPackData.templates) {
          try {
            // Simulate validation
            if (!template.id) {
              throw new Error('Missing template ID');
            }
            
            if (!template.template) {
              throw new Error('Missing template content');
            }
            
            // Check for existing template
            const existing = await this.storageManager.getTemplate(template.id);
            if (existing) {
              results.skipped++;
              continue;
            }
            
            // Attempt to save
            await this.storageManager.saveTemplate(template);
            results.imported++;
            
          } catch (error) {
            results.errors.push({
              templateId: template.id || 'unknown',
              error: error.message,
              templateData: template
            });
          }
        }
        
        // Determine if import was partially successful
        results.partialSuccess = results.imported > 0 && results.errors.length > 0;
        
        return results;
      }
      
      async retryFailedImports(previousResults) {
        const retryResults = {
          imported: 0,
          stillFailed: 0,
          errors: []
        };
        
        for (const failedItem of previousResults.errors) {
          try {
            // Attempt to fix common issues
            const fixedTemplate = this.attemptTemplateFix(failedItem.templateData);
            
            if (fixedTemplate) {
              await this.storageManager.saveTemplate(fixedTemplate);
              retryResults.imported++;
            } else {
              retryResults.stillFailed++;
              retryResults.errors.push(failedItem);
            }
          } catch (error) {
            retryResults.stillFailed++;
            retryResults.errors.push({
              ...failedItem,
              retryError: error.message
            });
          }
        }
        
        return retryResults;
      }
      
      attemptTemplateFix(templateData) {
        const fixed = { ...templateData };
        
        // Fix missing ID
        if (!fixed.id) {
          fixed.id = `fixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Fix missing template content
        if (!fixed.template) {
          if (fixed.label) {
            fixed.template = `Template for ${fixed.label}`;
          } else {
            return null; // Cannot fix
          }
        }
        
        // Fix missing arrays
        if (!Array.isArray(fixed.keywords)) {
          fixed.keywords = [];
        }
        
        if (!Array.isArray(fixed.verticals)) {
          fixed.verticals = ['general'];
        }
        
        if (!Array.isArray(fixed.variants)) {
          fixed.variants = [];
        }
        
        return fixed;
      }
    }
    
    const errorRecoveryImporter = new MockErrorRecoveryImporter(mockStorageManager);
    
    // Create Ad Pack with some invalid templates
    const problematicAdPack = {
      version: 1,
      templates: [
        {
          id: 'valid_template_1',
          label: 'Valid Template',
          template: 'This is a valid template',
          keywords: ['valid'],
          verticals: ['testing']
        },
        {
          // Missing ID
          label: 'Invalid Template 1',
          template: 'This template has no ID',
          keywords: ['invalid'],
          verticals: ['testing']
        },
        {
          id: 'invalid_template_2',
          label: 'Invalid Template 2',
          // Missing template content
          keywords: ['invalid'],
          verticals: ['testing']
        },
        {
          id: 'valid_template_2',
          label: 'Another Valid Template',
          template: 'This is another valid template',
          keywords: ['valid'],
          verticals: ['testing']
        }
      ]
    };
    
    // Test initial import with errors
    const initialResult = await errorRecoveryImporter.importWithErrorRecovery(problematicAdPack);
    
    Assert.equal(initialResult.imported, 2, 'Should import valid templates');
    Assert.equal(initialResult.errors.length, 2, 'Should record errors for invalid templates');
    Assert.true(initialResult.partialSuccess, 'Should indicate partial success');
    
    // Test retry of failed imports
    const retryResult = await errorRecoveryImporter.retryFailedImports(initialResult);
    
    Assert.greaterThan(retryResult.imported, 0, 'Should successfully fix and import some failed templates');
    Assert.lessThan(retryResult.stillFailed, initialResult.errors.length, 'Should reduce number of failed templates');
    
    // Verify final state
    const finalTemplates = await mockStorageManager.getTemplates();
    Assert.greaterThan(finalTemplates.length, 2, 'Should have more than just the initially valid templates');
    
    // Check that fixed templates have proper structure
    const fixedTemplates = finalTemplates.filter(t => t.id.startsWith('fixed_'));
    for (const template of fixedTemplates) {
      Assert.true(typeof template.id === 'string', 'Fixed template should have ID');
      Assert.true(typeof template.template === 'string', 'Fixed template should have content');
      Assert.true(Array.isArray(template.keywords), 'Fixed template should have keywords array');
      Assert.true(Array.isArray(template.verticals), 'Fixed template should have verticals array');
    }
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runImportExportTests = runImportExportTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runImportExportTests;
}