# AdReply v2.0 - Developer Guide

## Overview

AdReply is a Chrome extension built with Manifest V3 that helps users advertise effectively on Facebook. Version 2.0 introduces AI-powered features, behavioral learning, and community-driven content sharing while maintaining the modular architecture from v1.x.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AdReply v2.0 System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Setup     │  │  Keyword     │  │  Template    │      │
│  │ Wizard       │  │  Learning    │  │  Marketplace │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌──────────────┐  ┌──────┴───────┐  ┌──────────────┐      │
│  │ Post         │  │  Storage     │  │  Affiliate   │      │
│  │ Publisher    │  │  Manager     │  │  Link System │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Existing AdReply Core (v1.x)                    │
│  Template Engine │ UI Manager │ Settings │ License Manager  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Manifest Version**: V3 (Chrome Extension)
- **JavaScript**: ES6+ (no build step)
- **Storage**: IndexedDB + Chrome Storage API
- **UI Framework**: Vanilla JavaScript (modular)
- **AI Providers**: Google Gemini, OpenAI
- **Encryption**: Web Crypto API (AES-GCM)


## Project Structure

```
adreply/
├── manifest.json                    # Extension manifest (V3)
│
├── scripts/                         # Core business logic
│   ├── ai-client.js                # NEW: Multi-provider AI integration
│   ├── keyword-learning.js         # NEW: Behavioral analytics
│   ├── pack-manager.js             # NEW: Ad Pack import/export
│   ├── post-publisher.js           # NEW: Facebook post publishing
│   ├── affiliate-link-manager.js   # NEW: Link injection system
│   ├── background-safe.js          # Service worker
│   ├── content-minimal.js          # Content script (Facebook)
│   ├── license-manager.js          # JWT license verification
│   ├── usage-tracker.js            # Template usage tracking
│   ├── template-engine.js          # Template processing
│   └── encryption-utils.js         # Crypto utilities
│
├── storage/                         # Data persistence layer
│   ├── storage-manager.js          # Unified storage interface
│   ├── storage-migration-v2.js     # NEW: v1 to v2 migration
│   ├── indexeddb-manager.js        # IndexedDB operations
│   ├── chrome-storage-manager.js   # Chrome storage operations
│   ├── data-models.js              # Data validation models
│   ├── template-loader.js          # Prebuilt template loading
│   └── category-manager.js         # Category management
│
├── ui/                              # User interface
│   ├── onboarding.html             # NEW: AI Setup Wizard
│   ├── marketplace.html            # NEW: Template Marketplace
│   ├── keyword-performance.html    # NEW: Analytics Dashboard
│   ├── sidepanel-modular.html      # Main UI
│   ├── backup.html                 # Backup/Restore UI
│   ├── styles.css                  # Global styles
│   │
│   └── modules/                    # UI modules (modular architecture)
│       ├── onboarding-wizard.js    # NEW: Onboarding flow
│       ├── marketplace.js          # NEW: Marketplace UI
│       ├── keyword-performance.js  # NEW: Analytics UI
│       ├── post-publisher-ui.js    # NEW: Publishing UI
│       ├── template-manager.js     # Template CRUD
│       ├── post-analysis.js        # Post analysis
│       ├── settings-manager.js     # Settings UI
│       ├── ui-manager.js           # UI state management
│       ├── connection.js           # Background communication
│       └── usage-tracker.js        # Usage tracking UI
│
├── data/                            # Static data
│   └── templates/                  # Prebuilt template JSON files
│       ├── automotive.json
│       ├── beauty.
json
│       └── ... (20 categories, 400 templates)
│
└── assets/                          # Static assets
    └── icons/                      # Extension icons
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

## Core Modules

### 1. AI Client (`/scripts/ai-client.js`)

**Purpose**: Unified interface for multiple AI providers

**Key Classes:**
```javascript
class AIClient {
  constructor(provider, apiKey)
  async generateSetup(businessDescription)
  async testConnection()
  _buildPrompt(businessDescription)
  _parseResponse(rawResponse)
}

class GeminiProvider extends AIClient {
  // Google Gemini API implementation
}

class OpenAIProvider extends AIClient {
  // OpenAI API implementation
}
```

**API Endpoints:**
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- OpenAI: `https://api.openai.com/v1/chat/completions`

