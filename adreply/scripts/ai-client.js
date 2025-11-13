/**
 * AI Client Module for AdReply v2.0
 * Provides unified interface for multiple AI providers (Gemini and OpenAI)
 */

/**
 * Base error class for AI-related errors
 */
class AIError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Base class for AI providers
 */
class AIProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new AIError('API key is required', 'MISSING_API_KEY');
    }
    this.apiKey = apiKey;
  }

  /**
   * Build the prompt for generating advertising setup
   * @param {string} businessDescription - User's business description
   * @returns {string} - Formatted prompt
   */
  _buildPrompt(businessDescription) {
    return `You are an advertising expert. Generate a complete advertising system for: ${businessDescription}

IMPORTANT REQUIREMENTS:
- Each template must be 400-600 characters long (minimum 4 sentences)
- Templates should be engaging, conversational, and suitable for Facebook comments
- Include natural call-to-action phrases
- Use {{placeholders}} for customization points

Return JSON with this exact structure:
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "description": "Brief description",
      "positiveKeywords": ["keyword1", "keyword2"],
      "negativeKeywords": ["avoid1", "avoid2"],
      "templates": [
        {
          "id": "template-id",
          "title": "Template Title",
          "content": "Template text with {{placeholders}} - MUST be 400-600 characters",
          "keywords": ["relevant", "keywords"]
        }
      ]
    }
  ]
}

Generate 3-5 categories with 10 templates each.
Each template MUST be at least 400 characters and contain 4+ sentences.`;
  }

  /**
   * Validate a single template
   * @param {Object} template - Template object to validate
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  _validateTemplate(template) {
    const errors = [];

    if (!template.id) {
      errors.push('Template missing id');
    }
    if (!template.title) {
      errors.push('Template missing title');
    }
    if (!template.content) {
      errors.push('Template missing content');
    } else {
      // Check minimum length (400 characters)
      if (template.content.length < 400) {
        errors.push(`Template "${template.title || 'unknown'}" is too short (${template.content.length} chars, minimum 400)`);
      }

      // Check sentence count (minimum 4)
      const sentences = template.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length < 4) {
        errors.push(`Template "${template.title || 'unknown'}" has too few sentences (${sentences.length}, minimum 4)`);
      }
    }

    if (!Array.isArray(template.keywords)) {
      errors.push('Template missing keywords array');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Parse and validate the AI response
   * @param {string} rawResponse - Raw response from AI provider
   * @returns {Object} - Parsed and validated data
   */
  _parseResponse(rawResponse) {
    let data;
    
    try {
      data = JSON.parse(rawResponse);
    } catch (error) {
      throw new AIError('Invalid JSON response from AI provider', 'INVALID_RESPONSE', error);
    }

    // Validate structure
    if (!data.categories || !Array.isArray(data.categories)) {
      throw new AIError('Response missing categories array', 'INVALID_RESPONSE');
    }

    if (data.categories.length < 3 || data.categories.length > 5) {
      throw new AIError(`Expected 3-5 categories, got ${data.categories.length}`, 'INVALID_RESPONSE');
    }

    // Validate each category
    const allErrors = [];
    data.categories.forEach((category, catIndex) => {
      if (!category.id) {
        allErrors.push(`Category ${catIndex + 1} missing id`);
      }
      if (!category.name) {
        allErrors.push(`Category ${catIndex + 1} missing name`);
      }
      if (!category.description) {
        allErrors.push(`Category ${catIndex + 1} missing description`);
      }
      if (!Array.isArray(category.positiveKeywords)) {
        allErrors.push(`Category ${catIndex + 1} missing positiveKeywords array`);
      }
      if (!Array.isArray(category.negativeKeywords)) {
        allErrors.push(`Category ${catIndex + 1} missing negativeKeywords array`);
      }
      if (!Array.isArray(category.templates)) {
        allErrors.push(`Category ${catIndex + 1} missing templates array`);
      } else {
        // Validate each template
        category.templates.forEach((template, templateIndex) => {
          const validation = this._validateTemplate(template);
          if (!validation.isValid) {
            validation.errors.forEach(error => {
              allErrors.push(`Category "${category.name}" template ${templateIndex + 1}: ${error}`);
            });
          }
        });
      }
    });

    if (allErrors.length > 0) {
      throw new AIError(
        `Response validation failed:\n${allErrors.join('\n')}`,
        'INVALID_RESPONSE'
      );
    }

    return data;
  }

  /**
   * Generate setup data - must be implemented by subclasses
   * @param {string} businessDescription - User's business description
   * @returns {Promise<Object>} - Generated data
   */
  async generateSetup(businessDescription) {
    throw new Error('generateSetup must be implemented by subclass');
  }

  /**
   * Test connection to AI provider
   * @returns {Promise<boolean>} - True if connection successful
   */
  async testConnection() {
    throw new Error('testConnection must be implemented by subclass');
  }
}

