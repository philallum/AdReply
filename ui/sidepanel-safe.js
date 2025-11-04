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

            // Refresh usage stats when templates tab is opened
            if (targetTab === 'templates') {
                refreshUsageStats();
            }
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
        statusEl.textContent = 'Extension ready';
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

        if (postData.skipped) {
            // Show skip message instead of suggestions
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
        } else {
            // Generate suggestions normally
            generateSuggestions(postData.content).catch(error => {
                console.error('AdReply: Error generating suggestions:', error);
                const listEl = document.getElementById('suggestionsList');
                listEl.innerHTML = '<div class="no-suggestions">Error generating suggestions. Please try again.</div>';
            });
        }
    } else {
        postContentEl.style.display = 'none';

        // Clear suggestions
        const listEl = document.getElementById('suggestionsList');
        listEl.innerHTML = '<div class="no-suggestions">No suggestions available. Navigate to a Facebook group and view posts to get started.</div>';
    }
}

async function generateSuggestions(postContent) {
    console.log('AdReply: Generating suggestions for post:', postContent.substring(0, 50) + '...');
    const suggestions = [];

    // Match templates based on keywords
    const matchedTemplates = await matchTemplatesWithPost(postContent);
    console.log('AdReply: Matched templates:', matchedTemplates.length);

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
                templateLabel: template.label,
                variantIndex: match.variantIndex || 0
            });
        }
    } else {
        console.log('AdReply: No template matches, using fallback suggestions');

        // Fallback suggestions with default promo URL from settings
        try {
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            const defaultUrl = result.defaultPromoUrl || '';

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

            // Default suggestion - always provide at least one
            if (suggestions.length === 0) {
                suggestions.push({
                    text: `Great post! Check out our services if you need help with this!${defaultUrl ? ' ' + defaultUrl : ''}`,
                    templateId: 'fallback',
                    templateLabel: 'Default Fallback'
                });
            }

            console.log('AdReply: Generated fallback suggestions:', suggestions.length);
        } catch (error) {
            console.error('AdReply: Error generating fallback suggestions:', error);
            // Provide a basic fallback with URL
            const result = await chrome.storage.local.get(['defaultPromoUrl']);
            const defaultUrl = result.defaultPromoUrl || '';
            suggestions.push({
                text: `Great post! Check out our services if you need help with this!${defaultUrl ? ' ' + defaultUrl : ''}`,
                templateId: 'fallback',
                templateLabel: 'Basic Fallback'
            });
        }
    }

    displaySuggestions(suggestions);
}

