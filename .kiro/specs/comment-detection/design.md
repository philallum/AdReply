# Comment Detection Design Document

## Overview

This design implements comment detection functionality to prevent duplicate ad recommendations for posts where the user has already commented. The solution integrates into the existing `analyzeCurrentPost()` workflow by adding a pre-analysis check that identifies existing user comments.

## Architecture

The comment detection system extends the existing `FacebookSafeIntegration` class in `content-minimal.js` with new methods for:

1. **User Profile Detection** - Identifying the current Facebook user
2. **Comment Scanning** - Finding all comments on the current post
3. **Comment Ownership Verification** - Matching comments to the current user
4. **Analysis Gate** - Blocking recommendations when user comments exist

## Components and Interfaces

### 1. User Profile Detection Component

**Location**: `FacebookSafeIntegration.getCurrentUser()`

**Purpose**: Extract current Facebook user's identifying information

**Implementation**:

- Scan for Facebook's user profile indicators in DOM
- Extract user name, profile link, or unique identifiers
- Cache user information for session duration
- Handle cases where profile info is not immediately available

**Facebook Selectors** (priority order):

```javascript
const userSelectors = [
  '[data-testid="nav_account_switcher"] [role="button"]', // Account switcher
  '[aria-label*="Your profile"] img', // Profile image
  'a[href*="/me/"]', // Profile links
  '[data-testid="blue_bar_profile_link"]', // Top nav profile
  'div[data-testid="nav_account_switcher"] span', // Account name
];
```

### 2. Comment Detection Component

**Location**: `FacebookSafeIntegration.checkForUserComments(postElement)`

**Purpose**: Scan post for existing user comments

**Implementation**:

- Find comment sections within post context
- Extract comment author information
- Compare against current user profile
- Return boolean indicating user participation

**Facebook Comment Selectors**:

```javascript
const commentSelectors = [
  // Regular post comments
  '[role="article"] [data-testid="comment"]',
  '[role="article"] .UFIComment',

  // Overlay/modal comments
  '[role="dialog"] [data-testid="comment"]',
  '[role="dialog"] .UFIComment',

  // Comment author links
  'a[role="link"][href*="/profile/"]',
  'a[role="link"][href*="/user/"]',
];
```

### 3. Analysis Gate Component

**Location**: `FacebookSafeIntegration.analyzeCurrentPost()` (modified)

**Purpose**: Add pre-analysis comment check

**Flow**:

1. Extract post content (existing logic)
2. **NEW**: Check for user comments
3. If user comments found → return skip result
4. If no user comments → proceed with existing analysis

## Data Models

### User Profile Model

```javascript
{
    name: string,           // Display name
    profileUrl: string,     // Profile link
    profileId: string,      // Unique identifier
    avatarUrl: string,      // Profile image URL
    cached: boolean,        // Whether data is cached
    timestamp: number       // Cache timestamp
}
```

### Comment Check Result

```javascript
{
    hasUserComments: boolean,
    commentCount: number,
    userCommentTexts: string[],  // For debugging
    skipReason: string           // Human readable reason
}
```

### Analysis Result (Extended)

```javascript
{
    success: boolean,
    content?: string,
    groupId?: string,
    method?: string,
    skipped?: boolean,        // NEW: Indicates analysis was skipped
    skipReason?: string,      // NEW: Reason for skipping
    userComments?: string[]   // NEW: User's existing comments
}
```

## Error Handling

### Profile Detection Failures

- **Fallback**: Use cached profile from previous sessions
- **Graceful degradation**: Proceed with analysis if profile unavailable
- **Logging**: Record profile detection attempts for debugging

### Comment Detection Failures

- **Conservative approach**: If comment detection fails, proceed with analysis
- **Timeout handling**: Limit comment scanning to 2 seconds max
- **Selector resilience**: Try multiple Facebook comment selectors

### Facebook DOM Changes

- **Selector arrays**: Multiple fallback selectors for each element type
- **Dynamic retry**: Re-attempt detection after DOM mutations
- **Version compatibility**: Handle both old and new Facebook interfaces

## Testing Strategy

### Unit Testing Approach

- Mock Facebook DOM structures for different post types
- Test user profile extraction with various Facebook layouts
- Verify comment detection across feed, group, and overlay contexts
- Test error handling for missing or malformed DOM elements

### Integration Testing

- Test complete flow: profile detection → comment check → analysis gate
- Verify behavior in different Facebook contexts (feed, groups, overlays)
- Test with posts containing various comment configurations
- Validate caching behavior across page navigation

### Manual Testing Scenarios

1. **Baseline**: Post with no user comments → analysis proceeds
2. **Skip case**: Post with user comment → analysis skipped
3. **Mixed comments**: Post with user + other comments → analysis skipped
4. **Profile edge cases**: Test when profile info unavailable
5. **Performance**: Test with posts containing many comments

## Implementation Notes

### Facebook Compatibility

- Use read-only DOM operations to avoid detection
- Implement throttling to prevent excessive DOM queries
- Cache user profile to minimize repeated lookups
- Handle Facebook's dynamic content loading

### Performance Considerations

- Limit comment scanning to visible comments initially
- Use `requestIdleCallback` for non-critical profile caching
- Implement early exit when user comment found
- Cache comment check results per post URL

### Privacy & Security

- Only extract minimal user identification data
- Clear cached profile data on extension disable
- No external transmission of user profile information
- Respect Facebook's content access patterns
