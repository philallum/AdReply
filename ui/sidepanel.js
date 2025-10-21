// AdReply Side Panel JavaScript
// Handles UI interactions and communication with content scripts

console.log('AdReply side panel loaded');

// Initialize side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSidePanel);

function initializeSidePanel() {
    console.log('AdReply: Initializing side panel');
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Load initial data
    loadLicenseStatus();
    loadTemplates();
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
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
            const licenseKey = document.getElementById('licenseKey').value;
            if (licenseKey) {
                validateLicense(licenseKey);
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
}

async function loadLicenseStatus() {
    try {
        const result = await chrome.storage.local.get(['license']);
        const license = result.license || { status: 'free', tier: 'free' };
        
        updateLicenseDisplay(license);
    } catch (error) {
        console.error('Failed to load license status:', error);
    }
}

function updateLicenseDisplay(license) {
    const statusBadge = document.getElementById('licenseStatus');
    const badge = statusBadge.querySelector('.status-badge');
    
    if (license.tier === 'pro') {
        badge.textContent = 'Pro';
        badge.className = 'status-badge pro';
    } else {
        badge.textContent = 'Free';
        badge.className = 'status-badge free';
    }
}

async function loadTemplates() {
    try {
        // This will be implemented in later tasks
        console.log('Loading templates...');
        
        // For now, show no templates message
        const templatesContainer = document.getElementById('templatesContainer');
        templatesContainer.innerHTML = `
            <div class="no-templates">
                <p>No templates created yet. Create your first template to get started.</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
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