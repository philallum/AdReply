# Usage Tracking Debug Guide

## Purpose: Silent 24-hour template tracking to avoid showing recently used templates

### What the System Does:

1. **Silent Tracking**: Records when templates are used without showing statistics
2. **24-Hour Filtering**: Prevents recently used templates from appearing in suggestions
3. **Group-Specific**: Tracks usage per Facebook group separately
4. **Clean UI**: No usage statistics or counts displayed to keep interface simple

### Debug Steps:

1. **Open Browser Console** (F12) and watch for debug messages when copying templates

2. **Click "Debug Templates & URLs"** button to see:
   - If usage tracker is initialized
   - Current templates and their usage counts
   - Whether you're on Facebook (required for usage tracking)

3. **Test Usage Tracking** in console:
   ```javascript
   testUsageTracking()
   ```

4. **When copying a template**, look for these console messages:
   ```
   AdReply: Copy clicked! {text: "...", suggestion: {...}}
   AdReply: Recording usage for template: 1234567890
   AdReply: Usage recorded: {templateId: "1234567890", ...}
   AdReply: Incremented usage count for template: 1234567890 New count: 1
   ```

### Expected Behavior:

1. **Copy Template** → Click "Copy to Clipboard" on any suggestion
2. **Silent Recording** → Usage recorded in background (no user notification)
3. **24-Hour Filter** → Same template won't appear in suggestions for 24 hours in that group
4. **Clean Interface** → No usage counts or statistics displayed

### Common Issues:

1. **Not on Facebook**: Usage tracking only works on facebook.com pages
2. **Usage Tracker Not Loaded**: Check if `../scripts/usage-tracker.js` exists
3. **Template ID Missing**: Fallback templates won't be tracked (only real templates)
4. **Storage Permissions**: Extension needs storage permissions

### Debug Console Commands:

- `debugTemplateMatching()` - Full debug info
- `testUsageTracking()` - Test usage recording
- `testEtsySuggestions()` - Test Etsy template matching

### What to Look For:

✅ **Working**:
```
AdReply: ✅ Usage tracker initialized successfully in sidebar
AdReply: Copy clicked! 
AdReply: Recording usage for template: 1234567890
AdReply: Usage recorded: {...}
AdReply: Usage recorded successfully for 24h tracking
```

❌ **Not Working**:
```
AdReply: ❌ UsageTracker class not available
AdReply: Usage tracker not initialized
AdReply: Not on Facebook, skipping usage recording
```

### Template List Display:

Each template shows:
- Template name
- 📁 Category name  
- Edit/Delete buttons

Usage tracking works silently in the background - no counts or statistics are displayed.