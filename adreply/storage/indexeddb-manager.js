/**
 * IndexedDB Manager for AdReply Extension
 * Handles template and group data storage with proper error handling and validation
 */

class IndexedDBManager {
  constructor() {
    this.dbName = 'AdReplyDB';
    this.dbVersion = 2; // Updated version for categories support
    this.db = null;
    
    // Store names
    this.stores = {
      TEMPLATES: 'templates',
      GROUPS: 'groups',
      CATEGORIES: 'categories'
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
        const oldVersion = event.oldVersion;
        
        // Create templates store
        if (!db.objectStoreNames.contains(this.stores.TEMPLATES)) {
          const templatesStore = db.createObjectStore(this.stores.TEMPLATES, { 
            keyPath: 'id' 
          });
          
          // Create indexes for efficient querying
          templatesStore.createIndex('category', 'category');
          templatesStore.createIndex('keywords', 'keywords', { multiEntry: true });
          templatesStore.createIndex('createdAt', 'createdAt');
          templatesStore.createIndex('usageCount', 'usageCount');
          templatesStore.createIndex('isPrebuilt', 'isPrebuilt');
        } else if (oldVersion < 2) {
          // Update existing templates store for v2
          const transaction = event.target.transaction;
          const templatesStore = transaction.objectStore(this.stores.TEMPLATES);
          
          // Add new indexes if they don't exist
          if (!templatesStore.indexNames.contains('category')) {
            templatesStore.createIndex('category', 'category');
          }
          if (!templatesStore.indexNames.contains('isPrebuilt')) {
            templatesStore.createIndex('isPrebuilt', 'isPrebuilt');
          }
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

        // Create categories store (v2)
        if (!db.objectStoreNames.contains(this.stores.CATEGORIES)) {
          const categoriesStore = db.createObjectStore(this.stores.CATEGORIES, { 
            keyPath: 'id' 
          });
          
          // Create indexes
          categoriesStore.createIndex('name', 'name');
          categoriesStore.createIndex('isPrebuilt', 'isPrebuilt');
          categoriesStore.createIndex('createdAt', 'createdAt');
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
    
    if (filters.category) {
      const index = store.index('category');
      request = index.getAll(filters.category);
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
      
      if (filters.isPrebuilt !== undefined) {
        return template.isPrebuilt === filters.isPrebuilt;
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

  /**
   * Save multiple templates at once
   * @param {Array} templates - Array of template objects
   * @returns {Promise<void>}
   */
  async saveTemplates(templates) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.TEMPLATES, 'readwrite');
    const store = transaction.objectStore(this.stores.TEMPLATES);
    
    const promises = templates.map(template => {
      this.validateTemplate(template);
      const now = new Date().toISOString();
      const templateData = {
        ...template,
        createdAt: template.createdAt || now,
        updatedAt: now,
        usageCount: template.usageCount || 0
      };
      return this.executeOperation(() => store.put(templateData));
    });
    
    await Promise.all(promises);
  }

  // ===== CATEGORY OPERATIONS =====

  /**
   * Save a category to IndexedDB
   * @param {Object} category - Category object to save
   * @returns {Promise<string>} - Category ID
   */
  async saveCategory(category) {
    await this.initialize();
    
    // Validate category data
    this.validateCategory(category);
    
    // Add timestamps
    const now = new Date().toISOString();
    const categoryData = {
      ...category,
      createdAt: category.createdAt || now
    };

    const transaction = this.getTransaction(this.stores.CATEGORIES, 'readwrite');
    const store = transaction.objectStore(this.stores.CATEGORIES);
    
    return this.executeOperation(() => store.put(categoryData));
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>}
   */
  async getCategory(categoryId) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.CATEGORIES);
    const store = transaction.objectStore(this.stores.CATEGORIES);
    
    return this.executeOperation(() => store.get(categoryId));
  }

  /**
   * Get all categories
   * @returns {Promise<Array>}
   */
  async getCategories() {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.CATEGORIES);
    const store = transaction.objectStore(this.stores.CATEGORIES);
    
    return this.executeOperation(() => store.getAll());
  }

  /**
   * Delete category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.CATEGORIES, 'readwrite');
    const store = transaction.objectStore(this.stores.CATEGORIES);
    
    return this.executeOperation(() => store.delete(categoryId));
  }

  /**
   * Save multiple categories at once
   * @param {Array} categories - Array of category objects
   * @returns {Promise<void>}
   */
  async saveCategories(categories) {
    await this.initialize();
    
    const transaction = this.getTransaction(this.stores.CATEGORIES, 'readwrite');
    const store = transaction.objectStore(this.stores.CATEGORIES);
    
    const promises = categories.map(category => {
      this.validateCategory(category);
      const now = new Date().toISOString();
      const categoryData = {
        ...category,
        createdAt: category.createdAt || now
      };
      return this.executeOperation(() => store.put(categoryData));
    });
    
    await Promise.all(promises);
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
    
    if (!template.category || typeof template.category !== 'string') {
      throw new Error('Template must have a valid category');
    }
    
    if (!Array.isArray(template.keywords)) {
      throw new Error('Template keywords must be an array');
    }
    
    if (template.isPrebuilt !== undefined && typeof template.isPrebuilt !== 'boolean') {
      throw new Error('Template isPrebuilt must be a boolean');
    }
    
    // Sanitize string fields
    template.label = this.sanitizeString(template.label);
    template.template = this.sanitizeString(template.template);
    template.category = this.sanitizeString(template.category);
    template.keywords = template.keywords.map(k => this.sanitizeString(k));
  }

  /**
   * Validate category data structure
   * @param {Object} category - Category to validate
   * @throws {Error} If validation fails
   */
  validateCategory(category) {
    if (!category || typeof category !== 'object') {
      throw new Error('Category must be an object');
    }
    
    if (!category.id || typeof category.id !== 'string') {
      throw new Error('Category must have a valid ID');
    }
    
    if (!category.name || typeof category.name !== 'string') {
      throw new Error('Category must have a valid name');
    }
    
    if (category.description !== undefined && typeof category.description !== 'string') {
      throw new Error('Category description must be a string');
    }
    
    if (category.isPrebuilt !== undefined && typeof category.isPrebuilt !== 'boolean') {
      throw new Error('Category isPrebuilt must be a boolean');
    }
    
    if (category.templateCount !== undefined && typeof category.templateCount !== 'number') {
      throw new Error('Category templateCount must be a number');
    }
    
    // Sanitize string fields
    category.id = this.sanitizeString(category.id);
    category.name = this.sanitizeString(category.name);
    if (category.description) {
      category.description = this.sanitizeString(category.description);
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
    
    const transaction = this.getTransaction([this.stores.TEMPLATES, this.stores.GROUPS, this.stores.CATEGORIES], 'readwrite');
    
    const templatesStore = transaction.objectStore(this.stores.TEMPLATES);
    const groupsStore = transaction.objectStore(this.stores.GROUPS);
    const categoriesStore = transaction.objectStore(this.stores.CATEGORIES);
    
    await Promise.all([
      this.executeOperation(() => templatesStore.clear()),
      this.executeOperation(() => groupsStore.clear()),
      this.executeOperation(() => categoriesStore.clear())
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