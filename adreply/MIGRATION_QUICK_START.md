# Storage Migration v2.0 - Quick Start Guide

## For Developers

### What Was Implemented

A complete storage migration system that handles:
- Fresh installs (v0 → v2)
- Existing v1 users (v1 → v2)
- Already migrated v2 users (no-op)

### Key Files

1. **`storage/storage-migration-v2.js`** - Core migration logic
2. **`scripts/background-safe.js`** - Integration point (already updated)
3. **`STORAGE_MIGRATION_V2.md`** - Full documentation

### How It Works

#### Automatic Migration
The migration runs automatically on extension startup:
```javascript
// In background-safe.js (already implemented)
storageMigration = new StorageMigrationV2();
await storageMigration.performCompleteMigration();
```

#### Version Detection
```javascript
const version = await migration.detectStorageVersion();
// Returns: 0 (fresh), 1 (v1), or 2 (v2)
```

#### Migration Flow
- **Fresh Install**: Creates v2 settings, sets `onboardingCompleted = false`
- **V1 User**: Adds v2 fields, preserves v1 data, sets `onboardingCompleted = true`
- **V2 User**: Skips migration

### Checking Migration Status

From UI components:
```javascript
chrome.runtime.sendMessage({ type: 'GET_MIGRATION_STATUS' }, (response) => {
  const status = response.status;
  console.log('Current version:', status.currentVersion);
  console.log('Onboarding needed:', !status.onboardingCompleted);
});
```

### Testing

#### Quick Test
Open `tests/integration-migration-test.html` in the extension context.

#### Manual Test
Open `tests/manual-test-migration.html` for interactive testing.

### What Gets Migrated

#### V2 Settings Added
```javascript
{
  businessDescription: '',
  companyUrl: '',
  aiProvider: 'gemini',
  aiKeyEncrypted: '',
  onboardingCompleted: false, // or true for v1 users
  affiliateLinks: {
    default: '',
    categoryOverrides: {}
  },
  adPackMetadata: []
}
```

#### V2 Storage Added
```javascript
{
  keywordStats: {},
  adreply_storage_version: 2
}
```

### Data Preservation

✅ **All existing data is preserved:**
- Chrome storage settings
- IndexedDB templates
- IndexedDB categories
- IndexedDB groups
- License data
- AI settings
- Custom fields

### Common Use Cases

#### Check if Onboarding Needed
```javascript
const status = await storageMigration.getMigrationStatus();
if (!status.onboardingCompleted) {
  // Show onboarding wizard
}
```

#### Manually Trigger Migration (Testing)
```javascript
chrome.runtime.sendMessage({ type: 'TRIGGER_MIGRATION' }, (response) => {
  console.log('Migration result:', response.result);
});
```

### Troubleshooting

#### Migration Not Running
1. Check console for errors
2. Verify `storage-migration-v2.js` is loaded
3. Check background script initialization

#### Data Not Preserved
1. Check console logs for migration details
2. Use manual test page to inspect storage
3. Verify IndexedDB counts before/after

#### Onboarding Issues
- Fresh install should have `onboardingCompleted = false`
- V1 users should have `onboardingCompleted = true`
- Check migration status with GET_MIGRATION_STATUS

### Console Logs

Look for these logs to verify migration:
```
StorageMigrationV2: Starting complete migration process...
StorageMigrationV2: Current version: X
StorageMigrationV2: Migration completed successfully
AdReply: Storage migration completed
```

### Next Steps

1. ✅ Migration is already integrated into background script
2. ✅ Runs automatically on startup and install/update
3. ⏭️ Implement onboarding wizard (Task 3)
4. ⏭️ Use `onboardingCompleted` flag to show/hide wizard

### Important Notes

- Migration runs **once** per version
- Migration marker prevents re-migration
- All data is preserved - no data loss
- IndexedDB is not modified
- Fresh installs trigger onboarding
- V1 users skip onboarding

### Need More Info?

See `STORAGE_MIGRATION_V2.md` for complete documentation.