async function matchTemplatesWithPost(postContent) {
    console.log('AdReply: Matching templates with post content:', postContent.substring(0, 100) + '...');
    console.log('AdReply: Available templates:', templates.length);

    const matches = [];
    // Clean and split post content, removing punctuation for better matching
    const cleanedContent = postContent.toLowerCase().replace(/[^\w\s]/g, ' ');
    const postWords = cleanedContent.split(/\s+/).filter(word => word.length > 0);
    console.log('AdReply: Post words:', postWords.slice(0, 10)); // Show first 10 words
    console.log('AdReply: Original content:', postContent.substring(0, 100) + '...');
    console.log('AdReply: Cleaned content:', cleanedContent.substring(0, 100) + '...');

    // Get current group ID for usage filtering
    let currentGroupId = 'facebook.com';
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url.includes('facebook.com')) {
            const groupMatch = tab.url.match(/\/groups\/([^\/\?]+)/);
            if (groupMatch) {
                currentGroupId = `facebook.com/groups/${groupMatch[1]}`;
            } else {
                currentGroupId = tab.url.split('?')[0];
            }
        }
    } catch (error) {
        console.warn('AdReply: Could not get current group ID:', error);
    }

    // Get recent usage for this group
    let recentUsage = [];
    if (usageTracker) {
        try {
            recentUsage = await usageTracker.getGroupUsage(currentGroupId, 24);
        } catch (error) {
            console.warn('AdReply: Could not get usage history:', error);
        }
    }

    for (const template of templates) {
        let score = 0;

        console.log('AdReply: Checking template:', template.label, 'Keywords:', template.keywords);

        // Safety check for keywords
        if (!template.keywords || !Array.isArray(template.keywords)) {
            console.warn('AdReply: Template has invalid keywords:', template);
            continue;
        }

        // Calculate relevance score based on keyword matches
        for (const keyword of template.keywords) {
            const keywordLower = keyword.toLowerCase().trim();
            if (!keywordLower) continue; // Skip empty keywords

            // Check for exact word matches and partial matches
            const exactMatch = postWords.includes(keywordLower);
            const partialMatch = postWords.some(word => word.includes(keywordLower) && keywordLower.length > 2);

            console.log(`AdReply: Testing keyword "${keyword}" (${keywordLower}) against post words:`, postWords);
            console.log(`AdReply: Exact match for "${keywordLower}":`, exactMatch);
            console.log(`AdReply: Partial match for "${keywordLower}":`, partialMatch);

            if (exactMatch || partialMatch) {
                score += exactMatch ? 2 : 1; // Exact matches get higher score
                console.log('AdReply: ✅ Keyword match found:', keyword, exactMatch ? '(exact)' : '(partial)', 'in post words');
            } else {
                console.log('AdReply: ❌ No match for keyword:', keyword);
            }
        }

        console.log('AdReply: Template score:', template.label, score);

        if (score > 0) {
            // Add main template (variant index 0)
            const isMainUsed = recentUsage.some(usage =>
                usage.templateId === template.id && usage.variantIndex === 0
            );

            if (!isMainUsed) {
                matches.push({
                    template,
                    variant: template.template,
                    variantIndex: 0,
                    score,
                    recentlyUsed: false
                });
            } else {
                // Add to recently used for fallback
                matches.push({
                    template,
                    variant: template.template,
                    variantIndex: 0,
                    score,
                    recentlyUsed: true,
                    lastUsed: recentUsage.find(u => u.templateId === template.id && u.variantIndex === 0)?.timestamp
                });
            }

            // Add variants (variant index 1+)
            template.variants.forEach((variant, index) => {
                const variantIndex = index + 1;
                const isVariantUsed = recentUsage.some(usage =>
                    usage.templateId === template.id && usage.variantIndex === variantIndex
                );

                if (!isVariantUsed) {
                    matches.push({
                        template,
                        variant,
                        variantIndex,
                        score,
                        recentlyUsed: false
                    });
                } else {
                    // Add to recently used for fallback
                    matches.push({
                        template,
                        variant,
                        variantIndex,
                        score,
                        recentlyUsed: true,
                        lastUsed: recentUsage.find(u => u.templateId === template.id && u.variantIndex === variantIndex)?.timestamp
                    });
                }
            });
        }
    }

    // Separate unused and recently used
    const unusedMatches = matches.filter(m => !m.recentlyUsed);
    const recentlyUsedMatches = matches.filter(m => m.recentlyUsed);

    // Sort unused by score (highest first)
    unusedMatches.sort((a, b) => b.score - a.score);

    // Sort recently used by oldest first (for fallback)
    recentlyUsedMatches.sort((a, b) => {
        if (!a.lastUsed) return -1;
        if (!b.lastUsed) return 1;
        return new Date(a.lastUsed) - new Date(b.lastUsed);
    });

    // Return unused first, then recently used as fallback
    const result = [...unusedMatches, ...recentlyUsedMatches];

    console.log('AdReply: Template matching results:', {
        totalMatches: result.length,
        unusedMatches: unusedMatches.length,
        recentlyUsedMatches: recentlyUsedMatches.length,
        currentGroupId,
        templatesAvailable: templates.length
    });

    return result;
}

function displaySuggestions(suggestions) {
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
        copyBtn.addEventListener('click', () => copyToClipboard(suggestionText, copyBtn, suggestion));

        suggestionEl.appendChild(labelDiv);
        suggestionEl.appendChild(textDiv);
        suggestionEl.appendChild(copyBtn);
        listEl.appendChild(suggestionEl);
    });

    suggestionsEl.style.display = 'block';
}

