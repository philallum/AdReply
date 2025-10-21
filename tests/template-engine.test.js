/**
 * Unit Tests for Template Engine
 * Tests template matching, scoring, rotation, and suggestion generation
 */

// Test suite for Template Engine
async function runTemplateEngineTests() {
  const runner = new TestRunner();
  
  // Setup test data
  const mockStorageManager = MockHelpers.createMockStorageManager();
  const mockAIService = MockHelpers.createMockAIService();
  const mockLicenseManager = MockHelpers.createMockLicenseManager('free');
  
  // Create test templates
  const testTemplates = [
    {
      id: 'garage_exhaust',
      label: 'Garage Exhaust Service',
      template: 'Great build! If you need custom exhaust work, we do same-day fitting — {site}.',
      keywords: ['exhaust', 'garage', 'fit', 'performance', 'custom'],
      verticals: ['automotive', 'motorcycles'],
      variants: ['Nice work! We do performance exhaust installs same day — {site}.']
    },
    {
      id: 'fitness_training',
      label: 'Personal Training',
      template: 'Looking good! If you want to take your training to the next level, check us out — {site}.',
      keywords: ['training', 'fitness', 'gym', 'workout', 'personal'],
      verticals: ['fitness', 'health'],
      variants: ['Great progress! We offer personalized training programs — {site}.']
    },
    {
      id: 'tech_repair',
      label: 'Tech Repair Service',
      template: 'Nice setup! If you ever need tech repairs or upgrades, we can help — {site}.',
      keywords: ['tech', 'repair', 'computer', 'upgrade', 'fix'],
      verticals: ['technology', 'repair'],
      variants: []
    }
  ];
  
  // Add templates to mock storage
  for (const template of testTemplates) {
    await mockStorageManager.saveTemplate(template);
  }

  // Test: Keyword Extraction
  runner.test('TemplateEngine - Extract keywords from post content', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const postContent = 'Just installed a new exhaust system on my motorcycle. The performance gains are incredible!';
    const extracted = engine.extractKeywords(postContent);
    
    Assert.true(Array.isArray(extracted.keywords), 'Should return keywords array');
    Assert.includes(extracted.keywords, 'exhaust', 'Should extract "exhaust" keyword');
    Assert.includes(extracted.keywords, 'motorcycle', 'Should extract "motorcycle" keyword');
    Assert.includes(extracted.keywords, 'performance', 'Should extract "performance" keyword');
    Assert.greaterThan(extracted.wordCount, 0, 'Should count words');
  });

  // Test: Template Scoring
  runner.test('TemplateEngine - Calculate template relevance scores', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const postContent = 'Looking for a good exhaust system for my bike. Any recommendations for performance upgrades?';
    const extractedData = engine.extractKeywords(postContent);
    
    const template = testTemplates[0]; // garage_exhaust template
    const score = engine.calculateTemplateScore(template, extractedData);
    
    Assert.greaterThan(score, 0, 'Should return positive score for relevant template');
    Assert.lessThan(score, 1.1, 'Score should not exceed 1.0');
  });

  // Test: Template Matching
  runner.test('TemplateEngine - Match templates against post content', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const postContent = 'Just got a new exhaust for my motorcycle. The sound is amazing!';
    const groupId = 'test_group_123';
    
    const matches = await engine.matchTemplates(postContent, groupId);
    
    Assert.true(Array.isArray(matches), 'Should return array of matches');
    Assert.greaterThan(matches.length, 0, 'Should find matching templates');
    
    // Check that garage_exhaust template is in results
    const exhaustMatch = matches.find(m => m.template.id === 'garage_exhaust');
    Assert.true(exhaustMatch !== undefined, 'Should match exhaust-related template');
    Assert.greaterThan(exhaustMatch.score, 0, 'Matched template should have positive score');
  });

  // Test: Anti-spam Rotation
  runner.test('TemplateEngine - Apply anti-spam rotation filtering', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const groupId = 'test_group_rotation';
    const scoredTemplates = [
      { template: testTemplates[0], score: 0.8 },
      { template: testTemplates[1], score: 0.6 },
      { template: testTemplates[2], score: 0.4 }
    ];
    
    // First use - should return all templates
    let rotated = await engine.rotateTemplates(scoredTemplates, groupId);
    Assert.equal(rotated.length, 3, 'Should return all templates on first use');
    
    // Simulate using the first template
    await mockStorageManager.updateGroupHistory(groupId, testTemplates[0].id, 0);
    
    // Second use - should filter out recently used template
    rotated = await engine.rotateTemplates(scoredTemplates, groupId);
    Assert.lessThan(rotated.length, 3, 'Should filter out recently used template');
    
    const hasRecentTemplate = rotated.some(t => t.template.id === testTemplates[0].id);
    Assert.false(hasRecentTemplate, 'Should not include recently used template');
  });

  // Test: Template Variant Selection
  runner.test('TemplateEngine - Select template variants for rotation', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const template = testTemplates[0]; // Has variants
    const groupId = 'test_group_variants';
    
    // First selection
    const variant1 = await engine.selectTemplateVariant(template, groupId);
    Assert.true(typeof variant1.text === 'string', 'Should return variant text');
    Assert.true(typeof variant1.variantIndex === 'number', 'Should return variant index');
    
    // Simulate using this template
    await mockStorageManager.updateGroupHistory(groupId, template.id, variant1.variantIndex);
    
    // Second selection should rotate to different variant
    const variant2 = await engine.selectTemplateVariant(template, groupId);
    Assert.notEqual(variant2.variantIndex, variant1.variantIndex, 'Should rotate to different variant');
  });

  // Test: Suggestion Generation
  runner.test('TemplateEngine - Generate suggestions from matched templates', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const postContent = 'Need help with my car exhaust system. Looking for professional installation.';
    const groupId = 'test_group_suggestions';
    
    const suggestions = await engine.getSuggestions(postContent, groupId);
    
    Assert.true(Array.isArray(suggestions), 'Should return suggestions array');
    Assert.lessThan(suggestions.length, 4, 'Should limit to max 3 suggestions');
    
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      Assert.true(typeof suggestion.id === 'string', 'Suggestion should have ID');
      Assert.true(typeof suggestion.text === 'string', 'Suggestion should have text');
      Assert.true(typeof suggestion.score === 'number', 'Suggestion should have score');
      Assert.true(typeof suggestion.rank === 'number', 'Suggestion should have rank');
      Assert.includes(['high', 'medium', 'low', 'very_low'], suggestion.confidence, 'Should have valid confidence level');
    }
  });

  // Test: Placeholder Replacement
  runner.test('TemplateEngine - Replace placeholders in template text', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const templateText = 'Check out our services at {site} or {contact} for more info!';
    const groupId = 'test_group_placeholders';
    
    const processed = engine.replacePlaceholders(templateText, groupId);
    
    Assert.notIncludes(processed, '{site}', 'Should replace {site} placeholder');
    Assert.notIncludes(processed, '{contact}', 'Should replace {contact} placeholder');
    Assert.true(processed.length > 0, 'Should return non-empty string');
  });

  // Test: Template Similarity Calculation
  runner.test('TemplateEngine - Calculate template similarity for diversity', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const template1 = testTemplates[0]; // automotive/exhaust
    const template2 = testTemplates[1]; // fitness
    const template3 = { // similar to template1
      keywords: ['exhaust', 'automotive', 'performance'],
      verticals: ['automotive'],
      template: 'We offer exhaust services for all vehicles'
    };
    
    const similarity1 = engine.calculateTemplateSimilarity(template1, template2);
    const similarity2 = engine.calculateTemplateSimilarity(template1, template3);
    
    Assert.lessThan(similarity1, similarity2, 'Different verticals should have lower similarity');
    Assert.greaterThan(similarity2, 0.3, 'Similar templates should have higher similarity');
  });

  // Test: Configuration Updates
  runner.test('TemplateEngine - Update and retrieve configuration', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const originalConfig = engine.getConfig();
    const newConfig = {
      scoring: {
        keywordMatchWeight: 2.0
      },
      suggestions: {
        maxSuggestions: 5
      }
    };
    
    engine.updateConfig(newConfig);
    const updatedConfig = engine.getConfig();
    
    Assert.equal(updatedConfig.scoring.keywordMatchWeight, 2.0, 'Should update scoring config');
    Assert.equal(updatedConfig.suggestions.maxSuggestions, 5, 'Should update suggestions config');
    Assert.equal(updatedConfig.scoring.verticalMatchWeight, originalConfig.scoring.verticalMatchWeight, 'Should preserve unchanged config');
  });

  // Test: Error Handling
  runner.test('TemplateEngine - Handle invalid input gracefully', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    // Test with empty post content
    const emptyResults = await engine.getSuggestions('', 'test_group');
    Assert.equal(emptyResults.length, 0, 'Should return empty array for empty content');
    
    // Test with null post content
    const nullResults = await engine.getSuggestions(null, 'test_group');
    Assert.equal(nullResults.length, 0, 'Should return empty array for null content');
    
    // Test keyword extraction with invalid input
    const invalidExtraction = engine.extractKeywords(null);
    Assert.equal(invalidExtraction.keywords.length, 0, 'Should return empty keywords for null input');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runTemplateEngineTests = runTemplateEngineTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runTemplateEngineTests;
}