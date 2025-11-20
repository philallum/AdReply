/**
 * Storage Migration for AdReply v2.0
 * Handles migration from v0 (fresh install), v1, to v2 with backward compatibility
 */

class StorageMigrationV2 {
  constructor() {
    this.MIGRATION_KEY = 'adreply_storage_version';
    this.STORAGE_VERSION_V0 = 0; // Fresh install
    this.STORAGE_VERSION_V1 = 1; // Existing v1 users
    this.STORAGE_VERSION_V2 = 2; // v2.0 with AI features
  }

  /**
   * Detect current storage version
   * @returns {Promise<number>} Storage version (0 = fresh, 1 = v1, 2 = v2)
   */
  async detectStorageVersion() {
    try {
      // Check for migration key first
      const migrationData = await chrome.storage.local.get([this.MIGRATION_KEY]);
      if (migrationData[this.MIGRATION_KEY]) {
        return migrationData[this.MIGRATION_KEY];
      }

      // Check for settings to determine if this is a fresh install or v1
      const settingsData = await chrome.storage.local.get(['settings']);
      
      if (!settingsData.settings) {
        // No settings found - fresh install
        console.log('StorageMigrationV2: Fresh install detected (v0)');
        return this.STORAGE_VERSION_V0;
      }

      // Check if v2 fields exist in settings
      const settings = settingsData.settings;
      if (settings.onboardingCompleted !== undefined || 
          settings.businessDescription !== undefined ||
          settings.aiProvider !== undefined) {
        // v2 fields present
        console.log('StorageMigrationV2: v2 installation detected');
        return this.STORAGE_VERSION_V2;
      }

      // Has settings but no v2 fields - v1 user
      console.log('StorageMigrationV2: v1 installation detected');
      return this.STORAGE_VERSION_V1;

    } catch (error) {
      console.error('StorageMigrationV2: Error detecting storage version:', error);
      // Assume fresh install on error
      return this.STORAGE_VERSION_V0;
    }
  }