async function copyToClipboard(text, btnElement, suggestion) {
    try {
        await navigator.clipboard.writeText(text);

        // Record usage if we have a valid template
        if (suggestion && typeof suggestion === 'object' && suggestion.templateId && suggestion.templateId !== 'fallback') {
            await recordAdUsage(suggestion.templateId, suggestion.variantIndex || 0, text);
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
            // Fallback: create temporary textarea
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            showNotification('Text copied using fallback method');
        } catch (fallbackError) {
            showNotification('Copy failed. Please copy text manually.', 'error');
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

// Main analysis function
async function analyzeCurrentPost() {
    const analyzeBtn = document.getElementById('analyzePostBtn');
    const originalText = analyzeBtn.textContent;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('facebook.com')) {
            showNotification('Please navigate to Facebook first', 'error');
            return;
        }

        // Show loading state
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;

        // Clear previous post content from UI
        updatePostContent(null);

        try {
            // Ensure content script is injected
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['scripts/content-minimal.js']
            });
        } catch (injectError) {
            // Content script might already be injected, continue
        }

        // Clear previous posts from background
        await chrome.runtime.sendMessage({ type: 'CLEAR_POSTS' });

        // Request post analysis
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_CURRENT_POST' });

        if (response && response.success) {
            if (response.skipped) {
                // Post was skipped due to existing user comments
                showNotification(response.skipReason || 'Post skipped - you have already commented', 'info');

                // Show skip information in the UI
                updatePostContent({
                    content: response.content,
                    groupId: response.groupId,
                    source: 'manual_analysis_skipped',
                    skipped: true,
                    skipReason: response.skipReason,
                    userComments: response.userComments
                });

            } else if (response.content) {
                // Store the analyzed post
                await chrome.runtime.sendMessage({
                    type: 'NEW_POST',
                    data: {
                        content: response.content,
                        groupId: response.groupId || 'manual',
                        timestamp: Date.now(),
                        source: 'manual_analysis'
                    }
                });

                // Update UI with the new post
                updatePostContent({
                    content: response.content,
                    groupId: response.groupId,
                    source: 'manual_analysis'
                });
            } else {
                showNotification('No post content found on current page', 'error');
            }
        } else {
            showNotification(response?.error || 'No post content found on current page', 'error');
        }

    } catch (error) {
        console.error('Analysis failed:', error);
        showNotification('Analysis failed: ' + error.message, 'error');
    } finally {
        // Reset button state
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
    }
}

// Template management
let templates = [];
let isProLicense = false;
let usageTracker = null;

function initializeUsageTracker() {
    try {
        if (typeof UsageTracker !== 'undefined') {
            usageTracker = new UsageTracker();
            console.log('AdReply: Usage tracker initialized in sidebar');
        } else {
            console.warn('AdReply: UsageTracker class not available');
        }
    } catch (error) {
        console.error('AdReply: Error initializing usage tracker:', error);
    }
}

async function recordAdUsage(templateId, variantIndex, commentText) {
    try {
        if (!usageTracker) {
            console.warn('AdReply: Usage tracker not initialized');
            return;
        }

        // Get current Facebook group ID
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('facebook.com')) {
            console.log('AdReply: Not on Facebook, skipping usage recording');
            return;
        }

        // Extract group ID from URL
        let groupId = 'facebook.com';
        const groupMatch = tab.url.match(/\/groups\/([^\/\?]+)/);
        if (groupMatch) {
            groupId = `facebook.com/groups/${groupMatch[1]}`;
        } else {
            // Use page URL as fallback
            groupId = tab.url.split('?')[0];
        }

        // Get post content for context
        const postContent = currentPost?.content || '';

        // Record the usage
        await usageTracker.recordUsage(
            templateId,
            variantIndex,
            groupId,
            postContent,
            {
                commentText: commentText.substring(0, 100),
                tabUrl: tab.url
            }
        );

        console.log('AdReply: Usage recorded:', {
            templateId,
            variantIndex,
            groupId,
            timestamp: new Date().toISOString()
        });

        // Show visual feedback
        showNotification(`Ad usage recorded for ${groupId}`, 'success');

    } catch (error) {
        console.error('AdReply: Error recording ad usage:', error);
    }
}

async function refreshUsageStats() {
    try {
        if (!usageTracker) {
            document.getElementById('usageStatsContent').innerHTML =
                '<div class="loading-message">Usage tracker not available</div>';
            return;
        }

        const contentEl = document.getElementById('usageStatsContent');
        contentEl.innerHTML = '<div class="loading-message">Loading usage statistics...</div>';

        // Get current group ID
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let currentGroupId = 'facebook.com';

        if (tab.url.includes('facebook.com')) {
            const groupMatch = tab.url.match(/\/groups\/([^\/\?]+)/);
            if (groupMatch) {
                currentGroupId = `facebook.com/groups/${groupMatch[1]}`;
            } else {
                currentGroupId = tab.url.split('?')[0];
            }
        }

        // Get usage data
        const usageData = await usageTracker.getUsageData();
        const groupSummary = await usageTracker.getGroupSummary(currentGroupId);

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

    } catch (error) {
        console.error('AdReply: Error loading usage stats:', error);
        document.getElementById('usageStatsContent').innerHTML =
            '<div class="loading-message">Error loading usage statistics</div>';
    }
}

