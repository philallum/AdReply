// Template management - CRUD operations for templates
class TemplateManager {
    constructor() {
        this.templates = [];
        this.isProLicense = false;
        this.editingTemplateId = null;
    }

    async loadTemplates() {
        try {
            // Check license status FIRST before loading templates
            console.log('🔐 Checking license status before loading templates...');
            try {
                const licenseResponse = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
                if (licenseResponse && licenseResponse.success) {
                    const wasProLicense = this.isProLicense;
                    this.isProLicense = licenseResponse.valid;
                    console.log('🔐 License check result:', {
                        valid: licenseResponse.valid,
                        tier: licenseResponse.status?.tier,
                        wasProLicense: wasProLicense,
                        nowProLicense: this.isProLicense
                    });
                }
            } catch (error) {
                console.warn('⚠️ Could not check license during template load:', error);
            }
            
            // Load user-created templates from Chrome storage
            const result = await chrome.storage.local.get(['templates']);
            const userTemplates = result.templates || [];

            // Load prebuilt templates from JSON files
            let prebuiltTemplates = [];
            if (typeof TemplateLoader !== 'undefined') {
                try {
                    const templateLoader = new TemplateLoader();
                    prebuiltTemplates = await templateLoader.getAllTemplatesFlat();
                    console.log('AdReply: Loaded prebuilt templates:', prebuiltTemplates.length);
                } catch (error) {
                    console.warn('AdReply: Could not load prebuilt templates:', error);
                }
            }

            // Combine user templates and prebuilt templates
            this.templates = [...userTemplates, ...prebuiltTemplates];

            console.log('AdReply: Total templates loaded:', this.templates.length, {
                userTemplates: userTemplates.length,
                prebuiltTemplates: prebuiltTemplates.length,
                isProLicense: this.isProLicense
            });

            return this.templates;
        } catch (error) {
            console.error('AdReply: Error loading templates:', error);
            this.templates = [];
            return [];
        }
    }

    getTemplates() {
        // Check license status (use cached value for now)
        console.log('🔍 getTemplates() - isProLicense:', this.isProLicense);
        
        // If not pro license, only return limited user templates
        if (!this.isProLicense) {
            console.log('⚠️ Free license detected, limiting templates to 10');
            console.log('⚠️ To see all templates, ensure Pro license is active and reload page');
            return this.getFreeLicenseTemplates();
        }
        
        console.log('✅ Pro license detected, returning all', this.templates.length, 'templates');
        return this.templates;
    }

    getFreeLicenseTemplates() {
        const userTemplates = this.templates.filter(template => !template.isPrebuilt);
        const prebuiltTemplates = this.templates.filter(template => template.isPrebuilt);
        
        console.log('📊 Free license filter - Total user templates:', userTemplates.length);
        
        // Get first custom category created
        const customCategories = [...new Set(userTemplates.map(t => t.category))];
        const firstCustomCategory = customCategories.length > 0 ? customCategories[0] : 'custom';
        
        console.log('📁 Limiting to first custom category:', firstCustomCategory);
        
        // Filter to only first 10 templates from first custom category (updated from 3 to match spec)
        const limitedUserTemplates = userTemplates
            .filter(template => template.category === firstCustomCategory)
            .slice(0, 10);
        
        console.log('📊 Returning', limitedUserTemplates.length, 'limited templates +', prebuiltTemplates.length, 'prebuilt');
        
        return [...limitedUserTemplates, ...prebuiltTemplates];
    }

    getAllTemplates() {
        // Always return all templates (for pro license management)
        return this.templates;
    }

    getTemplateCount() {
        const userTemplates = this.templates.filter(template => !template.isPrebuilt);
        const prebuiltTemplates = this.templates.filter(template => template.isPrebuilt);
        return {
            userTemplates: userTemplates.length,
            prebuiltTemplates: prebuiltTemplates.length,
            total: this.templates.length
        };
    }

    getMaxTemplates() {
        return this.isProLicense ? 'unlimited' : 10;
    }

    getMaxCategories() {
        return this.isProLicense ? 'unlimited' : '1';
    }

