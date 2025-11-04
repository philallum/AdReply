// Template management - CRUD operations for templates
class TemplateManager {
    constructor() {
        this.templates = [];
        this.isProLicense = false;
        this.editingTemplateId = null;
    }

    async loadTemplates() {
        try {
            const result = await chrome.storage.local.get(['templates']);
            this.templates = result.templates || [];
            // Templates loaded successfully
            return this.templates;
        } catch (error) {
            console.error('AdReply: Error loading templates:', error);
            this.templates = [];
            return [];
        }
    }

    getTemplates() {
        return this.templates;
    }

    getTemplateCount() {
        return this.templates.length;
    }

    getMaxTemplates() {
        return this.isProLicense ? 'unlimited' : '10';
    }

    async saveTemplate(templateData) {
        const { label, keywords, content, variants, url } = templateData;
        
        if (!label || !keywords || !content) {
            throw new Error('Please fill in all required fields');
        }
        
        // Validate URL if provided
        if (url && !this.isValidUrl(url)) {
            throw new Error('Please enter a valid URL (e.g., https://yourwebsite.com)');
        }
        
        // Check template limit for free users (only for new templates)
        if (!this.isProLicense && this.templates.length >= 10) {
            throw new Error('Free license limited to 10 templates. Upgrade to Pro for unlimited templates.');
        }
        
        const template = {
            id: Date.now().toString(),
            label: label,
            keywords: keywords.split(',').map(k => k.trim()),
            template: content,
            variants: variants ? variants.split('\n').filter(v => v.trim()) : [],
            url: url || '',
            createdAt: new Date().toISOString(),
            usageCount: 0
        };
        
        this.templates.push(template);
        
        try {
            await chrome.storage.local.set({ templates: this.templates });
            return template;
        } catch (error) {
            // Remove from local array if save failed
            this.templates.pop();
            throw new Error('Failed to save template');
        }
    }

    async updateTemplate(templateId, templateData) {
        const { label, keywords, content, variants, url } = templateData;
        
        if (!label || !keywords || !content) {
            throw new Error('Please fill in all required fields');
        }
        
        // Validate URL if provided
        if (url && !this.isValidUrl(url)) {
            throw new Error('Please enter a valid URL');
        }
        
        // Find and update template
        const templateIndex = this.templates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) {
            throw new Error('Template not found');
        }
        
        const updatedTemplate = {
            ...this.templates[templateIndex],
            label: label,
            keywords: keywords.split(',').map(k => k.trim()),
            template: content,
            variants: variants ? variants.split('\n').filter(v => v.trim()) : [],
            url: url || '',
            updatedAt: new Date().toISOString()
        };
        
        this.templates[templateIndex] = updatedTemplate;
        
        try {
            await chrome.storage.local.set({ templates: this.templates });
            return updatedTemplate;
        } catch (error) {
            // Revert changes if save failed
            this.templates[templateIndex] = this.templates[templateIndex];
            throw new Error('Failed to update template');
        }
    }

    async deleteTemplate(templateId) {
        const templateIndex = this.templates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) {
            throw new Error('Template not found');
        }
        
        const deletedTemplate = this.templates[templateIndex];
        this.templates.splice(templateIndex, 1);
        
        try {
            await chrome.storage.local.set({ templates: this.templates });
            return deletedTemplate;
        } catch (error) {
            // Restore template if save failed
            this.templates.splice(templateIndex, 0, deletedTemplate);
            throw new Error('Failed to delete template');
        }
    }

    getTemplate(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    setProLicense(isProLicense) {
        this.isProLicense = isProLicense;
    }

    setEditingTemplate(templateId) {
        this.editingTemplateId = templateId;
    }

    getEditingTemplate() {
        return this.editingTemplateId;
    }

    clearEditingTemplate() {
        this.editingTemplateId = null;
    }


}

export default TemplateManager;