# Design Document

## Overview

AdReply v2.0 transforms the extension from a manual template management tool into an intelligent, self-optimizing advertising assistant. The design introduces five major subsystems that work together while maintaining backward compatibility with the existing modular architecture. The system leverages AI for onboarding, behavioral analytics for continuous improvement, community-driven content sharing, expanded publishing capabilities, and automated monetization.

### Design Principles

1. **Zero-Friction Onboarding**: New users should be productive within 2 minutes
2. **Continuous Learning**: System improves automatically through usage patterns
3. **Community-Powered**: Users benefit from collective knowledge and templates
4. **Backward Compatible**: Existing users experience seamless upgrade
5. **Privacy-First**: All AI processing happens client-side with user-provided keys
6. **Modular Integration**: New features integrate with existing module architecture

## Architecture

### High-Level System Architecture

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


### Data Flow Architecture

```
User Input → AI Wizard → Generated Data → Storage Manager → IndexedDB
                                                           ↓
User Actions → Keyword Learning → Statistics → Chrome Storage
                                                           ↓
Template Usage → Post Publisher → Facebook API → Usage Tracker
                                                           ↓
Marketplace → Ad Pack Import → Validation → Merge → Storage
```

## Components and Interfaces

### 1. AI Client Module (`/scripts/ai-client.js`)

**Purpose**: Unified interface for multiple AI providers (Gemini and OpenAI)

**Class Structure**:
```javascript
class AIClient {
  constructor(provider, apiKey)
  async generateSetup(businessDescription)
  async testConnection()
  _buildPrompt(businessDescription)
  _parseResponse(rawResponse)
}
```

**Provider Implementations**:
- `GeminiProvider`: Uses Google Gemini API endpoint
- `OpenAIProvider`: Uses OpenAI Chat Completions API

**API Integration**:
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- OpenAI: `https://api.openai.com/v1/chat/completions`

**Prompt Template**:
```
You are an advertising expert. Generate a complete advertising system for: {businessDescription}

IMPORTANT REQUIREMENTS:
- Each template must be 400-600 characters long (minimum 4 sentences)
- Templates should be engaging, conversational, and suitable for Facebook comments
- Include natural call-to-action phrases
- Use {{placeholders}} for customization points

Return JSON with this exact structure:
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "description": "Brief description",
      "positiveKeywords": ["keyword1", "keyword2"],
      "negativeKeywords": ["avoid1", "avoid2"],
      "templates": [
        {
          "id": "template-id",
          "title": "Template Title",
          "content": "Template text with {{placeholders}} - MUST be 400-600 characters",
          "keywords": ["relevant", "keywords"]
        }
      ]
    }
  ]
}

Generate 3-5 categories with 10 templates each.
Each template MUST be at least 400 characters and contain 4+ sentences.
```


### 2. AI Setup Wizard (`/ui/modules/onboarding-wizard.js`)

**Purpose**: Guide users through AI-powered onboarding process

**Class Structure**:
```javascript
class OnboardingWizard {
  constructor(storageManager, aiClient)
  async start()
  async collectBusinessDescription()
  async selectAIProvider()
  async configureAPIKey()
  async generateSetup()
  async reviewAndConfirm(generatedData)
  async saveToStorage(data)
  async handleMergeOrReplace()
}
```

**UI Flow**:
1. Welcome screen with value proposition
2. Business description input (textarea, 50-500 chars)
3. Company/promotion URL input (text field, optional but recommended)
4. AI provider selection (Gemini/OpenAI radio buttons)
5. API key input (password field with validation)
6. Generation progress indicator
7. Review generated categories/templates (show character counts)
8. Merge/Replace decision (if existing data)
9. Completion confirmation

**HTML Page** (`/ui/onboarding.html`):
- Responsive wizard interface
- Step indicators (1/5, 2/5, etc.)
- Back/Next navigation
- Skip option for manual setup
- Error handling displays

