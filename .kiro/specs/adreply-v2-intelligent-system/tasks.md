# Implementation Plan

- [x] 1. Set up v2.0 storage schema and data models
  - Create extended Settings model with businessDescription, companyUrl, aiProvider, aiKeyEncrypted, onboardingCompleted, and affiliateLinks fields
  - Create KeywordStats model with keyword, categoryId, matches, chosen, ignored, score, and lastUpdated fields
  - Create AdPack model with id, name, niche, version, categories, and metadata fields
  - Create BackupDataV2 model extending v1 backup with keywordStats, affiliateLinks, adPackMetadata, and onboardingData
  - Update manifest.json to add clipboardWrite permission and host_permissions for Gemini and OpenAI APIs
  - _Requirements: 6.3, 9.2, 9.3, 9.4_

- [x] 2. Implement AI Client module for multi-provider support
  - Create /scripts/ai-client.js with AIClient base class
  - Implement GeminiProvider class with API endpoint integration and prompt building
  - Implement OpenAIProvider class with API endpoint integration and prompt building
  - Create prompt template requiring 400-600 character templates with 4+ sentences
  - Implement response parsing and validation logic
  - Implement error handling for network errors, authentication failures, rate limiting, and invalid responses
  - Add template length validation (minimum 400 characters, 4 sentences)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8_


- [x] 3. Build AI Setup Wizard onboarding system
  - Create /ui/onboarding.html with responsive wizard interface and step indicators
  - Create /ui/modules/onboarding-wizard.js with OnboardingWizard class
  - Implement business description input screen with 50-500 character validation
  - Implement company URL input screen for default promotion URL
  - Implement AI provider selection screen with Gemini and OpenAI options
  - Implement API key input screen with password field and validation
  - Implement generation progress indicator with loading states
  - Implement review screen showing generated categories, templates, and character counts
  - Implement merge/replace decision screen for existing users
  - Add skip option for manual setup
  - Integrate with AIClient to generate setup data
  - Save generated data to StorageManager (categories, templates, settings)
  - Add "Re-run AI Wizard" button to settings page
  - _Requirements: 1.1, 1.6, 1.7, 8.1, 8.2, 8.3, 8.4_

- [x] 4. Implement Keyword Learning Engine
  - Create /scripts/keyword-learning.js with KeywordLearningEngine class
  - Implement recordMatch method to track when templates are shown
  - Implement recordSelection method to track when user selects a template
  - Implement recordIgnore method with 10-second timeout detection
  - Implement calculateScores method using chosen/matches formula
  - Implement getSuggestedRemovals method with 0.1 threshold and 20 minimum matches
  - Implement getPerformanceReport method for dashboard data
  - Store keyword statistics in chrome.storage.local with categoryId grouping
  - Integrate with PostAnalyzer.analyzePost to record matches
  - Integrate with template selection events to record choices
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 5. Create keyword performance dashboard
  - Create /ui/modules/keyword-performance.js with performance dashboard UI
  - Implement table view displaying keyword, category, matches, chosen, ignored, and score
  - Implement sorting by score, matches, or category
  - Add visual indicators (green/yellow/red) for score ranges
  - Add "Learning" badge for keywords with fewer than 10 matches
  - Implement manual remove and adjust actions for keywords
  - Add link to dashboard from settings page
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Build Template Marketplace system
  - Create /scripts/pack-manager.js with AdPackManager class
  - Implement createPack method to package categories into Ad Pack format
  - Implement validatePack method to check Ad Pack structure and data integrity
  - Implement importPack method with merge strategy support
  - Implement exportPack method to create downloadable JSON files
  - Create /ui/marketplace.html with grid/list view of available packs
  - Create /ui/modules/marketplace.js with TemplateMarketplace class
  - Implement fetchIndex method to retrieve pack list from CDN
  - Implement displayPacks method with search and filter by niche
  - Implement previewPack method showing pack details and template samples in modal
  - Implement importPack UI with progress indicator
  - Add export current setup button
  - Add local pack file upload option
  - Add marketplace link to settings page and side panel
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 7. Implement Post Publisher for Facebook posts
  - Create /scripts/post-publisher.js with PostPublisher class
  - Implement copyToClipboard method using Clipboard API
  - Implement findComposer method with Facebook composer selectors
  - Implement fillComposer method with React-compatible input handling
  - Implement showTooltip method for user guidance
  - Create /ui/modules/post-publisher-ui.js for UI integration
  - Add "Post as Content" button to template cards in side panel
  - Add "Post as Content" button to template editor
  - Implement success toast notification on clipboard copy
  - Implement tooltip display when composer is found
  - Update /scripts/content-minimal.js to handle POST_AS_CONTENT messages
  - Add composer location and filling logic to content script
  - Implement error handling for composer not found and clipboard denied scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Build Affiliate Link System
  - Create /scripts/affiliate-link-manager.js with AffiliateLinkManager class
  - Implement setDefaultLink method with URL validation
  - Implement setCategoryLink method for category-specific overrides
  - Implement getLink method to retrieve appropriate link (category or default)
  - Implement renderTemplate method to replace {{link}} placeholders
  - Add logic to remove {{link}} placeholder lines when no link is configured
  - Add logic to append companyUrl to all rendered templates
  - Add "Affiliate Links" section to settings page with default link input
  - Add category-specific affiliate link override fields to category editor
  - Implement URL validation with visual feedback
  - Add template preview showing rendered output with links
  - Update template rendering throughout the app to use AffiliateLinkManager
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 9. Implement storage migration and backward compatibility
  - Create detectStorageVersion function to identify v0 (fresh), v1, or v2 installations
  - Create migrateToV2 function to add v2 fields with defaults for v1 users
  - Set onboardingCompleted to true for existing v1 users to skip wizard
  - Set onboardingCompleted to false for fresh installs to trigger wizard
  - Preserve all existing IndexedDB data during migration
  - Preserve all existing chrome.storage.local settings during migration
  - Add migration trigger on extension startup
  - Test migration path from v1 to v2 with existing user data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Extend backup and restore system for v2 data
  - Update BackupDataV2 model in /adreply/ui/backup.js
  - Extend exportData function to include keywordStats from chrome.storage.local
  - Extend exportData function to include affiliateLinks configuration
  - Extend exportData function to include adPackMetadata
  - Extend exportData function to include onboardingData (businessDescription, aiProvider, completedAt)
  - Update importData function to restore all v2 data structures
  - Implement backup file validation to check for v2 structure
  - Add error handling for corrupted or incompatible backup files
  - Test backup/restore with v2 data to ensure no data loss
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 11. Integrate onboarding wizard with extension lifecycle
  - Update extension icon click handler to open onboarding wizard on first install
  - Update extension icon click handler to open side panel for existing users
  - Add onboarding wizard trigger in chrome.runtime.onInstalled listener
  - Ensure wizard is skipped for users upgrading from v1
  - Add "Re-run AI Wizard" option in settings page
  - Test first-time install flow end-to-end
  - Test upgrade from v1 flow end-to-end
  - _Requirements: 1.1, 6.5, 8.1_


