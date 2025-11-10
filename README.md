# AdReply - Facebook Group Advertising Assistant

AdReply is a Chrome extension that helps small business owners, creators, and marketers advertise effectively within Facebook Groups. The extension analyzes Facebook posts and suggests contextually relevant advertisement templates based on keyword matching, with intelligent rotation to prevent spam.

## 🎯 Key Features

### Core Functionality
- **Smart Post Analysis**: Automatically analyzes Facebook posts and matches them with relevant ad templates
- **Keyword-Based Matching**: Uses positive and negative keywords to find the most appropriate templates
- **Template Rotation**: Prevents repetitive advertising by tracking template usage (24-hour cooldown)
- **One-Click Insertion**: Copy suggested ads directly to your clipboard
- **URL Integration**: Each template can include a promotional URL that's automatically inserted

### Template Management
- **400+ Prebuilt Templates**: Organized across 20 industry categories
- **Custom Templates**: Create unlimited custom templates (Pro) or up to 10 (Free)
- **Category Organization**: Organize templates into custom categories
- **Template Editor**: Full CRUD operations with keyword and URL management
- **Import/Export**: Backup and restore your custom templates

### License Tiers
- **Free Tier**: 10 custom templates, 1 custom category, access to all prebuilt templates
- **Pro Tier**: Unlimited templates, unlimited categories, all premium features

## 📁 Project Structure

```
adreply/
├── manifest.json                    # Chrome Extension Manifest V3
├── scripts/
│   ├── background-safe.js          # Service worker (license, storage management)
│   ├── content-minimal.js          # Facebook page integration
│   ├── license-manager.js          # JWT-based license verification
│   ├── usage-tracker.js            # Template usage tracking
│   └── template-engine.js          # Template processing and variable replacement
├── storage/
│   ├── storage-manager.js          # Unified storage interface
│   ├── indexeddb-manager.js        # IndexedDB operations
│   ├── chrome-storage-manager.js   # Chrome storage operations
│   ├── data-models.js              # Data validation models
│   ├── template-loader.js          # Prebuilt template loading
│   └── category-manager.js         # Category management
├── ui/
│   ├── sidepanel-modular.html      # Main UI
│   ├── sidepanel-modular.js        # UI controller
│   ├── styles.css                  # Styling
│   └── modules/
│       ├── template-manager.js     # Template CRUD operations
│       ├── post-analysis.js        # Post analysis and matching
│       ├── settings-manager.js     # License and settings
│       ├── ui-manager.js           # UI state management
│       ├── connection.js           # Background script communication
│       └── usage-tracker.js        # Usage tracking UI
├── data/
│   └── templates/                  # Prebuilt template JSON files
│       ├── automotive.json         # 20 automotive templates
│       ├── beauty.json             # 20 beauty templates
│       ├── construction.json       # 20 construction templates
│       └── ... (20 categories total, 400 templates)
└── assets/
    └── icons/                      # Extension icons
```

## 🏗️ Architecture

### Modular Design
The extension uses a modular architecture with clear separation of concerns:

- **UI Layer** (`ui/modules/`): Handles all user interactions and display
- **Storage Layer** (`storage/`): Manages data persistence across IndexedDB and Chrome storage
- **Business Logic** (`scripts/`): Core functionality like template matching and usage tracking
- **Data Layer** (`data/templates/`): JSON-based template storage

### Storage System
- **IndexedDB**: Template data, usage history, group tracking
- **Chrome Storage**: Settings, license data, user preferences
- **Dual Storage**: Seamless migration between storage systems

### Template System
Each template is a JSON object with:
```json
{
  "id": "unique-id",
  "label": "Template Name",
  "category": "industry-category",
  "keywords": ["keyword1", "keyword2", "-negative"],
  "template": "Ad text with {{variables}}",
  "url": "https://promotional-url.com",
  "isPrebuilt": true/false
}
```

## 🚀 Installation

### For Users
1. Download from Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Pin the extension to your toolbar
4. Navigate to any Facebook Group post
5. Click the AdReply icon to open the side panel

### For Developers
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `adreply/` directory
6. The extension is now installed in development mode

## 💻 Development

### Prerequisites
- Chrome Browser (latest version)
- Basic understanding of Chrome Extension APIs
- Knowledge of JavaScript ES6+

