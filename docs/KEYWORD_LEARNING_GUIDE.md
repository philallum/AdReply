# AdReply v2.0 - Keyword Learning Guide

## Overview

The Keyword Learning Engine is AdReply's intelligent system that automatically optimizes which templates are suggested based on your actual usage patterns. Instead of relying solely on predefined keywords, the system learns which keywords lead to successful template selections and which ones don't.

## How It Works

### The Learning Cycle

```
Facebook Post → Keyword Match → Template Suggested → User Action → Learning Update
```

1. **Match Event**: When a Facebook post contains keywords from your templates, AdReply records which keywords triggered the match
2. **User Action**: You either select the template (positive signal) or ignore it (negative signal)
3. **Score Update**: The system updates the effectiveness score for each keyword
4. **Optimization**: Low-performing keywords are flagged for removal

### What Gets Tracked

For every keyword in your templates, the system tracks:
- **Matches**: How many times this keyword contributed to showing a template
- **Chosen**: How many times you selected a template when this keyword matched
- **Ignored**: How many times you ignored a template when this keyword matched
- **Score**: Calculated as `chosen / matches` (0.0 to 1.0)


## Understanding Keyword Scores

### Score Calculation
```
Score = Chosen / Matches
```

**Example:**
- Keyword: "wedding"
- Matches: 50 (shown 50 times)
- Chosen: 35 (selected 35 times)
- Ignored: 15 (ignored 15 times)
- **Score: 0.70 (70% success rate)**

### Score Interpretation

| Score Range | Meaning | Action |
|-------------|---------|--------|
| 0.80 - 1.00 | Excellent | Keep this keyword - it's highly effective |
| 0.50 - 0.79 | Good | Performing well, no action needed |
| 0.30 - 0.49 | Fair | Monitor performance, consider refinement |
| 0.10 - 0.29 | Poor | Consider removing or replacing |
| 0.00 - 0.09 | Very Poor | Remove this keyword |

### Learning Phase
Keywords with fewer than 10 matches are marked as "Learning" because there isn't enough data yet to calculate a reliable score.

**What This Means:**
- New keywords start in learning phase
- System needs 10+ matches to establish a pattern
- Scores become more accurate over time
- Don't remove keywords during learning phase


## Automatic Removal Suggestions

### When Suggestions Appear
The system suggests removing a keyword when:
1. It has at least **20 matches** (sufficient data)
2. Its score is below **0.10** (10% success rate)

### Why Remove Low-Performing Keywords?
- **Reduces Noise**: Fewer irrelevant template suggestions
- **Improves Accuracy**: Templates appear only when truly relevant
- **Saves Time**: Less scrolling through poor matches
- **Better User Experience**: Higher confidence in suggestions

### How to Handle Suggestions
When you see a removal suggestion:

1. **Review the Keyword**: Does it make sense for your business?
2. **Check the Context**: Are you using it in the right templates?
3. **Consider Alternatives**: Could a different keyword work better?
4. **Take Action**: Remove, adjust, or keep monitoring

**Example Scenario:**
- Keyword: "cheap"
- Score: 0.05 (5%)
- Matches: 30
- **Analysis**: People searching for "cheap" aren't your target audience
- **Action**: Remove "cheap" and add "affordable" or "value" instead


## Using the Performance Dashboard

### Accessing the Dashboard
1. Open AdReply side panel
2. Click "Settings" tab
3. Click "View Keyword Performance" link
4. Dashboard opens in a new tab

### Dashboard Features

#### Keyword Table
Displays all your keywords with:
- **Keyword**: The actual keyword text
- **Category**: Which category it belongs to
- **Matches**: Number of times shown
- **Chosen**: Number of times selected
- **Ignored**: Number of times ignored
- **Score**: Effectiveness percentage
- **Status**: Learning, Good, Fair, Poor, or Remove

#### Sorting Options
- **By Score**: See best and worst performers
- **By Matches**: See most frequently matched keywords
- **By Category**: Group keywords by category

#### Visual Indicators
- 🟢 **Green**: Score 0.50+ (Good performance)
- 🟡 **Yellow**: Score 0.30-0.49 (Fair performance)
- 🔴 **Red**: Score below 0.30 (Poor performance)
- 🔵 **Blue Badge**: "Learning" (fewer than 10 matches)

#### Actions
- **Remove**: Delete the keyword from all templates
- **Adjust**: Modify the keyword or move to different templates
- **View Templates**: See which templates use this keyword


## Real-World Examples

### Example 1: Wedding Photography Business

**Initial Keywords:**
- wedding, bride, groom, ceremony, reception, photographer, photos

**After 3 Months:**
| Keyword | Matches | Chosen | Score | Action |
|---------|---------|--------|-------|--------|
| wedding | 120 | 95 | 0.79 | ✅ Keep |
| bride | 85 | 68 | 0.80 | ✅ Keep |
| photographer | 200 | 45 | 0.23 | ⚠️ Too generic, remove |
| ceremony | 40 | 32 | 0.80 | ✅ Keep |
| photos | 180 | 30 | 0.17 | ❌ Remove |

**Insights:**
- "photographer" and "photos" are too generic - they match posts about any type of photography
- "wedding", "bride", and "ceremony" are highly specific and effective
- **Action**: Remove generic keywords, add more specific ones like "engagement", "bridal"

### Example 2: Real Estate Agent

**Initial Keywords:**
- house, home, property, real estate, buy, sell, agent

**After 3 Months:**
| Keyword | Matches | Chosen | Score | Action |
|---------|---------|--------|-------|--------|
| house | 150 | 120 | 0.80 | ✅ Keep |
| home | 140 | 110 | 0.79 | ✅ Keep |
| property | 90 | 70 | 0.78 | ✅ Keep |
| buy | 200 | 60 | 0.30 | ⚠️ Monitor |
| sell | 180 | 55 | 0.31 | ⚠️ Monitor |
| agent | 250 | 40 | 0.16 | ❌ Remove |

