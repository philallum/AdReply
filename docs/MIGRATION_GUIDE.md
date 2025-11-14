# AdReply v2.0 - Migration Guide for v1.x Users

## Overview

Upgrading from AdReply v1.x to v2.0 is designed to be seamless. Your existing templates, categories, settings, and usage history are automatically preserved. This guide explains what changes, what stays the same, and how to take advantage of new features.

## What's New in v2.0

### Major New Features
1. **AI-Powered Onboarding**: Generate complete setup from business description
2. **Keyword Learning Engine**: System learns which keywords work best
3. **Template Marketplace**: Import/export template packs
4. **Post Publisher**: Convert templates to Facebook posts
5. **Affiliate Link System**: Automated link injection with `{{link}}` placeholder
6. **Enhanced Backup/Restore**: Includes all v2.0 data

### What Stays the Same
- All your existing templates
- All your categories
- Your license key and tier
- Usage tracking and rotation
- Template editor functionality
- Post analysis and matching
- All prebuilt templates

## Automatic Migration Process

### What Happens During Upgrade

When you update to v2.0, the extension automatically:

1. **Detects Your Version**: Identifies you as a v1.x user
2. **Preserves All Data**: Keeps all templates, categories, settings
3. **Adds New Fields**: Extends storage schema with v2.0 fields
4. **Sets Defaults**: Configures new features with safe defaults
5. **Skips Onboarding**: Doesn't show AI wizard (you can run it later)
6. **Completes Silently**: No user action required


### Migration Details

**Storage Changes:**
```javascript
// New fields added to chrome.storage.local
{
  keywordStats: {},              // Keyword learning data
  affiliateLinks: {              // Affiliate link configuration
    default: "",
    categoryOverrides: {}
  }
}

// New fields added to settings
{
  businessDescription: "",       // For AI wizard
  aiProvider: "gemini",         // AI provider choice
  aiKeyEncrypted: "",           // Encrypted API key
  onboardingCompleted: true     // Set to true for v1 users
}
```

**What Gets Preserved:**
- ✅ All templates in IndexedDB
- ✅ All categories in IndexedDB
- ✅ All settings in chrome.storage.local
- ✅ License data and activation
- ✅ Usage history and rotation data
- ✅ Custom category configurations
- ✅ Company URL setting

**What Gets Added:**
- ➕ Keyword statistics tracking (starts empty)
- ➕ Affiliate link configuration (starts empty)
- ➕ AI provider settings (defaults to Gemini)
- ➕ Onboarding completion flag (set to true)

### No Data Loss Guarantee

The migration is designed to be 100% safe:
- No templates are deleted
- No categories are removed
- No settings are overwritten
- All existing functionality continues to work
- You can roll back if needed (see below)


## Step-by-Step Upgrade Process

### Before Upgrading

**Recommended Steps:**

1. **Create a Backup**
   - Open AdReply v1.x
   - Go to Backup tab
   - Click "Export Data"
   - Save the backup file somewhere safe

2. **Note Your Settings**
   - License key
   - Company URL
   - Preferred categories
   - Any custom configurations

3. **Check Chrome Version**
   - Ensure you're on Chrome 88+ (or compatible browser)
   - Update browser if needed

### During Upgrade

**Option 1: Automatic Update (Chrome Web Store)**
1. Chrome automatically updates extensions
2. Wait for update notification
3. Click "Update" or restart browser
4. AdReply v2.0 is now installed

**Option 2: Manual Update (Developer Mode)**
1. Download AdReply v2.0 package
2. Go to `chrome://extensions/`
3. Remove old version (after backing up!)
4. Click "Load unpacked"
5. Select v2.0 directory
6. Extension is now updated

### After Upgrading

**First Launch:**
1. Click AdReply icon
2. Side panel opens (same as v1.x)
3. All your templates are there
4. All features work as before
5. New features available in Settings

**Verify Migration:**
- ✓ Check Templates tab - all templates present
- ✓ Check categories - all categories present
- ✓ Check Settings - license still active
- ✓ Test template suggestion - works as before
- ✓ Check usage history - rotation still working


## Exploring New Features

### 1. Try the AI Wizard (Optional)

Even though you have existing templates, you can use AI to generate more:

**Steps:**
1. Go to Settings tab
2. Find "AI Setup" section
3. Click "Re-run AI Wizard"
4. Follow the wizard steps
5. Choose "Merge" to keep existing templates
6. New AI-generated templates are added

