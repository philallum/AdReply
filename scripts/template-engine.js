/**
 * Template Engine for AdReply Extension
 * Handles template matching, scoring, rotation, and suggestion generation
 */

class TemplateEngine {
  constructor(storageManager, aiService = null, licenseManager = null) {
    this.storageManager = storageManager;
    this.aiService = aiService;
    this.licenseManager = licenseManager;
    
    // Configuration for scoring algorithm
    this.config = {
      scoring: {
        keywordMatchWeight: 1.0,
        verticalMatchWeight: 0.8,
        exactMatchBonus: 0.5,
        partialMatchWeight: 0.3,
        lengthPenaltyThreshold: 50, // Words
        lengthPenaltyFactor: 0.1,
        minScore: 0.1
      },
      suggestions: {
        maxSuggestions: 3,
        diversityThreshold: 0.7, // Minimum difference between suggestions
        minRelevanceScore: 0.2
      }
    };
  }

  /**
   * Extract keywords from Facebook post content
   * @param {string} postContent - Raw post text
   * @returns {Object} Extracted keywords and metadata
   */
  extractKeywords(postContent) {
    if (!postContent || typeof postContent !== 'string') {
      return { keywords: [], cleanText: '', wordCount: 0 };
    }

    // Clean and normalize the text
    const cleanText = this.cleanText(postContent);
    
    // Split into words and filter
    const words = cleanText.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2) // Remove very short words
      .filter(word => !this.isStopWord(word)) // Remove common stop words
      .filter(word => /^[a-zA-Z0-9]+$/.test(word)); // Only alphanumeric

    // Extract meaningful keywords (nouns, adjectives, technical terms)
    const keywords = this.extractMeaningfulKeywords(words);
    
    // Extract phrases (2-3 word combinations)
    const phrases = this.extractPhrases(cleanText);
    
