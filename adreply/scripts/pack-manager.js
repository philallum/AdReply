/**
 * Ad Pack Manager for AdReply Extension
 * Handles creation, validation, import, and export of Ad Packs
 */

class AdPackManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Create an Ad Pack from selected categories
   * @param {string} name - Pack name
   * @param {string} niche - Pack niche/industry
   * @param {string[]} categoryIds - Category IDs to include
   * @param {Object} options - Additional options (author, description)
   * @returns {Promise<Object>} Created Ad Pack
   */
  async createPack(name, niche, categoryIds, options = {}) {
    try {
      // Validate inputs
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Pack name is required');
      }

      if (!niche || typeof niche !== 'string' || niche.trim().length === 0) {
        throw new Error('Pack niche is required');
      }

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('At least one category must be selected');
      }

      // Get all categories and templates
      const allCategories = await this.storageManager.getCategories();
      const allTemplates = await this.storageManager.getTemplates();

      // Filter selected categories
      const selectedCategories = allCategories.filter(cat => 
        categoryIds.includes(cat.id)
      );

      if (selectedCategories.length === 0) {
        throw new Error('No valid categories found');
      }

      // Build categories with their templates
      const packCategories = selectedCategories.map(category => {
        // Get templates for this category
        const categoryTemplates = allTemplates.filter(t => 
          t.category === category.id && !t.isPrebuilt
        );

        return {
          id: category.id,
          name: category.name,
          description: category.description || '',
          positiveKeywords: [], // Will be populated from templates
          negativeKeywords: [],
          templates: categoryTemplates.map(template => ({
            id: template.id,
            title: template.label,
            content: template.template,
            keywords: template.keywords || []
          }))
        };
      });

      // Create Ad Pack using data model
      const adPackData = {
        name: name.trim(),
        niche: niche.trim(),
        version: '1.0.0',
        author: options.author || 'anonymous',
        description: options.description || '',
        categories: packCategories
      };

      const adPack = new (window.AdReplyModels?.AdPack || AdPack)(adPackData);
      
      // Update metadata
      adPack.updateMetadata();

      // Validate the pack
      const validation = adPack.validate();
      if (!validation.isValid) {
        throw new Error(`Pack validation failed: ${validation.errors.join(', ')}`);
      }

      return adPack.toObject();

    } catch (error) {
      console.error('AdPackManager: Error creating pack:', error);
      throw error;
    }
  }

  /**
   * Validate an Ad Pack structure and data integrity
   * @param {Object} packData - Ad Pack data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validatePack(packData) {
    try {
      const errors = [];

      // Basic structure validation
      if (!packData || typeof packData !== 'object') {
        return { isValid: false, errors: ['Pack data must be an object'] };
      }

      // Use data model validation
      const adPack = new (window.AdReplyModels?.AdPack || AdPack)(packData);
      const modelValidation = adPack.validate();

      if (!modelValidation.isValid) {
        errors.push(...modelValidation.errors);
      }

      // Additional integrity checks
      if (packData.categories && Array.isArray(packData.categories)) {
        packData.categories.forEach((category, catIndex) => {
          // Validate category structure
          if (!category.id || !category.name) {
            errors.push(`Category ${catIndex} missing required fields (id, name)`);
          }

          // Validate templates
          if (!category.templates || !Array.isArray(category.templates)) {
            errors.push(`Category ${catIndex} (${category.name}) missing templates array`);
          } else {
            category.templates.forEach((template, tplIndex) => {
              if (!template.id || !template.title || !template.content) {
                errors.push(`Template ${tplIndex} in category ${category.name} missing required fields`);
              }

              // Check template length (minimum 400 characters as per design)
              if (template.content && template.content.length < 400) {
                errors.push(`Template "${template.title}" in category ${category.name} is too short (${template.content.length} chars, minimum 400)`);
              }
            });
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      };

    } catch (error) {
      console.error('AdPackManager: Error validating pack:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Import an Ad Pack with merge strategy support
   * @param {Object} packData - Ad Pack data to import
   * @param {string} mergeStrategy - 'merge' or 'replace'
   * @returns {Promise<Object>} Import result
   */
  async importPack(packData, mergeStrategy = 'merge') {
    try {
      // Validate pack first
      const validation = this.validatePack(packData);
      if (!validation.isValid) {
        throw new Error(`Invalid pack: ${validation.errors.join(', ')}`);
      }

      const results = {
        categories: { imported: 0, skipped: 0, errors: [] },
        templates: { imported: 0, skipped: 0, errors: [] },
        strategy: mergeStrategy
      };

      // Get existing data
      const existingCategories = await this.storageManager.getCategories();
      const existingTemplates = await this.storageManager.getTemplates();

      // Handle replace strategy
      if (mergeStrategy === 'replace') {
        // Clear existing user-created categories and templates
        const userCategories = existingCategories.filter(cat => !cat.isPrebuilt);
        const userTemplates = existingTemplates.filter(tpl => !tpl.isPrebuilt);

        // Delete user templates
        for (const template of userTemplates) {
          try {
            await this.storageManager.deleteTemplate(template.id);
          } catch (error) {
            console.warn('Could not delete template:', template.id, error);
          }
        }

        // Note: Categories will be replaced by new ones below
      }

      // Import categories and templates
      for (const category of packData.categories) {
        try {
          // Check if category already exists
          const existingCategory = existingCategories.find(cat => 
            cat.name.toLowerCase() === category.name.toLowerCase()
          );

          let categoryId = category.id;

          if (existingCategory && mergeStrategy === 'merge') {
            // Use existing category
            categoryId = existingCategory.id;
            results.categories.skipped++;
          } else {
            // Create new category
            const newCategory = {
              id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: category.name,
              description: category.description || '',
              isPrebuilt: false,
              templateCount: category.templates ? category.templates.length : 0,
              createdAt: new Date().toISOString()
            };

            await this.storageManager.saveCategory(newCategory);
            categoryId = newCategory.id;
            results.categories.imported++;
          }

          // Import templates for this category
          if (category.templates && Array.isArray(category.templates)) {
            for (const template of category.templates) {
              try {
                // Check for duplicate by title
                const existingTemplate = existingTemplates.find(tpl =>
                  tpl.label.toLowerCase() === template.title.toLowerCase() &&
                  tpl.category === categoryId
                );

                if (existingTemplate && mergeStrategy === 'merge') {
                  results.templates.skipped++;
                  continue;
                }

                // Create new template
                const newTemplate = {
                  id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  label: template.title,
                  category: categoryId,
                  keywords: template.keywords || [],
                  template: template.content,
                  isPrebuilt: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  usageCount: 0
                };

                await this.storageManager.saveTemplate(newTemplate);
                results.templates.imported++;

              } catch (error) {
                results.templates.errors.push(`Failed to import template "${template.title}": ${error.message}`);
              }
            }
          }

        } catch (error) {
          results.categories.errors.push(`Failed to import category "${category.name}": ${error.message}`);
        }
      }

      // Store pack metadata
      try {
        const metadata = {
          packId: packData.id,
          name: packData.name,
          niche: packData.niche,
          version: packData.version,
          importedAt: new Date().toISOString(),
          categoriesImported: results.categories.imported,
          templatesImported: results.templates.imported
        };

        // Get existing metadata
        const settings = await this.storageManager.getSettings();
        const adPackMetadata = settings.adPackMetadata || [];
        adPackMetadata.push(metadata);

        // Save updated metadata
        await this.storageManager.updateSetting('adPackMetadata', adPackMetadata);

      } catch (error) {
        console.warn('Could not save pack metadata:', error);
      }

      return results;

    } catch (error) {
      console.error('AdPackManager: Error importing pack:', error);
      throw error;
    }
  }

  /**
   * Export selected categories as an Ad Pack
   * @param {string[]} categoryIds - Category IDs to export
   * @param {Object} packInfo - Pack information (name, niche, etc.)
   * @returns {Promise<Blob>} Downloadable JSON blob
   */
  async exportPack(categoryIds, packInfo = {}) {
    try {
      // Create the pack
      const pack = await this.createPack(
        packInfo.name || 'My Ad Pack',
        packInfo.niche || 'general',
        categoryIds,
        {
          author: packInfo.author || 'anonymous',
          description: packInfo.description || ''
        }
      );

      // Convert to JSON
      const jsonString = JSON.stringify(pack, null, 2);
      
      // Create blob
      const blob = new Blob([jsonString], { type: 'application/json' });

      return blob;

    } catch (error) {
      console.error('AdPackManager: Error exporting pack:', error);
      throw error;
    }
  }

  /**
   * Download an Ad Pack as a file
   * @param {Object} packData - Ad Pack data
   * @param {string} filename - Optional filename
   */
  downloadPack(packData, filename = null) {
    try {
      const jsonString = JSON.stringify(packData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${packData.name.replace(/\s+/g, '-').toLowerCase()}-pack.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('AdPackManager: Error downloading pack:', error);
      throw error;
    }
  }

  /**
   * Get imported pack metadata
   * @returns {Promise<Array>} Array of imported pack metadata
   */
  async getImportedPacks() {
    try {
      const settings = await this.storageManager.getSettings();
      return settings.adPackMetadata || [];
    } catch (error) {
      console.error('AdPackManager: Error getting imported packs:', error);
      return [];
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdPackManager;
} else {
  window.AdPackManager = AdPackManager;
}