**Response Format:**
```javascript
{
  categories: [
    {
      id: "unique-id",
      name: "Category Name",
      description: "Description",
      positiveKeywords: ["keyword1", "keyword2"],
      negativeKeywords: ["-avoid1", "-avoid2"],
      templates: [
        {
          id: "template-id",
          title: "Template Title",
          content: "400-600 character template text...",
          keywords: ["relevant", "keywords"]
        }
      ]
    }
  ]
}
```


### 2. Keyword Learning Engine (`/scripts/keyword-learning.js`)

**Purpose**: Track user behavior and optimize keyword relevance

**Key Methods:**
```javascript
class KeywordLearningEngine {
  async recordMatch(postContent, matchedTemplates, keywords)
  async recordSelection(templateId, keywords, categoryId)
  async recordIgnore(templateId, keywords, categoryId)
  async calculateScores()
  async getSuggestedRemovals(threshold = 0.1, minMatches = 20)
  async getPerformanceReport()
}
```

**Data Model:**
```javascript
{
  keywordStats: {
    "categoryId": {
      "keyword": {
        matches: 0,      // Times shown
        chosen: 0,       // Times selected
        ignored: 0,      // Times ignored
        score: 0.0,      // chosen / matches
        lastUpdated: "ISO timestamp"
      }
    }
  }
}
```

**Score Calculation:**
```javascript
score = chosen / matches
// 0.80-1.00: Excellent
// 0.50-0.79: Good
// 0.30-0.49: Fair
// 0.10-0.29: Poor
// 0.00-0.09: Remove
```

**Integration Points:**
- Hooks into `PostAnalyzer.analyzePost()` for match recording
- Hooks into template selection events for choice recording
- 10-second timeout for ignore detection


### 3. Ad Pack Manager (`/scripts/pack-manager.js`)

**Purpose**: Handle template pack import/export

**Key Methods:**
```javascript
class AdPackManager {
  async createPack(name, niche, categoryIds)
  async validatePack(packData)
  async importPack(packData, mergeStrategy)
  async exportPack(categoryIds)
}
```

**Ad Pack Format:**
```javascript
{
  id: "pack-unique-id",
  name: "Pack Name",
  niche: "niche-slug",
  version: "1.0.0",
  author: "anonymous",
  description: "Pack description",
  createdAt: "ISO timestamp",
  categories: [
    {
      id: "category-id",
      name: "Category Name",
      description: "Description",
      positiveKeywords: [],
      negativeKeywords: [],
      templates: []
    }
  ],
  metadata: {
    totalTemplates: 50,
    totalCategories: 5,
    downloadCount: 0
  }
}
```

**Merge Strategies:**
- `merge`: Add new categories/templates alongside existing
- `replace`: Delete existing and use only pack contents


### 4. Post Publisher (`/scripts/post-publisher.js`)

**Purpose**: Convert templates to Facebook posts

**Key Methods:**
```javascript
class PostPublisher {
  async copyToClipboard(text)
  async findComposer()
  async fillComposer(text)
  async showTooltip(message, element)
  handleReactInput(element, value)
}
```

**Facebook Composer Selectors:**
```javascript
const COMPOSER_SELECTORS = [
  '[role="textbox"][contenteditable="true"]',
  'div[data-contents="true"]',
  '.notranslate._5rpu'
];
```

**React Event Handling:**
```javascript
function setReactValue(element, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 
    'value'
  ).set;
  
  nativeInputValueSetter.call(element, value);
  
  const event = new Event('input', { bubbles: true });
  element.dispatchEvent(event);
}
```

**Workflow:**
1. User clicks "Post as Content"
2. Template copied to clipboard
3. Content script finds Facebook composer
4. Attempts to fill composer (React-compatible)
5. Shows tooltip for user guidance
6. User reviews and posts manually


### 5. Affiliate Link Manager (`/scripts/affiliate-link-manager.js`)

**Purpose**: Inject monetization links into templates

**Key Methods:**
```javascript
class AffiliateLinkManager {
  async setDefaultLink(url)
  async setCategoryLink(categoryId, url)
  async getLink(categoryId)
  renderTemplate(templateText, categoryId)
  validateUrl(url)
}
```

