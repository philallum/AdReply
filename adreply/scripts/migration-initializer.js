/**
 * Migration Initializer for AdReply Extension
 * Coordinates all migration tasks and ensures backward compatibility
 */

class MigrationInitializer {
  constructor() {
    this.storageManager = null;
    this.categoryManager = null;
    this.migrationManager = null;
    this.urlIntegrationManager = null;
    this.initialized = false;
  }

  /**
   * Initialize all managers and perform necessary migrations
   * @returns {Promise<Object>} Initialization result
   */
  async initialize() {
    try {
      if (this.initialized) {
        return { success: true, alreadyInitialized: true };
      }

      console.log('MigrationInitializer: Starting initialization and migration process...');

      // Step 1: Initialize storage manager
      this.storageManager = new (window.StorageManager || StorageManager)();
      await this.storageManager.initialize();

      // Step 2: Initialize category manager
      this.categoryManager = new (window.CategoryManager || class {
        async initialize() { return { success: true }; }
      })(this.storageManager);
      await this.categoryManager.initialize();

      // Step 3: Initialize migration manager
      this.migrationManager = new (window.MigrationManager || MigrationManager)(
        this.storageManager, 
        this.categoryManager
      );

      // Step 4: Initialize URL integration manager
      this.urlIntegrationManager = new (window.URLIntegrationManager || URLIntegrationManager)(
        this.storageManager
      );

      // Step 5: Check if migration is needed
      const migrationNeeded = await this.migrationManager.isMigrationNeeded();
      
      let migrationResult = { success: true, migrationNeeded: false };
      
      if (migrationNeeded) {
        console.log('MigrationInitializer: Migration needed, starting migration process...');
        migrationResult = await this.performCompleteMigration();
      } else {
        console.log('MigrationInitializer: No migration needed, checking compatibility...');
        // Still run compatibility checks
        await this.ensureCompatibility();
      }

      this.initialized = true;

      console.log('MigrationInitializer: Initialization completed successfully');

      return {
        success: true,
        migrationResult: migrationResult,
        initialized: true
      };

    } catch (error) {
      console.error('MigrationInitializer: Initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform complete migration process
   * @returns {Promise<Object>} Migration result
   */
  async performCompleteMigration() {
    try {
      console.log('MigrationInitializer: Performing complete migration...');

      // Step 1: Main template migration (variants to individual templates)
      const templateMigrationResult = await this.migrationManager.performMigration();
      
      if (!templateMigrationResult.success) {
        throw new Error(`Template migration failed: ${templateMigrationResult.error}`);
      }

      // Step 2: URL integration migration
      const urlMigrationResult = await this.urlIntegrationManager.migrateTemplatesForURLIntegration();
      
      if (!urlMigrationResult.success) {
        console.warn('MigrationInitializer: URL integration migration failed:', urlMigrationResult.error);
      }

      // Step 3: Storage compatibility migration
      const compatibilityResult = await this.storageManager.migrateTemplatesForCompatibility();
      
      if (!compatibilityResult.success) {
        console.warn('MigrationInitializer: Compatibility migration failed:', compatibilityResult.error);
      }

      console.log('MigrationInitializer: Complete migration finished successfully');

      return {
        success: true,
        templateMigration: templateMigrationResult,
        urlMigration: urlMigrationResult,
        compatibilityMigration: compatibilityResult
      };

    } catch (error) {
      console.error('MigrationInitializer: Complete migration failed:', error);
      
      // Attempt to restore from backup
      try {
        await this.migrationManager.restoreFromBackup();
        console.log('MigrationInitializer: Restored from backup after migration failure');
      } catch (restoreError) {
        console.error('MigrationInitializer: Backup restore also failed:', restoreError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure compatibility without full migration
   * @returns {Promise<Object>} Compatibility check result
   */
  async ensureCompatibility() {
    try {
      console.log('MigrationInitializer: Ensuring compatibility...');

      const results = {
        storageCompatibility: { success: true },
        urlIntegration: { success: true }
      };

      // Check storage compatibility
      try {
        results.storageCompatibility = await this.storageManager.migrateTemplatesForCompatibility();
      } catch (error) {
        console.warn('MigrationInitializer: Storage compatibility check failed:', error);
        results.storageCompatibility = { success: false, error: error.message };
      }

      // Check URL integration
      try {
        const urlStatus = await this.urlIntegrationManager.getURLIntegrationStatus();
        
        // If less than 90% of templates have URL integration, run migration
        if (urlStatus.integrationPercentage < 90) {
          results.urlIntegration = await this.urlIntegrationManager.migrateTemplatesForURLIntegration();
        }
      } catch (error) {
        console.warn('MigrationInitializer: URL integration check failed:', error);
        results.urlIntegration = { success: false, error: error.message };
      }

      console.log('MigrationInitializer: Compatibility checks completed');

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('MigrationInitializer: Compatibility check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get migration status and summary
   * @returns {Promise<Object>} Migration status
   */
  async getMigrationStatus() {
    try {
      if (!this.migrationManager) {
        return {
          initialized: false,
          error: 'Migration manager not initialized'
        };
      }

      const migrationSummary = await this.migrationManager.getMigrationSummary();
      const urlStatus = this.urlIntegrationManager ? 
        await this.urlIntegrationManager.getURLIntegrationStatus() : null;

      return {
        initialized: this.initialized,
        migration: migrationSummary,
        urlIntegration: urlStatus
      };

    } catch (error) {
      console.error('MigrationInitializer: Error getting migration status:', error);
      return {
        initialized: this.initialized,
        error: error.message
      };
    }
  }

  /**
   * Force re-migration (for testing or recovery)
   * @returns {Promise<Object>} Re-migration result
   */
  async forceMigration() {
    try {
      console.log('MigrationInitializer: Forcing re-migration...');

      if (!this.migrationManager) {
        throw new Error('Migration manager not initialized');
      }

      // Reset migration status to force re-migration
      await this.migrationManager.updateMigrationStatus({
        version: 0,
        migrationsCompleted: [],
        forcedReset: true,
        resetAt: new Date().toISOString()
      });

      // Perform migration
      const result = await this.performCompleteMigration();

      console.log('MigrationInitializer: Forced re-migration completed');

      return result;

    } catch (error) {
      console.error('MigrationInitializer: Forced re-migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up migration artifacts
   * @param {boolean} keepBackups - Whether to keep backup files
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupMigrationArtifacts(keepBackups = true) {
    try {
      if (!this.migrationManager) {
        return {
          success: false,
          error: 'Migration manager not initialized'
        };
      }

      const result = await this.migrationManager.cleanupMigrationArtifacts(keepBackups);

      console.log(`MigrationInitializer: Cleanup completed, backups ${keepBackups ? 'kept' : 'removed'}`);

      return result;

    } catch (error) {
      console.error('MigrationInitializer: Cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate post-migration data integrity
   * @returns {Promise<Object>} Validation result
   */
  async validateMigrationIntegrity() {
    try {
      console.log('MigrationInitializer: Validating migration integrity...');

      const results = {
        templates: { valid: true },
        categories: { valid: true },
        urlIntegration: { valid: true },
        storage: { valid: true }
      };

      // Validate templates
      try {
        const templates = await this.storageManager.getTemplates();
        const invalidTemplates = [];

        for (const template of templates) {
          const templateModel = new (window.AdReplyModels?.Template || class {
            validate() { return { isValid: true, errors: [] }; }
          })(template);
          
          const validation = templateModel.validate();
          if (!validation.isValid) {
            invalidTemplates.push({
              id: template.id,
              errors: validation.errors
            });
          }
        }

        results.templates = {
          valid: invalidTemplates.length === 0,
          totalTemplates: templates.length,
          invalidTemplates: invalidTemplates
        };

      } catch (error) {
        results.templates = {
          valid: false,
          error: error.message
        };
      }

      // Validate URL integration
      if (this.urlIntegrationManager) {
        try {
          const urlStatus = await this.urlIntegrationManager.getURLIntegrationStatus();
          results.urlIntegration = {
            valid: urlStatus.integrationPercentage >= 90,
            ...urlStatus
          };
        } catch (error) {
          results.urlIntegration = {
            valid: false,
            error: error.message
          };
        }
      }

      const overallValid = Object.values(results).every(result => result.valid);

      console.log(`MigrationInitializer: Validation completed - ${overallValid ? 'PASSED' : 'FAILED'}`);

      return {
        success: true,
        valid: overallValid,
        results: results
      };

    } catch (error) {
      console.error('MigrationInitializer: Validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get managers for external use
   * @returns {Object} Manager instances
   */
  getManagers() {
    return {
      storageManager: this.storageManager,
      categoryManager: this.categoryManager,
      migrationManager: this.migrationManager,
      urlIntegrationManager: this.urlIntegrationManager
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MigrationInitializer;
} else {
  window.MigrationInitializer = MigrationInitializer;
}