    async saveTemplate(templateData) {
        const { label, category, keywords, content, url } = templateData;
        
        if (!label || !keywords || !content) {
            throw new Error('Please fill in all required fields');
        }
        
        // Validate URL if provided
        if (url && !this.isValidUrl(url)) {
            throw new Error('Please enter a valid URL (e.g., https://yourwebsite.com)');
        }
        
        // Check template limit for free users (only for new user templates)
        const userTemplates = this.templates.filter(template => !template.isPrebuilt);
        if (!this.isProLicense && userTemplates.length >= 10) {
            throw new Error('Free license limited to 10 custom templates. Upgrade to Pro for unlimited templates and categories.');
        }
        
        const template = {
            id: Date.now().toString(),
            label: label,
            category: category || 'custom',
            keywords: keywords.split(',').map(k => k.trim()),
            template: content,
            url: url || '',
            createdAt: new Date().toISOString(),
            usageCount: 0,
            isPrebuilt: false
        };
        
        this.templates.push(template);
        
        try {
            // Only save user templates to storage
            const userTemplatesOnly = this.templates.filter(t => !t.isPrebuilt);
            await chrome.storage.local.set({ templates: userTemplatesOnly });
            return template;
        } catch (error) {
            // Remove from local array if save failed
            this.templates.pop();
            throw new Error('Failed to save template');
        }
    }

    async updateTemplate(templateId, templateData) {
        const { label, category, keywords, content, url } = templateData;
        
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
            category: category || 'custom',
            keywords: keywords.split(',').map(k => k.trim()),
            template: content,
            url: url || '',
            updatedAt: new Date().toISOString()
        };
        
        this.templates[templateIndex] = updatedTemplate;
        
