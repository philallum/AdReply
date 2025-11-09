# Backup Download Fix

## Problem

When clicking "Download JSON file" in the Backup & Restore feature, the following error occurred:

```
TypeError: Cannot read properties of undefined (reading 'download')
at chrome-extension://...sidepanel-modular.js:858:30
```

## Root Cause

The code was trying to use `chrome.downloads.download()` API, but the extension doesn't have the `downloads` permission in the manifest.

## Solution

Replaced the `chrome.downloads.download()` method with a simpler approach that doesn't require additional permissions:

### Before (Required downloads permission)
```javascript
chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
}, callback);
```

### After (No permission needed)
```javascript
// Create temporary download link
const downloadLink = document.createElement('a');
downloadLink.href = url;
downloadLink.download = filename;
downloadLink.style.display = 'none';
document.body.appendChild(downloadLink);

// Trigger download
downloadLink.click();

// Cleanup
setTimeout(() => {
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}, 100);
```

## Benefits

1. ✅ **No additional permissions needed** - Better for user privacy
2. ✅ **Works immediately** - No need to update manifest
3. ✅ **Simpler code** - Fewer error cases to handle
4. ✅ **Same user experience** - File downloads as expected

## Testing

1. Open extension sidepanel
2. Go to Backup & Restore section
3. Click "Download JSON file"
4. File should download with name: `adreply-backup-YYYY-MM-DDTHH-MM-SS.json`
5. Success message: "✓ Data exported successfully!"

## File Modified

- `adreply/ui/sidepanel-modular.js` - Updated `exportData()` method

## Alternative Approach (Not Used)

We could have added the `downloads` permission to the manifest:

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel",
    "scripting",
    "downloads"  // Add this
  ]
}
```

However, this would:
- Require users to accept a new permission
- Show a warning about "Download files to your computer"
- Be unnecessary for this simple use case

## Notes

- The download link method is the standard approach for web apps
- Works in all modern browsers
- No security concerns
- File downloads to user's default Downloads folder
- Filename includes timestamp for easy identification

## Backup File Format

```json
{
  "version": "1.0",
  "timestamp": "2024-11-09T12:00:00.000Z",
  "data": {
    "templates": [...],
    "licenseData": {...},
    "settings": {...},
    // ... all extension data
  }
}
```

## Related Files

- `adreply/ui/sidepanel-modular.js` - Export/import functionality
- `adreply/manifest.json` - Extension permissions
- `adreply/ui/backup.html` - Backup UI (if separate)