**When to Use:**
- Expanding into a new niche
- Need fresh template ideas
- Want to supplement existing templates
- Pivoting business focus

### 2. Set Up Affiliate Links

Add monetization to your templates:

**Steps:**
1. Go to Settings → Affiliate Links
2. Enter your default affiliate link
3. (Optional) Add category-specific overrides
4. Edit templates to add `{{link}}` placeholder
5. Links are automatically inserted

**See:** [Affiliate Links Guide](AFFILIATE_LINKS_GUIDE.md)

### 3. Start Using Post Publisher

Convert templates to Facebook posts:

**Steps:**
1. Open any template
2. Click "Post as Content" button
3. Text copies to clipboard
4. Navigate to Facebook Group
5. Paste into post composer
6. Review and post

**See:** [Post Publisher Guide](POST_PUBLISHER_GUIDE.md)

### 4. Monitor Keyword Performance

Let the system learn which keywords work:

**Steps:**
1. Use AdReply normally for 2-4 weeks
2. Go to Settings → View Keyword Performance
3. Review keyword scores
4. Remove low-performing keywords
5. System gets smarter over time

**See:** [Keyword Learning Guide](KEYWORD_LEARNING_GUIDE.md)

### 5. Explore the Marketplace

Import templates from the community:

**Steps:**
1. Go to Settings → Browse Marketplace
2. Browse available Ad Packs
3. Preview packs before importing
4. Import with "Merge" strategy
5. New templates added to your library

**See:** [Marketplace Guide](MARKETPLACE_GUIDE.md)


## Backup and Restore with v2.0

### Creating v2.0 Backups

The backup system now includes all v2.0 data:

**What's Included:**
- All templates and categories (v1.x data)
- Keyword learning statistics (NEW)
- Affiliate link configuration (NEW)
- AI provider settings (NEW)
- Onboarding data (NEW)
- Ad Pack metadata (NEW)

**How to Backup:**
1. Go to Backup tab
2. Click "Export Data"
3. File downloads with timestamp
4. Store safely (cloud storage recommended)

### Restoring from Backups

**Restoring v2.0 Backup:**
- All v2.0 data is restored
- Keyword statistics preserved
- Affiliate links restored
- AI settings restored

**Restoring v1.x Backup:**
- Templates and categories restored
- v2.0 fields set to defaults
- No keyword statistics (starts fresh)
- No affiliate links (configure manually)
- Works seamlessly - no errors

### Backup Compatibility

| Backup Version | Restore in v2.0 | Result |
|----------------|-----------------|--------|
| v1.x backup | ✅ Yes | Templates restored, v2.0 features start fresh |
| v2.0 backup | ✅ Yes | Full restoration including all v2.0 data |
| v2.0 backup | ⚠️ Partial | If restored in v1.x, v2.0 data is ignored |


## Troubleshooting Migration Issues

### "Templates Missing After Update"
**Unlikely but possible causes:**
- Browser cleared extension data
- Corrupted storage
- Wrong extension installed

**Solutions:**
1. Check if you're looking at the right extension
2. Restore from backup (you made one, right?)
3. Check browser console for errors
4. Contact support with error details

### "License Not Working"
**Possible causes:**
- License needs re-verification
- Network issue during migration

**Solutions:**
1. Go to Settings → License
2. Click "Verify License"
3. If that fails, re-enter license key
4. Check internet connection
5. Contact support if issue persists

### "Settings Reset to Defaults"
**Cause:** Rare storage corruption during update

**Solution:**
1. Restore from v1.x backup
2. Reconfigure settings manually
3. Check if company URL is preserved
4. Re-enter license if needed

### "New Features Not Appearing"
**Possible causes:**
- Browser cache
- Extension not fully updated
- Wrong version installed

**Solutions:**
1. Check version: Settings → About (should say v2.0.0)
2. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Restart browser
4. Reinstall extension if needed

### "Performance Issues After Update"
**Possible causes:**
- Keyword learning tracking overhead
- Large template library
- Browser resource constraints

**Solutions:**
1. Restart browser
2. Clear browser cache
3. Disable keyword learning if not needed
4. Check browser console for errors


## Rolling Back to v1.x (If Needed)

If you encounter critical issues with v2.0:

### Rollback Process

**Prerequisites:**
- Have v1.x backup file
- Have v1.x extension package (if manual install)

**Steps:**
1. **Backup v2.0 Data First**
   - Export current data
   - Save backup file

