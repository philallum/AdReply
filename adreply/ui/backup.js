// Backup & Restore functionality for AdReply Chrome Extension

// DOM elements
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const lastBackupEl = document.getElementById('lastBackup');
const messageEl = document.getElementById('message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLastBackupTime();
    
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importData);
});

// Load and display last backup timestamp
function loadLastBackupTime() {
    chrome.storage.local.get(['lastBackup'], (result) => {
        if (result.lastBackup) {
            const date = new Date(result.lastBackup);
            lastBackupEl.textContent = formatDate(date);
        } else {
            lastBackupEl.textContent = 'Never';
        }
    });
}

// Format date for display
function formatDate(date) {
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

// Show message to user
function showMessage(text, type = 'success') {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Export all data from chrome.storage.local (v2.0 with extended data structures)
async function exportData() {
    try {
        // Get all chrome.storage.local data
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });

        // Extract v2 data structures
        const keywordStats = data.keywordStats || {};
        const settings = data.settings || {};
        const affiliateLinks = settings.affiliateLinks || { default: '', categoryOverrides: {} };
        const adPackMetadata = settings.adPackMetadata || [];
        
        // Extract onboarding data
        const onboardingData = {
            businessDescription: settings.businessDescription || '',
            aiProvider: settings.aiProvider || '',
            completedAt: settings.onboardingCompleted ? (settings.onboardingCompletedAt || '') : ''
        };

        // Create v2 backup object with metadata
        const backup = {
            version: 2, // Updated to v2
            timestamp: new Date().toISOString(),
            data: {
                // All existing chrome.storage.local data
                ...data,
                
                // Explicitly include v2 data structures for clarity
                keywordStats: keywordStats,
                affiliateLinks: affiliateLinks,
                adPackMetadata: adPackMetadata,
                onboardingData: onboardingData
            }
        };

        // Convert to JSON
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `adreply-backup-${timestamp}.json`;

        // Download file
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                showMessage('Error downloading file: ' + chrome.runtime.lastError.message, 'error');
                URL.revokeObjectURL(url);
                return;
            }

            // Save backup timestamp
            const now = new Date().toISOString();
            chrome.storage.local.set({ lastBackup: now }, () => {
                loadLastBackupTime();
                showMessage('✓ Data exported successfully! (v2.0)');
                URL.revokeObjectURL(url);
            });
        });
    } catch (error) {
        showMessage('Error exporting data: ' + error.message, 'error');
    }
}

// Import data from JSON file (v2.0 with validation and migration)
async function importData(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    // Reset file input
    fileInput.value = '';

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const content = e.target.result;
            const backup = JSON.parse(content);

            // Validate backup structure
            const validation = validateBackupFile(backup);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Show version info
            const backupVersion = backup.version || 1;
            const versionInfo = backupVersion === 2 ? 'v2.0' : 'v1.0';
            
            // Confirm before overwriting
            const confirmMsg = `This will replace all current data with backup from ${versionInfo}.\n\nBackup created: ${new Date(backup.timestamp).toLocaleString()}\n\nContinue?`;
            if (!confirm(confirmMsg)) {
                showMessage('Import cancelled', 'error');
                return;
            }

            // Migrate data if needed
            const migratedData = migrateBackupData(backup);

            // Clear existing data and import new data
            chrome.storage.local.clear(() => {
                chrome.storage.local.set(migratedData, () => {
                    if (chrome.runtime.lastError) {
                        showMessage('Error importing data: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }

                    // Save import timestamp
                    const now = new Date().toISOString();
                    chrome.storage.local.set({ lastBackup: now }, () => {
                        loadLastBackupTime();
                        showMessage(`✓ Data imported successfully from ${versionInfo}!`);
                        
                        // Suggest page reload for changes to take effect
                        setTimeout(() => {
                            if (confirm('Data imported successfully! Reload the page to apply changes?')) {
                                window.location.reload();
                            }
                        }, 1000);
                    });
                });
            });

        } catch (error) {
            showMessage('Import failed: ' + error.message, 'error');
            console.error('Backup import error:', error);
        }
    };

    reader.onerror = () => {
        showMessage('Error reading file', 'error');
    };

    reader.readAsText(file);
}

/**
 * Validate backup file structure
 * @param {Object} backup - Backup object to validate
 * @returns {Object} Validation result with isValid and error properties
 */
