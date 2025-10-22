/**
 * Integration Tests for AI Service Integration
 * Tests AI service integration with mock APIs, error handling, and rate limiting
 */

// Test suite for AI Service Integration
async function runAIServiceIntegrationTests() {
  const runner = new TestRunner();
  
  // Mock AI API responses
  const mockAIResponses = {
    gemini: {
      rephrase: {
        candidates: [{
          content: {
            parts: [{
              text: 'Rephrased: Great build! If you need custom exhaust work, we offer same-day installation services.'
            }]
          }
        }]
      },
      generate: {
        candidates: [{
          content: {
            parts: [{
              text: 'Template 1: Looking for automotive services? We specialize in performance upgrades.\nTemplate 2: Need car repairs? Our certified mechanics can help.\nTemplate 3: Custom automotive work available - contact us today!'
            }]
          }
        }]
      },
      analyze: {
        candidates: [{
          content: {
            parts: [{
              text: 'Intent: automotive_service_inquiry, Confidence: 0.85, Keywords: exhaust, performance, car'
            }]
          }
        }]
      }
    },
    openai: {
      rephrase: {
        choices: [{
          message: {
            content: 'Rephrased: Excellent work! For custom exhaust installations, we provide same-day service.'
          }
        }]
      },
      generate: {
        choices: [{
          message: {
            content: 'Template 1: Automotive services available - performance upgrades our specialty.\nTemplate 2: Professional car repairs by certified mechanics.\nTemplate 3: Custom automotive solutions - reach out today!'
          }
        }]
      },
      analyze: {
        choices: [{
          message: {
            content: 'Intent: automotive_inquiry, Confidence: 0.82, Keywords: exhaust, performance, automotive'
          }
        }]
      }
    }
  };
  
  // Mock HTTP client for API requests
  class MockHTTPClient {
    constructor() {
      this.requests = [];
      this.responses = new Map();
      this.networkDelay = 100; // ms
      this.failureRate = 0; // 0-1
    }
    
    setResponse(url, response) {
      this.responses.set(url, response);
    }
    
    setNetworkDelay(delay) {
      this.networkDelay = delay;
    }
    
    setFailureRate(rate) {
      this.failureRate = rate;
    }
    
    async post(url, data, headers = {}) {
      // Record request
      this.requests.push({ url, data, headers, timestamp: Date.now() });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, this.networkDelay));
      
      // Simulate random failures
      if (Math.random() < this.failureRate) {
        throw new Error('Network request failed');
      }
      
      // Return mock response
      const response = this.responses.get(url);
      if (!response) {
        throw new Error(`No mock response configured for ${url}`);
      }
      
      return {
        ok: true,
        status: 200,
        json: async () => response
      };
    }
    
    getRequestHistory() {
      return [...this.requests];
    }
    
    clearHistory() {
      this.requests = [];
    }
  }

  // Test: AI Service Provider Integration
  runner.test('AIServiceIntegration - Integrate with AI providers correctly', async () => {
    const httpClient = new MockHTTPClient();
    
    class MockAIService {
      constructor(provider, apiKey, httpClient) {
        this.provider = provider;
        this.apiKey = apiKey;
        this.httpClient = httpClient;
        this.baseUrls = {
          gemini: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
          openai: 'https://api.openai.com/v1/chat/completions'
        };
      }
      
      async rephraseComment(originalText, context = '') {
        const url = this.baseUrls[this.provider];
        const requestData = this.buildRephraseRequest(originalText, context);
        
        httpClient.setResponse(url, mockAIResponses[this.provider].rephrase);
        
        const response = await this.httpClient.post(url, requestData, this.getHeaders());
        const data = await response.json();
        
        return this.parseRephraseResponse(data);
      }
      
      async generateTemplates(nicheDescription, count = 3) {
        const url = this.baseUrls[this.provider];
        const requestData = this.buildGenerateRequest(nicheDescription, count);
        
        httpClient.setResponse(url, mockAIResponses[this.provider].generate);
        
        const response = await this.httpClient.post(url, requestData, this.getHeaders());
        const data = await response.json();
        
        return this.parseGenerateResponse(data);
      }
      
      buildRephraseRequest(text, context) {
        if (this.provider === 'gemini') {
          return {
            contents: [{
              parts: [{
                text: `Rephrase this comment to be more engaging while keeping the same meaning: "${text}". Context: ${context}`
              }]
            }]
          };
        } else {
          return {
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: `Rephrase this comment: "${text}". Context: ${context}`
            }]
          };
        }
      }
      
      buildGenerateRequest(niche, count) {
        const prompt = `Generate ${count} advertisement comment templates for ${niche} business.`;
        
        if (this.provider === 'gemini') {
          return {
            contents: [{ parts: [{ text: prompt }] }]
          };
        } else {
          return {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
          };
        }
      }
      
      parseRephraseResponse(data) {
        if (this.provider === 'gemini') {
          return data.candidates[0].content.parts[0].text.replace('Rephrased: ', '');
        } else {
          return data.choices[0].message.content.replace('Rephrased: ', '');
        }
      }
      
      parseGenerateResponse(data) {
        let text;
        if (this.provider === 'gemini') {
          text = data.candidates[0].content.parts[0].text;
        } else {
          text = data.choices[0].message.content;
        }
        
        return text.split('\n').filter(line => line.trim().startsWith('Template')).map((line, index) => ({
          id: `generated_${index}`,
          label: `Generated Template ${index + 1}`,
          template: line.replace(/^Template \d+:\s*/, ''),
          keywords: ['generated', 'ai'],
          verticals: ['general']
        }));
      }
      
      getHeaders() {
        if (this.provider === 'gemini') {
          return {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          };
        } else {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          };
        }
      }
    }
    
    // Test Gemini integration
    const geminiService = new MockAIService('gemini', 'test-gemini-key', httpClient);
    
    const geminiRephrase = await geminiService.rephraseComment('Great build! Check out our services.');
    Assert.true(typeof geminiRephrase === 'string', 'Should return rephrased text from Gemini');
    Assert.greaterThan(geminiRephrase.length, 0, 'Should return non-empty rephrased text');
    
    const geminiTemplates = await geminiService.generateTemplates('automotive', 3);
    Assert.true(Array.isArray(geminiTemplates), 'Should return templates array from Gemini');
    Assert.equal(geminiTemplates.length, 3, 'Should return requested number of templates');
    
    // Test OpenAI integration
    httpClient.clearHistory();
    const openaiService = new MockAIService('openai', 'test-openai-key', httpClient);
    
    const openaiRephrase = await openaiService.rephraseComment('Great build! Check out our services.');
    Assert.true(typeof openaiRephrase === 'string', 'Should return rephrased text from OpenAI');
    Assert.greaterThan(openaiRephrase.length, 0, 'Should return non-empty rephrased text');
    
    const openaiTemplates = await openaiService.generateTemplates('automotive', 3);
    Assert.true(Array.isArray(openaiTemplates), 'Should return templates array from OpenAI');
    Assert.equal(openaiTemplates.length, 3, 'Should return requested number of templates');
    
    // Verify requests were made
    const requests = httpClient.getRequestHistory();
    Assert.greaterThan(requests.length, 0, 'Should make API requests');
  });

  // Test: Rate Limiting and Throttling
  runner.test('AIServiceIntegration - Handle rate limiting correctly', async () => {
    class MockRateLimiter {
      constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
      }
      
      async checkRateLimit() {
        const now = Date.now();
        
        // Remove old requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
          const oldestRequest = Math.min(...this.requests);
          const waitTime = this.windowMs - (now - oldestRequest);
          throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
        }
        
        this.requests.push(now);
      }
      
      getRemainingRequests() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.maxRequests - this.requests.length;
      }
    }
    
    const rateLimiter = new MockRateLimiter(3, 1000); // 3 requests per second
    
    // Test normal operation
    await rateLimiter.checkRateLimit();
    await rateLimiter.checkRateLimit();
    await rateLimiter.checkRateLimit();
    
    Assert.equal(rateLimiter.getRemainingRequests(), 0, 'Should track request count correctly');
    
    // Test rate limit exceeded
    try {
      await rateLimiter.checkRateLimit();
      Assert.true(false, 'Should throw rate limit error');
    } catch (error) {
      Assert.includes(error.message, 'Rate limit exceeded', 'Should throw rate limit error');
    }
    
    // Test rate limit reset after window
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for window to reset
    
    await rateLimiter.checkRateLimit(); // Should succeed
    Assert.greaterThan(rateLimiter.getRemainingRequests(), 0, 'Should reset rate limit after window');
  });

  // Test: Error Handling and Retry Logic
  runner.test('AIServiceIntegration - Handle errors and retry appropriately', async () => {
    const httpClient = new MockHTTPClient();
    
    class MockAIServiceWithRetry {
      constructor(httpClient) {
        this.httpClient = httpClient;
        this.maxRetries = 3;
        this.retryDelay = 100;
      }
      
      async makeRequestWithRetry(url, data) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
          try {
            const response = await this.httpClient.post(url, data);
            return await response.json();
          } catch (error) {
            lastError = error;
            
            if (attempt < this.maxRetries) {
              // Exponential backoff
              const delay = this.retryDelay * Math.pow(2, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw new Error(`Request failed after ${this.maxRetries + 1} attempts: ${lastError.message}`);
      }
    }
    
    const aiService = new MockAIServiceWithRetry(httpClient);
    
    // Test successful request (no retry needed)
    httpClient.setFailureRate(0);
    httpClient.setResponse('test-url', { success: true });
    
    const successResult = await aiService.makeRequestWithRetry('test-url', {});
    Assert.true(successResult.success, 'Should succeed without retry');
    
    // Test retry on failure
    httpClient.clearHistory();
    httpClient.setFailureRate(0.7); // 70% failure rate
    
    try {
      await aiService.makeRequestWithRetry('test-url', {});
    } catch (error) {
      Assert.includes(error.message, 'failed after', 'Should retry and eventually fail');
    }
    
    const requests = httpClient.getRequestHistory();
    Assert.greaterThan(requests.length, 1, 'Should make multiple retry attempts');
  });

  // Test: AI Response Parsing and Validation
  runner.test('AIServiceIntegration - Parse and validate AI responses correctly', async () => {
    class MockResponseParser {
      parseGeminiResponse(response) {
        if (!response.candidates || response.candidates.length === 0) {
          throw new Error('Invalid Gemini response: no candidates');
        }
        
        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          throw new Error('Invalid Gemini response: no content parts');
        }
        
        return candidate.content.parts[0].text;
      }
      
      parseOpenAIResponse(response) {
        if (!response.choices || response.choices.length === 0) {
          throw new Error('Invalid OpenAI response: no choices');
        }
        
        const choice = response.choices[0];
        if (!choice.message || !choice.message.content) {
          throw new Error('Invalid OpenAI response: no message content');
        }
        
        return choice.message.content;
      }
      
      validateResponseContent(content) {
        if (typeof content !== 'string') {
          throw new Error('Response content must be a string');
        }
        
        if (content.trim().length === 0) {
          throw new Error('Response content cannot be empty');
        }
        
        if (content.length > 10000) {
          throw new Error('Response content too long');
        }
        
        return true;
      }
    }
    
    const parser = new MockResponseParser();
    
    // Test valid Gemini response
    const validGeminiResponse = mockAIResponses.gemini.rephrase;
    const geminiContent = parser.parseGeminiResponse(validGeminiResponse);
    Assert.true(typeof geminiContent === 'string', 'Should parse Gemini response to string');
    Assert.true(parser.validateResponseContent(geminiContent), 'Should validate Gemini content');
    
    // Test valid OpenAI response
    const validOpenAIResponse = mockAIResponses.openai.rephrase;
    const openaiContent = parser.parseOpenAIResponse(validOpenAIResponse);
    Assert.true(typeof openaiContent === 'string', 'Should parse OpenAI response to string');
    Assert.true(parser.validateResponseContent(openaiContent), 'Should validate OpenAI content');
    
    // Test invalid responses
    try {
      parser.parseGeminiResponse({ candidates: [] });
      Assert.true(false, 'Should throw error for empty candidates');
    } catch (error) {
      Assert.includes(error.message, 'no candidates', 'Should detect missing candidates');
    }
    
    try {
      parser.parseOpenAIResponse({ choices: [] });
      Assert.true(false, 'Should throw error for empty choices');
    } catch (error) {
      Assert.includes(error.message, 'no choices', 'Should detect missing choices');
    }
    
    // Test content validation
    try {
      parser.validateResponseContent('');
      Assert.true(false, 'Should throw error for empty content');
    } catch (error) {
      Assert.includes(error.message, 'cannot be empty', 'Should detect empty content');
    }
  });

  // Test: Integration with Template Engine
  runner.test('AIServiceIntegration - Integrate with template engine seamlessly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    const httpClient = new MockHTTPClient();
    
    // Add test template
    await mockStorageManager.saveTemplate({
      id: 'ai_integration_test',
      label: 'AI Integration Test',
      template: 'Great build! Check out our services at {site}',
      keywords: ['build', 'services'],
      verticals: ['automotive']
    });
    
    class MockAIIntegratedTemplateEngine extends TemplateEngine {
      constructor(storageManager, aiService) {
        super(storageManager, aiService);
      }
      
      async rephraseTemplateWithAI(templateId, context = '') {
        const template = await this.storageManager.getTemplate(templateId);
        if (!template) {
          throw new Error('Template not found');
        }
        
        if (!this.aiService) {
          throw new Error('AI service not configured');
        }
        
        const rephrasedText = await this.aiService.rephraseComment(template.template, context);
        
        return {
          originalTemplate: template,
          rephrasedText: rephrasedText,
          context: context
        };
      }
      
      async generateTemplatesWithAI(nicheDescription, count = 3) {
        if (!this.aiService) {
          throw new Error('AI service not configured');
        }
        
        const generatedTemplates = await this.aiService.generateTemplates(nicheDescription, count);
        
        // Save generated templates
        const savedTemplates = [];
        for (const template of generatedTemplates) {
          const templateId = await this.storageManager.saveTemplate(template);
          savedTemplates.push({ ...template, id: templateId });
        }
        
        return savedTemplates;
      }
    }
    
    // Mock AI service
    const mockAIService = {
      async rephraseComment(text, context) {
        // Simulate AI rephrasing
        return `AI Rephrased: ${text} (Context: ${context})`;
      },
      
      async generateTemplates(niche, count) {
        const templates = [];
        for (let i = 0; i < count; i++) {
          templates.push({
            id: `ai_generated_${i}`,
            label: `AI Generated ${niche} Template ${i + 1}`,
            template: `AI generated template for ${niche} business ${i + 1}`,
            keywords: [niche, 'ai', 'generated'],
            verticals: [niche]
          });
        }
        return templates;
      }
    };
    
    const templateEngine = new MockAIIntegratedTemplateEngine(mockStorageManager, mockAIService);
    
    // Test template rephrasing
    const rephraseResult = await templateEngine.rephraseTemplateWithAI('ai_integration_test', 'automotive context');
    Assert.true(typeof rephraseResult.rephrasedText === 'string', 'Should return rephrased text');
    Assert.includes(rephraseResult.rephrasedText, 'AI Rephrased:', 'Should contain AI rephrasing marker');
    Assert.equal(rephraseResult.originalTemplate.id, 'ai_integration_test', 'Should return original template');
    
    // Test template generation
    const generatedTemplates = await templateEngine.generateTemplatesWithAI('fitness', 2);
    Assert.equal(generatedTemplates.length, 2, 'Should generate requested number of templates');
    
    for (const template of generatedTemplates) {
      Assert.true(typeof template.id === 'string', 'Generated template should have ID');
      Assert.includes(template.template, 'fitness', 'Generated template should include niche');
      Assert.includes(template.keywords, 'fitness', 'Generated template should have niche keyword');
    }
    
    // Verify templates were saved
    const allTemplates = await mockStorageManager.getTemplates();
    Assert.greaterThan(allTemplates.length, 1, 'Should save generated templates to storage');
  });

  // Test: API Key Management and Security
  runner.test('AIServiceIntegration - Manage API keys securely', async () => {
    class MockAPIKeyManager {
      constructor() {
        this.encryptedKeys = new Map();
        this.encryptionKey = 'test-encryption-key';
      }
      
      encrypt(text) {
        // Simple XOR encryption for testing
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
          encrypted += String.fromCharCode(charCode);
        }
        return btoa(encrypted);
      }
      
      decrypt(encryptedText) {
        try {
          const encrypted = atob(encryptedText);
          let decrypted = '';
          for (let i = 0; i < encrypted.length; i++) {
            const charCode = encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
            decrypted += String.fromCharCode(charCode);
          }
          return decrypted;
        } catch (error) {
          throw new Error('Failed to decrypt API key');
        }
      }
      
      storeAPIKey(provider, apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
          throw new Error('Invalid API key');
        }
        
        const encrypted = this.encrypt(apiKey);
        this.encryptedKeys.set(provider, encrypted);
      }
      
      getAPIKey(provider) {
        const encrypted = this.encryptedKeys.get(provider);
        if (!encrypted) {
          return null;
        }
        
        return this.decrypt(encrypted);
      }
      
      validateAPIKey(provider, apiKey) {
        // Basic validation
        if (!apiKey || typeof apiKey !== 'string') {
          return false;
        }
        
        if (provider === 'gemini') {
          return apiKey.startsWith('AIza') && apiKey.length > 30;
        } else if (provider === 'openai') {
          return apiKey.startsWith('sk-') && apiKey.length > 40;
        }
        
        return false;
      }
      
      clearAPIKeys() {
        this.encryptedKeys.clear();
      }
    }
    
    const keyManager = new MockAPIKeyManager();
    
    // Test API key storage and retrieval
    const testGeminiKey = 'AIzaSyDummyGeminiKeyForTesting123456789';
    const testOpenAIKey = 'sk-dummy-openai-key-for-testing-123456789012345678901234567890';
    
    keyManager.storeAPIKey('gemini', testGeminiKey);
    keyManager.storeAPIKey('openai', testOpenAIKey);
    
    const retrievedGeminiKey = keyManager.getAPIKey('gemini');
    const retrievedOpenAIKey = keyManager.getAPIKey('openai');
    
    Assert.equal(retrievedGeminiKey, testGeminiKey, 'Should retrieve correct Gemini API key');
    Assert.equal(retrievedOpenAIKey, testOpenAIKey, 'Should retrieve correct OpenAI API key');
    
    // Test API key validation
    Assert.true(keyManager.validateAPIKey('gemini', testGeminiKey), 'Should validate correct Gemini key');
    Assert.true(keyManager.validateAPIKey('openai', testOpenAIKey), 'Should validate correct OpenAI key');
    Assert.false(keyManager.validateAPIKey('gemini', 'invalid-key'), 'Should reject invalid Gemini key');
    Assert.false(keyManager.validateAPIKey('openai', 'invalid-key'), 'Should reject invalid OpenAI key');
    
    // Test non-existent key
    const nonExistentKey = keyManager.getAPIKey('nonexistent');
    Assert.equal(nonExistentKey, null, 'Should return null for non-existent key');
    
    // Test key clearing
    keyManager.clearAPIKeys();
    const clearedKey = keyManager.getAPIKey('gemini');
    Assert.equal(clearedKey, null, 'Should clear all API keys');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runAIServiceIntegrationTests = runAIServiceIntegrationTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runAIServiceIntegrationTests;
}