**Template Validation**:
```javascript
function validateGeneratedTemplate(template) {
  const errors = [];
  
  // Check minimum length (400 characters)
  if (template.content.length < 400) {
    errors.push(`Template "${template.title}" is too short (${template.content.length} chars, minimum 400)`);
  }
  
  // Check sentence count (minimum 4)
  const sentences = template.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 4) {
    errors.push(`Template "${template.title}" has too few sentences (${sentences.length}, minimum 4)`);
  }
  
  return { isValid: errors.length === 0, errors };
}
```

**Integration Points**:
- Calls `AIClient.generateSetup()`
- Validates template length and quality
- Saves to `StorageManager.saveCategory()` and `saveTemplate()`
- Saves company URL to settings
- Updates settings via `SettingsManager`
- Accessible from extension icon on first install
- Re-accessible from settings page

### 3. Keyword Learning Engine (`/scripts/keyword-learning.js`)

**Purpose**: Track user behavior and optimize keyword relevance

**Class Structure**:
```javascript
class KeywordLearningEngine {
  constructor(storageManager)
  async recordMatch(postContent, matchedTemplates, keywords)
  async recordSelection(templateId, keywords, categoryId)
  async recordIgnore(templateId, keywords, categoryId)
  async calculateScores()
  async getSuggestedRemovals(threshold = 0.1, minMatches = 20)
  async getPerformanceReport()
  async adjustKeywordWeights()
}
```


**Data Tracking Model**:
```javascript
{
  keywordStats: {
    "categoryId": {
      "keyword": {
        matches: 0,      // Times keyword contributed to a match
        chosen: 0,       // Times user selected template with this keyword
        ignored: 0,      // Times user ignored suggestion with this keyword
        score: 0.0,      // chosen / matches
        lastUpdated: "ISO timestamp"
      }
    }
  }
}
```

**Integration with Post Analysis**:
- Hook into `PostAnalyzer.analyzePost()` to record matches
- Hook into template selection events to record choices
- Use 10-second timeout to detect ignores
- Update scores in real-time

**Performance Dashboard** (`/ui/modules/keyword-performance.js`):
- Table view of all keywords with stats
- Sort by score, matches, or category
- Visual indicators (green/yellow/red for score ranges)
- "Learning" badge for keywords with <10 matches
- Manual remove/adjust actions

### 4. Template Marketplace (`/ui/modules/marketplace.js`)

**Purpose**: Browse, preview, and import community Ad Packs

**Class Structure**:
```javascript
class TemplateMarketplace {
  constructor(storageManager, packManager)
  async fetchIndex()
  async displayPacks(packs)
  async previewPack(packId)
  async importPack(packId)
  async exportCurrentSetup(categoryIds)
}
```


**Ad Pack Manager** (`/scripts/pack-manager.js`):
```javascript
class AdPackManager {
  constructor(storageManager)
  async createPack(name, niche, categoryIds)
  async validatePack(packData)
  async importPack(packData, mergeStrategy)
  async exportPack(categoryIds)
}
```

