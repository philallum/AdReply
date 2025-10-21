// AdReply Side Panel JavaScript
// Handles UI interactions and communication with content scripts

// Initialize logging and error handling for side panel
const logging = initializeLogging({
  component: 'SidePanel',
  debugMode: false // Set to true for development
});

const logger = logging.logger;
const errorHandler = new ErrorHandler();
const debug = logging.debug;

// Import license utilities
// Note: In Chrome extension, this would be loaded via script tag in HTML
if (typeof LicenseUtils === 'undefined') {
    // Fallback if LicenseUtils is not loaded
    window.LicenseUtils = {
        checkFeatureAccess: async () => false,
        getLicenseStatus: async () => null,
        getTemplateLimit: async () => 10,
        canAddTemplate: async () => false,
        showUpgradePromptIfNeeded: async () => false,
        formatLicenseStatus: () => ({ displayText: 'Free', statusClass: 'text-gray-600', badgeClass: 'bg-gray-100 text-gray-800' })
    };
}

logger.info('AdReply side panel loaded');

// Initialize side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSidePanel);

async function initializeSidePanel() {
    console.log('AdReply: Initializing side panel');
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Load initial data with license checks
    await loadLicenseStatus();
    await loadTemplates();
    await loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize license-dependent features
    await initializeLicenseFeatures();
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add keyboard navigation class to body when using keyboard
    document.addEventListener('keydown', () => {
        document.body.classList.add('keyboard-navigation');
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetTab = button.dataset.tab;
            
            // Prevent double-clicking
            if (button.classList.contains('active')) return;
            
            // Update ARIA attributes
            tabButtons.forEach((btn, btnIndex) => {
                btn.setAttribute('aria-selected', btnIndex === index ? 'true' : 'false');
                btn.setAttribute('tabindex', btnIndex === index ? '0' : '-1');
            });
            
            // Add loading state to button
            button.classList.add('loading');
            button.setAttribute('aria-busy', 'true');
            
            // Announce tab change to screen readers
            announceToScreenReader(`Switching to ${targetTab.replace('-', ' ')} tab`);
            
            // Fade out current content
            const currentContent = document.querySelector('.tab-content.active');
            if (currentContent) {
                currentContent.setAttribute('aria-hidden', 'true');
                currentContent.style.opacity = '0';
                currentContent.style.transform = 'translateY(10px)';
            }
            
            // Wait for fade out animation
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'loading');
                btn.setAttribute('aria-busy', 'false');
            });
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.setAttribute('aria-hidden', 'true');
                content.style.opacity = '';
                content.style.transform = '';
            });
            
            // Add active class to clicked tab
            button.classList.add('active');
            
            // Show target content with animation
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.setAttribute('aria-hidden', 'false');
                targetContent.focus();
                
                // Trigger reflow for animation
                targetContent.offsetHeight;
                
                // Animate in
                targetContent.style.opacity = '1';
                targetContent.style.transform = 'translateY(0)';
            }
            
            // Track tab usage for analytics (privacy-compliant)
            console.log(`AdReply: Switched to ${targetTab} tab`);
            
            // Show contextual help for first-time users
            showTabContextualHelp(targetTab);
        });
        
        // Add keyboard navigation support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
            
            // Arrow key navigation
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const buttons = Array.from(tabButtons);
                const currentIndex = buttons.indexOf(button);
                let nextIndex;
                
                if (e.key === 'ArrowLeft') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
                } else {
                    nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
                }
                
                buttons[nextIndex].focus();
                buttons[nextIndex].click();
            }
            
            // Home/End key navigation
            if (e.key === 'Home') {
                e.preventDefault();
                tabButtons[0].focus();
                tabButtons[0].click();
            }
            
            if (e.key === 'End') {
                e.preventDefault();
                tabButtons[tabButtons.length - 1].focus();
                tabButtons[tabButtons.length - 1].click();
            }
        });
    });
}

// Screen reader announcement function
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'status-announcement';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.parentNode.removeChild(announcement);
        }
    }, 1000);
}

function showTabContextualHelp(tabName) {
    // Show contextual help for first-time users (can be disabled in settings)
    const helpShown = localStorage.getItem(`adreply_help_${tabName}_shown`);
    if (helpShown) return;
    
    let helpMessage = '';
    switch (tabName) {
        case 'adverts':
            helpMessage = 'Create and manage your advertisement templates here. Templates will automatically suggest relevant comments based on Facebook posts.';
            break;
        case 'ai-settings':
            helpMessage = 'Configure AI features to enhance your templates with rephrasing and generation capabilities (Pro feature).';
            break;
        case 'license':
            helpMessage = 'Manage your AdReply license and upgrade to Pro for unlimited templates and AI features.';
            break;
    }
    
    if (helpMessage) {
        setTimeout(() => {
            showInfoMessage(helpMessage);
            localStorage.setItem(`adreply_help_${tabName}_shown`, 'true');
        }, 500);
    }
}

function setupEventListeners() {
    // Add template button
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    if (addTemplateBtn) {
        addTemplateBtn.addEventListener('click', () => {
            console.log('Add template clicked');
            // This will be implemented in later tasks
        });
    }
    
    // License validation button
    const validateLicenseBtn = document.getElementById('validateLicenseBtn');
    if (validateLicenseBtn) {
        validateLicenseBtn.addEventListener('click', () => {
            const licenseKey = document.getElementById('licenseKey').value.trim();
            if (licenseKey) {
                validateLicense(licenseKey);
            } else {
                showErrorMessage('Please enter a license key');
            }
        });
    }
    
    // License key input - validate on Enter
    const licenseKeyInput = document.getElementById('licenseKey');
    if (licenseKeyInput) {
        licenseKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const validateBtn = document.getElementById('validateLicenseBtn');
                if (validateBtn) validateBtn.click();
            }
        });
    }
    
    // Upgrade buttons
    const upgradeButtons = document.querySelectorAll('.btn-upgrade');
    upgradeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Upgrade to Pro clicked');
            // This will be implemented in later tasks
        });
    });
    
    // Template search functionality
    const templateSearch = document.getElementById('templateSearch');
    if (templateSearch) {
        templateSearch.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterTemplates(searchTerm, getCurrentFilter());
        }, 300));
    }
    
    // Template filter buttons
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active filter
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterType = button.dataset.filter;
            const searchTerm = document.getElementById('templateSearch')?.value.toLowerCase().trim() || '';
            filterTemplates(searchTerm, filterType);
        });
    });
    
    // AI Settings form handling
    setupAISettingsHandlers();
    
    // Import/Export functionality
    setupImportExportHandlers();
}

function setupAISettingsHandlers() {
    const aiProvider = document.getElementById('aiProvider');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const openaiApiKey = document.getElementById('openaiApiKey');
    
    if (aiProvider) {
        aiProvider.addEventListener('change', async (e) => {
            const provider = e.target.value;
            await saveAISetting('provider', provider);
            console.log('AI provider changed to:', provider);
        });
    }
    
    if (geminiApiKey) {
        geminiApiKey.addEventListener('blur', async (e) => {
            const apiKey = e.target.value.trim();
            await saveAISetting('geminiApiKey', apiKey);
            console.log('Gemini API key updated');
        });
    }
    
    if (openaiApiKey) {
        openaiApiKey.addEventListener('blur', async (e) => {
            const apiKey = e.target.value.trim();
            await saveAISetting('openaiApiKey', apiKey);
            console.log('OpenAI API key updated');
        });
    }
}

// Template filtering and search functionality
let allTemplates = []; // Will store all templates for filtering

function filterTemplates(searchTerm = '', filterType = 'all') {
    let filteredTemplates = [...allTemplates];
    
    // Apply search filter
    if (searchTerm) {
        filteredTemplates = filteredTemplates.filter(template => 
            template.label.toLowerCase().includes(searchTerm) ||
            template.template.toLowerCase().includes(searchTerm) ||
            template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
            (template.verticals && template.verticals.some(vertical => vertical.toLowerCase().includes(searchTerm)))
        );
    }
    
    // Apply category filter
    switch (filterType) {
        case 'recent':
            filteredTemplates.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
            break;
        case 'popular':
            filteredTemplates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            break;
        case 'all':
        default:
            // Keep original order or sort by label
            filteredTemplates.sort((a, b) => a.label.localeCompare(b.label));
            break;
    }
    
    renderTemplates(filteredTemplates);
    
    // Update filter button text with count
    updateFilterCounts(filterType, filteredTemplates.length);
}

function getCurrentFilter() {
    const activeFilter = document.querySelector('.filter-button.active');
    return activeFilter ? activeFilter.dataset.filter : 'all';
}

function updateFilterCounts(activeFilter, count) {
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        const filter = button.dataset.filter;
        if (filter === activeFilter) {
            const baseText = filter.charAt(0).toUpperCase() + filter.slice(1);
            button.textContent = `${baseText} (${count})`;
        } else {
            button.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
        }
    });
}

// Utility function for debouncing search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// AI Settings management
async function saveAISetting(key, value) {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        
        if (!settings.ai) {
            settings.ai = {};
        }
        
        settings.ai[key] = value;
        
        await chrome.storage.local.set({ settings });
        console.log(`AI setting ${key} saved`);
    } catch (error) {
        console.error('Failed to save AI setting:', error);
        showErrorMessage('Failed to save AI settings');
    }
}

async function loadLicenseStatus() {
    try {
        const licenseStatus = await LicenseUtils.getLicenseStatus();
        updateLicenseDisplay(licenseStatus);
        return licenseStatus;
    } catch (error) {
        console.error('Failed to load license status:', error);
        const fallbackLicense = { status: 'free', tier: 'free', features: [] };
        updateLicenseDisplay(fallbackLicense);
        return fallbackLicense;
    }
}

function updateLicenseDisplay(license) {
    const statusBadge = document.getElementById('licenseStatus');
    const badge = statusBadge?.querySelector('.status-badge');
    
    if (badge) {
        const formattedStatus = LicenseUtils.formatLicenseStatus(license);
        badge.textContent = formattedStatus.displayText;
        badge.className = `status-badge px-2 py-1 rounded-full text-xs font-medium ${formattedStatus.badgeClass}`;
    }
    
    // Update license info in the license tab
    updateLicenseTabInfo(license);
    
    // Update feature availability throughout the UI
    updateFeatureAvailability(license);
}

function updateLicenseTabInfo(license) {
    const licenseInfo = document.querySelector('.license-info');
    const licenseTier = licenseInfo?.querySelector('.license-tier');
    
    if (licenseTier) {
        const formattedStatus = LicenseUtils.formatLicenseStatus(license);
        
        if (license?.tier === 'pro') {
            licenseTier.textContent = 'Pro License';
            licenseTier.className = 'license-tier text-base font-semibold text-green-600 mb-2';
            
            // Show expiration info if available
            if (license.expiresAt) {
                const expiryDate = new Date(license.expiresAt);
                const expiryText = document.createElement('div');
                expiryText.className = 'text-sm text-gray-600';
                expiryText.textContent = `Expires: ${expiryDate.toLocaleDateString()}`;
                licenseTier.parentNode.insertBefore(expiryText, licenseTier.nextSibling);
            }
        } else {
            licenseTier.textContent = 'Free Tier';
            licenseTier.className = 'license-tier text-base font-semibold text-gray-900 mb-2';
        }
        
        // Show grace period info if applicable
        if (license?.gracePeriod?.inGracePeriod) {
            const graceInfo = document.createElement('div');
            graceInfo.className = 'text-sm text-orange-600 font-medium';
            graceInfo.textContent = `Grace period: ${license.gracePeriod.daysRemaining} days remaining`;
            licenseTier.parentNode.insertBefore(graceInfo, licenseTier.nextSibling);
        }
    }
}