**Template Rendering:**
```javascript
function renderTemplate(templateText, categoryId, settings) {
  let rendered = templateText;
  
  // Get appropriate affiliate link
  const affiliateLink = this.getLink(categoryId);
  
  if (affiliateLink) {
    // Replace {{link}} placeholder
    rendered = rendered.replace(/\{\{link\}\}/g, affiliateLink);
  } else {
    // Remove {{link}} placeholder and its line
    rendered = rendered.replace(/^.*\{\{link\}\}.*$/gm, '').trim();
  }
  
  // Append company URL (existing feature)
  if (settings.companyUrl) {
    rendered = rendered.trim() + '\n\n' + settings.companyUrl;
  }
  
  return rendered;
}
```

**Storage Schema:**
```javascript
{
  companyUrl: "https://mybusiness.com",  // Appended to ALL templates
  affiliateLinks: {
    default: "https://example.com/ref/12345",
    categoryOverrides: {
      "category-id-1": "https://specific-link.com/ref/abc"
    }
  }
}
```


## Storage Architecture

### Dual Storage System

AdReply uses both IndexedDB and Chrome Storage:

**IndexedDB** (via `indexeddb-manager.js`):
- Templates
- Categories
- Usage history
- Group tracking

**Chrome Storage** (via `chrome-storage-manager.js`):
- Settings
- License data
- Keyword statistics (NEW)
- Affiliate links (NEW)
- AI provider settings (NEW)

### Storage Manager (`/storage/storage-manager.js`)

Unified interface for both storage systems:

```javascript
class StorageManager {
  // Template operations
  async saveTemplate(template)
  async getTemplate(id)
  async getAllTemplates()
  async deleteTemplate(id)
  
  // Category operations
  async saveCategory(category)
  async getCategory(id)
  async getAllCategories()
  async deleteCategory(id)
  
  // Settings operations
  async getSettings()
  async saveSettings(settings)
  
  // Keyword statistics (NEW)
  async getKeywordStats()
  async saveKeywordStats(stats)
  
  // Affiliate links (NEW)
  async getAffiliateLinks()
  async saveAffiliateLinks(links)
}
```

### v2.0 Storage Extensions

**New Chrome Storage Keys:**
```javascript
{
  keywordStats: {
    "categoryId": {
      "keyword": { matches, chosen, ignored, score, lastUpdated }
    }
  },
  affiliateLinks: {
    default: "url",
    categoryOverrides: { "categoryId": "url" }
  }
}
```

**New Settings Fields:**
```javascript
{
  businessDescription: "",
  aiProvider: "gemini",
  aiKeyEncrypted: "",
  onboardingCompleted: false
}
```


### Migration System (`/storage/storage-migration-v2.js`)

**Version Detection:**
```javascript
async function detectStorageVersion() {
  const settings = await chrome.storage.local.get('settings');
  
  if (!settings.settings) return 0; // Fresh install
  if (settings.settings.onboardingCompleted !== undefined) return 2; // v2
  return 1; // v1
}
```

**Migration Logic:**
```javascript
async function migrateToV2() {
  const version = await detectStorageVersion();
  
  if (version === 0) {
    // Fresh install - show onboarding
    return { needsOnboarding: true };
  }
  
  if (version === 1) {
    // Existing v1 user - preserve data, add v2 fields
    await chrome.storage.local.set({
      keywordStats: {},
      affiliateLinks: { default: "", categoryOverrides: {} }
    });
    
    const settings = await getSettings();
    settings.businessDescription = "";
    settings.aiProvider = "gemini";
    settings.aiKeyEncrypted = "";
    settings.onboardingCompleted = true; // Skip wizard
    await saveSettings(settings);
    
    return { migrated: true, fromVersion: 1 };
  }
  
  return { upToDate: true };
}
```

**Migration Guarantees:**
- No data loss
- All v1 data preserved
- v2 fields added with safe defaults
- Backward compatible


## Security

### API Key Encryption

**Encryption Strategy** (`/scripts/encryption-utils.js`):
```javascript
async function encryptAPIKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Generate key from extension ID
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chrome.runtime.id),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('adreply-v2'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv)
  };
}
```

**Key Points:**
- AES-GCM 256-bit encryption
- Extension ID as key derivation material
- PBKDF2 with 100,000 iterations
- Random IV for each encryption
- Stored in chrome.storage.local
- Never logged or sent to non-AI servers

### Content Security Policy

**manifest.json:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions

