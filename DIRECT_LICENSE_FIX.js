// DIRECT LICENSE FIX - Bypasses background script
// Run this in the browser console (F12) on the sidepanel page

(async function directLicenseFix() {
    console.log('=== 🔐 DIRECT LICENSE FIX ===\n');
    
    // Get the license key from storage
    const storage = await chrome.storage.local.get(['licenseKey']);
    
    if (!storage.licenseKey) {
        console.error('❌ No license key found in storage');
        console.log('   Import your backup file first');
        return;
    }
    
    console.log('✅ Found license key');
    const licenseKey = storage.licenseKey;
    
    // Decode the JWT to get the plan info
    try {
        const parts = licenseKey.split('.');
        const payload = JSON.parse(atob(parts[1]));
        
        console.log('📋 License info from JWT:');
        console.log('   Plan:', payload.plan);
        console.log('   Extension:', payload.ext);
        console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
        
        // Check if expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.error('❌ License is EXPIRED');
            console.log('   Expired on:', new Date(payload.exp * 1000).toLocaleString());
            return;
        }
        
        console.log('✅ License is valid (not expired)');
        
        // Create the license data in the correct format
        const licenseData = {
            token: licenseKey,
            status: 'pro',
            tier: 'pro',
            plan: payload.plan || 'pro',
            entitlements: {
                plan: payload.plan || 'pro',
                features: ['unlimited_templates', 'unlimited_categories', 'ai_features']
            },
            expiresAt: new Date(payload.exp * 1000).toISOString(),
            lastVerification: Date.now()
        };
        
        // Encrypt the token (simple XOR cipher like the extension uses)
        function encrypt(text) {
            const key = 'adreply_extension_key_2024';
            let encrypted = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                encrypted += String.fromCharCode(charCode);
            }
            return btoa(encrypted);
        }
        
        licenseData.token = encrypt(licenseKey);
        
        // Save to storage in the correct format
        console.log('\n💾 Saving license to storage...');
        await chrome.storage.local.set({
            adreply_license: licenseData
        });
        
        console.log('✅ License saved successfully!');
        
        // Verify it was saved
        const verify = await chrome.storage.local.get(['adreply_license']);
        if (verify.adreply_license) {
            console.log('✅ Verified: License is in storage');
            console.log('   Status:', verify.adreply_license.status);
            console.log('   Tier:', verify.adreply_license.tier);
        }
        
        console.log('\n🔄 Reloading page in 2 seconds...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error processing license:', error);
        console.error('   The license key may be invalid');
    }
    
    console.log('\n=== END ===');
})();
