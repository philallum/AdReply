/**
 * Category Pack Import/Export Manager
 * Handles importing and exporting category packs for template licensing
 */

/**
 * Category Pack Manager Class
 * Manages import/export of category packs with validation and error handling
 */
class CategoryPackManager {
  constructor(storageManager, categoryManager, templateDatabaseManager) {
    this.storageManager = storageManager;
    this.categoryManager = categoryManager;
    this.templateDatabaseManager = templateDatabaseManager;
    this.models = window.AdReplyModels || require('./data-models');
  }

  /**
   * Validate category pack structure
   * @param {Object} packData - Category pack data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateCategoryPack(packData) {
    const errors = [];

    // Check basic structure
    if (!packData || typeof packData !== 'object') {
      errors.push('Category pack must be a valid object');
      return { isValid: false, errors };
    }

    // Required fields
    if (!packData.name || typeof packData.name !== 'string' || packData.name.trim().length === 0) {
      errors.push('Category pack name is required and must be a non-empty string');
    }

    if (!packData.version || typeof packData.version !== 'string') {
      errors.push('Category pack version is required and must be a string');
    }

    // Category validation
    if (!packData.category || typeof packData.category !== 'object') {
      errors.push('Category pack must include a category object');
    } else {
      const category = new this.models.Category(packData.category);
      const categoryValidation = category.validate();
      if (!categoryValidation.isValid) {
        errors.push(`Category validation failed: ${categoryValidation.errors.join(', ')}`);
      }
    }

    // Templates validation
    if (!packData.templates || !Array.isArray(packData.templates)) {
      errors.push('Category pack must include a templates array');
    } else {
      if (packData.templates.length === 0) {
        errors.push('Category pack must contain at least one template');
      }

      // Validate each template
      packData.templates.forEach((templateData, index) => {
        const template = new this.models.Template(templateData);
        const templateValidation = template.validate();
        if (!templateValidation.isValid) {
          errors.push(`Template ${index + 1} validation failed: ${templateValidation.errors.join(', ')}`);
        }

        // Ensure template category matches pack category
        if (templateData.category !== packData.category.id) {
          errors.push(`Template ${index + 1} category (${templateData.category}) does not match pack category (${packData.category.id})`);
        }
      });
    }

    // Optional metadata validation
    if (packData.metadata && typeof packData.metadata !== 'object') {
      errors.push('Category pack metadata must be an object if provided');
    }

    // Business rules
    if (packData.name && packData.name.length > 100) {
      errors.push('Category pack name must be 100 characters or less');
    }

    if (packData.templates && packData.templates.length > 200) {
      errors.push('Category pack cannot contain more than 200 templates');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Import category pack
   * @param {Object} packData - Category pack data to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importCategoryPack(packData, options = {}) {
    try {
      // Validate pack structure
      const validation = this.validateCategoryPack(packData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Category pack validation failed: ${validation.errors.join(', ')}`,
          imported: 0,
          skipped: 0,
          errors: validation.errors
        };
      }

      const results = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [],
        categoryCreated: false,
        categoryUpdated: false
      };

      // Check if category already exists
      const existingCategory = await this.categoryManager.getCategoryById(packData.category.id);
      
      if (existingCategory) {
        if (existingCategory.isPrebuilt && !options.allowPrebuiltOverwrite) {
          return {
            success: false,
            error: `Cannot import into pre-built category '${packData.category.id}'. Use a different category ID.`,
            imported: 0,
            skipped: 0,
            errors: ['Pre-built category conflict']
          };
        }
        results.categoryUpdated = true;
      } else {
        // Create new category
        const categorySuccess = await this.categoryManager.addCategory({
          ...packData.category,
          isPrebuilt: false, // Imported categories are not pre-built
          templateCount: 0,
          createdAt: new Date().toISOString()
        });

        if (!categorySuccess) {
          return {
            success: false,
            error: `Failed to create category '${packData.category.id}'`,
            imported: 0,
            skipped: 0,
            errors: ['Category creation failed']
          };
        }
        results.categoryCreated = true;
      }

      // Import templates
      const existingTemplates = await this.templateDatabaseManager.getTemplatesByCategory(packData.category.id);
      const existingTemplateIds = new Set(existingTemplates.map(t => t.id));

      for (const templateData of packData.templates) {
        try {
          // Check for duplicates
          if (existingTemplateIds.has(templateData.id)) {
            if (options.skipDuplicates !== false) {
              results.skipped++;
              continue;
            }
            
            // Update existing template if allowed
            if (options.updateExisting) {
              const updatedTemplate = {
                ...templateData,
                updatedAt: new Date().toISOString(),
                isPrebuilt: false // Imported templates are not pre-built
              };
              
              await this.storageManager.saveTemplate(updatedTemplate);
              results.imported++;
            } else {
              results.skipped++;
            }
          } else {
            // Add new template
            const newTemplate = {
              ...templateData,
              category: packData.category.id,
              isPrebuilt: false, // Imported templates are not pre-built
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0
            };

            await this.storageManager.saveTemplate(newTemplate);
            results.imported++;
          }
        } catch (error) {
          results.errors.push(`Failed to import template '${templateData.id}': ${error.message}`);
        }
      }

      // Update category template count
      const finalTemplates = await this.templateDatabaseManager.getTemplatesByCategory(packData.category.id);
      await this.categoryManager.updateTemplateCount(packData.category.id, finalTemplates.length);

      return results;
    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${error.message}`,
        imported: 0,
        skipped: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Export category as category pack
   * @param {string} categoryId - Category ID to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Category pack data
   */
  async exportCategoryPack(categoryId, options = {}) {
    try {
      // Get category
      const category = await this.categoryManager.getCategoryById(categoryId);
      if (!category) {
        throw new Error(`Category '${categoryId}' not found`);
      }

      // Get templates for category
      const templates = await this.templateDatabaseManager.getTemplatesByCategory(categoryId);
      
      if (templates.length === 0 && !options.allowEmpty) {
        throw new Error(`Category '${categoryId}' contains no templates`);
      }

      // Filter templates if needed
      let exportTemplates = templates;
      if (options.excludePrebuilt) {
        exportTemplates = templates.filter(t => !t.isPrebuilt);
      }
      if (options.customOnly) {
        exportTemplates = templates.filter(t => !t.isPrebuilt);
      }

      // Clean template data for export
      const cleanTemplates = exportTemplates.map(template => {
        const cleanTemplate = { ...template };
        
        // Remove internal fields if specified
        if (options.removeInternalFields) {
          delete cleanTemplate.usageCount;
          delete cleanTemplate.createdAt;
          delete cleanTemplate.updatedAt;
        }
        
        return cleanTemplate;
      });

      // Create category pack
      const categoryPack = {
        name: options.packName || `${category.name} Templates`,
        version: options.version || '1.0',
        category: {
          id: category.id,
          name: category.name,
          description: category.description
        },
        templates: cleanTemplates,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalTemplates: cleanTemplates.length,
          originalTemplateCount: templates.length,
          exportedBy: 'AdReply Extension',
          ...options.metadata
        }
      };

      return categoryPack;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Generate category pack file for download
   * @param {string} categoryId - Category ID to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} File data with filename and content
   */
  async generateCategoryPackFile(categoryId, options = {}) {
    try {
      const categoryPack = await this.exportCategoryPack(categoryId, options);
      
      // Generate filename
      const category = await this.categoryManager.getCategoryById(categoryId);
      const safeName = category.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `${safeName}-templates-${timestamp}.json`;

      return {
        filename,
        content: JSON.stringify(categoryPack, null, 2),
        mimeType: 'application/json',
        size: JSON.stringify(categoryPack).length
      };
    } catch (error) {
      throw new Error(`File generation failed: ${error.message}`);
    }
  }

