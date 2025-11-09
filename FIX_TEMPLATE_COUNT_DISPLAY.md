# Fix Template Count Display Issue

## Problem
Template count shows "0/10 custom templates (1 category max)" even with Pro license activated.

## Solution

### Quick Fix (Immediate)

1. **Open the extension sidepanel**
2. **Open browser console** (F12 or right-click → Inspect)
3. **Copy and paste this code:**

```javascript
// Force update template count
async function fixDisplay() {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
    const countEl = document.getElementById('templateCount');
    const isProLicense = response.valid;
    
    if (isProLicense) {
        countEl.textContent = '0 custom templates (unlimited categories & templates) + 400 prebuilt';
        countEl.style.color = '#28a745';
        countEl.style.fontWeight = '500';
        console.log('✅ Updated to Pro display');
    }
}

await fixDisplay();
```

4. **Press Enter**
5. **Check the Templates tab** - should now show "unlimited"

### Verify License is Active

Run this in console:

```javascript
const response = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('License Valid:', response.valid);
console.log('Tier:', response.status?.tier);
console.log('Template Limit:', response.status?.templateLimit);
```

**Expected output for Pro license:**
```
License Valid: true
Tier: pro
Template Limit: Infinity
```

### Permanent Fix

The code has been updated. To apply the permanent fix:

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find AdReply
   - Click the reload icon 🔄

2. **Reopen the sidepanel**

3. **The template count should now automatically show "unlimited"**

### If Still Not Working

#### Option 1: Use Test Scripts

Copy the contents of `TEST_LICENSE_STATUS.js` into the console and run:

```javascript
await testLicense.runAll()
```

This will diagnose the issue.

#### Option 2: Force Update

Copy the contents of `FORCE_UPDATE_UI.js` into the console and run:

```javascript
await forceUpdate.all()
```

This will manually update all UI elements.

#### Option 3: Re-activate License

1. Go to License tab
2. Click "Check License Status" button
3. Go to Templates tab
4. Count should update

### What Changed

**Files Updated:**
1. `adreply/ui/modules/ui-manager.js` - Better Pro license detection
2. `adreply/ui/sidepanel-modular.js` - Async license checking
3. Fixed method name: `setProLicenseStatus` → `setProLicense`

**New Display Text:**
- **Free:** "X/10 custom templates (1 category max) + Y prebuilt"
- **Pro:** "X custom templates (unlimited categories & templates) + Y prebuilt"

### Debugging

If the issue persists, check these in console:

```javascript
// 1. Check if license manager is initialized
const response = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('Response:', response);

// 2. Check storage
const storage = await chrome.storage.local.get('licenseData');
console.log('License Data:', storage.licenseData);

// 3. Check UI element
const countEl = document.getElementById('templateCount');
console.log('Current text:', countEl?.textContent);
console.log('Color:', countEl?.style.color);
```

### Expected Behavior

**With Pro License:**
- License tab shows: "License Status: Pro (Active)"
- License details show: "✓ Unlimited custom templates" etc.
- Templates tab shows: "X custom templates (unlimited categories & templates)"
- Text color is green (#28a745)

**Without Pro License:**
- License tab shows: "License Status: Free"
- Templates tab shows: "X/10 custom templates (1 category max)"
- Text color is gray (#6c757d)

### Common Issues

**Issue 1: License activated but UI not updating**
- **Solution:** Click "Check License Status" button or reload extension

**Issue 2: Shows "0/10" after activation**
- **Solution:** Run `await forceUpdate.all()` in console

**Issue 3: License not persisting**
- **Solution:** Check if API endpoint is accessible and returning rotated token

**Issue 4: Background script not responding**
- **Solution:** Check console for errors, reload extension

### Verification Checklist

After fixing, verify:
- ✅ License tab shows "Pro (Active)"
- ✅ License details show "Unlimited custom templates"
- ✅ Templates tab shows "unlimited categories & templates"
- ✅ Text is green
- ✅ Can create unlimited templates
- ✅ Can create unlimited categories

### Support

If none of these solutions work:

1. Check browser console for errors
2. Check Network tab for API calls to `/api/verify`
3. Verify JWT token is valid
4. Check if background script is running
5. Try clearing extension storage and re-activating

### Quick Commands Reference

```javascript
// Check license
await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' })

// Force update UI
await forceUpdate.all()

// Test license
await testLicense.runAll()

// Check storage
await chrome.storage.local.get('licenseData')

// Verify license with server
await chrome.runtime.sendMessage({ type: 'VERIFY_LICENSE' })
```