async function loadTemplates() {
    try {
        console.log('Loading templates...');
        
        // Show loading skeleton
        showTemplateLoadingSkeleton();
        
        // Simulate loading delay for better UX feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check template limits and show appropriate UI
        await updateTemplateLimitDisplay();
        
        // For now, show no templates message with enhanced styling
        const templatesContainer = document.getElementById('templatesContainer');
        templatesContainer.innerHTML = `
            <div class="no-templates p-6 text-center text-facebook-gray empty-state">
                <div class="mb-4">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                </div>
                <h3 class="text-sm font-medium text-gray-900 mb-2">No templates yet</h3>
                <p class="text-sm text-gray-600 mb-4">Create your first advertisement template to get started with AdReply.</p>
                <button onclick="document.getElementById('addTemplateBtn').click()" class="inline-flex items-center px-4 py-2 bg-facebook-blue text-white text-sm font-medium rounded-md hover:bg-facebook-hover transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Create Template
                </button>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load templates:', error);
        showErrorMessage('Failed to load templates');
        showTemplateErrorState();
    }
}

function showTemplateLoadingSkeleton() {
    const templatesContainer = document.getElementById('templatesContainer');
    templatesContainer.innerHTML = `
        <div class="loading-skeleton p-4 space-y-4">
            ${Array.from({ length: 3 }, (_, i) => `
                <div class="skeleton-template-item p-3 border border-gray-200 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <div class="skeleton-template skeleton-line medium mb-2"></div>
                            <div class="skeleton-template skeleton-line short"></div>
                        </div>
                        <div class="flex space-x-1">
                            <div class="skeleton-template w-6 h-6 rounded"></div>
                            <div class="skeleton-template w-6 h-6 rounded"></div>
                            <div class="skeleton-template w-6 h-6 rounded"></div>
                        </div>
                    </div>
                    <div class="skeleton-template skeleton-line long mb-2"></div>
                    <div class="flex space-x-2">
                        <div class="skeleton-template w-16 h-5 rounded-full"></div>
                        <div class="skeleton-template w-20 h-5 rounded-full"></div>
                        <div class="skeleton-template w-12 h-5 rounded-full"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showTemplateErrorState() {
    const templatesContainer = document.getElementById('templatesContainer');
    templatesContainer.innerHTML = `
        <div class="error-state p-6 text-center">
            <div class="mb-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-2">Failed to load templates</h3>
            <p class="text-sm text-gray-600 mb-4">There was an error loading your templates. Please try again.</p>
            <button onclick="loadTemplates()" class="inline-flex items-center px-4 py-2 bg-facebook-blue text-white text-sm font-medium rounded-md hover:bg-facebook-hover transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Retry
            </button>
        </div>
    `;
}

// Function to render comment suggestions with enhanced UI and ranking indicators
function renderCommentSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="no-suggestions p-6 text-center text-facebook-gray">
                <div class="mb-2">
                    <svg class="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                </div>
                <p class="text-sm">No suggestions available. Navigate to a Facebook group post to see relevant comment suggestions.</p>
            </div>
        `;
        return;
    }
    
    const suggestionsHTML = suggestions.map((suggestion, index) => {
        const rankColor = index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-500';
        const scoreColor = suggestion.score > 0.8 ? 'text-green-600' : suggestion.score > 0.6 ? 'text-blue-600' : 'text-gray-600';
        
        return `
            <div class="suggestion-item group cursor-pointer hover:bg-gray-50 transition-all duration-200" 
                 data-suggestion-id="${suggestion.id}" 
                 data-template-id="${suggestion.templateId}"
                 data-score="${suggestion.score}">
                <div class="flex items-start space-x-3 p-3">
                    <div class="flex-shrink-0">
                        <span class="suggestion-rank inline-flex items-center justify-center w-6 h-6 ${rankColor} text-white text-xs font-bold rounded-full">
                            ${index + 1}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="suggestion-text text-sm text-gray-900 mb-2 leading-relaxed">
                            ${escapeHtml(suggestion.text)}
                        </div>
                        <div class="suggestion-meta flex items-center justify-between text-xs">
                            <div class="flex items-center space-x-2">
                                <span class="suggestion-score ${scoreColor} font-medium">
                                    ${Math.round(suggestion.score * 100)}% match
                                </span>
                                ${suggestion.templateLabel ? `<span class="text-gray-500">• ${escapeHtml(suggestion.templateLabel)}</span>` : ''}
                            </div>
                            <div class="suggestion-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button class="text-facebook-blue hover:text-facebook-hover text-xs font-medium" 
                                        onclick="event.stopPropagation(); copySuggestion('${suggestion.id}')">
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.innerHTML = suggestionsHTML;
    
    // Add click handlers for suggestions
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remove previous selection and update ARIA
            suggestionsContainer.querySelectorAll('.suggestion-item').forEach(el => {
                el.classList.remove('selected', 'bg-blue-50', 'border-l-4', 'border-facebook-blue');
                el.setAttribute('aria-selected', 'false');
            });
            
            // Add selection styling and ARIA
            item.classList.add('selected', 'bg-blue-50', 'border-l-4', 'border-facebook-blue');
            item.setAttribute('aria-selected', 'true');
            
            const suggestionId = item.dataset.suggestionId;
            const templateId = item.dataset.templateId;
            const score = parseFloat(item.dataset.score);
            
            // Announce selection to screen readers
            announceToScreenReader(`Selected suggestion ${index + 1} with ${Math.round(score * 100)}% match`);
            
            selectSuggestion(suggestionId, templateId, score);
        });
        
        // Add keyboard navigation
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
            
            // Arrow key navigation between suggestions
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const items = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
                const currentIndex = items.indexOf(item);
                let nextIndex;
                
                if (e.key === 'ArrowUp') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                } else {
                    nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                }
                
                items[nextIndex].focus();
            }
        });
        
        // Make focusable for accessibility
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('aria-label', `Suggestion ${index + 1}: ${suggestions[index].text.substring(0, 50)}... Match score: ${Math.round(suggestions[index].score * 100)}%`);
        item.setAttribute('aria-describedby', `suggestion-${index}-details`);
        
        // Add hidden description for screen readers
        const description = document.createElement('div');
        description.id = `suggestion-${index}-details`;
        description.className = 'sr-only';
        description.textContent = `Template: ${suggestions[index].templateLabel || 'Unknown'}. Full text: ${suggestions[index].text}`;
        item.appendChild(description);
    });
    
    // Set container role for suggestions list
    suggestionsContainer.setAttribute('role', 'listbox');
    suggestionsContainer.setAttribute('aria-label', 'Comment suggestions');
}

// Enhanced suggestion interaction functions
function selectSuggestion(suggestionId, templateId, score) {
    console.log('Selected suggestion:', { suggestionId, templateId, score });
    
    // Add visual feedback
    const suggestionElement = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
    if (suggestionElement) {
        suggestionElement.classList.add('success-feedback');
        setTimeout(() => {
            suggestionElement.classList.remove('success-feedback');
        }, 600);
    }
    
    // Show feedback to user with enhanced notification
    showSuccessMessage('Suggestion selected! Ready to insert into Facebook comment.');
    
    // This will be implemented in later tasks to actually insert the comment
    // For now, we'll just track the selection
    trackSuggestionSelection(suggestionId, templateId, score);
}

function copySuggestion(suggestionId) {
    const suggestionItem = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
    if (suggestionItem) {
        const suggestionText = suggestionItem.querySelector('.suggestion-text').textContent;
        
        // Copy to clipboard
        navigator.clipboard.writeText(suggestionText).then(() => {
            showSuccessMessage('Suggestion copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy suggestion:', err);
            showErrorMessage('Failed to copy suggestion');
        });
    }
}

function trackSuggestionSelection(suggestionId, templateId, score) {
    // Track usage for analytics and rotation
    const selectionData = {
        suggestionId,
        templateId,
        score,
        timestamp: new Date().toISOString()
    };
    
    console.log('Tracking suggestion selection:', selectionData);
    // This will be enhanced in later tasks to update usage statistics
}

// Enhanced feedback functions
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showInfoMessage(message) {
    showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element with enhanced styling
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-4 py-3 rounded-lg text-sm font-medium z-50 shadow-lg transform translate-x-full transition-all duration-300 max-w-sm`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500 text-white';
            icon = '✓';
            break;
        case 'error':
            notification.className += ' bg-red-500 text-white';
            icon = '✕';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500 text-white';
            icon = '⚠';
            break;
        default:
            notification.className += ' bg-blue-500 text-white';
            icon = 'ℹ';
    }
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full text-xs font-bold">
                ${icon}
            </span>
            <span class="flex-1">${escapeHtml(message)}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 4 seconds (longer for better UX)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    });
}

// Function to render templates with enhanced UI and interaction
function renderTemplates(templates) {
    const templatesContainer = document.getElementById('templatesContainer');
    
    // Store templates globally for filtering
    allTemplates = templates || [];
    
    if (!templates || templates.length === 0) {
        const isFiltered = document.getElementById('templateSearch')?.value.trim() || getCurrentFilter() !== 'all';
        const message = isFiltered ? 'No templates match your search criteria.' : 'No templates created yet. Create your first template to get started.';
        
        templatesContainer.innerHTML = `
            <div class="no-templates p-6 text-center text-facebook-gray">
                <div class="mb-2">
                    <svg class="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-sm">${message}</p>
                ${!isFiltered ? `
                    <button class="mt-3 text-facebook-blue hover:text-facebook-hover text-sm font-medium" onclick="document.getElementById('addTemplateBtn').click()">
                        Create your first template
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    const templatesHTML = templates.map(template => {
        const usageCount = template.usageCount || 0;
        const variantCount = template.variants ? template.variants.length + 1 : 1;
        const lastUsed = template.lastUsedAt ? new Date(template.lastUsedAt).toLocaleDateString() : 'Never';
        
        return `
            <div class="template-item group hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0" 
                 data-template-id="${template.id}">
                <div class="p-3">
                    <div class="template-header flex justify-between items-start mb-2">
                        <div class="flex-1 min-w-0">
                            <div class="template-label text-sm font-medium text-gray-900 truncate">
                                ${escapeHtml(template.label)}
                            </div>
                            <div class="template-stats flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                <span title="Usage count">📊 ${usageCount} uses</span>
                                <span title="Variants">🔄 ${variantCount} variants</span>
                                <span title="Last used">⏰ ${lastUsed}</span>
                            </div>
                        </div>
                        <div class="template-actions flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onclick="event.stopPropagation(); previewTemplate('${template.id}')" 
                                    title="Preview template"
                                    class="p-1 text-gray-400 hover:text-facebook-blue transition-colors duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </button>
                            <button onclick="event.stopPropagation(); editTemplate('${template.id}')" 
                                    title="Edit template"
                                    class="p-1 text-gray-400 hover:text-facebook-blue transition-colors duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button onclick="event.stopPropagation(); rephraseTemplate('${template.id}')" 
                                    title="Rephrase with AI (Pro)"
                                    class="ai-rephrase-btn p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                                    data-template-id="${template.id}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <button onclick="event.stopPropagation(); duplicateTemplate('${template.id}')" 
                                    title="Duplicate template"
                                    class="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <button onclick="event.stopPropagation(); exportSingleTemplate('${template.id}')" 
                                    title="Export this template"
                                    class="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l3-3m0 0l-3-3m3 3H9"></path>
                                </svg>
                            </button>
                            <button onclick="event.stopPropagation(); deleteTemplate('${template.id}')" 
                                    title="Delete template"
                                    class="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="template-content text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                        ${escapeHtml(template.template)}
                    </div>
                    
                    <div class="template-footer flex items-center justify-between">
                        <div class="template-keywords flex flex-wrap gap-1">
                            ${template.keywords.slice(0, 3).map(keyword => 
                                `<span class="template-keyword-tag inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                    ${escapeHtml(keyword)}
                                </span>`
                            ).join('')}
                            ${template.keywords.length > 3 ? 
                                `<span class="text-xs text-gray-500">+${template.keywords.length - 3} more</span>` : ''
                            }
                        </div>
                        
                        ${template.verticals && template.verticals.length > 0 ? `
                            <div class="template-verticals">
                                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    ${escapeHtml(template.verticals[0])}
                                    ${template.verticals.length > 1 ? ` +${template.verticals.length - 1}` : ''}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    templatesContainer.innerHTML = templatesHTML;
    
    // Add click handlers for template items
    templatesContainer.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => {
            const templateId = item.dataset.templateId;
            selectTemplate(templateId);
        });
        
        // Make focusable for accessibility
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        
        // Add keyboard navigation
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}

// Enhanced template interaction functions
function selectTemplate(templateId) {
    console.log('Selected template:', templateId);
    
    // Remove previous selection with animation
    document.querySelectorAll('.template-item.selected').forEach(item => {
        item.classList.add('animate-out');
        setTimeout(() => {
            item.classList.remove('selected', 'bg-blue-50', 'border-l-4', 'border-facebook-blue', 'animate-out');
        }, 150);
    });
    
    // Add selection styling with animation
    const selectedItem = document.querySelector(`[data-template-id="${templateId}"]`);
    if (selectedItem) {
        setTimeout(() => {
            selectedItem.classList.add('selected', 'bg-blue-50', 'border-l-4', 'border-facebook-blue');
        }, 150);
    }
    
    showSuccessMessage('Template selected! This will be used for generating suggestions.');
}

function previewTemplate(templateId) {
    console.log('Preview template:', templateId);
    // This will be implemented in later tasks
    showSuccessMessage('Template preview will be available in the next update.');
}

function duplicateTemplate(templateId) {
    console.log('Duplicate template:', templateId);
    // This will be implemented in later tasks
    showSuccessMessage('Template duplication will be implemented in template management.');
}

/**
 * Export a single template
 * @param {string} templateId - Template ID to export
 */
async function exportSingleTemplate(templateId) {
    try {
        const template = allTemplates.find(t => t.id === templateId);
        if (!template) {
            showErrorMessage('Template not found');
            return;
        }
        
        await exportTemplatesByIds([templateId], {
            title: template.label,
            description: `Single template export: ${template.label}`
        });
        
    } catch (error) {
        console.error('Single template export failed:', error);
        showErrorMessage('Failed to export template');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(message) {
    // This will be enhanced in later tasks
    console.error('AdReply Error:', message);
}

function selectSuggestion(suggestionId, templateId) {
    // This will be implemented in later tasks
    console.log('Selected suggestion:', suggestionId, 'from template:', templateId);
}



async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        
        // Update AI settings UI based on license
        const license = await getLicenseStatus();
        updateAISettingsUI(settings, license);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function updateAISettingsUI(settings, license) {
    const aiProvider = document.getElementById('aiProvider');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const openaiApiKey = document.getElementById('openaiApiKey');
    
    const isProUser = license.tier === 'pro';
    
    // Enable/disable AI settings based on license
    aiProvider.disabled = !isProUser;
    geminiApiKey.disabled = !isProUser;
    openaiApiKey.disabled = !isProUser;
    
    if (settings.ai) {
        aiProvider.value = settings.ai.provider || 'off';
        geminiApiKey.value = settings.ai.geminiApiKey || '';
        openaiApiKey.value = settings.ai.openaiApiKey || '';
    }
}

async function getLicenseStatus() {
    try {
        const result = await chrome.storage.local.get(['license']);
        return result.license || { status: 'free', tier: 'free' };
    } catch (error) {
        console.error('Failed to get license status:', error);
        return { status: 'free', tier: 'free' };
    }
}

async function validateLicense(licenseKey) {
    console.log('Validating license:', licenseKey);
    
    try {
        // This will be implemented in later tasks
        // For now, just show a placeholder message
        alert('License validation will be implemented in a future task');
    } catch (error) {
        console.error('License validation failed:', error);
        alert('License validation failed. Please try again.');
    }
}

// Communication with content script
async function sendMessageToContentScript(message) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            return await chrome.tabs.sendMessage(tab.id, message);
        }
    } catch (error) {
        console.error('Failed to send message to content script:', error);
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Side panel received message:', message);
    
    if (message.type === 'POST_DETECTED') {
        // This will be implemented in later tasks
        console.log('Post detected, generating suggestions...');
    }
    
    if (message.type === 'GROUP_CHANGED') {
        // This will be implemented in later tasks
        console.log('Group changed:', message.groupId);
    }
});

// Template management functions
let currentEditingTemplateId = null;
let templateToDelete = null;

function editTemplate(templateId) {
    console.log('Edit template:', templateId);
    
    // Find the template in allTemplates
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) {
        showErrorMessage('Template not found');
        return;
    }
    
    // Set editing mode
    currentEditingTemplateId = templateId;
    
    // Populate form with template data
    document.getElementById('modalTitle').textContent = 'Edit Template';
    document.getElementById('submitButtonText').textContent = 'Update Template';
    document.getElementById('templateLabel').value = template.label || '';
    document.getElementById('templateContent').value = template.template || '';
    document.getElementById('templateKeywords').value = (template.keywords || []).join(', ');
    document.getElementById('templateVerticals').value = (template.verticals || []).join(', ');
    document.getElementById('templateVariants').value = (template.variants || []).join('\n');
    
    // Show modal
    showTemplateModal();
}

function deleteTemplate(templateId) {
    console.log('Delete template:', templateId);
    
    // Find the template in allTemplates
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) {
        showErrorMessage('Template not found');
        return;
    }
    
    // Store template for deletion
    templateToDelete = template;
    
    // Populate delete modal
    document.getElementById('deleteTemplateLabel').textContent = template.label;
    document.getElementById('deleteTemplateContent').textContent = template.template;
    
    // Show delete modal
    showDeleteModal();
}

// Modal management functions
function showTemplateModal() {
    const modal = document.getElementById('templateModal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('templateLabel').focus();
    }, 100);
    
    // Add escape key handler
    document.addEventListener('keydown', handleModalEscape);
}

function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
    
    // Reset form
    document.getElementById('templateForm').reset();
    currentEditingTemplateId = null;
    
    // Update modal title and button text for next use
    document.getElementById('modalTitle').textContent = 'Add Template';
    document.getElementById('submitButtonText').textContent = 'Create Template';
    
    // Remove escape key handler
    document.removeEventListener('keydown', handleModalEscape);
    
    // Clear validation errors
    clearFormErrors();
}

function showDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    // Add escape key handler
    document.addEventListener('keydown', handleDeleteModalEscape);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
    
    templateToDelete = null;
    
    // Remove escape key handler
    document.removeEventListener('keydown', handleDeleteModalEscape);
}

function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeTemplateModal();
    }
}

function handleDeleteModalEscape(e) {
    if (e.key === 'Escape') {
        closeDeleteModal();
    }
}

// Form handling
function setupTemplateFormHandlers() {
    const form = document.getElementById('templateForm');
    if (form) {
        form.addEventListener('submit', handleTemplateFormSubmit);
    }
    
    // Update add template button handler
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    if (addTemplateBtn) {
        // Remove existing event listener by cloning the element
        const newAddTemplateBtn = addTemplateBtn.cloneNode(true);
        addTemplateBtn.parentNode.replaceChild(newAddTemplateBtn, addTemplateBtn);
        
        newAddTemplateBtn.addEventListener('click', () => {
            currentEditingTemplateId = null;
            document.getElementById('modalTitle').textContent = 'Add Template';
            document.getElementById('submitButtonText').textContent = 'Create Template';
            document.getElementById('templateForm').reset();
            showTemplateModal();
        });
    }
}

async function handleTemplateFormSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearFormErrors();
    
    // Get form data
    const formData = {
        label: document.getElementById('templateLabel').value.trim(),
        template: document.getElementById('templateContent').value.trim(),
        keywords: document.getElementById('templateKeywords').value.trim(),
        verticals: document.getElementById('templateVerticals').value.trim(),
        variants: document.getElementById('templateVariants').value.trim()
    };
    
    // Validate form
    const validation = validateTemplateForm(formData);
    if (!validation.isValid) {
        showFormErrors(validation.errors);
        return;
    }
    
    // Process form data
    const templateData = {
        id: currentEditingTemplateId || generateTemplateId(),
        label: formData.label,
        template: formData.template,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        verticals: formData.verticals ? formData.verticals.split(',').map(v => v.trim()).filter(v => v) : [],
        variants: formData.variants ? formData.variants.split('\n').map(v => v.trim()).filter(v => v) : [],
        createdAt: currentEditingTemplateId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: currentEditingTemplateId ? undefined : 0
    };
    
    // Show loading state
    setFormLoading(true);
    
    try {
        // Save template (this will be implemented with storage in later tasks)
        await saveTemplate(templateData);
        
        // Update UI
        if (currentEditingTemplateId) {
            showSuccessMessage('Template updated successfully!');
        } else {
            showSuccessMessage('Template created successfully!');
        }
        
        // Close modal
        closeTemplateModal();
        
        // Reload templates
        await loadTemplates();
        
    } catch (error) {
        console.error('Failed to save template:', error);
        showErrorMessage('Failed to save template. Please try again.');
    } finally {
        setFormLoading(false);
    }
}

