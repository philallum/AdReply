// COPY AND PASTE THIS ENTIRE CODE INTO THE BROWSER CONSOLE (F12)
// Make sure you're on the AdReply sidepanel page

(async function fixLicenseNow() {
    console.log('=== 🔐 FIXING LICENSE NOW ===\n');
    
    // Step 1: Check what's in storage
    console.log('Step 1: Checking storage...');
    const storage = await chrome.storage.local.get(['licenseKey', 'adreply_license']);
    
    if (storage.licenseKey) {
        console.log('✅ Found licenseKey (old format)');
        console.log('   Key:', storage.licenseKey.substring(0, 50) + '...');
    } else {
        console.error('❌ No licenseKey found in storage');
        console.log('   You need to import your backup file first');
        return;
    }
    
    if (storage.adreply_license) {
        console.log('ℹ️  Found adreply_license (new format)');
        console.log('   Status:', storage.adreply_license.status);
    } else {
        console.log('⚠️  No adreply_license found (needs activation)');
    }
    
    // Step 2: Activate the license
    console.log('\nStep 2: Activating license...');
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'SET_LICENSE',
            token: storage.licenseKey
        });
        
        console.log('📋 Response:', response);
        
        if (response && response.valid) {
            console.log('✅ LICENSE ACTIVATED SUCCESSFULLY!');
            console.log('   Plan:', response.entitlements?.plan);
            console.log('   Features:', response.entitlements?.features);
            
            // Step 3: Verify it was saved
            console.log('\nStep 3: Verifying license was saved...');
            const newStorage = await chrome.storage.local.get(['adreply_license']);
            if (newStorage.adreply_license) {
                console.log('✅ License saved to storage');
                console.log('   Status:', newStorage.adreply_license.status);
                console.log('   Tier:', newStorage.adreply_license.tier);
            }
            
            // Step 4: Reload the page
            console.log('\n✅ ALL DONE! Reloading page in 2 seconds...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } else {
            console.error('❌ LICENSE ACTIVATION FAILED');
            console.error('   Error:', response?.error);
            console.error('   Full response:', response);
        }
        
    } catch (error) {
        console.error('❌ ERROR ACTIVATING LICENSE');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
    }
    
    console.log('\n=== END ===');
})();
