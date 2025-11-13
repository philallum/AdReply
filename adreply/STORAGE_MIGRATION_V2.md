# Storage Migration v2.0 Documentation

## Overview

The Storage Migration v2.0 system handles the transition from v1 to v2 of the AdReply extension, ensuring backward compatibility and data preservation while adding new features for AI-powered onboarding, keyword learning, and affiliate link management.

## Migration Scenarios

### Scenario 1: Fresh Install (v0)
- **Detection**: No existing settings in chrome.storage.local
- **Action**: Initialize with v2 defaults
- **Onboarding**: `onboardingCompleted = false` (triggers AI wizard)
- **Data**: Creates default settings structure with all v2 fields

### Scenario 2: Existing v1 User
- **Detection**: Settings exist but lack v2 fields (no `onboardingCompleted`, `businessDescription`, or `aiProvider`)
- **Action**: Add v2 fields to existing settings
- **Onboarding**: `onboardingCompleted = true` (skips AI wizard)
- **Data**: Preserves all existing v1 settings and data

### Scenario 3: Already v2
- **Detection**: Settings contain v2 fields or migration key is set to 2
- **Action**: No migration needed
- **Result**: Returns success with `alreadyMigrated: true`

## Storage Version Detection

The system uses multiple methods to detect the current storage version:

1. **Migration Key**: Checks for `adreply_storage_version` in chrome.storage.local
2. **Settings Analysis**: Examines settings object for v2-specific fields
3. **Fallback**: Assumes fresh install if no data found

```javascript
async detectStorageVersion() {
  // Returns: 0 (fresh), 1 (v1), or 2 (v2)
}
```

## Data Structures

### V1 Settings (Preserved)
```javascript
{
  ui: {
    sidebarWidth: 320,
    theme: 'light',
    showUpgradePrompts: true
  },
  templates: {
    maxSuggestions: 3,
    enableRotation: true,
    preventRepetition: true,
    preferredCategory: ''
  }
}
```

### V2 Settings (Added Fields)
```javascript
{
  // ... all v1 fields preserved ...
  
  // New v2 fields:
  businessDescription: '',
  companyUrl: '',
  aiProvider: 'gemini',
  aiKeyEncrypted: '',
  onboardingCompleted: false, // false for fresh, true for v1 users
  affiliateLinks: {
    default: '',
    categoryOverrides: {}
  },
  adPackMetadata: []
}
```

### V2 Storage Additions
```javascript
{
  settings: { /* v2 settings */ },
  keywordStats: {}, // New: Keyword learning data
  adreply_storage_version: 2 // New: Version marker
}
```

## Migration Process

### Complete Migration Flow

1. **Detect Current Version**
   - Checks migration key
   - Analyzes settings structure
   - Returns version number (0, 1, or 2)

2. **Verify IndexedDB (Pre-Migration)**
   - Counts templates, categories, groups
   - Records state for comparison

3. **Perform Migration**
   - Fresh Install: Initialize with v2 defaults
   - V1 User: Add v2 fields, preserve v1 data
   - V2 User: Skip migration

4. **Verify IndexedDB (Post-Migration)**
   - Confirms no data loss
   - Compares counts with pre-migration

5. **Set Migration Marker**
   - Sets `adreply_storage_version = 2`
   - Prevents re-migration

## Data Preservation Guarantees

### Chrome Storage (chrome.storage.local)
- ✅ All existing settings preserved
- ✅ All custom fields preserved
- ✅ AI settings preserved
- ✅ License data preserved
- ✅ New v2 fields added with defaults

### IndexedDB
- ✅ All templates preserved
- ✅ All categories preserved
- ✅ All group histories preserved
- ✅ No data modified or deleted

## Integration Points

### Background Script (background-safe.js)
```javascript
// Migration runs on extension startup
(async function initializeManagers() {
  storageMigration = new StorageMigrationV2();
  const migrationResult = await storageMigration.performCompleteMigration();
  // ... continue with initialization
})();
```

