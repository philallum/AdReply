# Upgrade URL Update

## Change Summary

Updated the upgrade URL throughout the extension to point to the correct location.

## Changes Made

### 1. Added Upgrade Button Handler
**File**: `adreply/ui/sidepanel-modular.js`

Added event listener and method:
```javascript
// Event listener
document.getElementById('upgradeBtn').addEventListener('click', () => this.openUpgradePage());

// Method
openUpgradePage() {
    chrome.tabs.create({ url: 'https://teamhandso.me/extensions/adreply' });
}
```

### 2. Updated License Utils
**File**: `adreply/scripts/license-utils.js`

Updated the upgrade URL in `openUpgradeFlow()`:
```javascript
const upgradeUrl = 'https://teamhandso.me/extensions/adreply';
```

## Correct URL

✅ **Upgrade URL**: `https://teamhandso.me/extensions/adreply`

## Where It's Used

1. **License Tab** - "Upgrade to Pro" button
2. **Feature Access Prompts** - When user tries to access Pro features
3. **Template Limit Warnings** - When user hits template limit

## Testing

To test the upgrade button:
1. Open extension
2. Go to License tab
3. Click "Upgrade to Pro" button
4. Verify it opens `https://teamhandso.me/extensions/adreply` in a new tab

## Status

✅ Implementation complete
✅ No syntax errors
✅ Ready for testing