**Required Permissions:**
```json
{
  "permissions": [
    "storage",
    "tabs",
    "sidePanel",
    "scripting",
    "downloads",
    "clipboardWrite"
  ],
  "host_permissions": [
    "https://www.facebook.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://api.openai.com/*"
  ]
}
```


## Development Setup

### Prerequisites

- Chrome Browser (latest version)
- Node.js (for running tests)
- Git
- Text editor (VS Code recommended)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd adreply

# No build step required - pure JavaScript

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select adreply/ directory
```

### Development Workflow

**1. Make Changes:**
- Edit files in `/scripts/`, `/ui/`, or `/storage/`
- No compilation needed

**2. Reload Extension:**
- Go to `chrome://extensions/`
- Click reload icon on AdReply card
- Or use keyboard shortcut (varies by OS)

**3. Test Changes:**
- Open AdReply side panel
- Check browser console (F12)
- Test on Facebook pages
- Verify functionality

**4. Debug:**
- Service Worker: `chrome://extensions/` → "Inspect views: service worker"
- Side Panel: Right-click panel → "Inspect"
- Content Script: F12 on Facebook page → Console
- Background: Check service worker console

### Testing

**Unit Tests** (`/tests/`):
```bash
# Run all tests
node tests/run-tests-node.js

# Run specific test
node tests/ai-client.test.js
```

**Integration Tests:**
```bash
# Open test runner in browser
open tests/test-runner-v2-comprehensive.html
```

**Manual Testing Checklist:**
- [ ] AI wizard generates valid data
- [ ] Keyword learning tracks correctly
- [ ] Marketplace imports/exports work
- [ ] Post publisher copies to clipboard
- [ ] Affiliate links render correctly
- [ ] Migration preserves v1 data
- [ ] Backup/restore includes v2 data


## Modular Architecture

### UI Module Pattern

All UI components follow a consistent pattern:

```javascript
class ModuleName {
  constructor(storageManager, otherDependencies) {
    this.storageManager = storageManager;
    this.initializeEventListeners();
  }
  
  async initialize() {
    // Load data
    // Render UI
  }
  
  initializeEventListeners() {
    // Attach event handlers
  }
  
  async handleAction() {
    // Business logic
    // Update storage
    // Update UI
  }
  
  render() {
    // Update DOM
  }
}
```

### Module Communication

**Background Script Communication:**
```javascript
// From UI module
chrome.runtime.sendMessage({
  action: 'ACTION_NAME',
  data: { ... }
}, (response) => {
  // Handle response
});

// In background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ACTION_NAME') {
    // Handle action
    sendResponse({ success: true, data: ... });
  }
});
```

**Storage Manager Communication:**
```javascript
// All modules use StorageManager
const storageManager = new StorageManager();

// Save data
await storageManager.saveTemplate(template);

// Load data
const templates = await storageManager.getAllTemplates();
```

### Adding New Modules

**1. Create Module File:**
```javascript
// /ui/modules/my-new-module.js
class MyNewModule {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }
  
  async initialize() {
    // Module initialization
  }
}
```

**2. Import in HTML:**
```html
<script src="modules/my-new-module.js"></script>
```

**3. Initialize in Main Script:**
```javascript
const myModule = new MyNewModule(storageManager);
await myModule.initialize();
```


## API Integration

### AI Provider Integration

**Adding a New AI Provider:**

1. **Create Provider Class:**
```javascript
class NewAIProvider extends AIClient {
  constructor(apiKey) {
    super('newprovider', apiKey);
    this.endpoint = 'https://api.newprovider.com/v1/generate';
  }
  
  async generateSetup(businessDescription) {
    const prompt = this._buildPrompt(businessDescription);
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    return this._parseResponse(data);
  }
  
  _parseResponse(rawResponse) {
    // Convert provider's response to AdReply format
    return {
      categories: [...]
    };
  }
}
```

2. **Update AI Client Factory:**
```javascript
function createAIClient(provider, apiKey) {
  switch(provider) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'newprovider':
      return new NewAIProvider(apiKey);
    default:
      throw new Error('Unknown provider');
  }
}
```

3. **Update UI:**
- Add option to provider selection dropdown
- Add API key instructions
- Update documentation


### Marketplace CDN Integration

