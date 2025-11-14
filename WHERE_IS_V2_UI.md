# Where to Find the v2.0 UI

## TL;DR

**The v2.0 features are in the LICENSE tab (3rd tab), NOT the Adverts or Templates tab.**

## Step-by-Step Visual Guide

### Step 1: Open AdReply
```
1. Go to Facebook.com
2. Click the AdReply icon in your browser toolbar
3. Side panel opens on the right →
```

### Step 2: Click the LICENSE Tab
```
┌─────────────────────────────────────┐
│  AdReply                            │
├─────────────────────────────────────┤
│ [Adverts] [Templates] [LICENSE] ← CLICK HERE
├─────────────────────────────────────┤
│                                     │
│  ← You should be here               │
│                                     │
└─────────────────────────────────────┘
```

### Step 3: Scroll to the Top
```
The v2.0 features are at the TOP of the License tab:

┌─────────────────────────────────────┐
│ LICENSE TAB                         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI Setup Wizard              │ │ ← NEW!
│ │ [🚀 Run AI Setup Wizard]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Keyword Performance          │ │ ← NEW!
│ │ [📊 View Keyword Dashboard]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🛒 Template Marketplace         │ │ ← NEW!
│ │ [🛒 Open Marketplace]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💰 Affiliate Links              │ │ ← NEW!
│ │ [Input: https://...]            │ │
│ │ [Save] [Clear]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ License Status: Free                │ ← OLD (existing)
│ [Activate Pro License]              │
│                                     │
└─────────────────────────────────────┘
```

## What Each Tab Contains

### Adverts Tab (1st tab)
- Default Promotional URL
- Template Category selector
- Post analysis
- Template suggestions
- **NO v2.0 features here**

### Templates Tab (2nd tab)
- Browse templates by category
- Add/Edit/Delete templates
- Template search
- **NO v2.0 features here**

### License Tab (3rd tab) ← **v2.0 FEATURES ARE HERE**
- **🤖 AI Setup Wizard** (NEW)
- **📊 Keyword Performance** (NEW)
- **🛒 Template Marketplace** (NEW)
- **💰 Affiliate Links** (NEW)
- License activation (existing)
- Pro upgrade (existing)

## Quick Test

Open the browser console (F12) and run:
```javascript
// Switch to License tab
document.querySelector('[data-tab="license"]').click();

// Check if v2.0 buttons exist
console.log('AI Wizard:', !!document.getElementById('runAIWizardBtn'));
console.log('Keyword Perf:', !!document.getElementById('viewKeywordPerformanceBtn'));
console.log('Marketplace:', !!document.getElementById('marketplaceLinkBtn'));
console.log('Affiliate:', !!document.getElementById('saveAffiliateLinkBtn'));
```

All should return `true`.

## If You Still Don't See Them

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Toggle AdReply OFF then ON

2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Clear cached images and files
   - Reload

3. **Reinstall the extension:**
   - Remove AdReply from chrome://extensions/
   - Click "Load unpacked"
   - Select the `adreply/` folder

4. **Verify files exist:**
   ```bash
   ls adreply/ui/sidepanel-modular.html
   ls adreply/ui/onboarding.html
   ls adreply/ui/marketplace.html
   ls adreply/ui/keyword-performance.html
   ```

5. **Check HTML content:**
   ```bash
   grep "AI Setup Wizard" adreply/ui/sidepanel-modular.html
   ```
   Should find the text.

---

**Bottom line:** Click the **LICENSE** tab (3rd tab) and scroll to the top. The 4 new v2.0 sections are right there!
