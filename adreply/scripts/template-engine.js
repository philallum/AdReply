/**
 * Template Engine for AdReply Extension
 * Handles template matching, scoring, rotation, and suggestion generation
 */

class TemplateEngine {
  constructor(storageManager, aiService = null, licenseManager = null, usageTracker = null) {
    this.storageManager = storageManager;
    this.aiService = aiService;
    this.licenseManager = licenseManager;
    this.usageTracker = usageTracker;
    
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
   * Supports negative keywords (prefixed with '-') that exclude templates when matched
   * 
   * @param {Object} template - Template object with keywords array
   * @param {Object} extractedData - Extracted keywords and metadata from post
   * @returns {number} Relevance score (0-1), or 0 if negative keywords match
   * 
   * @example
   * // Template with negative keywords
   * template.keywords = ['car', 'service', '-cheap', '-diy']
   * // This template will be excluded if post contains 'cheap' or 'diy'
   * 
   * // Positive keywords increase score, negative keywords exclude completely
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
    
    // Check for negative keywords first - if any match, exclude template completely
    for (const templateKeyword of templateKeywords) {
      const keywordLower = templateKeyword.toLowerCase().trim();
      
      if (keywordLower.startsWith('-')) {
        const negativeKeyword = keywordLower.substring(1);
        if (!negativeKeyword) continue;
        
        // Check if negative keyword is present in post
        const hasNegativeMatch = postKeywords.some(postKeyword => {
          const postKeywordLower = postKeyword.toLowerCase();
          return postKeywordLower === negativeKeyword || 
                 postKeywordLower.includes(negativeKeyword) || 
                 negativeKeyword.includes(postKeywordLower);
        });
        
        if (hasNegativeMatch) {
          // Negative keyword found - exclude this template completely
          return 0;
        }
      }
    }
    
    // Calculate positive keyword matches
    for (const templateKeyword of templateKeywords) {
      const keywordLower = templateKeyword.toLowerCase().trim();
      
      // Skip negative keywords (already processed above)
      if (keywordLower.startsWith('-')) {
        continue;
      }
      
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
   * @param {string} userCategory - User's preferred category (optional)
   * @returns {Promise<Array>} Array of scored template matches
   */
  async matchTemplates(postContent, groupId, userCategory = null) {
    try {
      // Extract keywords from post content
      const extractedData = this.extractKeywords(postContent);
      
      if (extractedData.keywords.length === 0) {
        console.log('TemplateEngine: No keywords extracted from post content');
        return [];
      }
      
      // Get user's preferred category if not provided
      if (!userCategory) {
        userCategory = await this.getUserPreferredCategory();
      }
      
      // Get all templates from storage
      const templates = await this.storageManager.getTemplates();
      
      if (templates.length === 0) {
        console.log('TemplateEngine: No templates found in storage');
        return [];
      }
      
      // Score each template with category prioritization
      const scoredTemplates = templates.map(template => {
        const baseScore = this.calculateTemplateScore(template, extractedData);
        const categoryScore = this.calculateCategoryPriorityScore(template, userCategory);
        const finalScore = this.combineScores(baseScore, categoryScore);
        
        return {
          template,
          score: finalScore,
          baseScore,
          categoryScore,
          matchedKeywords: this.getMatchedKeywords(template, extractedData),
          extractedData: extractedData,
          isPreferredCategory: template.category === userCategory
        };
      });
      
      // Filter out low-scoring templates
      const filteredTemplates = scoredTemplates.filter(item => 
        item.score >= this.config.scoring.minScore
      );
      
      // Sort by score (highest first), with preferred category templates prioritized
      filteredTemplates.sort((a, b) => {
        // First prioritize by preferred category
        if (a.isPreferredCategory && !b.isPreferredCategory) return -1;
        if (!a.isPreferredCategory && b.isPreferredCategory) return 1;
        
        // Then by score
        return b.score - a.score;
      });
      
      console.log(`TemplateEngine: Matched ${filteredTemplates.length} templates for post with ${extractedData.keywords.length} keywords (preferred category: ${userCategory || 'none'})`);
      
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
   * Apply enhanced anti-spam rotation logic to template matches
   * @param {Array} scoredTemplates - Array of scored template matches
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Array>} Filtered templates with rotation applied
   */
  async rotateTemplates(scoredTemplates, groupId) {
    try {
      if (!scoredTemplates || scoredTemplates.length === 0) {
        return [];
      }

      // Initialize usage tracker if not available
      if (!this.usageTracker) {
        // Try to get usage tracker from global scope or create a simple one
        this.usageTracker = window.UsageTracker ? new window.UsageTracker() : null;
      }

      let filteredTemplates = scoredTemplates;

      if (this.usageTracker) {
        // Get recently used templates for this group (24-hour cooldown)
        const recentlyUsedTemplateIds = await this.usageTracker.getRecentlyUsedTemplates(groupId, 24);
        
        // Filter out recently used templates
        filteredTemplates = scoredTemplates.filter(item => 
          !recentlyUsedTemplateIds.includes(item.template.id)
        );

        console.log(`TemplateEngine: Filtered out ${recentlyUsedTemplateIds.length} recently used templates`);
      } else {
        // Fallback to old rotation system if usage tracker not available
        const groupHistory = await this.storageManager.getGroupHistory(groupId);
        filteredTemplates = this.applyRotationFilter(scoredTemplates, groupHistory);
      }
      
      console.log(`TemplateEngine: Applied enhanced rotation filter, ${filteredTemplates.length} templates remain`);
      
      return filteredTemplates;
      
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
   * Generate top suggestions from matched and rotated templates with enhanced algorithm
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

      // Apply enhanced suggestion algorithm with cross-category fallback
      const enhancedTemplates = await this.applyEnhancedSuggestionAlgorithm(rotatedTemplates, groupId);

      if (enhancedTemplates.length === 0) {
        console.log('TemplateEngine: No templates available after enhanced filtering');
        return [];
      }

      // Apply diversity filtering to avoid similar suggestions
      const diverseTemplates = this.applyDiversityFilter(enhancedTemplates);
      
      // Select top suggestions
      const topTemplates = diverseTemplates.slice(0, maxCount);
      
      // Generate suggestion objects with individual templates (no variants)
      const suggestions = await Promise.all(
        topTemplates.map(async (item, index) => {
          const processedText = await this.replacePlaceholders(item.template.template, groupId);
          
          return {
            id: `suggestion_${item.template.id}_${Date.now()}_${index}`,
            templateId: item.template.id,
            template: item.template,
            text: processedText,
            originalText: item.template.template,
            score: item.score,
            baseScore: item.baseScore,
            categoryScore: item.categoryScore,
            matchedKeywords: item.matchedKeywords,
            isPreferredCategory: item.isPreferredCategory,
            rank: index + 1,
            confidence: this.calculateConfidence(item.score, index, topTemplates.length),
            metadata: {
              extractedData: item.extractedData,
              processingTime: Date.now(),
              fallbackUsed: item.fallbackUsed || false
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
   * Apply enhanced suggestion algorithm with category prioritization and cross-category fallback
   * @param {Array} templates - Array of scored template matches
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Array>} Enhanced and filtered templates
   */
  async applyEnhancedSuggestionAlgorithm(templates, groupId) {
    try {
      // Step 1: Filter by minimum relevance score
      const relevantTemplates = templates.filter(item => 
        item.score >= this.config.suggestions.minRelevanceScore
      );

      if (relevantTemplates.length === 0) {
        console.log('TemplateEngine: No templates meet minimum relevance threshold');
        return [];
      }

      // Step 2: Prioritize unused templates from user's preferred category
      const preferredCategoryTemplates = relevantTemplates.filter(item => item.isPreferredCategory);
      const otherCategoryTemplates = relevantTemplates.filter(item => !item.isPreferredCategory);

      // Step 3: Check if we have enough templates from preferred category
      const maxSuggestions = this.config.suggestions.maxSuggestions;
      let finalTemplates = [];

      if (preferredCategoryTemplates.length >= maxSuggestions) {
        // Enough templates from preferred category
        finalTemplates = preferredCategoryTemplates.slice(0, maxSuggestions * 2); // Get extra for diversity filtering
        console.log(`TemplateEngine: Using ${finalTemplates.length} templates from preferred category`);
      } else {
        // Need cross-category fallback
        finalTemplates = [...preferredCategoryTemplates];
        
        // Add templates from other categories to fill the gap
        const needed = (maxSuggestions * 2) - preferredCategoryTemplates.length;
        const fallbackTemplates = otherCategoryTemplates.slice(0, needed).map(item => ({
          ...item,
          fallbackUsed: true
        }));
        
        finalTemplates = [...finalTemplates, ...fallbackTemplates];
        
        console.log(`TemplateEngine: Using ${preferredCategoryTemplates.length} preferred + ${fallbackTemplates.length} fallback templates`);
      }

      // Step 4: Sort by combined score (category + relevance)
      finalTemplates.sort((a, b) => {
        // Preferred category templates first
        if (a.isPreferredCategory && !b.isPreferredCategory) return -1;
        if (!a.isPreferredCategory && b.isPreferredCategory) return 1;
        
        // Then by score
        return b.score - a.score;
      });

      return finalTemplates;

    } catch (error) {
      console.error('TemplateEngine: Error in enhanced suggestion algorithm:', error);
      return templates; // Return original on error
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
   * Get user's preferred category from storage
   * @returns {Promise<string|null>} User's preferred category ID or null
   */
  async getUserPreferredCategory() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        return settings.templates?.preferredCategory || null;
      }
      return null;
    } catch (error) {
      console.error('TemplateEngine: Error getting user preferred category:', error);
      return null;
    }
  }

  /**
   * Calculate category priority score for a template
   * @param {Object} template - Template object
   * @param {string|null} userCategory - User's preferred category
   * @returns {number} Category priority score (0-1)
   */
  calculateCategoryPriorityScore(template, userCategory) {
    if (!userCategory || !template.category) {
      return 0; // No category preference or template has no category
    }
    
    // Exact category match gets full priority
    if (template.category === userCategory) {
      return 1.0;
    }
    
    // Related categories get partial priority
    const relatedScore = this.calculateCategoryRelationScore(template.category, userCategory);
    return relatedScore * 0.3; // 30% of full priority for related categories
  }

  /**
   * Calculate relationship score between two categories
   * @param {string} templateCategory - Template's category
   * @param {string} userCategory - User's preferred category
   * @returns {number} Relationship score (0-1)
   */
  calculateCategoryRelationScore(templateCategory, userCategory) {
    // Define category relationships (categories that are somewhat related)
    const categoryRelations = {
      'automotive': ['transportation', 'construction'],
      'fitness': ['healthcare', 'beauty'],
      'food': ['retail', 'events'],
      'home-services': ['construction', 'real-estate'],
      'beauty': ['fitness', 'healthcare'],
      'real-estate': ['home-services', 'construction', 'financial'],
      'technology': ['professional', 'education'],
      'education': ['technology', 'professional'],
      'financial': ['real-estate', 'professional', 'legal'],
      'legal': ['financial', 'professional'],
      'pet-services': ['healthcare', 'home-services'],
      'events': ['food', 'entertainment', 'photography'],
      'photography': ['events', 'entertainment'],
      'crafts': ['retail', 'events'],
      'construction': ['home-services', 'real-estate', 'automotive'],
      'transportation': ['automotive', 'construction'],
      'entertainment': ['events', 'photography'],
      'retail': ['crafts', 'food'],
      'professional': ['technology', 'education', 'financial', 'legal'],
      'healthcare': ['fitness', 'beauty', 'pet-services']
    };
    
    const relations = categoryRelations[userCategory] || [];
    return relations.includes(templateCategory) ? 1.0 : 0.0;
  }

  /**
   * Combine base score with category priority score
   * @param {number} baseScore - Base template relevance score
   * @param {number} categoryScore - Category priority score
   * @returns {number} Combined final score
   */
  combineScores(baseScore, categoryScore) {
    // If no category preference, return base score
    if (categoryScore === 0) {
      return baseScore;
    }
    
    // Combine scores with weighted approach
    // Category preference adds a significant boost but doesn't override relevance completely
    const categoryWeight = 0.4; // 40% weight for category preference
    const baseWeight = 0.6; // 60% weight for keyword relevance
    
    return (baseScore * baseWeight) + (categoryScore * categoryWeight);
  }

  /**
   * Replace placeholders in template text with dynamic content
   * @param {string} templateText - Template text with placeholders
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<string>} Text with placeholders replaced
   */
  async replacePlaceholders(templateText, groupId) {
    if (!templateText) return '';
    
    let processedText = templateText;
    
    // Define placeholder replacements (async ones need to be awaited)
    const asyncPlaceholders = {
      '{url}': await this.getUrlPlaceholder()
    };
    
    const syncPlaceholders = {
      '{site}': this.getSitePlaceholder(),
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
    
    // Combine all placeholders
    const allPlaceholders = { ...asyncPlaceholders, ...syncPlaceholders };
    
    // Replace each placeholder
    for (const [placeholder, replacement] of Object.entries(allPlaceholders)) {
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
   * @returns {Promise<string>} URL replacement text
   */
  async getUrlPlaceholder() {
    try {
      // Try to get user's promotional URL from storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['defaultPromoUrl']);
        if (result.defaultPromoUrl && result.defaultPromoUrl.trim()) {
          return result.defaultPromoUrl.trim();
        }
      }
      
      // Fallback to generic placeholder
      return 'www.example.com';
    } catch (error) {
      console.error('TemplateEngine: Error getting promotional URL:', error);
      return 'www.example.com';
    }
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
      
      // Step 1: Match templates based on keywords with category prioritization
      const matchedTemplates = await this.matchTemplates(postContent, groupId, options.userCategory);
      
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
   * @param {string} postContent - Original post content (optional)
   * @returns {Promise<void>}
   */
  async recordSuggestionUsage(suggestion, groupId, postContent = '') {
    try {
      // Record usage with new individual template tracking
      if (this.usageTracker) {
        await this.usageTracker.recordUsage(
          suggestion.templateId,
          groupId,
          postContent,
          {
            suggestionId: suggestion.id,
            score: suggestion.score,
            rank: suggestion.rank,
            confidence: suggestion.confidence,
            isPreferredCategory: suggestion.isPreferredCategory,
            fallbackUsed: suggestion.metadata?.fallbackUsed || false
          }
        );
      }

      // Also update legacy group history for backward compatibility
      await this.updateGroupHistory(
        groupId, 
        suggestion.templateId, 
        0 // No variant index for individual templates
      );
      
      console.log(`TemplateEngine: Recorded usage of template ${suggestion.templateId} in group ${groupId}`);
      
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