# Side Panel Left-Click Troubleshooting Guide

## Current Status
✅ Code is correct - `setPanelBehavior({ openPanelOnActionClick: true })` is set
✅ Manifest is correct - side panel is properly configured
✅ No conflicting handlers

## The Problem
Chrome sometimes caches the old behavior and needs a hard reset.

## Solution: Complete Reset (Do ALL steps in order)

### Step 1: Remove Extension Completely
1. Go to `chrome://extensions/`
2. Find AdReply
3. Click **"Remove"** (not just disable)
4. Confirm removal

### Step 2: Restart Chrome Completely
1. **Close ALL Chrome windows** (important!)
2. On Linux: Make sure Chrome is fully closed:
   ```bash
   ps aux | grep chrome
   ```
   If you see Chrome processes, kill them:
   ```bash
   killall chrome
   ```
3. Wait 5 seconds
4. Reopen Chrome

### Step 3: Reload Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select your `adreply` folder
5. Extension should load fresh

### Step 4: Verify Setup
1. Click "Inspect views: service worker" under AdReply
2. Check console for:
   ```
   AdReply: ✅ Side panel will open on left-click
   AdReply: Side panel API is available
   ```
3. If you see errors, there's a problem with the code

### Step 5: Test Left-Click
1. Go to `https://www.facebook.com/`
2. **Left-click** the AdReply icon in the toolbar
3. Side panel should open

## If It Still Doesn't Work

### Check Chrome Version
Side panel API requires Chrome 114+:
```
chrome://version/
```

### Try Right-Click Method
If left-click doesn't work, you can always:
1. **Right-click** the AdReply icon
2. Select "Open AdReply"
3. This always works

### Check for Errors
1. Open service worker console: `chrome://extensions/` → "Inspect views: service worker"
2. Look for errors when clicking the icon
3. Share any error messages

### Alternative: Use Keyboard Shortcut
You can add a keyboard shortcut:
1. Go to `chrome://extensions/shortcuts`
2. Find AdReply
3. Set a shortcut (e.g., Ctrl+Shift+A)
4. Use that to open the side panel

## Why This Happens

Chrome's extension system caches behavior settings. When you change how the extension icon works (from manual handler to automatic), Chrome doesn't always pick up the change immediately. A complete removal and restart forces Chrome to re-read all the settings.

## Quick Test Command

After reloading, run this in the service worker console:
```javascript
chrome.sidePanel.getPanelBehavior().then(console.log)
```

Should show: `{ openPanelOnActionClick: true }`

---

**If none of this works, the issue might be with your Chrome installation or profile.**