function validateTemplateForm(data) {
    const errors = {};
    
    if (!data.label) {
        errors.templateLabel = 'Template label is required';
    } else if (data.label.length > 100) {
        errors.templateLabel = 'Template label must be less than 100 characters';
    }
    
    if (!data.template) {
        errors.templateContent = 'Template content is required';
    } else if (data.template.length > 500) {
        errors.templateContent = 'Template content must be less than 500 characters';
    }
    
    if (!data.keywords) {
        errors.templateKeywords = 'At least one keyword is required';
    } else {
        const keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
        if (keywords.length === 0) {
            errors.templateKeywords = 'At least one keyword is required';
        } else if (keywords.length > 20) {
            errors.templateKeywords = 'Maximum 20 keywords allowed';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

function showFormErrors(errors) {
    let firstErrorField = null;
    
    Object.keys(errors).forEach((fieldId, index) => {
        const field = document.getElementById(fieldId);
        const errorMessage = errors[fieldId];
        
        if (field) {
            const formGroup = field.closest('.form-group');
            
            // Set ARIA attributes
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
            
            if (formGroup) {
                formGroup.setAttribute('aria-invalid', 'true');
            }
            
            // Remove existing error message and ARIA attributes
            const existingError = field.parentNode.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Create unique error ID
            const errorId = `${fieldId}-error`;
            
            // Add new error message
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.id = errorId;
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            errorElement.textContent = errorMessage;
            field.parentNode.appendChild(errorElement);
            
            // Link field to error message
            field.setAttribute('aria-describedby', errorId);
            
            // Remember first error field for focus
            if (index === 0) {
                firstErrorField = field;
            }
        }
    });
    
    // Focus first error field and announce errors
    if (firstErrorField) {
        firstErrorField.focus();
        announceToScreenReader(`Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}. Please correct and try again.`);
    }
}

function clearFormErrors() {
    // Remove error classes and ARIA attributes
    document.querySelectorAll('.form-input.error').forEach(input => {
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
        input.removeAttribute('aria-describedby');
        
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.setAttribute('aria-invalid', 'false');
        }
    });
    
    // Remove error messages
    document.querySelectorAll('.form-error').forEach(error => {
        error.remove();
    });
}

function setFormLoading(loading) {
    const form = document.getElementById('templateForm');
    if (loading) {
        form.classList.add('form-loading');
    } else {
        form.classList.remove('form-loading');
    }
}

// Delete confirmation
async function confirmDeleteTemplate() {
    if (!templateToDelete) {
        showErrorMessage('No template selected for deletion');
        return;
    }
    
    try {
        // Delete template (this will be implemented with storage in later tasks)
        await deleteTemplateById(templateToDelete.id);
        
        showSuccessMessage('Template deleted successfully!');
        closeDeleteModal();
        
        // Reload templates
        await loadTemplates();
        
    } catch (error) {
        console.error('Failed to delete template:', error);
        showErrorMessage('Failed to delete template. Please try again.');
    }
}

// Utility functions
function generateTemplateId() {
    return 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Placeholder functions for storage operations (will be implemented in later tasks)
async function saveTemplate(templateData) {
    console.log('Saving template:', templateData);
    
    // Update allTemplates array for immediate UI feedback
    if (currentEditingTemplateId) {
        const index = allTemplates.findIndex(t => t.id === currentEditingTemplateId);
        if (index !== -1) {
            allTemplates[index] = { ...allTemplates[index], ...templateData };
        }
    } else {
        allTemplates.push(templateData);
    }
    
    // This will be replaced with actual storage implementation
    return Promise.resolve();
}

async function deleteTemplateById(templateId) {
    console.log('Deleting template:', templateId);
    
    // Remove from allTemplates array for immediate UI feedback
    const index = allTemplates.findIndex(t => t.id === templateId);
    if (index !== -1) {
        allTemplates.splice(index, 1);
    }
    
    // This will be replaced with actual storage implementation
    return Promise.resolve();
}

// License management functions
async function initializeLicenseFeatures() {
    try {
        // Update AI settings based on license
        await updateAISettingsAvailability();
        
        // Update template limits
        await updateTemplateLimitDisplay();
        
        // Set up upgrade button handlers
        setupUpgradeHandlers();
        
        console.log('License features initialized');
    } catch (error) {
        console.error('Failed to initialize license features:', error);
    }
}

async function updateFeatureAvailability(license) {
    // Update AI settings availability
    await updateAISettingsAvailability();
    
    // Update template management availability
    await updateTemplateManagementAvailability();
    
    // Show/hide upgrade prompts
    updateUpgradePrompts(license);
}

async function updateAISettingsAvailability() {
    const hasAIAccess = await LicenseUtils.checkFeatureAccess('ai_integration');
    
    const aiProvider = document.getElementById('aiProvider');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const openaiApiKey = document.getElementById('openaiApiKey');
    const proNotice = document.querySelector('.pro-feature-notice');
    
    if (hasAIAccess) {
        // Enable AI settings
        if (aiProvider) aiProvider.disabled = false;
        if (geminiApiKey) geminiApiKey.disabled = false;
        if (openaiApiKey) openaiApiKey.disabled = false;
        
        // Hide pro notice
        if (proNotice) proNotice.style.display = 'none';
        
        // Update styling
        [aiProvider, geminiApiKey, openaiApiKey].forEach(element => {
            if (element) {
                element.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
                element.classList.add('bg-white', 'text-gray-900');
            }
        });
    } else {
        // Disable AI settings
        if (aiProvider) {
            aiProvider.disabled = true;
            aiProvider.value = 'off';
        }
        if (geminiApiKey) {
            geminiApiKey.disabled = true;
            geminiApiKey.value = '';
        }
        if (openaiApiKey) {
            openaiApiKey.disabled = true;
            openaiApiKey.value = '';
        }
        
        // Show pro notice
        if (proNotice) proNotice.style.display = 'block';
        
        // Update styling
        [aiProvider, geminiApiKey, openaiApiKey].forEach(element => {
            if (element) {
                element.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
                element.classList.remove('bg-white', 'text-gray-900');
            }
        });
    }
}

async function updateTemplateManagementAvailability() {
    const canAdd = await LicenseUtils.canAddTemplate();
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    
    if (addTemplateBtn) {
        if (canAdd) {
            addTemplateBtn.disabled = false;
            addTemplateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            addTemplateBtn.title = '';
        } else {
            addTemplateBtn.disabled = true;
            addTemplateBtn.classList.add('opacity-50', 'cursor-not-allowed');
            addTemplateBtn.title = 'Template limit reached. Upgrade to Pro for unlimited templates.';
        }
    }
}

async function updateTemplateLimitDisplay() {
    const templateLimit = await LicenseUtils.getTemplateLimit();
    const currentCount = allTemplates.length;
    
    // Update template section header with limit info
    const sectionHeader = document.querySelector('.templates-section .section-header h2');
    if (sectionHeader && templateLimit !== Infinity) {
        sectionHeader.textContent = `Templates (${currentCount}/${templateLimit})`;
    } else if (sectionHeader) {
        sectionHeader.textContent = 'Templates';
    }
    
    // Show limit warning if needed
    const templatesSection = document.querySelector('.templates-section');
    if (templatesSection && currentCount >= templateLimit) {
        LicenseUtils.showTemplateLimitWarning(templatesSection, {
            limit: templateLimit,
            current: currentCount,
            isAtLimit: true,
            remaining: 0
        });
    }
}

function updateUpgradePrompts(license) {
    // Show/hide upgrade prompts based on license status
    const upgradeButtons = document.querySelectorAll('.btn-upgrade');
    
    if (license?.tier === 'pro') {
        // Hide upgrade prompts for Pro users
        upgradeButtons.forEach(btn => {
            const container = btn.closest('.pro-feature-notice, .pro-upgrade');
            if (container) container.style.display = 'none';
        });
    } else {
        // Show upgrade prompts for free users
        upgradeButtons.forEach(btn => {
            const container = btn.closest('.pro-feature-notice, .pro-upgrade');
            if (container) container.style.display = 'block';
        });
    }
}

function setupUpgradeHandlers() {
    const upgradeButtons = document.querySelectorAll('.btn-upgrade');
    
    upgradeButtons.forEach(button => {
        // Remove existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new listener
        newButton.addEventListener('click', () => {
            LicenseUtils.openUpgradeFlow('pro_features');
        });
    });
}

async function validateLicense(licenseKey) {
    if (!licenseKey || licenseKey.trim().length === 0) {
        showErrorMessage('Please enter a license key');
        return;
    }
    
    try {
        // Show loading state
        const validateBtn = document.getElementById('validateLicenseBtn');
        const originalText = validateBtn.textContent;
        validateBtn.textContent = 'Validating...';
        validateBtn.disabled = true;
        
        // Validate license
        const result = await LicenseUtils.upgradeToPro(licenseKey.trim());
        
        if (result.success) {
            showSuccessMessage('License validated successfully! Pro features are now available.');
            
            // Clear the input
            document.getElementById('licenseKey').value = '';
            
            // Reload license status
            await loadLicenseStatus();
            
            // Refresh feature availability
            const license = await LicenseUtils.getLicenseStatus();
            await updateFeatureAvailability(license);
            
        } else {
            showErrorMessage(result.error || 'License validation failed');
        }
        
    } catch (error) {
        console.error('License validation error:', error);
        showErrorMessage('License validation failed. Please try again.');
    } finally {
        // Restore button state
        const validateBtn = document.getElementById('validateLicenseBtn');
        validateBtn.textContent = 'Validate';
        validateBtn.disabled = false;
    }
}

// Enhanced template form handling with license checks
async function handleTemplateFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#templateForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Check if user can add templates
        if (!currentEditingTemplateId) {
            const canAdd = await LicenseUtils.canAddTemplate();
            if (!canAdd) {
                showErrorMessage('Template limit reached. Upgrade to Pro for unlimited templates.');
                
                // Show upgrade prompt
                const formContainer = document.querySelector('.modal-content');
                await LicenseUtils.showUpgradePromptIfNeeded('unlimited_templates', formContainer);
                return;
            }
        }
        
        // Clear previous errors
        clearFormErrors();
        
        // Get form data
        const formData = {
            label: document.getElementById('templateLabel').value.trim(),
            template: document.getElementById('templateContent').value.trim(),
            keywords: document.getElementById('templateKeywords').value.trim(),
            verticals: document.getElementById('templateVerticals').value.trim(),
            variants: document.getElementById('templateVariants').value.trim()
        };
        
        // Validate form
        const validation = validateTemplateForm(formData);
        if (!validation.isValid) {
            showFormErrors(validation.errors);
            // Add error shake animation
            document.getElementById('templateForm').classList.add('error-feedback');
            setTimeout(() => {
                document.getElementById('templateForm').classList.remove('error-feedback');
            }, 500);
            return;
        }
        
        // Show loading state
        setFormLoading(true);
        setButtonLoading(submitBtn, currentEditingTemplateId ? 'Updating...' : 'Creating...');
        
        // Process form data
        const templateData = {
            id: currentEditingTemplateId || generateTemplateId(),
            label: formData.label,
            template: formData.template,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
            verticals: formData.verticals ? formData.verticals.split(',').map(v => v.trim()).filter(v => v) : [],
            variants: formData.variants ? formData.variants.split('\n').map(v => v.trim()).filter(v => v) : [],
            createdAt: currentEditingTemplateId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: currentEditingTemplateId ? undefined : 0
        };
        
        // Simulate save delay for better UX feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Save template (this will be implemented with storage in later tasks)
        await saveTemplate(templateData);
        
        // Show success state
        setButtonSuccess(submitBtn, currentEditingTemplateId ? 'Updated!' : 'Created!');
        
        // Update UI
        if (currentEditingTemplateId) {
            showSuccessMessage('Template updated successfully!');
        } else {
            showSuccessMessage('Template created successfully!');
        }
        
        // Wait a moment to show success state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Close modal
        closeTemplateModal();
        
        // Reload templates and update limits
        await loadTemplates();
        await updateTemplateLimitDisplay();
        
    } catch (error) {
        console.error('Failed to save template:', error);
        showErrorMessage('Failed to save template. Please try again.');
        
        // Add error feedback to form
        document.getElementById('templateForm').classList.add('error-feedback');
        setTimeout(() => {
            document.getElementById('templateForm').classList.remove('error-feedback');
        }, 500);
    } finally {
        setFormLoading(false);
        resetButtonState(submitBtn, originalText);
    }
}

function setButtonLoading(button, text) {
    button.classList.add('loading');
    button.disabled = true;
    button.innerHTML = `
        <span class="flex items-center justify-center">
            <div class="spinner-small mr-2"></div>
            ${text}
        </span>
    `;
}

function setButtonSuccess(button, text) {
    button.classList.remove('loading');
    button.classList.add('success');
    button.innerHTML = `
        <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            ${text}
        </span>
    `;
}

function resetButtonState(button, originalText) {
    button.classList.remove('loading', 'success');
    button.disabled = false;
    button.innerHTML = originalText;
}

// Initialize template form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupTemplateFormHandlers();
});

// ===== AI REPHRASING FUNCTIONALITY =====

/**
 * Rephrase a template using AI
 * @param {string} templateId - Template ID to rephrase
 */
async function rephraseTemplate(templateId) {
    console.log('Rephrase template:', templateId);
    
    try {
        // Check if user has AI access
        const hasAIAccess = await LicenseUtils.checkFeatureAccess('ai_integration');
        if (!hasAIAccess) {
            showUpgradePromptForAI();
            return;
        }
        
        // Find the template
        const template = allTemplates.find(t => t.id === templateId);
        if (!template) {
            showErrorMessage('Template not found');
            return;
        }
        
        // Show rephrasing modal
        showRephraseModal(template);
        
    } catch (error) {
        console.error('Failed to start rephrasing:', error);
        showErrorMessage('Failed to start rephrasing. Please try again.');
    }
}

/**
 * Show the rephrasing modal with template preview
 * @param {Object} template - Template to rephrase
 */
function showRephraseModal(template) {
    const modal = document.getElementById('rephraseModal');
    if (!modal) {
        createRephraseModal();
        return showRephraseModal(template);
    }
    
    // Populate modal with template data
    document.getElementById('rephraseOriginalText').textContent = template.template;
    document.getElementById('rephraseTemplateLabel').textContent = template.label;
    document.getElementById('rephraseContext').value = '';
    document.getElementById('rephraseResult').innerHTML = '';
    
    // Store template ID for later use
    modal.dataset.templateId = template.id;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Focus on context input
    setTimeout(() => {
        document.getElementById('rephraseContext').focus();
    }, 100);
    
    // Set up event listeners
    setupRephraseModalHandlers();
}

/**
 * Create the rephrasing modal HTML
 */
