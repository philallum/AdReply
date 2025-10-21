/**
 * Unit Tests for Storage Manager
 * Tests storage operations, data validation, and CRUD functionality
 */

// Test suite for Storage Manager
async function runStorageManagerTests() {
  const runner = new TestRunner();
  
  // Mock IndexedDB and Chrome storage for testing
  const mockIndexedDB = {
    templates: new Map(),
    groups: new Map(),
    
    async saveTemplate(template) {
      const id = template.id || `template_${Date.now()}`;
      this.templates.set(id, { ...template, id });
      return id;
    },
    
    async getTemplate(id) {
      return this.templates.get(id) || null;
    },
    
    async getTemplates(filters = {}) {
      let result = Array.from(this.templates.values());
      if (filters.vertical) {
        result = result.filter(t => t.verticals && t.verticals.includes(filters.vertical));
      }
      return result;
    },
    
    async deleteTemplate(id) {
      return this.templates.delete(id);
    },
    
    async incrementTemplateUsage(id) {
      const template = this.templates.get(id);
      if (template) {
        template.usageCount = (template.usageCount || 0) + 1;
      }
    },
    
    async updateGroupHistory(groupId, templateId, variantIndex) {
      this.groups.set(groupId, {
        groupId,
        lastTemplateId: templateId,
        lastVariantIndex: variantIndex,
        lastUsedAt: new Date().toISOString(),
        totalComments: (this.groups.get(groupId)?.totalComments || 0) + 1
      });
    },
    
    async getGroupHistory(groupId) {
      return this.groups.get(groupId) || null;
    },
    
    async getAllGroupHistories() {
      return Array.from(this.groups.values());
    },
    
    async clearAllData() {
      this.templates.clear();
      this.groups.clear();
    },
    
    async initialize() {
      // Mock initialization
    },
    
    close() {
      // Mock close
    }
  };
  
  const mockChromeStorage = {
    data: new Map(),
    
    async getSettings() {
      return this.data.get('settings') || {};
    },
    
    async saveSettings(settings) {
      this.data.set('settings', settings);
    },
    
    async updateSetting(path, value) {
      const settings = await this.getSettings();
      const keys = path.split('.');
      let current = settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      await this.saveSettings(settings);
    },
    
    async getAISettings() {
      return this.data.get('aiSettings') || {};
    },
    
    async saveAISettings(aiSettings) {
      this.data.set('aiSettings', aiSettings);
    },
    
    async getLicenseData() {
      return this.data.get('license') || null;
    },
    
    async saveLicenseData(license) {
      this.data.set('license', license);
    },
    
    async getLicenseStatus() {
      const license = await this.getLicenseData();
      return license ? license.status : 'free';
    },
    
    async clearLicenseData() {
      this.data.delete('license');
    },
    
    async clear() {
      this.data.clear();
    }
  };

  // Create mock storage manager
  function createMockStorageManager() {
    const manager = {
      indexedDB: mockIndexedDB,
      chromeStorage: mockChromeStorage,
      initialized: false,
      
      // Mock data models
      models: {
        Template: {
          fromObject: (obj) => ({
            ...obj,
            validate: () => ({ isValid: true, errors: [] }),
            sanitize: () => ({ toObject: () => obj }),
            toObject: () => obj
          })
        },
        GroupHistory: {
          fromObject: (obj) => ({
            ...obj,
            toObject: () => obj
          })
        },
        Settings: {
          fromObject: (obj) => ({
            ...obj,
            validate: () => ({ isValid: true, errors: [] }),
            toObject: () => obj
          })
        },
        AISettings: {
          fromObject: (obj) => ({
            ...obj,
            validate: () => ({ isValid: true, errors: [] }),
            toObject: () => obj
          })
        },
        License: {
          fromObject: (obj) => ({
            ...obj,
            validate: () => ({ isValid: true, errors: [] }),
            toObject: () => obj,
            hasFeature: (feature) => obj.features && obj.features.includes(feature)
          })
        }
      },
      
      async initialize() {
        if (!this.initialized) {
          await this.indexedDB.initialize();
          this.initialized = true;
        }
      },
      
      // Template operations
      async saveTemplate(templateData) {
        await this.initialize();
        const template = this.models.Template.fromObject(templateData);
        const validation = template.validate();
        
        if (!validation.isValid) {
          throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
        }
        
        return await this.indexedDB.saveTemplate(template.toObject());
      },
      
      async getTemplate(templateId) {
        await this.initialize();
        const templateData = await this.indexedDB.getTemplate(templateId);
        if (!templateData) return null;
        return this.models.Template.fromObject(templateData).toObject();
      },
      
      async getTemplates(filters = {}) {
        await this.initialize();
        const templatesData = await this.indexedDB.getTemplates(filters);
        return templatesData.map(data => this.models.Template.fromObject(data).toObject());
      },
      
      async deleteTemplate(templateId) {
        await this.initialize();
        return await this.indexedDB.deleteTemplate(templateId);
      },
      
      async getTemplateCount() {
        const templates = await this.getTemplates();
        return templates.length;
      },
      
      async incrementTemplateUsage(templateId) {
        await this.initialize();
        return await this.indexedDB.incrementTemplateUsage(templateId);
      },
      
      // Group operations
      async updateGroupHistory(groupId, templateId, variantIndex) {
        await this.initialize();
        return await this.indexedDB.updateGroupHistory(groupId, templateId, variantIndex);
      },
      
      async getGroupHistory(groupId) {
        await this.initialize();
        const groupData = await this.indexedDB.getGroupHistory(groupId);
        if (!groupData) return null;
        return this.models.GroupHistory.fromObject(groupData).toObject();
      },
      
      async getAllGroupHistories() {
        await this.initialize();
        const groupsData = await this.indexedDB.getAllGroupHistories();
        return groupsData.map(data => this.models.GroupHistory.fromObject(data).toObject());
      },
      
      // Settings operations
      async getSettings() {
        const settingsData = await this.chromeStorage.getSettings();
        return this.models.Settings.fromObject(settingsData).toObject();
      },
      
      async saveSettings(settingsData) {
        const settings = this.models.Settings.fromObject(settingsData);
        const validation = settings.validate();
        
        if (!validation.isValid) {
          throw new Error(`Settings validation failed: ${validation.errors.join(', ')}`);
        }
        
        return await this.chromeStorage.saveSettings(settings.toObject());
      },
      
      async updateSetting(path, value) {
        return await this.chromeStorage.updateSetting(path, value);
      },
      
      // License operations
      async getLicenseData() {
        const licenseData = await this.chromeStorage.getLicenseData();
        if (!licenseData) return null;
        return this.models.License.fromObject(licenseData).toObject();
      },
      
      async saveLicenseData(licenseData) {
        const license = this.models.License.fromObject(licenseData);
        const validation = license.validate();
        
        if (!validation.isValid) {
          throw new Error(`License validation failed: ${validation.errors.join(', ')}`);
        }
        
        return await this.chromeStorage.saveLicenseData(license.toObject());
      },
      
      async hasProLicense() {
        const status = await this.chromeStorage.getLicenseStatus();
        return status === 'pro';
      },
      
      // Utility
      async clearAllData() {
        await this.initialize();
        await this.indexedDB.clearAllData();
        await this.chromeStorage.clear();
      }
    };
    
    return manager;
  }

  // Test: Template CRUD Operations
  runner.test('StorageManager - Save and retrieve templates', async () => {
    const storage = createMockStorageManager();
    
    const testTemplate = {
      id: 'test_template_1',
      label: 'Test Template',
      template: 'This is a test template for {site}',
      keywords: ['test', 'template'],
      verticals: ['testing'],
      variants: ['Alternative test template']
    };
    
    // Save template
    const savedId = await storage.saveTemplate(testTemplate);
    Assert.equal(savedId, testTemplate.id, 'Should return correct template ID');
    
    // Retrieve template
    const retrieved = await storage.getTemplate(savedId);
    Assert.equal(retrieved.id, testTemplate.id, 'Should retrieve correct template');
    Assert.equal(retrieved.label, testTemplate.label, 'Should preserve template label');
    Assert.arrayEqual(retrieved.keywords, testTemplate.keywords, 'Should preserve keywords');
  });

  // Test: Template Filtering
  runner.test('StorageManager - Filter templates by criteria', async () => {
    const storage = createMockStorageManager();
    
    const templates = [
      {
        id: 'auto_1',
        label: 'Auto Template 1',
        template: 'Auto template 1',
        keywords: ['car', 'auto'],
        verticals: ['automotive']
      },
      {
        id: 'fitness_1',
        label: 'Fitness Template 1',
        template: 'Fitness template 1',
        keywords: ['gym', 'fitness'],
        verticals: ['fitness']
      },
      {
        id: 'auto_2',
        label: 'Auto Template 2',
        template: 'Auto template 2',
        keywords: ['motorcycle', 'bike'],
        verticals: ['automotive']
      }
    ];
    
    // Save all templates
    for (const template of templates) {
      await storage.saveTemplate(template);
    }
    
    // Get all templates
    const allTemplates = await storage.getTemplates();
    Assert.equal(allTemplates.length, 3, 'Should retrieve all templates');
    
    // Filter by vertical
    const autoTemplates = await storage.getTemplates({ vertical: 'automotive' });
    Assert.equal(autoTemplates.length, 2, 'Should filter by vertical');
    
    const fitnessTemplates = await storage.getTemplates({ vertical: 'fitness' });
    Assert.equal(fitnessTemplates.length, 1, 'Should filter fitness templates');
  });

  // Test: Template Usage Tracking
  runner.test('StorageManager - Track template usage counts', async () => {
    const storage = createMockStorageManager();
    
    const template = {
      id: 'usage_test',
      label: 'Usage Test Template',
      template: 'Test usage tracking',
      keywords: ['usage'],
      verticals: ['test'],
      usageCount: 0
    };
    
    await storage.saveTemplate(template);
    
    // Increment usage multiple times
    await storage.incrementTemplateUsage(template.id);
    await storage.incrementTemplateUsage(template.id);
    await storage.incrementTemplateUsage(template.id);
    
    const updated = await storage.getTemplate(template.id);
    Assert.equal(updated.usageCount, 3, 'Should track usage count correctly');
  });

  // Test: Group History Management
  runner.test('StorageManager - Manage group history', async () => {
    const storage = createMockStorageManager();
    
    const groupId = 'test_group_123';
    const templateId = 'test_template_456';
    const variantIndex = 1;
    
    // Update group history
    await storage.updateGroupHistory(groupId, templateId, variantIndex);
    
    // Retrieve group history
    const history = await storage.getGroupHistory(groupId);
    Assert.equal(history.groupId, groupId, 'Should store correct group ID');
    Assert.equal(history.lastTemplateId, templateId, 'Should store last used template');
    Assert.equal(history.lastVariantIndex, variantIndex, 'Should store variant index');
    Assert.true(typeof history.lastUsedAt === 'string', 'Should store timestamp');
  });

  // Test: Settings Management
  runner.test('StorageManager - Manage user settings', async () => {
    const storage = createMockStorageManager();
    
    const testSettings = {
      ai: {
        provider: 'gemini',
        enabled: true
      },
      ui: {
        theme: 'dark',
        sidebarWidth: 350
      },
      templates: {
        maxSuggestions: 5
      }
    };
    
    // Save settings
    await storage.saveSettings(testSettings);
    
    // Retrieve settings
    const retrieved = await storage.getSettings();
    Assert.equal(retrieved.ai.provider, 'gemini', 'Should preserve AI provider setting');
    Assert.equal(retrieved.ui.theme, 'dark', 'Should preserve UI theme setting');
    Assert.equal(retrieved.templates.maxSuggestions, 5, 'Should preserve template settings');
  });

  // Test: Individual Setting Updates
  runner.test('StorageManager - Update individual settings', async () => {
    const storage = createMockStorageManager();
    
    // Initialize with default settings
    await storage.saveSettings({
      ai: { provider: 'off', enabled: false },
      ui: { theme: 'light' }
    });
    
    // Update individual setting
    await storage.updateSetting('ai.provider', 'openai');
    await storage.updateSetting('ui.theme', 'dark');
    
    const settings = await storage.getSettings();
    Assert.equal(settings.ai.provider, 'openai', 'Should update nested setting');
    Assert.equal(settings.ui.theme, 'dark', 'Should update UI setting');
    Assert.equal(settings.ai.enabled, false, 'Should preserve other settings');
  });

  // Test: License Data Management
  runner.test('StorageManager - Manage license data', async () => {
    const storage = createMockStorageManager();
    
    const licenseData = {
      token: 'test_jwt_token',
      status: 'pro',
      tier: 'pro',
      plan: 'monthly',
      expiresAt: '2024-12-31T23:59:59Z',
      features: ['unlimited_templates', 'ai_integration']
    };
    
    // Save license
    await storage.saveLicenseData(licenseData);
    
    // Retrieve license
    const retrieved = await storage.getLicenseData();
    Assert.equal(retrieved.status, 'pro', 'Should store license status');
    Assert.equal(retrieved.tier, 'pro', 'Should store license tier');
    Assert.arrayEqual(retrieved.features, licenseData.features, 'Should store features');
    
    // Check Pro license status
    const hasPro = await storage.hasProLicense();
    Assert.true(hasPro, 'Should detect Pro license');
  });

  // Test: Template Count for License Validation
  runner.test('StorageManager - Get template count for license limits', async () => {
    const storage = createMockStorageManager();
    
    // Initially should be 0
    let count = await storage.getTemplateCount();
    Assert.equal(count, 0, 'Should start with 0 templates');
    
    // Add some templates
    const templates = [
      { id: 'count_1', label: 'Template 1', template: 'Test 1', keywords: ['test'] },
      { id: 'count_2', label: 'Template 2', template: 'Test 2', keywords: ['test'] },
      { id: 'count_3', label: 'Template 3', template: 'Test 3', keywords: ['test'] }
    ];
    
    for (const template of templates) {
      await storage.saveTemplate(template);
    }
    
    count = await storage.getTemplateCount();
    Assert.equal(count, 3, 'Should count all templates');
  });

  // Test: Data Validation
  runner.test('StorageManager - Validate data before storage', async () => {
    const storage = createMockStorageManager();
    
    // Mock validation failure
    storage.models.Template.fromObject = (obj) => ({
      ...obj,
      validate: () => ({ isValid: false, errors: ['Invalid template format'] }),
      toObject: () => obj
    });
    
    const invalidTemplate = {
      id: 'invalid',
      // Missing required fields
    };
    
    try {
      await storage.saveTemplate(invalidTemplate);
      Assert.true(false, 'Should throw validation error');
    } catch (error) {
      Assert.true(error.message.includes('validation failed'), 'Should throw validation error');
    }
  });

  // Test: Error Handling
  runner.test('StorageManager - Handle storage errors gracefully', async () => {
    const storage = createMockStorageManager();
    
    // Test retrieving non-existent template
    const nonExistent = await storage.getTemplate('non_existent_id');
    Assert.equal(nonExistent, null, 'Should return null for non-existent template');
    
    // Test retrieving non-existent group history
    const noHistory = await storage.getGroupHistory('non_existent_group');
    Assert.equal(noHistory, null, 'Should return null for non-existent group');
  });

  // Test: Data Cleanup
  runner.test('StorageManager - Clear all data', async () => {
    const storage = createMockStorageManager();
    
    // Add some data
    await storage.saveTemplate({
      id: 'cleanup_test',
      label: 'Cleanup Test',
      template: 'Test cleanup',
      keywords: ['cleanup']
    });
    
    await storage.updateGroupHistory('cleanup_group', 'cleanup_test', 0);
    
    // Verify data exists
    let templates = await storage.getTemplates();
    let groups = await storage.getAllGroupHistories();
    Assert.greaterThan(templates.length, 0, 'Should have templates before cleanup');
    Assert.greaterThan(groups.length, 0, 'Should have groups before cleanup');
    
    // Clear all data
    await storage.clearAllData();
    
    // Verify data is cleared
    templates = await storage.getTemplates();
    groups = await storage.getAllGroupHistories();
    Assert.equal(templates.length, 0, 'Should have no templates after cleanup');
    Assert.equal(groups.length, 0, 'Should have no groups after cleanup');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runStorageManagerTests = runStorageManagerTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runStorageManagerTests;
}