        try {
            // Only save user templates to storage
            const userTemplatesOnly = this.templates.filter(t => !t.isPrebuilt);
            await chrome.storage.local.set({ templates: userTemplatesOnly });
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
        
        // Don't allow deletion of prebuilt templates
        if (deletedTemplate.isPrebuilt) {
            throw new Error('Cannot delete prebuilt templates');
        }
        
        this.templates.splice(templateIndex, 1);
        
        try {
            // Only save user templates to storage
            const userTemplatesOnly = this.templates.filter(t => !t.isPrebuilt);
            await chrome.storage.local.set({ templates: userTemplatesOnly });
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
        console.log('🔐 setProLicense called with:', isProLicense);
        this.isProLicense = isProLicense;
        console.log('🔐 isProLicense now set to:', this.isProLicense);
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

    async exportTemplates() {
        try {
            // Get only user-created templates for export
            const userTemplates = this.templates.filter(template => !template.isPrebuilt);
            
            if (userTemplates.length === 0) {
                throw new Error('No custom templates to export');
            }

            // Create export data with full template information including categories
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                templateCount: userTemplates.length,
                templates: userTemplates.map(template => ({
                    id: template.id,
                    label: template.label,
                    category: template.category || 'custom',
                    keywords: template.keywords,
                    template: template.template,
                    url: template.url || '',
                    createdAt: template.createdAt,
                    updatedAt: template.updatedAt,
                    usageCount: template.usageCount || 0
                }))
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `adreply-templates-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true, count: userTemplates.length };
            
        } catch (error) {
            console.error('AdReply: Error exporting templates:', error);
            throw error;
        }
    }

    async importTemplates(fileContent) {
        console.log('🔍 === IMPORT DEBUG START ===');
        try {
            let importData;
            
            // Parse the JSON content
            try {
                importData = JSON.parse(fileContent);
                console.log('✅ JSON parsed successfully');
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                throw new Error('Invalid JSON file format');
            }

            // Validate import data structure
            if (!importData.templates || !Array.isArray(importData.templates)) {
                console.error('❌ Invalid structure:', importData);
                throw new Error('Invalid template file format - missing templates array');
            }

            const templatesToImport = importData.templates;
            console.log(`📥 Templates to import: ${templatesToImport.length}`);
            
            if (templatesToImport.length === 0) {
                throw new Error('No templates found in import file');
            }

            // Check license status fresh from background script
            let isProLicense = this.isProLicense;
            console.log(`🔐 Initial license status (cached): ${isProLicense}`);
            
            try {
                const licenseResponse = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
                console.log('🔐 License response:', licenseResponse);
                
                if (licenseResponse && licenseResponse.success) {
                    isProLicense = licenseResponse.valid;
                    this.isProLicense = isProLicense;
                    console.log(`🔐 Updated license status: ${isProLicense}`);
                    console.log(`🔐 License tier: ${licenseResponse.status?.tier}`);
                    console.log(`🔐 Template limit: ${licenseResponse.status?.templateLimit}`);
                }
            } catch (error) {
                console.warn('⚠️ Could not check license status, using cached value:', error);
            }

            // Check template limit for free users
            const currentUserTemplates = this.templates.filter(template => !template.isPrebuilt);
            const totalAfterImport = currentUserTemplates.length + templatesToImport.length;
            
            console.log(`📊 Current user templates: ${currentUserTemplates.length}`);
            console.log(`📊 Total after import would be: ${totalAfterImport}`);
            console.log(`📊 Is Pro License: ${isProLicense}`);
            
            if (!isProLicense && totalAfterImport > 10) {
                console.error(`❌ Would exceed limit: ${totalAfterImport} > 10`);
                throw new Error(`Import would exceed free license limit of 10 templates. You have ${currentUserTemplates.length} templates and are trying to import ${templatesToImport.length} more. Upgrade to Pro for unlimited templates.`);
            }
            
            console.log('✅ License check passed, proceeding with import');

            // Process and validate each template
            const processedTemplates = [];
            const skippedTemplates = [];
            const existingLabels = this.templates.map(t => t.label.toLowerCase());
            
            console.log(`📋 Existing template labels: ${existingLabels.length}`);
            
            for (let i = 0; i < templatesToImport.length; i++) {
                const template = templatesToImport[i];
                console.log(`\n🔍 Processing template ${i + 1}/${templatesToImport.length}: "${template.label}"`);
                
                // Validate required fields
                if (!template.label || !template.keywords || !template.template) {
                    console.warn(`⚠️ Skipping invalid template (missing fields):`, {
                        hasLabel: !!template.label,
                        hasKeywords: !!template.keywords,
                        hasTemplate: !!template.template
                    });
                    skippedTemplates.push({ label: template.label || 'Unknown', reason: 'Missing required fields' });
                    continue;
                }

                // Check for duplicate labels
                const labelLower = template.label.toLowerCase();
                if (existingLabels.includes(labelLower)) {
                    console.warn(`⚠️ Skipping duplicate template: "${template.label}"`);
                    skippedTemplates.push({ label: template.label, reason: 'Duplicate label' });
                    continue;
                }

                // Create new template with fresh ID and current timestamp
                const newTemplate = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    label: template.label,
                    category: template.category || 'custom',
                    keywords: Array.isArray(template.keywords) ? template.keywords : template.keywords.split(',').map(k => k.trim()),
                    template: template.template,
                    url: template.url || '',
                    createdAt: new Date().toISOString(),
                    usageCount: 0,
                    isPrebuilt: false
                };

                console.log(`✅ Template "${template.label}" validated and ready`);
                processedTemplates.push(newTemplate);
                existingLabels.push(labelLower); // Prevent duplicates within import
            }

            console.log(`\n📊 Processing complete:`);
            console.log(`   ✅ Processed: ${processedTemplates.length}`);
            console.log(`   ⚠️ Skipped: ${skippedTemplates.length}`);
            
            if (skippedTemplates.length > 0) {
                console.log(`\n⚠️ Skipped templates:`);
                skippedTemplates.forEach(t => console.log(`   - ${t.label}: ${t.reason}`));
            }

            if (processedTemplates.length === 0) {
                console.error('❌ No valid templates to import');
                throw new Error('No valid templates found to import (all were duplicates or invalid)');
            }

            // Add templates to local array
            console.log(`\n💾 Adding ${processedTemplates.length} templates to local array`);
            this.templates.push(...processedTemplates);

            // Save to storage
            const userTemplatesOnly = this.templates.filter(t => !t.isPrebuilt);
            console.log(`💾 Saving ${userTemplatesOnly.length} user templates to storage`);
            await chrome.storage.local.set({ templates: userTemplatesOnly });
            
            console.log('✅ Templates saved to storage successfully');
            console.log('🔍 === IMPORT DEBUG END ===\n');

            return { 
                success: true, 
                imported: processedTemplates.length,
                skipped: templatesToImport.length - processedTemplates.length
            };

        } catch (error) {
            console.error('❌ === IMPORT ERROR ===');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            console.error('🔍 === IMPORT DEBUG END ===\n');
            throw error;
        }
    }

}

export default TemplateManager;