**Marketplace Index Format:**
```javascript
{
  version: "1.0",
  lastUpdated: "2025-11-14T12:00:00Z",
  packs: [
    {
      id: "pack-id",
      name: "Pack Name",
      niche: "niche-slug",
      version: "1.0.0",
      description: "Description",
      templateCount: 50,
      categoryCount: 5,
      downloadUrl: "https://cdn.example.com/packs/pack-id.json"
    }
  ]
}
```

**Fetching Index:**
```javascript
async function fetchMarketplaceIndex() {
  const CDN_URL = 'https://cdn.example.com/marketplace/index.json';
  
  try {
    const response = await fetch(CDN_URL);
    const index = await response.json();
    return index.packs;
  } catch (error) {
    console.error('Failed to fetch marketplace:', error);
    return [];
  }
}
```

**Caching Strategy:**
```javascript
// Cache for 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

async function getCachedIndex() {
  const cached = await chrome.storage.local.get('marketplaceCache');
  
  if (cached.marketplaceCache) {
    const age = Date.now() - cached.marketplaceCache.timestamp;
    if (age < CACHE_DURATION) {
      return cached.marketplaceCache.data;
    }
  }
  
  // Fetch fresh data
  const data = await fetchMarketplaceIndex();
  
  // Cache it
  await chrome.storage.local.set({
    marketplaceCache: {
      data,
      timestamp: Date.now()
    }
  });
  
  return data;
}
```


## Performance Optimization

### Storage Optimization

**Keyword Statistics Cleanup:**
```javascript
async function cleanupOrphanedStats() {
  const stats = await getKeywordStats();
  const categories = await getAllCategories();
  const categoryIds = new Set(categories.map(c => c.id));
  
  // Remove stats for deleted categories
  for (const categoryId in stats) {
    if (!categoryIds.has(categoryId)) {
      delete stats[categoryId];
    }
  }
  
  await saveKeywordStats(stats);
}
```

**Limit History Size:**
```javascript
const MAX_USAGE_HISTORY = 1000;

async function pruneUsageHistory() {
  const history = await getUsageHistory();
  
  if (history.length > MAX_USAGE_HISTORY) {
    // Keep most recent entries
    const pruned = history.slice(-MAX_USAGE_HISTORY);
    await saveUsageHistory(pruned);
  }
}
```

### Debouncing and Throttling

**Score Calculation Debounce:**
```javascript
let scoreCalculationTimeout;

function debouncedCalculateScores() {
  clearTimeout(scoreCalculationTimeout);
  scoreCalculationTimeout = setTimeout(() => {
    calculateScores();
  }, 5000); // Wait 5 seconds after last update
}
```

**UI Update Throttle:**
```javascript
let lastUpdate = 0;
const UPDATE_INTERVAL = 1000; // 1 second

function throttledUpdateUI() {
  const now = Date.now();
  if (now - lastUpdate > UPDATE_INTERVAL) {
    updateUI();
    lastUpdate = now;
  }
}
```

### Memory Management

**Clear Unused Data:**
```javascript
// Clear API keys from memory after use
async function useAIClient(provider, apiKey) {
  const client = createAIClient(provider, apiKey);
  const result = await client.generateSetup(description);
  
  // Clear sensitive data
  apiKey = null;
  client = null;
  
  return result;
}
```


## Error Handling

### Error Types

**User-Facing Errors:**
```javascript
class UserFacingError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'UserFacingError';
    this.details = details;
    this.userMessage = message;
  }
}
```

**System Errors:**
```javascript
class SystemError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'SystemError';
    this.originalError = originalError;
  }
}
```

### Error Handling Pattern

```javascript
async function performAction() {
  try {
    // Attempt action
    const result = await riskyOperation();
    return { success: true, data: result };
    
  } catch (error) {
    // Log for debugging
    console.error('Action failed:', error);
    
    // Determine error type
    if (error instanceof UserFacingError) {
      // Show to user
      showErrorToast(error.userMessage);
    } else {
      // Generic error message
      showErrorToast('Something went wrong. Please try again.');
    }
    
    // Return error state
    return { success: false, error: error.message };
  }
}
```

### AI Client Error Handling

