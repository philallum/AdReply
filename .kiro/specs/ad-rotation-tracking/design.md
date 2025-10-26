# Ad Rotation Tracking Design Document

## Overview

This design implements a comprehensive ad variation usage tracking system that prevents repetitive advertising within Facebook groups. The system tracks when users click on ad variations, stores usage data locally, and filters recommendations to exclude recently used variations within 24-hour periods per group.

## Architecture

The ad rotation tracking system extends the existing AdReply architecture with new components for:

1. **Usage Event Tracking** - Capturing when users select ad variations
2. **Local Storage Management** - Persisting usage data with automatic cleanup
3. **Recommendation Filtering** - Excluding recently used variations from suggestions
4. **Rotation Logic** - Intelligent fallback when all variations are recently used

## Components and Interfaces

### 1. Usage Tracker Component

**Location**: `UsageTracker` class in new `scripts/usage-tracker.js`

**Purpose**: Track and manage ad variation usage events

**Implementation**:
```javascript
class UsageTracker {
  constructor(storageManager)
  
  // Core tracking methods
  async recordUsage(templateId, variantIndex, groupId, timestamp)
  async getGroupUsage(groupId, hoursBack = 24)
  async isVariationRecentlyUsed(templateId, variantIndex, groupId, hoursBack = 24)
  
  // Cleanup and maintenance
  async cleanupOldUsage(daysBack = 30)
  async clearGroupUsage(groupId)
  async exportUsageData()
}
```

### 2. Recommendation Filter Component

**Location**: Enhanced `TemplateEngine` in existing `scripts/template-engine.js`

**Purpose**: Filter recommendations based on usage history

**Implementation**:
- Modify existing `matchTemplates()` to check usage history
- Add `filterRecentlyUsed()` method for 24-hour exclusion
- Enhance ranking algorithm to prefer unused variations
- Implement intelligent fallback for fully-used templates

### 3. Click Event Handler Component

**Location**: Enhanced sidebar UI in `ui/sidepanel-safe.js`

**Purpose**: Capture ad variation selection events

**Implementation**:
- Add click event listeners to suggestion buttons
- Extract template and variant information from UI elements
- Trigger usage recording before comment insertion
- Provide user feedback on usage tracking

### 4. Storage Schema Component

**Location**: Enhanced `StorageManager` in existing storage system

**Purpose**: Persist usage data with efficient querying

**Data Structure**:
```javascript
// Usage tracking storage schema
{
  "usage_tracking": {
    "facebook.com/groups/123456": [
      {
        "templateId": "garage_offer_01",
        "variantIndex": 0,
        "timestamp": "2024-01-20T16:30:00Z",
        "postContent": "exhaust system upgrade...", // First 100 chars for context
        "usageId": "uuid-v4-string"
      }
    ]
  }
}
```

## Data Models

### Usage Record Model
```javascript
{
  templateId: string,           // Template identifier
  variantIndex: number,         // Which variant was used (0 = main template)
  groupId: string,             // Facebook group identifier
  timestamp: string,           // ISO timestamp of usage
  postContent: string,         // First 100 chars of post for context
  usageId: string,            // Unique identifier for this usage
  metadata: {
    postUrl?: string,          // Facebook post URL if available
    userAgent?: string,        // Browser info for debugging
    extensionVersion?: string  // Extension version for compatibility
  }
}
```

### Group Usage Summary Model
```javascript
{
  groupId: string,
  groupName?: string,
  totalUsages: number,
  recentUsages: number,        // Within last 24 hours
  lastUsedAt: string,         // ISO timestamp
  usedTemplates: {
    [templateId]: {
      lastUsed: string,        // ISO timestamp
      variantUsage: number[],  // Usage count per variant
      totalUsage: number
    }
  }
}
```

### Filtered Recommendations Model
```javascript
{
  available: TemplateMatch[],     // Unused variations matching keywords
  recentlyUsed: TemplateMatch[],  // Used within 24h, with usage timestamps
  fallback: TemplateMatch[],      // Oldest used variations as backup
  exclusionReason: {
    [templateId]: {
      variantIndex: number,
      lastUsed: string,
      hoursRemaining: number
    }
  }
}
```

