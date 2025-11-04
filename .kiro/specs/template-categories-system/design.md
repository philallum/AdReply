# Template Categories System Design

## Overview

This design document outlines the implementation of a category-based template system that removes AI dependencies while providing comprehensive, trackable advertisement templates organized by business niches.

## Architecture

### Core Components

1. **Template Database Manager** - Handles pre-built and custom template storage
2. **Category System** - Manages template organization and user preferences  
3. **Enhanced Keyword Matcher** - Improved matching with category prioritization
4. **Usage Tracker** - Individual template tracking for spam prevention
5. **Import/Export System** - Category pack licensing support
6. **Migration Handler** - Converts existing templates to new structure

### Data Models

#### Template Structure (Simplified)
```javascript
{
  id: "template_001",
  label: "Car Service Offer",
  category: "automotive", 
  keywords: ["car", "service", "repair", "maintenance"],
  template: "Great car! If you need reliable service, we're here to help! {url}",
  isPrebuilt: true,
  createdAt: "2024-01-01T00:00:00Z"
}
```

#### Category Structure
```javascript
{
  id: "automotive",
  name: "Automotive Services", 
  description: "Car repair, maintenance, and automotive services",
  isPrebuilt: true,
  templateCount: 25
}
```

#### Category Pack Structure (For Import)
```javascript
{
  name: "Mechanics Pro Pack",
  version: "1.0",
  category: {
    id: "mechanics",
    name: "Mechanics & Auto Repair",
    description: "Professional automotive repair services"
  },
  templates: [
    // Array of 50+ templates
  ]
}
```

## Components and Interfaces

### 1. Template Database Manager

**Purpose**: Centralized management of all templates with category support

**Key Methods**:
- `loadPrebuiltTemplates()` - Load 20 categories × 20+ templates on first run
- `getTemplatesByCategory(categoryId)` - Retrieve templates for specific category
- `addTemplate(template, categoryId)` - Add new template to category
- `migrateExistingTemplates()` - Convert variant-based templates to individual templates

### 2. Category System

**Purpose**: Manage template categories and user preferences

**Key Methods**:
- `getCategories()` - List all available categories
- `setUserCategory(categoryId)` - Set user's preferred category
- `getUserCategory()` - Get user's current category preference
- `createCustomCategory(name, description)` - Create new category

### 3. Enhanced Keyword Matcher

**Purpose**: Improved template matching with category prioritization and usage awareness

**Key Methods**:
- `matchTemplates(postContent, userCategory, usedTemplates)` - Find best matches
- `scoreTemplate(template, postWords)` - Calculate relevance score
- `filterUnusedTemplates(templates, groupId)` - Remove recently used templates
- `getFallbackTemplates(category)` - Get category-appropriate fallbacks### 
4. Individual Template Usage Tracker

**Purpose**: Track each template usage per Facebook group for spam prevention

**Key Methods**:
- `recordTemplateUsage(templateId, groupId, timestamp)` - Record template use
- `getRecentlyUsedTemplates(groupId, hours=24)` - Get used templates in timeframe
- `isTemplateRecentlyUsed(templateId, groupId)` - Check if template was recently used
- `getUsageStats(categoryId)` - Get category-based usage statistics

### 5. Category Pack Import System

**Purpose**: Support importing licensed template packs

**Key Methods**:
- `importCategoryPack(packData)` - Import JSON category pack
- `validatePackStructure(packData)` - Validate pack format
- `mergePack(pack, existingTemplates)` - Merge without duplicates
- `exportCategoryPack(categoryId)` - Export category for sharing

## User Interface Changes

### 1. Main Tab (Suggestions) - Enhanced
- **Keep**: Promotional URL input field
- **Keep**: Post analysis button
- **Add**: Category selection dropdown
- **Keep**: Template suggestions display
- **Enhance**: Show category name with each suggestion

### 2. Templates Tab - Major Updates
- **Keep**: Compact template list (names only)
- **Add**: Category filter dropdown
- **Modify**: Template creation form (remove variants, add category selection)
- **Add**: Import category pack button
- **Keep**: Edit/Delete functionality per template
- **Add**: Category management section

### 3. Remove AI Settings Tab
- **Remove**: Entire AI settings tab and related functionality
- **Migrate**: Any useful settings to other tabs

## Template Database Design

### Pre-built Categories (20 Categories)

1. **Automotive Services** - Car repair, maintenance, detailing
2. **Fitness & Health** - Gyms, personal training, nutrition
3. **Food & Restaurants** - Restaurants, catering, food delivery
4. **Home Services** - Cleaning, repairs, landscaping
5. **Beauty & Wellness** - Salons, spas, cosmetics
6. **Real Estate** - Property sales, rentals, management
7. **Technology Services** - IT support, web design, software
8. **Education & Training** - Courses, tutoring, workshops
9. **Financial Services** - Insurance, loans, accounting
10. **Legal Services** - Lawyers, consultants, legal advice
11. **Pet Services** - Veterinary, grooming, pet sitting
12. **Event Planning** - Weddings, parties, corporate events
13. **Photography** - Portraits, events, commercial
14. **Crafts & Handmade** - Etsy sellers, artisans, crafters
15. **Construction** - Contractors, builders, renovations
16. **Transportation** - Moving, delivery, ride services
17. **Entertainment** - Musicians, DJs, performers
18. **Retail & E-commerce** - Online stores, boutiques
19. **Professional Services** - Consulting, marketing, design
20. **Healthcare** - Medical, dental, therapy services

### Template Quality Standards

- **Length**: 50-150 characters for optimal Facebook engagement
- **Tone**: Professional but friendly, appropriate for social media
- **Call-to-Action**: Clear next step (visit website, call, message)
- **Personalization**: Include compliment or relevant comment about the post
- **URL Integration**: Template ends with {url} placeholder for promotional URL

## Error Handling

### Template Loading Errors
- Graceful fallback to basic templates if pre-built templates fail to load
- User notification of any import errors with specific details
- Validation of template structure before saving

### Usage Tracking Errors  
- Continue functioning if usage tracking fails (don't block suggestions)
- Log errors for debugging but maintain user experience
- Fallback to basic rotation if advanced tracking unavailable

### Migration Errors
- Preserve original templates if migration fails
- Provide manual migration options for complex cases
- Clear user communication about migration status

## Testing Strategy

### Unit Tests
- Template matching algorithm accuracy
- Category filtering functionality  
- Usage tracking per template per group
- Import/export validation

### Integration Tests
- End-to-end template suggestion flow
- Category pack import process
- Migration from existing template structure
- Cross-browser compatibility

### Performance Tests
- Load time with 400+ templates
- Search/filter performance with large template database
- Memory usage with expanded template storage