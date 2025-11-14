# Keyword Learning Engine Implementation

## Overview
The Keyword Learning Engine has been successfully implemented as part of AdReply v2.0. This system tracks user behavior and optimizes keyword relevance through behavioral analytics.

## Files Created/Modified

### New Files
1. **adreply/scripts/keyword-learning.js** - Core learning engine implementation
2. **adreply/test-keyword-learning.html** - Test suite for the learning engine

### Modified Files
1. **adreply/ui/modules/post-analysis.js** - Integrated learning engine with post analysis
2. **adreply/ui/sidepanel-modular.js** - Added learning engine initialization and selection tracking
3. **adreply/ui/sidepanel-modular.html** - Added keyword-learning.js script reference

## Implementation Details

### KeywordLearningEngine Class
Located in `adreply/scripts/keyword-learning.js`

#### Core Methods Implemented:

1. **recordMatch(postContent, matchedTemplates, keywords)**
   - Tracks when templates are shown to the user
   - Increments match counter for each keyword
   - Stores data organized by category

2. **recordSelection(templateId, keywords, categoryId)**
   - Tracks when user selects a template
   - Increments chosen counter for keywords
   - Recalculates keyword scores automatically

3. **recordIgnore(templateId, keywords, categoryId)**
   - Tracks when user ignores a suggestion (10-second timeout)
   - Increments ignored counter for keywords
   - Updates scores to reflect poor performance

4. **calculateScores()**
   - Recalculates scores for all keywords
   - Formula: score = chosen / matches
   - Returns updated statistics

5. **getSuggestedRemovals(threshold, minMatches)**
   - Identifies underperforming keywords
   - Default threshold: 0.1 (10% selection rate)
   - Default minimum matches: 20
   - Returns sorted list of removal suggestions

6. **getPerformanceReport()**
   - Generates comprehensive dashboard data
   - Includes per-category and overall statistics
   - Categorizes keywords as: learning, performing, underperforming, normal

#### Data Management Methods:

7. **getKeywordStats()** - Retrieves statistics from chrome.storage.local
8. **saveKeywordStats(stats)** - Persists statistics to storage
9. **cleanupOrphanedStats(validCategoryIds)** - Removes stats for deleted categories
10. **resetKeywordStats(categoryId, keyword)** - Resets specific keyword stats
11. **removeKeywordStats(categoryId, keyword)** - Removes specific keyword stats
12. **exportStats()** - Exports statistics for backup
13. **importStats(exportedData, merge)** - Imports statistics from backup

### Storage Schema

Keywords statistics are stored in `chrome.storage.local` under the key `keywordStats`:

```javascript
{
  "categoryId": {
    "keyword": {
      keyword: "keyword",
      categoryId: "categoryId",
      matches: 0,      // Times keyword contributed to a match
      chosen: 0,       // Times user selected template with this keyword
      ignored: 0,      // Times user ignored suggestion with this keyword
      score: 0.0,      // chosen / matches
      lastUpdated: "ISO timestamp"
    }
  }
}
```

## Integration Points

### 1. PostAnalyzer Integration
- Added `keywordLearningEngine` parameter to constructor
- Added `currentMatches` array to store matches
- Added `ignoreTimers` Map to track 10-second timeouts
- Integrated `recordMatch()` in `generateSuggestions()`
- Added `recordTemplateSelection()` method
- Added `startIgnoreTimer()` method with 10-second timeout
- Added `cancelIgnoreTimer()` method
- Added `clearAllIgnoreTimers()` method

### 2. AdReplySidePanel Integration
- Added `keywordLearningEngine` property
- Added `initializeKeywordLearning()` method
- Passed learning engine to PostAnalyzer constructor
- Integrated selection recording in `handleCopyClick()`
- Added `startIgnoreTimersForSuggestions()` helper method
- Integrated ignore timers in `refreshData()` and `analyzeCurrentPost()`

### 3. UI Integration
- Ignore timers start automatically when suggestions are displayed
- Timers are cleared when user selects a template
- Selection is recorded when user clicks "Copy to Clipboard"
- All tracking happens silently in the background

## Usage Flow

### Automatic Learning Flow:
1. User views a Facebook post
2. System matches templates and records match event
3. System displays suggestions and starts 10-second ignore timers
4. If user clicks a suggestion:
   - Selection is recorded
   - Ignore timer is cancelled
   - Keyword scores increase
5. If user ignores (10 seconds pass):
   - Ignore is recorded
   - Keyword scores decrease

### Performance Monitoring:
- Keywords with < 10 matches: "Learning" status
- Keywords with score >= 0.5: "Performing" status
- Keywords with score < 0.1 and >= 20 matches: "Underperforming" status
- System suggests removal of underperforming keywords

## Testing

A comprehensive test suite is available at `adreply/test-keyword-learning.html`:

### Test Categories:
1. **Basic Functionality Tests**
   - Record Match
   - Record Selection
   - Record Ignore
   - Calculate Scores

2. **Performance Report Tests**
   - Generate Performance Report
   - Get Suggested Removals

3. **Data Management Tests**
   - Cleanup Orphaned Stats
   - Reset Keyword
   - Remove Keyword
   - Export/Import

4. **Integration Simulation**
   - Complete User Flow Simulation
   - Clear All Test Data

### Running Tests:
1. Load the extension in Chrome
2. Open `chrome-extension://[extension-id]/test-keyword-learning.html`
3. Click test buttons to verify functionality
4. Check console for detailed logs

## Requirements Satisfied

✅ **Requirement 2.1**: Record match events when templates are shown
✅ **Requirement 2.2**: Record selection events when user chooses a template
✅ **Requirement 2.3**: Record ignore events with 10-second timeout
✅ **Requirement 2.4**: Calculate scores using chosen/matches formula
✅ **Requirement 2.5**: Suggest removal for keywords with score < 0.1 after 20+ matches

## Next Steps

The following tasks remain for complete keyword learning integration:

1. **Task 5**: Create keyword performance dashboard UI
   - Display keyword statistics in a table
   - Add sorting and filtering
   - Add visual indicators for performance
   - Add manual adjustment controls

2. **Integration with Template Manager**
   - Add keyword performance indicators to template editor
   - Show suggested removals in template management UI
   - Add bulk keyword management tools

3. **Backup/Restore Integration**
   - Extend backup system to include keyword statistics
   - Add migration support for v1 to v2 upgrades

## Notes

- All learning happens client-side with no external data transmission
- Statistics are stored locally in chrome.storage.local
- Negative keywords (prefixed with '-') are excluded from learning
- System gracefully handles missing or invalid data
- Performance impact is minimal due to batched updates
- Compatible with existing template rotation and usage tracking systems
