// UI management and DOM manipulation
class UIManager {
    constructor() {
        this.currentPost = null;
        this.lastProcessedPostContent = null;
    }

    initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Trigger tab-specific actions
                this.onTabChange(targetTab);
            });
        });
    }

    onTabChange(tabName) {
        // Override in main app to handle tab changes
    }

    updateStatus(groupInfo, isConnected) {
        const statusEl = document.getElementById('status');
        
        if (isConnected && groupInfo && groupInfo.name) {
            statusEl.className = 'status active';
            statusEl.textContent = `Connected to: ${groupInfo.name}`;
        } else if (isConnected) {
            statusEl.className = 'status active';
            statusEl.textContent = 'Extension ready';
        } else {
            statusEl.className = 'status inactive';
            statusEl.textContent = 'Not connected to background script';
        }
    }

    updatePostContent(postData) {
        const postContentEl = document.getElementById('postContent');
        const postTextEl = document.getElementById('postText');
        
        if (postData && postData.content && postData.source !== 'test') {
            this.currentPost = postData;
            postTextEl.textContent = postData.content;
            postContentEl.style.display = 'block';
            
            if (postData.skipped) {
                this.showSkipMessage(postData);
                this.lastProcessedPostContent = postData.content; // Update to prevent reprocessing
            } else {
                // Only generate suggestions if this is new content
                if (this.lastProcessedPostContent !== postData.content) {
                    this.lastProcessedPostContent = postData.content;
                    return { needsSuggestions: true };
                }
            }
        } else {
            postContentEl.style.display = 'none';
            this.lastProcessedPostContent = null; // Reset when no post
            this.clearSuggestions();
        }
        
        return { needsSuggestions: false };
    }

    showSkipMessage(postData) {
        const listEl = document.getElementById('suggestionsList');
        let skipMessage = `<div class="skip-message">
            <div class="skip-icon">⚠️</div>
            <div class="skip-text">
                <strong>Analysis Skipped</strong><br>
                ${postData.skipReason || 'You have already commented on this post'}
            </div>
        </div>`;
        
        if (postData.userComments && postData.userComments.length > 0) {
            skipMessage += `<div class="user-comments">
                <strong>Your existing comments:</strong>
                <ul>`;
            for (const comment of postData.userComments.slice(0, 3)) {
                skipMessage += `<li>${comment}</li>`;
            }
            skipMessage += `</ul></div>`;
        }
        
        listEl.innerHTML = skipMessage;
    }

    displaySuggestions(suggestions) {
        console.log('AdReply: Displaying suggestions:', suggestions.length, suggestions);
        
        const suggestionsEl = document.getElementById('suggestions');
        const listEl = document.getElementById('suggestionsList');
        
        listEl.innerHTML = '';
        
        if (suggestions.length === 0) {
            console.log('AdReply: No suggestions to display');
            listEl.innerHTML = '<div class="no-suggestions">No matching templates found for this post.</div>';
            return;
        }
        
        suggestions.forEach((suggestion, index) => {
            // Handle both string suggestions (fallback) and object suggestions (templates)
            const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
            const templateLabel = typeof suggestion === 'object' ? suggestion.templateLabel : 'Fallback';
            const isRecentlyUsed = typeof suggestion === 'object' && suggestion.recentlyUsed;
            const isLimitMessage = typeof suggestion === 'object' && suggestion.isLimitMessage;
            
            const suggestionEl = document.createElement('div');
            
            // Special styling for limit messages
            if (isLimitMessage) {
                suggestionEl.className = 'suggestion limit-message';
                suggestionEl.style.background = '#fff3cd';
                suggestionEl.style.border = '1px solid #ffeaa7';
                suggestionEl.style.color = '#856404';
            } else {
                suggestionEl.className = isRecentlyUsed ? 'suggestion recently-used' : 'suggestion';
            }
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'suggestion-label';
            labelDiv.style.fontSize = '10px';
            labelDiv.style.marginBottom = '4px';
            
            if (isRecentlyUsed) {
                labelDiv.innerHTML = `${templateLabel} <span style="color: #ffc107; font-weight: bold;">⚠️ Recently Used</span>`;
                labelDiv.style.color = '#856404';
            } else {
                labelDiv.textContent = templateLabel;
                labelDiv.style.color = isLimitMessage ? '#856404' : '#6c757d';
            }
            
            const textDiv = document.createElement('div');
            textDiv.textContent = suggestionText;
            
            // Don't add copy button for limit messages
            if (!isLimitMessage) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = 'Copy to Clipboard';
                copyBtn.addEventListener('click', () => this.onCopyClick(suggestionText, copyBtn, suggestion));
                suggestionEl.appendChild(copyBtn);
            } else {
                // Add upgrade button for limit messages
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'copy-btn';
                upgradeBtn.style.background = '#28a745';
                upgradeBtn.textContent = 'Upgrade to Pro';
                upgradeBtn.addEventListener('click', () => {
                    // Switch to license tab
                    const licenseTab = document.querySelector('[data-tab="license"]');
                    if (licenseTab) licenseTab.click();
                });
                suggestionEl.appendChild(upgradeBtn);
            }
            
            suggestionEl.appendChild(labelDiv);
            suggestionEl.appendChild(textDiv);
            listEl.appendChild(suggestionEl);
        });
        
        suggestionsEl.style.display = 'block';
    }

    onCopyClick(text, btnElement, suggestion) {
        // Override in main app to handle copy functionality
    }

    clearSuggestions() {
        const listEl = document.getElementById('suggestionsList');
        listEl.innerHTML = '<div class="no-suggestions">No suggestions available. Navigate to a Facebook group and view posts to get started.</div>';
    }

    renderCategoriesList(templates, onCategoryClick) {
        const categoriesEl = document.getElementById('categoriesList');
        
        // Only show user-created templates
        const userTemplates = templates.filter(template => !template.isPrebuilt);
        
        if (userTemplates.length === 0) {
            categoriesEl.innerHTML = '<div class="no-suggestions">No custom templates created yet. Click "Add Template" to get started.</div>';
            return;
        }
        
        // Group templates by category
        const categoriesMap = {};
        userTemplates.forEach(template => {
            const categoryId = template.category || 'custom';
            if (!categoriesMap[categoryId]) {
                categoriesMap[categoryId] = [];
            }
            categoriesMap[categoryId].push(template);
        });
        
        categoriesEl.innerHTML = '';
        
        // Render each category
        Object.entries(categoriesMap).forEach(([categoryId, categoryTemplates]) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            
            const categoryDisplay = this.getCategoryDisplayName(categoryId);
            const templateCount = categoryTemplates.length;
            
            categoryEl.innerHTML = `
                <h4>📁 ${categoryDisplay}</h4>
                <div class="category-count">${templateCount} template${templateCount !== 1 ? 's' : ''}</div>
            `;
            
            categoryEl.addEventListener('click', () => onCategoryClick(categoryId, categoryDisplay, categoryTemplates));
            
            categoriesEl.appendChild(categoryEl);
        });
    }

    renderTemplatesInCategory(categoryTemplates, categoryName, onEdit, onDelete) {
        const listEl = document.getElementById('templatesList');
        const titleEl = document.getElementById('currentCategoryTitle');
        
        // Update title
        titleEl.textContent = `${categoryName} Templates`;
        
        listEl.innerHTML = '';
        
        categoryTemplates.forEach(template => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            
            // Compact template display
            templateEl.innerHTML = `
                <h4>${template.label}</h4>
                <div class="template-actions">
                    <button class="btn btn-small edit-btn">Edit</button>
                    <button class="btn btn-small secondary delete-btn">Delete</button>
                </div>
            `;
            
            // Add event listeners
            const editBtn = templateEl.querySelector('.edit-btn');
            const deleteBtn = templateEl.querySelector('.delete-btn');
            
            if (editBtn) editBtn.addEventListener('click', () => onEdit(template.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => onDelete(template.id));
            
            listEl.appendChild(templateEl);
        });
    }

    showCategoryView() {
        document.getElementById('categoryView').style.display = 'block';
        document.getElementById('templateView').style.display = 'none';
    }

    showTemplateView() {
        document.getElementById('categoryView').style.display = 'none';
        document.getElementById('templateView').style.display = 'block';
    }

    getCategoryDisplayName(categoryId) {
        // Map category IDs to display names
        const categoryMap = {
            'custom': 'Custom',
            'automotive': 'Automotive Services',
            'fitness': 'Fitness & Health',
            'food': 'Food & Restaurants',
            'home-services': 'Home Services',
            'beauty': 'Beauty & Wellness',
            'real-estate': 'Real Estate',
            'technology': 'Technology Services',
            'education': 'Education & Training',
            'financial': 'Financial Services',
            'legal': 'Legal Services',
            'pet-services': 'Pet Services',
            'events': 'Event Planning',
            'photography': 'Photography',
            'crafts': 'Crafts & Handmade',
            'construction': 'Construction',
            'transportation': 'Transportation',
            'entertainment': 'Entertainment',
            'retail': 'Retail & E-commerce',
            'professional': 'Professional Services',
            'healthcare': 'Healthcare'
        };
        
        return categoryMap[categoryId] || categoryId;
    }

    updateTemplateCount(count, maxTemplates, isProLicense = false) {
        const countEl = document.getElementById('templateCount');
        if (!countEl) return;
        
        const userTemplates = count.userTemplates || 0;
        const prebuiltTemplates = count.prebuiltTemplates || 0;
        
        // Check if Pro license by multiple indicators
        const isPro = isProLicense || maxTemplates === 'unlimited' || maxTemplates === Infinity;
        
        if (isPro) {
            countEl.textContent = `${userTemplates} custom templates (unlimited categories & templates) + ${prebuiltTemplates} prebuilt`;
            countEl.style.color = '#28a745'; // Green for Pro
            countEl.style.fontWeight = '500';
        } else {
            countEl.textContent = `${userTemplates}/${maxTemplates} custom templates (1 category max) + ${prebuiltTemplates} prebuilt`;
            countEl.style.color = '#6c757d'; // Gray for Free
            countEl.style.fontWeight = 'normal';
        }
        
        // Show the template stats buttons (they're now always visible for better mobile UX)
        const statsButtonsEl = document.querySelector('.template-stats-buttons');
        if (statsButtonsEl) {
            statsButtonsEl.style.display = 'flex';
        }
    }

    async showTemplateForm() {
        document.getElementById('templateForm').style.display = 'block';
        
        // Load and set the last selected category
        await this.loadLastSelectedCategory();
    }

    async loadLastSelectedCategory() {
        try {
            // Get the last selected category from storage
            const result = await chrome.storage.local.get(['lastSelectedCategory']);
            const lastCategory = result.lastSelectedCategory || 'custom';
            
            // Set the dropdown to the last selected category
            const categorySelect = document.getElementById('templateCategory');
            if (categorySelect) {
                // Check if the category option exists in the dropdown
                const optionExists = [...categorySelect.options].some(opt => opt.value === lastCategory);
                if (optionExists) {
                    categorySelect.value = lastCategory;
                } else {
                    categorySelect.value = 'custom';
                }
            }
            
            // Update the category indicator
            const categoryDisplayName = this.getCategoryDisplayName(categorySelect.value);
            const indicator = document.getElementById('selectedCategoryIndicator');
            const categoryNameSpan = document.getElementById('selectedCategoryName');
            
            if (indicator && categoryNameSpan) {
                categoryNameSpan.textContent = categoryDisplayName;
                indicator.style.display = 'block';
            }
            
            // Show a subtle visual indicator if we remembered a non-default category
            if (lastCategory !== 'custom' && categorySelect.value === lastCategory) {
                // Add a subtle visual indicator to the dropdown
                if (categorySelect) {
                    categorySelect.style.borderColor = '#17a2b8';
                    categorySelect.style.boxShadow = '0 0 0 2px rgba(23, 162, 184, 0.25)';
                    
                    setTimeout(() => {
                        categorySelect.style.borderColor = '#ced4da';
                        categorySelect.style.boxShadow = 'none';
                    }, 2000);
                }
            }
            
        } catch (error) {
            console.error('Failed to load last selected category:', error);
            // Fallback to default
            const indicator = document.getElementById('selectedCategoryIndicator');
            const categoryNameSpan = document.getElementById('selectedCategoryName');
            
            if (indicator && categoryNameSpan) {
                categoryNameSpan.textContent = 'Custom';
                indicator.style.display = 'block';
            }
        }
    }

    async saveLastSelectedCategory(categoryId) {
        try {
            await chrome.storage.local.set({ lastSelectedCategory: categoryId });
            console.log('AdReply: Saved last selected category:', categoryId);
        } catch (error) {
            console.error('Failed to save last selected category:', error);
        }
    }

    hideTemplateForm() {
        document.getElementById('templateForm').style.display = 'none';
        this.clearTemplateForm();
        
        // Reset save button
        const saveBtn = document.getElementById('saveTemplateBtn');
        saveBtn.textContent = 'Save Template';
    }

    clearTemplateForm() {
        document.getElementById('templateLabel').value = '';
        document.getElementById('templateCategory').value = 'custom';
        document.getElementById('templateKeywords').value = '';
        document.getElementById('templateContent').value = '';
        document.getElementById('templateUrl').value = '';
        
        // Hide category indicator
        const indicator = document.getElementById('selectedCategoryIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    populateTemplateForm(template) {
        document.getElementById('templateLabel').value = template.label;
        document.getElementById('templateCategory').value = template.category || 'custom';
        document.getElementById('templateKeywords').value = template.keywords.join(', ');
        document.getElementById('templateContent').value = template.template;
        document.getElementById('templateUrl').value = template.url || '';
        
        // Show category indicator
        const categoryDisplayName = this.getCategoryDisplayName(template.category || 'custom');
        const indicator = document.getElementById('selectedCategoryIndicator');
        const categoryNameSpan = document.getElementById('selectedCategoryName');
        
        if (indicator && categoryNameSpan) {
            categoryNameSpan.textContent = categoryDisplayName;
            indicator.style.display = 'block';
        }
        
        // Change save button to update mode
        const saveBtn = document.getElementById('saveTemplateBtn');
        saveBtn.textContent = 'Update Template';
    }

    getTemplateFormData() {
        return {
            label: document.getElementById('templateLabel').value,
            category: document.getElementById('templateCategory').value,
            keywords: document.getElementById('templateKeywords').value,
            content: document.getElementById('templateContent').value,
            url: document.getElementById('templateUrl').value
        };
    }



    updateLicenseStatus(licenseInfo) {
        const statusEl = document.getElementById('licenseStatus');
        const detailsEl = document.getElementById('licenseDetails');
        const removeLicenseSection = document.getElementById('removeLicenseSection');
        
        if (licenseInfo && licenseInfo.isValid) {
            const plan = licenseInfo.tier || licenseInfo.plan || 'Pro';
            const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
            
            statusEl.textContent = `License Status: ${planDisplay} (Active)`;
            statusEl.className = 'license-status valid';
            
            // Show detailed license info
            let details = `✓ Unlimited custom templates\n✓ Unlimited categories\n✓ All premium features`;
            
            // Add activation info if available
            if (licenseInfo.activationInfo) {
                const { currentActivations, maxActivations } = licenseInfo.activationInfo;
                if (maxActivations !== Infinity && maxActivations > 0) {
                    details += `\n✓ Device activations: ${currentActivations}/${maxActivations}`;
                }
            }
            
            detailsEl.textContent = details;
            detailsEl.style.whiteSpace = 'pre-line';
            detailsEl.style.color = '#28a745';
            
            // Show remove license section
            if (removeLicenseSection) {
                removeLicenseSection.style.display = 'block';
            }
        } else {
            statusEl.textContent = 'License Status: Free';
            statusEl.className = 'license-status invalid';
            detailsEl.textContent = 'Free license: 10 templates maximum, 1 category only';
            detailsEl.style.color = '#6c757d';
            
            // Hide remove license section
            if (removeLicenseSection) {
                removeLicenseSection.style.display = 'none';
            }
        }
    }

    getLicenseKey() {
        return document.getElementById('licenseKey').value;
    }



    setButtonState(buttonId, text, disabled = false) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.textContent = text;
            button.disabled = disabled;
        }
    }

    showNotification(message, type = 'success') {
        // Create a better notification system instead of alert
        this.showToast(message, type);
    }

    showToast(message, type = 'success') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        toast.style.backgroundColor = colors[type] || colors.success;
        if (type === 'warning') {
            toast.style.color = '#212529';
        }

        toast.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 300);
        }, 3000);
    }

    async showCategorySelectionFeedback(categoryName, categoryId) {
        // Show visual feedback when category is selected
        const categorySelect = document.getElementById('templateCategory');
        const indicator = document.getElementById('selectedCategoryIndicator');
        const categoryNameSpan = document.getElementById('selectedCategoryName');
        
        if (categorySelect) {
            // Add a temporary visual indicator
            categorySelect.style.borderColor = '#28a745';
            categorySelect.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.25)';
            
            setTimeout(() => {
                categorySelect.style.borderColor = '#ced4da';
                categorySelect.style.boxShadow = 'none';
            }, 1500);
        }
        
        // Show the category indicator
        if (indicator && categoryNameSpan) {
            categoryNameSpan.textContent = categoryName;
            indicator.style.display = 'block';
        }
        
        // Save the selected category for next time
        if (categoryId) {
            await this.saveLastSelectedCategory(categoryId);
        }
        
        this.showToast(`Category selected: ${categoryName}`, 'success');
    }

    showTemplateSavedFeedback(templateName, categoryName) {
        this.showToast(`Template "${templateName}" saved to category: ${categoryName}`, 'success');
    }

    getCurrentPost() {
        return this.currentPost;
    }
}

export default UIManager;