**Insights:**
- Nouns (house, home, property) perform better than verbs (buy, sell)
- "agent" is too generic and matches posts about any type of agent
- **Action**: Keep nouns, consider removing "agent", monitor "buy" and "sell"


## Best Practices

### 1. Give Keywords Time to Learn
- Wait for at least 20 matches before making decisions
- Don't remove keywords in the "Learning" phase
- Monitor trends over weeks, not days

### 2. Review Performance Monthly
- Set a recurring reminder to check the dashboard
- Look for patterns in low-performing keywords
- Celebrate high-performing keywords by using them more

### 3. Balance Specificity and Reach
- **Too Specific**: "luxury-waterfront-condo" (rarely matches)
- **Too Generic**: "house" (matches everything)
- **Just Right**: "waterfront", "luxury-home", "condo"

### 4. Use Negative Keywords
Negative keywords (prefixed with `-`) prevent matches:
- `-DIY` (don't show for do-it-yourself posts)
- `-free` (don't show for people seeking free services)
- `-help` (don't show for people asking for advice, not services)

### 5. Test and Iterate
- Try new keywords based on your industry trends
- Remove consistently poor performers
- Add variations of high-performing keywords

### 6. Category-Specific Optimization
Different categories may need different keyword strategies:
- **Broad Categories**: Use more specific keywords
- **Niche Categories**: Can use broader keywords
- **Seasonal Categories**: Update keywords seasonally


## Advanced Strategies

### Keyword Combinations
The system tracks individual keywords, but templates often match multiple keywords:

**Example:**
- Post: "Looking for a wedding photographer in Miami"
- Matched Keywords: "wedding", "photographer", "Miami"
- All three keywords get credit for the match

**Strategy**: Use complementary keywords that work well together

### Seasonal Adjustments
Some keywords perform differently by season:
- "tax" peaks in March-April
- "wedding" peaks in summer
- "holiday" peaks in November-December

**Strategy**: Monitor seasonal patterns and adjust keywords accordingly

### Competitive Keywords
If you're in a competitive niche, generic keywords may have low scores because many businesses respond:

**Example:**
- Post: "Need a plumber"
- 10 plumbers respond
- User ignores most suggestions
- "plumber" gets low score for everyone

**Strategy**: Add differentiating keywords like "emergency", "licensed", "24/7"

### Geographic Keywords
Location-based keywords can be highly effective:
- City names: "Miami", "Austin", "Seattle"
- Neighborhoods: "Downtown", "Westside"
- Regions: "South Florida", "Bay Area"

**Strategy**: Include your service area in keywords for local relevance


## Troubleshooting

### "All My Keywords Have Low Scores"
**Possible Causes:**
- Templates aren't relevant to the posts you're seeing
- Keywords are too generic
- You're in the wrong Facebook Groups
- Templates need better content

**Solutions:**
1. Review your target audience - are you in the right groups?
2. Make keywords more specific to your niche
3. Improve template content to be more engaging
4. Consider re-running the AI wizard with a better business description

### "No Keywords in Learning Phase"
**Cause:** You haven't been using AdReply enough for the system to collect data

**Solution:** Use AdReply regularly for 2-4 weeks to build up statistics

### "Keyword Removed But Still Appearing"
**Cause:** Keyword may be in multiple templates or categories

**Solution:** 
1. Search for the keyword in all templates
2. Remove it from each template manually
3. Or use the dashboard's "Remove from All" action

### "Dashboard Shows No Data"
**Possible Causes:**
- Fresh installation with no usage history
- Data was cleared or corrupted
- Browser storage was reset

**Solutions:**
1. Use AdReply for a few days to generate data
2. Check if backup/restore is needed
3. Verify chrome.storage.local permissions


## Privacy & Data

### What Data is Stored
- Keyword text
- Match count, chosen count, ignored count
- Score calculation
- Last updated timestamp
- Associated category ID

### What is NOT Stored
- Facebook post content
- User personal information
- Which specific posts matched
- Facebook group names or IDs

### Data Location
All keyword statistics are stored locally in:
- `chrome.storage.local` under the `keywordStats` key
- Organized by category ID
- Never sent to external servers

### Data Retention
- Statistics are kept indefinitely
- You can clear all statistics from Settings
- Backup/restore includes keyword statistics
- Uninstalling the extension deletes all data

### Opting Out
If you prefer not to use keyword learning:
1. Ignore the performance dashboard
2. Don't remove suggested keywords
3. The system will continue tracking but won't affect your usage
4. Or clear statistics periodically from Settings

## FAQ

**Q: How long until I see meaningful data?**
A: Typically 2-4 weeks of regular use (20+ template suggestions)

**Q: Can I reset keyword statistics?**
A: Yes, from Settings → Clear Keyword Statistics

**Q: Do statistics affect which templates are shown?**
A: No, statistics only help you identify which keywords to keep or remove

**Q: What happens if I delete a category?**
A: Associated keyword statistics are automatically cleaned up

**Q: Can I export keyword statistics?**
A: Yes, they're included in backup files

**Q: Do keyword scores affect template rotation?**
A: No, rotation is based on usage history, not keyword scores

**Q: Can I manually adjust scores?**
A: No, scores are calculated automatically. You can only remove keywords.

**Q: What if I disagree with a removal suggestion?**
A: You can ignore suggestions - they're recommendations, not requirements

---

**Next Steps**: Learn how to share your best templates with the community in the [Marketplace Guide](MARKETPLACE_GUIDE.md).
