/**
 * Template Loader - Loads and manages predefined templates from JSON files
 * Allows users to customize, import, and export template packs
 */

class TemplateLoader {
    constructor() {
        this.templateCache = new Map();
        this.availableCategories = [
            'automotive', 'fitness', 'food', 'home-services', 'beauty',
            'real-estate', 'technology', 'education', 'financial', 'legal',
            'pet-services', 'events', 'photography', 'crafts', 'construction',
            'transportation', 'entertainment', 'retail', 'professional', 'healthcare'
        ];
    }

    /**
     * Load templates for a specific category
     * @param {string} categoryId - Category to load
     * @returns {Promise<Object>} Category data with templates
     */
    async loadCategoryTemplates(categoryId) {
        // Check cache first
        if (this.templateCache.has(categoryId)) {
            return this.templateCache.get(categoryId);
        }

        try {
            // Try to load from user's custom template packs first
            const customPack = await this.loadCustomTemplatePack(categoryId);
            if (customPack) {
                this.templateCache.set(categoryId, customPack);
                return customPack;
            }

            // Load from default JSON file
            const response = await fetch(chrome.runtime.getURL(`data/templates/${categoryId}.json`));
            if (!response.ok) {
                console.warn(`Template file not found for category: ${categoryId}`);
                return null;
            }

            const categoryData = await response.json();
            
            // Add category to templates
            categoryData.templates.forEach(template => {
                template.category = categoryId;
            });

            this.templateCache.set(categoryId, categoryData);
            return categoryData;

        } catch (error) {
            console.error(`Error loading templates for category ${categoryId}:`, error);
            return null;
        }
    }

    /**
     * Load all available template categories
     * @returns {Promise<Object>} All categories with their templates
     */
    async loadAllTemplates() {
        const allTemplates = {};
        
        for (const categoryId of this.availableCategories) {
            const categoryData = await this.loadCategoryTemplates(categoryId);
            if (categoryData) {
                allTemplates[categoryId] = categoryData.templates;
            }
        }

        return allTemplates;
    }

    /**
     * Get flattened array of all templates
     * @returns {Promise<Array>} Array of all template objects
     */
    async getAllTemplatesFlat() {
        const allTemplates = await this.loadAllTemplates();
        const flatTemplates = [];

        for (const categoryId in allTemplates) {
            flatTemplates.push(...allTemplates[categoryId]);
        }

        return flatTemplates;
    }

    /**
     * Load custom template pack from user storage
     * @param {string} categoryId - Category ID
     * @returns {Promise<Object|null>} Custom template pack or null
     */
    async loadCustomTemplatePack(categoryId) {
        try {
            const result = await chrome.storage.local.get([`customTemplatePack_${categoryId}`]);
            return result[`customTemplatePack_${categoryId}`] || null;
        } catch (error) {
            console.error('Error loading custom template pack:', error);
            return null;
        }
    }

    /**
     * Save custom template pack
     * @param {string} categoryId - Category ID
     * @param {Object} templatePack - Template pack data
     * @returns {Promise<boolean>} Success status
     */
    async saveCustomTemplatePack(categoryId, templatePack) {
        try {
            // Validate template pack structure
            if (!templatePack.category || !templatePack.templates || !Array.isArray(templatePack.templates)) {
                throw new Error('Invalid template pack structure');
            }

            // Add metadata
            templatePack.customized = true;
            templatePack.lastModified = new Date().toISOString();

            // Save to storage
            await chrome.storage.local.set({
                [`customTemplatePack_${categoryId}`]: templatePack
            });

            // Update cache
            this.templateCache.set(categoryId, templatePack);

            return true;
        } catch (error) {
            console.error('Error saving custom template pack:', error);
            return false;
        }
    }

    /**
     * Reset category to default templates
     * @param {string} categoryId - Category to reset
     * @returns {Promise<boolean>} Success status
     */
    async resetCategoryToDefault(categoryId) {
        try {
            // Remove custom template pack
            await chrome.storage.local.remove([`customTemplatePack_${categoryId}`]);
            
            // Clear cache
            this.templateCache.delete(categoryId);

            return true;
        } catch (error) {
            console.error('Error resetting category to default:', error);
            return false;
        }
    }

    /**
     * Export template pack as JSON
     * @param {string} categoryId - Category to export
     * @returns {Promise<string>} JSON string of template pack
     */
    async exportTemplatePack(categoryId) {
        const categoryData = await this.loadCategoryTemplates(categoryId);
        if (!categoryData) {
            throw new Error(`Category ${categoryId} not found`);
        }

        const exportData = {
            ...categoryData,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import template pack from JSON
     * @param {string} jsonData - JSON string of template pack
     * @returns {Promise<Object>} Import result with success status and details
     */
    async importTemplatePack(jsonData) {
        try {
            const templatePack = JSON.parse(jsonData);

            // Validate structure
            if (!templatePack.category || !templatePack.templates) {
                throw new Error('Invalid template pack format');
            }

            const categoryId = templatePack.category.id;
            if (!categoryId) {
                throw new Error('Template pack missing category ID');
            }

            // Validate templates
            for (const template of templatePack.templates) {
                if (!template.id || !template.label || !template.template) {
                    throw new Error('Invalid template structure in pack');
                }
            }

            // Save as custom template pack
            const success = await this.saveCustomTemplatePack(categoryId, templatePack);
            
            if (success) {
                return {
                    success: true,
                    categoryId: categoryId,
                    categoryName: templatePack.category.name,
                    templateCount: templatePack.templates.length
                };
            } else {
                throw new Error('Failed to save template pack');
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get template pack info
     * @param {string} categoryId - Category ID
     * @returns {Promise<Object>} Template pack information
     */
    async getTemplatePackInfo(categoryId) {
        const categoryData = await this.loadCategoryTemplates(categoryId);
        if (!categoryData) {
            return null;
        }

        return {
            categoryId: categoryId,
            categoryName: categoryData.category.name,
            description: categoryData.category.description,
            templateCount: categoryData.templates.length,
            isCustomized: categoryData.customized || false,
            lastModified: categoryData.lastModified || null
        };
    }

    /**
     * Search templates across all categories
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching templates
     */
    async searchTemplates(query) {
        const allTemplates = await this.getAllTemplatesFlat();
        const queryLower = query.toLowerCase();

        return allTemplates.filter(template => {
            return template.label.toLowerCase().includes(queryLower) ||
                   template.template.toLowerCase().includes(queryLower) ||
                   template.keywords.some(keyword => keyword.toLowerCase().includes(queryLower));
        });
    }

    /**
     * Get available categories
     * @returns {Array} List of available category IDs
     */
    getAvailableCategories() {
        return [...this.availableCategories];
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateLoader;
} else {
    window.TemplateLoader = TemplateLoader;
}