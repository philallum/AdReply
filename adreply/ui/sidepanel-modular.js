// Main AdReply Side Panel Application - Modular Version
import ConnectionManager from './modules/connection.js';
import PostAnalyzer from './modules/post-analysis.js';
import TemplateManager from './modules/template-manager.js';
import UsageTrackerManager from './modules/usage-tracker.js';
import SettingsManager from './modules/settings-manager.js';
import UIManager from './modules/ui-manager.js';

class AdReplySidePanel {
    constructor() {
        // Initialize all managers
        this.connectionManager = new ConnectionManager();
        this.templateManager = new TemplateManager();
        this.usageTrackerManager = new UsageTrackerManager();
        this.settingsManager = new SettingsManager();
        this.uiManager = new UIManager();
        
        // Initialize post analyzer with dependencies
        this.postAnalyzer = new PostAnalyzer(
            this.connectionManager,
            this.templateManager,
            this.usageTrackerManager.getUsageTracker()
        );
        
        // Bind methods to preserve context
        this.refreshData = this.refreshData.bind(this);
        this.onTabChange = this.onTabChange.bind(this);
        this.handleCopyClick = this.handleCopyClick.bind(this);
    }

    async initialize() {
        // Initialize UI
        this.uiManager.initializeTabs();
        this.uiManager.onTabChange = this.onTabChange;
        this.uiManager.onCopyClick = this.handleCopyClick;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load saved data
        await this.loadInitialData();
        
        // Initial data refresh
        await this.refreshData();
        
        // Set up periodic refresh
        setInterval(this.refreshData, 15000);
    }

    setupEventListeners() {
        // Template management
        document.getElementById('addTemplateBtn').addEventListener('click', () => this.showTemplateForm());
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        document.getElementById('cancelTemplateBtn').addEventListener('click', () => this.hideTemplateForm());
        

        
        // License
        document.getElementById('activateLicense').addEventListener('click', () => this.activateLicense());
        document.getElementById('checkLicense').addEventListener('click', () => this.checkLicense());
        
        // Post analysis
        document.getElementById('analyzePostBtn').addEventListener('click', () => this.analyzeCurrentPost());
        
        // Usage tracking
        document.getElementById('exportUsageBtn').addEventListener('click', () => this.exportUsageData());
        document.getElementById('refreshUsageBtn').addEventListener('click', () => this.refreshUsageStats());
        document.getElementById('clearUsageBtn').addEventListener('click', () => this.clearUsageHistory());
        
        // Debug
        document.getElementById('debugBtn').addEventListener('click', () => this.debugTemplateMatching());
        
        // Default URL
        document.getElementById('saveDefaultUrlBtn').addEventListener('click', () => this.saveDefaultUrl());
    }

    async loadInitialData() {
        // Load templates
        await this.templateManager.loadTemplates();
        this.renderTemplatesList();
        this.updateTemplateCount();
        

        
        // Check license
        await this.checkLicense();
        
        // Load default URL
        await this.loadDefaultUrl();
    }

    async refreshData() {
        // Test connection
        await this.connectionManager.testConnection();
        
        // Get current group info and recent posts
        const groupInfo = await this.connectionManager.getCurrentGroup();
        this.uiManager.updateStatus(groupInfo, this.connectionManager.isConnected);
        
        const recentPost = await this.connectionManager.getRecentPosts();
        const result = this.uiManager.updatePostContent(recentPost);
        
        if (result.needsSuggestions && recentPost) {
            try {
                const suggestions = await this.postAnalyzer.generateSuggestions(recentPost.content);
                this.uiManager.displaySuggestions(suggestions);
            } catch (error) {
                console.error('AdReply: Error generating suggestions:', error);
                this.uiManager.clearSuggestions();
            }
        }
    }

    onTabChange(tabName) {
        if (tabName === 'templates') {
            this.refreshUsageStats();
        }
    }

