# Troubleshooting v2.0 UI Not Showing

## Quick Checklist

The v2.0 UI sections ARE in the HTML and the JavaScript IS connected. Here's how to see them:

### Step 1: Verify You're Looking in the Right Place

The v2.0 features are in the **License** tab (the 3rd/rightmost tab).

**Tabs in AdReply:**
1. **Adverts** - Post analysis and suggestions
2. **Templates** - Template management
3. **License** ← **v2.0 FEATURES ARE HERE**

### Step 2: Reload Extension Properly

**Option A: Soft Reload**
1. Go to `chrome://extensions/`
2. Find AdReply
3. Click the reload button (🔄)

**Option B: Hard Reload (Recommended)**
1. Go to `chrome://extensions/`
2. Toggle AdReply OFF
3. Wait 2 seconds
4. Toggle AdReply ON

**Option C: Complete Reinstall**
1. Go to `chrome://extensions/`
2. Remove AdReply completely
3. Click "Load unpacked"
4. Select the `adreply/` folder

### Step 3: Open AdReply Correctly

1. Navigate to **any Facebook page** (e.g., facebook.com)
2. Click the **AdReply extension icon** in your toolbar
3. The side panel should open
4. Click the **License** tab (3rd tab, rightmost)

### Step 4: What You Should See

In the License tab, you should see these 4 sections **at the top**, before the license activation section:

```
┌─────────────────────────────────────┐
│ AI Setup Wizard                     │
│ Generate templates automatically... │
│ [🚀 Run AI Setup Wizard]           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Keyword Performance                 │
│ View how your keywords are...       │
│ [📊 View Keyword Dashboard]        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Template Marketplace                │
│ Browse and import pre-built...      │
│ [🛒 Open Marketplace]              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Affiliate Links                     │
│ Add affiliate links to your...      │
│ [Input field]                       │
│ [Save Default Link]                 │
│ [Clear Default Link]                │
└─────────────────────────────────────┘
```

## Debugging Steps

### Check Console for Errors

1. **Open AdReply side panel**
2. **Right-click anywhere** in the panel
3. **Select "Inspect"**
4. **Go to Console tab**
5. **Look for:**
   - ✅ "AdReply: v2.0 feature listeners set up"
   - ❌ Any red error messages

### Verify JavaScript Loaded

In the console, type:
```javascript
document.getElementById('runAIWizardBtn')
```

**Expected result:** Should return an HTML button element
**If null:** The HTML isn't loaded or you're not on the License tab

### Test Button Manually

In the console, type:
```javascript
document.getElementById('runAIWizardBtn').click()
```

**Expected result:** Should open a new tab with the onboarding wizard
**If error:** Event listener isn't attached

### Check Tab Visibility

In the console, type:
```javascript
document.getElementById('license').classList.contains('active')
```

**Expected result:** Should return `true` if you're on the License tab
**If false:** Click the License tab first

## Common Issues

### Issue 1: "I don't see a License tab"

**Solution:** 
- Make sure you're looking at the AdReply side panel, not a popup
- The tabs are at the top: Adverts | Templates | License
- License is the rightmost tab

### Issue 2: "License tab is empty"

**Possible causes:**
- CSS issue hiding content
- JavaScript error preventing render
- Wrong HTML file loaded

**Solution:**
1. Check console for errors
2. Inspect the License tab div:
   ```javascript
   document.getElementById('license').innerHTML.length
   ```
   Should return a large number (>1000)

### Issue 3: "Buttons don't do anything"

**Possible causes:**
- Event listeners not attached
- JavaScript error during initialization

**Solution:**
1. Check console for "v2.0 feature listeners set up"
2. If not present, there's an initialization error
3. Look for red error messages in console

### Issue 4: "I see old UI without v2.0 features"

**Possible causes:**
- Browser cached old HTML
- Wrong extension folder loaded
- Extension not reloaded

**Solution:**
1. **Hard refresh:** Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. **Clear cache:** 
   - Open DevTools (F12)
   - Right-click reload button
   - Select "Empty Cache and Hard Reload"
3. **Reinstall extension** (see Step 2, Option C above)

## Verification Commands

Run these in the console to verify everything:

```javascript
// 1. Check if buttons exist
console.log('AI Wizard button:', document.getElementById('runAIWizardBtn'));
console.log('Keyword button:', document.getElementById('viewKeywordPerformanceBtn'));
console.log('Marketplace button:', document.getElementById('marketplaceLinkBtn'));
console.log('Affiliate save button:', document.getElementById('saveAffiliateLinkBtn'));

// 2. Check if License tab has content
console.log('License tab content length:', document.getElementById('license').innerHTML.length);

// 3. Check if on License tab
console.log('On License tab:', document.getElementById('license').classList.contains('active'));

// 4. Switch to License tab programmatically
document.querySelector('[data-tab="license"]').click();
```

## File Locations to Verify

Make sure these files exist in your `adreply/` folder:

```
adreply/
├── ui/
│   ├── sidepanel-modular.html  ← Contains v2.0 UI sections
│   ├── sidepanel-modular.js    ← Contains event listeners
│   ├── onboarding.html         ← AI wizard page
│   ├── marketplace.html        ← Marketplace page
│   └── keyword-performance.html ← Analytics page
└── manifest.json
```

Verify with:
```bash
ls -la adreply/ui/*.html
```

Should show all 4 HTML files.

## Still Not Working?

### Take Screenshots

1. Screenshot of the License tab
2. Screenshot of the browser console
3. Screenshot of chrome://extensions/ showing AdReply

### Check File Timestamps

```bash
ls -lt adreply/ui/sidepanel-modular.* | head -5
```

Make sure the files were recently modified (today's date).

### Verify HTML Content

```bash
grep -c "AI Setup Wizard" adreply/ui/sidepanel-modular.html
```

Should return: `1` (meaning the section exists)

```bash
grep -c "runAIWizardBtn" adreply/ui/sidepanel-modular.html
```

Should return: `1` (meaning the button exists)

```bash
grep -c "setupV2FeatureListeners" adreply/ui/sidepanel-modular.js
```

Should return: `2` (definition and call)

## Expected Console Output

When you open AdReply, you should see:
```
AdReply: Keyword Learning Engine initialized
AdReply: Post Publisher initialized
AdReply: v2.0 feature listeners set up
```

If you see these messages, the integration is working!

---

## Summary

✅ The v2.0 UI sections ARE in the HTML (line 927-1000 of sidepanel-modular.html)
✅ The event listeners ARE in the JavaScript (setupV2FeatureListeners method)
✅ The buttons ARE connected to working methods

**The most common issue is:**
- Not clicking the **License** tab (3rd tab)
- Not reloading the extension after changes
- Browser caching old HTML

**Try this:**
1. Completely remove and reinstall the extension
2. Open AdReply on Facebook
3. Click the **License** tab
4. You should see the 4 new sections at the top

If you still don't see them, share:
- Screenshot of the License tab
- Console output
- Result of the verification commands above
