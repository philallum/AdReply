/**
 * Additional Unit Tests for Template Matching and Rotation Algorithms
 * Tests core template matching logic, scoring algorithms, and rotation mechanisms
 */

// Test suite for Template Matching and Rotation
async function runTemplateMatchingTests() {
  const runner = new TestRunner();
  
  // Setup test data
  const mockStorageManager = MockHelpers.createMockStorageManager();
  
  // Create comprehensive test templates for matching
  const testTemplates = [
    {
      id: 'automotive_exhaust_1',
      label: 'Automotive Exhaust Service',
      template: 'Great exhaust setup! We specialize in performance exhaust systems - {site}',
      keywords: ['exhaust', 'performance', 'automotive', 'system', 'install'],
      verticals: ['automotive', 'motorcycles'],
      variants: ['Nice exhaust work! We do custom performance installs - {site}'],
      usageCount: 5
    },
    {
      id: 'fitness_training_1',
      label: 'Personal Training Service',
      template: 'Looking strong! If you need a personal trainer, check us out - {site}',
      keywords: ['training', 'fitness', 'personal', 'gym', 'workout'],
      verticals: ['fitness', 'health'],
      variants: ['Great progress! We offer personalized training programs - {site}'],
      usageCount: 3
    },
    {
      id: 'tech_repair_1',
      label: 'Computer Repair Service',
      template: 'Nice setup! Need computer repairs or upgrades? We can help - {site}',
      keywords: ['computer', 'repair', 'tech', 'upgrade', 'fix'],
      verticals: ['technology', 'repair'],
      variants: [],
      usageCount: 1
    },
    {
      id: 'automotive_general_1',
      label: 'General Auto Service',
      template: 'Sweet ride! For all your automotive needs, visit us - {site}',
      keywords: ['automotive', 'car', 'vehicle', 'service', 'repair'],
      verticals: ['automotive'],
      variants: ['Nice car! We handle all automotive services - {site}'],
      usageCount: 8
    }
  ];
  
  // Add templates to mock storage
  for (const template of testTemplates) {
    await mockStorageManager.saveTemplate(template);
  }

  // Test: Keyword Extraction Accuracy
  runner.test('TemplateMatching - Extract keywords with high accuracy', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const testCases = [
      {
        input: 'Just installed a new performance exhaust system on my motorcycle. The sound is incredible!',
        expectedKeywords: ['performance', 'exhaust', 'system', 'motorcycle', 'sound']
      },
      {
        input: 'Looking for a good personal trainer in the area. Need help with my fitness goals.',
        expectedKeywords: ['personal', 'trainer', 'fitness', 'goals']
      },
      {
        input: 'My computer crashed again. Need reliable tech repair services ASAP.',
        expectedKeywords: ['computer', 'crashed', 'tech', 'repair', 'services']
      }
    ];
    
    for (const testCase of testCases) {
      const extracted = engine.extractKeywords(testCase.input);
      
      // Check that at least 60% of expected keywords are found
      const foundKeywords = testCase.expectedKeywords.filter(keyword => 
        extracted.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      const accuracy = foundKeywords.length / testCase.expectedKeywords.length;
      Assert.greaterThan(accuracy, 0.6, `Should extract at least 60% of keywords for: "${testCase.input}"`);
    }
  });

  // Test: Template Scoring Algorithm Precision
  runner.test('TemplateMatching - Calculate precise relevance scores', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const postContent = 'Need help with my motorcycle exhaust system. Looking for performance upgrades.';
    const extractedData = engine.extractKeywords(postContent);
    
    // Test scoring for different templates
    const automotiveTemplate = testTemplates[0]; // automotive_exhaust_1
    const fitnessTemplate = testTemplates[1]; // fitness_training_1
    
    const automotiveScore = engine.calculateTemplateScore(automotiveTemplate, extractedData);
    const fitnessScore = engine.calculateTemplateScore(fitnessTemplate, extractedData);
    
    // Automotive template should score much higher than fitness template
    Assert.greaterThan(automotiveScore, fitnessScore * 2, 'Relevant template should score significantly higher');
    Assert.greaterThan(automotiveScore, 0.5, 'Highly relevant template should score above 0.5');
    Assert.lessThan(fitnessScore, 0.3, 'Irrelevant template should score below 0.3');
  });

  // Test: Vertical Matching Enhancement
  runner.test('TemplateMatching - Enhance scoring with vertical matching', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const automotivePost = 'Just bought a new car and need some automotive services.';
    const extractedData = engine.extractKeywords(automotivePost);
    
    const automotiveTemplate1 = testTemplates[0]; // has 'automotive' vertical
    const automotiveTemplate2 = testTemplates[3]; // has 'automotive' vertical
    const fitnessTemplate = testTemplates[1]; // has 'fitness' vertical
    
    const score1 = engine.calculateTemplateScore(automotiveTemplate1, extractedData);
    const score2 = engine.calculateTemplateScore(automotiveTemplate2, extractedData);
    const fitnessScore = engine.calculateTemplateScore(fitnessTemplate, extractedData);
    
    // Both automotive templates should score higher than fitness
    Assert.greaterThan(score1, fitnessScore, 'Automotive template 1 should outscore fitness template');
    Assert.greaterThan(score2, fitnessScore, 'Automotive template 2 should outscore fitness template');
  });

  // Test: Anti-Spam Rotation Logic
  runner.test('TemplateMatching - Apply comprehensive rotation filtering', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    const groupId = 'test_group_rotation_comprehensive';
    
    // Create scored templates (sorted by score)
    const scoredTemplates = [
      { template: testTemplates[0], score: 0.9 }, // automotive_exhaust_1
      { template: testTemplates[3], score: 0.8 }, // automotive_general_1
      { template: testTemplates[2], score: 0.6 }, // tech_repair_1
      { template: testTemplates[1], score: 0.4 }  // fitness_training_1
    ];
    
    // Test 1: No history - should return all templates
    let rotated = await engine.rotateTemplates(scoredTemplates, groupId);
    Assert.equal(rotated.length, 4, 'Should return all templates when no history exists');
    
    // Test 2: Recent use (< 2 hours) - should exclude recently used template
    await mockStorageManager.updateGroupHistory(groupId, testTemplates[0].id, 0);
    rotated = await engine.rotateTemplates(scoredTemplates, groupId);
    Assert.lessThan(rotated.length, 4, 'Should filter out recently used template');
    
    const hasRecentTemplate = rotated.some(t => t.template.id === testTemplates[0].id);
    Assert.false(hasRecentTemplate, 'Should not include recently used template');
    
    // Test 3: Verify remaining templates are properly ordered
    const scores = rotated.map(t => t.score);
    for (let i = 1; i < scores.length; i++) {
      Assert.greaterThan(scores[i-1], scores[i] - 0.01, 'Templates should remain sorted by score');
    }
  });

  // Test: Template Variant Selection Logic
  runner.test('TemplateMatching - Select variants intelligently', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    const groupId = 'test_group_variants_comprehensive';
    
    const templateWithVariants = testTemplates[0]; // Has variants
    const templateWithoutVariants = testTemplates[2]; // No variants
    
    // Test 1: Template without variants
    const noVariantResult = await engine.selectTemplateVariant(templateWithoutVariants, groupId);
    Assert.equal(noVariantResult.variantIndex, 0, 'Should use index 0 for template without variants');
    Assert.true(noVariantResult.isMainTemplate, 'Should indicate main template when no variants');
    
    // Test 2: Template with variants - first use
    const firstUse = await engine.selectTemplateVariant(templateWithVariants, groupId);
    Assert.true(typeof firstUse.variantIndex === 'number', 'Should return valid variant index');
    Assert.true(typeof firstUse.text === 'string', 'Should return variant text');
    
    // Test 3: Template with variants - subsequent use (should rotate)
    await mockStorageManager.updateGroupHistory(groupId, templateWithVariants.id, firstUse.variantIndex);
    const secondUse = await engine.selectTemplateVariant(templateWithVariants, groupId);
    Assert.notEqual(secondUse.variantIndex, firstUse.variantIndex, 'Should rotate to different variant');
  });

  // Test: Suggestion Generation Quality
  runner.test('TemplateMatching - Generate high-quality suggestions', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    const groupId = 'test_group_suggestions_quality';
    
    const postContent = 'Just installed a performance exhaust on my bike. The sound is amazing!';
    const suggestions = await engine.getSuggestions(postContent, groupId);
    
    Assert.greaterThan(suggestions.length, 0, 'Should generate at least one suggestion');
    Assert.lessThan(suggestions.length, 4, 'Should not exceed maximum suggestions');
    
    // Verify suggestion structure
    for (const suggestion of suggestions) {
      Assert.true(typeof suggestion.id === 'string', 'Suggestion should have ID');
      Assert.true(typeof suggestion.text === 'string', 'Suggestion should have text');
      Assert.true(typeof suggestion.score === 'number', 'Suggestion should have score');
      Assert.true(typeof suggestion.rank === 'number', 'Suggestion should have rank');
      Assert.includes(['high', 'medium', 'low', 'very_low'], suggestion.confidence, 'Should have valid confidence');
      Assert.true(suggestion.score >= 0 && suggestion.score <= 1, 'Score should be between 0 and 1');
    }
    
    // Verify suggestions are ranked by score (highest first)
    for (let i = 1; i < suggestions.length; i++) {
      Assert.greaterThan(suggestions[i-1].score, suggestions[i].score - 0.01, 'Suggestions should be ranked by score');
    }
  });

  // Test: Diversity Filtering
  runner.test('TemplateMatching - Apply diversity filtering effectively', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    // Create similar templates for diversity testing
    const similarTemplates = [
      { template: testTemplates[0], score: 0.9 }, // automotive exhaust
      { template: testTemplates[3], score: 0.8 }, // automotive general
      { template: testTemplates[1], score: 0.7 }, // fitness (different vertical)
      { template: testTemplates[2], score: 0.6 }  // tech (different vertical)
    ];
    
    const diverseTemplates = engine.applyDiversityFilter(similarTemplates);
    
    // Should include the highest scoring template
    Assert.equal(diverseTemplates[0].template.id, testTemplates[0].id, 'Should include highest scoring template');
    
    // Should prefer diverse verticals over similar ones
    const verticals = diverseTemplates.map(t => t.template.verticals[0]);
    const uniqueVerticals = new Set(verticals);
    Assert.greaterThan(uniqueVerticals.size, 1, 'Should include templates from different verticals');
  });

  // Test: Template Similarity Calculation
  runner.test('TemplateMatching - Calculate template similarity accurately', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const template1 = testTemplates[0]; // automotive exhaust
    const template2 = testTemplates[3]; // automotive general
    const template3 = testTemplates[1]; // fitness
    
    const similarity1_2 = engine.calculateTemplateSimilarity(template1, template2);
    const similarity1_3 = engine.calculateTemplateSimilarity(template1, template3);
    
    // Templates in same vertical should be more similar
    Assert.greaterThan(similarity1_2, similarity1_3, 'Same vertical templates should be more similar');
    Assert.greaterThan(similarity1_2, 0.3, 'Similar templates should have meaningful similarity score');
    Assert.lessThan(similarity1_3, 0.5, 'Different vertical templates should have lower similarity');
  });

  // Test: Placeholder Replacement
  runner.test('TemplateMatching - Replace placeholders correctly', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    const groupId = 'test_group_placeholders';
    
    const templateWithPlaceholders = 'Check out our services at {site} or {contact} for more info!';
    const processed = engine.replacePlaceholders(templateWithPlaceholders, groupId);
    
    Assert.notIncludes(processed, '{site}', 'Should replace {site} placeholder');
    Assert.notIncludes(processed, '{contact}', 'Should replace {contact} placeholder');
    Assert.greaterThan(processed.length, 0, 'Should return non-empty processed text');
    
    // Test multiple placeholders
    const multiPlaceholder = 'Visit {site} today or call {phone} for {time} service!';
    const multiProcessed = engine.replacePlaceholders(multiPlaceholder, groupId);
    
    Assert.notIncludes(multiProcessed, '{site}', 'Should replace all {site} occurrences');
    Assert.notIncludes(multiProcessed, '{phone}', 'Should replace all {phone} occurrences');
    Assert.notIncludes(multiProcessed, '{time}', 'Should replace all {time} occurrences');
  });

  // Test: Configuration Management
  runner.test('TemplateMatching - Manage configuration properly', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    const originalConfig = engine.getConfig();
    Assert.true(typeof originalConfig === 'object', 'Should return configuration object');
    Assert.true(typeof originalConfig.scoring === 'object', 'Should have scoring configuration');
    Assert.true(typeof originalConfig.suggestions === 'object', 'Should have suggestions configuration');
    
    // Test configuration update
    const newConfig = {
      scoring: {
        keywordMatchWeight: 2.0,
        minScore: 0.2
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

  // Test: Edge Cases and Error Handling
  runner.test('TemplateMatching - Handle edge cases gracefully', async () => {
    const engine = new TemplateEngine(mockStorageManager);
    
    // Test with empty templates array
    const emptyMatches = await engine.matchTemplates('test content', 'test_group');
    Assert.true(Array.isArray(emptyMatches), 'Should return array for empty templates');
    
    // Test with very short content
    const shortContent = 'hi';
    const shortMatches = await engine.matchTemplates(shortContent, 'test_group');
    Assert.true(Array.isArray(shortMatches), 'Should handle short content gracefully');
    
    // Test with very long content
    const longContent = 'word '.repeat(1000);
    const longMatches = await engine.matchTemplates(longContent, 'test_group');
    Assert.true(Array.isArray(longMatches), 'Should handle long content gracefully');
    
    // Test with special characters
    const specialContent = 'Test with @mentions #hashtags and https://urls.com';
    const specialMatches = await engine.matchTemplates(specialContent, 'test_group');
    Assert.true(Array.isArray(specialMatches), 'Should handle special characters gracefully');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runTemplateMatchingTests = runTemplateMatchingTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runTemplateMatchingTests;
}