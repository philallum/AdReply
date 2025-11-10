// Run this in the console to check if background script is responding

(async function checkBackground() {
    console.log('=== CHECKING BACKGROUND SCRIPT ===\n');
    
    // Test 1: Check if runtime is available
    console.log('Test 1: Chrome runtime available?', typeof chrome.runtime !== 'undefined');
    
    // Test 2: Try a simple ping with timeout
    console.log('\nTest 2: Sending test message with timeout...');
    
    try {
        const response = await Promise.race([
            chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 3 seconds')), 3000))
        ]);
        
        console.log('✅ Background script responded:', response);
        
    } catch (error) {
        console.error('❌ Background script NOT responding:', error.message);
        console.log('\n🔧 SOLUTION: The background script (service worker) may have stopped.');
        console.log('   Go to chrome://extensions/');
        console.log('   Find AdReply extension');
        console.log('   Click "service worker" or "background page" link');
        console.log('   Check for errors in that console');
        console.log('   Then click the reload icon for the extension');
    }
    
    // Test 3: Check storage directly
    console.log('\nTest 3: Checking storage directly...');
    const storage = await chrome.storage.local.get(null);
    console.log('Storage keys:', Object.keys(storage));
    console.log('Has licenseKey?', !!storage.licenseKey);
    console.log('Has adreply_license?', !!storage.adreply_license);
    
    if (storage.adreply_license) {
        console.log('License status:', storage.adreply_license.status);
        console.log('License tier:', storage.adreply_license.tier);
    }
    
    console.log('\n=== END ===');
})();
