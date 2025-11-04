/**
 * Category Management System
 * Handles category operations and pre-built category definitions
 */

/**
 * Category Manager Class
 * Provides methods for managing template categories
 */
class CategoryManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.prebuiltCategories = this.getPrebuiltCategories();
  }

  /**
   * Initialize category system with pre-built categories
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const existingCategories = await this.getAllCategories();
      
      // Add pre-built categories if they don't exist
      for (const category of this.prebuiltCategories) {
        const exists = existingCategories.find(c => c.id === category.id);
        if (!exists) {
          await this.addCategory(category);
        }
      }
    } catch (error) {
      console.error('Failed to initialize categories:', error);
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const data = await this.storageManager.getAllData();
      return data.categories || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  async getCategoryById(categoryId) {
    try {
      const categories = await this.getAllCategories();
      return categories.find(c => c.id === categoryId) || null;
    } catch (error) {
      console.error('Failed to get category:', error);
      return null;
    }
  }

  /**
   * Add new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<boolean>} Success status
   */
  async addCategory(categoryData) {
    try {
      const category = new (window.AdReplyModels || require('./data-models')).Category(categoryData);
      const validation = category.validate();
      
      if (!validation.isValid) {
        console.error('Category validation failed:', validation.errors);
        return false;
      }

      const categories = await this.getAllCategories();
      
      // Check for duplicate ID
      if (categories.find(c => c.id === category.id)) {
        console.error('Category with this ID already exists');
        return false;
      }

      categories.push(category.sanitize().toObject());
      await this.storageManager.saveData({ categories });
      
      return true;
    } catch (error) {
      console.error('Failed to add category:', error);
      return false;
    }
  }

  /**
   * Update existing category
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateCategory(categoryId, updateData) {
    try {
      const categories = await this.getAllCategories();
      const categoryIndex = categories.findIndex(c => c.id === categoryId);
      
      if (categoryIndex === -1) {
        console.error('Category not found');
        return false;
      }

      // Don't allow updating pre-built categories
      if (categories[categoryIndex].isPrebuilt) {
        console.error('Cannot update pre-built category');
        return false;
      }

      const updatedCategory = new (window.AdReplyModels || require('./data-models')).Category({
        ...categories[categoryIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      const validation = updatedCategory.validate();
      if (!validation.isValid) {
        console.error('Category validation failed:', validation.errors);
        return false;
      }

      categories[categoryIndex] = updatedCategory.sanitize().toObject();
      await this.storageManager.saveData({ categories });
      
      return true;
    } catch (error) {
      console.error('Failed to update category:', error);
      return false;
    }
  }

  /**
   * Delete category
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCategory(categoryId) {
    try {
      const categories = await this.getAllCategories();
      const category = categories.find(c => c.id === categoryId);
      
      if (!category) {
        console.error('Category not found');
        return false;
      }

      // Don't allow deleting pre-built categories
      if (category.isPrebuilt) {
        console.error('Cannot delete pre-built category');
        return false;
      }

      // Move templates from this category to 'custom'
      await this.moveTemplatesFromCategory(categoryId, 'custom');

      const filteredCategories = categories.filter(c => c.id !== categoryId);
      await this.storageManager.saveData({ categories: filteredCategories });
      
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }

  /**
   * Update template count for a category
   * @param {string} categoryId - Category ID
   * @param {number} count - New template count
   * @returns {Promise<boolean>} Success status
   */
  async updateTemplateCount(categoryId, count) {
    try {
      const categories = await this.getAllCategories();
      const categoryIndex = categories.findIndex(c => c.id === categoryId);
      
      if (categoryIndex === -1) {
        return false;
      }

      categories[categoryIndex].templateCount = Math.max(0, count);
      await this.storageManager.saveData({ categories });
      
      return true;
    } catch (error) {
      console.error('Failed to update template count:', error);
      return false;
    }
  }

  /**
   * Move templates from one category to another
   * @param {string} fromCategoryId - Source category ID
   * @param {string} toCategoryId - Target category ID
   * @returns {Promise<boolean>} Success status
   */
  async moveTemplatesFromCategory(fromCategoryId, toCategoryId) {
    try {
      const data = await this.storageManager.getAllData();
      const templates = data.templates || [];
      
      let movedCount = 0;
      templates.forEach(template => {
        if (template.category === fromCategoryId) {
          template.category = toCategoryId;
          template.updatedAt = new Date().toISOString();
          movedCount++;
        }
      });

      if (movedCount > 0) {
        await this.storageManager.saveData({ templates });
        
        // Update template counts
        await this.updateTemplateCount(fromCategoryId, 0);
        const toCategory = await this.getCategoryById(toCategoryId);
        if (toCategory) {
          await this.updateTemplateCount(toCategoryId, toCategory.templateCount + movedCount);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to move templates:', error);
      return false;
    }
  }

  /**
   * Get pre-built categories definition
   * @returns {Array} Array of pre-built category objects
   */
  getPrebuiltCategories() {
    return [
      {
        id: 'automotive',
        name: 'Automotive Services',
        description: 'Car repair, maintenance, detailing, and automotive services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'fitness',
        name: 'Fitness & Health',
        description: 'Gyms, personal training, nutrition, and wellness services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'food',
        name: 'Food & Restaurants',
        description: 'Restaurants, catering, food delivery, and culinary services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'home-services',
        name: 'Home Services',
        description: 'Cleaning, repairs, landscaping, and home improvement',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'beauty',
        name: 'Beauty & Wellness',
        description: 'Salons, spas, cosmetics, and beauty services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'real-estate',
        name: 'Real Estate',
        description: 'Property sales, rentals, and real estate management',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'technology',
        name: 'Technology Services',
        description: 'IT support, web design, software development, and tech services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'education',
        name: 'Education & Training',
        description: 'Courses, tutoring, workshops, and educational services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'financial',
        name: 'Financial Services',
        description: 'Insurance, loans, accounting, and financial consulting',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'legal',
        name: 'Legal Services',
        description: 'Lawyers, legal consultants, and legal advice services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pet-services',
        name: 'Pet Services',
        description: 'Veterinary, grooming, pet sitting, and animal care',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'events',
        name: 'Event Planning',
        description: 'Weddings, parties, corporate events, and event management',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'photography',
        name: 'Photography',
        description: 'Portrait, event, commercial, and photography services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'crafts',
        name: 'Crafts & Handmade',
        description: 'Etsy sellers, artisans, crafters, and handmade products',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'construction',
        name: 'Construction',
        description: 'Contractors, builders, renovations, and construction services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'transportation',
        name: 'Transportation',
        description: 'Moving, delivery, ride services, and transportation',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        description: 'Musicians, DJs, performers, and entertainment services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'retail',
        name: 'Retail & E-commerce',
        description: 'Online stores, boutiques, and retail businesses',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'professional',
        name: 'Professional Services',
        description: 'Consulting, marketing, design, and professional services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Medical, dental, therapy, and healthcare services',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'User-created templates and custom categories',
        isPrebuilt: true,
        templateCount: 0,
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CategoryManager };
} else {
  window.CategoryManager = CategoryManager;
}