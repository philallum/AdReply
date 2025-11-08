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

// Export all data from chrome.storage.local
function exportData() {
    chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
            showMessage('Error reading data: ' + chrome.runtime.lastError.message, 'error');
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
                showMessage('✓ Data exported successfully!');
                URL.revokeObjectURL(url);
            });
        });
    });
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    // Reset file input
    fileInput.value = '';

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
                showMessage('Import cancelled', 'error');
                return;
            }

            // Clear existing data and import new data
            chrome.storage.local.clear(() => {
                chrome.storage.local.set(backup.data, () => {
                    if (chrome.runtime.lastError) {
                        showMessage('Error importing data: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }

                    // Save import timestamp
                    const now = new Date().toISOString();
                    chrome.storage.local.set({ lastBackup: now }, () => {
                        loadLastBackupTime();
                        showMessage('✓ Data imported successfully!');
                    });
                });
            });

        } catch (error) {
            showMessage('Invalid JSON file: ' + error.message, 'error');
        }
    };

    reader.onerror = () => {
        showMessage('Error reading file', 'error');
    };

    reader.readAsText(file);
}
