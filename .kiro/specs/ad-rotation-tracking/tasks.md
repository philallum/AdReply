# Implementation Plan

- [x] 1. Create usage tracking infrastructure
  - Create UsageTracker class with core tracking methods
  - Implement local storage schema for usage data
  - Add usage record creation and retrieval methods
  - Implement automatic cleanup for old usage records (30+ days)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.2_

- [x] 2. Add click event tracking to sidebar UI
  - Add click event listeners to suggestion buttons in sidebar
  - Extract template ID and variant index from clicked suggestions
  - Integrate usage recording before comment insertion
  - Add visual feedback when usage is recorded
  - _Requirements: 1.1, 1.2_

- [x] 3. Implement 24-hour exclusion filtering
  - Modify template matching to check usage history for current group
  - Add 24-hour exclusion logic for recently used variations
  - Implement intelligent fallback when all variations are recently used
  - Maintain keyword relevance scoring during filtering
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

- [x] 4. Enhance recommendation engine with rotation logic
  - Update generateSuggestions to prioritize unused variations
  - Add rotation through available variations by relevance score
  - Implement fallback to oldest used variations when needed
  - Add usage metadata to recommendation results for debugging
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Add Facebook group detection and tracking
  - Enhance group ID extraction for consistent tracking
  - Add group name detection and storage for better UX
  - Implement group-specific usage history management
  - Handle edge cases for group detection failures
  - _Requirements: 1.3, 2.1, 2.3_

- [x] 6. Create usage management UI
  - Add usage statistics display in sidebar settings
  - Implement manual cleanup options for usage history
  - Add export functionality for usage data
  - Create group-specific usage viewing and management
  - _Requirements: 4.3, 4.4_

- [ ]* 7. Add comprehensive testing for rotation system
  - Write unit tests for usage tracking and filtering logic
  - Test 24-hour exclusion with various timestamp scenarios
  - Verify recommendation filtering accuracy with mock data
  - Test performance with large usage datasets
  - _Requirements: 2.1, 2.2, 3.1, 3.2_