function createRephraseModal() {
    const modalHTML = `
        <div id="rephraseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="modal-header flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">AI Template Rephrasing</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Template: <span id="rephraseTemplateLabel" class="font-medium"></span>
                        </p>
                    </div>
                    <button onclick="closeRephraseModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body p-6 space-y-6">
                    <!-- Original Template -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Original Template</label>
                        <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p id="rephraseOriginalText" class="text-sm text-gray-900"></p>
                        </div>
                    </div>
                    
                    <!-- Context Input -->
                    <div>
                        <label for="rephraseContext" class="block text-sm font-medium text-gray-700 mb-2">
                            Context (Optional)
                        </label>
                        <textarea 
                            id="rephraseContext" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-facebook-blue focus:border-transparent resize-none"
                            rows="3"
                            placeholder="Provide context about your business, target audience, or specific tone you want..."></textarea>
                        <p class="text-xs text-gray-500 mt-1">
                            Adding context helps the AI create more relevant rephrases
                        </p>
                    </div>
                    
                    <!-- Rephrase Result -->
                    <div id="rephraseResultContainer" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">AI Rephrased Version</label>
                        <div id="rephraseResult" class="bg-blue-50 border border-blue-200 rounded-md p-3 min-h-[60px]">
                            <!-- Rephrased text will appear here -->
                        </div>
                        
                        <!-- Action buttons for rephrased text -->
                        <div class="flex justify-between items-center mt-3">
                            <div class="flex space-x-2">
                                <button onclick="copyRephrasedText()" class="text-sm text-facebook-blue hover:text-facebook-hover font-medium">
                                    📋 Copy
                                </button>
                                <button onclick="regenerateRephrase()" class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                    🔄 Regenerate
                                </button>
                            </div>
                            <button onclick="applyRephrasedText()" class="bg-facebook-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-facebook-hover transition-colors">
                                Apply to Template
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer flex justify-between items-center p-6 border-t border-gray-200">
                    <div class="text-xs text-gray-500">
                        💡 Tip: Be specific in your context for better results
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="closeRephraseModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onclick="startRephrasing()" id="rephraseBtn" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                            ✨ Rephrase with AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Set up event handlers for the rephrase modal
 */
function setupRephraseModalHandlers() {
    // Handle Escape key
    document.addEventListener('keydown', handleRephraseModalEscape);
    
    // Handle Enter key in context textarea
    const contextInput = document.getElementById('rephraseContext');
    if (contextInput) {
        contextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                startRephrasing();
            }
        });
    }
}

/**
 * Handle Escape key for rephrase modal
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleRephraseModalEscape(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('rephraseModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeRephraseModal();
        }
    }
}

/**
 * Close the rephrasing modal
 */
function closeRephraseModal() {
    const modal = document.getElementById('rephraseModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        
        // Clean up event listeners
        document.removeEventListener('keydown', handleRephraseModalEscape);
    }
}

/**
 * Start the AI rephrasing process
 */
async function startRephrasing() {
    const modal = document.getElementById('rephraseModal');
    const templateId = modal.dataset.templateId;
    const context = document.getElementById('rephraseContext').value.trim();
    const rephraseBtn = document.getElementById('rephraseBtn');
    const resultContainer = document.getElementById('rephraseResultContainer');
    const resultDiv = document.getElementById('rephraseResult');
    
    try {
        // Show loading state
        rephraseBtn.disabled = true;
        rephraseBtn.innerHTML = '⏳ Rephrasing...';
        
        // Show result container with loading
        resultContainer.classList.remove('hidden');
        resultDiv.innerHTML = `
            <div class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span class="ml-2 text-sm text-gray-600">AI is rephrasing your template...</span>
            </div>
        `;
        
        // Call AI service (this will be implemented with actual AI integration)
        const result = await performAIRephrasing(templateId, context);
        
        if (result.success) {
            // Show rephrased text
            resultDiv.innerHTML = `
                <p class="text-sm text-gray-900">${escapeHtml(result.rephrasedText)}</p>
            `;
            
            // Store rephrased text for later use
            resultDiv.dataset.rephrasedText = result.rephrasedText;
            
            showSuccessMessage('Template rephrased successfully!');
        } else {
            throw new Error(result.error || 'Rephrasing failed');
        }
        
    } catch (error) {
        console.error('AI rephrasing failed:', error);
        
        // Show error in result container
        resultDiv.innerHTML = `
            <div class="text-center py-4">
                <div class="text-red-600 mb-2">
                    <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-sm text-red-600">${error.message}</p>
                <button onclick="startRephrasing()" class="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Try Again
                </button>
            </div>
        `;
        
        showErrorMessage('AI rephrasing failed. Please try again.');
        
    } finally {
        // Restore button state
        rephraseBtn.disabled = false;
        rephraseBtn.innerHTML = '✨ Rephrase with AI';
    }
}

/**
 * Perform AI rephrasing (placeholder for actual AI integration)
 * @param {string} templateId - Template ID
 * @param {string} context - Additional context
 * @returns {Promise<Object>} Rephrasing result
 */
async function performAIRephrasing(templateId, context) {
    // This is a placeholder - will be replaced with actual AI service integration
    return new Promise((resolve) => {
        setTimeout(() => {
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                // Simulate AI rephrasing with a simple transformation
                const rephrasedText = `${template.template} (AI rephrased with context: ${context || 'none'})`;
                resolve({
                    success: true,
                    rephrasedText: rephrasedText,
                    originalText: template.template
                });
            } else {
                resolve({
                    success: false,
                    error: 'Template not found'
                });
            }
        }, 2000); // Simulate API delay
    });
}

/**
 * Copy rephrased text to clipboard
 */
async function copyRephrasedText() {
    const resultDiv = document.getElementById('rephraseResult');
    const rephrasedText = resultDiv.dataset.rephrasedText;
    
    if (rephrasedText) {
        try {
            await navigator.clipboard.writeText(rephrasedText);
            showSuccessMessage('Rephrased text copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy text:', error);
            showErrorMessage('Failed to copy text');
        }
    }
}

/**
 * Regenerate the rephrased text
 */
async function regenerateRephrase() {
    await startRephrasing();
}

/**
 * Apply rephrased text to the original template
 */
async function applyRephrasedText() {
    const modal = document.getElementById('rephraseModal');
    const templateId = modal.dataset.templateId;
    const resultDiv = document.getElementById('rephraseResult');
    const rephrasedText = resultDiv.dataset.rephrasedText;
    
    if (!rephrasedText) {
        showErrorMessage('No rephrased text to apply');
        return;
    }
    
    try {
        // Find and update the template
        const templateIndex = allTemplates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) {
            throw new Error('Template not found');
        }
        
        // Update template with rephrased text
        allTemplates[templateIndex] = {
            ...allTemplates[templateIndex],
            template: rephrasedText,
            updatedAt: new Date().toISOString()
        };
        
        // Save template (this will be implemented with actual storage)
        await saveTemplate(allTemplates[templateIndex]);
        
        // Refresh template display
        filterTemplates(
            document.getElementById('templateSearch')?.value.toLowerCase().trim() || '',
            getCurrentFilter()
        );
        
        // Close modal
        closeRephraseModal();
        
        showSuccessMessage('Template updated with AI rephrased text!');
        
    } catch (error) {
        console.error('Failed to apply rephrased text:', error);
        showErrorMessage('Failed to apply rephrased text. Please try again.');
    }
}

/**
 * Show upgrade prompt for AI features
 */
function showUpgradePromptForAI() {
    const upgradeHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="aiUpgradePrompt">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="p-6 text-center">
                    <div class="mb-4">
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI Features Require Pro</h3>
                        <p class="text-gray-600 text-sm">
                            AI-powered template rephrasing is available with AdReply Pro. 
                            Upgrade to access advanced AI features and unlimited templates.
                        </p>
                    </div>
                    
                    <div class="bg-purple-50 rounded-lg p-4 mb-6">
                        <h4 class="font-medium text-purple-900 mb-2">Pro Features Include:</h4>
                        <ul class="text-sm text-purple-700 space-y-1">
                            <li>✨ AI template rephrasing</li>
                            <li>🎯 AI template generation</li>
                            <li>📚 Unlimited templates</li>
                            <li>📦 Ad Pack imports</li>
                        </ul>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="closeAIUpgradePrompt()" class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Maybe Later
                        </button>
                        <button onclick="upgradeToProForAI()" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', upgradeHTML);
}

/**
 * Close AI upgrade prompt
 */
function closeAIUpgradePrompt() {
    const prompt = document.getElementById('aiUpgradePrompt');
    if (prompt) {
        prompt.remove();
    }
}

/**
 * Handle upgrade to Pro for AI features
 */
function upgradeToProForAI() {
    closeAIUpgradePrompt();
    
    // Switch to license tab
    const licenseTab = document.querySelector('[data-tab="license"]');
    if (licenseTab) {
        licenseTab.click();
    }
    
    // Focus on license key input
    setTimeout(() => {
        const licenseInput = document.getElementById('licenseKey');
        if (licenseInput) {
            licenseInput.focus();
        }
    }, 100);
}

// Initialize AI features when license status changes
document.addEventListener('licenseStatusChanged', async (event) => {
    const license = event.detail;
    await updateAIFeatureAvailability(license);
});

/**
 * Update AI feature availability based on license
 * @param {Object} license - License information
 */
async function updateAIFeatureAvailability(license) {
    const hasAIAccess = license?.features?.includes('ai_integration') || false;
    const rephraseButtons = document.querySelectorAll('.ai-rephrase-btn');
    
    rephraseButtons.forEach(button => {
        if (hasAIAccess) {
            button.classList.remove('opacity-50', 'cursor-not-allowed');
            button.title = 'Rephrase with AI (Pro)';
        } else {
            button.classList.add('opacity-50', 'cursor-not-allowed');
            button.title = 'Rephrase with AI (Pro) - Upgrade required';
        }
    });
}

// ===== BATCH REPHRASING FUNCTIONALITY =====

/**
 * Show batch rephrasing interface
 */
function showBatchRephraseInterface() {
    // Check if user has AI access
    LicenseUtils.checkFeatureAccess('ai_integration').then(hasAccess => {
        if (!hasAccess) {
            showUpgradePromptForAI();
            return;
        }
        
        // Show batch rephrase modal
        showBatchRephraseModal();
    });
}

/**
 * Create and show batch rephrase modal
 */
function showBatchRephraseModal() {
    const modalHTML = `
        <div id="batchRephraseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="modal-header flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Batch Template Rephrasing</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Select templates to rephrase with AI
                        </p>
                    </div>
                    <button onclick="closeBatchRephraseModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body p-6">
                    <!-- Batch Context -->
                    <div class="mb-6">
                        <label for="batchRephraseContext" class="block text-sm font-medium text-gray-700 mb-2">
                            Context for All Templates (Optional)
                        </label>
                        <textarea 
                            id="batchRephraseContext" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows="3"
                            placeholder="Provide context that applies to all templates (business type, tone, target audience...)"></textarea>
                    </div>
                    
                    <!-- Template Selection -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-sm font-medium text-gray-700">Select Templates to Rephrase</h4>
                            <div class="flex space-x-2">
                                <button onclick="selectAllTemplatesForBatch()" class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                    Select All
                                </button>
                                <button onclick="deselectAllTemplatesForBatch()" class="text-sm text-gray-600 hover:text-gray-700 font-medium">
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        
                        <div id="batchTemplateList" class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            <!-- Template list will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Progress Section (hidden initially) -->
                    <div id="batchRephraseProgress" class="hidden mb-6">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Rephrasing Progress</h4>
                        <div class="bg-gray-100 rounded-lg p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-600">Progress</span>
                                <span id="batchProgressText" class="text-sm font-medium text-gray-900">0 / 0</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div id="batchProgressBar" class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                            <div id="batchCurrentTemplate" class="text-xs text-gray-500 mt-2"></div>
                        </div>
                    </div>
                    
                    <!-- Results Section (hidden initially) -->
                    <div id="batchRephraseResults" class="hidden">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Rephrasing Results</h4>
                        <div id="batchResultsList" class="space-y-3 max-h-60 overflow-y-auto">
                            <!-- Results will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer flex justify-between items-center p-6 border-t border-gray-200">
                    <div class="text-xs text-gray-500">
                        💡 Tip: Batch rephrasing processes templates one by one to ensure quality
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="closeBatchRephraseModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onclick="startBatchRephrasing()" id="batchRephraseBtn" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                            ✨ Start Batch Rephrasing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Populate template list
    populateBatchTemplateList();
}

/**
 * Populate the batch template selection list
 */
function populateBatchTemplateList() {
    const listContainer = document.getElementById('batchTemplateList');
    
    if (allTemplates.length === 0) {
        listContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <p class="text-sm">No templates available for rephrasing.</p>
            </div>
        `;
        return;
    }
    
    const templatesHTML = allTemplates.map(template => `
        <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <input 
                type="checkbox" 
                id="batch_${template.id}" 
                class="batch-template-checkbox mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                data-template-id="${template.id}">
            <label for="batch_${template.id}" class="flex-1 cursor-pointer">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(template.label)}</div>
                <div class="text-xs text-gray-600 mt-1 line-clamp-2">${escapeHtml(template.template)}</div>
                <div class="flex items-center space-x-2 mt-2">
                    ${template.keywords.slice(0, 2).map(keyword => 
                        `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                            ${escapeHtml(keyword)}
                        </span>`
                    ).join('')}
                    ${template.keywords.length > 2 ? `<span class="text-xs text-gray-500">+${template.keywords.length - 2} more</span>` : ''}
                </div>
            </label>
        </div>
    `).join('');
    
    listContainer.innerHTML = templatesHTML;
}

/**
 * Select all templates for batch rephrasing
 */
function selectAllTemplatesForBatch() {
    const checkboxes = document.querySelectorAll('.batch-template-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

/**
 * Deselect all templates for batch rephrasing
 */
function deselectAllTemplatesForBatch() {
    const checkboxes = document.querySelectorAll('.batch-template-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * Start batch rephrasing process
 */
async function startBatchRephrasing() {
    const selectedCheckboxes = document.querySelectorAll('.batch-template-checkbox:checked');
    const context = document.getElementById('batchRephraseContext').value.trim();
    
    if (selectedCheckboxes.length === 0) {
        showErrorMessage('Please select at least one template to rephrase');
        return;
    }
    
    const selectedTemplateIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.templateId);
    const totalTemplates = selectedTemplateIds.length;
    
    // Show progress section
    const progressSection = document.getElementById('batchRephraseProgress');
    const resultsSection = document.getElementById('batchRephraseResults');
    const batchBtn = document.getElementById('batchRephraseBtn');
    
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Update button state
    batchBtn.disabled = true;
    batchBtn.innerHTML = '⏳ Rephrasing...';
    
    // Initialize progress
    updateBatchProgress(0, totalTemplates, 'Starting batch rephrasing...');
    
    const results = [];
    
    try {
        // Process templates one by one
        for (let i = 0; i < selectedTemplateIds.length; i++) {
            const templateId = selectedTemplateIds[i];
            const template = allTemplates.find(t => t.id === templateId);
            
            if (!template) continue;
            
            // Update progress
            updateBatchProgress(i, totalTemplates, `Rephrasing: ${template.label}`);
            
            try {
                // Perform AI rephrasing
                const result = await performAIRephrasing(templateId, context);
                
                results.push({
                    templateId,
                    template,
                    success: result.success,
                    rephrasedText: result.rephrasedText,
                    error: result.error
                });
                
                // Small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Failed to rephrase template ${templateId}:`, error);
                results.push({
                    templateId,
                    template,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Update final progress
        updateBatchProgress(totalTemplates, totalTemplates, 'Batch rephrasing completed!');
        
        // Show results
        displayBatchResults(results);
        
        // Update button
        batchBtn.innerHTML = '✅ Rephrasing Complete';
        
        showSuccessMessage(`Batch rephrasing completed! ${results.filter(r => r.success).length}/${totalTemplates} templates rephrased successfully.`);
        
    } catch (error) {
        console.error('Batch rephrasing failed:', error);
        showErrorMessage('Batch rephrasing failed. Please try again.');
        
        // Restore button
        batchBtn.disabled = false;
        batchBtn.innerHTML = '✨ Start Batch Rephrasing';
    }
}

/**
 * Update batch rephrasing progress
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} message - Progress message
 */
function updateBatchProgress(current, total, message) {
    const progressText = document.getElementById('batchProgressText');
    const progressBar = document.getElementById('batchProgressBar');
    const currentTemplate = document.getElementById('batchCurrentTemplate');
    
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    if (progressText) progressText.textContent = `${current} / ${total}`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (currentTemplate) currentTemplate.textContent = message;
}

/**
 * Display batch rephrasing results
 * @param {Array} results - Array of rephrasing results
 */
