# Force Show All 20 Templates - Immediate Fix

## Quick Console Fix

Run this in the browser console RIGHT NOW to see all 20 templates:

```javascript
// Force reload the page - this will trigger the new license check
window.location.reload();
```

After reload, check the console. You should see:
```
🔐 Checking license status before loading templates...
🔐 License check result: { valid: true, tier: 'pro', ... }
AdReply: Total templates loaded: 420 { userTemplates: 20, prebuiltTemplates: 400, isProLicense: true }
🔍 getTemplates() - isProLicense: true
✅ Pro license detected, returning all 420 templates
```

## If Still Showing 10 After Reload

The license check might be failing. Run this diagnostic:

```javascript
// Check license status
const license = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('License response:', license);
console.log('Valid:', license.valid);
console.log('Tier:', license.status?.tier);
console.log('Template Limit:', license.status?.templateLimit);
```

**Expected output:**
```
License response: { success: true, valid: true, ... }
Valid: true
Tier: "pro"
Template Limit: Infinity
```

**If you see `Valid: false`**, then the license isn't active. Fix:
1. Go to License tab
2. Click "Check License Status"
3. Wait for it to verify
4. Go back to Templates tab

## Alternative: Manual Override (Temporary)

If reload doesn't work, you can manually force it:

```javascript
// This is a temporary hack - reload will reset it
// But it will let you see all 20 templates immediately

// Note: This won't work because we don't have direct access to the template manager
// You MUST reload the extension for the fix to take effect
```

## What Changed

I updated `loadTemplates()` to:
1. **Check license status FIRST** before loading templates
2. **Update `isProLicense` flag** based on current license
3. **Log the license status** so you can see what's happening

## Steps to Fix Permanently

1. **Reload the extension** (chrome://extensions/ → reload)
2. **Open sidepanel**
3. **Open console** (F12)
4. **Go to Templates tab**

The console will show:
```
🔐 Checking license status before loading templates...
🔐 License check result: { valid: true, tier: 'pro', nowProLicense: true }
```

Then when you view templates:
```
🔍 getTemplates() - isProLicense: true
✅ Pro license detected, returning all 420 templates
```

## Verification

After reload, you should see:
- **Templates tab**: All 20 templates in your category
- **Template count**: "20 custom templates (unlimited)"
- **Console**: "Pro license detected, returning all 420 templates"

## If Console Shows `isProLicense: false`

This means the license check is failing. Possible causes:

1. **Background script not responding**
   ```javascript
   // Test background script
   const ping = await chrome.runtime.sendMessage({ type: 'PING' });
   console.log('Background script:', ping);
   ```

2. **License data not in storage**
   ```javascript
   const storage = await chrome.storage.local.get(['licenseData']);
   console.log('License data:', storage.licenseData);
   ```

3. **License needs re-activation**
   - Go to License tab
   - Click "Check License Status"
   - Should show "Pro (Active)"

## Expected Console Output

After reload, you should see this sequence:

```
AdReply: Background script loaded
AdReply: Managers initialized successfully
🔐 Checking license status before loading templates...
🔐 License check result: { valid: true, tier: 'pro', nowProLicense: true }
AdReply: Loaded prebuilt templates: 400
AdReply: Total templates loaded: 420 { userTemplates: 20, prebuiltTemplates: 400, isProLicense: true }
🔍 getTemplates() - isProLicense: true
✅ Pro license detected, returning all 420 templates
```

If you see `isProLicense: false` anywhere, the license isn't being recognized.

## Bottom Line

**Just reload the extension and it should work!**

The fix ensures the license is checked every time templates are loaded, so `isProLicense` will always be up-to-date.
