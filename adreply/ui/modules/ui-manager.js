// UI management and DOM manipulation
class UIManager {
    constructor() {
        this.currentPost = null;
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
            } else {
                // Will be handled by suggestion generation
                return { needsSuggestions: true };
            }
        } else {
            postContentEl.style.display = 'none';
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
        // Displaying suggestions
        
        const suggestionsEl = document.getElementById('suggestions');
        const listEl = document.getElementById('suggestionsList');
        
        listEl.innerHTML = '';
        
        if (suggestions.length === 0) {
            // No suggestions to display
            listEl.innerHTML = '<div class="no-suggestions">No matching templates found for this post.</div>';
            return;
        }
        
        suggestions.forEach((suggestion, index) => {
            // Handle both string suggestions (fallback) and object suggestions (templates)
            const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
            const templateLabel = typeof suggestion === 'object' ? suggestion.templateLabel : 'Fallback';
            const isRecentlyUsed = typeof suggestion === 'object' && suggestion.recentlyUsed;
            
            const suggestionEl = document.createElement('div');
            suggestionEl.className = isRecentlyUsed ? 'suggestion recently-used' : 'suggestion';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'suggestion-label';
            labelDiv.style.fontSize = '10px';
            labelDiv.style.marginBottom = '4px';
            
            if (isRecentlyUsed) {
                labelDiv.innerHTML = `${templateLabel} <span style="color: #ffc107; font-weight: bold;">⚠️ Recently Used</span>`;
                labelDiv.style.color = '#856404';
            } else {
                labelDiv.textContent = templateLabel;
                labelDiv.style.color = '#6c757d';
            }
            
            const textDiv = document.createElement('div');
            textDiv.textContent = suggestionText;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy to Clipboard';
            copyBtn.addEventListener('click', () => this.onCopyClick(suggestionText, copyBtn, suggestion));
            
            suggestionEl.appendChild(labelDiv);
            suggestionEl.appendChild(textDiv);
            suggestionEl.appendChild(copyBtn);
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

    renderTemplatesList(templates, isProLicense, onEdit, onDelete) {
        const listEl = document.getElementById('templatesList');
        
        if (templates.length === 0) {
            listEl.innerHTML = '<div class="no-suggestions">No templates created yet. Click "Add Template" to get started.</div>';
            return;
        }
        
        listEl.innerHTML = '';
        
        templates.forEach(template => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            
            templateEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px;">
                    <h4 style="margin: 0; font-size: 14px;">${template.label}</h4>
                    <div class="template-actions">
                        <button class="btn btn-small edit-btn">Edit</button>
                        <button class="btn btn-small secondary delete-btn">Delete</button>

                    </div>
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

    updateTemplateCount(count, maxTemplates) {
        const countEl = document.getElementById('templateCount');
        countEl.textContent = `${count} templates (${maxTemplates} max)`;
    }

    showTemplateForm() {
        document.getElementById('templateForm').style.display = 'block';
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
        document.getElementById('templateKeywords').value = '';
        document.getElementById('templateContent').value = '';
        document.getElementById('templateVariants').value = '';
        document.getElementById('templateUrl').value = '';
    }

    populateTemplateForm(template) {
        document.getElementById('templateLabel').value = template.label;
        document.getElementById('templateKeywords').value = template.keywords.join(', ');
        document.getElementById('templateContent').value = template.template;
        document.getElementById('templateVariants').value = template.variants.join('\n');
        document.getElementById('templateUrl').value = template.url || '';
        
        // Change save button to update mode
        const saveBtn = document.getElementById('saveTemplateBtn');
        saveBtn.textContent = 'Update Template';
    }

    getTemplateFormData() {
        return {
            label: document.getElementById('templateLabel').value,
            keywords: document.getElementById('templateKeywords').value,
            content: document.getElementById('templateContent').value,
            variants: document.getElementById('templateVariants').value,
            url: document.getElementById('templateUrl').value
        };
    }



    updateLicenseStatus(licenseInfo) {
        const statusEl = document.getElementById('licenseStatus');
        const detailsEl = document.getElementById('licenseDetails');
        
        if (licenseInfo.isValid) {
            statusEl.textContent = 'License Status: Active';
            statusEl.className = 'license-status valid';
            detailsEl.textContent = `License Key: ${licenseInfo.licenseKey.substring(0, 8)}...`;
        } else {
            statusEl.textContent = 'License Status: Not Activated';
            statusEl.className = 'license-status invalid';
            detailsEl.textContent = 'Please enter your license key to activate AdReply';
        }
    }

    getLicenseKey() {
        return document.getElementById('licenseKey').value;
    }

    renderUsageStats(statsData, templates) {
        const contentEl = document.getElementById('usageStatsContent');
        
        if (!statsData) {
            contentEl.innerHTML = '<div class="loading-message">Usage tracker not available</div>';
            return;
        }

        const { usageData, groupSummary, currentGroupId } = statsData;
        let html = '';
        
        // Current group stats
        if (groupSummary.totalUsages > 0) {
            html += `<div class="usage-group">
                <div class="usage-group-header">Current Group: ${currentGroupId.split('/').pop()}</div>
                <div style="color: #6c757d; font-size: 10px; margin-bottom: 8px;">
                    Total: ${groupSummary.totalUsages} uses | Recent (24h): ${groupSummary.recentUsages} uses
                </div>`;
            
            // Show template usage in this group
            for (const [templateId, stats] of Object.entries(groupSummary.usedTemplates)) {
                const template = templates.find(t => t.id === templateId);
                const templateName = template ? template.label : templateId;
                const isRecentlyUsed = groupSummary.recentUsages > 0;
                
                html += `<div class="usage-template ${isRecentlyUsed ? 'recently-used' : ''}">
                    <div class="usage-template-name">${templateName}</div>
                    <div class="usage-template-stats">
                        Used ${stats.totalUsage} times | Last: ${new Date(stats.lastUsed).toLocaleDateString()}
                    </div>
                </div>`;
            }
            
            html += '</div>';
        }
        
        // All groups summary
        const allGroups = Object.keys(usageData);
        if (allGroups.length > 1) {
            html += `<div class="usage-group">
                <div class="usage-group-header">All Groups (${allGroups.length} total)</div>`;
            
            for (const groupId of allGroups.slice(0, 5)) { // Show top 5
                if (groupId === currentGroupId) continue;
                
                const groupUsage = usageData[groupId] || [];
                const recentUsage = groupUsage.filter(usage => {
                    const usageTime = new Date(usage.timestamp);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return usageTime > dayAgo;
                });
                
                html += `<div style="margin: 4px 0; padding: 4px; background: white; border-radius: 3px;">
                    <div style="font-size: 10px; font-weight: bold;">${groupId.split('/').pop()}</div>
                    <div style="font-size: 9px; color: #6c757d;">
                        Total: ${groupUsage.length} | Recent: ${recentUsage.length}
                    </div>
                </div>`;
            }
            
            html += '</div>';
        }
        
        if (html === '') {
            html = '<div class="loading-message">No usage data found. Start using templates to see statistics.</div>';
        }
        
        contentEl.innerHTML = html;
    }

    showLoadingMessage(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="loading-message">${message}</div>`;
        }
    }

    setButtonState(buttonId, text, disabled = false) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.textContent = text;
            button.disabled = disabled;
        }
    }

    showNotification(message, type = 'success') {
        // Simple notification - could be enhanced with a proper notification system
        alert(message);
    }

    getCurrentPost() {
        return this.currentPost;
    }
}

export default UIManager;