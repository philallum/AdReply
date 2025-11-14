# AdReply v2.0 - Template Marketplace Guide

## Overview

The Template Marketplace is a community-driven platform where AdReply users can share and discover pre-built template collections (Ad Packs). Instead of creating templates from scratch, you can import professionally crafted templates tailored to specific industries and niches.

## What are Ad Packs?

An Ad Pack is a portable collection that includes:
- **Categories**: Organized groups of related templates
- **Templates**: 400-600 character advertising messages
- **Keywords**: Positive and negative keywords for matching
- **Metadata**: Pack name, niche, version, author info

**Example Ad Packs:**
- "Real Estate Agents Pack" - 50 templates for property sales
- "Fitness Coaches Pack" - 40 templates for personal training
- "Wedding Services Pack" - 60 templates for wedding vendors
- "Home Services Pack" - 45 templates for contractors and handymen

## Accessing the Marketplace

### From Side Panel
1. Open AdReply side panel
2. Click "Settings" tab
3. Click "Browse Marketplace" button
4. Marketplace opens in a new tab

### From Settings Page
1. Navigate to AdReply settings
2. Scroll to "Template Marketplace" section
3. Click "Open Marketplace"


## Browsing Ad Packs

### Marketplace Interface

The marketplace displays available packs in a grid or list view:

**Pack Card Information:**
- Pack name and icon
- Niche/industry category
- Number of templates included
- Number of categories
- Version number
- Download count (popularity indicator)
- Brief description

### Search and Filter

**Search by Name:**
- Type keywords in the search box
- Results update in real-time
- Searches pack names and descriptions

**Filter by Niche:**
- Click niche tags to filter
- Available niches: Real Estate, Fitness, Beauty, Automotive, Food, etc.
- Click "All" to clear filters

**Sort Options:**
- Most Popular (highest downloads)
- Newest First
- Most Templates
- Alphabetical


## Previewing Ad Packs

Before importing, you can preview the pack contents:

### Opening Preview
1. Click on any pack card
2. Preview modal opens with detailed information

### Preview Contents

**Pack Information:**
- Full description
- Author (if provided)
- Creation date
- Version number
- Total templates and categories

**Category List:**
- All categories included in the pack
- Number of templates per category
- Keywords for each category

**Template Samples:**
- 3-5 sample templates from the pack
- Full template text (400-600 characters)
- Character count for each template
- Associated keywords

**Actions:**
- Import Pack
- Close Preview
- Report Pack (if inappropriate)


## Importing Ad Packs

### Import Process

1. **Select Pack**: Click "Import" on the pack you want
2. **Choose Strategy**: Decide how to handle existing data
3. **Confirm Import**: Review what will be imported
4. **Wait for Completion**: Progress indicator shows status
5. **Success**: Confirmation message with summary

### Import Strategies

#### Merge with Existing Data (Recommended)
**What Happens:**
- New categories are added alongside your existing ones
- New templates are added to your library
- Your existing templates remain unchanged
- No data is deleted

**Best For:**
- Expanding your template library
- Adding templates for a new niche
- Supplementing AI-generated content
- Keeping all your custom templates

**Example:**
- You have: 3 categories, 30 templates
- Pack has: 2 categories, 20 templates
- After merge: 5 categories, 50 templates

#### Replace Existing Data
**What Happens:**
- All your existing categories are deleted
- All your existing templates are deleted
- Only the pack contents remain
- Settings and keyword statistics are preserved

**Best For:**
- Starting completely fresh
- Switching to a different business niche
- You have no valuable existing templates

**Warning:** This cannot be undone unless you have a backup!


### Import Progress

During import, you'll see:
- Progress bar (0-100%)
- Current step ("Validating pack...", "Importing categories...", "Saving templates...")
- Estimated time remaining
- Cancel button (if needed)

### After Import

**Success Message Shows:**
- Number of categories imported
- Number of templates imported
- Total character count
- Link to view imported templates

**Next Steps:**
1. Click "View Templates" to see your new content
2. Review templates and edit if needed
3. Test templates on Facebook posts
4. Monitor keyword performance


## Exporting Your Templates as Ad Packs

Share your successful templates with the community!

### Creating an Ad Pack

1. **Open Export Interface**
   - Go to Settings → Template Marketplace
   - Click "Export as Ad Pack"

2. **Select Categories**
   - Choose which categories to include
   - Select all or pick specific ones
   - Preview template count

3. **Pack Information**
   - **Name**: Give your pack a descriptive name
   - **Niche**: Choose the industry category
   - **Description**: Explain what's included (50-200 words)
   - **Author**: Your name or "Anonymous" (optional)

4. **Review and Export**
   - Review pack contents
   - Click "Create Pack"
   - JSON file downloads automatically

### Pack File Format

The exported file is a JSON file named:
```
adreply-pack-[name]-[date].json
```

**Example:**
```
adreply-pack-real-estate-agents-2025-11-14.json
```

### What Gets Exported

**Included:**
- All selected categories
- All templates in those categories
- Keywords (positive and negative)
- Category descriptions
- Pack metadata

**NOT Included:**
- Your personal settings
- API keys
- License information
- Keyword learning statistics
- Usage history


## Importing Local Pack Files