    return {
      keywords: [...new Set([...keywords, ...phrases])], // Remove duplicates
      cleanText,
      wordCount: words.length,
      originalLength: postContent.length
    };
  }

  /**
   * Clean text by removing URLs, mentions, hashtags, and special characters
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove Facebook mentions (@username)
      .replace(/@\w+/g, '')
      // Remove hashtags but keep the word
      .replace(/#(\w+)/g, '$1')
      // Remove extra whitespace and newlines
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s.,!?-]/g, ' ')
      .trim();
  }

  /**
   * Check if a word is a common stop word
   * @param {string} word - Word to check
   * @returns {boolean} True if it's a stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'now'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Extract meaningful keywords using simple heuristics
   * @param {string[]} words - Array of words
   * @returns {string[]} Meaningful keywords
   */
  extractMeaningfulKeywords(words) {
    const keywords = [];
    
    // Look for longer words (likely to be more meaningful)
    const longWords = words.filter(word => word.length >= 4);
    
    // Look for capitalized words (proper nouns, brands)
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]+$/.test(word) && word.length >= 3
    );
    
    // Look for technical terms (words with numbers or specific patterns)
    const technicalTerms = words.filter(word => 
      /\d/.test(word) || // Contains numbers
      word.includes('-') || // Hyphenated
      word.length >= 6 // Long technical words
    );
    
    // Combine and prioritize
    keywords.push(...technicalTerms);
    keywords.push(...capitalizedWords);
    keywords.push(...longWords.slice(0, 10)); // Limit long words
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract meaningful phrases from text
   * @param {string} text - Clean text
   * @returns {string[]} Array of phrases
   */
  extractPhrases(text) {
    const phrases = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (this.isMeaningfulPhrase(phrase)) {
        phrases.push(phrase);
      }
    }
    
    // Extract 3-word phrases (more selective)
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (this.isMeaningfulPhrase(phrase, 3)) {
        phrases.push(phrase);
      }
    }
    
    return phrases.slice(0, 5); // Limit number of phrases
  }

  /**
   * Check if a phrase is meaningful
   * @param {string} phrase - Phrase to check
   * @param {number} wordCount - Number of words in phrase
   * @returns {boolean} True if meaningful
   */
  isMeaningfulPhrase(phrase, wordCount = 2) {
    const words = phrase.split(' ');
    
    // Skip if contains stop words
    if (words.some(word => this.isStopWord(word))) {
      return false;
    }
    
    // Skip if too short
    if (phrase.length < 6) {
      return false;
    }
    
    // For 3-word phrases, be more selective
    if (wordCount === 3 && phrase.length < 10) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate template score based on keyword overlap with post content
   * @param {Object} template - Template object
   * @param {Object} extractedData - Extracted keywords and metadata from post
   * @returns {number} Relevance score (0-1)
   */
  calculateTemplateScore(template, extractedData) {
    if (!template || !extractedData || !extractedData.keywords) {
      return 0;
    }

    const { keywords: postKeywords, wordCount } = extractedData;
    const templateKeywords = template.keywords || [];
    const templateVerticals = template.verticals || [];
    
    if (templateKeywords.length === 0) {
      return this.config.scoring.minScore;
    }

    let score = 0;
    let matchCount = 0;
    
    // Calculate keyword matches
    for (const templateKeyword of templateKeywords) {
      const keywordLower = templateKeyword.toLowerCase();
      
      // Check for exact matches
      const exactMatch = postKeywords.some(postKeyword => 
        postKeyword.toLowerCase() === keywordLower
      );
      
      if (exactMatch) {
        score += this.config.scoring.keywordMatchWeight + this.config.scoring.exactMatchBonus;
        matchCount++;
        continue;
      }
      
      // Check for partial matches
      const partialMatch = postKeywords.some(postKeyword => 
        postKeyword.toLowerCase().includes(keywordLower) || 
        keywordLower.includes(postKeyword.toLowerCase())
      );
      
      if (partialMatch) {
        score += this.config.scoring.keywordMatchWeight * this.config.scoring.partialMatchWeight;
        matchCount++;
      }
    }
    
    // Check vertical matches (if post content suggests a vertical)
    const verticalScore = this.calculateVerticalScore(templateVerticals, extractedData);
    score += verticalScore;
    
    // Normalize score by template keyword count
    if (templateKeywords.length > 0) {
      score = score / templateKeywords.length;
    }
    
    // Apply length penalty for very long posts (less focused)
    if (wordCount > this.config.scoring.lengthPenaltyThreshold) {
      const penalty = (wordCount - this.config.scoring.lengthPenaltyThreshold) * 
                     this.config.scoring.lengthPenaltyFactor;
      score = Math.max(score - penalty, 0);
    }
    
    // Boost score if high match ratio
    const matchRatio = matchCount / templateKeywords.length;
    if (matchRatio > 0.5) {
      score *= (1 + matchRatio * 0.5);
    }
    
    // Ensure score is within bounds
    return Math.max(Math.min(score, 1), 0);
  }

  /**
   * Calculate vertical/category relevance score
   * @param {string[]} templateVerticals - Template verticals
   * @param {Object} extractedData - Extracted data from post
   * @returns {number} Vertical relevance score
   */
  calculateVerticalScore(templateVerticals, extractedData) {
    if (!templateVerticals || templateVerticals.length === 0) {
      return 0;
    }

    const { keywords, cleanText } = extractedData;
    let verticalScore = 0;
    
    // Define vertical indicators (keywords that suggest specific verticals)
    const verticalIndicators = {
      'automotive': ['car', 'auto', 'vehicle', 'engine', 'repair', 'garage', 'mechanic', 'driving'],
      'motorcycles': ['bike', 'motorcycle', 'motorbike', 'rider', 'helmet', 'exhaust'],
      'fitness': ['gym', 'workout', 'exercise', 'training', 'fitness', 'muscle', 'weight'],
      'food': ['food', 'restaurant', 'cooking', 'recipe', 'meal', 'kitchen', 'chef'],
      'technology': ['tech', 'software', 'computer', 'app', 'digital', 'online', 'website'],
      'fashion': ['fashion', 'style', 'clothing', 'outfit', 'brand', 'designer'],
      'home': ['home', 'house', 'interior', 'furniture', 'decoration', 'garden'],
      'business': ['business', 'entrepreneur', 'startup', 'marketing', 'sales', 'company']
    };
    
    for (const vertical of templateVerticals) {
      const verticalLower = vertical.toLowerCase();
      const indicators = verticalIndicators[verticalLower] || [verticalLower];
      
      // Check if post content contains vertical indicators
      const hasVerticalKeywords = indicators.some(indicator => 
        keywords.some(keyword => keyword.includes(indicator)) ||
        cleanText.toLowerCase().includes(indicator)
      );
      
      if (hasVerticalKeywords) {
        verticalScore += this.config.scoring.verticalMatchWeight;
      }
    }
    
    return Math.min(verticalScore, this.config.scoring.verticalMatchWeight);
  }

  /**
   * Match templates against post content and return scored results
   * @param {string} postContent - Facebook post content
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Array>} Array of scored template matches
   */
  async matchTemplates(postContent, groupId) {
    try {
      // Extract keywords from post content
      const extractedData = this.extractKeywords(postContent);
      
      if (extractedData.keywords.length === 0) {
        console.log('TemplateEngine: No keywords extracted from post content');
        return [];
      }
      
      // Get all templates from storage
      const templates = await this.storageManager.getTemplates();
      
      if (templates.length === 0) {
        console.log('TemplateEngine: No templates found in storage');
        return [];
      }
      
      // Score each template
      const scoredTemplates = templates.map(template => {
        const score = this.calculateTemplateScore(template, extractedData);
        
        return {
          template,
          score,
          matchedKeywords: this.getMatchedKeywords(template, extractedData),
          extractedData: extractedData
        };
      });
      
      // Filter out low-scoring templates
      const filteredTemplates = scoredTemplates.filter(item => 
        item.score >= this.config.scoring.minScore
      );
      
      // Sort by score (highest first)
      filteredTemplates.sort((a, b) => b.score - a.score);
      
      console.log(`TemplateEngine: Matched ${filteredTemplates.length} templates for post with ${extractedData.keywords.length} keywords`);
      
      return filteredTemplates;
      
    } catch (error) {
      console.error('TemplateEngine: Error matching templates:', error);
      return [];
    }
  }

  /**
   * Get keywords that matched between template and post
   * @param {Object} template - Template object
   * @param {Object} extractedData - Extracted data from post
   * @returns {string[]} Array of matched keywords
   */
  getMatchedKeywords(template, extractedData) {
    const matched = [];
    const templateKeywords = template.keywords || [];
    const postKeywords = extractedData.keywords || [];
    
    for (const templateKeyword of templateKeywords) {
      const keywordLower = templateKeyword.toLowerCase();
      
      // Check for exact or partial matches
      const matchingPostKeyword = postKeywords.find(postKeyword => {
        const postKeywordLower = postKeyword.toLowerCase();
        return postKeywordLower === keywordLower || 
               postKeywordLower.includes(keywordLower) || 
               keywordLower.includes(postKeywordLower);
      });
      
      if (matchingPostKeyword) {
        matched.push(templateKeyword);
      }
    }
    
    return matched;
  }

  /**
   * Apply anti-spam rotation logic to template matches
   * @param {Array} scoredTemplates - Array of scored template matches
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Array>} Filtered templates with rotation applied
   */
  async rotateTemplates(scoredTemplates, groupId) {
    try {
      if (!scoredTemplates || scoredTemplates.length === 0) {
        return [];
      }

      // Get group history to check last used templates
      const groupHistory = await this.storageManager.getGroupHistory(groupId);
      
      // Apply rotation filtering
      const rotatedTemplates = this.applyRotationFilter(scoredTemplates, groupHistory);
      
      console.log(`TemplateEngine: Applied rotation filter, ${rotatedTemplates.length} templates remain`);
      
      return rotatedTemplates;
      
    } catch (error) {
      console.error('TemplateEngine: Error applying rotation:', error);
      return scoredTemplates; // Return original on error
    }
  }

  /**
   * Filter templates based on rotation rules
   * @param {Array} scoredTemplates - Scored template matches
   * @param {Object|null} groupHistory - Group usage history
   * @returns {Array} Filtered templates
   */
  applyRotationFilter(scoredTemplates, groupHistory) {
    if (!groupHistory || !groupHistory.lastTemplateId) {
      // No history, return all templates
      return scoredTemplates;
    }

    const lastUsedTemplateId = groupHistory.lastTemplateId;
    const lastUsedAt = new Date(groupHistory.lastUsedAt);
    const now = new Date();
    
    // Calculate time since last use
    const timeSinceLastUse = now - lastUsedAt;
    const hoursSinceLastUse = timeSinceLastUse / (1000 * 60 * 60);
    
    // Rotation rules based on time elapsed
    const rotationRules = {
      immediate: 0,      // 0 hours - exclude last used template
      short: 2,          // 2 hours - allow if different vertical
      medium: 6,         // 6 hours - allow if score significantly higher
      long: 24           // 24 hours - allow all templates
    };
    
    return scoredTemplates.filter(item => {
      const template = item.template;
      
      // Always allow if different template
      if (template.id !== lastUsedTemplateId) {
        return true;
      }
      
      // Same template - apply time-based rules
      if (hoursSinceLastUse >= rotationRules.long) {
        // Long time passed, allow reuse
        return true;
      } else if (hoursSinceLastUse >= rotationRules.medium) {
        // Medium time, allow if score is significantly higher than others
        const avgScore = scoredTemplates.reduce((sum, t) => sum + t.score, 0) / scoredTemplates.length;
        return item.score > avgScore * 1.5;
      } else if (hoursSinceLastUse >= rotationRules.short) {
        // Short time, allow if different vertical
        const lastTemplate = scoredTemplates.find(t => t.template.id === lastUsedTemplateId);
        if (lastTemplate) {
          const lastVerticals = new Set(lastTemplate.template.verticals || []);
          const currentVerticals = new Set(template.verticals || []);
          const hasCommonVertical = [...currentVerticals].some(v => lastVerticals.has(v));
          return !hasCommonVertical;
        }
        return false;
      } else {
        // Recent use, exclude this template
        return false;
      }
    });
  }

  /**
   * Select the best variant for a template based on group history
   * @param {Object} template - Template object
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Object>} Selected variant info
   */
  async selectTemplateVariant(template, groupId) {
    try {
      const variants = [template.template, ...(template.variants || [])];
      
      if (variants.length <= 1) {
        return {
          text: template.template,
          variantIndex: 0,
          isMainTemplate: true
        };
      }

      // Get group history to check last used variant
      const groupHistory = await this.storageManager.getGroupHistory(groupId);
      
      let selectedIndex = 0;
      
      if (groupHistory && groupHistory.lastTemplateId === template.id) {
        // Same template was used before, rotate to next variant
        const lastVariantIndex = groupHistory.lastVariantIndex || 0;
        selectedIndex = (lastVariantIndex + 1) % variants.length;
      } else {
        // Different template or no history, use random selection weighted by usage
        selectedIndex = this.selectVariantByWeight(variants, template);
      }
      
      return {
        text: variants[selectedIndex],
        variantIndex: selectedIndex,
        isMainTemplate: selectedIndex === 0
      };
      
    } catch (error) {
      console.error('TemplateEngine: Error selecting variant:', error);
      return {
        text: template.template,
        variantIndex: 0,
        isMainTemplate: true
      };
    }
  }

  /**
   * Select variant using weighted random selection
   * @param {string[]} variants - Array of template variants
   * @param {Object} template - Template object with usage stats
   * @returns {number} Selected variant index
   */
  selectVariantByWeight(variants, template) {
    // For now, use simple round-robin based on usage count
    // In the future, this could be enhanced with variant-specific usage tracking
    const usageCount = template.usageCount || 0;
    return usageCount % variants.length;
  }

  /**
   * Generate top suggestions from matched and rotated templates
   * @param {Array} rotatedTemplates - Templates after rotation filtering
   * @param {string} groupId - Facebook group ID
   * @param {number} maxSuggestions - Maximum number of suggestions
   * @returns {Promise<Array>} Array of suggestion objects
   */
  async generateSuggestions(rotatedTemplates, groupId, maxSuggestions = null) {
    try {
      const maxCount = maxSuggestions || this.config.suggestions.maxSuggestions;
      
      if (!rotatedTemplates || rotatedTemplates.length === 0) {
        return [];
      }

      // Filter templates by minimum relevance score
      const relevantTemplates = rotatedTemplates.filter(item => 
        item.score >= this.config.suggestions.minRelevanceScore
      );

      if (relevantTemplates.length === 0) {
        console.log('TemplateEngine: No templates meet minimum relevance threshold');
        return [];
      }

      // Apply diversity filtering to avoid similar suggestions
      const diverseTemplates = this.applyDiversityFilter(relevantTemplates);
      
      // Select top suggestions
      const topTemplates = diverseTemplates.slice(0, maxCount);
      
      // Generate suggestion objects with variants and placeholders
      const suggestions = await Promise.all(
        topTemplates.map(async (item, index) => {
          const variant = await this.selectTemplateVariant(item.template, groupId);
          const processedText = this.replacePlaceholders(variant.text, groupId);
          
          return {
            id: `suggestion_${item.template.id}_${Date.now()}_${index}`,
            templateId: item.template.id,
            template: item.template,
            text: processedText,
            originalText: variant.text,
            variantIndex: variant.variantIndex,
            isMainTemplate: variant.isMainTemplate,
            score: item.score,
            matchedKeywords: item.matchedKeywords,
            rank: index + 1,
            confidence: this.calculateConfidence(item.score, index, topTemplates.length),
            metadata: {
              extractedData: item.extractedData,
              processingTime: Date.now()
            }
          };
        })
      );

      console.log(`TemplateEngine: Generated ${suggestions.length} suggestions from ${rotatedTemplates.length} matched templates`);
      
      return suggestions;
      
    } catch (error) {
      console.error('TemplateEngine: Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Apply diversity filtering to avoid similar suggestions
   * @param {Array} templates - Array of scored templates
   * @returns {Array} Filtered templates with diversity
   */
  applyDiversityFilter(templates) {
    if (templates.length <= 1) {
      return templates;
    }

    const diverseTemplates = [templates[0]]; // Always include highest scored
    const threshold = this.config.suggestions.diversityThreshold;
    
    for (let i = 1; i < templates.length; i++) {
      const candidate = templates[i];
      let isDiverse = true;
      
      // Check diversity against already selected templates
      for (const selected of diverseTemplates) {
        const similarity = this.calculateTemplateSimilarity(candidate.template, selected.template);
        
        if (similarity > threshold) {
          isDiverse = false;
          break;
        }
      }
      
      if (isDiverse) {
        diverseTemplates.push(candidate);
      }
      
      // Stop if we have enough diverse templates
      if (diverseTemplates.length >= this.config.suggestions.maxSuggestions * 2) {
        break;
      }
    }
    
    return diverseTemplates;
  }

  /**
   * Calculate similarity between two templates
   * @param {Object} template1 - First template
   * @param {Object} template2 - Second template
   * @returns {number} Similarity score (0-1)
   */
  calculateTemplateSimilarity(template1, template2) {
    // Check keyword overlap
    const keywords1 = new Set((template1.keywords || []).map(k => k.toLowerCase()));
    const keywords2 = new Set((template2.keywords || []).map(k => k.toLowerCase()));
    
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);
    
    const keywordSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    
    // Check vertical overlap
    const verticals1 = new Set((template1.verticals || []).map(v => v.toLowerCase()));
    const verticals2 = new Set((template2.verticals || []).map(v => v.toLowerCase()));
    
    const verticalIntersection = new Set([...verticals1].filter(v => verticals2.has(v)));
    const verticalUnion = new Set([...verticals1, ...verticals2]);
    
    const verticalSimilarity = verticalUnion.size > 0 ? verticalIntersection.size / verticalUnion.size : 0;
    
    // Check text similarity (simple word overlap)
    const textSimilarity = this.calculateTextSimilarity(template1.template, template2.template);
    
    // Weighted combination
    return (keywordSimilarity * 0.4) + (verticalSimilarity * 0.3) + (textSimilarity * 0.3);
  }

  /**
   * Calculate text similarity between two template texts
   * @param {string} text1 - First template text
   * @param {string} text2 - Second template text
   * @returns {number} Text similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Simple word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Replace placeholders in template text with dynamic content
   * @param {string} templateText - Template text with placeholders
   * @param {string} groupId - Facebook group ID
   * @returns {string} Text with placeholders replaced
   */
  replacePlaceholders(templateText, groupId) {
    if (!templateText) return '';
    
    let processedText = templateText;
    
    // Define placeholder replacements
    const placeholders = {
      '{site}': this.getSitePlaceholder(),
      '{url}': this.getUrlPlaceholder(),
      '{website}': this.getWebsitePlaceholder(),
      '{link}': this.getLinkPlaceholder(),
      '{contact}': this.getContactPlaceholder(),
      '{phone}': this.getPhonePlaceholder(),
      '{email}': this.getEmailPlaceholder(),
      '{location}': this.getLocationPlaceholder(),
      '{group}': this.getGroupPlaceholder(groupId),
      '{time}': this.getTimePlaceholder(),
      '{date}': this.getDatePlaceholder()
    };
    
    // Replace each placeholder
    for (const [placeholder, replacement] of Object.entries(placeholders)) {
      if (processedText.includes(placeholder)) {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        processedText = processedText.replace(regex, replacement);
      }
    }
    
    return processedText;
  }

  /**
   * Get site placeholder replacement
   * @returns {string} Site replacement text
   */
  getSitePlaceholder() {
    return 'our website';
  }

  /**
   * Get URL placeholder replacement
   * @returns {string} URL replacement text
   */
  getUrlPlaceholder() {
    return 'www.example.com';
  }

  /**
   * Get website placeholder replacement
   * @returns {string} Website replacement text
   */
  getWebsitePlaceholder() {
    return 'our website';
  }

  /**
   * Get link placeholder replacement
   * @returns {string} Link replacement text
   */
  getLinkPlaceholder() {
    return 'link in bio';
  }

  /**
   * Get contact placeholder replacement
   * @returns {string} Contact replacement text
   */
  getContactPlaceholder() {
    return 'DM us';
  }

  /**
   * Get phone placeholder replacement
   * @returns {string} Phone replacement text
   */
  getPhonePlaceholder() {
    return 'call us';
  }

  /**
   * Get email placeholder replacement
   * @returns {string} Email replacement text
   */
  getEmailPlaceholder() {
    return 'email us';
  }

  /**
   * Get location placeholder replacement
   * @returns {string} Location replacement text
   */
  getLocationPlaceholder() {
    return 'our location';
  }

  /**
   * Get group-specific placeholder replacement
   * @param {string} groupId - Facebook group ID
   * @returns {string} Group replacement text
   */
  getGroupPlaceholder(groupId) {
    return 'this group';
  }

  /**
   * Get time placeholder replacement
   * @returns {string} Time replacement text
   */
  getTimePlaceholder() {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 12) return 'this morning';
    if (hours < 17) return 'this afternoon';
    return 'this evening';
  }

  /**
   * Get date placeholder replacement
   * @returns {string} Date replacement text
   */
  getDatePlaceholder() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[now.getDay()];
  }

  /**
   * Calculate confidence score for a suggestion
   * @param {number} score - Template relevance score
   * @param {number} rank - Suggestion rank (0-based)
   * @param {number} totalSuggestions - Total number of suggestions
   * @returns {string} Confidence level
   */
  calculateConfidence(score, rank, totalSuggestions) {
    // Base confidence on score and rank
    let confidence = score;
    
    // Reduce confidence based on rank
    confidence *= (1 - (rank * 0.1));
    
    // Categorize confidence
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    if (confidence >= 0.4) return 'low';
    return 'very_low';
  }

  /**
   * Main method to get suggestions for a Facebook post
   * @param {string} postContent - Facebook post content
   * @param {string} groupId - Facebook group ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of suggestion objects
   */
  async getSuggestions(postContent, groupId, options = {}) {
    try {
      console.log('TemplateEngine: Getting suggestions for post content');
      
      // Step 1: Match templates based on keywords
      const matchedTemplates = await this.matchTemplates(postContent, groupId);
      
      if (matchedTemplates.length === 0) {
        console.log('TemplateEngine: No templates matched the post content');
        return [];
      }
      
      // Step 2: Apply rotation filtering
      const rotatedTemplates = await this.rotateTemplates(matchedTemplates, groupId);
      
      if (rotatedTemplates.length === 0) {
        console.log('TemplateEngine: All templates filtered out by rotation rules');
        return [];
      }
      
      // Step 3: Generate final suggestions
      const suggestions = await this.generateSuggestions(
        rotatedTemplates, 
        groupId, 
        options.maxSuggestions
      );
      
      console.log(`TemplateEngine: Generated ${suggestions.length} final suggestions`);
      
      return suggestions;
      
    } catch (error) {
      console.error('TemplateEngine: Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Update group history after template usage
   * @param {string} groupId - Facebook group ID
   * @param {string} templateId - Used template ID
   * @param {number} variantIndex - Used variant index
   * @param {string} groupName - Group name (optional)
   * @returns {Promise<void>}
   */
  async updateGroupHistory(groupId, templateId, variantIndex, groupName = null) {
    try {
      await this.storageManager.updateGroupHistory(groupId, templateId, variantIndex);
      
      // Also increment template usage count
      await this.storageManager.incrementTemplateUsage(templateId);
      
      console.log(`TemplateEngine: Updated group history for ${groupId}, template ${templateId}, variant ${variantIndex}`);
      
    } catch (error) {
      console.error('TemplateEngine: Error updating group history:', error);
    }
  }

  /**
   * Record suggestion usage for analytics and improvement
   * @param {Object} suggestion - Used suggestion object
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<void>}
   */
  async recordSuggestionUsage(suggestion, groupId) {
    try {
      // Update group history
      await this.updateGroupHistory(
        groupId, 
        suggestion.templateId, 
        suggestion.variantIndex
      );
      
      console.log(`TemplateEngine: Recorded usage of suggestion ${suggestion.id}`);
      
    } catch (error) {
      console.error('TemplateEngine: Error recording suggestion usage:', error);
    }
  }

  /**
   * Update scoring configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      scoring: {
        ...this.config.scoring,
        ...(newConfig.scoring || {})
      },
      suggestions: {
        ...this.config.suggestions,
        ...(newConfig.suggestions || {})
      }
    };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  // ===== AI-POWERED FEATURES (PRO ONLY) =====

  /**
   * Check if AI features are available
   * @returns {Promise<boolean>}
   */
  async hasAIAccess() {
    if (!this.licenseManager) return false;
    return await this.licenseManager.checkFeatureAccess('ai_integration');
  }

  /**
   * Rephrase a template using AI (Pro feature)
   * @param {string} templateId - Template ID to rephrase
   * @param {string} context - Context for rephrasing
   * @returns {Promise<Object>} Rephrasing result
   */
  async rephraseTemplate(templateId, context = '') {
    // Check license access
    const hasAccess = await this.hasAIAccess();
    if (!hasAccess) {
      throw new Error('AI rephrasing requires Pro license');
    }

    if (!this.aiService) {
      throw new Error('AI service not configured');
    }

    try {
      // Get template
      const template = await this.storageManager.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Use AI service to rephrase
      const rephrasedText = await this.aiService.rephraseComment(template.template, context);
      
      return {
        success: true,
        originalText: template.template,
        rephrasedText: rephrasedText,
        templateId: templateId
      };

    } catch (error) {
      console.error('TemplateEngine: AI rephrasing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate new templates using AI (Pro feature)
   * @param {string} nicheDescription - Description of the niche/business
   * @param {number} count - Number of templates to generate
   * @returns {Promise<Object>} Generation result
   */
  async generateTemplatesFromNiche(nicheDescription, count = 5) {
    // Check license access
    const hasAccess = await this.hasAIAccess();
    if (!hasAccess) {
      throw new Error('AI template generation requires Pro license');
    }

    if (!this.aiService) {
      throw new Error('AI service not configured');
    }

    try {
      // Use AI service to generate templates
      const generatedTemplates = await this.aiService.generateTemplates(nicheDescription, count);
      
      return {
        success: true,
        templates: generatedTemplates,
        niche: nicheDescription
      };

    } catch (error) {
      console.error('TemplateEngine: AI template generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enhance template matching using AI (Pro feature)
   * @param {string} postContent - Post content to analyze
   * @param {Array} templates - Templates to rank
   * @returns {Promise<Array>} AI-enhanced template rankings
   */
  async enhanceMatchingWithAI(postContent, templates) {
    // Check license access
    const hasAccess = await this.hasAIAccess();
    if (!hasAccess) {
      // Fall back to regular matching
      return templates;
    }

    if (!this.aiService) {
      // Fall back to regular matching
      return templates;
    }

    try {
      // Use AI to analyze post intent and rank templates
      const aiRankings = await this.aiService.rankTemplateRelevance(postContent, templates);
      
      // Merge AI rankings with existing scores
      return templates.map(template => {
        const aiRanking = aiRankings.find(r => r.templateId === template.id);
        if (aiRanking) {
          // Combine AI score with keyword-based score
          const combinedScore = (template.score * 0.7) + (aiRanking.score * 0.3);
          return {
            ...template,
            score: combinedScore,
            aiEnhanced: true,
            aiScore: aiRanking.score
          };
        }
        return template;
      });

    } catch (error) {
      console.error('TemplateEngine: AI enhancement failed, falling back to regular matching:', error);
      return templates;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateEngine;
} else {
  window.TemplateEngine = TemplateEngine;
}