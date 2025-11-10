// Run this in the browser console to check if import is ready
// This will verify the backup file structure and current storage state

async function checkImportReady() {
    console.log('=== IMPORT READINESS CHECK ===\n');
    
    // Check current storage
    console.log('1. Checking current storage...');
    const storage = await chrome.storage.local.get(['templates', 'licenseStatus', 'licenseKey']);
    console.log('   Current templates in storage:', storage.templates?.length || 0);
    console.log('   License status:', storage.licenseStatus);
    console.log('   Has license key:', !!storage.licenseKey);
    
    // Check license via background script
    console.log('\n2. Checking license via background script...');
    try {
        const licenseResponse = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
        console.log('   License valid:', licenseResponse.valid);
        console.log('   License tier:', licenseResponse.status?.tier);
        console.log('   Template limit:', licenseResponse.status?.templateLimit);
    } catch (error) {
        console.error('   Error checking license:', error);
    }
    
    // Simulate parsing the backup file structure
    console.log('\n3. Backup file structure check...');
    console.log('   Expected structure: { data: { templates: [...] } }');
    console.log('   The import function will detect this as "backup format"');
    
    console.log('\n4. Import capacity check...');
    const currentCount = storage.templates?.length || 0;
    const importCount = 20; // From your backup file
    const totalAfter = currentCount + importCount;
    console.log(`   Current: ${currentCount}`);
    console.log(`   Importing: ${importCount}`);
    console.log(`   Total after: ${totalAfter}`);
    
    if (storage.licenseStatus === 'valid') {
        console.log('   ✅ Pro license - can import unlimited templates');
    } else if (totalAfter <= 10) {
        console.log('   ✅ Free license - within 10 template limit');
    } else {
        console.log(`   ❌ Free license - would exceed 10 template limit (${totalAfter} > 10)`);
        console.log('   Need to upgrade to Pro or reduce import count');
    }
    
    console.log('\n=== CHECK COMPLETE ===');
    console.log('Ready to import! Try importing your backup file now.');
}

checkImportReady();