## Implementation Details

### 1. Usage Event Capture

**Trigger Points**:
- User clicks suggestion button in sidebar
- User manually inserts comment via extension
- Template selection from dropdown/list

**Data Collection**:
```javascript
async function recordAdUsage(templateId, variantIndex) {
  const currentGroup = await getCurrentFacebookGroup();
  const postContent = getCurrentPostContent();
  
  const usageRecord = {
    templateId,
    variantIndex,
    groupId: currentGroup.id,
    timestamp: new Date().toISOString(),
    postContent: postContent.substring(0, 100),
    usageId: generateUUID(),
    metadata: {
      postUrl: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100),
      extensionVersion: chrome.runtime.getManifest().version
    }
  };
  
  await usageTracker.recordUsage(usageRecord);
}
```

### 2. Recommendation Filtering Logic

**24-Hour Exclusion Algorithm**:
```javascript
function filterRecentlyUsed(templates, groupUsage) {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return templates.filter(template => {
    const recentUsage = groupUsage.find(usage => 
      usage.templateId === template.id &&
      usage.variantIndex === template.selectedVariant &&
      new Date(usage.timestamp) > cutoffTime
    );
    
    return !recentUsage;
  });
}
```

**Intelligent Fallback**:
```javascript
function getFallbackRecommendations(templates, groupUsage) {
  // If all variations are recently used, return oldest used ones
  const templatesWithUsage = templates.map(template => {
    const usage = groupUsage
      .filter(u => u.templateId === template.id && u.variantIndex === template.selectedVariant)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
    
    return { ...template, lastUsed: usage?.timestamp };
  });
  
  return templatesWithUsage
    .sort((a, b) => (a.lastUsed || '1970-01-01') < (b.lastUsed || '1970-01-01') ? -1 : 1)
    .slice(0, 3);
}
```

### 3. Storage Optimization

**Efficient Querying**:
- Index usage records by groupId for fast group-specific queries
- Use timestamp-based filtering for 24-hour lookups
- Implement batch operations for cleanup and export

**Automatic Cleanup**:
```javascript
async function performMaintenanceCleanup() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Remove old usage records
  await usageTracker.cleanupOldUsage(30);
  
  // Compact storage if needed
  await storageManager.compactUsageData();
}
```

## Error Handling

### Usage Tracking Failures
- **Storage quota exceeded**: Trigger automatic cleanup and retry
- **Invalid group detection**: Use fallback group identifier from URL
- **Timestamp issues**: Use client-side timestamp with timezone info

### Recommendation Filtering Failures
- **Corrupted usage data**: Skip filtering and proceed with normal recommendations
- **Performance issues**: Implement timeout for usage queries (2 seconds max)
- **Missing template data**: Log error and exclude problematic templates

### Data Consistency Issues
- **Duplicate usage records**: Implement deduplication based on usageId
- **Clock skew**: Use relative time comparisons where possible
- **Storage corruption**: Implement data validation and recovery

## Testing Strategy

### Unit Testing
- Test usage recording with various template and group combinations
- Verify 24-hour exclusion logic with different timestamp scenarios
- Test cleanup functionality with large datasets
- Validate recommendation filtering accuracy

### Integration Testing
- Test complete flow from ad selection to usage recording
- Verify cross-session persistence of usage data
- Test performance with realistic usage volumes (1000+ records)
- Validate Facebook group detection accuracy

### Performance Testing
- Measure recommendation filtering speed with large usage histories
- Test storage operations under quota pressure
- Benchmark cleanup operations with 30+ days of data
- Monitor memory usage during extended sessions

## Privacy and Security

### Data Minimization
- Store only essential usage information
- Limit post content to first 100 characters
- Exclude personally identifiable information from metadata

### Local Storage Only
- No transmission of usage data to external servers
- All processing performed client-side
- User controls for data export and deletion

### Data Retention
- Automatic cleanup after 30 days
- User-initiated cleanup options
- Clear data on extension uninstall (where possible)