// Test script to debug import issue
// Run this in the browser console on the sidepanel page

async function testImport() {
    console.log('=== IMPORT TEST START ===');
    
    // Read the backup file
    const response = await fetch(chrome.runtime.getURL('adreply-backup-2025-11-09T20-47-36.json'));
    const fileContent = await response.text();
    
    console.log('File loaded, length:', fileContent.length);
    
    // Parse it
    const data = JSON.parse(fileContent);
    console.log('Parsed data keys:', Object.keys(data));
    
    if (data.data) {
        console.log('data.data keys:', Object.keys(data.data));
        if (data.data.templates) {
            console.log('Templates found:', data.data.templates.length);
            console.log('First template:', data.data.templates[0]);
        }
    }
    
    // Check current templates in storage
    const storage = await chrome.storage.local.get(['templates']);
    console.log('Current templates in storage:', storage.templates?.length || 0);
    
    console.log('=== IMPORT TEST END ===');
}

testImport();
