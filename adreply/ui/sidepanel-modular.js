// Main AdReply Side Panel Application - Modular Version
import ConnectionManager from './modules/connection.js';
import PostAnalyzer from './modules/post-analysis.js';
import TemplateManager from './modules/template-manager.js';
import UsageTrackerManager from './modules/usage-tracker.js';
import SettingsManager from './modules/settings-manager.js';
import UIManager from './modules/ui-manager.js';
import PostPublisherUI from './modules/post-publisher-ui.js';

class AdReplySidePanel {
    constructor() {
        // Initialize all managers
        this.connectionManager = new ConnectionManager();
        this.templateManager = new TemplateManager();
        this.usageTrackerManager = new UsageTrackerManager();
        this.settingsManager = new SettingsManager();
        this.uiManager = new UIManager();
        
        // Initialize keyword learning engine
        this.keywordLearningEngine = null;
        this.initializeKeywordLearning();
        
        // Initialize post analyzer with dependencies
        this.postAnalyzer = new PostAnalyzer(
            this.connectionManager,
            this.templateManager,
            this.usageTrackerManager.getUsageTracker(),
            this.keywordLearningEngine
        );
        
        // Initialize post publisher (loaded from script tag in HTML)
        this.postPublisher = null;
        this.postPublisherUI = null;
        this.initializePostPublisher();
        
        // Bind methods to preserve context
        this.refreshData = this.refreshData.bind(this);
        this.onTabChange = this.onTabChange.bind(this);
        this.handleCopyClick = this.handleCopyClick.bind(this);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        // Set up v2.0 feature event listeners
        this.setupV2FeatureListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Set up UI interactions
        this.uiManager.setupTabNavigation(this.onTabChange);
        this.uiManager.setupCopyButtons(this.handleCopyClick);
        this.uiManager.setupRefreshButton(this.refreshData);
        
        // Initialize post publisher editor button
        this.initializePostPublisherEditor();
        
        // Initial refresh
        await this.refreshData();
    }

    /**
     * Set up event listeners for v2.0 features
     */
    setupV2FeatureListeners() {
        // AI Setup Wizard
        const runAIWizardBtn = document.getElementById('runAIWizardBtn');
        if (runAIWizardBtn) {
            runAIWizardBtn.addEventListener('click', () => this.openAIWizard());
        }

        // Clear API Key
        const clearAPIKeyBtn = document.getElementById('clearAPIKeyBtn');
        if (clearAPIKeyBtn) {
            clearAPIKeyBtn.addEventListener('click', () => this.clearAPIKey());
        }

        // Keyword Performance Dashboard
        const viewKeywordPerformanceBtn = document.getElementById('viewKeywordPerformanceBtn');
        if (viewKeywordPerformanceBtn) {
            viewKeywordPerformanceBtn.addEventListener('click', () => this.openKeywordPerformance());
        }

        // Template Marketplace
        const marketplaceLinkBtn = document.getElementById('marketplaceLinkBtn');
        if (marketplaceLinkBtn) {
            marketplaceLinkBtn.addEventListener('click', () => this.openMarketplace());
        }

        // Affiliate Links
        const saveAffiliateLinkBtn = document.getElementById('saveAffiliateLinkBtn');
        if (saveAffiliateLinkBtn) {
            saveAffiliateLinkBtn.addEventListener('click', () => this.saveAffiliateLink());
        }

        const clearAffiliateLinkBtn = document.getElementById('clearAffiliateLinkBtn');
        if (clearAffiliateLinkBtn) {
            clearAffiliateLinkBtn.addEventListener('click', () => this.clearAffiliateLink());
        }

        console.log('AdReply: v2.0 feature listeners set up');
    }

    /**
     * Initialize keyword learning engine
     */
    initializeKeywordLearning() {
        try {
            // Create instance (script is loaded in HTML)
            if (typeof KeywordLearningEngine !== 'undefined') {
                this.keywordLearningEngine = new KeywordLearningEngine();
                console.log('AdReply: Keyword Learning Engine initialized');
            } else {
                console.warn('AdReply: KeywordLearningEngine not available');
            }
        } catch (error) {
            console.error('AdReply: Failed to initialize Keyword Learning Engine:', error);
        }
    }

    /**
     * Initialize post publisher
     */
    initializePostPublisher() {
        try {
            // Create instance (script is loaded in HTML)
            if (typeof PostPublisher !== 'undefined') {
                this.postPublisher = new PostPublisher();
                this.postPublisherUI = new PostPublisherUI(this.postPublisher);
                console.log('AdReply: Post Publisher initialized');
            } else {
                console.warn('AdReply: PostPublisher not available');
            }
        } catch (error) {
            console.error('AdReply: Failed to initialize Post Publisher:', error);
        }
    }

    /**
     * Initialize post publisher UI for template editor
     */
    initializePostPublisherEditor() {
        if (!this.postPublisherUI) {
            return;
        }

        try {
            const templateForm = document.getElementById('templateForm');
            if (templateForm) {
                // Add button to editor with function to get current template content
                this.postPublisherUI.addButtonToEditor(
                    templateForm,
                    () => {
                        const content = document.getElementById('templateContent');
                        return content ? content.value : '';
                    }
                );
                console.log('AdReply: Post Publisher button added to template editor');
            }
        } catch (error) {
            console.error('AdReply: Failed to add Post Publisher button to editor:', error);
        }
    }

