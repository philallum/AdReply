// AdReply Side Panel JavaScript
let currentPost = null;
let isConnected = false;

// Test connection to background script
async function testConnection() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'PING' });
        isConnected = response && response.success;
        return isConnected;
    } catch (error) {
        isConnected = false;
        return false;
    }
}

// Tab management
function initializeTabs() {
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
        });
    });
}

// Get recent posts from background
async function getRecentPosts() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_RECENT_POSTS' });
        
        if (response && response.success && response.posts && response.posts.length > 0) {
            updatePostContent(response.posts[0]); // Show most recent post
        } else {
            updatePostContent(null);
        }
    } catch (error) {
        updatePostContent(null);
    }
}

// Get current group info from background
async function getCurrentGroup() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_GROUP' });
        if (response && response.success) {
            updateStatus(response.groupInfo);
        } else {
            updateStatus(null);
        }
    } catch (error) {
        updateStatus(null);
    }
}

function updateStatus(groupInfo) {
    const statusEl = document.getElementById('status');
    
    if (isConnected && groupInfo && groupInfo.name) {
        statusEl.className = 'status active';
        statusEl.textContent = `Connected to: ${groupInfo.name}`;
    } else if (isConnected) {
        statusEl.className = 'status active';
        statusEl.textContent = 'Extension active - Navigate to a Facebook group';
    } else {
        statusEl.className = 'status inactive';
        statusEl.textContent = 'Not connected to background script';
    }
}

function updatePostContent(postData) {
    const postContentEl = document.getElementById('postContent');
    const postTextEl = document.getElementById('postText');
    
    if (postData && postData.content && postData.source !== 'test') {
        currentPost = postData;
        postTextEl.textContent = postData.content;
        postContentEl.style.display = 'block';
        
        // Generate suggestions
        generateSuggestions(postData.content);
    } else {
        postContentEl.style.display = 'none';
        
        // Clear suggestions
        const listEl = document.getElementById('suggestionsList');
        listEl.innerHTML = '<div class="no-suggestions">No suggestions available. Navigate to a Facebook group and view posts to get started.</div>';
    }
}

function generateSuggestions(postContent) {
    const suggestions = [];
    
    // Match templates based on keywords
    const matchedTemplates = matchTemplatesWithPost(postContent);
    
    if (matchedTemplates.length > 0) {
        // Use matched templates
        for (const match of matchedTemplates.slice(0, 3)) { // Top 3 matches
            const template = match.template;
            const variant = match.variant;
            
            // Format the suggestion with URL appended
            let suggestion = variant || template.template;
            
            // Replace placeholders (basic implementation)
            suggestion = suggestion.replace(/{site}/g, template.url || 'our website');
            
            // Append URL if it exists and isn't already in the text
            if (template.url && !suggestion.includes(template.url)) {
                suggestion += ` ${template.url}`;
            }
            
            suggestions.push({
                text: suggestion,
                templateId: template.id,
                templateLabel: template.label
            });
        }
    } else {
        // Fallback suggestions with default URL from settings
        chrome.storage.local.get(['defaultUrl'], (result) => {
            const defaultUrl = result.defaultUrl || '';
            
            if (postContent.toLowerCase().includes('car') || postContent.toLowerCase().includes('auto')) {
                suggestions.push({
                    text: `Great car! For automotive services, check us out!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Auto Fallback'
                });
            }
            
            if (postContent.toLowerCase().includes('fitness') || postContent.toLowerCase().includes('gym')) {
                suggestions.push({
                    text: `Looking strong! Need a personal trainer? We can help!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Fitness Fallback'
                });
            }
            
            if (postContent.toLowerCase().includes('food') || postContent.toLowerCase().includes('restaurant')) {
                suggestions.push({
                    text: `Looks delicious! For catering services, contact us!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Food Fallback'
                });
            }
            
            // Default suggestion
            if (suggestions.length === 0) {
                suggestions.push({
                    text: `Great post! Check out our services if you need help with this!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Default Fallback'
                });
            }
            
            displaySuggestions(suggestions);
        });
        return; // Exit early for async fallback
    }
    
    displaySuggestions(suggestions);
}

