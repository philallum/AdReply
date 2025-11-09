// Test Import Functionality - Run in browser console

async function testImportLimit() {
    console.log('=== Testing Import Limit ===\n');
    
    // Check license status
    const licenseResponse = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
    console.log('License Status:', {
        valid: licenseResponse.valid,
        tier: licenseResponse.status?.tier,
        templateLimit: licenseResponse.status?.templateLimit
    });
    
    // Check current templates
    const storage = await chrome.storage.local.get(['templates']);
    const templates = storage.templates || [];
    const userTemplates = templates.filter(t => !t.isPrebuilt);
    
    console.log('\nCurrent Templates:', {
        total: templates.length,
        user: userTemplates.length,
        prebuilt: templates.filter(t => t.isPrebuilt).length
    });
    
    // Calculate import capacity
    if (licenseResponse.valid) {
        console.log('\n✅ PRO LICENSE - Can import unlimited templates');
    } else {
        const remaining = 10 - userTemplates.length;
        console.log(`\n⚠️ FREE LICENSE - Can import ${remaining} more templates (${userTemplates.length}/10 used)`);
    }
}

async function clearAllTemplates() {
    console.log('⚠️ Clearing all user templates...');
    const confirm = window.confirm('Are you sure you want to delete all user templates?');
    if (!confirm) {
        console.log('Cancelled');
        return;
    }
    
    await chrome.storage.local.set({ templates: [] });
    console.log('✅ All templates cleared');
    
    // Reload the page to refresh UI
    window.location.reload();
}

async function createTestImportFile(count = 20) {
    console.log(`Creating test import file with ${count} templates...`);
    
    const templates = [];
    for (let i = 1; i <= count; i++) {
        templates.push({
            label: `Test Template ${i}`,
            category: 'custom',
            keywords: ['test', `template${i}`, 'import'],
            template: `This is test template number ${i}. It's a sample template for testing import functionality.`,
            url: `https://example.com/template${i}`
        });
    }
    
    const importData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        templates: templates
    };
    
    // Create and download file
    const jsonStr = JSON.stringify(importData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `test-import-${count}-templates.json`;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    }, 100);
    
    console.log(`✅ Test file created: test-import-${count}-templates.json`);
    console.log('Use this file to test the import functionality');
}

// Export functions
window.testImport = {
    checkLimit: testImportLimit,
    clearAll: clearAllTemplates,
    createTestFile: createTestImportFile
};

console.log('Import test functions loaded!');
console.log('Commands:');
console.log('  await testImport.checkLimit()        - Check current import capacity');
console.log('  await testImport.createTestFile(20)  - Create test import file');
console.log('  await testImport.clearAll()          - Clear all templates (careful!)');