```javascript
async function generateSetup(businessDescription) {
  try {
    const response = await this.callAPI(businessDescription);
    return this.parseResponse(response);
    
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      throw new UserFacingError(
        'Rate limit reached. Please wait and try again.'
      );
    } else if (error.code === 'AUTH_FAILED') {
      throw new UserFacingError(
        'Invalid API key. Please check your credentials.'
      );
    } else if (error.code === 'NETWORK_ERROR') {
      throw new UserFacingError(
        'Network error. Please check your connection.'
      );
    } else {
      throw new UserFacingError(
        'Generation failed. Please try manual setup.'
      );
    }
  }
}
```


## Debugging

### Console Logging

**Structured Logging:**
```javascript
const Logger = {
  info: (module, message, data = {}) => {
    console.log(`[AdReply:${module}]`, message, data);
  },
  
  error: (module, message, error) => {
    console.error(`[AdReply:${module}]`, message, error);
  },
  
  warn: (module, message, data = {}) => {
    console.warn(`[AdReply:${module}]`, message, data);
  }
};

// Usage
Logger.info('AIClient', 'Generating setup', { provider: 'gemini' });
Logger.error('Storage', 'Failed to save', error);
```

### Chrome DevTools

**Service Worker Debugging:**
1. Go to `chrome://extensions/`
2. Find AdReply
3. Click "Inspect views: service worker"
4. Console opens with service worker context

**Side Panel Debugging:**
1. Open AdReply side panel
2. Right-click anywhere in panel
3. Select "Inspect"
4. DevTools opens for side panel

**Content Script Debugging:**
1. Open Facebook page
2. Press F12 to open DevTools
3. Go to Console tab
4. Content script logs appear here

### Storage Inspection

**View IndexedDB:**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB
4. Select AdReplyDB
5. Browse object stores

**View Chrome Storage:**
```javascript
// In console
chrome.storage.local.get(null, (data) => {
  console.log('All storage:', data);
});

// Specific keys
chrome.storage.local.get(['keywordStats', 'affiliateLinks'], (data) => {
  console.log('Keyword stats:', data.keywordStats);
  console.log('Affiliate links:', data.affiliateLinks);
});
```


## Building and Deployment

### Version Bumping

**Update manifest.json:**
```json
{
  "version": "2.0.0",
  "version_name": "2.0.0 - AI-Powered Intelligence"
}
```

**Update README.md:**
- Add version to changelog
- Document new features
- Update screenshots if needed

### Creating Release Package

```bash
# Create clean directory
mkdir adreply-v2.0.0

# Copy necessary files
cp -r adreply/* adreply-v2.0.0/

# Remove development files
rm -rf adreply-v2.0.0/tests
rm -rf adreply-v2.0.0/.git
rm adreply-v2.0.0/*.md (except README)

# Create ZIP
zip -r adreply-v2.0.0.zip adreply-v2.0.0/
```

### Chrome Web Store Submission

**Required Assets:**
- Extension ZIP file
- 128x128 icon
- 1280x800 screenshots (3-5)
- 440x280 promotional tile
- 920x680 promotional image (optional)

**Store Listing:**
- Name: AdReply - Intelligent Facebook Advertising Assistant
- Summary: AI-powered template generation and smart keyword learning
- Description: Full feature list and benefits
- Category: Productivity
- Language: English

**Privacy Policy:**
- Link to hosted privacy policy
- Explain data collection (none to external servers)
- Explain AI provider usage
- Explain local storage

### Testing Before Release

**Checklist:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] Migration from v1.x tested
- [ ] Fresh install tested
- [ ] All new features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Documentation updated


## Contributing Guidelines

### Code Style

**JavaScript:**
- ES6+ syntax
- 2-space indentation
- Semicolons required
- camelCase for variables and functions
- PascalCase for classes
- UPPER_CASE for constants

**Example:**
```javascript
const MAX_RETRIES = 3;

class TemplateManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }
  
  async saveTemplate(template) {
    // Implementation
  }
}
```

**Comments:**
```javascript
/**
 * Generates AI setup from business description
 * @param {string} businessDescription - User's business description
 * @returns {Promise<Object>} Generated categories and templates
 */
async function generateSetup(businessDescription) {
  // Implementation
}
```

### Git Workflow