function matchTemplatesWithPost(postContent) {
    const matches = [];
    const postWords = postContent.toLowerCase().split(/\s+/);
    
    for (const template of templates) {
        let score = 0;
        
        // Calculate relevance score based on keyword matches
        for (const keyword of template.keywords) {
            if (postWords.some(word => word.includes(keyword.toLowerCase()))) {
                score += 1;
            }
        }
        
        if (score > 0) {
            // Add main template
            matches.push({
                template,
                variant: template.template,
                score
            });
            
            // Add variants
            for (const variant of template.variants) {
                matches.push({
                    template,
                    variant,
                    score
                });
            }
        }
    }
    
    // Sort by score (highest first) and return top matches
    return matches.sort((a, b) => b.score - a.score);
}

function displaySuggestions(suggestions) {
    const suggestionsEl = document.getElementById('suggestions');
    const listEl = document.getElementById('suggestionsList');
    
    listEl.innerHTML = '';
    
    if (suggestions.length === 0) {
        listEl.innerHTML = '<div class="no-suggestions">No matching templates found for this post.</div>';
        return;
    }
    
    suggestions.forEach((suggestion, index) => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'suggestion';
        
        // Handle both string suggestions (fallback) and object suggestions (templates)
        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
        const templateLabel = typeof suggestion === 'object' ? suggestion.templateLabel : 'Fallback';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'suggestion-label';
        labelDiv.textContent = templateLabel;
        labelDiv.style.fontSize = '10px';
        labelDiv.style.color = '#6c757d';
        labelDiv.style.marginBottom = '4px';
        
        const textDiv = document.createElement('div');
        textDiv.textContent = suggestionText;
        
        const insertBtn = document.createElement('button');
        insertBtn.className = 'copy-btn';
        insertBtn.textContent = 'Insert Comment';
        insertBtn.addEventListener('click', () => insertComment(suggestionText, insertBtn));
        
        suggestionEl.appendChild(labelDiv);
        suggestionEl.appendChild(textDiv);
        suggestionEl.appendChild(insertBtn);
        listEl.appendChild(suggestionEl);
    });
    
    suggestionsEl.style.display = 'block';
}

async function insertComment(text, btnElement) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to insert comment
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'INSERT_COMMENT',
            text: text
        });
        
        if (response && response.success) {
            // Show success feedback
            const originalText = btnElement.textContent;
            btnElement.textContent = 'Inserted!';
            btnElement.style.background = '#28a745';
            
            setTimeout(() => {
                btnElement.textContent = originalText;
                btnElement.style.background = '#007bff';
            }, 2000);
        } else {
            throw new Error(response?.error || 'Failed to insert comment');
        }
    } catch (error) {
        console.error('Failed to insert comment:', error);
        
        // Show error feedback
        const originalText = btnElement.textContent;
        btnElement.textContent = 'Failed';
        btnElement.style.background = '#dc3545';
        
        setTimeout(() => {
            btnElement.textContent = originalText;
            btnElement.style.background = '#007bff';
        }, 2000);
        
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Comment copied to clipboard as fallback');
        } catch (clipboardError) {
            showNotification('Failed to insert comment. Please copy manually.', 'error');
        }
    }
}

async function refreshData() {
    // Test connection first
    await testConnection();
    
    // Get current group info and recent posts
    await getCurrentGroup();
    await getRecentPosts();
}

// Debug functions
async function debugOverlays() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'DEBUG_OVERLAYS' });
        console.log('Debug overlays response:', response);
        showNotification(`Found ${response.overlays?.length || 0} overlay types. Check console for details.`);
    } catch (error) {
        showNotification('Debug failed: ' + error.message, 'error');
    }
}

