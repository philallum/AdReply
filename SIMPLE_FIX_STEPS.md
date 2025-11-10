# Simple Fix - Step by Step

The background script isn't responding, which is blocking license activation. Here's the simplest fix:

## Step 1: Reload the Extension

1. Go to `chrome://extensions/`
2. Find **AdReply** extension
3. Click the **reload icon** (circular arrow)
4. This will restart the background script

## Step 2: Check Background Script

1. On the extensions page, look for **AdReply**
2. Click **"service worker"** or **"background page"** link
3. A console will open - check for any errors
4. You should see: "AdReply: Background script loaded"
5. If you see errors, take a screenshot and we'll fix them

## Step 3: Run the Direct Fix Script

1. Go back to the AdReply sidepanel
2. Open browser console (F12)
3. Copy and paste this code:

```javascript
(async function() {
    console.log('=== CHECKING BACKGROUND ===');
    
    // Test if background responds
    try {
        const test = await Promise.race([
            chrome.runtime.sendMessage({ type: 'PING' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
        console.log('✅ Background is working:', test);
    } catch (e) {
        console.error('❌ Background not responding:', e.message);
        console.log('Go to chrome://extensions/ and reload the extension');
        return;
    }
    
    // Get license key
    const storage = await chrome.storage.local.get(['licenseKey']);
    if (!storage.licenseKey) {
        console.error('❌ No license key found');
        return;
    }
    
    console.log('✅ Found license key, activating...');
    
    // Activate license
    const response = await chrome.runtime.sendMessage({
        type: 'SET_LICENSE',
        token: storage.licenseKey
    });
    
    if (response && response.valid) {
        console.log('✅ LICENSE ACTIVATED!');
        console.log('Plan:', response.entitlements?.plan);
        setTimeout(() => window.location.reload(), 1500);
    } else {
        console.error('❌ Activation failed:', response?.error);
    }
})();
```

## Step 4: Verify

After the page reloads, you should see:
- ✅ All 20 templates visible
- ✅ "unlimited templates" in the count
- ✅ Pro license active

## If Background Script Still Not Working

If the background script still doesn't respond after reload, there may be an error in one of the imported files. Check the background script console for errors like:

- "Failed to load script"
- "importScripts failed"
- Any red error messages

If you see errors, let me know what they say and I'll fix them.

## Alternative: Direct Storage Fix (If Background Won't Work)

If the background script absolutely won't work, run this to directly set the license:

```javascript
(async function() {
    const storage = await chrome.storage.local.get(['licenseKey']);
    if (!storage.licenseKey) {
        console.error('No license key');
        return;
    }
    
    const key = storage.licenseKey;
    const parts = key.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    function encrypt(text) {
        const k = 'adreply_extension_key_2024';
        let e = '';
        for (let i = 0; i < text.length; i++) {
            e += String.fromCharCode(text.charCodeAt(i) ^ k.charCodeAt(i % k.length));
        }
        return btoa(e);
    }
    
    await chrome.storage.local.set({
        adreply_license: {
            token: encrypt(key),
            status: 'pro',
            tier: 'pro',
            plan: 'pro',
            entitlements: { plan: 'pro', features: ['unlimited_templates'] },
            expiresAt: new Date(payload.exp * 1000).toISOString(),
            lastVerification: Date.now()
        }
    });
    
    console.log('✅ License set! Reloading...');
    setTimeout(() => window.location.reload(), 1500);
})();
```

This bypasses the background script entirely and sets the license directly in storage.
