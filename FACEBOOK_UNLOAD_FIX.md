# Facebook window.onunload Fix

## Problem
Facebook blocks the `window.onunload` and `beforeunload` events, which were causing our extension to fail to clean up properly when users navigated away from pages or closed tabs.

## Solution Implemented

### 1. Replaced Blocked Events
- **Removed**: `window.onunload` and `beforeunload` event listeners
- **Added**: `pagehide` and `visibilitychange` event listeners
- **Added**: Navigation detection using MutationObserver

### 2. Facebook-Safe Content Script Architecture

#### Shadow DOM Implementation
- Creates UI elements in a Shadow DOM attached to `document.documentElement`
- Avoids Facebook's React roots (`[data-pagelet]`, `[role="main"]`, `#mount_*`)
- Uses closed shadow root for complete isolation

#### Passive Observation
- Uses minimal, throttled MutationObserver (3-second intervals)
- Only observes feed areas, not Facebook's main containers
- Read-only operations to avoid triggering Facebook's detection

#### Safe Event Handling
```javascript
// OLD (blocked by Facebook):
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

// NEW (Facebook-compatible):
window.addEventListener('pagehide', cleanup);
document.addEventListener('visibilitychange', cleanup);
```

### 3. Navigation Detection
- Uses MutationObserver to detect URL changes in Facebook's SPA
- Handles `pushState`/`replaceState` navigation
- Automatic cleanup and reinitialization on page changes

### 4. Improved Cleanup Process
- Disconnects all observers
- Removes Shadow DOM containers
- Clears stored state
- Handles both tab closure and navigation

## Files Modified

### `scripts/content-minimal.js`
- Complete rewrite with Facebook-safe architecture
- Shadow DOM implementation
- Fixed event handling

### `scripts/background-safe.js`
- Enhanced message handling
- Post storage and management
- Tab cleanup on close

### `scripts/content-facebook-safe.js`
- Standalone Facebook-safe implementation
- Can be used as alternative to content-minimal.js

## Key Benefits

1. **No More Blocking**: Extension works reliably on Facebook
2. **Stealth Operation**: Minimal footprint to avoid detection
3. **Proper Cleanup**: Resources are cleaned up correctly
4. **SPA Compatible**: Handles Facebook's single-page app navigation
5. **Performance**: Throttled operations reduce resource usage

## Testing

The extension now:
- ✅ Loads successfully on Facebook groups
- ✅ Detects new posts without interference
- ✅ Cleans up properly on navigation
- ✅ Handles tab closure correctly
- ✅ Works with Facebook's React hydration
- ✅ Avoids Facebook's extension detection systems

## Usage

The fixed content script automatically:
1. Initializes only on Facebook group pages
2. Creates isolated Shadow DOM UI
3. Passively observes for new posts
4. Communicates with background script
5. Cleans up on page changes or tab closure

No additional configuration required - the fixes are transparent to users.