    async handleCopyClick(text, btnElement, suggestion) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Record usage if we have a valid template
            if (suggestion && typeof suggestion === 'object' && suggestion.templateId && suggestion.templateId !== 'fallback') {
                try {
                    const result = await this.usageTrackerManager.recordAdUsage(
                        suggestion.templateId, 
                        suggestion.variantIndex || 0, 
                        text, 
                        this.uiManager.getCurrentPost()
                    );
                    
                    if (result.success) {
                        this.uiManager.showNotification(`Ad usage recorded for ${result.groupId}`, 'success');
                    }
                } catch (error) {
                    console.error('Failed to record usage:', error);
                }
            }
            
            // Show success feedback
            const originalText = btnElement.textContent;
            const originalBackground = btnElement.style.background;
            
            btnElement.textContent = 'Copied!';
            btnElement.style.background = '#28a745';
            
            setTimeout(() => {
                btnElement.textContent = originalText;
                btnElement.style.background = originalBackground || '#007bff';
            }, 1500);
            
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.handleCopyFallback(text, btnElement);
        }
    }

    handleCopyFallback(text, btnElement) {
        // Show error feedback
        const originalText = btnElement.textContent;
        btnElement.textContent = 'Failed';
        btnElement.style.background = '#dc3545';
        
        setTimeout(() => {
            btnElement.textContent = originalText;
            btnElement.style.background = '#007bff';
        }, 1500);
        
        // Try fallback method
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.uiManager.showNotification('Text copied using fallback method');
        } catch (fallbackError) {
            this.uiManager.showNotification('Copy failed. Please copy text manually.', 'error');
        }
    }

    // Template Management Methods
    showTemplateForm() {
        this.uiManager.showTemplateForm();
    }

    hideTemplateForm() {
        this.uiManager.hideTemplateForm();
        this.templateManager.clearEditingTemplate();
    }

    async saveTemplate() {
        try {
            const formData = this.uiManager.getTemplateFormData();
            const editingId = this.templateManager.getEditingTemplate();
            
            if (editingId) {
                await this.templateManager.updateTemplate(editingId, formData);
                this.uiManager.showNotification('Template updated successfully!');
            } else {
                await this.templateManager.saveTemplate(formData);
                this.uiManager.showNotification('Template saved successfully!');
            }
            
            this.hideTemplateForm();
            this.renderTemplatesList();
            this.updateTemplateCount();
            
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    async editTemplate(templateId) {
        const template = this.templateManager.getTemplate(templateId);
        if (!template) return;
        
        this.templateManager.setEditingTemplate(templateId);
        this.uiManager.populateTemplateForm(template);
        this.uiManager.showTemplateForm();
    }

    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            await this.templateManager.deleteTemplate(templateId);
            this.uiManager.showNotification('Template deleted successfully!');
            this.renderTemplatesList();
            this.updateTemplateCount();
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }



    renderTemplatesList() {
        const templates = this.templateManager.getTemplates();
        const isProLicense = this.settingsManager.getProLicenseStatus();
        
        this.uiManager.renderTemplatesList(
            templates,
            isProLicense,
            (id) => this.editTemplate(id),
            (id) => this.deleteTemplate(id)
        );
    }

    updateTemplateCount() {
        const count = this.templateManager.getTemplateCount();
        const maxTemplates = this.templateManager.getMaxTemplates();
        this.uiManager.updateTemplateCount(count, maxTemplates);
    }



    async checkLicense() {
        const licenseInfo = await this.settingsManager.checkLicense();
        this.uiManager.updateLicenseStatus(licenseInfo);
        
        // Update template manager with license status
        this.templateManager.setProLicense(licenseInfo.isValid);
    }

    async activateLicense() {
        try {
            const licenseKey = this.uiManager.getLicenseKey();
            await this.settingsManager.activateLicense(licenseKey);
            this.uiManager.showNotification('License activated successfully!');
            await this.checkLicense();
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Post Analysis Methods
    async analyzeCurrentPost() {
        const analyzeBtn = document.getElementById('analyzePostBtn');
        const originalText = analyzeBtn.textContent;
        
        try {
            this.uiManager.setButtonState('analyzePostBtn', 'Analyzing...', true);
            this.uiManager.updatePostContent(null); // Clear previous content
            
            const result = await this.postAnalyzer.analyzeCurrentPost();
            
            if (result.success) {
                if (result.skipped) {
                    this.uiManager.showNotification(result.skipReason || 'Post skipped - you have already commented', 'info');
                    this.uiManager.updatePostContent({
                        content: result.content,
                        groupId: result.groupId,
                        source: 'manual_analysis_skipped',
                        skipped: true,
                        skipReason: result.skipReason,
                        userComments: result.userComments
                    });
                } else {
                    this.uiManager.updatePostContent({
                        content: result.content,
                        groupId: result.groupId,
                        source: 'manual_analysis'
                    });
                    
                    // Generate suggestions
                    const suggestions = await this.postAnalyzer.generateSuggestions(result.content);
                    this.uiManager.displaySuggestions(suggestions);
                }
            }
        } catch (error) {
            this.uiManager.showNotification('Analysis failed: ' + error.message, 'error');
        } finally {
            this.uiManager.setButtonState('analyzePostBtn', originalText, false);
        }
    }

    // Usage Tracking Methods
    async refreshUsageStats() {
        try {
            this.uiManager.showLoadingMessage('usageStatsContent', 'Loading usage statistics...');
            
            const currentGroupId = await this.postAnalyzer.getCurrentGroupId();
            const statsData = await this.usageTrackerManager.getUsageStats(currentGroupId);
            const templates = this.templateManager.getTemplates();
            
            this.uiManager.renderUsageStats(statsData, templates);
        } catch (error) {
            console.error('AdReply: Error loading usage stats:', error);
            this.uiManager.showLoadingMessage('usageStatsContent', 'Error loading usage statistics');
        }
    }

    async exportUsageData() {
        try {
            await this.usageTrackerManager.exportUsageData();
            this.uiManager.showNotification('Usage data exported successfully!', 'success');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    async clearUsageHistory() {
        const confirmed = confirm('Are you sure you want to clear all usage history? This cannot be undone.');
        if (!confirmed) return;

        try {
            await this.usageTrackerManager.clearUsageHistory();
            await this.refreshUsageStats();
            this.uiManager.showNotification('Usage history cleared successfully!', 'success');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Debug Methods
    async debugTemplateMatching() {
        console.log('=== AdReply Debug Info ===');
        console.log('Templates loaded:', this.templateManager.getTemplateCount());
        console.log('Templates:', this.templateManager.getTemplates());
        
        const currentPost = this.uiManager.getCurrentPost();
        if (currentPost) {
            console.log('Current post content:', currentPost.content);
            console.log('Attempting to match templates...');
            
            const matches = await this.postAnalyzer.matchTemplatesWithPost(currentPost.content);
            console.log('Matches found:', matches);
        } else {
            console.log('No current post available');
        }
        
        console.log('Usage tracker available:', !!this.usageTrackerManager.getUsageTracker());
        console.log('=== End Debug Info ===');
    }

    // Default URL Management
    async saveDefaultUrl() {
        const url = document.getElementById('defaultPromoUrl').value;
        
        if (!url) {
            this.uiManager.showNotification('Please enter a URL', 'error');
            return;
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (error) {
            this.uiManager.showNotification('Please enter a valid URL (e.g., https://yourwebsite.com)', 'error');
            return;
        }
        
        try {
            await chrome.storage.local.set({ defaultPromoUrl: url });
            this.uiManager.showNotification('Default URL saved successfully!');
        } catch (error) {
            this.uiManager.showNotification('Failed to save URL', 'error');
        }
    }

    async loadDefaultUrl() {
        try {
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            if (result.defaultPromoUrl) {
                document.getElementById('defaultPromoUrl').value = result.defaultPromoUrl;
            }
        } catch (error) {
            console.error('Failed to load default URL:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new AdReplySidePanel();
    await app.initialize();
    
    // Make debug function available globally for testing
    window.debugTemplateMatching = () => app.debugTemplateMatching();
    window.testSuggestions = async () => {
        console.log('AdReply: Testing suggestion generation...');
        const testContent = "This is a test post about cars and automotive services";
        console.log('AdReply: Testing with content:', testContent);
        const suggestions = await app.postAnalyzer.generateSuggestions(testContent);
        app.uiManager.displaySuggestions(suggestions);
    };
});