### Extension Install/Update
```javascript
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Fresh install - migration sets onboardingCompleted = false
  } else if (details.reason === 'update') {
    // Update - migration preserves existing data
  }
});
```

### UI Integration
```javascript
// Check if onboarding is needed
chrome.runtime.sendMessage({ type: 'GET_MIGRATION_STATUS' }, (response) => {
  if (!response.status.onboardingCompleted) {
    // Show onboarding wizard
  }
});
```

## API Reference

### StorageMigrationV2 Class

#### Methods

**detectStorageVersion()**
- Returns: `Promise<number>` (0, 1, or 2)
- Detects current storage version

**migrateToV2()**
- Returns: `Promise<Object>` Migration result
- Performs migration to v2

**initializeFreshInstall()**
- Returns: `Promise<Object>` Initialization result
- Sets up fresh install with v2 defaults

**migrateV1ToV2()**
- Returns: `Promise<Object>` Migration result
- Migrates existing v1 data to v2

**getMigrationStatus()**
- Returns: `Promise<Object>` Status object
- Gets current migration status

**performCompleteMigration()**
- Returns: `Promise<Object>` Complete result
- Runs full migration with verification

### Message Handlers

**GET_MIGRATION_STATUS**
```javascript
chrome.runtime.sendMessage({ type: 'GET_MIGRATION_STATUS' }, (response) => {
  // response.status contains migration status
});
```

**TRIGGER_MIGRATION**
```javascript
chrome.runtime.sendMessage({ type: 'TRIGGER_MIGRATION' }, (response) => {
  // response.result contains migration result
});
```

## Testing

### Manual Testing
1. Open `tests/manual-test-migration.html` in the extension context
2. Use buttons to test different scenarios:
   - Clear storage and test fresh install
   - Setup v1 data and test migration
   - Verify data preservation

### Automated Testing
Run the test suite:
```bash
node tests/run-tests-node.js tests/storage-migration-v2.test.js
```

### Test Scenarios
- ✅ Fresh install detection
- ✅ V1 user detection
- ✅ V2 user detection
- ✅ Fresh install initialization
- ✅ V1 to V2 migration
- ✅ Data preservation
- ✅ Settings preservation
- ✅ IndexedDB preservation

## Troubleshooting

### Migration Not Running
- Check browser console for errors
- Verify `storage-migration-v2.js` is loaded in manifest
- Check background script initialization

### Data Not Preserved
- Check pre/post migration IndexedDB counts
- Verify chrome.storage.local data
- Review migration logs in console

### Onboarding Not Triggering
- Check `onboardingCompleted` field in settings
- Verify migration status with GET_MIGRATION_STATUS
- Ensure fresh install sets `onboardingCompleted = false`

### V1 Users Seeing Onboarding
- Should not happen - v1 migration sets `onboardingCompleted = true`
- Check migration logs
- Verify v1 detection logic

## Migration Logs

The migration system provides detailed console logging:

```
StorageMigrationV2: Starting complete migration process...
StorageMigrationV2: Current version: 1
StorageMigrationV2: Pre-migration IndexedDB state: {...}
StorageMigrationV2: Migrating v1 to v2...
StorageMigrationV2: v1 to v2 migration completed
StorageMigrationV2: Post-migration IndexedDB state: {...}
StorageMigrationV2: Complete migration process finished
```

## Future Considerations

### V3 Migration
When v3 is needed:
1. Update `STORAGE_VERSION_V3 = 3`
2. Add `migrateV2ToV3()` method
3. Update `migrateToV2()` to handle v2 → v3
4. Preserve all v2 data

### Rollback Support
Currently not implemented. Consider adding:
- Pre-migration backup
- Rollback function
- Version downgrade support

## Security Considerations

- API keys are encrypted before storage
- Migration preserves encrypted keys
- No sensitive data logged
- All operations use chrome.storage.local (secure)

## Performance

- Migration runs once on startup
- Typical migration time: < 100ms
- No impact on extension performance after migration
- IndexedDB operations are non-blocking