You can import Ad Packs from local files (not just the marketplace):

### Use Cases
- Import packs shared by colleagues
- Restore packs you previously exported
- Import packs from other sources
- Test packs before publishing

### Import Process

1. **Open Import Interface**
   - Go to Marketplace
   - Click "Import Local Pack" button

2. **Select File**
   - Click "Choose File"
   - Navigate to your `.json` pack file
   - Select and open

3. **Validation**
   - System validates pack structure
   - Checks for required fields
   - Verifies template format

4. **Choose Strategy**
   - Merge or Replace (same as marketplace imports)
   - Review pack contents
   - Confirm import

5. **Completion**
   - Templates imported to your library
   - Success message with summary

### Pack Validation

The system checks for:
- Valid JSON format
- Required fields (name, niche, categories)
- Template structure (id, label, content, keywords)
- Character counts (400-600 per template)
- Keyword format

**If Validation Fails:**
- Error message explains the issue
- Pack is not imported
- Fix the JSON file and try again


## Best Practices

### Choosing Ad Packs

1. **Match Your Niche**: Choose packs relevant to your business
2. **Check Template Count**: More isn't always better - quality over quantity
3. **Preview First**: Always preview before importing
4. **Read Descriptions**: Understand what's included
5. **Check Version**: Newer versions may have improvements

### After Importing

1. **Review All Templates**: Make sure they match your brand voice
2. **Edit as Needed**: Customize templates to your specific business
3. **Test on Facebook**: Try templates on real posts
4. **Monitor Performance**: Use keyword learning to optimize
5. **Remove Duplicates**: If you imported multiple packs, check for duplicates

### Creating Quality Ad Packs

If you're exporting packs to share:

1. **Test Your Templates**: Only export templates that work well
2. **Write Clear Descriptions**: Help others understand what's included
3. **Use Consistent Formatting**: Keep templates professional
4. **Include Variety**: Different templates for different scenarios
5. **Proper Keywords**: Include relevant positive and negative keywords
6. **Check Character Counts**: Ensure all templates are 400-600 characters
7. **Proofread Everything**: Check for typos and grammar


## Troubleshooting

### "Pack Failed to Import"
**Possible Causes:**
- Invalid JSON format
- Missing required fields
- Corrupted file
- Storage quota exceeded

**Solutions:**
1. Validate JSON using a JSON validator tool
2. Check file wasn't corrupted during download
3. Free up storage space
4. Try importing fewer categories at once

### "Marketplace Won't Load"
**Possible Causes:**
- No internet connection
- CDN is down
- Browser blocking requests

**Solutions:**
1. Check your internet connection
2. Try again later
3. Check browser console for errors
4. Use local pack import as alternative

### "Duplicate Categories After Import"
**Cause:** Pack contains categories with same names as your existing ones

**Solution:**
- Categories are kept separate (different IDs)
- Rename one set of categories to avoid confusion
- Or delete duplicate categories you don't need

### "Templates Not Showing After Import"
**Possible Causes:**
- Import didn't complete
- Templates in wrong category
- Browser cache issue

**Solutions:**
1. Refresh the AdReply side panel
2. Check all categories in Templates tab
3. Verify import success message appeared
4. Try re-importing the pack

### "Can't Export My Templates"
**Possible Causes:**
- No categories selected
- Storage permission issue
- Browser blocking downloads

**Solutions:**
1. Select at least one category
2. Check browser download permissions
3. Try a different browser
4. Check browser console for errors


## Privacy & Security

### Marketplace Data
- Marketplace index is hosted on a CDN
- No personal information is collected
- Download counts are anonymous
- No tracking of which packs you import

### Pack Contents
- Packs contain only template data
- No personal information included
- No API keys or license data
- No usage statistics

### Sharing Packs
When you export a pack:
- Only template content is included
- Your settings are NOT included
- Your API keys are NOT included
- Your license is NOT included
- Your keyword statistics are NOT included

### Local Storage
- Imported packs are stored locally in IndexedDB
- Never sent to external servers
- You have full control over your data
- Can be deleted anytime

## FAQ

**Q: Are marketplace packs free?**
A: Yes, all packs in the marketplace are free to import.

**Q: Can I edit imported templates?**
A: Yes, treat them like any other template - full edit access.

**Q: Will importing affect my existing templates?**
A: Only if you choose "Replace". Choose "Merge" to keep existing templates.

**Q: How do I submit my pack to the marketplace?**
A: Export your pack and contact AdReply support to submit it for review.

**Q: Can I import multiple packs?**
A: Yes, import as many as you want using the "Merge" strategy.

**Q: What if a pack has inappropriate content?**
A: Use the "Report Pack" button in the preview modal.

**Q: Can I update a pack I imported?**
A: Yes, import the newer version using "Merge" strategy.

**Q: Do packs include keyword statistics?**
A: No, you'll build your own statistics as you use the templates.

**Q: Can I share packs privately?**
A: Yes, export and share the JSON file directly with others.

**Q: What's the maximum pack size?**
A: No hard limit, but keep it reasonable (under 100 templates recommended).

---

**Next Steps**: Learn how to publish your templates as Facebook posts in the [Post Publisher Guide](POST_PUBLISHER_GUIDE.md).
