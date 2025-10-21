/**
 * IndexedDB Manager for AdReply Extension
 * Handles template and group data storage with proper error handling and validation
 */

class IndexedDBManager {
  constructor() {
    this.dbName = 'AdReplyDB';
    this.dbVersion = 1;
    this.db = null;
    
    // Store names
    this.stores = {
      TEMPLATES: 'templates',
      GROUPS: 'groups'
    };
  }

  /**
   * Initialize IndexedDB connection and create object stores
   * @returns {Promise<IDBDatabase>}
   */
  async initialize() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create templates store
        if (!db.objectStoreNames.contains(this.stores.TEMPLATES)) {
          const templatesStore = db.createObjectStore(this.stores.TEMPLATES, { 
            keyPath: 'id' 
          });
          
          // Create indexes for efficient querying
          templatesStore.createIndex('verticals', 'verticals', { multiEntry: true });
          templatesStore.createIndex('keywords', 'keywords', { multiEntry: true });
          templatesStore.createIndex('createdAt', 'createdAt');
          templatesStore.createIndex('usageCount', 'usageCount');
        }

        // Create groups store
        if (!db.objectStoreNames.contains(this.stores.GROUPS)) {
          const groupsStore = db.createObjectStore(this.stores.GROUPS, { 
            keyPath: 'groupId' 
          });
          
          // Create indexes
          groupsStore.createIndex('lastUsedAt', 'lastUsedAt');
          groupsStore.createIndex('totalComments', 'totalComments');
        }
      };
    });
  }

  /**
   * Get a transaction for the specified stores
   * @param {string|string[]} storeNames - Store name(s)
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @returns {IDBTransaction}
   */
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return this.db.transaction(stores, mode);
  }

  /**
   * Execute a database operation with error handling
   * @param {Function} operation - Function that returns an IDBRequest
   * @returns {Promise<any>}
   */
  executeOperation(operation) {
    return new Promise((resolve, reject) => {
      try {
        const request = operation();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(new Error(`Database operation failed: ${request.error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // ===== TEMPLATE OPERATIONS =====

  /**
   * Save a template to IndexedDB
   * @param {Object} template - Template object to save
   * @returns {Promise<string>} - Template ID
   */
  async saveTemplate(template) {
    await this.initialize();
    
    // Validate template data
    this.validateTemplate(template);
    
    // Add timestamps
    const now = new Date().toISOString();
    const templateData = {
      ...template,
      createdAt: template.createdAt || now,
      updatedAt: now,
      usageCount: template.usageCount || 0
    };

    const transaction = this.getTransaction(this.stores.TEMPLATES, 'readwrite');
    const store = transaction.objectStore(this.stores.TEMPLATES);
    
    return this.executeOperation(() => store.put(templateData));
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object|null>}
   */
  async getTemplate(templateId) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.TEMPLATES);
    const store = transaction.objectStore(this.stores.TEMPLATES);
    
    return this.executeOperation(() => store.get(templateId));
  }

  /**
   * Get all templates with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getTemplates(filters = {}) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.TEMPLATES);
    const store = transaction.objectStore(this.stores.TEMPLATES);
    
    let request;
    
    if (filters.vertical) {
      const index = store.index('verticals');
      request = index.getAll(filters.vertical);
    } else if (filters.keyword) {
      const index = store.index('keywords');
      request = index.getAll(filters.keyword);
    } else {
      request = store.getAll();
    }
    
    const templates = await this.executeOperation(() => request);
    
    // Apply additional filters
    return templates.filter(template => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return template.label.toLowerCase().includes(searchTerm) ||
               template.template.toLowerCase().includes(searchTerm) ||
               template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
      }
      return true;
    });
  }

  /**
   * Update template usage count
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async incrementTemplateUsage(templateId) {
    await this.initialize();
    
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    template.usageCount = (template.usageCount || 0) + 1;
    template.updatedAt = new Date().toISOString();
    
    return this.saveTemplate(template);
  }

  /**
   * Delete template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.TEMPLATES, 'readwrite');
    const store = transaction.objectStore(this.stores.TEMPLATES);
    
    return this.executeOperation(() => store.delete(templateId));
  }

  // ===== GROUP OPERATIONS =====

  /**
   * Update group history with template usage
   * @param {string} groupId - Facebook group ID
   * @param {string} templateId - Template ID used
   * @param {number} variantIndex - Variant index used
   * @returns {Promise<void>}
   */
  async updateGroupHistory(groupId, templateId, variantIndex) {
    await this.initialize();
    
    // Get existing group data or create new
    let groupData = await this.getGroupHistory(groupId);
    
    if (!groupData) {
      groupData = {
        groupId,
        name: this.extractGroupName(groupId),
        totalComments: 0
      };
    }
    
    // Update group data
    groupData.lastTemplateId = templateId;
    groupData.lastVariantIndex = variantIndex;
    groupData.lastUsedAt = new Date().toISOString();
    groupData.totalComments = (groupData.totalComments || 0) + 1;
    
    const transaction = this.getTransaction(this.stores.GROUPS, 'readwrite');
    const store = transaction.objectStore(this.stores.GROUPS);
    
    return this.executeOperation(() => store.put(groupData));
  }

  /**
   * Get group history by group ID
   * @param {string} groupId - Facebook group ID
   * @returns {Promise<Object|null>}
   */
  async getGroupHistory(groupId) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.GROUPS);
    const store = transaction.objectStore(this.stores.GROUPS);
    
    return this.executeOperation(() => store.get(groupId));
  }

  /**
   * Get all group histories
   * @returns {Promise<Array>}
   */
  async getAllGroupHistories() {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.GROUPS);
    const store = transaction.objectStore(this.stores.GROUPS);
    
    return this.executeOperation(() => store.getAll());
  }

  // ===== UTILITY METHODS =====

  /**
   * Validate template data structure
   * @param {Object} template - Template to validate
   * @throws {Error} If validation fails
   */
  validateTemplate(template) {
    if (!template || typeof template !== 'object') {
      throw new Error('Template must be an object');
    }
    
    if (!template.id || typeof template.id !== 'string') {
      throw new Error('Template must have a valid ID');
    }
    
    if (!template.label || typeof template.label !== 'string') {
      throw new Error('Template must have a valid label');
    }
    
    if (!template.template || typeof template.template !== 'string') {
      throw new Error('Template must have valid template content');
    }
    
    if (!Array.isArray(template.verticals)) {
      throw new Error('Template verticals must be an array');
    }
    
    if (!Array.isArray(template.keywords)) {
      throw new Error('Template keywords must be an array');
    }
    
    if (template.variants && !Array.isArray(template.variants)) {
      throw new Error('Template variants must be an array');
    }
    
    // Sanitize string fields
    template.label = this.sanitizeString(template.label);
    template.template = this.sanitizeString(template.template);
    template.verticals = template.verticals.map(v => this.sanitizeString(v));
    template.keywords = template.keywords.map(k => this.sanitizeString(k));
    
    if (template.variants) {
      template.variants = template.variants.map(v => this.sanitizeString(v));
    }
  }

  /**
   * Sanitize string input to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Extract group name from group ID/URL
   * @param {string} groupId - Group ID or URL
   * @returns {string} Extracted group name
   */
  extractGroupName(groupId) {
    // Extract group name from URL if possible
    const match = groupId.match(/groups\/([^\/]+)/);
    return match ? match[1] : groupId;
  }

  /**
   * Clear all data (for testing/reset purposes)
   * @returns {Promise<void>}
   */
  async clearAllData() {
    await this.initialize();
    
    const transaction = this.getTransaction([this.stores.TEMPLATES, this.stores.GROUPS], 'readwrite');
    
    const templatesStore = transaction.objectStore(this.stores.TEMPLATES);
    const groupsStore = transaction.objectStore(this.stores.GROUPS);
    
    await Promise.all([
      this.executeOperation(() => templatesStore.clear()),
      this.executeOperation(() => groupsStore.clear())
    ]);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexedDBManager;
} else {
  window.IndexedDBManager = IndexedDBManager;
}