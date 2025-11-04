/**
 * Template Database Manager
 * Handles initialization and management of the pre-built template database
 */

/**
 * Template Database Manager Class
 * Manages the pre-built template database with 400+ templates across 20+ categories
 */
class TemplateDatabaseManager {
  constructor(storageManager, categoryManager) {
    this.storageManager = storageManager;
    this.categoryManager = categoryManager;
    this.initialized = false;
  }

  /**
   * Initialize the template database with pre-built templates
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      console.log('Initializing template database...');

      // First ensure categories are initialized
      await this.categoryManager.initialize();

      // Check if pre-built templates already exist
      const existingTemplates = await this.getPrebuiltTemplates();
      if (existingTemplates.length > 0) {
        console.log(`Found ${existingTemplates.length} existing pre-built templates`);
        this.initialized = true;
        return true;
      }

      // Load and install pre-built templates
      const success = await this.installPrebuiltTemplates();
      
      if (success) {
        this.initialized = true;
        console.log('Template database initialized successfully');
      }

      return success;
    } catch (error) {
      console.error('Failed to initialize template database:', error);
      return false;
    }
  }

  /**
   * Install all pre-built templates
   * @returns {Promise<boolean>} Success status
   */
  async installPrebuiltTemplates() {
    try {
      // Load pre-built templates
      const prebuiltTemplates = this.loadPrebuiltTemplates();
      const allTemplates = this.flattenTemplates(prebuiltTemplates);

      console.log(`Installing ${allTemplates.length} pre-built templates...`);

      // Get existing templates to avoid duplicates
      const existingData = await this.storageManager.getAllData();
      const existingTemplates = existingData.templates || [];
      
      // Filter out templates that already exist
      const newTemplates = allTemplates.filter(template => 
        !existingTemplates.find(existing => existing.id === template.id)
      );

      if (newTemplates.length === 0) {
        console.log('All pre-built templates already exist');
        return true;
      }

      // Add timestamps to new templates
      const timestampedTemplates = newTemplates.map(template => ({
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      }));

      // Save templates
      const allTemplatesWithNew = [...existingTemplates, ...timestampedTemplates];
      await this.storageManager.saveData({ templates: allTemplatesWithNew });

      // Update category template counts
      await this.updateCategoryTemplateCounts(prebuiltTemplates);

      console.log(`Successfully installed ${newTemplates.length} new pre-built templates`);
      return true;
    } catch (error) {
      console.error('Failed to install pre-built templates:', error);
      return false;
    }
  }

  /**
   * Load pre-built templates from the template files
   * @returns {Object} Pre-built templates organized by category
   */
  loadPrebuiltTemplates() {
    try {
      // Try to load from browser environment
      if (typeof window !== 'undefined' && window.PrebuiltTemplates) {
        return window.PrebuiltTemplates.getPrebuiltTemplates();
      }
      
      // Try to load from Node.js environment
      if (typeof require !== 'undefined') {
        const prebuiltTemplates = require('./prebuilt-templates');
        return prebuiltTemplates.getPrebuiltTemplates();
      }

      console.warn('Could not load pre-built templates - no environment detected');
      return {};
    } catch (error) {
      console.error('Error loading pre-built templates:', error);
      return {};
    }
  }

  /**
   * Flatten templates from category-organized structure to flat array
   * @param {Object} templatesByCategory - Templates organized by category
   * @returns {Array} Flat array of all templates
   */
  flattenTemplates(templatesByCategory) {
    const flatArray = [];
    
    Object.entries(templatesByCategory).forEach(([categoryId, templates]) => {
      if (Array.isArray(templates)) {
        templates.forEach(template => {
          flatArray.push({
            ...template,
            category: categoryId // Ensure category is set correctly
          });
        });
      }
    });
    
    return flatArray;
  }

  /**
   * Update template counts for all categories
   * @param {Object} templatesByCategory - Templates organized by category
   * @returns {Promise<void>}
   */
  async updateCategoryTemplateCounts(templatesByCategory) {
    try {
      for (const [categoryId, templates] of Object.entries(templatesByCategory)) {
        if (Array.isArray(templates)) {
          await this.categoryManager.updateTemplateCount(categoryId, templates.length);
        }
      }
    } catch (error) {
      console.error('Failed to update category template counts:', error);
    }
  }