async function injectContentScript() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Injecting content script on tab:', tab.url);
        
        if (!tab.url.includes('facebook.com')) {
            showNotification('Please navigate to Facebook first', 'error');
            return;
        }
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/content-minimal.js']
        });
        
        console.log('Content script injected successfully');
        showNotification('Content script injected successfully!');
        
        // Test after injection
        setTimeout(testContentScript, 1000);
    } catch (error) {
        console.log('Content script injection failed:', error);
        showNotification('Injection failed: ' + error.message, 'error');
    }
}

async function testContentScript() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Testing content script on tab:', tab.url);
        
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        console.log('Content script response:', response);
        showNotification('Content script is running!');
    } catch (error) {
        console.log('Content script test failed:', error);
        showNotification('Content script not running: ' + error.message, 'error');
    }
}

async function forceCheck() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'FORCE_CHECK' });
        console.log('Force check response:', response);
        showNotification('Force check completed');
        
        // Refresh data after force check
        setTimeout(refreshData, 1000);
    } catch (error) {
        showNotification('Force check failed: ' + error.message, 'error');
    }
}

// Template management
let templates = [];
let isProLicense = false;

async function loadTemplates() {
    try {
        const result = await chrome.storage.local.get(['templates']);
        templates = result.templates || [];
        renderTemplatesList();
        updateTemplateCount();
    } catch (error) {
        templates = [];
    }
}

