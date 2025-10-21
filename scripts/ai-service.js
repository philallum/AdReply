/**
 * AI Service Abstraction Layer for AdReply Extension
 * Provides multi-provider AI integration with secure API key management
 */

class AIService {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.providers = {
      gemini: null,
      openai: null
    };
    this.rateLimiter = new AIRateLimiter();
    this.initialized = false;
  }

  /**
   * Initialize AI service with current settings
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const aiSettings = await this.storageManager.getAISettings();
      
      if (!aiSettings.enabled || aiSettings.provider === 'off') {
        this.initialized = false;
        return;
      }

      // Initialize the selected provider
      if (aiSettings.provider === 'gemini' && aiSettings.geminiApiKey) {
        this.providers.gemini = new GeminiProvider(aiSettings.geminiApiKey);
      } else if (aiSettings.provider === 'openai' && aiSettings.openaiApiKey) {
        this.providers.openai = new OpenAIProvider(aiSettings.openaiApiKey);
      }

      this.currentProvider = aiSettings.provider;
      this.initialized = true;
      
      console.log(`AIService: Initialized with ${this.currentProvider} provider`);
    } catch (error) {
      console.error('AIService: Initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if AI service is ready to use
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && 
           this.currentProvider !== 'off' && 
           this.providers[this.currentProvider] !== null;
  }

  /**
   * Get current provider instance
   * @returns {Object|null}
   */
  getCurrentProvider() {
    if (!this.isReady()) return null;
    return this.providers[this.currentProvider];
  } 
 /**
   * Rephrase a comment template with context awareness
   * @param {string} originalText - Original template text
   * @param {string} context - Context for rephrasing (post content, niche, etc.)
   * @returns {Promise<string>} Rephrased text
   */
  async rephraseComment(originalText, context = '') {
    if (!this.isReady()) {
      throw new Error('AI service not initialized or configured');
    }

    // Check rate limits
    await this.rateLimiter.checkLimit('rephrase');

    try {
      const provider = this.getCurrentProvider();
      const prompt = this.buildRephrasePrompt(originalText, context);
      
      const response = await provider.generateText(prompt);
      
      // Record successful API call
      this.rateLimiter.recordSuccess('rephrase');
      
      return this.cleanRephraseResponse(response);
    } catch (error) {
      this.rateLimiter.recordError('rephrase');
      throw new Error(`AI rephrasing failed: ${error.message}`);
    }
  }

  /**
   * Generate new templates from niche description
   * @param {string} nicheDescription - Description of business/niche
   * @param {number} count - Number of templates to generate
   * @returns {Promise<Array>} Array of generated template objects
   */
  async generateTemplates(nicheDescription, count = 5) {
    if (!this.isReady()) {
      throw new Error('AI service not initialized or configured');
    }

    // Check rate limits
    await this.rateLimiter.checkLimit('generate');

    try {
      const provider = this.getCurrentProvider();
      const prompt = this.buildGenerationPrompt(nicheDescription, count);
      
      const response = await provider.generateText(prompt);
      
      // Record successful API call
      this.rateLimiter.recordSuccess('generate');
      
      return this.parseGeneratedTemplates(response, nicheDescription);
    } catch (error) {
      this.rateLimiter.recordError('generate');
      throw new Error(`AI template generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze post content and rank template relevance
   * @param {string} postContent - Facebook post content
   * @param {Array} templates - Templates to rank
   * @returns {Promise<Array>} Array of ranked templates with AI scores
   */
  async rankTemplateRelevance(postContent, templates) {
    if (!this.isReady()) {
      throw new Error('AI service not initialized or configured');
    }

    // Check rate limits
    await this.rateLimiter.checkLimit('analyze');

    try {
      const provider = this.getCurrentProvider();
      const prompt = this.buildAnalysisPrompt(postContent, templates);
      
      const response = await provider.generateText(prompt);
      
      // Record successful API call
      this.rateLimiter.recordSuccess('analyze');
      
      return this.parseRelevanceScores(response, templates);
    } catch (error) {
      this.rateLimiter.recordError('analyze');
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  } 
 /**
   * Build prompt for template rephrasing
   * @param {string} originalText - Original template text
   * @param {string} context - Context information
   * @returns {string} Formatted prompt
   */
  buildRephrasePrompt(originalText, context) {
    return `You are helping rephrase an advertisement comment for Facebook groups. 
Keep the same meaning and call-to-action but make it sound more natural and engaging.

Original comment: "${originalText}"
${context ? `Context: ${context}` : ''}

Requirements:
- Keep the same core message and call-to-action
- Make it sound natural and conversational
- Maintain any placeholders like {site}, {url}, etc.
- Keep it under 200 characters
- Don't use excessive emojis or caps

Rephrased comment:`;
  }

  /**
   * Build prompt for template generation
   * @param {string} nicheDescription - Business/niche description
   * @param {number} count - Number of templates to generate
   * @returns {string} Formatted prompt
   */
  buildGenerationPrompt(nicheDescription, count) {
    return `Generate ${count} advertisement comment templates for Facebook groups based on this business description:

Business: ${nicheDescription}

Requirements for each template:
- Natural, conversational tone
- Include a clear call-to-action
- Use placeholders like {site}, {url}, {contact} for customization
- Keep under 200 characters each
- Avoid being too salesy or spammy
- Make them suitable for different post contexts

Format as JSON array with this structure:
[
  {
    "template": "comment text with {placeholders}",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "verticals": ["category1", "category2"]
  }
]

Generated templates:`;
  }

  /**
   * Build prompt for relevance analysis
   * @param {string} postContent - Post content to analyze
   * @param {Array} templates - Templates to rank
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(postContent, templates) {
    const templateList = templates.map((t, i) => 
      `${i + 1}. "${t.template}" (keywords: ${t.keywords?.join(', ') || 'none'})`
    ).join('\n');

    return `Analyze this Facebook post and rank how relevant each advertisement template would be:

Post content: "${postContent}"

Templates to rank:
${templateList}

Rate each template's relevance from 0.0 to 1.0 based on:
- How well the template's service/product matches the post topic
- Natural fit for the conversation context
- Likelihood the poster would be interested

Format as JSON array:
[
  {"templateIndex": 1, "score": 0.8, "reason": "brief explanation"},
  {"templateIndex": 2, "score": 0.3, "reason": "brief explanation"}
]

Analysis:`;
  }  /**

   * Clean and validate rephrased response
   * @param {string} response - Raw AI response
   * @returns {string} Cleaned rephrased text
   */
  cleanRephraseResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid AI response');
    }

    // Extract the rephrased text (remove any extra formatting)
    let cleaned = response.trim();
    
    // Remove common AI response prefixes
    cleaned = cleaned.replace(/^(Rephrased comment:|Here's the rephrased version:|Rephrased:)/i, '').trim();
    
    // Remove quotes if the entire response is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Validate length
    if (cleaned.length > 300) {
      cleaned = cleaned.substring(0, 297) + '...';
    }
    
    if (cleaned.length < 10) {
      throw new Error('Rephrased text too short');
    }
    
    return cleaned;
  }

  /**
   * Parse generated templates from AI response
   * @param {string} response - Raw AI response
   * @param {string} nicheDescription - Original niche description
   * @returns {Array} Parsed template objects
   */
  parseGeneratedTemplates(response, nicheDescription) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const templates = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(templates)) {
        throw new Error('Response is not an array');
      }
      
      // Validate and clean each template
      return templates.map((template, index) => {
        if (!template.template || typeof template.template !== 'string') {
          throw new Error(`Template ${index + 1} missing or invalid template text`);
        }
        
        return {
          id: `ai_generated_${Date.now()}_${index}`,
          label: `AI Generated - ${nicheDescription.substring(0, 30)}`,
          template: template.template.trim(),
          keywords: Array.isArray(template.keywords) ? template.keywords : [],
          verticals: Array.isArray(template.verticals) ? template.verticals : [],
          variants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
          aiGenerated: true
        };
      });
      
    } catch (error) {
      console.error('Failed to parse generated templates:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Parse relevance scores from AI response
   * @param {string} response - Raw AI response
   * @param {Array} templates - Original templates
   * @returns {Array} Templates with AI relevance scores
   */
  parseRelevanceScores(response, templates) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const scores = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(scores)) {
        throw new Error('Response is not an array');
      }
      
      // Map scores back to templates
      return templates.map((template, index) => {
        const scoreData = scores.find(s => s.templateIndex === index + 1);
        
        return {
          templateId: template.id,
          score: scoreData ? Math.max(0, Math.min(1, scoreData.score)) : 0,
          reason: scoreData ? scoreData.reason : 'No AI analysis available'
        };
      });
      
    } catch (error) {
      console.error('Failed to parse relevance scores:', error);
      // Return default scores if parsing fails
      return templates.map(template => ({
        templateId: template.id,
        score: 0.5,
        reason: 'AI analysis failed'
      }));
    }
  }
}/**

 * Rate Limiter for AI API calls
 * Prevents excessive API usage and handles rate limiting
 */
class AIRateLimiter {
  constructor() {
    this.limits = {
      rephrase: { maxPerHour: 50, maxPerDay: 200 },
      generate: { maxPerHour: 20, maxPerDay: 100 },
      analyze: { maxPerHour: 100, maxPerDay: 500 }
    };
    
    this.usage = {
      rephrase: { hourly: [], daily: [] },
      generate: { hourly: [], daily: [] },
      analyze: { hourly: [], daily: [] }
    };
    
    this.errors = {
      rephrase: [],
      generate: [],
      analyze: []
    };
  }

  /**
   * Check if operation is within rate limits
   * @param {string} operation - Operation type
   * @returns {Promise<void>} Throws error if rate limited
   */
  async checkLimit(operation) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    // Clean old entries
    this.cleanOldEntries(operation, now, oneHour, oneDay);
    
    const limits = this.limits[operation];
    const usage = this.usage[operation];
    
    // Check hourly limit
    if (usage.hourly.length >= limits.maxPerHour) {
      const waitTime = Math.ceil((usage.hourly[0] + oneHour - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    }
    
    // Check daily limit
    if (usage.daily.length >= limits.maxPerDay) {
      const waitTime = Math.ceil((usage.daily[0] + oneDay - now) / (1000 * 60 * 60));
      throw new Error(`Daily limit exceeded. Try again in ${waitTime} hours.`);
    }
    
    // Check for recent errors (exponential backoff)
    const recentErrors = this.errors[operation].filter(time => now - time < 5 * 60 * 1000);
    if (recentErrors.length >= 3) {
      throw new Error('Too many recent errors. Please wait before trying again.');
    }
  }

  /**
   * Record successful API call
   * @param {string} operation - Operation type
   */
  recordSuccess(operation) {
    const now = Date.now();
    this.usage[operation].hourly.push(now);
    this.usage[operation].daily.push(now);
  }

  /**
   * Record API error
   * @param {string} operation - Operation type
   */
  recordError(operation) {
    const now = Date.now();
    this.errors[operation].push(now);
  }

  /**
   * Clean old usage entries
   * @param {string} operation - Operation type
   * @param {number} now - Current timestamp
   * @param {number} oneHour - One hour in milliseconds
   * @param {number} oneDay - One day in milliseconds
   */
  cleanOldEntries(operation, now, oneHour, oneDay) {
    const usage = this.usage[operation];
    
    // Clean hourly entries
    usage.hourly = usage.hourly.filter(time => now - time < oneHour);
    
    // Clean daily entries
    usage.daily = usage.daily.filter(time => now - time < oneDay);
    
    // Clean error entries (keep last 24 hours)
    this.errors[operation] = this.errors[operation].filter(time => now - time < oneDay);
  }

  /**
   * Get current usage statistics
   * @param {string} operation - Operation type
   * @returns {Object} Usage statistics
   */
  getUsageStats(operation) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    this.cleanOldEntries(operation, now, oneHour, oneDay);
    
    const limits = this.limits[operation];
    const usage = this.usage[operation];
    
    return {
      hourly: {
        used: usage.hourly.length,
        limit: limits.maxPerHour,
        remaining: limits.maxPerHour - usage.hourly.length
      },
      daily: {
        used: usage.daily.length,
        limit: limits.maxPerDay,
        remaining: limits.maxPerDay - usage.daily.length
      },
      recentErrors: this.errors[operation].filter(time => now - time < oneHour).length
    };
  }
}/
**
 * Google Gemini API Provider
 * Handles communication with Google's Gemini AI API
 */
class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Generate text using Gemini API
   * @param {string} prompt - Text prompt
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated by Gemini');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini');
      }

      return candidate.content.parts[0].text;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      await this.generateText('Test connection. Respond with "OK".');
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}/*
*
 * OpenAI API Provider
 * Handles communication with OpenAI's GPT API
 */
class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Generate text using OpenAI API
   * @param {string} prompt - Text prompt
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates natural, engaging advertisement comments for Facebook groups. Keep responses concise and professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.3
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (response.status === 429) {
          throw new Error('OpenAI rate limit exceeded');
        } else if (response.status === 402) {
          throw new Error('OpenAI quota exceeded');
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated by OpenAI');
      }

      const choice = data.choices[0];
      
      if (choice.finish_reason === 'content_filter') {
        throw new Error('Response blocked by content filter');
      }

      if (!choice.message || !choice.message.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      return choice.message.content.trim();

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      await this.generateText('Test connection. Respond with "OK".');
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIService,
    AIRateLimiter,
    GeminiProvider,
    OpenAIProvider
  };
} else {
  window.AIService = AIService;
  window.AIRateLimiter = AIRateLimiter;
  window.GeminiProvider = GeminiProvider;
  window.OpenAIProvider = OpenAIProvider;
}