function validateBackupFile(backup) {
    // Check if backup object exists
    if (!backup || typeof backup !== 'object') {
        return { isValid: false, error: 'Invalid backup file: Not a valid JSON object' };
    }

    // Check for required fields
    if (!backup.data || typeof backup.data !== 'object') {
        return { isValid: false, error: 'Invalid backup file: Missing or invalid data field' };
    }

    // Check version
    const version = backup.version || 1;
    if (typeof version !== 'number' || version < 1 || version > 2) {
        return { isValid: false, error: `Unsupported backup version: ${version}` };
    }

    // Check timestamp
    if (!backup.timestamp) {
        return { isValid: false, error: 'Invalid backup file: Missing timestamp' };
    }

    // Try to parse timestamp
    try {
        new Date(backup.timestamp);
    } catch (error) {
        return { isValid: false, error: 'Invalid backup file: Invalid timestamp format' };
    }

    // Validate v2 structure if version is 2
    if (version === 2) {
        const v2Validation = validateV2Structure(backup.data);
        if (!v2Validation.isValid) {
            return v2Validation;
        }
    }

    return { isValid: true };
}

/**
 * Validate v2 backup data structure
 * @param {Object} data - Backup data to validate
 * @returns {Object} Validation result
 */
function validateV2Structure(data) {
    // Check for v2 data structures (they should exist but can be empty)
    
    // keywordStats should be an object
    if (data.keywordStats !== undefined && typeof data.keywordStats !== 'object') {
        return { isValid: false, error: 'Invalid v2 backup: keywordStats must be an object' };
    }

    // affiliateLinks should be an object with default and categoryOverrides
    if (data.affiliateLinks !== undefined) {
        if (typeof data.affiliateLinks !== 'object') {
            return { isValid: false, error: 'Invalid v2 backup: affiliateLinks must be an object' };
        }
        if (data.affiliateLinks.categoryOverrides !== undefined && 
            typeof data.affiliateLinks.categoryOverrides !== 'object') {
            return { isValid: false, error: 'Invalid v2 backup: affiliateLinks.categoryOverrides must be an object' };
        }
    }

    // adPackMetadata should be an array
    if (data.adPackMetadata !== undefined && !Array.isArray(data.adPackMetadata)) {
        return { isValid: false, error: 'Invalid v2 backup: adPackMetadata must be an array' };
    }

    // onboardingData should be an object
    if (data.onboardingData !== undefined && typeof data.onboardingData !== 'object') {
        return { isValid: false, error: 'Invalid v2 backup: onboardingData must be an object' };
    }

    return { isValid: true };
}

/**
 * Migrate backup data to current version
 * @param {Object} backup - Backup object
 * @returns {Object} Migrated data ready for import
 */
function migrateBackupData(backup) {
    const version = backup.version || 1;
    let data = { ...backup.data };

    // Migrate v1 to v2 if needed
    if (version === 1) {
        console.log('Migrating v1 backup to v2 format...');
        
        // Initialize v2 data structures with defaults
        if (!data.keywordStats) {
            data.keywordStats = {};
        }

        // Ensure settings has v2 fields
        if (!data.settings) {
            data.settings = {};
        }

        // Add v2 settings fields if missing
        if (!data.settings.affiliateLinks) {
            data.settings.affiliateLinks = {
                default: '',
                categoryOverrides: {}
            };
        }

        if (!data.settings.adPackMetadata) {
            data.settings.adPackMetadata = [];
        }

        if (data.settings.businessDescription === undefined) {
            data.settings.businessDescription = '';
        }

        if (data.settings.aiProvider === undefined) {
            data.settings.aiProvider = 'gemini';
        }

        if (data.settings.aiKeyEncrypted === undefined) {
            data.settings.aiKeyEncrypted = '';
        }

        // Mark onboarding as completed for v1 users (they already have data)
        if (data.settings.onboardingCompleted === undefined) {
            data.settings.onboardingCompleted = true;
        }

        console.log('v1 to v2 migration complete');
    }

    // Restore v2 data structures from explicit fields if present
    if (backup.data.keywordStats) {
        data.keywordStats = backup.data.keywordStats;
    }

    if (backup.data.affiliateLinks) {
        if (!data.settings) {
            data.settings = {};
        }
        data.settings.affiliateLinks = backup.data.affiliateLinks;
    }

    if (backup.data.adPackMetadata) {
        if (!data.settings) {
            data.settings = {};
        }
        data.settings.adPackMetadata = backup.data.adPackMetadata;
    }

    if (backup.data.onboardingData) {
        if (!data.settings) {
            data.settings = {};
        }
        // Restore onboarding data to settings
        data.settings.businessDescription = backup.data.onboardingData.businessDescription || '';
        data.settings.aiProvider = backup.data.onboardingData.aiProvider || 'gemini';
        if (backup.data.onboardingData.completedAt) {
            data.settings.onboardingCompleted = true;
            data.settings.onboardingCompletedAt = backup.data.onboardingData.completedAt;
        }
    }

    return data;
}
