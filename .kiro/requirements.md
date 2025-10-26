# Requirements Document

## Introduction

AdReply is a Chrome extension that assists small business owners, creators, and marketers in advertising effectively within Facebook Groups. The system provides contextually relevant advertisement-style comment suggestions based on viewed posts, enabling natural promotion without automation or spam. The extension operates entirely locally to ensure privacy, speed, and compliance with Facebook's terms of service.

## Glossary

- **AdReply_System**: The Chrome extension application that provides Facebook comment advertising assistance
- **Template_Library**: Local storage containing user-created advertisement comment templates
- **Comment_Suggestion**: AI or keyword-based recommendation for relevant advertisement comments
- **Template_Rotation**: Algorithm preventing repetition of identical comments within the same Facebook group
- **Pro_License**: JWT-based subscription tier enabling advanced features
- **Ad_Pack**: Downloadable JSON files containing pre-made advertisement templates for specific niches
- **Context_Detection**: Process of analyzing Facebook post content to match relevant templates
- **License_Validation**: Monthly verification process ensuring active subscription status

## Requirements

### Requirement 1

**User Story:** As a small business owner, I want to receive contextually relevant comment suggestions when viewing Facebook posts, so that I can advertise my services naturally without appearing spammy.

#### Acceptance Criteria

1. WHEN a Facebook post is loaded in the browser, THE AdReply_System SHALL analyze the visible post text for keywords and topics
2. THE AdReply_System SHALL match detected keywords against the Template_Library and rank templates by relevance score
3. THE AdReply_System SHALL display the top 3 ranked Comment_Suggestions in the sidebar interface
4. WHEN a user selects a Comment_Suggestion, THE AdReply_System SHALL insert the formatted text into Facebook's comment input field
5. THE AdReply_System SHALL log the selected template to prevent immediate repetition within the same Facebook group

### Requirement 2

**User Story:** As a marketer, I want to create and manage advertisement templates with variants, so that I can maintain a diverse library of promotional messages for different contexts.

#### Acceptance Criteria

1. THE AdReply_System SHALL provide an interface for creating new advertisement templates with labels, keywords, and content
2. THE AdReply_System SHALL support multiple template variants to enable message rotation
3. THE AdReply_System SHALL allow categorization of templates by vertical or niche
4. WHERE the user has a Free_License, THE AdReply_System SHALL limit template storage to 10 templates maximum
5. WHERE the user has a Pro_License, THE AdReply_System SHALL allow unlimited template storage

### Requirement 3

**User Story:** As a Facebook group advertiser, I want the system to prevent me from posting identical comments repeatedly in the same group, so that I avoid being flagged as spam.

#### Acceptance Criteria

1. THE AdReply_System SHALL track the last used template and variant index for each Facebook group
2. WHEN generating Comment_Suggestions, THE AdReply_System SHALL exclude the previously used template for that specific group
3. THE AdReply_System SHALL rotate to the next variant within a template when the same template is selected again
4. THE AdReply_System SHALL store Template_Rotation data locally in IndexedDB
5. THE AdReply_System SHALL maintain rotation history per Facebook group identifier

### Requirement 4

**User Story:** As a privacy-conscious user, I want all my data stored locally without cloud synchronization, so that my advertising strategies and templates remain private.

#### Acceptance Criteria

1. THE AdReply_System SHALL store all template data exclusively in browser IndexedDB
2. THE AdReply_System SHALL store user settings and license information in chrome.storage.local
3. THE AdReply_System SHALL operate without requiring server connections for core functionality
4. THE AdReply_System SHALL process all Context_Detection operations locally within the browser
5. WHERE AI features are enabled, THE AdReply_System SHALL send requests directly to user-provided API endpoints without intermediary servers

### Requirement 5

**User Story:** As a Pro subscriber, I want AI-powered features to enhance my templates and improve matching accuracy, so that I can create more effective advertisements.

#### Acceptance Criteria

1. WHERE the user has a Pro_License and configured AI settings, THE AdReply_System SHALL provide template rephrasing functionality
2. WHERE the user has a Pro_License and configured AI settings, THE AdReply_System SHALL generate new templates from niche descriptions
3. THE AdReply_System SHALL support both Gemini API and OpenAI API integration using user-provided keys
4. THE AdReply_System SHALL enhance template ranking using AI-based intent detection when AI is enabled
5. WHERE the user has a Free_License, THE AdReply_System SHALL disable all AI-powered features

### Requirement 6

**User Story:** As a paying customer, I want a secure licensing system that validates my subscription, so that I can access Pro features while ensuring the developer receives fair compensation.

#### Acceptance Criteria

1. THE AdReply_System SHALL verify Pro_License tokens locally using JWT signature validation
2. THE AdReply_System SHALL perform monthly License_Validation checks with the teamhandso.me API
3. WHERE License_Validation fails, THE AdReply_System SHALL provide a 7-day grace period before downgrading features
4. WHERE a license is revoked or expired, THE AdReply_System SHALL immediately restrict access to Pro features
5. THE AdReply_System SHALL display license status and provide manual verification options in the settings interface

### Requirement 7

**User Story:** As a niche marketer, I want to import and export Ad_Packs, so that I can quickly start advertising with pre-made templates and backup my custom templates for disaster recovery.

#### Acceptance Criteria

1. WHERE the user has a Pro_License, THE AdReply_System SHALL provide Ad_Pack import functionality
2. THE AdReply_System SHALL parse and validate JSON-formatted Ad_Pack files
3. THE AdReply_System SHALL merge imported templates into the existing Template_Library without duplication
4. THE AdReply_System SHALL preserve existing template categories when importing Ad_Packs
5. THE AdReply_System SHALL provide feedback on successful imports and any validation errors
6. THE AdReply_System SHALL allow users to export their Template_Library as downloadable JSON files
7. THE AdReply_System SHALL include all template data, categories, and metadata in exported Ad_Pack files
8. THE AdReply_System SHALL enable selective export of templates by category or individual selection

### Requirement 8

**User Story:** As a Facebook user, I want the extension to integrate seamlessly with Facebook's interface, so that I can use it without disrupting my normal browsing experience.

#### Acceptance Criteria

1. THE AdReply_System SHALL display as a fixed right-hand sidebar that remains visible during Facebook navigation
2. THE AdReply_System SHALL inject content scripts only on Facebook group pages
3. THE AdReply_System SHALL request minimal Chrome permissions: storage, activeTab, scripting, and unlimitedStorage
4. THE AdReply_System SHALL maintain interface responsiveness during Context_Detection and template matching
5. WHEN inserting comments, THE AdReply_System SHALL preserve Facebook's native comment formatting and functionality