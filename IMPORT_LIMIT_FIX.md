# Import Template Limit Fix

## Problem

When importing 20 templates from a JSON file with a Pro license, only 3 templates were being imported. The import was incorrectly applying the free tier limit.

## Root Causes

1. **Stale License Status**: The `TemplateManager.isProLicense` flag wasn't being updated before import
2. **Wrong Free Limit**: The `saveTemplate` method had a limit of 3 templates instead of 10
3. **No Fresh License Check**: Import didn't verify current license status with background script

## Solutions Applied

### 1. Fresh License Check in Import

Added a fresh license check at the start of the import process:

```javascript
// Check license status fresh from background script
let isProLicense = this.isProLicense;
try {
    const licenseResponse = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
    if (licenseResponse && licenseResponse.success) {
        isProLicense = licenseResponse.valid;
        this.isProLicense = isProLicense; // Update local flag
    }
} catch (error) {
    console.warn('Could not check license status, using cached value:', error);
}
```

### 2. Updated Free Tier Limit

Changed the free tier limit from 3 to 10 templates (matches specification):

**Before:**
```javascript
if (!this.isProLicense && userTemplates.length >= 3) {
    throw new Error('Free license limited to 3 custom templates...');
}
```

**After:**
```javascript
if (!this.isProLicense && userTemplates.length >= 10) {
    throw new Error('Free license limited to 10 custom templates...');
}
```

### 3. Better Error Messages

Updated error messages to be more helpful:

```javascript
throw new Error(`Import would exceed free license limit of 10 templates. You have ${currentUserTemplates.length} templates and are trying to import ${templatesToImport.length} more. Upgrade to Pro for unlimited templates.`);
```

## Testing

### Test 1: Import with Pro License

1. Activate Pro license
2. Import JSON file with 20 templates
3. **Expected**: All 20 templates imported successfully
4. **Result**: ✅ Should work now

### Test 2: Import with Free License (Under Limit)

1. Use free license
2. Import JSON file with 5 templates
3. **Expected**: All 5 templates imported
4. **Result**: ✅ Should work

### Test 3: Import with Free License (Over Limit)

1. Use free license
2. Already have 5 templates
3. Try to import 10 more templates
4. **Expected**: Error message about exceeding limit
5. **Result**: ✅ Should show proper error

### Test 4: Import with Duplicates

1. Import templates
2. Try to import same templates again
3. **Expected**: Skips duplicates, shows count
4. **Result**: ✅ Should work

## Files Modified

- `adreply/ui/modules/template-manager.js`
  - Updated `importTemplates()` method
  - Updated `saveTemplate()` method

## How It Works Now

### Import Flow

1. **Parse JSON file** - Validate structure
2. **Check license status** - Fresh check with background script
3. **Validate limit** - Check if import would exceed limit
4. **Process templates** - Validate each template, skip duplicates
5. **Save to storage** - Save all valid templates at once
6. **Return result** - Show success message with counts

### License Checks

| License Type | Template Limit | Import Behavior |
|--------------|----------------|-----------------|
| Free | 10 templates | Checks total after import |
| Pro | Unlimited | No limit check |
| Admin | Unlimited | No limit check |

### Error Messages

**Free License - Over Limit:**
```
Import would exceed free license limit of 10 templates. 
You have 5 templates and are trying to import 10 more. 
Upgrade to Pro for unlimited templates.
```

**Invalid File:**
```
Invalid template file format - missing templates array
```

**No Templates:**
```
No templates found in import file
```

**All Duplicates:**
```
No valid templates found to import (all were duplicates or invalid)
```

## Benefits

1. ✅ **Pro users can import unlimited templates**
2. ✅ **Free users get correct limit (10 instead of 3)**
3. ✅ **Fresh license check ensures accuracy**
4. ✅ **Better error messages**
5. ✅ **Handles duplicates gracefully**

## Verification

After reloading the extension, verify:

```javascript
// In console
const response = await chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' });
console.log('License Valid:', response.valid);
console.log('Template Limit:', response.status?.templateLimit);
```

**Expected for Pro:**
```
License Valid: true
Template Limit: Infinity
```

## Related Issues

This fix also resolves:
- Template creation limit showing 3 instead of 10 for free users
- Pro license not being recognized during import
- Stale license status in template manager

## Notes

- Import bypasses individual `saveTemplate()` checks for efficiency
- Duplicates are detected by label (case-insensitive)
- Each imported template gets a fresh ID and timestamp
- Prebuilt templates are not counted toward limits
- License status is cached but refreshed on import
