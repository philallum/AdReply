# Template Categories System Requirements

## Introduction

This specification defines the pivot from an AI-assisted Facebook comment extension to a category-based template system. The system will ship with pre-built template categories containing keyword-activated advertisement templates, removing AI dependencies while providing comprehensive coverage of business niches.

## Glossary

- **Template_System**: The core AdReply browser extension
- **Template_Category**: A business niche grouping (e.g., Automotive, Fitness, Food)
- **Template**: An individual advertisement comment with keywords (no variants)
- **Keyword_Matching**: Algorithm that matches post content to relevant templates
- **User_Interface**: The browser extension sidebar panel
- **Template_Database**: Pre-built collection of 20 categories with 20+ templates each
- **Category_Pack**: Importable template collections for specific niches (e.g., "Mechanics - 50 ads")

## Requirements

### Requirement 1: Remove AI Dependencies

**User Story:** As a user, I want a simple extension without AI complexity, so that I can focus on effective marketing without technical barriers.

#### Acceptance Criteria

1. WHEN the extension loads, THE Template_System SHALL NOT display AI settings or configuration options
2. THE Template_System SHALL remove all AI provider integrations (Gemini, OpenAI)
3. THE Template_System SHALL remove AI-related event handlers and functions
4. THE Template_System SHALL maintain existing core functionality without AI dependencies

### Requirement 2: Pre-built Template Categories

**User Story:** As a business owner, I want access to professionally crafted templates for my industry, so that I can immediately start effective Facebook marketing.

#### Acceptance Criteria

1. THE Template_System SHALL include 20 pre-defined business categories
2. EACH category SHALL contain 20+ unique advertisement templates
3. EACH template SHALL include relevant keywords for automatic matching
4. THE Template_System SHALL load these templates on first installation
5. WHERE a user has no custom templates, THE Template_System SHALL display pre-built templates by default### R
equirement 3: Category Selection Interface

**User Story:** As a user, I want to select my business category, so that the system prioritizes relevant templates for my niche.

#### Acceptance Criteria

1. THE User_Interface SHALL display a category selection dropdown
2. WHEN a user selects a category, THE Template_System SHALL prioritize templates from that category
3. THE Template_System SHALL remember the user's category preference
4. WHERE no category is selected, THE Template_System SHALL use all categories for matching
5. THE User_Interface SHALL allow users to change their selected category at any time

### Requirement 4: Simplified Template Structure (No Variants)

**User Story:** As a user, I want each advertisement to be individually trackable, so that the system can prevent spam effectively and I can import additional template packs.

#### Acceptance Criteria

1. EACH template SHALL be a single, complete advertisement (no variants)
2. THE Template_System SHALL remove existing variant functionality from template creation
3. THE Template_System SHALL treat each template as a unique trackable entity
4. THE Template_System SHALL enable precise usage tracking per template per Facebook group
5. THE Template_Database SHALL support easy import/export of category packs for licensing

### Requirement 5: Enhanced Anti-Spam with Individual Template Tracking

**User Story:** As a user, I want the system to prevent repetitive advertising by tracking each individual template, so that I maintain credibility in Facebook groups.

#### Acceptance Criteria

1. THE Template_System SHALL track usage of each individual template per Facebook group
2. THE Template_System SHALL maintain 24-hour cooldown per template per group
3. WHEN suggesting templates, THE Template_System SHALL exclude recently used templates from the same group
4. THE Template_System SHALL prioritize unused templates from the user's selected category
5. IF all category templates are recently used, THEN THE Template_System SHALL suggest from other categories

### Requirement 6: Maintain Promotional URL Integration

**User Story:** As a user, I want to set my promotional URL once and have it automatically included in all advertisements, so that I can drive traffic to my business consistently.

#### Acceptance Criteria

1. THE Template_System SHALL maintain existing promotional URL input field on the main tab
2. THE Template_System SHALL automatically append the promotional URL to all template suggestions
3. THE Template_System SHALL maintain existing URL validation and storage functionality
4. WHEN no keyword matches are found, THE Template_System SHALL provide default advertisements with the promotional URL
5. THE Template_System SHALL ensure all pre-built templates include placeholder for promotional URL integration##
# Requirement 7: Enhanced Template Management

**User Story:** As a user, I want to manage templates with categories while keeping my existing template creation abilities, so that I can organize and expand my marketing toolkit.

#### Acceptance Criteria

1. THE Template_System SHALL maintain existing template creation functionality (name, keywords, template text)
2. THE Template_System SHALL add category assignment to existing template creation form
3. THE Template_System SHALL allow users to create new custom categories
4. THE Template_System SHALL allow users to assign existing templates to categories
5. WHEN matching keywords, THE Template_System SHALL include both pre-built and custom templates

### Requirement 8: Category Pack Import System

**User Story:** As a user, I want to import additional template packs from the licensing site, so that I can expand my template library for specific niches.

#### Acceptance Criteria

1. THE Template_System SHALL support importing JSON-formatted category packs
2. THE Template_System SHALL validate imported templates for proper structure
3. THE Template_System SHALL merge imported templates with existing database
4. THE Template_System SHALL prevent duplicate templates during import
5. THE User_Interface SHALL provide feedback on successful imports and any conflicts

### Requirement 9: Enhanced User Experience

**User Story:** As a user, I want an improved interface that builds on existing functionality, so that I can efficiently manage and use my expanded template library.

#### Acceptance Criteria

1. THE User_Interface SHALL maintain existing compact template list format (names only)
2. THE Template_System SHALL add category filtering to the template management interface
3. THE User_Interface SHALL maintain existing copy-to-clipboard functionality
4. THE Template_System SHALL enhance existing usage statistics with category-based insights
5. THE User_Interface SHALL maintain existing performance with expanded template database

### Requirement 10: Migration and Compatibility

**User Story:** As an existing user, I want my current templates preserved during the update, so that I don't lose my customizations.

#### Acceptance Criteria

1. THE Template_System SHALL preserve existing user-created templates during updates
2. THE Template_System SHALL convert existing template variants into individual templates
3. WHERE existing templates lack categories, THE Template_System SHALL assign them to "Custom" category
4. THE Template_System SHALL maintain backward compatibility with existing promotional URL settings
5. THE Template_System SHALL provide clear migration notifications to users