**Ad Pack JSON Format**:
```javascript
{
  id: "pack-unique-id",
  name: "Real Estate Agents Pack",
  niche: "real-estate",
  version: "1.0.0",
  author: "anonymous",
  description: "Templates for real estate professionals",
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

**Marketplace Index** (hosted at CDN):
```javascript
{
  version: "1.0",
  lastUpdated: "ISO timestamp",
  packs: [
    {
      id: "pack-id",
      name: "Pack Name",
      niche: "niche-slug",
      version: "1.0.0",
      description: "Brief description",
      templateCount: 50,
      categoryCount: 5,
      downloadUrl: "https://cdn.example.com/packs/pack-id.json"
    }
  ]
}
```

**Marketplace UI** (`/ui/marketplace.html`):
- Grid/list view of available packs
- Search and filter by niche
- Pack preview modal with template samples
- Import button with progress indicator
- Export current setup button
- Local pack file upload option


### 5. Post Publisher (`/scripts/post-publisher.js`)

**Purpose**: Convert templates into Facebook posts with clipboard and auto-fill support

**Class Structure**:
```javascript
class PostPublisher {
  constructor()
  async copyToClipboard(text)
  async findComposer()
  async fillComposer(text)
  async showTooltip(message, element)
  handleReactInput(element, value)
}
```

**Facebook Composer Detection**:
```javascript
// Selectors for Facebook post composer (may need updates)
const COMPOSER_SELECTORS = [
  '[role="textbox"][contenteditable="true"]',
  'div[data-contents="true"]',
  '.notranslate._5rpu'
];
```

**React-Compatible Input Handling**:
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

**UI Integration** (`/ui/modules/post-publisher-ui.js`):
- Add "Post as Content" button to template cards
- Add "Post as Content" button to template editor
- Show success toast on clipboard copy
- Show tooltip near composer when found
- Handle errors gracefully (composer not found, clipboard denied)

**Content Script Integration** (`/scripts/content-minimal.js`):
- Listen for POST_AS_CONTENT messages from side panel
- Locate Facebook composer element
- Attempt to fill composer
- Send success/failure response


### 6. Affiliate Link System (`/scripts/affiliate-link-manager.js`)

**Purpose**: Automatically inject monetization links into templates

**Class Structure**:
```javascript
class AffiliateLinkManager {
  constructor(storageManager)
  async setDefaultLink(url)
  async setCategoryLink(categoryId, url)
  async getLink(categoryId)
  renderTemplate(templateText, categoryId)
  validateUrl(url)
}
```

**Template Rendering Logic**:
```javascript
function renderTemplate(templateText, categoryId, settings) {
  let rendered = templateText;
  
  // Get appropriate affiliate link (category-specific or default)
  const affiliateLink = this.getLink(categoryId);
  
  if (affiliateLink) {
    rendered = rendered.replace(/\{\{link\}\}/g, affiliateLink);
  } else {
    // Remove {{link}} placeholder and its line if no affiliate link
    rendered = rendered.replace(/^.*\{\{link\}\}.*$/gm, '').trim();
  }
  
  // Append default company URL if configured (existing feature)
  if (settings.companyUrl) {
    rendered = rendered.trim() + '\n\n' + settings.companyUrl;
  }
  
  return rendered;
}
```

**Note**: The company URL is appended to ALL templates by default (existing behavior), while {{link}} is an optional inline placeholder for affiliate links within the template text.

**Settings UI Integration**:
- Add "Affiliate Links" section to settings page
- Default affiliate link input field
- Category-specific overrides in category editor
- URL validation with visual feedback
- Preview rendered template with link

**Storage Schema Extension**:
```javascript
{
  // Existing feature: Default company URL appended to ALL templates
  companyUrl: "https://mybusiness.com",
  
  // New feature: Optional affiliate links for inline {{link}} placeholders
  affiliateLinks: {
    default: "https://example.com/ref/12345",
    categoryOverrides: {
      "category-id-1": "https://specific-link.com/ref/abc",
      "category-id-2": "https://another-link.com/ref/xyz"
    }
  }
}
```

**Key Distinction**:
- **Company URL**: Always appended to the end of every template (existing behavior)
- **Affiliate Links**: Only used when template contains {{link}} placeholder (new feature)


## Data Models

### Extended Settings Model

```javascript
class SettingsV2 extends Settings {
  constructor() {
    super();
    this.businessDescription = "";
    this.companyUrl = ""; // Default promotion URL (existing feature)
    this.aiProvider = "gemini"; // "gemini" | "openai"
    this.aiKeyEncrypted = "";
    this.onboardingCompleted = false;
    this.affiliateLinks = {
      default: "",
      categoryOverrides: {}
    };
  }
}
```

### Keyword Statistics Model

```javascript
class KeywordStats {
  constructor(keyword, categoryId) {
    this.keyword = keyword;
    this.categoryId = categoryId;
    this.matches = 0;
    this.chosen = 0;
    this.ignored = 0;
    this.score = 0.0;
    this.lastUpdated = new Date().toISOString();
  }
  