2. **Uninstall v2.0**
   - Go to `chrome://extensions/`
   - Find AdReply v2.0
   - Click "Remove"
   - Confirm removal

3. **Install v1.x**
   - Load v1.x from Chrome Web Store (if available)
   - Or load unpacked v1.x directory
   - Extension installs fresh

4. **Restore v1.x Backup**
   - Open AdReply v1.x
   - Go to Backup tab
   - Click "Import Data"
   - Select your v1.x backup file
   - Data is restored

**What You Lose:**
- Keyword learning statistics
- Affiliate link configuration
- AI-generated templates (if not in backup)
- v2.0 features

**What You Keep:**
- All templates from v1.x backup
- All categories from v1.x backup
- License activation
- Settings from v1.x backup

### When to Roll Back

Consider rolling back if:
- Critical bugs prevent normal use
- Performance is unacceptable
- Data corruption occurred
- You prefer v1.x simplicity

**Note:** Most issues can be resolved without rolling back. Contact support first.


## Best Practices for v1.x Users

### Gradual Adoption

You don't need to use all v2.0 features immediately:

**Week 1: Get Comfortable**
- Use AdReply as you did in v1.x
- Verify everything works
- Explore new UI elements
- Read documentation

**Week 2: Try One Feature**
- Start with Post Publisher (easiest)
- Or set up affiliate links
- Get comfortable with one new feature

**Week 3: Add Another Feature**
- Try the marketplace
- Import a relevant Ad Pack
- Merge with existing templates

**Week 4: Enable Learning**
- Let keyword learning run in background
- Check dashboard after 2 weeks
- Make data-driven optimizations

**Month 2: AI Wizard (Optional)**
- Run AI wizard to generate new templates
- Choose "Merge" to keep existing ones
- Expand into new niches

### Optimization Strategy

**For Existing Templates:**
1. Add `{{link}}` placeholders where appropriate
2. Configure affiliate links in Settings
3. Test templates with Post Publisher
4. Monitor keyword performance
5. Remove low-performing keywords

**For New Templates:**
1. Use AI wizard to generate ideas
2. Edit AI templates to match your voice
3. Add to existing categories or create new ones
4. Include `{{link}}` placeholders from the start
5. Test and iterate


## FAQ for v1.x Users

**Q: Will my templates be deleted?**
A: No, all templates are preserved during migration.

**Q: Do I need to re-enter my license key?**
A: No, your license is automatically preserved.

**Q: Will the AI wizard overwrite my templates?**
A: Only if you choose "Replace". Choose "Merge" to keep existing templates.

**Q: Can I skip the new features?**
A: Yes, all new features are optional. Use what you want.

**Q: Will v2.0 slow down my browser?**
A: No, performance is similar to v1.x. Keyword learning has minimal overhead.

**Q: Do I need an AI API key?**
A: Only if you want to use the AI wizard. All other features work without it.

**Q: Can I export my v1.x templates before upgrading?**
A: Yes, and you should! Create a backup before upgrading.

**Q: What if I don't like v2.0?**
A: You can roll back to v1.x using your backup (see above).

**Q: Will my usage history be preserved?**
A: Yes, template rotation and usage tracking continue working.

**Q: Do I need to reconfigure settings?**
A: No, all settings are preserved. New settings have safe defaults.

**Q: Can I use v2.0 without internet?**
A: Yes, except for AI wizard and marketplace (which require internet).

**Q: Will this affect my Facebook account?**
A: No, AdReply doesn't interact with your Facebook account differently in v2.0.

**Q: How long does migration take?**
A: Instant - happens automatically when you update.

**Q: Can I migrate back and forth?**
A: Yes, but you'll lose v2.0-specific data when going back to v1.x.

**Q: Is there a migration deadline?**
A: No, upgrade whenever you're ready. v1.x will continue working.

---

## Getting Help

### Support Resources
- **Documentation**: Read all v2.0 guides in `/docs/` folder
- **FAQ**: Check individual feature guides for specific questions
- **Community**: Join AdReply user community (if available)
- **Support**: Contact support@adreply.com for migration issues

### Reporting Issues
If you encounter problems:
1. Check browser console for errors (F12)
2. Note exact steps to reproduce
3. Include your browser version
4. Mention you're migrating from v1.x
5. Attach error screenshots if possible

### Success Stories
Share your migration experience:
- What worked well
- What was confusing
- Which new features you love
- Suggestions for improvement

---

**Welcome to AdReply v2.0!** Your advertising just got smarter, easier, and more effective.