  /**
   * Migrate storage to v2
   * @returns {Promise<Object>} Migration result
   */
  async migrateToV2() {
    try {
      console.log('StorageMigrationV2: Starting migration to v2...');

      const currentVersion = await this.detectStorageVersion();
      
      if (currentVersion === this.STORAGE_VERSION_V2) {
        console.log('StorageMigrationV2: Already at v2, no migration needed');
        return {
          success: true,
          alreadyMigrated: true,
          version: this.STORAGE_VERSION_V2
        };
      }

      let migrationResult;

      if (currentVersion === this.STORAGE_VERSION_V0) {
        // Fresh install - initialize with v2 defaults
        migrationResult = await this.initializeFreshInstall();
      } else if (currentVersion === this.STORAGE_VERSION_V1) {
        // Existing v1 user - migrate to v2
        migrationResult = await this.migrateV1ToV2();
      }

      // Update storage version marker
      await chrome.storage.local.set({
        [this.MIGRATION_KEY]: this.STORAGE_VERSION_V2
      });

      console.log('StorageMigrationV2: Migration completed successfully');
      
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: this.STORAGE_VERSION_V2,
        ...migrationResult
      };

    } catch (error) {
      console.error('StorageMigrationV2: Migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize fresh install with v2 defaults
   * @returns {Promise<Object>} Initialization result
   */
  async initializeFreshInstall() {
    try {
      console.log('StorageMigrationV2: Initializing fresh install...');

      // Get existing data (should be minimal or empty)
      const existingData = await chrome.storage.local.get(null);

      // Initialize settings with v2 defaults
      const defaultSettings = {
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
        },
        // v2.0 fields
        businessDescription: '',
        companyUrl: '',
        aiProvider: 'gemini',
        aiKeyEncrypted: '',
        onboardingCompleted: false, // Trigger wizard for fresh installs
        affiliateLinks: {
          default: '',
          categoryOverrides: {}
        },
        adPackMetadata: []
      };

      // Initialize v2 data structures
      const v2Data = {
        settings: defaultSettings,
        keywordStats: {},
        // Preserve any existing data
        ...existingData
      };

      // Save initialized data
      await chrome.storage.local.set(v2Data);

      console.log('StorageMigrationV2: Fresh install initialized with v2 defaults');

      return {
        initialized: true,
        onboardingRequired: true
      };

    } catch (error) {
      console.error('StorageMigrationV2: Error initializing fresh install:', error);
      throw error;
    }
  }

  /**
   * Migrate v1 storage to v2
   * @returns {Promise<Object>} Migration result
   */
  async migrateV1ToV2() {
    try {
      console.log('StorageMigrationV2: Migrating v1 to v2...');

      // Get all existing v1 data
      const existingData = await chrome.storage.local.get(null);
      
      // Preserve existing settings and add v2 fields
      const existingSettings = existingData.settings || {};
      
      const migratedSettings = {
        // Preserve all existing v1 settings
        ...existingSettings,
        
        // Add v2 fields with defaults
        businessDescription: existingSettings.businessDescription || '',
        companyUrl: existingSettings.companyUrl || '',
        aiProvider: existingSettings.aiProvider || 'gemini',
        aiKeyEncrypted: existingSettings.aiKeyEncrypted || '',
        onboardingCompleted: true, // Skip wizard for existing v1 users
        affiliateLinks: existingSettings.affiliateLinks || {
          default: '',
          categoryOverrides: {}
        },
        adPackMetadata: existingSettings.adPackMetadata || []
      };

      // Initialize v2 data structures if not present
      const v2Data = {
        ...existingData,
        settings: migratedSettings,
        keywordStats: existingData.keywordStats || {}
      };

      // Save migrated data
      await chrome.storage.local.set(v2Data);

      console.log('StorageMigrationV2: v1 to v2 migration completed');

      return {
        migrated: true,
        onboardingRequired: false, // Existing users skip onboarding
        settingsPreserved: true
      };

    } catch (error) {
      console.error('StorageMigrationV2: Error migrating v1 to v2:', error);
      throw error;
    }
  }

  /**
   * Verify IndexedDB data is preserved during migration
   * @returns {Promise<Object>} Verification result
   */
  async verifyIndexedDBPreservation() {
    try {
      console.log('StorageMigrationV2: Verifying IndexedDB preservation...');

      // IndexedDB data should not be affected by chrome.storage.local migration
      // This is a verification step to ensure no data loss

      const db = await this.openIndexedDB();
      
      const templateCount = await this.countIndexedDBRecords(db, 'templates');
      const categoryCount = await this.countIndexedDBRecords(db, 'categories');
      const groupCount = await this.countIndexedDBRecords(db, 'groups');

      db.close();

      console.log('StorageMigrationV2: IndexedDB verification complete', {
        templates: templateCount,
        categories: categoryCount,
        groups: groupCount
      });

      return {
        success: true,
        templates: templateCount,
        categories: categoryCount,
        groups: groupCount
      };

    } catch (error) {
      console.error('StorageMigrationV2: Error verifying IndexedDB:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Open IndexedDB connection
   * @returns {Promise<IDBDatabase>}
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AdReplyDB', 1);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in IndexedDB object store
   * @param {IDBDatabase} db - Database connection
   * @param {string} storeName - Object store name
   * @returns {Promise<number>}
   */
  countIndexedDBRecords(db, storeName) {
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(0);
          return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        resolve(0); // Store doesn't exist yet
      }
    });
  }

  /**
   * Get migration status summary
   * @returns {Promise<Object>} Migration status
   */
  async getMigrationStatus() {
    try {
      const currentVersion = await this.detectStorageVersion();
      const settings = await chrome.storage.local.get(['settings']);
      
      return {
        currentVersion,
        isV2: currentVersion === this.STORAGE_VERSION_V2,
        isFreshInstall: currentVersion === this.STORAGE_VERSION_V0,
        isV1User: currentVersion === this.STORAGE_VERSION_V1,
        onboardingCompleted: settings.settings?.onboardingCompleted || false,
        migrationNeeded: currentVersion < this.STORAGE_VERSION_V2
      };

    } catch (error) {
      console.error('StorageMigrationV2: Error getting migration status:', error);
      return {
        currentVersion: 0,
        isV2: false,
        isFreshInstall: true,
        isV1User: false,
        onboardingCompleted: false,
        migrationNeeded: true,
        error: error.message
      };
    }
  }

  /**
   * Perform complete migration with verification
   * @returns {Promise<Object>} Complete migration result
   */
  async performCompleteMigration() {
    try {
      console.log('StorageMigrationV2: Starting complete migration process...');

      // Step 1: Detect current version
      const currentVersion = await this.detectStorageVersion();
      console.log(`StorageMigrationV2: Current version: ${currentVersion}`);

      // Step 2: Verify IndexedDB before migration
      const preMigrationDB = await this.verifyIndexedDBPreservation();
      console.log('StorageMigrationV2: Pre-migration IndexedDB state:', preMigrationDB);

      // Step 3: Perform migration
      const migrationResult = await this.migrateToV2();

      // Step 4: Verify IndexedDB after migration
      const postMigrationDB = await this.verifyIndexedDBPreservation();
      console.log('StorageMigrationV2: Post-migration IndexedDB state:', postMigrationDB);

      // Step 5: Verify data preservation
      const dataPreserved = 
        preMigrationDB.templates === postMigrationDB.templates &&
        preMigrationDB.categories === postMigrationDB.categories &&
        preMigrationDB.groups === postMigrationDB.groups;

      console.log('StorageMigrationV2: Complete migration process finished');

      return {
        success: migrationResult.success,
        fromVersion: currentVersion,
        toVersion: this.STORAGE_VERSION_V2,
        dataPreserved,
        indexedDB: {
          before: preMigrationDB,
          after: postMigrationDB
        },
        ...migrationResult
      };

    } catch (error) {
      console.error('StorageMigrationV2: Complete migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageMigrationV2;
} else if (typeof window !== 'undefined') {
  window.StorageMigrationV2 = StorageMigrationV2;
}
// In service workers, the class is available globally without window
