# AdReply Storage System

## Overview
AdReply uses Chrome's local storage API to store all user data locally on the user's device. No data is sent to external servers.

## Storage Structure

### 1. **User Templates** (`templates`)
**Location**: Chrome Local Storage  
**Key**: `templates`  
**Format**: Array of template objects

```javascript
{
  id: "1699123456789",
  label: "Auto Service Offer",
  category: "automotive", 
  keywords: ["car", "service", "repair", "-cheap"],
  template: "Great car! For professional service, visit us at {url}",
  url: "https://mygarage.com",
  createdAt: "2024-11-04T10:30:00.000Z",
  usageCount: 5,
  isPrebuilt: false
}
```

### 2. **Custom Categories** (`customCategories`)
**Location**: Chrome Local Storage  
**Key**: `customCategories`  
**Format**: Array of category objects

```javascript
{
  id: "my-business-category",
  name: "My Business Category",
  description: "Custom category: My Business Category",
  isPrebuilt: false,
  createdAt: "2024-11-04T10:30:00.000Z"
}
```

### 3. **User Settings** (`settings`)
**Location**: Chrome Local Storage  
**Key**: `settings`  
**Format**: Nested settings object

```javascript
{
  templates: {
    preferredCategory: "automotive"
  },
  ui: {
    theme: "light"
  }
}
```

### 4. **Usage Tracking** (`adreply_usage_tracking`)
**Location**: Chrome Local Storage  
**Key**: `adreply_usage_tracking`  
**Format**: Object with group IDs as keys

```javascript
{
  "facebook.com/groups/123456": [
    {
      templateId: "1699123456789",
      groupId: "facebook.com/groups/123456",
      timestamp: "2024-11-04T10:30:00.000Z",
      postContent: "Looking for car service...",
      usageId: "uuid-string",
      metadata: {
        score: 0.85,
        rank: 1,
        confidence: "high"
      }
    }
  ]
}
```

### 5. **Custom Template Packs** (`customTemplatePack_{categoryId}`)
**Location**: Chrome Local Storage  
**Key**: `customTemplatePack_automotive`, `customTemplatePack_fitness`, etc.  
**Format**: Template pack object

```javascript
{
  category: {
    id: "automotive",
    name: "Automotive Services",
    description: "Car repair, maintenance, detailing"
  },
  templates: [
    {
      id: "auto_001",
      label: "Car Service Offer",
      keywords: ["car", "service", "-cheap"],
      template: "Great car! For service, visit {url}",
      isPrebuilt: true
    }
  ],
  customized: true,
  lastModified: "2024-11-04T10:30:00.000Z"
}
```

### 6. **Default Promotional URL** (`defaultPromoUrl`)
**Location**: Chrome Local Storage  
**Key**: `defaultPromoUrl`  
**Format**: String URL

```javascript
"https://mybusiness.com"
```

## Pre-built vs User-Created Content

### **Pre-built Templates**
- **Source**: JSON files in `data/templates/` directory (e.g., `automotive.json`, `fitness.json`)
- **Storage**: Loaded from JSON files, customizations stored in Chrome storage
- **Count**: 400+ templates across 20+ categories
- **Characteristics**: 
  - `isPrebuilt: true`
  - Can be customized by users (stored as custom template packs)
  - Include negative keywords for better targeting
  - Organized by category in separate JSON files

### **User-Created Templates**
- **Source**: User input through template form
- **Storage**: Chrome Local Storage (`templates` key)
- **Characteristics**:
  - `isPrebuilt: false`
  - Can be edited and deleted
  - Support custom categories
  - Individual template tracking (no variants)

### **Categories**
- **Pre-built**: 21 standard business categories (automotive, fitness, etc.)
- **Custom**: User-created categories stored in `customCategories`
- **Combined**: Both types appear in category selectors

## Key Features

### **Individual Template Tracking**
- Each template is tracked separately (no variants)
- 24-hour cooldown per template per Facebook group
- Usage analytics and statistics
- Anti-spam rotation system

### **Category System**
- Users can select preferred business category
- Templates from preferred category get priority in suggestions
- Cross-category fallback when preferred category exhausted
- Custom category creation supported

### **Negative Keywords**
- Keywords prefixed with `-` exclude templates when matched
- Example: `["-cheap", "-diy"]` excludes posts containing those terms
- Case-insensitive and partial matching supported

## Data Privacy & Security

### **Local Storage Only**
- All data stored locally using Chrome's secure storage APIs
- No external servers or data transmission
- User maintains full control over their data

### **Data Persistence**
- Data persists across browser sessions
- Survives extension updates
- Can be manually cleared through Chrome settings

### **Storage Limits**
- Chrome Local Storage: ~10MB limit
- Automatic cleanup of old usage records (30+ days)
- Template count limits for free users (10 templates)

## Migration & Compatibility

### **Legacy Template Migration**
- Old variant-based templates converted to individual templates
- Variants become separate templates with unique IDs
- Original template structure preserved where possible

### **Data Validation**
- All stored data validated before use
- Graceful handling of corrupted or missing data
- Automatic data structure updates during extension updates

## Backup & Export

### **Manual Export**
- Users can export templates and usage data
- JSON format for easy backup and transfer
- Import functionality for restoring data

### **No Automatic Backup**
- Extension doesn't automatically backup data externally
- Users responsible for their own data backup
- Data tied to specific Chrome profile/device

This storage system ensures user privacy while providing robust functionality for template management and usage tracking.