function displayBatchResults(results) {
    const resultsSection = document.getElementById('batchRephraseResults');
    const resultsList = document.getElementById('batchResultsList');
    
    const resultsHTML = results.map(result => {
        const statusIcon = result.success ? '✅' : '❌';
        const statusClass = result.success ? 'text-green-600' : 'text-red-600';
        
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-lg">${statusIcon}</span>
                        <div>
                            <h5 class="text-sm font-medium text-gray-900">${escapeHtml(result.template.label)}</h5>
                            <p class="text-xs ${statusClass}">${result.success ? 'Successfully rephrased' : result.error}</p>
                        </div>
                    </div>
                    ${result.success ? `
                        <div class="flex space-x-2">
                            <button onclick="previewBatchResult('${result.templateId}')" class="text-xs text-purple-600 hover:text-purple-700 font-medium">
                                Preview
                            </button>
                            <button onclick="applyBatchResult('${result.templateId}')" class="text-xs text-green-600 hover:text-green-700 font-medium">
                                Apply
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                ${result.success ? `
                    <div class="mt-3">
                        <div class="text-xs text-gray-500 mb-1">Original:</div>
                        <div class="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-2">${escapeHtml(result.template.template)}</div>
                        
                        <div class="text-xs text-gray-500 mb-1">Rephrased:</div>
                        <div class="text-xs text-gray-900 bg-blue-50 p-2 rounded" data-rephrased-text="${escapeHtml(result.rephrasedText)}">${escapeHtml(result.rephrasedText)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    resultsList.innerHTML = resultsHTML;
    resultsSection.classList.remove('hidden');
}

/**
 * Preview batch rephrasing result
 * @param {string} templateId - Template ID
 */
function previewBatchResult(templateId) {
    // Find the result element
    const resultElement = document.querySelector(`[onclick="previewBatchResult('${templateId}')"]`).closest('.border');
    const rephrasedElement = resultElement.querySelector('[data-rephrased-text]');
    const rephrasedText = rephrasedElement.dataset.rephrasedText;
    
    // Show preview modal or expand inline
    alert(`Rephrased text:\n\n${rephrasedText}`);
}

/**
 * Apply batch rephrasing result to template
 * @param {string} templateId - Template ID
 */
async function applyBatchResult(templateId) {
    try {
        // Find the result element
        const resultElement = document.querySelector(`[onclick="applyBatchResult('${templateId}')"]`).closest('.border');
        const rephrasedElement = resultElement.querySelector('[data-rephrased-text]');
        const rephrasedText = rephrasedElement.dataset.rephrasedText;
        
        // Update template
        const templateIndex = allTemplates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) {
            throw new Error('Template not found');
        }
        
        allTemplates[templateIndex] = {
            ...allTemplates[templateIndex],
            template: rephrasedText,
            updatedAt: new Date().toISOString()
        };
        
        // Save template
        await saveTemplate(allTemplates[templateIndex]);
        
        // Update UI to show applied state
        const applyButton = resultElement.querySelector(`[onclick="applyBatchResult('${templateId}')"]`);
        applyButton.textContent = 'Applied ✓';
        applyButton.classList.remove('text-green-600', 'hover:text-green-700');
        applyButton.classList.add('text-gray-500');
        applyButton.onclick = null;
        
        showSuccessMessage('Template updated successfully!');
        
    } catch (error) {
        console.error('Failed to apply batch result:', error);
        showErrorMessage('Failed to apply rephrased text. Please try again.');
    }
}

/**
 * Close batch rephrase modal
 */
function closeBatchRephraseModal() {
    const modal = document.getElementById('batchRephraseModal');
    if (modal) {
        modal.remove();
    }
}

// Add batch rephrase button to templates section (this would be added to the HTML)
document.addEventListener('DOMContentLoaded', () => {
    // Add batch rephrase button to templates header if it doesn't exist
    const templatesHeader = document.querySelector('.templates-section .section-header');
    if (templatesHeader && !document.getElementById('batchRephraseBtn')) {
        const batchButton = document.createElement('button');
        batchButton.id = 'batchRephraseBtn';
        batchButton.className = 'text-sm text-purple-600 hover:text-purple-700 font-medium';
        batchButton.innerHTML = '✨ Batch Rephrase';
        batchButton.onclick = showBatchRephraseInterface;
        
        templatesHeader.appendChild(batchButton);
    }
});

// ===== AI TEMPLATE GENERATION FUNCTIONALITY =====

/**
 * Show AI template generation interface
 */
function showAITemplateGenerator() {
    // Check if user has AI access
    LicenseUtils.checkFeatureAccess('ai_integration').then(hasAccess => {
        if (!hasAccess) {
            showUpgradePromptForAI();
            return;
        }
        
        // Show AI generation modal
        showAIGenerationModal();
    });
}

/**
 * Create and show AI template generation modal
 */
function showAIGenerationModal() {
    const modalHTML = `
        <div id="aiGenerationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="modal-header flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">AI Template Generation</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Generate advertisement templates using AI based on your business description
                        </p>
                    </div>
                    <button onclick="closeAIGenerationModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body p-6 space-y-6">
                    <!-- Business Description -->
                    <div>
                        <label for="businessDescription" class="block text-sm font-medium text-gray-700 mb-2">
                            Business Description *
                        </label>
                        <textarea 
                            id="businessDescription" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows="4"
                            placeholder="Describe your business, services, or products. Be specific about what you offer, your target audience, and your unique selling points..."></textarea>
                        <p class="text-xs text-gray-500 mt-1">
                            The more detailed your description, the better the AI-generated templates will be
                        </p>
                    </div>
                    
                    <!-- Generation Options -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="templateCount" class="block text-sm font-medium text-gray-700 mb-2">
                                Number of Templates
                            </label>
                            <select id="templateCount" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="3">3 templates</option>
                                <option value="5" selected>5 templates</option>
                                <option value="8">8 templates</option>
                                <option value="10">10 templates</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="templateTone" class="block text-sm font-medium text-gray-700 mb-2">
                                Tone & Style
                            </label>
                            <select id="templateTone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="professional">Professional</option>
                                <option value="friendly" selected>Friendly</option>
                                <option value="casual">Casual</option>
                                <option value="enthusiastic">Enthusiastic</option>
                                <option value="helpful">Helpful</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Advanced Options -->
                    <div class="border border-gray-200 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>
                        
                        <div class="space-y-3">
                            <div>
                                <label for="targetVerticals" class="block text-sm font-medium text-gray-700 mb-1">
                                    Target Verticals (Optional)
                                </label>
                                <input 
                                    type="text" 
                                    id="targetVerticals" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., automotive, fitness, food, technology">
                                <p class="text-xs text-gray-500 mt-1">Comma-separated list of relevant categories</p>
                            </div>
                            
                            <div>
                                <label for="keywordSuggestions" class="block text-sm font-medium text-gray-700 mb-1">
                                    Keyword Suggestions (Optional)
                                </label>
                                <input 
                                    type="text" 
                                    id="keywordSuggestions" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., repair, service, quality, affordable">
                                <p class="text-xs text-gray-500 mt-1">Keywords to include in generated templates</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Generation Results (hidden initially) -->
                    <div id="generationResults" class="hidden">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Generated Templates</h4>
                        <div id="generatedTemplatesList" class="space-y-3 max-h-80 overflow-y-auto">
                            <!-- Generated templates will appear here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer flex justify-between items-center p-6 border-t border-gray-200">
                    <div class="text-xs text-gray-500">
                        💡 Tip: Be specific about your business to get more relevant templates
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="closeAIGenerationModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onclick="generateAITemplates()" id="generateBtn" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                            ✨ Generate Templates
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}/**
 * Gene
rate AI templates based on business description
 */
async function generateAITemplates() {
    const businessDescription = document.getElementById('businessDescription').value.trim();
    const templateCount = parseInt(document.getElementById('templateCount').value);
    const templateTone = document.getElementById('templateTone').value;
    const targetVerticals = document.getElementById('targetVerticals').value.trim();
    const keywordSuggestions = document.getElementById('keywordSuggestions').value.trim();
    
    // Validation
    if (!businessDescription) {
        showErrorMessage('Please provide a business description');
        document.getElementById('businessDescription').focus();
        return;
    }
    
    if (businessDescription.length < 20) {
        showErrorMessage('Please provide a more detailed business description (at least 20 characters)');
        document.getElementById('businessDescription').focus();
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const resultsSection = document.getElementById('generationResults');
    
    try {
        // Show loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = '⏳ Generating...';
        
        // Prepare generation context
        const generationContext = {
            businessDescription,
            templateCount,
            tone: templateTone,
            verticals: targetVerticals ? targetVerticals.split(',').map(v => v.trim()).filter(v => v) : [],
            keywords: keywordSuggestions ? keywordSuggestions.split(',').map(k => k.trim()).filter(k => k) : []
        };
        
        // Call AI service
        const result = await performAITemplateGeneration(generationContext);
        
        if (result.success) {
            // Display generated templates
            displayGeneratedTemplates(result.templates);
            resultsSection.classList.remove('hidden');
            
            showSuccessMessage(`Successfully generated ${result.templates.length} templates!`);
        } else {
            throw new Error(result.error || 'Template generation failed');
        }
        
    } catch (error) {
        console.error('AI template generation failed:', error);
        showErrorMessage(`Template generation failed: ${error.message}`);
        
    } finally {
        // Restore button state
        generateBtn.disabled = false;
        generateBtn.innerHTML = '✨ Generate Templates';
    }
}

/**
 * Perform AI template generation (placeholder for actual AI integration)
 * @param {Object} context - Generation context
 * @returns {Promise<Object>} Generation result
 */
async function performAITemplateGeneration(context) {
    // This is a placeholder - will be replaced with actual AI service integration
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate AI template generation
            const templates = [];
            
            for (let i = 0; i < context.templateCount; i++) {
                const template = {
                    id: `ai_generated_${Date.now()}_${i}`,
                    label: `AI Generated - ${context.businessDescription.substring(0, 30)}... (${i + 1})`,
                    template: `Great ${context.tone} comment about ${context.businessDescription.substring(0, 50)}... Check out {site} for more info!`,
                    keywords: context.keywords.length > 0 ? context.keywords : ['service', 'quality', 'professional'],
                    verticals: context.verticals.length > 0 ? context.verticals : ['business'],
                    variants: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0,
                    aiGenerated: true,
                    generationContext: context
                };
                
                templates.push(template);
            }
            
            resolve({
                success: true,
                templates: templates,
                context: context
            });
        }, 3000); // Simulate API delay
    });
}

/**
 * Display generated templates in the modal
 * @param {Array} templates - Generated templates
 */
function displayGeneratedTemplates(templates) {
    const listContainer = document.getElementById('generatedTemplatesList');
    
    const templatesHTML = templates.map((template, index) => `
        <div class="border border-gray-200 rounded-lg p-4 generated-template-item" data-template-data='${JSON.stringify(template)}'>
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <h5 class="text-sm font-medium text-gray-900">Template ${index + 1}</h5>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            AI Generated
                        </span>
                    </div>
                    <div class="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded border">
                        ${escapeHtml(template.template)}
                    </div>
                </div>
                
                <div class="flex flex-col space-y-2 ml-4">
                    <button onclick="previewGeneratedTemplate(${index})" class="text-xs text-purple-600 hover:text-purple-700 font-medium">
                        Preview
                    </button>
                    <button onclick="editGeneratedTemplate(${index})" class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Edit
                    </button>
                </div>
            </div>
            
            <!-- Template Details -->
            <div class="space-y-2">
                <div class="flex items-center space-x-4 text-xs text-gray-600">
                    <div>
                        <span class="font-medium">Keywords:</span>
                        <span>${template.keywords.join(', ')}</span>
                    </div>
                    ${template.verticals.length > 0 ? `
                        <div>
                            <span class="font-medium">Verticals:</span>
                            <span>${template.verticals.join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Quality Score (simulated) -->
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-600">Quality Score:</span>
                    <div class="flex items-center space-x-1">
                        ${Array.from({length: 5}, (_, i) => {
                            const score = Math.floor(Math.random() * 2) + 3; // Random score 3-5
                            return i < score ? 
                                '<svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' :
                                '<svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
                        }).join('')}
                        <span class="text-xs text-gray-500 ml-1">(${Math.floor(Math.random() * 2) + 3}/5)</span>
                    </div>
                </div>
            </div>
            
            <!-- Selection Checkbox -->
            <div class="mt-3 pt-3 border-t border-gray-100">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" class="generated-template-checkbox h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" checked>
                    <span class="text-sm text-gray-700">Include this template</span>
                </label>
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = templatesHTML;
    
    // Add bulk action buttons
    addBulkActionButtons();
}

/**
 * Add bulk action buttons for generated templates
 */
function addBulkActionButtons() {
    const resultsSection = document.getElementById('generationResults');
    
    // Check if bulk actions already exist
    if (resultsSection.querySelector('.bulk-actions')) {
        return;
    }
    
    const bulkActionsHTML = `
        <div class="bulk-actions flex justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-4">
                <button onclick="selectAllGeneratedTemplates()" class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Select All
                </button>
                <button onclick="deselectAllGeneratedTemplates()" class="text-sm text-gray-600 hover:text-gray-700 font-medium">
                    Deselect All
                </button>
                <span class="text-sm text-gray-500">|</span>
                <button onclick="regenerateSelectedTemplates()" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    🔄 Regenerate Selected
                </button>
            </div>
            
            <div class="flex space-x-3">
                <button onclick="previewAllSelected()" class="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    Preview Selected
                </button>
                <button onclick="saveSelectedTemplates()" class="px-3 py-1 text-sm text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors">
                    Save Selected Templates
                </button>
            </div>
        </div>
    `;
    
    resultsSection.insertAdjacentHTML('beforeend', bulkActionsHTML);
}/**

 * Preview a generated template
 * @param {number} index - Template index
 */
function previewGeneratedTemplate(index) {
    const templateItems = document.querySelectorAll('.generated-template-item');
    const templateData = JSON.parse(templateItems[index].dataset.templateData);
    
    // Show preview modal
    const previewHTML = `
        <div id="templatePreviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div class="modal-header flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Template Preview</h3>
                    <button onclick="closeTemplatePreview()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Template Content</label>
                        <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p class="text-sm text-gray-900">${escapeHtml(templateData.template)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class
// ===== I
MPORT/EXPORT FUNCTIONALITY =====

/**
 * Set up import/export event handlers
 */
function setupImportExportHandlers() {
    // Import/Export dropdown toggle
    const importExportBtn = document.getElementById('importExportBtn');
    const importExportDropdown = document.getElementById('importExportDropdown');
    
    if (importExportBtn && importExportDropdown) {
        importExportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            importExportDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!importExportBtn.contains(e.target) && !importExportDropdown.contains(e.target)) {
                importExportDropdown.classList.add('hidden');
            }
        });
    }
    
    // Import Ad Pack button
    const importAdPackBtn = document.getElementById('importAdPackBtn');
    if (importAdPackBtn) {
        importAdPackBtn.addEventListener('click', () => {
            importExportDropdown.classList.add('hidden');
            showImportModal();
        });
    }
    
    // Export Templates button
    const exportTemplatesBtn = document.getElementById('exportTemplatesBtn');
    if (exportTemplatesBtn) {
        exportTemplatesBtn.addEventListener('click', () => {
            importExportDropdown.classList.add('hidden');
            showExportModal();
        });
    }
    
    // Create Backup button
    const createBackupBtn = document.getElementById('createBackupBtn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', () => {
            importExportDropdown.classList.add('hidden');
            createFullBackup();
        });
    }
    
    // Restore Backup button
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', () => {
            importExportDropdown.classList.add('hidden');
            showRestoreBackupDialog();
        });
    }
    
    // Manage Backups button
    const manageBackupsBtn = document.getElementById('manageBackupsBtn');
    if (manageBackupsBtn) {
        manageBackupsBtn.addEventListener('click', () => {
            importExportDropdown.classList.add('hidden');
            showBackupManagement();
        });
    }
    
    // File input handlers
    const adPackFileInput = document.getElementById('adPackFileInput');
    if (adPackFileInput) {
        adPackFileInput.addEventListener('change', handleAdPackFileSelection);
    }
    
    const restoreFileInput = document.getElementById('restoreFileInput');
    if (restoreFileInput) {
        restoreFileInput.addEventListener('change', handleRestoreFileSelection);
    }
    
    // Import modal handlers
    const startImportBtn = document.getElementById('startImportBtn');
    if (startImportBtn) {
        startImportBtn.addEventListener('click', startAdPackImport);
    }
    
    // Export modal handlers
    const startExportBtn = document.getElementById('startExportBtn');
    if (startExportBtn) {
        startExportBtn.addEventListener('click', startTemplateExport);
    }
    
    // Export type radio buttons
    const exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
    exportTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleExportTypeChange);
    });
    
    // Drag and drop for import
    const fileDropZone = document.getElementById('fileDropZone');
    if (fileDropZone) {
        fileDropZone.addEventListener('dragover', handleDragOver);
        fileDropZone.addEventListener('dragleave', handleDragLeave);
        fileDropZone.addEventListener('drop', handleFileDrop);
    }
}

// ===== IMPORT FUNCTIONALITY =====

/**
 * Show the import modal
 */
function showImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.remove('hidden');
    
    // Reset modal state
    resetImportModal();
}

/**
 * Close the import modal
 */
function closeImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.add('hidden');
    
    // Reset modal state
    resetImportModal();
}

/**
 * Reset import modal to initial state
 */
function resetImportModal() {
    // Reset file input
    const fileInput = document.getElementById('adPackFileInput');
    fileInput.value = '';
    
    // Hide sections
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('importProgress').classList.add('hidden');
    document.getElementById('importResults').classList.add('hidden');
    
    // Reset file name display
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.classList.add('hidden');
    fileNameDisplay.textContent = '';
    
    // Reset button state
    const startBtn = document.getElementById('startImportBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'Import Ad Pack';
    
    // Reset checkboxes to default
    document.getElementById('skipDuplicates').checked = true;
    document.getElementById('validateTemplates').checked = true;
    document.getElementById('preserveCategories').checked = true;
}

/**
 * Handle file selection for Ad Pack import
 * @param {Event} event - File input change event
 */
async function handleAdPackFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        await processAdPackFile(file);
    }
}

/**
 * Handle drag over event
 * @param {Event} event - Drag event
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-facebook-blue', 'bg-facebook-light');
}

/**
 * Handle drag leave event
 * @param {Event} event - Drag event
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-facebook-blue', 'bg-facebook-light');
}

/**
 * Handle file drop event
 * @param {Event} event - Drop event
 */
