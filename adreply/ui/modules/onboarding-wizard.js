/**
 * OnboardingWizard - AI-powered setup wizard for AdReply
 * Guides users through business description, AI provider selection, and template generation
 */

class OnboardingWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.data = {
            businessDescription: '',
            companyUrl: '',
            aiProvider: 'gemini',
            apiKey: '',
            generatedData: null,
            mergeStrategy: 'merge'
        };
        
        this.storageManager = null;
        this.aiClient = null;
        this.hasExistingData = false;
        
        this.init();
    }

    async init() {
        // Initialize storage manager
        await this.initializeStorage();
        
        // Check for existing data
        await this.checkExistingData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateStepIndicators();
        this.updateButtons();
    }

    async initializeStorage() {
        try {
            // Import storage manager
            if (typeof StorageManager !== 'undefined') {
                this.storageManager = new StorageManager();
                await this.storageManager.initialize();
            } else {
                console.error('StorageManager not available');
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    async checkExistingData() {
        if (!this.storageManager) return;
        
        try {
            const templates = await this.storageManager.getTemplates();
            this.hasExistingData = templates && templates.length > 0;
        } catch (error) {
            console.error('Failed to check existing data:', error);
            this.hasExistingData = false;
        }
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('btnNext').addEventListener('click', () => this.handleNext());
        document.getElementById('btnBack').addEventListener('click', () => this.handleBack());
        document.getElementById('btnSkip').addEventListener('click', () => this.handleSkip());

        // Business description character counter
        const businessDesc = document.getElementById('businessDescription');
        businessDesc.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const counter = document.getElementById('charCount');
            const counterEl = counter.parentElement;
            
            counter.textContent = count;
            
            if (count < 50) {
                counterEl.classList.add('error');
                counterEl.classList.remove('warning');
            } else if (count < 100) {
                counterEl.classList.add('warning');
                counterEl.classList.remove('error');
            } else {
                counterEl.classList.remove('error', 'warning');
            }
        });

        // Provider selection
        document.querySelectorAll('input[name="aiProvider"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.data.aiProvider = e.target.value;
                this.updateProviderSelection();
                this.updateAPIKeyHelp();
            });
        });

        // Provider option visual selection
        document.querySelectorAll('.provider-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.provider-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
            });
        });

        // Merge strategy selection
        document.querySelectorAll('input[name="mergeStrategy"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.data.mergeStrategy = e.target.value;
                this.updateMergeSelection();
            });
        });

        // Merge option visual selection
        document.querySelectorAll('.merge-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.merge-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
            });
        });
    }

    updateProviderSelection() {
        document.querySelectorAll('.provider-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    updateMergeSelection() {
        document.querySelectorAll('.merge-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    updateAPIKeyHelp() {
        const helpBox = document.getElementById('apiKeyHelp');
        const provider = this.data.aiProvider;
        
        if (provider === 'gemini') {
            helpBox.innerHTML = `
                📝 <strong>Get your Gemini API key:</strong><br>
                1. Visit <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a><br>
                2. Click "Get API Key"<br>
                3. Copy and paste it here
            `;
        } else {
            helpBox.innerHTML = `
                📝 <strong>Get your OpenAI API key:</strong><br>
                1. Visit <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a><br>
                2. Create a new API key<br>
                3. Copy and paste it here
            `;
        }
    }

    async handleNext() {
        // Validate current step
        if (!await this.validateStep(this.currentStep)) {
            return;
        }

        // Save current step data
        this.saveStepData(this.currentStep);

        // Special handling for generation step
        if (this.currentStep === 4) {
            await this.startGeneration();
            return;
        }

        // Move to next step
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateStepIndicators();
            this.updateButtons();
        }
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateStepIndicators();
            this.updateButtons();
        }
    }

    async handleSkip() {
        if (confirm('Are you sure you want to skip the setup? You can run it later from settings.')) {
            await this.completeOnboarding(true);
        }
    }

    async validateStep(step) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }

        switch (step) {
            case 1: // Business description
                const desc = document.getElementById('businessDescription').value.trim();
                if (desc.length < 50) {
                    this.showError('Please provide at least 50 characters describing your business.');
                    return false;
                }
                if (desc.length > 1000) {
                    this.showError('Business description must be 1000 characters or less.');
                    return false;
                }
                return true;

            case 2: // Company URL
                const url = document.getElementById('companyUrl').value.trim();
                if (url && !this.isValidUrl(url)) {
                    this.showError('Please enter a valid URL (e.g., https://yourwebsite.com)');
                    return false;
                }
                return true;

            case 3: // AI Provider
                return true; // Always valid, has default

            case 4: // API Key
                const apiKey = document.getElementById('apiKey').value.trim();
                if (!apiKey) {
                    this.showError('Please enter your API key.');
                    return false;
                }
                return true;

            default:
                return true;
        }
    }

    saveStepData(step) {
        switch (step) {
            case 1:
                this.data.businessDescription = document.getElementById('businessDescription').value.trim();
                break;
            case 2:
                this.data.companyUrl = document.getElementById('companyUrl').value.trim();
                break;
            case 3:
                this.data.aiProvider = document.querySelector('input[name="aiProvider"]:checked').value;
                break;
            case 4:
                this.data.apiKey = document.getElementById('apiKey').value.trim();
                break;
        }
    }

    async startGeneration() {
        this.currentStep = 5;
        this.showStep(5);
        this.updateStepIndicators();
        this.updateButtons();

        try {
            // Initialize AI client
            await this.initializeAIClient();

            // Generate setup data
            const generatedData = await this.generateSetup();

            // Store generated data
            this.data.generatedData = generatedData;

            // Show review step
            this.showReviewStep(generatedData);

        } catch (error) {
            console.error('Generation failed:', error);
            this.showGenerationError(error.message);
        }
    }

    async initializeAIClient() {
        try {
            // Dynamically import AI client
            const AIClientModule = await import('../../scripts/ai-client.js');
            const AIClient = AIClientModule.default || AIClientModule.AIClient;
            
            // Create AI client with API key
            this.aiClient = AIClient.create(this.data.aiProvider, this.data.apiKey);
        } catch (error) {
            console.error('Failed to initialize AI client:', error);
            throw new Error('Failed to initialize AI service. Please check your API key.');
        }
    }

    async generateSetup() {
        if (!this.aiClient) {
            throw new Error('AI client not initialized');
        }

        try {
            const result = await this.aiClient.generateSetup(this.data.businessDescription);
            
            // Clear API key from AI client after use
            if (this.aiClient.clearAPIKey) {
                this.aiClient.clearAPIKey();
            }
            
            return result;
        } catch (error) {
            console.error('AI generation error:', error);
            
            // Clear API key even on error
            if (this.aiClient && this.aiClient.clearAPIKey) {
                this.aiClient.clearAPIKey();
            }
            
            throw error;
        }
    }

    showReviewStep(generatedData) {
        this.currentStep = 6;
        this.showStep(6);
        this.updateStepIndicators();
        this.updateButtons();

        const reviewContent = document.getElementById('reviewContent');
        
        let html = '';

        // Show categories
        if (generatedData.categories && generatedData.categories.length > 0) {
            html += '<div class="review-section">';
            html += '<h3>📁 Categories</h3>';
            
            generatedData.categories.forEach(category => {
                const templateCount = category.templates ? category.templates.length : 0;
                html += `
                    <div class="review-item">
                        <div class="review-item-header">
                            <div class="review-item-title">${this.escapeHtml(category.name)}</div>
                            <div class="review-item-count">${templateCount} templates</div>
                        </div>
                        <div class="review-item-content">${this.escapeHtml(category.description || '')}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // Show sample templates
        if (generatedData.categories && generatedData.categories.length > 0) {
            html += '<div class="review-section">';
            html += '<h3>📝 Sample Templates</h3>';
            
            const firstCategory = generatedData.categories[0];
            if (firstCategory.templates && firstCategory.templates.length > 0) {
                firstCategory.templates.slice(0, 3).forEach(template => {
                    const charCount = template.content ? template.content.length : 0;
                    html += `
                        <div class="review-item">
                            <div class="review-item-header">
                                <div class="review-item-title">${this.escapeHtml(template.title)}</div>
                                <div class="review-item-count">${charCount} chars</div>
                            </div>
                            <div class="review-item-content">${this.escapeHtml(template.content || '')}</div>
                        </div>
                    `;
                });
            }
            
            html += '</div>';
        }

        reviewContent.innerHTML = html;

        // Check if we need to show merge/replace step
        if (this.hasExistingData) {
            // Will show merge step on next click
        }
    }

    showGenerationError(message) {
        const generationContent = document.getElementById('generationContent');
        generationContent.innerHTML = `
            <div class="error-message">
                <strong>Generation Failed</strong><br>
                ${this.escapeHtml(message)}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
            </div>
        `;
    }

    async handleReviewNext() {
        if (this.hasExistingData) {
            // Show merge/replace step
            this.currentStep = 7;
            this.showStep(7);
            this.updateStepIndicators();
            this.updateButtons();
        } else {
            // Save directly
            await this.saveGeneratedData();
        }
    }

    async saveGeneratedData() {
        if (!this.storageManager || !this.data.generatedData) {
            console.error('Cannot save: missing storage manager or generated data');
            return;
        }

        try {
            // Show loading
            this.showSavingProgress();

            // Handle merge or replace
            if (this.hasExistingData && this.data.mergeStrategy === 'replace') {
                // Clear existing data
                await this.clearExistingData();
            }

            // Save categories and templates
            const categories = this.data.generatedData.categories || [];
            
            for (const category of categories) {
                // Save category
                await this.storageManager.saveCategory({
                    id: category.id,
                    name: category.name,
                    description: category.description || '',
                    positiveKeywords: category.positiveKeywords || [],
                    negativeKeywords: category.negativeKeywords || [],
                    templateCount: category.templates ? category.templates.length : 0
                });

                // Save templates
                if (category.templates) {
                    for (const template of category.templates) {
                        await this.storageManager.saveTemplate({
                            id: template.id,
                            label: template.title,
                            category: category.id,
                            keywords: template.keywords || [],
                            template: template.content,
                            url: this.data.companyUrl || '',
                            isPrebuilt: false,
                            usageCount: 0
                        });
                    }
                }
            }

            // Save settings
            await this.saveSettings();

            // Complete onboarding
            await this.completeOnboarding(false);

        } catch (error) {
            console.error('Failed to save generated data:', error);
            this.showError('Failed to save your setup. Please try again.');
        }
    }

    async clearExistingData() {
        if (!this.storageManager) return;

        try {
            const templates = await this.storageManager.getTemplates({ isPrebuilt: false });
            for (const template of templates) {
                await this.storageManager.deleteTemplate(template.id);
            }
        } catch (error) {
            console.error('Failed to clear existing data:', error);
        }
    }

    async saveSettings() {
        if (!this.storageManager) return;

        try {
            const settings = await this.storageManager.getSettings();
            
            // Update settings with onboarding data
            settings.businessDescription = this.data.businessDescription;
            settings.companyUrl = this.data.companyUrl;
            settings.aiProvider = this.data.aiProvider;
            settings.onboardingCompleted = true;

            // Encrypt and save API key using encryption utilities
            if (this.data.apiKey) {
                // Import encryption utilities
                const encryptionModule = await import('../../scripts/encryption-utils.js');
                const { encryptAPIKey, clearAPIKeyFromMemory } = encryptionModule;
                
                settings.aiKeyEncrypted = await encryptAPIKey(this.data.apiKey);
                
                // Clear API key from memory after encryption
                clearAPIKeyFromMemory(this.data.apiKey);
                this.data.apiKey = null;
            }

            await this.storageManager.saveSettings(settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    showSavingProgress() {
        this.currentStep = 5;
        this.showStep(5);
        
        const generationContent = document.getElementById('generationContent');
        generationContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <div class="loading-text">Saving your setup...</div>
                <div class="loading-subtext">Almost done!</div>
            </div>
        `;
    }

    async completeOnboarding(skipped) {
        // Show completion step
        this.currentStep = 8;
        this.showStep(8);
        this.updateStepIndicators();
        
        const completionSummary = document.getElementById('completionSummary');
        
        if (skipped) {
            completionSummary.innerHTML = `
                <div class="info-box">
                    You can run the AI Setup Wizard anytime from the Settings page.
                </div>
            `;
        } else {
            const categoryCount = this.data.generatedData?.categories?.length || 0;
            let templateCount = 0;
            
            if (this.data.generatedData?.categories) {
                this.data.generatedData.categories.forEach(cat => {
                    templateCount += cat.templates ? cat.templates.length : 0;
                });
            }
            
            completionSummary.innerHTML = `
                <div class="success-message">
                    ✅ Successfully created ${categoryCount} categories with ${templateCount} templates!
                </div>
            `;
        }

        // Update button to "Get Started"
        const btnNext = document.getElementById('btnNext');
        btnNext.textContent = 'Get Started';
        btnNext.onclick = () => this.finishWizard();
        
        document.getElementById('btnBack').style.display = 'none';
        document.getElementById('btnSkip').style.display = 'none';
    }

    async finishWizard() {
        // Get current tab to close it
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Close the onboarding tab
        if (currentTab) {
            await chrome.tabs.remove(currentTab.id);
        }
        
        // Note: Side panel will be opened when user clicks the extension icon again
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show current step
        const stepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (stepEl) {
            stepEl.classList.add('active');
        }
    }

    updateStepIndicators() {
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            const stepNum = index + 1;
            
            if (stepNum < this.currentStep) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else if (stepNum === this.currentStep) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else {
                indicator.classList.remove('active', 'completed');
            }
        });
    }

    updateButtons() {
        const btnBack = document.getElementById('btnBack');
        const btnNext = document.getElementById('btnNext');
        const btnSkip = document.getElementById('btnSkip');

        // Back button
        if (this.currentStep === 1 || this.currentStep === 5 || this.currentStep === 8) {
            btnBack.style.display = 'none';
        } else {
            btnBack.style.display = 'block';
        }

        // Next button text
        if (this.currentStep === 4) {
            btnNext.textContent = 'Generate Templates';
        } else if (this.currentStep === 6) {
            btnNext.textContent = this.hasExistingData ? 'Continue' : 'Save & Finish';
            btnNext.onclick = () => this.handleReviewNext();
        } else if (this.currentStep === 7) {
            btnNext.textContent = 'Save & Finish';
            btnNext.onclick = () => this.saveGeneratedData();
        } else if (this.currentStep === 8) {
            btnNext.textContent = 'Get Started';
        } else {
            btnNext.textContent = 'Next';
            btnNext.onclick = () => this.handleNext();
        }

        // Hide skip button on certain steps
        if (this.currentStep === 5 || this.currentStep === 8) {
            btnSkip.style.display = 'none';
        } else {
            btnSkip.style.display = 'block';
        }

        // Disable next button on generation step
        if (this.currentStep === 5) {
            btnNext.disabled = true;
            btnNext.style.display = 'none';
        } else {
            btnNext.disabled = false;
            btnNext.style.display = 'block';
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">${this.escapeHtml(message)}</div>
            `;
        } else {
            alert(message);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize wizard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new OnboardingWizard();
    });
} else {
    new OnboardingWizard();
}

export default OnboardingWizard;