async function exportUsageData() {
    try {
        if (!usageTracker) {
            showNotification('Usage tracker not available', 'error');
            return;
        }

        const exportData = await usageTracker.exportUsageData();

        if (!exportData) {
            showNotification('No usage data to export', 'error');
            return;
        }

        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `adreply-usage-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        showNotification('Usage data exported successfully!', 'success');

    } catch (error) {
        console.error('AdReply: Error exporting usage data:', error);
        showNotification('Error exporting usage data', 'error');
    }
}

async function clearUsageHistory() {
    try {
        if (!usageTracker) {
            showNotification('Usage tracker not available', 'error');
            return;
        }

        const confirmed = confirm('Are you sure you want to clear all usage history? This cannot be undone.');

        if (!confirmed) return;

        // Clear all usage data
        await usageTracker.saveUsageData({});

        // Refresh the display
        await refreshUsageStats();

        showNotification('Usage history cleared successfully!', 'success');

    } catch (error) {
        console.error('AdReply: Error clearing usage history:', error);
        showNotification('Error clearing usage history', 'error');
    }
}

// Debug function to check current state
async function debugTemplateMatching() {
    console.log('=== AdReply Debug Info ===');
    console.log('Templates loaded:', templates.length);
    console.log('Templates:', templates);

    if (currentPost) {
        console.log('Current post content:', currentPost.content);
        console.log('Attempting to match templates...');

        const matches = await matchTemplatesWithPost(currentPost.content);
        console.log('Matches found:', matches);
    } else {
        console.log('No current post available');
    }

    console.log('Usage tracker available:', !!usageTracker);
    console.log('=== End Debug Info ===');
}

// Make debug function available globally for testing
window.debugTemplateMatching = debugTemplateMatching;

// Test function to generate suggestions with dummy content
async function testSuggestions() {
    console.log('AdReply: Testing suggestion generation...');

    // Test with dummy content that should trigger fallbacks
    const testContent = "This is a test post about cars and automotive services";

    console.log('AdReply: Testing with content:', testContent);
    await generateSuggestions(testContent);
}

window.testSuggestions = testSuggestions;

async function loadTemplates() {
    try {
        const result = await chrome.storage.local.get(['templates']);
        templates = result.templates || [];
        console.log('AdReply: Loaded templates:', templates.length, templates);
        renderTemplatesList();
        updateTemplateCount();
    } catch (error) {
        console.error('AdReply: Error loading templates:', error);
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
        if (editBtn) {
            editBtn.addEventListener('click', () => editTemplate(template.id));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTemplate(template.id));
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





function showNotification(message, type = 'success') {
    // Simple notification - could be enhanced with a proper notification system
    alert(message);
}

// Default URL management
async function saveDefaultUrl() {
    const url = document.getElementById('defaultPromoUrl').value;

    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        showNotification('Please enter a valid URL (e.g., https://yourwebsite.com)', 'error');
        return;
    }

    try {
        await chrome.storage.local.set({ defaultPromoUrl: url });
        showNotification('Default URL saved successfully!');
    } catch (error) {
        showNotification('Failed to save URL', 'error');
    }
}

async function loadDefaultUrl() {
    try {
        const result = await chrome.storage.local.get(['defaultPromoUrl']);
        if (result.defaultPromoUrl) {
            document.getElementById('defaultPromoUrl').value = result.defaultPromoUrl;
        }
    } catch (error) {
        console.error('Failed to load default URL:', error);
    }
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

    document.getElementById('activateLicense').addEventListener('click', activateLicense);
    document.getElementById('checkLicense').addEventListener('click', checkLicense);
    document.getElementById('analyzePostBtn').addEventListener('click', analyzeCurrentPost);
    document.getElementById('debugBtn').addEventListener('click', debugTemplateMatching);
    document.getElementById('exportUsageBtn').addEventListener('click', exportUsageData);
    document.getElementById('refreshUsageBtn').addEventListener('click', refreshUsageStats);
    document.getElementById('clearUsageBtn').addEventListener('click', clearUsageHistory);
    document.getElementById('saveDefaultUrlBtn').addEventListener('click', saveDefaultUrl);

    // Initialize usage tracker
    initializeUsageTracker();

    // Load saved data
    await loadTemplates();

    checkLicense();
    loadDefaultUrl();

    // Initial data load
    await refreshData();

    // Refresh data every 15 seconds
    setInterval(refreshData, 15000);
});