  updateScore() {
    this.score = this.matches > 0 ? this.chosen / this.matches : 0;
    this.lastUpdated = new Date().toISOString();
  }
  
  shouldSuggestRemoval(threshold = 0.1, minMatches = 20) {
    return this.matches >= minMatches && this.score < threshold;
  }
}
```

### Ad Pack Model

```javascript
class AdPack {
  constructor(name, niche) {
    this.id = generateId();
    this.name = name;
    this.niche = niche;
    this.version = "1.0.0";
    this.author = "anonymous";
    this.description = "";
    this.createdAt = new Date().toISOString();
    this.categories = [];
    this.metadata = {
      totalTemplates: 0,
      totalCategories: 0,
      downloadCount: 0
    };
  }
  
  validate() {
    const errors = [];
    if (!this.name) errors.push("Name is required");
    if (!this.niche) errors.push("Niche is required");
    if (!this.categories.length) errors.push("At least one category required");
    return { isValid: errors.length === 0, errors };
  }
}
```


### Backup Data Model Extension

```javascript
class BackupDataV2 {
  constructor() {
    this.version = 2;
    this.createdAt = new Date().toISOString();
    this.data = {
      // Existing v1 data
      templates: [],
      groups: [],
      settings: {},
      aiSettings: {},
      license: null,
      
      // New v2 data
      keywordStats: {},
      affiliateLinks: {},
      adPackMetadata: [],
      onboardingData: {
        businessDescription: "",
        aiProvider: "",
        completedAt: ""
      }
    };
  }
  