  /**
   * Parse and validate uploaded category pack file
   * @param {string} fileContent - JSON file content
   * @returns {Promise<Object>} Parsed and validated pack data
   */
  async parsePackFile(fileContent) {
    try {
      // Parse JSON
      let packData;
      try {
        packData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON format in category pack file');
      }

      // Validate structure
      const validation = this.validateCategoryPack(packData);
      if (!validation.isValid) {
        throw new Error(`Category pack validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        packData,
        metadata: {
          name: packData.name,
          version: packData.version,
          categoryId: packData.category.id,
          categoryName: packData.category.name,
          templateCount: packData.templates.length,
          fileSize: fileContent.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        packData: null,
        metadata: null
      };
    }
  }

  /**
   * Get import preview without actually importing
   * @param {Object} packData - Category pack data
   * @returns {Promise<Object>} Import preview information
   */
  async getImportPreview(packData) {
    try {
      const validation = this.validateCategoryPack(packData);
      if (!validation.isValid) {
        return {
          valid: false,
          errors: validation.errors,
          preview: null
        };
      }

      // Check existing category
      const existingCategory = await this.categoryManager.getCategoryById(packData.category.id);
      const existingTemplates = existingCategory 
        ? await this.templateDatabaseManager.getTemplatesByCategory(packData.category.id)
        : [];
      
      const existingTemplateIds = new Set(existingTemplates.map(t => t.id));
      
      // Analyze templates
      const newTemplates = packData.templates.filter(t => !existingTemplateIds.has(t.id));
      const duplicateTemplates = packData.templates.filter(t => existingTemplateIds.has(t.id));

      return {
        valid: true,
        errors: [],
        preview: {
          packName: packData.name,
          packVersion: packData.version,
          category: {
            id: packData.category.id,
            name: packData.category.name,
            exists: !!existingCategory,
            isPrebuilt: existingCategory?.isPrebuilt || false,
            currentTemplateCount: existingTemplates.length
          },
          templates: {
            total: packData.templates.length,
            new: newTemplates.length,
            duplicates: duplicateTemplates.length,
            newTemplateIds: newTemplates.map(t => t.id),
            duplicateTemplateIds: duplicateTemplates.map(t => t.id)
          },
          warnings: this.generateImportWarnings(packData, existingCategory, existingTemplates)
        }
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        preview: null
      };
    }
  }

  /**
   * Generate import warnings
   * @param {Object} packData - Category pack data
   * @param {Object} existingCategory - Existing category if any
   * @param {Array} existingTemplates - Existing templates in category
   * @returns {Array} Array of warning messages
   */
  generateImportWarnings(packData, existingCategory, existingTemplates) {
    const warnings = [];

    if (existingCategory?.isPrebuilt) {
      warnings.push('Importing into a pre-built category may cause conflicts');
    }

    if (existingTemplates.length > 0) {
      const duplicateCount = packData.templates.filter(t => 
        existingTemplates.some(existing => existing.id === t.id)
      ).length;
      
      if (duplicateCount > 0) {
        warnings.push(`${duplicateCount} templates already exist and will be skipped by default`);
      }
    }

    if (packData.templates.length > 50) {
      warnings.push('Large template pack may take some time to import');
    }

    const keywordCounts = packData.templates.map(t => t.keywords?.length || 0);
    const avgKeywords = keywordCounts.reduce((a, b) => a + b, 0) / keywordCounts.length;
    if (avgKeywords < 3) {
      warnings.push('Templates have few keywords which may affect matching accuracy');
    }

    return warnings;
  }

  /**
   * Get available categories for export
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of exportable categories
   */
  async getExportableCategories(options = {}) {
    try {
      const allCategories = await this.categoryManager.getAllCategories();
      
      let exportableCategories = allCategories;
      
      // Filter out pre-built categories if requested
      if (options.customOnly) {
        exportableCategories = allCategories.filter(c => !c.isPrebuilt);
      }

      // Get template counts and filter empty categories if requested
      const categoriesWithCounts = await Promise.all(
        exportableCategories.map(async (category) => {
          const templates = await this.templateDatabaseManager.getTemplatesByCategory(category.id);
          const customTemplates = templates.filter(t => !t.isPrebuilt);
          
          return {
            ...category,
            totalTemplates: templates.length,
            customTemplates: customTemplates.length,
            hasCustomTemplates: customTemplates.length > 0
          };
        })
      );

      if (options.nonEmpty) {
        return categoriesWithCounts.filter(c => c.totalTemplates > 0);
      }

      if (options.hasCustom) {
        return categoriesWithCounts.filter(c => c.hasCustomTemplates);
      }

      return categoriesWithCounts;
    } catch (error) {
      console.error('Failed to get exportable categories:', error);
      return [];
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CategoryPackManager };
} else {
  window.CategoryPackManager = CategoryPackManager;
}