async function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.currentTarget;
    dropZone.classList.remove('border-facebook-blue', 'bg-facebook-light');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            // Update file input
            const fileInput = document.getElementById('adPackFileInput');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            await processAdPackFile(file);
        } else {
            showErrorMessage('Please select a valid JSON file');
        }
    }
}

/**
 * Process the selected Ad Pack file
 * @param {File} file - Selected file
 */
async function processAdPackFile(file) {
    try {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showErrorMessage('File size exceeds 10MB limit');
            return;
        }
        
        // Show file name
        const fileNameDisplay = document.getElementById('selectedFileName');
        fileNameDisplay.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
        fileNameDisplay.classList.remove('hidden');
        
        // Read and parse file
        const fileContent = await readFileAsText(file);
        const adPackData = JSON.parse(fileContent);
        
        // Validate Ad Pack structure
        const validation = validateAdPackStructure(adPackData);
        if (!validation.isValid) {
            showErrorMessage(`Invalid Ad Pack format: ${validation.errors.join(', ')}`);
            return;
        }
        
        // Show preview
        showImportPreview(adPackData);
        
        // Enable import button
        const startBtn = document.getElementById('startImportBtn');
        startBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to process Ad Pack file:', error);
        showErrorMessage('Failed to read Ad Pack file. Please ensure it\'s a valid JSON file.');
    }
}

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Validate Ad Pack structure
 * @param {Object} adPackData - Ad Pack data to validate
 * @returns {Object} Validation result
 */
function validateAdPackStructure(adPackData) {
    const errors = [];
    
    if (!adPackData || typeof adPackData !== 'object') {
        errors.push('Invalid JSON structure');
        return { isValid: false, errors };
    }
    
    if (!adPackData.templates || !Array.isArray(adPackData.templates)) {
        errors.push('Missing or invalid templates array');
    }
    
    if (adPackData.templates && adPackData.templates.length === 0) {
        errors.push('Ad Pack contains no templates');
    }
    
    // Validate template structure
    if (adPackData.templates) {
        adPackData.templates.forEach((template, index) => {
            if (!template.id || typeof template.id !== 'string') {
                errors.push(`Template ${index + 1}: Missing or invalid ID`);
            }
            if (!template.label || typeof template.label !== 'string') {
                errors.push(`Template ${index + 1}: Missing or invalid label`);
            }
            if (!template.template || typeof template.template !== 'string') {
                errors.push(`Template ${index + 1}: Missing or invalid template content`);
            }
            if (!template.keywords || !Array.isArray(template.keywords)) {
                errors.push(`Template ${index + 1}: Missing or invalid keywords array`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Show import preview
 * @param {Object} adPackData - Ad Pack data
 */
function showImportPreview(adPackData) {
    const previewSection = document.getElementById('importPreview');
    const statsDiv = document.getElementById('previewStats');
    const templatesDiv = document.getElementById('previewTemplates');
    
    // Show stats
    const templateCount = adPackData.templates.length;
    const categories = [...new Set(adPackData.templates.flatMap(t => t.verticals || []))];
    
    statsDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <span><strong>${templateCount}</strong> templates found</span>
            <span><strong>${categories.length}</strong> categories</span>
        </div>
        ${adPackData.metadata ? `
            <div class="mt-2 text-xs">
                <div><strong>Title:</strong> ${escapeHtml(adPackData.metadata.title || 'Untitled')}</div>
                ${adPackData.metadata.description ? `<div><strong>Description:</strong> ${escapeHtml(adPackData.metadata.description)}</div>` : ''}
                ${adPackData.exportedAt ? `<div><strong>Created:</strong> ${new Date(adPackData.exportedAt).toLocaleDateString()}</div>` : ''}
            </div>
        ` : ''}
    `;
    
    // Show template preview (first 5 templates)
    const previewTemplates = adPackData.templates.slice(0, 5);
    templatesDiv.innerHTML = previewTemplates.map(template => `
        <div class="bg-white border border-gray-200 rounded p-2">
            <div class="text-sm font-medium text-gray-900">${escapeHtml(template.label)}</div>
            <div class="text-xs text-gray-600 mt-1 line-clamp-2">${escapeHtml(template.template)}</div>
            <div class="flex items-center space-x-2 mt-2">
                ${template.keywords.slice(0, 3).map(keyword => 
                    `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                        ${escapeHtml(keyword)}
                    </span>`
                ).join('')}
                ${template.keywords.length > 3 ? `<span class="text-xs text-gray-500">+${template.keywords.length - 3} more</span>` : ''}
            </div>
        </div>
    `).join('');
    
    if (adPackData.templates.length > 5) {
        templatesDiv.innerHTML += `
            <div class="text-center text-xs text-gray-500 py-2">
                ... and ${adPackData.templates.length - 5} more templates
            </div>
        `;
    }
    
    previewSection.classList.remove('hidden');
}

/**
 * Start Ad Pack import process
 */
async function startAdPackImport() {
    try {
        // Check Pro license for import feature
        const hasImportAccess = await LicenseUtils.checkFeatureAccess('ad_packs');
        if (!hasImportAccess) {
            showUpgradePromptForImport();
            return;
        }
        
        // Get file and options
        const fileInput = document.getElementById('adPackFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showErrorMessage('Please select an Ad Pack file');
            return;
        }
        
        const options = {
            skipDuplicates: document.getElementById('skipDuplicates').checked,
            validateTemplates: document.getElementById('validateTemplates').checked,
            preserveCategories: document.getElementById('preserveCategories').checked
        };
        
        // Show progress
        showImportProgress();
        
        // Read and parse file
        const fileContent = await readFileAsText(file);
        const adPackData = JSON.parse(fileContent);
        
        // Perform import
        const result = await performAdPackImport(adPackData, options);
        
        // Show results
        showImportResults(result);
        
        // Refresh templates if any were imported
        if (result.imported > 0) {
            await loadTemplates();
            await updateTemplateLimitDisplay();
        }
        
    } catch (error) {
        console.error('Import failed:', error);
        showErrorMessage('Import failed: ' + error.message);
        hideImportProgress();
    }
}

/**
 * Show import progress
 */
function showImportProgress() {
    const progressSection = document.getElementById('importProgress');
    const startBtn = document.getElementById('startImportBtn');
    
    progressSection.classList.remove('hidden');
    startBtn.disabled = true;
    startBtn.textContent = 'Importing...';
    
    // Initialize progress
    updateImportProgress(0, 0, 'Starting import...');
}

/**
 * Hide import progress
 */
function hideImportProgress() {
    const progressSection = document.getElementById('importProgress');
    const startBtn = document.getElementById('startImportBtn');
    
    progressSection.classList.add('hidden');
    startBtn.disabled = false;
    startBtn.textContent = 'Import Ad Pack';
}

/**
 * Update import progress
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} message - Progress message
 */
function updateImportProgress(current, total, message) {
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const currentTemplate = document.getElementById('currentTemplate');
    
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    if (progressText) progressText.textContent = `${current} / ${total}`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (currentTemplate) currentTemplate.textContent = message;
}

/**
 * Perform Ad Pack import
 * @param {Object} adPackData - Ad Pack data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
async function performAdPackImport(adPackData, options) {
    const templates = adPackData.templates;
    const totalTemplates = templates.length;
    
    const results = {
        imported: 0,
        skipped: 0,
        errors: []
    };
    
    // Update progress
    updateImportProgress(0, totalTemplates, 'Validating templates...');
    
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        
        try {
            // Update progress
            updateImportProgress(i, totalTemplates, `Processing: ${template.label}`);
            
            // Check for duplicates
            if (options.skipDuplicates) {
                const existing = allTemplates.find(t => t.id === template.id);
                if (existing) {
                    results.skipped++;
                    continue;
                }
            }
            
            // Validate template if option is enabled
            if (options.validateTemplates) {
                const templateModel = new (window.AdReplyModels?.Template || Template)(template);
                const validation = templateModel.validate();
                
                if (!validation.isValid) {
                    results.errors.push(`Template "${template.label}": ${validation.errors.join(', ')}`);
                    continue;
                }
            }
            
            // Check template limit for free users
            const canAdd = await LicenseUtils.canAddTemplate();
            if (!canAdd) {
                results.errors.push(`Template limit reached. Upgrade to Pro for unlimited templates.`);
                break;
            }
            
            // Import template
            await saveTemplate(template);
            results.imported++;
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Failed to import template ${template.id}:`, error);
            results.errors.push(`Template "${template.label}": ${error.message}`);
        }
    }
    
    // Final progress update
    updateImportProgress(totalTemplates, totalTemplates, 'Import completed!');
    
    return results;
}

/**
 * Show import results
 * @param {Object} results - Import results
 */
function showImportResults(results) {
    const resultsSection = document.getElementById('importResults');
    const statsDiv = document.getElementById('resultsStats');
    const errorsDiv = document.getElementById('resultsErrors');
    const errorsList = document.getElementById('errorsList');
    
    // Show stats
    const total = results.imported + results.skipped + results.errors.length;
    statsDiv.innerHTML = `
        <div class="grid grid-cols-3 gap-4 text-center">
            <div>
                <div class="text-lg font-semibold text-green-600">${results.imported}</div>
                <div class="text-xs text-gray-600">Imported</div>
            </div>
            <div>
                <div class="text-lg font-semibold text-yellow-600">${results.skipped}</div>
                <div class="text-xs text-gray-600">Skipped</div>
            </div>
            <div>
                <div class="text-lg font-semibold text-red-600">${results.errors.length}</div>
                <div class="text-xs text-gray-600">Errors</div>
            </div>
        </div>
    `;
    
    // Show errors if any
    if (results.errors.length > 0) {
        errorsList.innerHTML = results.errors.map(error => 
            `<div class="text-sm">${escapeHtml(error)}</div>`
        ).join('');
        errorsDiv.classList.remove('hidden');
    } else {
        errorsDiv.classList.add('hidden');
    }
    
    resultsSection.classList.remove('hidden');
    
    // Update button
    const startBtn = document.getElementById('startImportBtn');
    startBtn.textContent = 'Import Complete';
    
    // Show success message
    if (results.imported > 0) {
        showSuccessMessage(`Successfully imported ${results.imported} templates!`);
    }
}

/**
 * Show upgrade prompt for import features
 */
function showUpgradePromptForImport() {
    const upgradeHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="importUpgradePrompt">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="p-6 text-center">
                    <div class="mb-4">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Ad Pack Import Requires Pro</h3>
                        <p class="text-gray-600 text-sm">
                            Ad Pack import is available with AdReply Pro. 
                            Upgrade to access this feature and unlimited templates.
                        </p>
                    </div>
                    
                    <div class="bg-blue-50 rounded-lg p-4 mb-6">
                        <h4 class="font-medium text-blue-900 mb-2">Pro Features Include:</h4>
                        <ul class="text-sm text-blue-700 space-y-1">
                            <li>📦 Ad Pack import/export</li>
                            <li>📚 Unlimited templates</li>
                            <li>✨ AI features</li>
                            <li>🔄 Backup & restore</li>
                        </ul>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="closeImportUpgradePrompt()" class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Maybe Later
                        </button>
                        <button onclick="upgradeToProForImport()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', upgradeHTML);
}

/**
 * Close import upgrade prompt
 */
function closeImportUpgradePrompt() {
    const prompt = document.getElementById('importUpgradePrompt');
    if (prompt) {
        prompt.remove();
    }
}

/**
 * Handle upgrade to Pro for import features
 */
function upgradeToProForImport() {
    closeImportUpgradePrompt();
    closeImportModal();
    
    // Switch to license tab
    const licenseTab = document.querySelector('[data-tab="license"]');
    if (licenseTab) {
        licenseTab.click();
    }
    
    // Focus on license key input
    setTimeout(() => {
        const licenseInput = document.getElementById('licenseKey');
        if (licenseInput) {
            licenseInput.focus();
        }
    }, 100);
}

// ===== EXPORT FUNCTIONALITY =====

/**
 * Show the export modal
 */
function showExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.remove('hidden');
    
    // Reset modal state
    resetExportModal();
    
    // Populate template list
    populateExportTemplateList();
    
    // Update preview
    updateExportPreview();
}

/**
 * Close the export modal
 */
function closeExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('hidden');
}

/**
 * Reset export modal to initial state
 */
function resetExportModal() {
    // Reset radio buttons
    document.querySelector('input[name="exportType"][value="all"]').checked = true;
    
    // Hide selection sections
    document.getElementById('templateSelection').classList.add('hidden');
    document.getElementById('categorySelection').classList.add('hidden');
    
    // Reset metadata fields
    document.getElementById('exportTitle').value = '';
    document.getElementById('exportDescription').value = '';
}

/**
 * Handle export type change
 * @param {Event} event - Radio button change event
 */
function handleExportTypeChange(event) {
    const exportType = event.target.value;
    const templateSelection = document.getElementById('templateSelection');
    const categorySelection = document.getElementById('categorySelection');
    
    // Hide all selection sections
    templateSelection.classList.add('hidden');
    categorySelection.classList.add('hidden');
    
    // Show relevant section
    switch (exportType) {
        case 'selected':
            templateSelection.classList.remove('hidden');
            populateExportTemplateList();
            break;
        case 'category':
            categorySelection.classList.remove('hidden');
            populateExportCategoryList();
            break;
    }
    
    updateExportPreview();
}

/**
 * Populate export template list
 */
function populateExportTemplateList() {
    const listContainer = document.getElementById('exportTemplateList');
    
    if (allTemplates.length === 0) {
        listContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <p class="text-sm">No templates available for export.</p>
            </div>
        `;
        return;
    }
    
    const templatesHTML = allTemplates.map(template => `
        <div class="flex items-start space-x-3 p-3 hover:bg-gray-50">
            <input 
                type="checkbox" 
                id="export_${template.id}" 
                class="export-template-checkbox mt-1 h-4 w-4 text-facebook-blue focus:ring-facebook-blue border-gray-300 rounded"
                data-template-id="${template.id}"
                onchange="updateExportPreview()">
            <label for="export_${template.id}" class="flex-1 cursor-pointer">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(template.label)}</div>
                <div class="text-xs text-gray-600 mt-1 line-clamp-2">${escapeHtml(template.template)}</div>
                <div class="flex items-center space-x-2 mt-2">
                    ${template.keywords.slice(0, 2).map(keyword => 
                        `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                            ${escapeHtml(keyword)}
                        </span>`
                    ).join('')}
                    ${template.keywords.length > 2 ? `<span class="text-xs text-gray-500">+${template.keywords.length - 2} more</span>` : ''}
                </div>
            </label>
        </div>
    `).join('');
    
    listContainer.innerHTML = templatesHTML;
    updateSelectionCount();
}

/**
 * Populate export category list
 */
function populateExportCategoryList() {
    const listContainer = document.getElementById('exportCategoryList');
    
    // Get unique categories from all templates
    const categories = [...new Set(allTemplates.flatMap(t => t.verticals || []))];
    
    if (categories.length === 0) {
        listContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <p class="text-sm">No categories found in templates.</p>
            </div>
        `;
        return;
    }
    
    const categoriesHTML = categories.map(category => {
        const templateCount = allTemplates.filter(t => t.verticals && t.verticals.includes(category)).length;
        return `
            <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <input 
                    type="checkbox" 
                    class="export-category-checkbox h-4 w-4 text-facebook-blue focus:ring-facebook-blue border-gray-300 rounded"
                    data-category="${category}"
                    onchange="updateExportPreview()">
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(category)}</div>
                    <div class="text-xs text-gray-600">${templateCount} templates</div>
                </div>
            </label>
        `;
    }).join('');
    
    listContainer.innerHTML = categoriesHTML;
}

/**
 * Select all export templates
 */