  validate() {
    return this.version && this.createdAt && this.data;
  }
}
```

## Error Handling

### AI Client Error Handling

**Error Types**:
1. **Network Errors**: API unreachable, timeout
2. **Authentication Errors**: Invalid API key
3. **Rate Limiting**: Too many requests
4. **Invalid Response**: Malformed JSON, missing fields
5. **Quota Exceeded**: Free tier limits reached

**Error Recovery**:
```javascript
async generateSetup(businessDescription) {
  try {
    const response = await this.callAPI(businessDescription);
    return this.parseResponse(response);
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      throw new UserFacingError('Rate limit reached. Please wait and try again.');
    } else if (error.code === 'AUTH_FAILED') {
      throw new UserFacingError('Invalid API key. Please check your credentials.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new UserFacingError('Network error. Please check your connection.');
    } else {
      throw new UserFacingError('Generation failed. Please try manual setup.');
    }
  }
}
```


### Keyword Learning Error Handling

**Scenarios**:
1. Storage quota exceeded
2. Corrupted statistics data
3. Invalid category/template references

**Recovery Strategy**:
- Graceful degradation: Continue without learning if storage fails
- Data validation on load: Reset corrupted stats
- Orphan cleanup: Remove stats for deleted categories/templates

### Marketplace Error Handling

**Scenarios**:
1. CDN unreachable
2. Invalid pack format
3. Merge conflicts
4. Storage quota exceeded during import

**Recovery Strategy**:
- Cache last successful index fetch
- Validate pack structure before import
- Offer conflict resolution UI
- Show storage usage before import

## Testing Strategy

### Unit Tests

**AI Client Tests**:
- Mock API responses for both providers
- Test prompt generation
- Test response parsing
- Test error handling for each error type

**Keyword Learning Tests**:
- Test score calculation
- Test removal suggestions
- Test data persistence
- Test orphan cleanup

**Pack Manager Tests**:
- Test pack validation
- Test merge strategies
- Test export functionality
- Test format migration


### Integration Tests

**Onboarding Flow**:
- Test complete wizard flow
- Test skip and manual setup
- Test merge vs replace with existing data
- Test error recovery

**End-to-End Learning**:
- Simulate user interactions
- Verify score updates
- Test performance dashboard
- Verify removal suggestions

**Marketplace Flow**:
- Test pack browsing
- Test pack import
- Test pack export
- Test local file upload

**Post Publishing**:
- Test clipboard copy
- Test composer detection (mocked Facebook DOM)
- Test React input handling
- Test error messages

### Manual Testing Checklist

**AI Wizard**:
- [ ] First-time install triggers wizard
- [ ] Gemini API generates valid data
- [ ] OpenAI API generates valid data
- [ ] Invalid API key shows error
- [ ] Generated data saves correctly
- [ ] Wizard accessible from settings
- [ ] Merge option preserves existing data
- [ ] Replace option clears old data

**Keyword Learning**:
- [ ] Matches recorded correctly
- [ ] Selections update scores
- [ ] Ignores update scores
- [ ] Dashboard displays stats
- [ ] Removal suggestions appear
- [ ] Manual adjustments work

**Marketplace**:
- [ ] Index loads from CDN
- [ ] Packs display correctly
- [ ] Preview shows templates
- [ ] Import merges data
- [ ] Export creates valid pack
- [ ] Local upload works

**Post Publisher**:
- [ ] Clipboard copy works
- [ ] Composer found on Facebook
- [ ] Text fills composer
- [ ] Tooltip appears
- [ ] Errors handled gracefully

**Affiliate Links**:
- [ ] Default link saves
- [ ] Category overrides work
- [ ] {{link}} replaced correctly
- [ ] Missing link removes placeholder
- [ ] URL validation works

**Backup/Restore**:
- [ ] Backup includes v2 data
- [ ] Restore preserves v2 data
- [ ] Migration from v1 works
- [ ] Validation catches corruption


## Migration and Backward Compatibility

### Storage Migration Strategy

**Version Detection**:
```javascript
async function detectStorageVersion() {
  const settings = await chrome.storage.local.get('settings');
  
  if (!settings.settings) return 0; // Fresh install
  if (settings.settings.onboardingCompleted !== undefined) return 2; // v2
  return 1; // v1
}
```

**Migration Path**:
```javascript
async function migrateToV2() {
  const version = await detectStorageVersion();
  
  if (version === 0) {
    // Fresh install - show onboarding wizard
    return { needsOnboarding: true };
  }
  
  if (version === 1) {
    // Existing v1 user - add v2 fields with defaults
    await chrome.storage.local.set({
      keywordStats: {},
      affiliateLinks: { default: "", categoryOverrides: {} }
    });
    
    const settings = await getSettings();
    settings.businessDescription = "";
    settings.aiProvider = "gemini";
    settings.aiKeyEncrypted = "";
    settings.onboardingCompleted = true; // Skip wizard for existing users
    await saveSettings(settings);
    
    return { migrated: true, fromVersion: 1 };
  }
  
  return { upToDate: true };
}
```

### Manifest Updates

**New Permissions**:
```json
{
  "permissions": [
    "storage",
    "tabs",
    "sidePanel",
    "scripting",
    "downloads",
    "clipboardWrite"  // NEW: For post publisher
  ],
  "host_permissions": [
    "https://www.facebook.com/*",
    "https://generativelanguage.googleapis.com/*",  // NEW: Gemini API
    "https://api.openai.com/*"  // NEW: OpenAI API
  ]
}
```


### UI Integration Points

**Extension Icon Click**:
- First install: Open onboarding wizard
- Existing user: Open side panel (existing behavior)

**Settings Page Additions**:
- "AI Setup" section with re-run wizard button
- "Affiliate Links" section
- "Keyword Performance" link to dashboard
- "Marketplace" link to browse packs

**Side Panel Additions**:
- "Post as Content" button on template cards
- Keyword performance indicator (optional)
- Marketplace quick access button

**Template Editor Additions**:
- "Post as Content" button
- {{link}} placeholder helper
- Affiliate link preview

## Performance Considerations

### Storage Optimization

**Keyword Statistics**:
- Store only active keywords (referenced by templates)
- Cleanup orphaned stats monthly
- Limit history to 1000 most recent interactions
- Estimated size: ~50KB for typical usage

**Ad Pack Caching**:
- Cache marketplace index for 24 hours
- Cache pack previews for 1 hour
- Clear cache on manual refresh
- Estimated size: ~100KB for index + previews

### API Rate Limiting

**Gemini Free Tier**:
- 60 requests per minute
- Strategy: Single request per onboarding session
- No retry logic needed for typical usage

**OpenAI**:
- Varies by user's plan
- Strategy: Show clear error on rate limit
- Suggest waiting or switching to Gemini

### Memory Management

**Learning Engine**:
- Process statistics updates in batches
- Debounce score calculations (max once per 5 seconds)
- Use Web Workers for heavy calculations (future enhancement)


## Security Considerations

### API Key Storage

**Encryption Strategy**:
```javascript
// Use Web Crypto API for client-side encryption
async function encryptAPIKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Generate key from extension ID (consistent across sessions)
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

