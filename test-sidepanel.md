# Test Side Panel Configuration

## Quick Diagnostic

Open the service worker console (`chrome://extensions/` → "Inspect views: service worker") and run these commands:

### 1. Check if side panel API is available
```javascript
console.log('Side panel API available:', !!chrome.sidePanel);
```
Expected: `true`

### 2. Check current panel behavior
```javascript
chrome.sidePanel.getPanelBehavior().then(behavior => {
  console.log('Current behavior:', behavior);
});
```
Expected: `{ openPanelOnActionClick: true }`

### 3. Manually set the behavior (if needed)
```javascript
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .then(() => console.log('✅ Behavior set successfully'))
  .catch(err => console.error('❌ Failed:', err));
```

### 4. Test opening the panel programmatically
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.sidePanel.open({ windowId: tabs[0].windowId })
    .then(() => console.log('✅ Panel opened'))
    .catch(err => console.error('❌ Failed:', err));
});
```

## What Each Result Means

| Result | Meaning | Action |
|--------|---------|--------|
| API not available | Chrome version too old | Update Chrome to 114+ |
| `openPanelOnActionClick: false` | Behavior not set correctly | Run command #3 |
| `openPanelOnActionClick: true` | Configuration correct | Try complete reset |
| Panel opens programmatically | API works, click handler issue | Check for conflicting listeners |

## If Everything Shows Correct But Still Doesn't Work

This means Chrome has cached the old behavior. You MUST:
1. Remove the extension completely
2. Restart Chrome (close all windows)
3. Reload the extension

There's no way around this - Chrome caches extension behavior aggressively.