function renderTemplatesList() {
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
            <h4>${template.label}</h4>
            <div class="template-keywords">Keywords: ${template.keywords.join(', ')}</div>
            <div class="template-content">${template.template}</div>
            ${template.url ? `<div class="template-url">URL: ${template.url}</div>` : ''}
            <div class="template-actions">
                <button class="btn btn-small edit-btn">Edit</button>
                <button class="btn btn-small secondary delete-btn">Delete</button>
                ${isProLicense ? `<button class="btn btn-small rephrase-btn">AI Rephrase</button>` : ''}
            </div>
        `;
        
        // Add event listeners
        const editBtn = templateEl.querySelector('.edit-btn');
        const deleteBtn = templateEl.querySelector('.delete-btn');
        const rephraseBtn = templateEl.querySelector('.rephrase-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editTemplate(template.id));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTemplate(template.id));
        }
        
        if (rephraseBtn) {
            rephraseBtn.addEventListener('click', () => rephraseTemplate(template.id));
        }
        
        listEl.appendChild(templateEl);
    });
}

function updateTemplateCount() {
    const countEl = document.getElementById('templateCount');
    const maxTemplates = isProLicense ? 'unlimited' : '10';
    countEl.textContent = `${templates.length} templates (${maxTemplates} max)`;
}

function showTemplateForm() {
    document.getElementById('templateForm').style.display = 'block';
}

function hideTemplateForm() {
    document.getElementById('templateForm').style.display = 'none';
    clearTemplateForm();
    
    // Reset editing mode
    editingTemplateId = null;
    
    // Reset save button
    const saveBtn = document.getElementById('saveTemplateBtn');
    saveBtn.textContent = 'Save Template';
}

function clearTemplateForm() {
    document.getElementById('templateLabel').value = '';
    document.getElementById('templateKeywords').value = '';
    document.getElementById('templateContent').value = '';
    document.getElementById('templateVariants').value = '';
    document.getElementById('templateUrl').value = '';
}

async function saveTemplate() {
    // Check if we're in editing mode
    if (editingTemplateId) {
        await updateTemplate(editingTemplateId);
        return;
    }
    
    const label = document.getElementById('templateLabel').value;
    const keywords = document.getElementById('templateKeywords').value;
    const content = document.getElementById('templateContent').value;
    const variants = document.getElementById('templateVariants').value;
    const url = document.getElementById('templateUrl').value;
    
    if (!label || !keywords || !content) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate URL if provided
    if (url && !isValidUrl(url)) {
        showNotification('Please enter a valid URL (e.g., https://yourwebsite.com)', 'error');
        return;
    }
    
    // Check template limit for free users (only for new templates)
    if (!isProLicense && templates.length >= 10) {
        showNotification('Free license limited to 10 templates. Upgrade to Pro for unlimited templates.', 'error');
        return;
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
    
    templates.push(template);
    
    try {
        await chrome.storage.local.set({ templates });
        showNotification('Template saved successfully!');
        hideTemplateForm();
        renderTemplatesList();
        updateTemplateCount();
    } catch (error) {
        showNotification('Failed to save template', 'error');
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

let editingTemplateId = null;

function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Set editing mode
    editingTemplateId = templateId;
    
    // Populate form with template data
    document.getElementById('templateLabel').value = template.label;
    document.getElementById('templateKeywords').value = template.keywords.join(', ');
    document.getElementById('templateContent').value = template.template;
    document.getElementById('templateVariants').value = template.variants.join('\n');
    document.getElementById('templateUrl').value = template.url || '';
    
    // Show form
    showTemplateForm();
    
    // Change save button to update mode
    const saveBtn = document.getElementById('saveTemplateBtn');
    saveBtn.textContent = 'Update Template';
}

async function updateTemplate(templateId) {
    const label = document.getElementById('templateLabel').value;
    const keywords = document.getElementById('templateKeywords').value;
    const content = document.getElementById('templateContent').value;
    const variants = document.getElementById('templateVariants').value;
    const url = document.getElementById('templateUrl').value;
    
    if (!label || !keywords || !content) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate URL if provided
    if (url && !isValidUrl(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }
    
    // Find and update template
    const templateIndex = templates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) return;
    
    templates[templateIndex] = {
        ...templates[templateIndex],
        label: label,
        keywords: keywords.split(',').map(k => k.trim()),
        template: content,
        variants: variants ? variants.split('\n').filter(v => v.trim()) : [],
        url: url || '',
        updatedAt: new Date().toISOString()
    };
    
    try {
        await chrome.storage.local.set({ templates });
        showNotification('Template updated successfully!');
        hideTemplateForm();
        renderTemplatesList();
        updateTemplateCount();
    } catch (error) {
        showNotification('Failed to update template', 'error');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    templates = templates.filter(t => t.id !== templateId);
    
    try {
        await chrome.storage.local.set({ templates });
        showNotification('Template deleted successfully!');
        renderTemplatesList();
        updateTemplateCount();
    } catch (error) {
        showNotification('Failed to delete template', 'error');
    }
}

function rephraseTemplate(templateId) {
    if (!isProLicense) {
        showNotification('AI rephrasing requires a Pro license', 'error');
        return;
    }
    
    showNotification('AI rephrasing feature coming soon!');
}

// AI Settings management
function loadAISettings() {
    chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openaiApiKey', 'enableRephrasing', 'enableGeneration', 'enableEnhancedMatching', 'defaultUrl'], (result) => {
        if (result.aiProvider) {
            document.getElementById('aiProvider').value = result.aiProvider;
            toggleAIProvider(result.aiProvider);
        }
        if (result.geminiApiKey) document.getElementById('geminiApiKey').value = result.geminiApiKey;
        if (result.openaiApiKey) document.getElementById('openaiApiKey').value = result.openaiApiKey;
        if (result.enableRephrasing) document.getElementById('enableRephrasing').checked = result.enableRephrasing;
        if (result.enableGeneration) document.getElementById('enableGeneration').checked = result.enableGeneration;
        if (result.enableEnhancedMatching) document.getElementById('enableEnhancedMatching').checked = result.enableEnhancedMatching;
        if (result.defaultUrl) document.getElementById('defaultUrl').value = result.defaultUrl;
    });
}

function toggleAIProvider(provider) {
    const geminiGroup = document.getElementById('geminiKeyGroup');
    const openaiGroup = document.getElementById('openaiKeyGroup');
    const aiFeatures = document.getElementById('aiFeatures');
    
    geminiGroup.style.display = provider === 'gemini' ? 'block' : 'none';
    openaiGroup.style.display = provider === 'openai' ? 'block' : 'none';
    aiFeatures.style.display = provider !== 'off' ? 'block' : 'none';
}

async function saveAISettings() {
    const defaultUrl = document.getElementById('defaultUrl').value;
    
    // Validate default URL if provided
    if (defaultUrl && !isValidUrl(defaultUrl)) {
        showNotification('Please enter a valid default URL', 'error');
        return;
    }
    
    const settings = {
        aiProvider: document.getElementById('aiProvider').value,
        geminiApiKey: document.getElementById('geminiApiKey').value,
        openaiApiKey: document.getElementById('openaiApiKey').value,
        enableRephrasing: document.getElementById('enableRephrasing').checked,
        enableGeneration: document.getElementById('enableGeneration').checked,
        enableEnhancedMatching: document.getElementById('enableEnhancedMatching').checked,
        defaultUrl: defaultUrl
    };
    
    // Only check Pro license for AI features, not for default URL
    if (settings.aiProvider !== 'off' && !isProLicense) {
        showNotification('AI features require a Pro license', 'error');
        return;
    }
    
    try {
        await chrome.storage.local.set(settings);
        showNotification('Settings saved successfully!');
    } catch (error) {
        showNotification('Failed to save settings', 'error');
    }
}

function showNotification(message, type = 'success') {
    // Simple notification - could be enhanced with a proper notification system
    alert(message);
}

// License management
function checkLicense() {
    chrome.storage.local.get(['licenseKey', 'licenseStatus'], (result) => {
        const statusEl = document.getElementById('licenseStatus');
        const detailsEl = document.getElementById('licenseDetails');
        
        if (result.licenseKey && result.licenseStatus === 'valid') {
            statusEl.textContent = 'License Status: Active';
            statusEl.className = 'license-status valid';
            detailsEl.textContent = `License Key: ${result.licenseKey.substring(0, 8)}...`;
        } else {
            statusEl.textContent = 'License Status: Not Activated';
            statusEl.className = 'license-status invalid';
            detailsEl.textContent = 'Please enter your license key to activate AdReply';
        }
    });
}

function activateLicense() {
    const licenseKey = document.getElementById('licenseKey').value;
    
    if (!licenseKey) {
        showNotification('Please enter a license key', 'error');
        return;
    }
    
    // Simple validation - in real app this would validate with server
    if (licenseKey.length >= 16) {
        chrome.storage.local.set({ licenseKey, licenseStatus: 'valid' }, () => {
            showNotification('License activated successfully!');
            checkLicense();
        });
    } else {
        showNotification('Invalid license key format', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize tabs
    initializeTabs();
    
    // Set up event listeners
    document.getElementById('addTemplateBtn').addEventListener('click', showTemplateForm);
    document.getElementById('saveTemplateBtn').addEventListener('click', saveTemplate);
    document.getElementById('cancelTemplateBtn').addEventListener('click', hideTemplateForm);
    document.getElementById('aiProvider').addEventListener('change', (e) => toggleAIProvider(e.target.value));
    document.getElementById('saveAISettings').addEventListener('click', saveAISettings);
    document.getElementById('activateLicense').addEventListener('click', activateLicense);
    document.getElementById('checkLicense').addEventListener('click', checkLicense);
    document.getElementById('refreshDataBtn').addEventListener('click', refreshData);
    document.getElementById('injectScriptBtn').addEventListener('click', injectContentScript);
    document.getElementById('testContentScriptBtn').addEventListener('click', testContentScript);
    document.getElementById('debugBtn').addEventListener('click', debugOverlays);
    document.getElementById('forceCheckBtn').addEventListener('click', forceCheck);
    
    // Load saved data
    await loadTemplates();
    loadAISettings();
    checkLicense();
    
    // Initial data load
    await refreshData();
    
    // Refresh data every 15 seconds
    setInterval(refreshData, 15000);
});