function selectAllExportTemplates() {
    const checkboxes = document.querySelectorAll('.export-template-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectionCount();
    updateExportPreview();
}

/**
 * Deselect all export templates
 */
function deselectAllExportTemplates() {
    const checkboxes = document.querySelectorAll('.export-template-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectionCount();
    updateExportPreview();
}

/**
 * Update selection count display
 */
function updateSelectionCount() {
    const selectedCheckboxes = document.querySelectorAll('.export-template-checkbox:checked');
    const countDisplay = document.getElementById('selectionCount');
    if (countDisplay) {
        countDisplay.textContent = `${selectedCheckboxes.length} templates selected`;
    }
}

/**
 * Update export preview
 */
function updateExportPreview() {
    const exportType = document.querySelector('input[name="exportType"]:checked').value;
    const statsDiv = document.getElementById('exportStats');
    
    let templateCount = 0;
    let selectedTemplates = [];
    
    switch (exportType) {
        case 'all':
            templateCount = allTemplates.length;
            selectedTemplates = allTemplates;
            break;
        case 'selected':
            const selectedCheckboxes = document.querySelectorAll('.export-template-checkbox:checked');
            templateCount = selectedCheckboxes.length;
            selectedTemplates = Array.from(selectedCheckboxes).map(cb => 
                allTemplates.find(t => t.id === cb.dataset.templateId)
            ).filter(t => t);
            updateSelectionCount();
            break;
        case 'category':
            const selectedCategories = Array.from(document.querySelectorAll('.export-category-checkbox:checked'))
                .map(cb => cb.dataset.category);
            selectedTemplates = allTemplates.filter(t => 
                t.verticals && t.verticals.some(v => selectedCategories.includes(v))
            );
            templateCount = selectedTemplates.length;
            break;
    }
    
    const categories = [...new Set(selectedTemplates.flatMap(t => t.verticals || []))];
    const totalKeywords = [...new Set(selectedTemplates.flatMap(t => t.keywords || []))].length;
    
    statsDiv.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <div class="font-medium text-gray-900">${templateCount}</div>
                <div class="text-gray-600">Templates</div>
            </div>
            <div>
                <div class="font-medium text-gray-900">${categories.length}</div>
                <div class="text-gray-600">Categories</div>
            </div>
            <div>
                <div class="font-medium text-gray-900">${totalKeywords}</div>
                <div class="text-gray-600">Unique Keywords</div>
            </div>
            <div>
                <div class="font-medium text-gray-900">${formatFileSize(estimateExportSize(selectedTemplates))}</div>
                <div class="text-gray-600">Estimated Size</div>
            </div>
        </div>
    `;
}

/**
 * Start template export process
 */
async function startTemplateExport() {
    try {
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        const title = document.getElementById('exportTitle').value.trim() || 'My Ad Pack';
        const description = document.getElementById('exportDescription').value.trim();
        
        let selectedTemplates = [];
        
        // Get selected templates based on export type
        switch (exportType) {
            case 'all':
                selectedTemplates = allTemplates;
                break;
            case 'selected':
                const selectedCheckboxes = document.querySelectorAll('.export-template-checkbox:checked');
                if (selectedCheckboxes.length === 0) {
                    showErrorMessage('Please select at least one template to export');
                    return;
                }
                selectedTemplates = Array.from(selectedCheckboxes).map(cb => 
                    allTemplates.find(t => t.id === cb.dataset.templateId)
                ).filter(t => t);
                break;
            case 'category':
                const selectedCategories = Array.from(document.querySelectorAll('.export-category-checkbox:checked'))
                    .map(cb => cb.dataset.category);
                if (selectedCategories.length === 0) {
                    showErrorMessage('Please select at least one category to export');
                    return;
                }
                selectedTemplates = allTemplates.filter(t => 
                    t.verticals && t.verticals.some(v => selectedCategories.includes(v))
                );
                break;
        }
        
        if (selectedTemplates.length === 0) {
            showErrorMessage('No templates selected for export');
            return;
        }
        
        // Create export data
        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            metadata: {
                title,
                description,
                totalTemplates: selectedTemplates.length,
                exportType,
                exportedBy: 'AdReply Chrome Extension'
            },
            templates: selectedTemplates.map(template => ({
                ...template,
                // Remove any UI-specific properties
                selected: undefined
            }))
        };
        
        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.json`;
        
        // Download file
        downloadJSON(exportData, filename);
        
        // Show success message
        showSuccessMessage(`Successfully exported ${selectedTemplates.length} templates!`);
        
        // Close modal
        closeExportModal();
        
    } catch (error) {
        console.error('Export failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

// ===== BACKUP AND RESTORE FUNCTIONALITY =====

/**
 * Create full backup
 */
async function createFullBackup() {
    try {
        // Create backup using storage manager
        const storageManager = new StorageManager();
        const backupData = await storageManager.createBackup();
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `adreply_backup_${timestamp}.json`;
        
        // Download backup
        downloadJSON(backupData, filename);
        
        showSuccessMessage('Backup created successfully!');
        
    } catch (error) {
        console.error('Backup creation failed:', error);
        showErrorMessage('Failed to create backup: ' + error.message);
    }
}

/**
 * Show restore backup dialog
 */
function showRestoreBackupDialog() {
    const restoreFileInput = document.getElementById('restoreFileInput');
    restoreFileInput.click();
}

/**
 * Handle restore file selection
 * @param {Event} event - File input change event
 */
async function handleRestoreFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Confirm restore action
        const confirmed = confirm(
            'Restoring from backup will replace your current data. ' +
            'Are you sure you want to continue? This action cannot be undone.'
        );
        
        if (!confirmed) {
            event.target.value = ''; // Reset file input
            return;
        }
        
        // Read and parse backup file
        const fileContent = await readFileAsText(file);
        const backupData = JSON.parse(fileContent);
        
        // Validate backup structure
        if (!backupData.data || !backupData.version) {
            throw new Error('Invalid backup file format');
        }
        
        // Perform restore
        const storageManager = new StorageManager();
        const result = await storageManager.restoreFromBackup(backupData);
        
        // Show results
        let message = 'Backup restored successfully!\n\n';
        message += `Templates: ${result.templates.imported} imported`;
        if (result.templates.errors.length > 0) {
            message += `, ${result.templates.errors.length} errors`;
        }
        message += `\nSettings: ${result.settings.restored ? 'restored' : 'failed'}`;
        message += `\nAI Settings: ${result.aiSettings.restored ? 'restored' : 'failed'}`;
        
        alert(message);
        
        // Reload UI
        await loadTemplates();
        await loadSettings();
        await loadLicenseStatus();
        
        showSuccessMessage('Backup restored successfully!');
        
    } catch (error) {
        console.error('Restore failed:', error);
        showErrorMessage('Failed to restore backup: ' + error.message);
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Estimate export file size
 * @param {Array} templates - Templates to export
 * @returns {number} Estimated size in bytes
 */
function estimateExportSize(templates) {
    const jsonString = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        metadata: { title: 'Export', totalTemplates: templates.length },
        templates
    });
    
    return new Blob([jsonString]).size;
}

/**
 * Download JSON data as file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename
 */
function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

/**
 * Export templates with enhanced metadata and validation
 * @param {Array} templates - Templates to export
 * @param {Object} metadata - Export metadata
 * @returns {Object} Export data with validation
 */
function createExportData(templates, metadata) {
    // Validate templates before export
    const validatedTemplates = templates.map(template => {
        // Ensure all required fields are present
        const exportTemplate = {
            id: template.id || generateTemplateId(),
            label: template.label || 'Untitled Template',
            template: template.template || '',
            keywords: Array.isArray(template.keywords) ? template.keywords : [],
            verticals: Array.isArray(template.verticals) ? template.verticals : [],
            variants: Array.isArray(template.variants) ? template.variants : [],
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || new Date().toISOString(),
            usageCount: typeof template.usageCount === 'number' ? template.usageCount : 0
        };
        
        return exportTemplate;
    });
    
    // Create comprehensive export data
    const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        metadata: {
            title: metadata.title || 'AdReply Export',
            description: metadata.description || '',
            totalTemplates: validatedTemplates.length,
            exportType: metadata.exportType || 'manual',
            exportedBy: 'AdReply Chrome Extension',
            categories: [...new Set(validatedTemplates.flatMap(t => t.verticals))],
            totalKeywords: [...new Set(validatedTemplates.flatMap(t => t.keywords))].length,
            averageUsage: validatedTemplates.length > 0 
                ? Math.round(validatedTemplates.reduce((sum, t) => sum + t.usageCount, 0) / validatedTemplates.length)
                : 0
        },
        templates: validatedTemplates,
        checksum: generateChecksum(validatedTemplates)
    };
    
    return exportData;
}

/**
 * Generate checksum for export validation
 * @param {Array} templates - Templates array
 * @returns {string} Checksum
 */
function generateChecksum(templates) {
    const dataString = JSON.stringify(templates.map(t => ({ id: t.id, label: t.label, template: t.template })));
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Export templates by specific IDs
 * @param {Array} templateIds - Array of template IDs to export
 * @param {Object} metadata - Export metadata
 */
async function exportTemplatesByIds(templateIds, metadata = {}) {
    try {
        const selectedTemplates = templateIds.map(id => 
            allTemplates.find(t => t.id === id)
        ).filter(t => t);
        
        if (selectedTemplates.length === 0) {
            showErrorMessage('No valid templates found for export');
            return;
        }
        
        const exportData = createExportData(selectedTemplates, {
            ...metadata,
            exportType: 'selective'
        });
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${(metadata.title || 'selected_templates').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.json`;
        
        downloadJSON(exportData, filename);
        showSuccessMessage(`Successfully exported ${selectedTemplates.length} templates!`);
        
    } catch (error) {
        console.error('Export by IDs failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

/**
 * Export templates by categories
 * @param {Array} categories - Array of category names to export
 * @param {Object} metadata - Export metadata
 */
async function exportTemplatesByCategories(categories, metadata = {}) {
    try {
        const selectedTemplates = allTemplates.filter(template => 
            template.verticals && template.verticals.some(vertical => categories.includes(vertical))
        );
        
        if (selectedTemplates.length === 0) {
            showErrorMessage('No templates found in selected categories');
            return;
        }
        
        const exportData = createExportData(selectedTemplates, {
            ...metadata,
            exportType: 'category',
            selectedCategories: categories
        });
        
        const timestamp = new Date().toISOString().split('T')[0];
        const categoryName = categories.length === 1 ? categories[0] : 'multiple_categories';
        const filename = `${categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_templates_${timestamp}.json`;
        
        downloadJSON(exportData, filename);
        showSuccessMessage(`Successfully exported ${selectedTemplates.length} templates from ${categories.length} categories!`);
        
    } catch (error) {
        console.error('Export by categories failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

/**
 * Quick export all templates
 */
async function quickExportAllTemplates() {
    try {
        if (allTemplates.length === 0) {
            showErrorMessage('No templates available for export');
            return;
        }
        
        const exportData = createExportData(allTemplates, {
            title: 'All Templates',
            description: 'Complete export of all AdReply templates',
            exportType: 'complete'
        });
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `adreply_all_templates_${timestamp}.json`;
        
        downloadJSON(exportData, filename);
        showSuccessMessage(`Successfully exported all ${allTemplates.length} templates!`);
        
    } catch (error) {
        console.error('Quick export failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

/**
 * Validate export data integrity
 * @param {Object} exportData - Export data to validate
 * @returns {Object} Validation result
 */
function validateExportData(exportData) {
    const errors = [];
    
    if (!exportData || typeof exportData !== 'object') {
        errors.push('Invalid export data structure');
        return { isValid: false, errors };
    }
    
    if (!exportData.version || typeof exportData.version !== 'number') {
        errors.push('Missing or invalid version number');
    }
    
    if (!exportData.templates || !Array.isArray(exportData.templates)) {
        errors.push('Missing or invalid templates array');
    }
    
    if (!exportData.metadata || typeof exportData.metadata !== 'object') {
        errors.push('Missing or invalid metadata');
    }
    
    if (exportData.templates) {
        exportData.templates.forEach((template, index) => {
            if (!template.id) errors.push(`Template ${index + 1}: Missing ID`);
            if (!template.label) errors.push(`Template ${index + 1}: Missing label`);
            if (!template.template) errors.push(`Template ${index + 1}: Missing content`);
            if (!Array.isArray(template.keywords)) errors.push(`Template ${index + 1}: Invalid keywords`);
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        templateCount: exportData.templates ? exportData.templates.length : 0,
        categories: exportData.metadata ? exportData.metadata.categories : []
    };
}

// ===== AUTOMATED BACKUP FUNCTIONALITY =====

/**
 * Backup scheduler class for automated backups
 */
class BackupScheduler {
    constructor() {
        this.isEnabled = false;
        this.interval = null;
        this.lastBackupTime = null;
        this.backupFrequency = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.maxBackups = 5; // Keep last 5 backups
        
        this.init();
    }
    
    /**
     * Initialize backup scheduler
     */
    async init() {
        try {
            const settings = await this.getBackupSettings();
            this.isEnabled = settings.autoBackup || false;
            this.backupFrequency = settings.frequency || this.backupFrequency;
            this.lastBackupTime = settings.lastBackupTime;
            
            if (this.isEnabled) {
                this.startScheduler();
            }
        } catch (error) {
            console.error('Failed to initialize backup scheduler:', error);
        }
    }
    
    /**
     * Get backup settings from storage
     * @returns {Promise<Object>} Backup settings
     */
    async getBackupSettings() {
        try {
            const result = await chrome.storage.local.get(['backupSettings']);
            return result.backupSettings || {};
        } catch (error) {
            console.error('Failed to get backup settings:', error);
            return {};
        }
    }
    
    /**
     * Save backup settings to storage
     * @param {Object} settings - Backup settings
     */
    async saveBackupSettings(settings) {
        try {
            await chrome.storage.local.set({ backupSettings: settings });
        } catch (error) {
            console.error('Failed to save backup settings:', error);
        }
    }
    
    /**
     * Start automated backup scheduler
     */
    startScheduler() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        // Check if backup is needed immediately
        this.checkAndCreateBackup();
        
        // Set up recurring backups
        this.interval = setInterval(() => {
            this.checkAndCreateBackup();
        }, 60 * 60 * 1000); // Check every hour
        
        console.log('Backup scheduler started');
    }
    
    /**
     * Stop automated backup scheduler
     */
    stopScheduler() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        console.log('Backup scheduler stopped');
    }
    
    /**
     * Check if backup is needed and create one
     */
    async checkAndCreateBackup() {
        try {
            const now = Date.now();
            const shouldBackup = !this.lastBackupTime || 
                                (now - this.lastBackupTime) >= this.backupFrequency;
            
            if (shouldBackup) {
                await this.createAutomaticBackup();
                this.lastBackupTime = now;
                
                // Update settings
                await this.saveBackupSettings({
                    autoBackup: this.isEnabled,
                    frequency: this.backupFrequency,
                    lastBackupTime: this.lastBackupTime
                });
            }
        } catch (error) {
            console.error('Automatic backup failed:', error);
        }
    }
    
    /**
     * Create automatic backup
     */
    async createAutomaticBackup() {
        try {
            const storageManager = new StorageManager();
            const backupData = await storageManager.createBackup();
            
            // Add automatic backup metadata
            backupData.metadata = {
                ...backupData.metadata,
                type: 'automatic',
                createdBy: 'AdReply Auto-Backup'
            };
            
            // Store backup in chrome.storage.local with rotation
            await this.storeBackupWithRotation(backupData);
            
            console.log('Automatic backup created successfully');
        } catch (error) {
            console.error('Failed to create automatic backup:', error);
        }
    }
    
    /**
     * Store backup with rotation (keep only last N backups)
     * @param {Object} backupData - Backup data
     */
    async storeBackupWithRotation(backupData) {
        try {
            const result = await chrome.storage.local.get(['automaticBackups']);
            let backups = result.automaticBackups || [];
            
            // Add new backup
            const newBackup = {
                id: `backup_${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: backupData,
                size: JSON.stringify(backupData).length
            };
            
            backups.push(newBackup);
            
            // Sort by timestamp (newest first)
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Keep only the last N backups
            if (backups.length > this.maxBackups) {
                backups = backups.slice(0, this.maxBackups);
            }
            
            // Save back to storage
            await chrome.storage.local.set({ automaticBackups: backups });
            
        } catch (error) {
            console.error('Failed to store backup with rotation:', error);
        }
    }
    
    /**
     * Get list of automatic backups
     * @returns {Promise<Array>} List of backups
     */
    async getAutomaticBackups() {
        try {
            const result = await chrome.storage.local.get(['automaticBackups']);
            return result.automaticBackups || [];
        } catch (error) {
            console.error('Failed to get automatic backups:', error);
            return [];
        }
    }
    
    /**
     * Enable automatic backups
     * @param {number} frequency - Backup frequency in milliseconds
     */
    async enableAutoBackup(frequency = 24 * 60 * 60 * 1000) {
        this.isEnabled = true;
        this.backupFrequency = frequency;
        
        await this.saveBackupSettings({
            autoBackup: true,
            frequency: frequency,
            lastBackupTime: this.lastBackupTime
        });
        
        this.startScheduler();
    }
    
    /**
     * Disable automatic backups
     */
    async disableAutoBackup() {
        this.isEnabled = false;
        this.stopScheduler();
        
        await this.saveBackupSettings({
            autoBackup: false,
            frequency: this.backupFrequency,
            lastBackupTime: this.lastBackupTime
        });
    }
}

// Initialize backup scheduler
const backupScheduler = new BackupScheduler();

/**
 * Show backup management interface
 */
function showBackupManagement() {
    const modalHTML = `
        <div id="backupManagementModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="modal-header flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Backup Management</h3>
                        <p class="text-sm text-gray-600 mt-1">Manage your AdReply data backups</p>
                    </div>
                    <button onclick="closeBackupManagement()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body p-6 space-y-6">
                    <!-- Auto Backup Settings -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Automatic Backup Settings</h4>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <div class="text-sm font-medium text-gray-900">Enable Automatic Backups</div>
                                    <div class="text-xs text-gray-600">Automatically backup your data daily</div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="autoBackupToggle" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            
                            <div id="backupFrequencySettings" class="hidden">
                                <label for="backupFrequency" class="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                                <select id="backupFrequency" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="3600000">Every Hour</option>
                                    <option value="21600000">Every 6 Hours</option>
                                    <option value="43200000">Every 12 Hours</option>
                                    <option value="86400000" selected>Daily</option>
                                    <option value="604800000">Weekly</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Manual Backup Actions -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Manual Backup Actions</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button onclick="createFullBackup()" class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                Create Backup Now
                            </button>
                            <button onclick="showRestoreBackupDialog()" class="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                </svg>
                                Restore from File
                            </button>
                        </div>
                    </div>
                    
                    <!-- Automatic Backups List -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Recent Automatic Backups</h4>
                        <div id="automaticBackupsList" class="bg-gray-50 border border-gray-200 rounded-lg">
                            <div class="p-4 text-center text-gray-500">
                                <div class="text-sm">Loading backups...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer flex justify-end p-6 border-t border-gray-200">
                    <button onclick="closeBackupManagement()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize backup management
    initializeBackupManagement();
}

/**
 * Initialize backup management modal
 */
async function initializeBackupManagement() {
    try {
        // Load current settings
        const settings = await backupScheduler.getBackupSettings();
        
        // Set toggle state
        const autoBackupToggle = document.getElementById('autoBackupToggle');
        autoBackupToggle.checked = settings.autoBackup || false;
        
        // Set frequency
        const frequencySelect = document.getElementById('backupFrequency');
        frequencySelect.value = settings.frequency || 86400000;
        
        // Show/hide frequency settings
        const frequencySettings = document.getElementById('backupFrequencySettings');
        if (settings.autoBackup) {
            frequencySettings.classList.remove('hidden');
        }
        
        // Set up event listeners
        autoBackupToggle.addEventListener('change', handleAutoBackupToggle);
        frequencySelect.addEventListener('change', handleFrequencyChange);
        
        // Load automatic backups list
        await loadAutomaticBackupsList();
        
    } catch (error) {
        console.error('Failed to initialize backup management:', error);
    }
}

/**
 * Handle auto backup toggle
 * @param {Event} event - Toggle event
 */
async function handleAutoBackupToggle(event) {
    const isEnabled = event.target.checked;
    const frequencySettings = document.getElementById('backupFrequencySettings');
    
    if (isEnabled) {
        frequencySettings.classList.remove('hidden');
        const frequency = parseInt(document.getElementById('backupFrequency').value);
        await backupScheduler.enableAutoBackup(frequency);
        showSuccessMessage('Automatic backups enabled');
    } else {
        frequencySettings.classList.add('hidden');
        await backupScheduler.disableAutoBackup();
        showSuccessMessage('Automatic backups disabled');
    }
}

/**
 * Handle frequency change
 * @param {Event} event - Select change event
 */
async function handleFrequencyChange(event) {
    const frequency = parseInt(event.target.value);
    if (backupScheduler.isEnabled) {
        await backupScheduler.enableAutoBackup(frequency);
        showSuccessMessage('Backup frequency updated');
    }
}

/**
 * Load automatic backups list
 */
async function loadAutomaticBackupsList() {
    try {
        const backups = await backupScheduler.getAutomaticBackups();
        const listContainer = document.getElementById('automaticBackupsList');
        
        if (backups.length === 0) {
            listContainer.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <div class="text-sm">No automatic backups found</div>
                    <div class="text-xs mt-1">Enable automatic backups to see them here</div>
                </div>
            `;
            return;
        }
        
        const backupsHTML = backups.map(backup => `
            <div class="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">
                        Backup ${new Date(backup.timestamp).toLocaleDateString()}
                    </div>
                    <div class="text-xs text-gray-600">
                        ${new Date(backup.timestamp).toLocaleTimeString()} • ${formatFileSize(backup.size)}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="downloadAutomaticBackup('${backup.id}')" 
                            class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Download
                    </button>
                    <button onclick="restoreAutomaticBackup('${backup.id}')" 
                            class="text-xs text-green-600 hover:text-green-700 font-medium">
                        Restore
                    </button>
                    <button onclick="deleteAutomaticBackup('${backup.id}')" 
                            class="text-xs text-red-600 hover:text-red-700 font-medium">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        listContainer.innerHTML = backupsHTML;
        
    } catch (error) {
        console.error('Failed to load automatic backups:', error);
        const listContainer = document.getElementById('automaticBackupsList');
        listContainer.innerHTML = `
            <div class="p-4 text-center text-red-500">
                <div class="text-sm">Failed to load backups</div>
            </div>
        `;
    }
}

/**
 * Download automatic backup
 * @param {string} backupId - Backup ID
 */
async function downloadAutomaticBackup(backupId) {
    try {
        const backups = await backupScheduler.getAutomaticBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            showErrorMessage('Backup not found');
            return;
        }
        
        const filename = `adreply_auto_backup_${backup.timestamp.split('T')[0]}.json`;
        downloadJSON(backup.data, filename);
        
        showSuccessMessage('Backup downloaded successfully');
        
    } catch (error) {
        console.error('Failed to download backup:', error);
        showErrorMessage('Failed to download backup');
    }
}

/**
 * Restore automatic backup
 * @param {string} backupId - Backup ID
 */
async function restoreAutomaticBackup(backupId) {
    try {
        const confirmed = confirm(
            'Restoring this backup will replace your current data. ' +
            'Are you sure you want to continue? This action cannot be undone.'
        );
        
        if (!confirmed) return;
        
        const backups = await backupScheduler.getAutomaticBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            showErrorMessage('Backup not found');
            return;
        }
        
        // Perform restore
        const storageManager = new StorageManager();
        const result = await storageManager.restoreFromBackup(backup.data);
        
        // Show results
        showSuccessMessage('Backup restored successfully!');
        
        // Reload UI
        await loadTemplates();
        await loadSettings();
        await loadLicenseStatus();
        
        // Close modal
        closeBackupManagement();
        
    } catch (error) {
        console.error('Failed to restore backup:', error);
        showErrorMessage('Failed to restore backup: ' + error.message);
    }
}

/**
 * Delete automatic backup
 * @param {string} backupId - Backup ID
 */
async function deleteAutomaticBackup(backupId) {
    try {
        const confirmed = confirm('Are you sure you want to delete this backup?');
        if (!confirmed) return;
        
        const result = await chrome.storage.local.get(['automaticBackups']);
        let backups = result.automaticBackups || [];
        
        // Remove the backup
        backups = backups.filter(b => b.id !== backupId);
        
        // Save back to storage
        await chrome.storage.local.set({ automaticBackups: backups });
        
        // Reload list
        await loadAutomaticBackupsList();
        
        showSuccessMessage('Backup deleted successfully');
        
    } catch (error) {
        console.error('Failed to delete backup:', error);
        showErrorMessage('Failed to delete backup');
    }
}

/**
 * Close backup management modal
 */
function closeBackupManagement() {
    const modal = document.getElementById('backupManagementModal');
    if (modal) {
        modal.remove();
    }
}

// ===== CONFLICT RESOLUTION FOR RESTORE =====

/**
 * Advanced restore with conflict resolution
 * @param {Object} backupData - Backup data
 * @param {Object} options - Restore options
 */
async function advancedRestore(backupData, options = {}) {
    try {
        const storageManager = new StorageManager();
        
        // Get current data for conflict detection
        const currentTemplates = await storageManager.getTemplates();
        const backupTemplates = backupData.data.templates || [];
        
        // Detect conflicts
        const conflicts = detectRestoreConflicts(currentTemplates, backupTemplates);
        
        if (conflicts.length > 0 && !options.autoResolve) {
            // Show conflict resolution dialog
            const resolution = await showConflictResolutionDialog(conflicts);
            if (!resolution) {
                return { cancelled: true };
            }
            options = { ...options, ...resolution };
        }
        
        // Perform restore with conflict resolution
        const result = await performAdvancedRestore(storageManager, backupData, options);
        
        return result;
        
    } catch (error) {
        console.error('Advanced restore failed:', error);
        throw error;
    }
}

/**
 * Detect conflicts between current and backup data
 * @param {Array} currentTemplates - Current templates
 * @param {Array} backupTemplates - Backup templates
 * @returns {Array} Array of conflicts
 */
function detectRestoreConflicts(currentTemplates, backupTemplates) {
    const conflicts = [];
    
    backupTemplates.forEach(backupTemplate => {
        const currentTemplate = currentTemplates.find(t => t.id === backupTemplate.id);
        
        if (currentTemplate) {
            // Check if templates are different
            const isDifferent = 
                currentTemplate.template !== backupTemplate.template ||
                currentTemplate.label !== backupTemplate.label ||
                JSON.stringify(currentTemplate.keywords) !== JSON.stringify(backupTemplate.keywords) ||
                JSON.stringify(currentTemplate.verticals) !== JSON.stringify(backupTemplate.verticals);
            
            if (isDifferent) {
                conflicts.push({
                    id: backupTemplate.id,
                    type: 'template_conflict',
                    current: currentTemplate,
                    backup: backupTemplate,
                    lastModified: {
                        current: currentTemplate.updatedAt || currentTemplate.createdAt,
                        backup: backupTemplate.updatedAt || backupTemplate.createdAt
                    }
                });
            }
        }
    });
    
    return conflicts;
}

/**
 * Show conflict resolution dialog
 * @param {Array} conflicts - Array of conflicts
 * @returns {Promise<Object|null>} Resolution options or null if cancelled
 */
function showConflictResolutionDialog(conflicts) {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="conflictResolutionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="modal-header p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Resolve Restore Conflicts</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            ${conflicts.length} conflicts found. Choose how to resolve them.
                        </p>
                    </div>
                    
                    <div class="modal-body p-6">
                        <!-- Global Resolution Options -->
                        <div class="mb-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-3">Global Resolution</h4>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="globalResolution" value="keep_current" class="h-4 w-4 text-blue-600">
                                    <span class="ml-2 text-sm text-gray-700">Keep current versions for all conflicts</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="globalResolution" value="use_backup" class="h-4 w-4 text-blue-600">
                                    <span class="ml-2 text-sm text-gray-700">Use backup versions for all conflicts</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="globalResolution" value="use_newer" class="h-4 w-4 text-blue-600">
                                    <span class="ml-2 text-sm text-gray-700">Use newer version based on modification date</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="globalResolution" value="manual" checked class="h-4 w-4 text-blue-600">
                                    <span class="ml-2 text-sm text-gray-700">Resolve manually for each conflict</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Individual Conflicts -->
                        <div id="individualConflicts" class="space-y-4">
                            <h4 class="text-sm font-medium text-gray-700 mb-3">Individual Conflicts</h4>
                            ${conflicts.map((conflict, index) => `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-3">
                                        <h5 class="text-sm font-medium text-gray-900">${escapeHtml(conflict.current.label)}</h5>
                                        <span class="text-xs text-gray-500">Template ID: ${conflict.id}</span>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <!-- Current Version -->
                                        <div class="border border-gray-200 rounded p-3">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-xs font-medium text-gray-700">Current Version</span>
                                                <label class="flex items-center">
                                                    <input type="radio" name="conflict_${index}" value="current" checked class="h-3 w-3 text-blue-600">
                                                    <span class="ml-1 text-xs text-gray-600">Keep</span>
                                                </label>
                                            </div>
                                            <div class="text-xs text-gray-600 mb-2">
                                                Modified: ${new Date(conflict.lastModified.current).toLocaleString()}
                                            </div>
                                            <div class="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                                                ${escapeHtml(conflict.current.template.substring(0, 100))}${conflict.current.template.length > 100 ? '...' : ''}
                                            </div>
                                        </div>
                                        
                                        <!-- Backup Version -->
                                        <div class="border border-gray-200 rounded p-3">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-xs font-medium text-gray-700">Backup Version</span>
                                                <label class="flex items-center">
                                                    <input type="radio" name="conflict_${index}" value="backup" class="h-3 w-3 text-blue-600">
                                                    <span class="ml-1 text-xs text-gray-600">Use</span>
                                                </label>
                                            </div>
                                            <div class="text-xs text-gray-600 mb-2">
                                                Modified: ${new Date(conflict.lastModified.backup).toLocaleString()}
                                            </div>
                                            <div class="text-xs text-gray-900 bg-blue-50 p-2 rounded">
                                                ${escapeHtml(conflict.backup.template.substring(0, 100))}${conflict.backup.template.length > 100 ? '...' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="modal-footer flex justify-end space-x-3 p-6 border-t border-gray-200">
                        <button onclick="resolveConflicts(false)" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onclick="resolveConflicts(true)" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Apply Resolution
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Set up global resolution handler
        const globalRadios = document.querySelectorAll('input[name="globalResolution"]');
        globalRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const individualSection = document.getElementById('individualConflicts');
                if (e.target.value === 'manual') {
                    individualSection.style.display = 'block';
                } else {
                    individualSection.style.display = 'none';
                }
            });
        });
        
        // Store resolve function globally
        window.resolveConflicts = (apply) => {
            const modal = document.getElementById('conflictResolutionModal');
            
            if (!apply) {
                modal.remove();
                resolve(null);
                return;
            }
            
            const globalResolution = document.querySelector('input[name="globalResolution"]:checked').value;
            const resolutions = {};
            
            if (globalResolution === 'manual') {
                // Get individual resolutions
                conflicts.forEach((conflict, index) => {
                    const selected = document.querySelector(`input[name="conflict_${index}"]:checked`);
                    resolutions[conflict.id] = selected ? selected.value : 'current';
                });
            }
            
            modal.remove();
            delete window.resolveConflicts;
            
            resolve({
                globalResolution,
                individualResolutions: resolutions
            });
        };
    });
}