- [x] 12. Implement API key encryption and security
  - Create encryptAPIKey function using Web Crypto API with AES-GCM
  - Create decryptAPIKey function for secure key retrieval
  - Use extension ID as key derivation material with PBKDF2
  - Implement "Clear API Key" button in settings
  - Ensure API keys are never logged or sent to non-AI-provider servers
  - Clear API keys from memory after use
  - Test encryption/decryption round-trip
  - _Requirements: 1.5, 8.5_

- [x] 13. Add UI polish and user experience improvements
  - Add tooltips and help text throughout onboarding wizard
  - Add character count indicators in template editor and review screens
  - Add loading states and progress indicators for all async operations
  - Add success/error toast notifications for user actions
  - Implement responsive design for all new UI components
  - Add keyboard shortcuts for common actions (optional)
  - Ensure accessibility compliance (ARIA labels, keyboard navigation)
  - Test UI on different screen sizes and resolutions
  - _Requirements: 1.1, 7.1, 8.1_

- [x] 14. Create comprehensive test suite
- [x] 14.1 Write unit tests for AI Client module
  - Mock API responses for Gemini and OpenAI providers
  - Test prompt generation with various business descriptions
  - Test response parsing and validation
  - Test error handling for network, authentication, rate limiting, and invalid response scenarios
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8_

- [x] 14.2 Write unit tests for Keyword Learning Engine
  - Test score calculation with various match/chosen/ignored combinations
  - Test removal suggestions with different thresholds
  - Test data persistence and retrieval
  - Test orphan cleanup for deleted categories/templates
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 14.3 Write unit tests for Ad Pack Manager
  - Test pack validation with valid and invalid structures
  - Test merge strategies (merge vs replace)
  - Test export functionality
  - Test format migration from older versions
  - _Requirements: 3.4, 3.5_

- [x] 14.4 Write integration tests for onboarding flow
  - Test complete wizard flow from start to finish
  - Test skip and manual setup option
  - Test merge vs replace with existing data
  - Test error recovery and retry logic
  - _Requirements: 1.1, 1.6, 1.7, 8.2, 8.3, 8.4_

- [x] 14.5 Write integration tests for keyword learning
  - Simulate user interactions (matches, selections, ignores)
  - Verify score updates in real-time
  - Test performance dashboard data accuracy
  - Verify removal suggestions appear correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 14.6 Write integration tests for marketplace
  - Test pack browsing and filtering
  - Test pack import with merge strategy
  - Test pack export
  - Test local file upload
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 14.7 Write integration tests for post publisher
  - Test clipboard copy functionality
  - Test composer detection with mocked Facebook DOM
  - Test React input handling
  - Test error messages for various failure scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 14.8 Write integration tests for affiliate link system
  - Test default link configuration
  - Test category-specific overrides
  - Test {{link}} placeholder replacement
  - Test missing link graceful handling
  - Test companyUrl appending to all templates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 14.9 Write integration tests for backup/restore
  - Test backup includes all v2 data structures
  - Test restore preserves all v2 data
  - Test migration from v1 backup format
  - Test validation catches corrupted files
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 15. Perform end-to-end manual testing
  - Test first-time installation and onboarding wizard with Gemini API
  - Test first-time installation and onboarding wizard with OpenAI API
  - Test upgrade from v1 with existing data preservation
  - Test keyword learning through actual usage patterns
  - Test marketplace pack import and export
  - Test post publisher on live Facebook page
  - Test affiliate link rendering in templates
  - Test backup and restore with v2 data
  - Test all error scenarios and recovery paths
  - Test on different browsers (Chrome, Edge, Brave)
  - _Requirements: All requirements_

- [x] 16. Create documentation and user guides
  - Update README.md with v2.0 features overview
  - Create onboarding wizard user guide
  - Create keyword learning explanation document
  - Create marketplace usage guide
  - Create post publisher instructions
  - Create affiliate link setup guide
  - Update developer documentation with new architecture
  - Create migration guide for v1 users
  - Document API key security practices
  - _Requirements: All requirements_

- [ ] 17. Prepare for release
  - Update manifest.json version to 2.0.0
  - Create release notes documenting all new features
  - Create changelog with breaking changes (if any)
  - Prepare Chrome Web Store listing updates
  - Create promotional screenshots and videos
  - Test extension packaging and installation
  - Perform final security audit
  - Create rollback plan in case of issues
  - _Requirements: All requirements_