    async initialize() {
        // Initialize UI
        this.uiManager.initializeTabs();
        this.uiManager.onTabChange = this.onTabChange;
        this.uiManager.onCopyClick = this.handleCopyClick;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize post publisher UI for template editor
        this.initializePostPublisherEditor();
        
        // Load saved data
        await this.loadInitialData();
        
        // Initial data refresh
        await this.refreshData();
        
        // Set up periodic refresh
        setInterval(this.refreshData, 15000);
    }

    setupEventListeners() {
        // Template management
        document.getElementById('addTemplateBtn').addEventListener('click', async () => await this.showTemplateForm());
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        document.getElementById('cancelTemplateBtn').addEventListener('click', () => this.hideTemplateForm());
        document.getElementById('previewTemplateBtn').addEventListener('click', () => this.previewTemplate());
        
        // Category navigation
        document.getElementById('backToCategoriesBtn').addEventListener('click', () => this.showCategoryView());
        
        // License
        document.getElementById('activateLicense').addEventListener('click', () => this.activateLicense());
        document.getElementById('checkLicense').addEventListener('click', () => this.checkLicense());
        document.getElementById('removeLicenseBtn').addEventListener('click', () => this.removeLicense());
        document.getElementById('upgradeBtn').addEventListener('click', () => this.openUpgradePage());
        
        // AI Setup Wizard
        document.getElementById('runAIWizardBtn').addEventListener('click', () => this.openAIWizard());
        document.getElementById('clearAPIKeyBtn').addEventListener('click', () => this.clearAPIKey());
        
        // Keyword Performance Dashboard
        document.getElementById('viewKeywordPerformanceBtn').addEventListener('click', () => this.openKeywordPerformance());
        
        // Marketplace link in settings
        const marketplaceLinkBtn = document.getElementById('marketplaceLinkBtn');
        if (marketplaceLinkBtn) {
            marketplaceLinkBtn.addEventListener('click', () => this.openMarketplace());
        }
        
        // Affiliate Links
        document.getElementById('saveAffiliateLinkBtn').addEventListener('click', () => this.saveAffiliateLink());
        document.getElementById('clearAffiliateLinkBtn').addEventListener('click', () => this.clearAffiliateLink());
        
        // Post analysis
        document.getElementById('analyzePostBtn').addEventListener('click', () => this.analyzeCurrentPost());
        

        

        
        // Default URL
        document.getElementById('saveDefaultUrlBtn').addEventListener('click', () => this.saveDefaultUrl());

        // Custom category event listeners
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.showCustomCategoryForm());
        document.getElementById('saveCategoryBtn').addEventListener('click', () => this.saveCustomCategory());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.hideCustomCategoryForm());

        // Template import event listener
        const importAdPackBtn = document.getElementById('importAdPackBtn');
        
        if (importAdPackBtn) {
            importAdPackBtn.addEventListener('click', () => this.importTemplates());
        }

        // Marketplace event listener
        const marketplaceBtn = document.getElementById('marketplaceBtn');
        if (marketplaceBtn) {
            marketplaceBtn.addEventListener('click', () => this.openMarketplace());
        }

        // Backup & Restore event listeners
        document.getElementById('backupRestoreBtn').addEventListener('click', () => this.showBackupView());
        document.getElementById('backFromBackupBtn').addEventListener('click', () => this.hideBackupView());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('backupFileInput').click());
        document.getElementById('backupFileInput').addEventListener('change', (e) => this.importData(e));

        // Category selection
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.handleCategoryChange(e.target.value);
            });
        }

        // Template category selection feedback
        const templateCategorySelect = document.getElementById('templateCategory');
        if (templateCategorySelect) {
            templateCategorySelect.addEventListener('change', async (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const categoryName = selectedOption.textContent;
                const categoryId = e.target.value;
                
                // Always save the selected category and show feedback
                await this.uiManager.showCategorySelectionFeedback(categoryName, categoryId);
            });
        }
    }

    async loadInitialData() {
        // Load templates
        await this.templateManager.loadTemplates();
        
        // Initialize category functionality (this will also show the category view)
        await this.initializeCategoryFunctionality();
        
        // Update template counts
        this.updateTemplateCount();
        
        // Check license
        await this.checkLicense();
        
        // Load default URL
        await this.loadDefaultUrl();
        
        // Load affiliate link
        await this.loadAffiliateLink();
        
        // Update API key status
        await this.updateAPIKeyStatus();
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
                const isProLicense = this.settingsManager.getProLicenseStatus();
                const suggestions = await this.postAnalyzer.generateSuggestions(recentPost.content, isProLicense);
                this.uiManager.displaySuggestions(suggestions, this.postPublisherUI);
                
                // Start ignore timers for keyword learning
                if (this.keywordLearningEngine) {
                    this.startIgnoreTimersForSuggestions(suggestions);
                }
            } catch (error) {
                console.error('AdReply: Error generating suggestions:', error);
                this.uiManager.clearSuggestions();
            }
        }
    }

    onTabChange(tabName) {
        // Tab change handling - currently no special actions needed
    }

    async handleCopyClick(text, btnElement, suggestion) {
        console.log('AdReply: Copy clicked!', { text, suggestion });
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Record usage if we have a valid template
            if (suggestion && typeof suggestion === 'object' && suggestion.templateId && suggestion.templateId !== 'fallback') {
                console.log('AdReply: Recording usage for template:', suggestion.templateId);
                
                try {
                    const result = await this.usageTrackerManager.recordAdUsage(
                        suggestion.templateId, 
                        suggestion.variantIndex || 0, 
                        text, 
                        this.uiManager.getCurrentPost()
                    );
                    
                    console.log('AdReply: Usage recording result:', result);
                    
                    if (result && result.success) {
                        console.log('AdReply: Usage recorded successfully for 24h tracking');
                        // No user notification needed - usage tracking is silent
                    } else {
                        console.warn('AdReply: Usage recording failed - no success result');
                    }
                } catch (error) {
                    console.error('AdReply: Failed to record usage:', error);
                    this.uiManager.showNotification('❌ Failed to record usage: ' + error.message, 'error');
                }
                
                // Record template selection for keyword learning
                if (this.keywordLearningEngine) {
                    try {
                        const template = this.templateManager.getTemplate(suggestion.templateId);
                        if (template) {
                            await this.postAnalyzer.recordTemplateSelection(suggestion.templateId, template);
                            console.log('AdReply: Recorded template selection for keyword learning');
                        }
                    } catch (error) {
                        console.error('AdReply: Failed to record selection for learning:', error);
                    }
                }
            } else {
                console.log('AdReply: Not recording usage - invalid suggestion:', suggestion);
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
    async showTemplateForm() {
        await this.uiManager.showTemplateForm();
    }

    hideTemplateForm() {
        this.uiManager.hideTemplateForm();
        this.templateManager.clearEditingTemplate();
        this.showCategoryView();
    }

    async saveTemplate() {
        try {
            const formData = this.uiManager.getTemplateFormData();
            const editingId = this.templateManager.getEditingTemplate();
            
            // Debug: Log the form data to see if URL is being captured
            console.log('AdReply: Saving template with form data:', formData);
            
            // Get category display name for feedback
            const categoryDisplayName = this.uiManager.getCategoryDisplayName(formData.category);
            
            // Save category-specific affiliate link if provided
            if (formData.affiliateLink && formData.affiliateLink.trim().length > 0) {
                await this.saveCategoryAffiliateLink(formData.category, formData.affiliateLink.trim());
            }
            
            if (editingId) {
                const updatedTemplate = await this.templateManager.updateTemplate(editingId, formData);
                console.log('AdReply: Updated template:', updatedTemplate);
                this.uiManager.showTemplateSavedFeedback(formData.label, categoryDisplayName);
            } else {
                const savedTemplate = await this.templateManager.saveTemplate(formData);
                console.log('AdReply: Saved template:', savedTemplate);
                this.uiManager.showTemplateSavedFeedback(formData.label, categoryDisplayName);
            }
            
            this.hideTemplateForm();
            this.updateTemplateCount();
            
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }
    
    async saveCategoryAffiliateLink(categoryId, url) {
        try {
            // Validate URL
            if (!url.match(/^https?:\/\//i)) {
                console.warn('AdReply: Invalid affiliate link URL format');
                return;
            }
            
            // Get current settings
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            
            // Initialize affiliateLinks if not exists
            if (!settings.affiliateLinks) {
                settings.affiliateLinks = {
                    default: '',
                    categoryOverrides: {}
                };
            }
            
            // Update category override
            settings.affiliateLinks.categoryOverrides[categoryId] = url;
            
            // Save to storage
            await chrome.storage.local.set({ settings: settings });
            
            console.log('AdReply: Category affiliate link saved:', categoryId, url);
            
        } catch (error) {
            console.error('AdReply: Failed to save category affiliate link:', error);
        }
    }
    
    async previewTemplate() {
        try {
            const formData = this.uiManager.getTemplateFormData();
            const previewDiv = document.getElementById('templatePreview');
            const previewText = document.getElementById('templatePreviewText');
            
            if (!formData.content) {
                this.uiManager.showNotification('Please enter template content first', 'error');
                return;
            }
            
            // Get settings for rendering
            const result = await chrome.storage.local.get(['settings', 'defaultPromoUrl']);
            const settings = result.settings || {};
            const companyUrl = result.defaultPromoUrl || settings.companyUrl || '';
            
            // Get affiliate link (category-specific or default)
            let affiliateLink = null;
            if (formData.affiliateLink && formData.affiliateLink.trim().length > 0) {
                affiliateLink = formData.affiliateLink.trim();
            } else if (settings.affiliateLinks && settings.affiliateLinks.default) {
                affiliateLink = settings.affiliateLinks.default;
            }
            
            // Render template
            let rendered = formData.content;
            
            // Replace {{link}} placeholder
            if (rendered.includes('{{link}}')) {
                if (affiliateLink) {
                    rendered = rendered.replace(/\{\{link\}\}/g, affiliateLink);
                } else {
                    // Remove lines with {{link}} if no affiliate link
                    rendered = rendered
                        .split('\n')
                        .filter(line => !line.includes('{{link}}'))
                        .join('\n')
                        .trim();
                }
            }
            
            // Append company URL if configured
            if (companyUrl && companyUrl.trim().length > 0) {
                rendered = rendered.trim() + '\n\n' + companyUrl.trim();
            }
            
            // Show preview
            previewText.textContent = rendered;
            previewDiv.style.display = 'block';
            
            // Scroll to preview
            previewDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } catch (error) {
            console.error('AdReply: Failed to preview template:', error);
            this.uiManager.showNotification('Failed to preview template', 'error');
        }
    }

    async editTemplate(templateId) {
        const template = this.templateManager.getTemplate(templateId);
        if (!template) return;
        
        // Load category-specific affiliate link if exists
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            const affiliateLinks = settings.affiliateLinks || { default: '', categoryOverrides: {} };
            
            // Add affiliate link to template object for form population
            if (affiliateLinks.categoryOverrides && affiliateLinks.categoryOverrides[template.category]) {
                template.affiliateLink = affiliateLinks.categoryOverrides[template.category];
            }
        } catch (error) {
            console.error('AdReply: Failed to load category affiliate link:', error);
        }
        
        this.templateManager.setEditingTemplate(templateId);
        this.uiManager.populateTemplateForm(template);
        this.uiManager.showTemplateForm();
    }

    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            await this.templateManager.deleteTemplate(templateId);
            this.uiManager.showNotification('Template deleted successfully!');
            this.showCategoryView();
            this.updateTemplateCount();
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }



    renderTemplatesList() {
        const templates = this.templateManager.getTemplates();
        
        // Show category view by default
        this.uiManager.renderCategoriesList(
            templates,
            (categoryId, categoryName, categoryTemplates) => this.showCategoryTemplates(categoryId, categoryName, categoryTemplates)
        );
        this.uiManager.showCategoryView();
    }

    showCategoryTemplates(categoryId, categoryName, categoryTemplates) {
        this.uiManager.renderTemplatesInCategory(
            categoryTemplates,
            categoryName,
            (id) => this.editTemplate(id),
            (id) => this.deleteTemplate(id)
        );
        this.uiManager.showTemplateView();
    }

    showCategoryView() {
        this.renderTemplatesList();
    }

    async updateTemplateCount() {
        // Get fresh license status
        const licenseInfo = await this.settingsManager.checkLicense();
        const isProLicense = licenseInfo.isValid;
        
        // Update template manager
        this.templateManager.setProLicense(isProLicense);
        
        const count = this.templateManager.getTemplateCount();
        const maxTemplates = this.templateManager.getMaxTemplates();
        
        this.uiManager.updateTemplateCount(count, maxTemplates, isProLicense);
    }



    async checkLicense() {
        const licenseInfo = await this.settingsManager.checkLicense();
        this.uiManager.updateLicenseStatus(licenseInfo);
        
        // Update template manager with license status
        this.templateManager.setProLicense(licenseInfo.isValid);
        
        // Update template count display
        this.updateTemplateCount();
    }

    async activateLicense() {
        try {
            const licenseKey = this.uiManager.getLicenseKey();
            const result = await this.settingsManager.activateLicense(licenseKey);
            
            // Update license status
            await this.checkLicense();
            
            // Update template manager with new license status
            this.templateManager.setProLicense(this.settingsManager.getProLicenseStatus());
            
            // Update template count display
            this.updateTemplateCount();
            
            // Show success message with plan info
            const planDisplay = result.plan ? result.plan.charAt(0).toUpperCase() + result.plan.slice(1) : 'Pro';
            this.uiManager.showNotification(`${planDisplay} license activated successfully! You now have unlimited templates and categories.`, 'success');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    async removeLicense() {
        // Show confirmation dialog
        const confirmed = confirm(
            'Remove License from This Device?\n\n' +
            'This will remove your license from this device and free up an activation slot.\n\n' +
            'You can reactivate on this device or install on a different device using your ' +
            'license token from your account dashboard at teamhandso.me/account.\n\n' +
            'Are you sure you want to continue?'
        );
        
        if (!confirmed) return;
        
        const removeBtn = document.getElementById('removeLicenseBtn');
        const originalText = removeBtn.textContent;
        
        try {
            // Show loading state
            removeBtn.disabled = true;
            removeBtn.textContent = 'Removing...';
            
            // Perform deactivation
            const result = await this.settingsManager.deactivateLicense();
            
            if (result.success) {
                // Update license status
                await this.checkLicense();
                
                // Update template manager with new license status
                this.templateManager.setProLicense(false);
                
                // Update template count display
                this.updateTemplateCount();
                
                // Show success message
                this.uiManager.showNotification('License removed successfully! You can now install on a new device.', 'success');
            } else {
                // Handle specific error cases
                if (result.errorCode === 'ACTIVATION_NOT_FOUND') {
                    // License already deactivated on server, clear locally
                    await this.settingsManager.forceRemoveLicense();
                    await this.checkLicense();
                    this.templateManager.setProLicense(false);
                    this.updateTemplateCount();
                    this.uiManager.showNotification('License was already removed. Local data cleared.', 'info');
                } else if (result.allowLocalRemoval) {
                    // Offer local removal if server is unreachable
                    const forceRemove = confirm(
                        'Unable to contact server. Remove license locally?\n\n' +
                        'This will clear the license from this device, but may not free up ' +
                        'the activation slot on the server. You may need to contact support.\n\n' +
                        'Continue with local removal?'
                    );
                    
                    if (forceRemove) {
                        await this.settingsManager.forceRemoveLicense();
                        await this.checkLicense();
                        this.templateManager.setProLicense(false);
                        this.updateTemplateCount();
                        this.uiManager.showNotification('License removed locally. Contact support if you have issues activating on another device.', 'warning');
                    }
                } else {
                    // Show error message
                    this.uiManager.showNotification(`Failed to remove license: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            this.uiManager.showNotification('Error removing license: ' + error.message, 'error');
        } finally {
            // Restore button state
            removeBtn.disabled = false;
            removeBtn.textContent = originalText;
        }
    }

    openUpgradePage() {
        // Open the upgrade page in a new tab
        chrome.tabs.create({ url: 'https://teamhandso.me/extensions/adreply' });
    }

    openAIWizard() {
        // Open the AI Setup Wizard in a new tab
        chrome.tabs.create({
            url: chrome.runtime.getURL('ui/onboarding.html')
        });
    }

    async clearAPIKey() {
        if (!confirm('Are you sure you want to clear your stored API key? You will need to re-enter it to use AI features.')) {
            return;
        }

        try {
            // Get current settings
            const settings = await chrome.storage.local.get('settings');
            
            if (settings.settings) {
                // Clear the encrypted API key
                delete settings.settings.aiKeyEncrypted;
                delete settings.settings.aiProvider;
                
                // Save updated settings
                await chrome.storage.local.set({ settings: settings.settings });
                
                // Update UI
                this.updateAPIKeyStatus();
                
                this.uiManager.showNotification('✅ API key cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to clear API key:', error);
            this.uiManager.showNotification('❌ Failed to clear API key: ' + error.message, 'error');
        }
    }

    async updateAPIKeyStatus() {
        try {
            const settings = await chrome.storage.local.get('settings');
            const aiKeyStatus = document.getElementById('aiKeyStatus');
            const aiKeyStatusText = document.getElementById('aiKeyStatusText');
            const clearAPIKeyBtn = document.getElementById('clearAPIKeyBtn');
            
            if (settings.settings && settings.settings.aiKeyEncrypted) {
                const provider = settings.settings.aiProvider || 'unknown';
                aiKeyStatus.style.display = 'block';
                aiKeyStatusText.textContent = `✅ API key configured (${provider})`;
                aiKeyStatusText.style.color = '#28a745';
                clearAPIKeyBtn.style.display = 'block';
            } else {
                aiKeyStatus.style.display = 'block';
                aiKeyStatusText.textContent = '⚠️ No API key configured';
                aiKeyStatusText.style.color = '#6c757d';
                clearAPIKeyBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to check API key status:', error);
        }
    }

    openKeywordPerformance() {
        // Open the Keyword Performance Dashboard in a new window
        chrome.windows.create({
            url: chrome.runtime.getURL('ui/keyword-performance.html'),
            type: 'popup',
            width: 1000,
            height: 700
        });
    }

    openMarketplace() {
        // Open the Template Marketplace in a new window
        chrome.windows.create({
            url: chrome.runtime.getURL('ui/marketplace.html'),
            type: 'popup',
            width: 1200,
            height: 800
        });
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
                    const isProLicense = this.settingsManager.getProLicenseStatus();
                    const suggestions = await this.postAnalyzer.generateSuggestions(result.content, isProLicense);
                    this.uiManager.displaySuggestions(suggestions, this.postPublisherUI);
                    
                    // Start ignore timers for keyword learning
                    if (this.keywordLearningEngine) {
                        this.startIgnoreTimersForSuggestions(suggestions);
                    }
                }
            }
        } catch (error) {
            this.uiManager.showNotification('Analysis failed: ' + error.message, 'error');
        } finally {
            this.uiManager.setButtonState('analyzePostBtn', originalText, false);
        }
    }



    // Debug Methods
    async debugTemplateMatching() {
        console.log('=== AdReply Debug Info ===');
        console.log('Templates loaded:', this.templateManager.getTemplateCount());
        
        const templates = this.templateManager.getTemplates();
        console.log('All templates:', templates);
        
        // Show template URLs specifically
        const userTemplates = templates.filter(t => !t.isPrebuilt);
        console.log('User templates with URLs:');
        userTemplates.forEach(template => {
            console.log(`- ${template.label}: URL="${template.url}", Content="${template.template}"`);
        });
        
        // Debug usage tracker
        console.log('Usage tracker manager:', this.usageTrackerManager);
        console.log('Usage tracker available:', !!this.usageTrackerManager.getUsageTracker());
        console.log('Usage tracker instance:', this.usageTrackerManager.getUsageTracker());
        
        // Check if we're on Facebook
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab URL:', tab.url);
            console.log('On Facebook?', tab.url.includes('facebook.com'));
        } catch (error) {
            console.error('Error getting tab info:', error);
        }
        
        const currentPost = this.uiManager.getCurrentPost();
        if (currentPost) {
            console.log('Current post content:', currentPost.content);
            console.log('Attempting to match templates...');
            
            const matches = await this.postAnalyzer.matchTemplatesWithPost(currentPost.content);
            console.log('Matches found:', matches);
        } else {
            console.log('No current post available');
        }
        
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

    // Affiliate Link Management
    async saveAffiliateLink() {
        const urlInput = document.getElementById('defaultAffiliateLink');
        const validationDiv = document.getElementById('affiliateLinkValidation');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.uiManager.showNotification('Please enter an affiliate link URL', 'error');
            return;
        }
        
        // Validate URL
        if (!url.match(/^https?:\/\//i)) {
            validationDiv.textContent = '❌ URL must start with http:// or https://';
            validationDiv.style.color = '#dc3545';
            validationDiv.style.display = 'block';
            return;
        }
        
        try {
            new URL(url);
        } catch (error) {
            validationDiv.textContent = '❌ Invalid URL format';
            validationDiv.style.color = '#dc3545';
            validationDiv.style.display = 'block';
            return;
        }
        
        try {
            // Get current settings
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            
            // Initialize affiliateLinks if not exists
            if (!settings.affiliateLinks) {
                settings.affiliateLinks = {
                    default: '',
                    categoryOverrides: {}
                };
            }
            
            // Update default link
            settings.affiliateLinks.default = url;
            
            // Save to storage
            await chrome.storage.local.set({ settings: settings });
            
            // Show success
            validationDiv.textContent = '✅ Affiliate link saved successfully';
            validationDiv.style.color = '#28a745';
            validationDiv.style.display = 'block';
            
            this.uiManager.showNotification('Affiliate link saved successfully!');
            
            // Hide validation message after 3 seconds
            setTimeout(() => {
                validationDiv.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Failed to save affiliate link:', error);
            validationDiv.textContent = '❌ Failed to save affiliate link';
            validationDiv.style.color = '#dc3545';
            validationDiv.style.display = 'block';
            this.uiManager.showNotification('Failed to save affiliate link', 'error');
        }
    }
    
    async clearAffiliateLink() {
        try {
            // Get current settings
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            
            // Initialize affiliateLinks if not exists
            if (!settings.affiliateLinks) {
                settings.affiliateLinks = {
                    default: '',
                    categoryOverrides: {}
                };
            }
            
            // Clear default link
            settings.affiliateLinks.default = '';
            
            // Save to storage
            await chrome.storage.local.set({ settings: settings });
            
            // Clear input field
            document.getElementById('defaultAffiliateLink').value = '';
            
            // Hide validation message
            const validationDiv = document.getElementById('affiliateLinkValidation');
            validationDiv.style.display = 'none';
            
            this.uiManager.showNotification('Affiliate link cleared successfully!');
            
        } catch (error) {
            console.error('Failed to clear affiliate link:', error);
            this.uiManager.showNotification('Failed to clear affiliate link', 'error');
        }
    }
    
    async loadAffiliateLink() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            
            if (settings.affiliateLinks && settings.affiliateLinks.default) {
                document.getElementById('defaultAffiliateLink').value = settings.affiliateLinks.default;
            }
        } catch (error) {
            console.error('Failed to load affiliate link:', error);
        }
    }

    // Category Management Methods
    async initializeCategoryFunctionality() {
        try {
            await this.loadCategories();
            await this.loadSavedCategoryPreference();
            
            // Refresh the category view to ensure buttons are rendered with updated categories
            this.showCategoryView();
        } catch (error) {
            console.error('Failed to initialize category functionality:', error);
        }
    }

    async loadCategories() {
        try {
            // Get pre-built categories
            const prebuiltCategories = [
                { id: 'automotive', name: 'Automotive Services', description: 'Car repair, maintenance, detailing' },
                { id: 'fitness', name: 'Fitness & Health', description: 'Gyms, personal training, nutrition' },
                { id: 'food', name: 'Food & Restaurants', description: 'Restaurants, catering, food delivery' },
                { id: 'home-services', name: 'Home Services', description: 'Cleaning, repairs, landscaping' },
                { id: 'beauty', name: 'Beauty & Wellness', description: 'Salons, spas, cosmetics' },
                { id: 'real-estate', name: 'Real Estate', description: 'Property sales, rentals' },
                { id: 'technology', name: 'Technology Services', description: 'IT support, web design, software' },
                { id: 'education', name: 'Education & Training', description: 'Courses, tutoring, workshops' },
                { id: 'financial', name: 'Financial Services', description: 'Insurance, loans, accounting' },
                { id: 'legal', name: 'Legal Services', description: 'Lawyers, legal consultants' },
                { id: 'pet-services', name: 'Pet Services', description: 'Veterinary, grooming, pet sitting' },
                { id: 'events', name: 'Event Planning', description: 'Weddings, parties, corporate events' },
                { id: 'photography', name: 'Photography', description: 'Portrait, event, commercial photography' },
                { id: 'crafts', name: 'Crafts & Handmade', description: 'Etsy sellers, artisans, crafters' },
                { id: 'construction', name: 'Construction', description: 'Contractors, builders, renovations' },
                { id: 'transportation', name: 'Transportation', description: 'Moving, delivery, ride services' },
                { id: 'entertainment', name: 'Entertainment', description: 'Musicians, DJs, performers' },
                { id: 'retail', name: 'Retail & E-commerce', description: 'Online stores, boutiques' },
                { id: 'professional', name: 'Professional Services', description: 'Consulting, marketing, design' },
                { id: 'healthcare', name: 'Healthcare', description: 'Medical, dental, therapy' }
            ];

            // Get custom categories from storage
            const result = await chrome.storage.local.get(['customCategories']);
            const customCategories = result.customCategories || [];

            // Get categories from templates (for imported templates with new categories)
            const templates = this.templateManager.getAllTemplates();
            const userTemplates = templates.filter(t => !t.isPrebuilt);
            const templateCategories = new Set();
            
            userTemplates.forEach(template => {
                const categoryId = template.category || 'custom';
                if (categoryId !== 'custom') {
                    templateCategories.add(categoryId);
                }
            });
            
            // Create category objects for template-based categories that aren't in customCategories
            const prebuiltIds = new Set(prebuiltCategories.map(c => c.id));
            const customIds = new Set(customCategories.map(c => c.id));
            const templateBasedCategories = [];
            
            templateCategories.forEach(categoryId => {
                if (!prebuiltIds.has(categoryId) && !customIds.has(categoryId)) {
                    // Create a display name from the category ID
                    const displayName = categoryId
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    templateBasedCategories.push({
                        id: categoryId,
                        name: displayName,
                        description: `Custom category: ${displayName}`,
                        isPrebuilt: false
                    });
                }
            });

            // Combine all categories
            const allCategories = [...prebuiltCategories, ...customCategories, ...templateBasedCategories];

            // Update main category selector
            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect) {
                // Clear existing options and add placeholder
                categorySelect.innerHTML = '<option value="">Select your business category</option>';

                // Add categories to dropdown
                allCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    option.title = category.description;
                    categorySelect.appendChild(option);
                });
            }

            // Update template form category selector
            const templateCategorySelect = document.getElementById('templateCategory');
            if (templateCategorySelect) {
                const currentValue = templateCategorySelect.value;

                // Clear and rebuild options
                templateCategorySelect.innerHTML = '<option value="custom">Custom</option>';

                // Add all categories except 'custom' (it's already added)
                allCategories.filter(cat => cat.id !== 'custom').forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    templateCategorySelect.appendChild(option);
                });

                // Restore selected value if it still exists
                if (currentValue && [...templateCategorySelect.options].some(opt => opt.value === currentValue)) {
                    templateCategorySelect.value = currentValue;
                }
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async handleCategoryChange(categoryId) {
        try {
            // Save the category preference using Chrome storage API
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || { templates: {} };

            if (!settings.templates) {
                settings.templates = {};
            }

            settings.templates.preferredCategory = categoryId;
            await chrome.storage.local.set({ settings });

            // Show feedback to user
            const categorySelect = document.getElementById('categorySelect');
            const selectedOption = categorySelect.options[categorySelect.selectedIndex];
            const categoryName = selectedOption.textContent;

            if (categoryId) {
                this.uiManager.showNotification(`Category preference set to: ${categoryName}`, 'success');
            } else {
                this.uiManager.showNotification('Please select a business category for targeted suggestions', 'info');
            }
        } catch (error) {
            console.error('Failed to save category preference:', error);
            this.uiManager.showNotification('Failed to save category preference', 'error');
        }
    }

    async loadSavedCategoryPreference() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};

            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect && settings.templates?.preferredCategory) {
                categorySelect.value = settings.templates.preferredCategory;
            }
        } catch (error) {
            console.error('Failed to load saved category preference:', error);
        }
    }

    // Custom Category Management
    showCustomCategoryForm() {
        document.getElementById('customCategoryForm').style.display = 'block';
        document.getElementById('newCategoryName').focus();
    }

    hideCustomCategoryForm() {
        document.getElementById('customCategoryForm').style.display = 'none';
        document.getElementById('newCategoryName').value = '';
    }

    async saveCustomCategory() {
        const categoryName = document.getElementById('newCategoryName').value.trim();

        if (!categoryName) {
            this.uiManager.showNotification('Please enter a category name', 'error');
            return;
        }

        // Create category ID from name
        const categoryId = categoryName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);

        if (!categoryId) {
            this.uiManager.showNotification('Please enter a valid category name', 'error');
            return;
        }

        try {
            // Get existing custom categories
            const result = await chrome.storage.local.get(['customCategories']);
            const customCategories = result.customCategories || [];

            // Check category limit for free users
            const isProLicense = this.settingsManager.getProLicenseStatus();
            if (!isProLicense && customCategories.length >= 1) {
                this.uiManager.showNotification('Free license limited to 1 custom category. Upgrade to Pro for unlimited categories and templates.', 'error');
                return;
            }

            // Check if category already exists
            if (customCategories.find(cat => cat.id === categoryId)) {
                this.uiManager.showNotification('A category with this name already exists', 'error');
                return;
            }

            // Add new category
            const newCategory = {
                id: categoryId,
                name: categoryName,
                description: `Custom category: ${categoryName}`,
                isPrebuilt: false,
                createdAt: new Date().toISOString()
            };

            customCategories.push(newCategory);
            await chrome.storage.local.set({ customCategories });

            // Add to dropdown
            const categorySelect = document.getElementById('templateCategory');
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);

            // Select the new category and show visual feedback
            categorySelect.value = categoryId;
            await this.uiManager.showCategorySelectionFeedback(categoryName, categoryId);

            // Hide form
            this.hideCustomCategoryForm();

            // Also update the main category selector
            await this.loadCategories();

        } catch (error) {
            console.error('Failed to save custom category:', error);
            this.uiManager.showNotification('Failed to create category', 'error');
        }
    }

    // Template Import

    async importTemplates() {
        try {
            // Create file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            fileInput.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                try {
                    const fileContent = await this.readFileContent(file);
                    const result = await this.templateManager.importTemplates(fileContent);
                    
                    let message = `Successfully imported ${result.imported} templates`;
                    if (result.skipped > 0) {
                        message += ` (${result.skipped} skipped as duplicates)`;
                    }
                    
                    this.uiManager.showNotification(message, 'success');
                    
                    // IMPORTANT: Reload templates from storage to refresh the UI
                    console.log('🔄 Reloading templates after import...');
                    const reloadedTemplates = await this.templateManager.loadTemplates();
                    console.log('🔄 Reloaded templates count:', reloadedTemplates.length);
                    
                    // Refresh the category view
                    this.showCategoryView();
                    await this.updateTemplateCount();
                    
                    const finalCount = this.templateManager.getTemplateCount();
                    console.log('✅ Import complete and UI refreshed. Final count:', finalCount);
                    console.log('✅ Template manager templates array length:', this.templateManager.templates.length);
                    
                } catch (error) {
                    console.error('❌ Import error:', error);
                    this.uiManager.showNotification(error.message, 'error');
                }
            };
            
            fileInput.click();
            
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Backup & Restore Methods
    showBackupView() {
        // Hide category and template views
        document.getElementById('categoryView').style.display = 'none';
        document.getElementById('templateView').style.display = 'none';
        document.getElementById('templateForm').style.display = 'none';
        document.getElementById('templateCount').parentElement.style.display = 'none';
        
        // Show backup view
        document.getElementById('backupView').style.display = 'block';
        
        // Load last backup time
        this.loadLastBackupTime();
    }

    hideBackupView() {
        // Hide backup view
        document.getElementById('backupView').style.display = 'none';
        
        // Show category view and stats
        document.getElementById('templateCount').parentElement.style.display = 'block';
        this.showCategoryView();
    }

    loadLastBackupTime() {
        chrome.storage.local.get(['lastBackup'], (result) => {
            const lastBackupEl = document.getElementById('lastBackupTime');
            if (result.lastBackup) {
                const date = new Date(result.lastBackup);
                lastBackupEl.textContent = this.formatBackupDate(date);
            } else {
                lastBackupEl.textContent = 'Never';
            }
        });
    }

    formatBackupDate(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        if (targetDate.getTime() === today.getTime()) {
            return `Today, ${timeStr}`;
        } else if (targetDate.getTime() === today.getTime() - 86400000) {
            return `Yesterday, ${timeStr}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    showBackupMessage(text, type = 'success') {
        const messageEl = document.getElementById('backupMessage');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    exportData() {
        chrome.storage.local.get(null, (data) => {
            if (chrome.runtime.lastError) {
                this.showBackupMessage('Error reading data: ' + chrome.runtime.lastError.message, 'error');
                return;
            }

            // Create backup object with metadata
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: data
            };

            // Convert to JSON
            const jsonStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `adreply-backup-${timestamp}.json`;

            // Create temporary download link (no downloads permission needed)
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            
            // Trigger download
            downloadLink.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }, 100);

            // Save backup timestamp
            const now = new Date().toISOString();
            chrome.storage.local.set({ lastBackup: now }, () => {
                this.loadLastBackupTime();
                this.showBackupMessage('✓ Data exported successfully!');
            });
        });
    }

    importData(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }

        // Reset file input
        event.target.value = '';

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const backup = JSON.parse(content);

                // Validate backup structure
                if (!backup.data || typeof backup.data !== 'object') {
                    throw new Error('Invalid backup file format');
                }

                // Confirm before overwriting
                const confirmMsg = 'This will replace all current data. Continue?';
                if (!confirm(confirmMsg)) {
                    this.showBackupMessage('Import cancelled', 'error');
                    return;
                }

                // Clear existing data and import new data
                chrome.storage.local.clear(async () => {
                    // First, set all the backup data
                    chrome.storage.local.set(backup.data, async () => {
                        if (chrome.runtime.lastError) {
                            this.showBackupMessage('Error importing data: ' + chrome.runtime.lastError.message, 'error');
                            return;
                        }

                        // If there's a license key in the old format, activate it properly
                        if (backup.data.licenseKey) {
                            console.log('🔐 Found license key in backup, activating...');
                            try {
                                const response = await chrome.runtime.sendMessage({
                                    type: 'SET_LICENSE',
                                    token: backup.data.licenseKey
                                });
                                
                                if (response && response.valid) {
                                    console.log('✅ License activated from backup');
                                } else {
                                    console.warn('⚠️ License activation failed:', response.error);
                                }
                            } catch (error) {
                                console.error('❌ Error activating license:', error);
                            }
                        }

                        // Save import timestamp
                        const now = new Date().toISOString();
                        chrome.storage.local.set({ lastBackup: now }, () => {
                            this.loadLastBackupTime();
                            this.showBackupMessage('✓ Data imported successfully!');
                            
                            // Reload the page to reflect imported data
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        });
                    });
                });

            } catch (error) {
                this.showBackupMessage('Invalid JSON file: ' + error.message, 'error');
            }
        };

        reader.onerror = () => {
            this.showBackupMessage('Error reading file', 'error');
        };

        reader.readAsText(file);
    }

    /**
     * Start ignore timers for displayed suggestions
     * @param {Array} suggestions - Array of suggestion objects
     */
    startIgnoreTimersForSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return;
        }

        // Clear any existing timers first
        this.postAnalyzer.clearAllIgnoreTimers();

        // Start timer for each valid suggestion
        for (const suggestion of suggestions) {
            if (suggestion && typeof suggestion === 'object' && 
                suggestion.templateId && suggestion.templateId !== 'fallback' &&
                !suggestion.isLimitMessage) {
                
                const template = this.templateManager.getTemplate(suggestion.templateId);
                if (template) {
                    this.postAnalyzer.startIgnoreTimer(suggestion.templateId, template);
                }
            }
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
        app.uiManager.displaySuggestions(suggestions, app.postPublisherUI);
    };
    window.testEtsySuggestions = async () => {
        console.log('AdReply: Testing Etsy suggestion generation...');
        const testContent = "Beautiful handmade jewelry! Love the craftsmanship.";
        console.log('AdReply: Testing with Etsy content:', testContent);
        const suggestions = await app.postAnalyzer.generateSuggestions(testContent);
        app.uiManager.displaySuggestions(suggestions, app.postPublisherUI);
    };

});