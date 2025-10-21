/**
 * Simple Test Runner for AdReply Chrome Extension
 * Provides basic testing functionality without external dependencies
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      errors: []
    };
  }

  /**
   * Add a test case
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Run all tests
   * @returns {Promise<Object>} Test results
   */
  async run() {
    console.log('🧪 Running AdReply Unit Tests...\n');
    
    this.results = {
      passed: 0,
      failed: 0,
      total: this.tests.length,
      errors: []
    };

    for (const test of this.tests) {
      try {
        await test.testFn();
        this.results.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({ test: test.name, error: error.message });
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    const success = this.results.failed === 0;
    console.log(`\n${success ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  }
}

// Test assertion helpers
class Assert {
  static equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
    }
  }

  static notEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(`${message} Expected not to equal: ${expected}`);
    }
  }

  static true(value, message = '') {
    if (value !== true) {
      throw new Error(`${message} Expected true, got: ${value}`);
    }
  }

  static false(value, message = '') {
    if (value !== false) {
      throw new Error(`${message} Expected false, got: ${value}`);
    }
  }

  static throws(fn, message = '') {
    try {
      fn();
      throw new Error(`${message} Expected function to throw`);
    } catch (error) {
      // Expected to throw
    }
  }

  static async throwsAsync(fn, message = '') {
    try {
      await fn();
      throw new Error(`${message} Expected async function to throw`);
    } catch (error) {
      // Expected to throw
    }
  }

  static arrayEqual(actual, expected, message = '') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`${message} Both values must be arrays`);
    }
    if (actual.length !== expected.length) {
      throw new Error(`${message} Array lengths differ. Expected: ${expected.length}, Actual: ${actual.length}`);
    }
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(`${message} Arrays differ at index ${i}. Expected: ${expected[i]}, Actual: ${actual[i]}`);
      }
    }
  }

  static objectEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    if (actualStr !== expectedStr) {
      throw new Error(`${message} Objects differ.\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
  }

  static greaterThan(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(`${message} Expected ${actual} to be greater than ${expected}`);
    }
  }

  static lessThan(actual, expected, message = '') {
    if (actual >= expected) {
      throw new Error(`${message} Expected ${actual} to be less than ${expected}`);
    }
  }

  static includes(array, value, message = '') {
    if (!array.includes(value)) {
      throw new Error(`${message} Expected array to include: ${value}`);
    }
  }

  static notIncludes(array, value, message = '') {
    if (array.includes(value)) {
      throw new Error(`${message} Expected array not to include: ${value}`);
    }
  }
}

// Mock helpers for testing
class MockHelpers {
  /**
   * Create a mock storage manager
   */
  static createMockStorageManager() {
    const templates = new Map();
    const groups = new Map();
    
    return {
      // Template operations
      async saveTemplate(template) {
        const id = template.id || `template_${Date.now()}`;
        templates.set(id, { ...template, id });
        return id;
      },
      
      async getTemplate(id) {
        return templates.get(id) || null;
      },
      
      async getTemplates(filters = {}) {
        let result = Array.from(templates.values());
        
        if (filters.vertical) {
          result = result.filter(t => 
            t.verticals && t.verticals.includes(filters.vertical)
          );
        }
        
        return result;
      },
      
      async deleteTemplate(id) {
        return templates.delete(id);
      },
      
      async incrementTemplateUsage(id) {
        const template = templates.get(id);
        if (template) {
          template.usageCount = (template.usageCount || 0) + 1;
        }
      },
      
      // Group operations
      async updateGroupHistory(groupId, templateId, variantIndex) {
        groups.set(groupId, {
          groupId,
          lastTemplateId: templateId,
          lastVariantIndex: variantIndex,
          lastUsedAt: new Date().toISOString(),
          totalComments: (groups.get(groupId)?.totalComments || 0) + 1
        });
      },
      
      async getGroupHistory(groupId) {
        return groups.get(groupId) || null;
      },
      
      // Utility
      clear() {
        templates.clear();
        groups.clear();
      }
    };
  }

  /**
   * Create a mock AI service
   */
  static createMockAIService() {
    return {
      async rephraseComment(text, context) {
        return `Rephrased: ${text}`;
      },
      
      async generateTemplates(niche, count) {
        const templates = [];
        for (let i = 0; i < count; i++) {
          templates.push({
            id: `generated_${i}`,
            label: `Generated Template ${i + 1}`,
            template: `Generated template for ${niche} - ${i + 1}`,
            keywords: [niche.toLowerCase(), 'generated'],
            verticals: [niche.toLowerCase()]
          });
        }
        return templates;
      },
      
      async rankTemplateRelevance(postContent, templates) {
        return templates.map((template, index) => ({
          templateId: template.id,
          score: Math.random() * 0.5 + 0.5 // Random score between 0.5-1.0
        }));
      }
    };
  }

  /**
   * Create a mock license manager
   */
  static createMockLicenseManager(tier = 'free') {
    return {
      async checkFeatureAccess(feature) {
        if (tier === 'pro') return true;
        return feature === 'basic_templates';
      }
    };
  }
}

// Export for use in tests
if (typeof window !== 'undefined') {
  window.TestRunner = TestRunner;
  window.Assert = Assert;
  window.MockHelpers = MockHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestRunner, Assert, MockHelpers };
}