  /**
   * Get all pre-built templates
   * @returns {Promise<Array>} Array of pre-built templates
   */
  async getPrebuiltTemplates() {
    try {
      const data = await this.storageManager.getAllData();
      const templates = data.templates || [];
      return templates.filter(template => template.isPrebuilt === true);
    } catch (error) {
      console.error('Failed to get pre-built templates:', error);
      return [];
    }
  }

  /**
   * Get templates by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Array of templates in the category
   */
  async getTemplatesByCategory(categoryId) {
    try {
      const data = await this.storageManager.getAllData();
      const templates = data.templates || [];
      return templates.filter(template => template.category === categoryId);
    } catch (error) {
      console.error('Failed to get templates by category:', error);
      return [];
    }
  }

  /**
   * Get template statistics
   * @returns {Promise<Object>} Template statistics
   */
  async getTemplateStats() {
    try {
      const data = await this.storageManager.getAllData();
      const templates = data.templates || [];
      const categories = data.categories || [];

      const prebuiltTemplates = templates.filter(t => t.isPrebuilt === true);
      const customTemplates = templates.filter(t => t.isPrebuilt !== true);

      const statsByCategory = {};
      categories.forEach(category => {
        const categoryTemplates = templates.filter(t => t.category === category.id);
        statsByCategory[category.id] = {
          name: category.name,
          total: categoryTemplates.length,
          prebuilt: categoryTemplates.filter(t => t.isPrebuilt === true).length,
          custom: categoryTemplates.filter(t => t.isPrebuilt !== true).length
        };
      });

      return {
        totalTemplates: templates.length,
        prebuiltTemplates: prebuiltTemplates.length,
        customTemplates: customTemplates.length,
        totalCategories: categories.length,
        categoriesWithTemplates: Object.keys(statsByCategory).filter(
          catId => statsByCategory[catId].total > 0
        ).length,
        byCategory: statsByCategory
      };
    } catch (error) {
      console.error('Failed to get template stats:', error);
      return {
        totalTemplates: 0,
        prebuiltTemplates: 0,
        customTemplates: 0,
        totalCategories: 0,
        categoriesWithTemplates: 0,
        byCategory: {}
      };
    }
  }

  /**
   * Validate template database integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateDatabase() {
    try {
      const data = await this.storageManager.getAllData();
      const templates = data.templates || [];
      const categories = data.categories || [];

      const issues = [];
      const categoryIds = new Set(categories.map(c => c.id));

      // Check for templates with invalid categories
      templates.forEach(template => {
        if (!categoryIds.has(template.category)) {
          issues.push(`Template ${template.id} has invalid category: ${template.category}`);
        }
      });

      // Check for duplicate template IDs
      const templateIds = new Set();
      templates.forEach(template => {
        if (templateIds.has(template.id)) {
          issues.push(`Duplicate template ID found: ${template.id}`);
        }
        templateIds.add(template.id);
      });

      // Check category template counts
      for (const category of categories) {
        const actualCount = templates.filter(t => t.category === category.id).length;
        if (category.templateCount !== actualCount) {
          issues.push(`Category ${category.id} count mismatch: expected ${category.templateCount}, actual ${actualCount}`);
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        totalTemplates: templates.length,
        totalCategories: categories.length
      };
    } catch (error) {
      console.error('Failed to validate database:', error);
      return {
        isValid: false,
        issues: ['Database validation failed: ' + error.message],
        totalTemplates: 0,
        totalCategories: 0
      };
    }
  }

  /**
   * Reset template database (remove all templates and reinitialize)
   * @returns {Promise<boolean>} Success status
   */
  async resetDatabase() {
    try {
      console.log('Resetting template database...');
      
      // Clear all templates
      await this.storageManager.saveData({ templates: [] });
      
      // Reset initialization flag
      this.initialized = false;
      
      // Reinitialize
      const success = await this.initialize();
      
      if (success) {
        console.log('Template database reset and reinitialized successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to reset template database:', error);
      return false;
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TemplateDatabaseManager };
} else {
  window.TemplateDatabaseManager = TemplateDatabaseManager;
}