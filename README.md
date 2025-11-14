# AdReply - Intelligent Facebook Advertising Assistant

AdReply is a Chrome extension that helps small business owners, creators, and marketers advertise effectively within Facebook Groups and Pages. The extension uses AI-powered onboarding, intelligent keyword learning, and community-driven template sharing to make advertising effortless and effective.

## 🎯 Key Features

### 🤖 AI-Powered Onboarding (NEW in v2.0)
- **Zero-Configuration Setup**: Describe your business once and let AI generate your entire advertising system
- **Multi-Provider Support**: Choose between Google Gemini or OpenAI for content generation
- **Instant Template Creation**: Get 3-5 categories with 50+ professionally crafted templates in minutes
- **Smart Keyword Generation**: AI automatically identifies relevant keywords for your niche
- **Re-run Anytime**: Regenerate your setup with a new business description whenever you pivot

### 🧠 Intelligent Keyword Learning (NEW in v2.0)
- **Behavioral Tracking**: System learns which keywords lead to successful template selections
- **Automatic Optimization**: Keywords that don't perform are automatically flagged for removal
- **Performance Dashboard**: Visual insights into keyword effectiveness with scores and statistics
- **Continuous Improvement**: Your advertising gets smarter with every interaction

### 🌐 Template Marketplace (NEW in v2.0)
- **Community-Driven Packs**: Browse and import pre-built template collections from other users
- **Niche-Specific Content**: Find templates tailored to your industry (real estate, fitness, retail, etc.)
- **One-Click Import**: Merge new templates with your existing setup seamlessly
- **Share Your Success**: Export your best-performing templates as Ad Packs for others

### 📢 Post Publisher (NEW in v2.0)
- **Beyond Comments**: Convert templates into full Facebook posts for greater visibility
- **One-Click Publishing**: Copy to clipboard and auto-fill Facebook composer
- **React-Compatible**: Works seamlessly with Facebook's modern UI
- **Smart Detection**: Automatically locates and fills the post composer

### 💰 Affiliate Link System (NEW in v2.0)
- **Automated Monetization**: Inject affiliate links into templates automatically
- **Category-Specific Links**: Override default links for specific categories
- **Template Placeholders**: Use {{link}} in templates for dynamic link insertion
- **Graceful Fallback**: Missing links are handled elegantly without breaking templates

### Core Functionality
- **Smart Post Analysis**: Automatically analyzes Facebook posts and matches them with relevant ad templates
- **Keyword-Based Matching**: Uses positive and negative keywords to find the most appropriate templates
- **Template Rotation**: Prevents repetitive advertising by tracking template usage (24-hour cooldown)
- **One-Click Insertion**: Copy suggested ads directly to your clipboard
- **URL Integration**: Each template can include a promotional URL that's automatically inserted

### Template Management
- **AI-Generated Templates**: Get professionally crafted templates from AI (400-600 characters each)
- **400+ Prebuilt Templates**: Organized across 20 industry categories
- **Custom Templates**: Create unlimited custom templates (Pro) or up to 10 (Free)
- **Category Organization**: Organize templates into custom categories
- **Template Editor**: Full CRUD operations with keyword and URL management
- **Import/Export**: Backup and restore your custom templates with full v2.0 data

### License Tiers
- **Free Tier**: 10 custom templates, 1 custom category, access to all prebuilt templates, AI onboarding
- **Pro Tier**: Unlimited templates, unlimited categories, all premium features, advanced analytics

## 📁 Project Structure

```
adreply/
├── manifest.json                    # Chrome Extension Manifest V3
├── scripts/
│   ├── ai-client.js                # NEW: Multi-provider AI integration (Gemini/OpenAI)
│   ├── keyword-learning.js         # NEW: Behavioral keyword optimization
│   ├── pack-manager.js             # NEW: Ad Pack import/export
│   ├── post-publisher.js           # NEW: Facebook post publishing
│   ├── affiliate-link-manager.js   # NEW: Affiliate link injection
│   ├── background-safe.js          # Service worker (license, storage management)
│   ├── content-minimal.js          # Facebook page integration
│   ├── license-manager.js          # JWT-based license verification
│   ├── usage-tracker.js            # Template usage tracking
│   └── template-engine.js          # Template processing and variable replacement
├── storage/
│   ├── storage-manager.js          # Unified storage interface
│   ├── storage-migration-v2.js     # NEW: v1 to v2 migration
│   ├── indexeddb-manager.js        # IndexedDB operations
│   ├── chrome-storage-manager.js   # Chrome storage operations
│   ├── data-models.js              # Data validation models
│   ├── template-loader.js          # Prebuilt template loading
│   └── category-manager.js         # Category management
├── ui/
│   ├── onboarding.html             # NEW: AI Setup Wizard
│   ├── marketplace.html            # NEW: Template Marketplace
│   ├── keyword-performance.html    # NEW: Keyword Analytics Dashboard
│   ├── sidepanel-modular.html      # Main UI
│   ├── sidepanel-modular.js        # UI controller
│   ├── backup.html                 # Backup/Restore UI
│   ├── styles.css                  # Styling
│   └── modules/
│       ├── onboarding-wizard.js    # NEW: AI onboarding flow
│       ├── marketplace.js          # NEW: Template marketplace UI
│       ├── keyword-performance.js  # NEW: Keyword analytics UI
│       ├── post-publisher-ui.js    # NEW: Post publishing UI integration
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

### Version 2.0.0 (Current)
**Major Features:**
- 🤖 AI-Powered Onboarding with Gemini and OpenAI support
- 🧠 Intelligent Keyword Learning Engine with behavioral tracking
- 🌐 Template Marketplace for community-driven content sharing
- 📢 Post Publisher for converting templates to Facebook posts
- 💰 Affiliate Link System with category-specific overrides
- 📦 Enhanced backup/restore with full v2.0 data support
- 🔐 API key encryption using Web Crypto API
- 🔄 Seamless migration from v1.x with data preservation

**Technical Improvements:**
- Extended storage schema for v2.0 features
- Multi-provider AI client architecture
- Behavioral analytics and performance tracking
- Ad Pack format for template sharing
- React-compatible Facebook UI integration

### Version 1.0.0
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

## 📚 Documentation

### User Guides
- **[Onboarding Wizard Guide](docs/ONBOARDING_WIZARD_GUIDE.md)**: Get started with AI-powered setup
- **[Keyword Learning Guide](docs/KEYWORD_LEARNING_GUIDE.md)**: Understand how the system learns and optimizes
- **[Marketplace Guide](docs/MARKETPLACE_GUIDE.md)**: Browse and import template packs
- **[Post Publisher Guide](docs/POST_PUBLISHER_GUIDE.md)**: Convert templates to Facebook posts
- **[Affiliate Links Guide](docs/AFFILIATE_LINKS_GUIDE.md)**: Set up monetization links
- **[Migration Guide](docs/MIGRATION_GUIDE.md)**: Upgrade from v1.x to v2.0

### Technical Documentation
- **[Developer Guide](docs/developer-guide.md)**: Architecture and development setup
- **[API Key Security](docs/API_KEY_SECURITY.md)**: Security practices and encryption
- **[Browser Extension JWT Integration](docs/browser-extension-jwt-integration.md)**: License system specification
- **[Storage System](STORAGE_SYSTEM.md)**: Data persistence architecture