/**
 * Gemini AI Provider implementation
 */
class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  /**
   * Generate setup data using Gemini API
   * @param {string} businessDescription - User's business description
   * @returns {Promise<Object>} - Generated data
   */
  async generateSetup(businessDescription) {
    if (!businessDescription || businessDescription.trim().length < 10) {
      throw new AIError('Business description must be at least 10 characters', 'INVALID_INPUT');
    }

    const prompt = this._buildPrompt(businessDescription);

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
        maxOutputTokens: 8192,
      }
    };

    try {
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          throw new AIError('Invalid API key. Please check your Gemini API credentials.', 'AUTH_FAILED');
        } else if (response.status === 429) {
          throw new AIError('Rate limit reached. Please wait and try again.', 'RATE_LIMIT');
        } else if (response.status === 400) {
          throw new AIError('Invalid request. Please try again.', 'INVALID_REQUEST');
        } else {
          throw new AIError(
            `API request failed: ${errorData.error?.message || response.statusText}`,
            'API_ERROR'
          );
        }
      }

      const data = await response.json();

      // Extract text from Gemini response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new AIError('Unexpected response structure from Gemini', 'INVALID_RESPONSE');
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      // Extract JSON from response (may be wrapped in markdown code blocks)
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return this._parseResponse(jsonText);

    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new AIError('Network error. Please check your connection.', 'NETWORK_ERROR', error);
      }

      throw new AIError('Generation failed. Please try again.', 'UNKNOWN_ERROR', error);
    }
  }

  /**
   * Test connection to Gemini API
   * @returns {Promise<boolean>} - True if connection successful
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection'
            }]
          }]
        })
      });

      return response.ok || response.status === 400; // 400 is ok for test (means auth worked)
    } catch (error) {
      return false;
    }
  }
}

/**
 * OpenAI Provider implementation
 */
class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Generate setup data using OpenAI API
   * @param {string} businessDescription - User's business description
   * @returns {Promise<Object>} - Generated data
   */
  async generateSetup(businessDescription) {
    if (!businessDescription || businessDescription.trim().length < 10) {
      throw new AIError('Business description must be at least 10 characters', 'INVALID_INPUT');
    }

    const prompt = this._buildPrompt(businessDescription);

    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert advertising copywriter who creates engaging, conversion-focused templates for Facebook marketing.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new AIError('Invalid API key. Please check your OpenAI API credentials.', 'AUTH_FAILED');
        } else if (response.status === 429) {
          throw new AIError('Rate limit reached. Please wait and try again.', 'RATE_LIMIT');
        } else if (response.status === 400) {
          throw new AIError('Invalid request. Please try again.', 'INVALID_REQUEST');
        } else if (response.status === 402) {
          throw new AIError('Quota exceeded. Please check your OpenAI billing.', 'QUOTA_EXCEEDED');
        } else {
          throw new AIError(
            `API request failed: ${errorData.error?.message || response.statusText}`,
            'API_ERROR'
          );
        }
      }

      const data = await response.json();

      // Extract text from OpenAI response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AIError('Unexpected response structure from OpenAI', 'INVALID_RESPONSE');
      }

      const generatedText = data.choices[0].message.content;

      // Extract JSON from response (may be wrapped in markdown code blocks)
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return this._parseResponse(jsonText);

    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new AIError('Network error. Please check your connection.', 'NETWORK_ERROR', error);
      }

      throw new AIError('Generation failed. Please try again.', 'UNKNOWN_ERROR', error);
    }
  }

  /**
   * Test connection to OpenAI API
   * @returns {Promise<boolean>} - True if connection successful
   */
  async testConnection() {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Main AI Client class - factory for creating provider instances
 */
class AIClient {
  /**
   * Create an AI client with the specified provider
   * @param {string} provider - 'gemini' or 'openai'
   * @param {string} apiKey - API key for the provider
   * @returns {AIProvider} - Provider instance
   */
  static create(provider, apiKey) {
    if (!provider) {
      throw new AIError('Provider is required', 'MISSING_PROVIDER');
    }

    if (!apiKey) {
      throw new AIError('API key is required', 'MISSING_API_KEY');
    }

    switch (provider.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider(apiKey);
      case 'openai':
        return new OpenAIProvider(apiKey);
      default:
        throw new AIError(`Unknown provider: ${provider}. Supported providers: gemini, openai`, 'UNKNOWN_PROVIDER');
    }
  }

  /**
   * Get list of supported providers
   * @returns {Array<Object>} - List of provider info
   */
  static getSupportedProviders() {
    return [
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s Gemini AI model',
        apiKeyUrl: 'https://makersuite.google.com/app/apikey'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI\'s GPT models',
        apiKeyUrl: 'https://platform.openai.com/api-keys'
      }
    ];
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIClient, AIError, GeminiProvider, OpenAIProvider };
}
