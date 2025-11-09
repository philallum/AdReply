# Quick Fix Instructions

## Step 1: Check What's Actually in Storage

1. Open the extension sidepanel
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy and paste this code:

```javascript
const storage = await chrome.storage.local.get(['templates']);
console.log('Templates in storage:', storage.templates?.length);
console.log('Template labels:', storage.templates?.map(t => t.label));
```

5. Press Enter

**What to look for:**
- If it says "Templates in storage: 3" → Only 3 templates were saved
- If it says "Templates in storage: 20" → All 20 are saved but UI isn't showing them

## Step 2: Force Clear and Re-import

If only 3 templates are in storage:

```javascript
// Clear all templates
await chrome.storage.local.set({ templates: [] });
console.log('✅ Templates cleared');

// Reload the page
window.location.reload();
```

Then:
1. Go to License tab
2. Click "Check License Status" to ensure Pro is active
3. Go to Templates tab
4. Import your JSON file again
5. Watch the console for debug output

## Step 3: Check License Status

```javascript
const license = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('License valid:', license.valid);
console.log('License tier:', license.status?.tier);
console.log('Template limit:', license.status?.templateLimit);
```

**Expected output for Pro:**
```
License valid: true
License tier: "pro"
Template limit: Infinity
```

## Step 4: Manual Import with Debug

If import still fails, try this manual import:

```javascript
// Read your backup file content (you'll need to paste it)
const backupData = {
  "version": "1.0",
  "timestamp": "2025-11-09T20:47:36.029Z",
  "data": {
    "templates": [
      // ... paste your templates here
    ]
  }
};

// Get just the templates
const templates = backupData.data.templates;
console.log('Templates to import:', templates.length);

// Save directly to storage
await chrome.storage.local.set({ templates: templates });
console.log('✅ Templates saved directly');

// Reload
window.location.reload();
```

## Step 5: Check If It's a Display Issue

If storage shows 20 but UI shows 3:

```javascript
// Check what the template manager has loaded
// This requires checking during page load
// Look for this in console:
// "AdReply: Total templates loaded: 420"
// (20 user + 400 prebuilt = 420)
```

If you see 420 total but only 3 showing, it's a UI rendering issue.

## Common Issues

### Issue 1: Import Saves Only 3 Templates

**Cause:** Free license limit being enforced
**Fix:** Ensure Pro license is active before import

### Issue 2: All 20 in Storage But Only 3 Showing

**Cause:** UI not refreshing or filtering incorrectly
**Fix:** 
```javascript
window.location.reload();
```

### Issue 3: Import Says "20 imported" But Storage Has 3

**Cause:** Save operation failing partway through
**Fix:** Check console for errors during save

## Debug Output to Share

If still having issues, run this and share the output:

```javascript
console.log('=== DEBUG INFO ===');

// 1. License
const license = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('License:', {
    valid: license.valid,
    tier: license.status?.tier,
    limit: license.status?.templateLimit
});

// 2. Storage
const storage = await chrome.storage.local.get(['templates', 'licenseData']);
console.log('Storage:', {
    templateCount: storage.templates?.length,
    templateLabels: storage.templates?.map(t => t.label),
    licenseStatus: storage.licenseData?.status,
    licenseTier: storage.licenseData?.tier
});

// 3. Check for duplicates
const labels = storage.templates?.map(t => t.label) || [];
const uniqueLabels = new Set(labels);
console.log('Duplicates:', {
    total: labels.length,
    unique: uniqueLabels.size,
    hasDuplicates: labels.length !== uniqueLabels.size
});

console.log('=== END DEBUG ===');
```

## Expected Behavior

With Pro license and 20 templates:
1. Import shows: "Successfully imported 20 templates"
2. Storage check shows: 20 templates
3. UI shows: All 20 templates in the category
4. Template count shows: "20 custom templates (unlimited)"

## Next Steps

1. Run Step 1 to check storage
2. Share the output
3. Based on the output, we'll know if it's:
   - Import issue (not saving all 20)
   - Display issue (saved but not showing)
   - License issue (limit being enforced)
