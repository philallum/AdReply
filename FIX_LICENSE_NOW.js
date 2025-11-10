// Run this in the browser console (F12) on the sidepanel page to fix the license

async function fixLicense() {
    console.log('=== FIXING LICENSE ===');
    
    // Get the license key from the old format
    const oldData = await chrome.storage.local.get(['licenseKey', 'licenseStatus']);
    console.log('Old format data:', oldData);
    
    if (!oldData.licenseKey) {
        console.error('❌ No license key found in storage');
        return;
    }
    
    const licenseKey = oldData.licenseKey;
    console.log('✅ Found license key:', licenseKey.substring(0, 50) + '...');
    
    // Activate the license using the background script
    console.log('🔄 Activating license...');
    const response = await chrome.runtime.sendMessage({
        type: 'SET_LICENSE',
        token: licenseKey
    });
    
    console.log('📋 Activation response:', response);
    
    if (response && response.valid) {
        console.log('✅ License activated successfully!');
        console.log('   Plan:', response.entitlements?.plan);
        console.log('   Features:', response.entitlements?.features);
        
        // Reload the page to reflect changes
        console.log('🔄 Reloading page...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else {
        console.error('❌ License activation failed:', response.error);
    }
}

fixLicense();
