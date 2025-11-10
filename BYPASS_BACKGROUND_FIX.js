// BYPASS BACKGROUND SCRIPT - SET LICENSE DIRECTLY
// This is the fastest way to fix the license issue
// Copy and paste this entire code into the browser console (F12)

(async function bypassBackgroundFix() {
    console.log('=== 🔐 BYPASSING BACKGROUND - SETTING LICENSE DIRECTLY ===\n');
    
    // Step 1: Get the license key from storage
    console.log('Step 1: Getting license key from storage...');
    const storage = await chrome.storage.local.get(['licenseKey']);
    
    if (!storage.licenseKey) {
        console.error('❌ ERROR: No license key found in storage');
        console.log('   You need to import your backup file first');
        console.log('   Go to Backup & Restore → Import Data');
        return;
    }
    
    console.log('✅ Found license key');
    const licenseKey = storage.licenseKey;
    console.log('   Key starts with:', licenseKey.substring(0, 30) + '...');
    
    // Step 2: Decode and validate the JWT
    console.log('\nStep 2: Decoding JWT token...');
    try {
        const parts = licenseKey.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        console.log('✅ JWT decoded successfully');
        console.log('   Plan:', payload.plan);
        console.log('   Extension:', payload.ext);
        console.log('   Issued:', new Date(payload.iat * 1000).toLocaleString());
        console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
        
        // Check if expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.error('❌ ERROR: License is EXPIRED');
            console.log('   Expired on:', new Date(payload.exp * 1000).toLocaleString());
            console.log('   You need to renew your license');
            return;
        }
        
        console.log('✅ License is valid (not expired)');
        
        // Step 3: Encrypt the token (same way the extension does)
        console.log('\nStep 3: Encrypting token...');
        function encryptToken(text) {
            const key = 'adreply_extension_key_2024';
            let encrypted = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                encrypted += String.fromCharCode(charCode);
            }
            return btoa(encrypted);
        }
        
        const encryptedToken = encryptToken(licenseKey);
        console.log('✅ Token encrypted');
        
        // Step 4: Create the license data object
        console.log('\nStep 4: Creating license data...');
        const licenseData = {
            token: encryptedToken,
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
        
        console.log('✅ License data created');
        console.log('   Status:', licenseData.status);
        console.log('   Tier:', licenseData.tier);
        console.log('   Plan:', licenseData.plan);
        
        // Step 5: Save to storage
        console.log('\nStep 5: Saving to storage...');
        await chrome.storage.local.set({
            adreply_license: licenseData,
            licenseStatus: 'valid'  // Also set the old format for compatibility
        });
        
        console.log('✅ License saved to storage!');
        
        // Step 6: Verify it was saved
        console.log('\nStep 6: Verifying...');
        const verify = await chrome.storage.local.get(['adreply_license', 'licenseStatus']);
        
        if (verify.adreply_license) {
            console.log('✅ VERIFIED: License is in storage');
            console.log('   Status:', verify.adreply_license.status);
            console.log('   Tier:', verify.adreply_license.tier);
            console.log('   Plan:', verify.adreply_license.plan);
        } else {
            console.error('❌ ERROR: License not found after save');
            return;
        }
        
        // Step 7: Reload the page
        console.log('\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅');
        console.log('License has been activated!');
        console.log('Reloading page in 2 seconds...');
        console.log('After reload, you should see all 20 templates with "unlimited" status');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('   Stack:', error.stack);
        console.log('\n   The license key may be corrupted or invalid');
    }
    
    console.log('\n=== END ===');
})();