### Key Technologies
- **Manifest V3**: Latest Chrome extension standard
- **Service Workers**: Background script execution
- **Side Panel API**: Modern Chrome UI integration
- **IndexedDB**: Client-side database
- **Chrome Storage API**: Settings and license storage

### Testing
1. Load the extension in developer mode
2. Navigate to any Facebook Group
3. Open Chrome DevTools (F12)
4. Check Console for debug logs
5. Test template matching and insertion

### Building Templates
Templates are stored as JSON files in `data/templates/`. Each category file contains 20 templates:

```json
{
  "category": "automotive",
  "templates": [
    {
      "id": "auto-001",
      "label": "Car Repair Service",
      "keywords": ["car", "repair", "mechanic", "-DIY"],
      "template": "Need car repairs? We offer professional service...",
      "url": "https://example.com"
    }
  ]
}
```

## 🔐 License System

### JWT-Based Authentication
- Uses ES256 (ECDSA) asymmetric cryptography
- Token rotation on each verification
- Device fingerprinting for activation tracking
- Secure storage with encryption

### License Verification
- Automatic verification on startup
- Periodic checks (24-hour intervals)
- Offline grace period (7 days)
- Fallback to storage when background script unavailable

### Implementation
See `docs/browser-extension-jwt-integration.md` for complete technical specification.

## 📦 Backup & Restore

### Export Data
- Exports all custom templates
- Includes categories and settings
- JSON format for easy editing
- Timestamp-based filenames

### Import Data
- Supports both export and backup formats
- Validates template structure
- Prevents duplicate imports
- Preserves existing data

### Backup Format
```json
{
  "version": "1.0",
  "timestamp": "2025-11-09T20:47:36.029Z",
  "data": {
    "templates": [...],
    "customCategories": [...],
    "settings": {...}
  }
}
```

## 🎨 UI Components

### Main Views
1. **Advert Tab**: Post analysis and template suggestions
2. **Templates Tab**: Browse and manage templates by category
3. **Settings Tab**: License activation and preferences
4. **Backup Tab**: Import/export functionality

### Template Display
- Category-based navigation
- Search and filter capabilities
- Usage statistics
- Edit/delete operations

### Post Analysis
- Automatic keyword extraction
- Relevance scoring
- Usage history filtering
- Top 3 suggestions

## 📊 Usage Tracking

### Features
- Tracks template usage per Facebook group
- 24-hour cooldown period
- Prevents repetitive advertising
- Usage statistics and history

### Privacy
- All data stored locally
- No external tracking
- No personal information collected
- User has full control over data

## 🔧 Configuration

### Settings
- License key management
- Preferred category selection
- Template rotation preferences
- Usage tracking options

### Storage Keys
- `adreply_license`: License data (encrypted)
- `templates`: User custom templates
- `customCategories`: User categories
- `settings`: User preferences

## 📝 Permissions

The extension requires minimal permissions:
- `storage`: Local data persistence
- `activeTab`: Access current Facebook tab
- `sidePanel`: Display side panel UI
- `scripting`: Inject content scripts into Facebook

## 🐛 Troubleshooting

### Common Issues

**Templates not showing:**
- Check if you're on a Facebook page
- Verify templates are loaded in Templates tab
- Check browser console for errors

**License not activating:**
- Verify internet connection
- Check license key format (JWT token)
- Try direct activation via console (see docs)

**Post analysis not working:**
- Ensure you're on a Facebook Group post
- Check content script is injected
- Verify background script is running

### Debug Mode
Enable debug logging:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for "AdReply:" prefixed logs
4. Check for errors or warnings

## 🤝 Contributing

This is a commercial project. For bug reports or feature requests, please contact support.

## 📄 License

Copyright © 2025 AdReply. All rights reserved.

This software is licensed under a commercial license. See LICENSE file for details.

## 📞 Support

- Documentation: See `docs/` folder
- Technical Spec: `docs/browser-extension-jwt-integration.md`
- User Guide: `docs/user-guide.md`
- Storage System: `STORAGE_SYSTEM.md`

## 🔄 Version History

### Current Version: 1.0.0
- Modular architecture implementation
- JWT-based license system
- 400 prebuilt templates across 20 categories
- Template import/export functionality
- Usage tracking with 24-hour rotation
- Free and Pro tier support
- Backup and restore functionality
- URL integration for templates
- Keyword-based matching with negative keywords
- Category management system

---

**Note**: AI features have been removed from this version. The extension focuses on template-based advertising with smart keyword matching.