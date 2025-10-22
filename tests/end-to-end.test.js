/**
 * End-to-End Tests for AdReply Extension
 * Tests complete user workflows, license flows, and performance scenarios
 */

// Test suite for End-to-End Testing
async function runEndToEndTests() {
  const runner = new TestRunner();
  
  // Mock complete system for E2E testing
  class MockAdReplySystem {
    constructor() {
      this.storageManager = MockHelpers.createMockStorageManager();
      this.templateEngine = new TemplateEngine(this.storageManager);
      this.licenseManager = new LicenseManager(this.storageManager);
      this.currentUser = null;
      this.currentGroup = null;
      this.systemState = 'initialized';
    }
    
    // User management
    async initializeUser(userType = 'free') {
      this.currentUser = {
        id: 'test_user_123',
        type: userType,
        createdAt: new Date().toISOString()
      };
      
      if (userType === 'pro') {
        const proLicense = {
          status: 'pro',
          tier: 'pro',
          features: ['unlimited_templates', 'ai_integration', 'ad_packs'],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        await this.storageManager.saveLicenseData(proLicense);
      }
      
      this.systemState = 'user_initialized';
    }
    
    // Facebook group simulation
    async navigateToGroup(groupId, groupName) {
      this.currentGroup = {
        id: groupId,
        name: groupName,
        url: `https://www.facebook.com/groups/${groupId}`,
        joinedAt: new Date().toISOString()
      };
      this.systemState = 'in_group';
    }
    
    // Template management workflow
    async createTemplate(templateData) {
      const template = {
        id: templateData.id || `template_${Date.now()}`,
        label: templateData.label,
        template: templateData.template,
        keywords: templateData.keywords || [],
        verticals: templateData.verticals || [],
        variants: templateData.variants || [],
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      
      await this.storageManager.saveTemplate(template);
      return template;
    }
    
    // Post interaction workflow
    async processPost(postContent) {
      if (!this.currentGroup) {
        throw new Error('Must be in a group to process posts');
      }
      
      const suggestions = await this.templateEngine.getSuggestions(postContent, this.currentGroup.id);
      return suggestions;
    }
    
    // Comment posting workflow
    async postComment(suggestion) {
      if (!this.currentGroup || !suggestion) {
        throw new Error('Invalid comment posting context');
      }
      
      // Record usage
      await this.templateEngine.recordSuggestionUsage(suggestion, this.currentGroup.id);
      
      return {
        success: true,
        commentId: `comment_${Date.now()}`,
        templateId: suggestion.templateId,
        groupId: this.currentGroup.id,
        postedAt: new Date().toISOString()
      };
    }
    
    // License upgrade workflow
    async upgradeToPro(token) {
      const result = await this.licenseManager.upgradeToPro(token);
      if (result.success) {
        this.currentUser.type = 'pro';
      }
      return result;
    }
    
    // System state management
    getSystemState() {
      return {
        user: this.currentUser,
        group: this.currentGroup,
        state: this.systemState
      };
    }
  }

  // Test: Complete User Onboarding Flow
  runner.test('EndToEnd - Complete user onboarding workflow', async () => {
    const system = new MockAdReplySystem();
    
    // Step 1: Initialize free user
    await system.initializeUser('free');
    const state1 = system.getSystemState();
    
    Assert.equal(state1.user.type, 'free', 'Should initialize as free user');
    Assert.equal(state1.state, 'user_initialized', 'Should be in initialized state');
    
    // Step 2: Create first template (within free limit)
    const firstTemplate = await system.createTemplate({
      label: 'My First Template',
      template: 'Great post! Check out our services - {site}',
      keywords: ['services', 'business'],
      verticals: ['general']
    });
    
    Assert.true(typeof firstTemplate.id === 'string', 'Should create template with ID');
    Assert.equal(firstTemplate.usageCount, 0, 'Should start with zero usage');
    
    // Step 3: Navigate to Facebook group
    await system.navigateToGroup('test-group-123', 'Test Business Group');
    const state2 = system.getSystemState();
    
    Assert.equal(state2.group.id, 'test-group-123', 'Should navigate to correct group');
    Assert.equal(state2.state, 'in_group', 'Should be in group state');
    
    // Step 4: Process a post and get suggestions
    const postContent = 'Looking for good business services in the area. Any recommendations?';
    const suggestions = await system.processPost(postContent);
    
    Assert.greaterThan(suggestions.length, 0, 'Should generate suggestions for relevant post');
    Assert.equal(suggestions[0].templateId, firstTemplate.id, 'Should suggest the created template');
    
    // Step 5: Post comment using suggestion
    const commentResult = await system.postComment(suggestions[0]);
    
    Assert.true(commentResult.success, 'Should successfully post comment');
    Assert.equal(commentResult.templateId, firstTemplate.id, 'Should record correct template usage');
    Assert.equal(commentResult.groupId, 'test-group-123', 'Should record correct group');
    
    // Step 6: Verify usage tracking
    const updatedTemplate = await system.storageManager.getTemplate(firstTemplate.id);
    Assert.equal(updatedTemplate.usageCount, 1, 'Should increment usage count');
    
    const groupHistory = await system.storageManager.getGroupHistory('test-group-123');
    Assert.equal(groupHistory.lastTemplateId, firstTemplate.id, 'Should record group usage history');
  });

  // Test: License Upgrade and Feature Unlocking Flow
  runner.test('EndToEnd - License upgrade and feature unlocking workflow', async () => {
    const system = new MockAdReplySystem();
    
    // Step 1: Start as free user
    await system.initializeUser('free');
    
    // Step 2: Check initial feature access
    const initialAIAccess = await system.licenseManager.checkFeatureAccess('ai_integration');
    const initialTemplateLimit = await system.licenseManager.getTemplateLimit();
    
    Assert.false(initialAIAccess, 'Free user should not have AI access');
    Assert.equal(initialTemplateLimit, 10, 'Free user should have 10 template limit');
    
    // Step 3: Create templates up to free limit
    const templates = [];
    for (let i = 0; i < 10; i++) {
      const template = await system.createTemplate({
        label: `Free Template ${i + 1}`,
        template: `Template content ${i + 1} - {site}`,
        keywords: [`keyword${i}`],
        verticals: ['test']
      });
      templates.push(template);
    }
    
    // Step 4: Verify limit enforcement
    const canAddMore = await system.licenseManager.canAddTemplate();
    Assert.false(canAddMore, 'Should not allow more templates at free limit');
    
    // Step 5: Upgrade to Pro
    const proToken = system.licenseManager.generateTestToken({
      sub: 'test_user_123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    });
    
    const upgradeResult = await system.upgradeToPro(proToken);
    Assert.true(upgradeResult.success, 'Should successfully upgrade to Pro');
    
    // Step 6: Verify Pro features are unlocked
    const proAIAccess = await system.licenseManager.checkFeatureAccess('ai_integration');
    const proTemplateLimit = await system.licenseManager.getTemplateLimit();
    const proCanAddMore = await system.licenseManager.canAddTemplate();
    
    Assert.true(proAIAccess, 'Pro user should have AI access');
    Assert.equal(proTemplateLimit, Infinity, 'Pro user should have unlimited templates');
    Assert.true(proCanAddMore, 'Pro user should be able to add more templates');
    
    // Step 7: Create additional Pro templates
    const proTemplate = await system.createTemplate({
      label: 'Pro Template',
      template: 'Pro template with advanced features - {site}',
      keywords: ['pro', 'advanced'],
      verticals: ['premium']
    });
    
    Assert.true(typeof proTemplate.id === 'string', 'Should create Pro template successfully');
    
    // Step 8: Verify total template count exceeds free limit
    const allTemplates = await system.storageManager.getTemplates();
    Assert.greaterThan(allTemplates.length, 10, 'Should have more than free limit templates');
  });

  // Test: Multi-Group Usage and Rotation Flow
  runner.test('EndToEnd - Multi-group usage and rotation workflow', async () => {
    const system = new MockAdReplySystem();
    
    // Setup
    await system.initializeUser('pro');
    
    // Create templates for testing rotation
    const templates = [
      await system.createTemplate({
        label: 'Automotive Template 1',
        template: 'Great car! For automotive services, visit us - {site}',
        keywords: ['automotive', 'car', 'services'],
        verticals: ['automotive'],
        variants: ['Nice ride! We offer automotive services - {site}']
      }),
      await system.createTemplate({
        label: 'Automotive Template 2',
        template: 'Sweet vehicle! Need automotive work? Contact us - {site}',
        keywords: ['automotive', 'vehicle', 'work'],
        verticals: ['automotive']
      })
    ];
    
    const postContent = 'Just bought a new car and need some automotive services.';
    
    // Test Group 1 interactions
    await system.navigateToGroup('auto-group-1', 'Car Enthusiasts Group 1');
    
    const group1Suggestions1 = await system.processPost(postContent);
    Assert.greaterThan(group1Suggestions1.length, 0, 'Should get suggestions for group 1');
    
    await system.postComment(group1Suggestions1[0]);
    
    // Test Group 2 interactions (should allow same template)
    await system.navigateToGroup('auto-group-2', 'Car Enthusiasts Group 2');
    
    const group2Suggestions1 = await system.processPost(postContent);
    Assert.greaterThan(group2Suggestions1.length, 0, 'Should get suggestions for group 2');
    
    await system.postComment(group2Suggestions1[0]);
    
    // Return to Group 1 - should rotate to different template/variant
    await system.navigateToGroup('auto-group-1', 'Car Enthusiasts Group 1');
    
    const group1Suggestions2 = await system.processPost(postContent);
    Assert.greaterThan(group1Suggestions2.length, 0, 'Should get rotated suggestions for group 1');
    
    // Verify rotation occurred (different template or variant)
    const firstUse = group1Suggestions1[0];
    const secondUse = group1Suggestions2[0];
    
    const rotationOccurred = 
      firstUse.templateId !== secondUse.templateId || 
      firstUse.variantIndex !== secondUse.variantIndex;
    
    Assert.true(rotationOccurred, 'Should rotate templates/variants between uses in same group');
    
    // Verify group histories are separate
    const group1History = await system.storageManager.getGroupHistory('auto-group-1');
    const group2History = await system.storageManager.getGroupHistory('auto-group-2');
    
    Assert.true(group1History !== null, 'Should have group 1 history');
    Assert.true(group2History !== null, 'Should have group 2 history');
    Assert.equal(group1History.totalComments, 2, 'Group 1 should have 2 comments');
    Assert.equal(group2History.totalComments, 1, 'Group 2 should have 1 comment');
  });

  // Test: Template Management Lifecycle
  runner.test('EndToEnd - Complete template management lifecycle', async () => {
    const system = new MockAdReplySystem();
    
    await system.initializeUser('pro');
    await system.navigateToGroup('template-test-group', 'Template Test Group');
    
    // Step 1: Create template
    const originalTemplate = await system.createTemplate({
      label: 'Lifecycle Test Template',
      template: 'Original template content - {site}',
      keywords: ['lifecycle', 'test', 'original'],
      verticals: ['testing'],
      variants: ['Original variant - {site}']
    });
    
    // Step 2: Use template multiple times
    const postContent = 'This is a test post for lifecycle testing.';
    
    for (let i = 0; i < 5; i++) {
      const suggestions = await system.processPost(postContent);
      if (suggestions.length > 0) {
        await system.postComment(suggestions[0]);
      }
    }
    
    // Step 3: Verify usage tracking
    const usedTemplate = await system.storageManager.getTemplate(originalTemplate.id);
    Assert.greaterThan(usedTemplate.usageCount, 0, 'Should track template usage');
    
    // Step 4: Update template (simulate editing)
    const updatedTemplate = {
      ...usedTemplate,
      label: 'Updated Lifecycle Template',
      template: 'Updated template content - {site}',
      keywords: ['lifecycle', 'test', 'updated'],
      variants: ['Updated variant - {site}', 'New variant - {site}'],
      updatedAt: new Date().toISOString()
    };
    
    await system.storageManager.saveTemplate(updatedTemplate);
    
    // Step 5: Verify update preserved usage data
    const retrievedUpdated = await system.storageManager.getTemplate(originalTemplate.id);
    Assert.equal(retrievedUpdated.label, 'Updated Lifecycle Template', 'Should update template content');
    Assert.greaterThan(retrievedUpdated.usageCount, 0, 'Should preserve usage count');
    Assert.equal(retrievedUpdated.variants.length, 2, 'Should update variants');
    
    // Step 6: Test updated template in suggestions
    const newSuggestions = await system.processPost(postContent);
    if (newSuggestions.length > 0) {
      const suggestion = newSuggestions.find(s => s.templateId === originalTemplate.id);
      if (suggestion) {
        Assert.includes(suggestion.text, 'Updated template content', 'Should use updated template content');
      }
    }
    
    // Step 7: Delete template
    await system.storageManager.deleteTemplate(originalTemplate.id);
    
    // Step 8: Verify deletion
    const deletedTemplate = await system.storageManager.getTemplate(originalTemplate.id);
    Assert.equal(deletedTemplate, null, 'Should delete template completely');
    
    // Step 9: Verify template no longer appears in suggestions
    const finalSuggestions = await system.processPost(postContent);
    const deletedInSuggestions = finalSuggestions.some(s => s.templateId === originalTemplate.id);
    Assert.false(deletedInSuggestions, 'Deleted template should not appear in suggestions');
  });

  // Test: Performance with Large Template Library
  runner.test('EndToEnd - Performance with large template library', async () => {
    const system = new MockAdReplySystem();
    
    await system.initializeUser('pro');
    await system.navigateToGroup('performance-test-group', 'Performance Test Group');
    
    // Step 1: Create large template library
    const templateCount = 200;
    const startTime = Date.now();
    
    for (let i = 0; i < templateCount; i++) {
      await system.createTemplate({
        label: `Performance Template ${i}`,
        template: `Performance template content ${i} - {site}`,
        keywords: [`perf${i}`, 'performance', 'test'],
        verticals: ['performance'],
        variants: [`Performance variant ${i} - {site}`]
      });
    }
    
    const creationTime = Date.now() - startTime;
    Assert.lessThan(creationTime, 10000, 'Should create 200 templates in under 10 seconds');
    
    // Step 2: Test suggestion generation performance
    const postContent = 'Looking for performance testing services and solutions.';
    
    const suggestionStart = Date.now();
    const suggestions = await system.processPost(postContent);
    const suggestionTime = Date.now() - suggestionStart;
    
    Assert.lessThan(suggestionTime, 1000, 'Should generate suggestions in under 1 second');
    Assert.greaterThan(suggestions.length, 0, 'Should find relevant suggestions in large library');
    Assert.lessThan(suggestions.length, 4, 'Should limit suggestions appropriately');
    
    // Step 3: Test template retrieval performance
    const retrievalStart = Date.now();
    const allTemplates = await system.storageManager.getTemplates();
    const retrievalTime = Date.now() - retrievalStart;
    
    Assert.equal(allTemplates.length, templateCount, 'Should retrieve all templates');
    Assert.lessThan(retrievalTime, 2000, 'Should retrieve large template library in under 2 seconds');
    
    // Step 4: Test filtered retrieval performance
    const filterStart = Date.now();
    const filteredTemplates = await system.storageManager.getTemplates({ vertical: 'performance' });
    const filterTime = Date.now() - filterStart;
    
    Assert.equal(filteredTemplates.length, templateCount, 'Should filter templates correctly');
    Assert.lessThan(filterTime, 1500, 'Should filter large library in under 1.5 seconds');
  });

  // Test: Error Recovery and System Resilience
  runner.test('EndToEnd - Error recovery and system resilience', async () => {
    const system = new MockAdReplySystem();
    
    await system.initializeUser('pro');
    await system.navigateToGroup('resilience-test-group', 'Resilience Test Group');
    
    // Step 1: Create template for testing
    const testTemplate = await system.createTemplate({
      label: 'Resilience Test Template',
      template: 'Resilience test content - {site}',
      keywords: ['resilience', 'test'],
      verticals: ['testing']
    });
    
    // Step 2: Test with invalid post content
    const invalidInputs = [null, undefined, '', '   ', '<script>alert("xss")</script>'];
    
    for (const invalidInput of invalidInputs) {
      const suggestions = await system.processPost(invalidInput);
      Assert.true(Array.isArray(suggestions), 'Should handle invalid input gracefully');
      Assert.equal(suggestions.length, 0, 'Should return empty suggestions for invalid input');
    }
    
    // Step 3: Test with corrupted template data
    const corruptedTemplate = {
      id: 'corrupted_template',
      label: null, // Invalid
      template: '', // Invalid
      keywords: 'not-an-array', // Invalid
      verticals: null // Invalid
    };
    
    try {
      await system.storageManager.saveTemplate(corruptedTemplate);
      Assert.true(false, 'Should reject corrupted template data');
    } catch (error) {
      Assert.includes(error.message, 'validation failed', 'Should provide validation error');
    }
    
    // Step 4: Test system recovery after errors
    const validPostContent = 'This is a valid test post for resilience testing.';
    const recoverySuggestions = await system.processPost(validPostContent);
    
    Assert.true(Array.isArray(recoverySuggestions), 'Should recover and work normally after errors');
    
    // Step 5: Test with network-like failures (simulate storage errors)
    const originalGetTemplates = system.storageManager.getTemplates;
    system.storageManager.getTemplates = async () => {
      throw new Error('Simulated storage failure');
    };
    
    const failureSuggestions = await system.processPost(validPostContent);
    Assert.equal(failureSuggestions.length, 0, 'Should handle storage failures gracefully');
    
    // Step 6: Restore functionality and verify recovery
    system.storageManager.getTemplates = originalGetTemplates;
    
    const restoredSuggestions = await system.processPost(validPostContent);
    Assert.greaterThan(restoredSuggestions.length, 0, 'Should recover functionality after restoration');
  });

  // Test: Cross-Browser Compatibility Simulation
  runner.test('EndToEnd - Cross-browser compatibility simulation', async () => {
    const system = new MockAdReplySystem();
    
    // Simulate different browser environments
    const browserEnvironments = [
      { name: 'Chrome', features: ['indexedDB', 'localStorage', 'fetch'] },
      { name: 'Firefox', features: ['indexedDB', 'localStorage', 'fetch'] },
      { name: 'Safari', features: ['indexedDB', 'localStorage', 'fetch'] },
      { name: 'Edge', features: ['indexedDB', 'localStorage', 'fetch'] }
    ];
    
    for (const browser of browserEnvironments) {
      // Simulate browser-specific initialization
      await system.initializeUser('free');
      
      // Test core functionality in each browser environment
      const template = await system.createTemplate({
        label: `${browser.name} Test Template`,
        template: `Template for ${browser.name} - {site}`,
        keywords: [browser.name.toLowerCase(), 'browser', 'test'],
        verticals: ['compatibility']
      });
      
      Assert.true(typeof template.id === 'string', `Should create template in ${browser.name}`);
      
      await system.navigateToGroup(`${browser.name.toLowerCase()}-group`, `${browser.name} Test Group`);
      
      const suggestions = await system.processPost(`Testing in ${browser.name} browser.`);
      Assert.true(Array.isArray(suggestions), `Should generate suggestions in ${browser.name}`);
      
      if (suggestions.length > 0) {
        const commentResult = await system.postComment(suggestions[0]);
        Assert.true(commentResult.success, `Should post comments in ${browser.name}`);
      }
      
      // Clean up for next browser test
      await system.storageManager.clearAllData();
    }
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runEndToEndTests = runEndToEndTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runEndToEndTests;
}