/**
 * Perform advanced restore with conflict resolution
 * @param {Object} storageManager - Storage manager instance
 * @param {Object} backupData - Backup data
 * @param {Object} options - Restore options
 */
async function performAdvancedRestore(storageManager, backupData, options) {
    const results = {
        templates: { imported: 0, skipped: 0, errors: [] },
        settings: { restored: false, error: null },
        aiSettings: { restored: false, error: null }
    };
    
    // Restore templates with conflict resolution
    if (backupData.data.templates) {
        for (const templateData of backupData.data.templates) {
            try {
                let shouldRestore = true;
                
                // Apply conflict resolution
                if (options.globalResolution) {
                    switch (options.globalResolution) {
                        case 'keep_current':
                            const existing = await storageManager.getTemplate(templateData.id);
                            if (existing) {
                                shouldRestore = false;
                            }
                            break;
                        case 'use_backup':
                            shouldRestore = true;
                            break;
                        case 'use_newer':
                            const current = await storageManager.getTemplate(templateData.id);
                            if (current) {
                                const currentDate = new Date(current.updatedAt || current.createdAt);
                                const backupDate = new Date(templateData.updatedAt || templateData.createdAt);
                                shouldRestore = backupDate > currentDate;
                            }
                            break;
                        case 'manual':
                            const resolution = options.individualResolutions[templateData.id];
                            shouldRestore = resolution === 'backup';
                            break;
                    }
                }
                
                if (shouldRestore) {
                    await storageManager.saveTemplate(templateData);
                    results.templates.imported++;
                } else {
                    results.templates.skipped++;
                }
                
            } catch (error) {
                results.templates.errors.push(`Failed to restore template ${templateData.id}: ${error.message}`);
            }
        }
    }
    
    // Restore settings
    if (backupData.data.settings) {
        try {
            await storageManager.saveSettings(backupData.data.settings);
            results.settings.restored = true;
        } catch (error) {
            results.settings.error = error.message;
        }
    }
    
    // Restore AI settings
    if (backupData.data.aiSettings) {
        try {
            await storageManager.saveAISettings(backupData.data.aiSettings);
            results.aiSettings.restored = true;
        } catch (error) {
            results.aiSettings.error = error.message;
        }
    }
    
    return results;
}