**Branch Naming:**
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/component-name` - Code refactoring

**Commit Messages:**
```
feat: Add keyword learning engine
fix: Resolve clipboard copy issue on Firefox
docs: Update API key security guide
refactor: Simplify storage manager interface
```

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Write/update tests
4. Update documentation
5. Test thoroughly
6. Create pull request
7. Address review feedback
8. Merge when approved

### Testing Requirements

**For New Features:**
- Unit tests for core logic
- Integration tests for workflows
- Manual testing checklist
- Documentation updates

**For Bug Fixes:**
- Test that reproduces bug
- Fix implementation
- Verify fix with test
- Add regression test


## Common Development Tasks

### Adding a New Template Field

**1. Update Data Model:**
```javascript
// /storage/data-models.js
class Template {
  constructor(data) {
    this.id = data.id;
    this.label = data.label;
    this.content = data.content;
    this.keywords = data.keywords;
    this.newField = data.newField || ''; // NEW
  }
}
```

**2. Update Storage:**
```javascript
// /storage/indexeddb-manager.js
async saveTemplate(template) {
  // Validation includes new field
  const validated = new Template(template);
  await this.db.put('templates', validated);
}
```

**3. Update UI:**
```html
<!-- /ui/sidepanel-modular.html -->
<input type="text" id="newField" placeholder="New Field">
```

```javascript
// /ui/modules/template-manager.js
async saveTemplate() {
  const template = {
    id: this.currentTemplate.id,
    label: document.getElementById('label').value,
    content: document.getElementById('content').value,
    keywords: this.getKeywords(),
    newField: document.getElementById('newField').value // NEW
  };
  
  await this.storageManager.saveTemplate(template);
}
```

**4. Update Migration:**
```javascript
// /storage/storage-migration-v2.js
async function migrateTemplates() {
  const templates = await getAllTemplates();
  
  for (const template of templates) {
    if (!template.newField) {
      template.newField = ''; // Add default
      await saveTemplate(template);
    }
  }
}
```


### Adding a New UI Module

**1. Create Module File:**
```javascript
// /ui/modules/my-feature.js
class MyFeature {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.container = document.getElementById('my-feature-container');
  }
  
  async initialize() {
    await this.loadData();
    this.render();
    this.attachEventListeners();
  }
  
  async loadData() {
    this.data = await this.storageManager.getData();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="my-feature">
        <!-- UI content -->
      </div>
    `;
  }
  
  attachEventListeners() {
    this.container.querySelector('.action-btn')
      .addEventListener('click', () => this.handleAction());
  }
  
  async handleAction() {
    // Business logic
    await this.storageManager.saveData(this.data);
    this.render();
  }
}
```

**2. Add HTML Container:**
```html
<!-- /ui/sidepanel-modular.html -->
<div id="my-feature-container"></div>
```

**3. Import and Initialize:**
```html
<!-- /ui/sidepanel-modular.html -->
<script src="modules/my-feature.js"></script>
```

```javascript
// /ui/sidepanel-modular.js
const myFeature = new MyFeature(storageManager);
await myFeature.initialize();
```

### Debugging Common Issues

**Issue: Templates Not Saving**
```javascript
// Check storage quota
navigator.storage.estimate().then(estimate => {
  console.log('Usage:', estimate.usage);
  console.log('Quota:', estimate.quota);
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});
```

**Issue: AI Generation Failing**
```javascript
// Test API connection
async function testAIConnection() {
  try {
    const client = new GeminiProvider(apiKey);
    const result = await client.testConnection();
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

**Issue: Keyword Learning Not Tracking**
```javascript
// Verify event hooks
console.log('Match recorded:', {
  keywords: matchedKeywords,
  templateId: template.id,
  timestamp: new Date().toISOString()
});

// Check storage
chrome.storage.local.get('keywordStats', (data) => {
  console.log('Current stats:', data.keywordStats);
});
```


## Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### AI Provider Documentation
- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Tools
- [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/)
- [JSON Validator](https://jsonlint.com/)

### Internal Documentation
- [User Guides](/docs/) - All user-facing documentation
- [API Key Security](/docs/API_KEY_SECURITY.md) - Security practices
- [Storage System](/STORAGE_SYSTEM.md) - Storage architecture
- [License System](/docs/browser-extension-jwt-integration.md) - JWT integration

## Support

### Getting Help
- Check documentation first
- Search existing issues
- Ask in developer community
- Contact: dev@adreply.com

### Reporting Bugs
Include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors
- Screenshots if applicable

### Feature Requests
Include:
- Use case description
- Expected behavior
- Why it's valuable
- Proposed implementation (optional)

---

**Happy coding!** Build amazing features for AdReply v2.0.