**Key Access**:
- Never log API keys
- Never send keys to any server except AI provider
- Clear from memory after use
- Provide "Clear API Key" button in settings

### Content Script Security

**Facebook Interaction**:
- Minimal DOM manipulation
- No data extraction beyond post content
- No form submission automation
- User must manually post content

**XSS Prevention**:
- Sanitize all template content before rendering
- Escape HTML in user-generated content
- Use textContent instead of innerHTML where possible


### Privacy Considerations

**Data Collection**:
- No telemetry or analytics
- No data sent to AdReply servers
- All AI processing via user's own API keys
- Keyword statistics stored locally only

**User Control**:
- Export all data at any time
- Delete all data option in settings
- Clear learning statistics option
- Opt-out of keyword learning (use static keywords only)

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Deliverables**:
- AI Client module with Gemini and OpenAI support
- Settings model extensions
- Storage schema updates
- Basic onboarding wizard UI

**Success Criteria**:
- AI client successfully generates data from both providers
- Settings save and load correctly
- Wizard completes end-to-end

### Phase 2: Intelligence (Week 3-4)

**Deliverables**:
- Keyword Learning Engine
- Statistics tracking integration
- Performance dashboard UI
- Removal suggestions

**Success Criteria**:
- Statistics update correctly during usage
- Scores calculate accurately
- Dashboard displays real-time data
- Suggestions appear when thresholds met

### Phase 3: Community (Week 5-6)

**Deliverables**:
- Ad Pack Manager
- Marketplace UI
- Import/export functionality
- Sample packs for testing

**Success Criteria**:
- Packs import without data loss
- Export creates valid packs
- Marketplace displays packs correctly
- Merge strategy works as expected


### Phase 4: Publishing (Week 7)

**Deliverables**:
- Post Publisher module
- Content script integration
- Clipboard functionality
- Composer detection and filling

**Success Criteria**:
- Clipboard copy works reliably
- Composer detected on Facebook
- React input handling works
- Error messages clear and helpful

### Phase 5: Monetization (Week 8)

**Deliverables**:
- Affiliate Link Manager
- Settings UI for links
- Template rendering with {{link}}
- Category-specific overrides

**Success Criteria**:
- Links save and load correctly
- {{link}} replaced in templates
- Missing links handled gracefully
- Preview shows rendered output

### Phase 6: Polish & Integration (Week 9-10)

**Deliverables**:
- Backup/restore v2 support
- Migration from v1
- Complete testing
- Documentation updates
- UI polish and refinements

**Success Criteria**:
- All manual tests pass
- v1 users migrate smoothly
- Backup includes all v2 data
- Documentation complete
- No critical bugs

## Future Enhancements

**Post-v2.0 Considerations**:
1. **Multi-language support**: AI-generated templates in multiple languages
2. **A/B testing**: Track which template variants perform best
3. **Scheduled posting**: Queue posts for optimal times
4. **Analytics dashboard**: Detailed engagement metrics
5. **Team collaboration**: Share packs within organizations
6. **Advanced AI features**: Context-aware template suggestions
7. **Integration with other platforms**: LinkedIn, Twitter, Instagram
8. **Template versioning**: Track changes and rollback
9. **Smart scheduling**: AI-suggested posting times
10. **Performance predictions**: Estimate engagement before posting

