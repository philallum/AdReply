/**
 * Chrome Storage Manager for AdReply Extension
 * Handles settings and license data using chrome.storage.local with encryption for sensitive data
 */

class ChromeStorageManager {
  constructor() {
    this.storageKeys = {
      SETTINGS: 'adreply_settings',
      LICENSE: 'adreply_license',
      AI_SETTINGS: 'adreply_ai_settings'
    };
    
    // Default settings
    this.defaultSettings = {
      ui: {
        sidebarWidth: 320,
        theme: 'light',
        showUpgradePrompts: true
      },
      templates: {
        maxSuggestions: 3,
        enableRotation: true,
        preventRepetition: true
      }
    };
    
    this.defaultAISettings = {
      provider: 'off', // 'off', 'gemini', 'openai'
      geminiApiKey: '',
      openaiApiKey: '',
      enabled: false
    };
  }

  /**
   * Check if Chrome storage API is available
   * @returns {boolean}
   */
  isAvailable() {
    return typeof chrome !== 'undefined' && 
           chrome.storage && 
           chrome.storage.local;
  }

  /**
   * Get data from Chrome storage with error handling
   * @param {string|string[]} keys - Storage key(s) to retrieve
   * @returns {Promise<Object>}
   */
  async get(keys) {
    if (!this.isAvailable()) {
      throw new Error('Chrome storage API not available');
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Chrome storage get failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Set data in Chrome storage with error handling
   * @param {Object} data - Data to store
   * @returns {Promise<void>}
   */
  async set(data) {
    if (!this.isAvailable()) {
      throw new Error('Chrome storage API not available');
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Chrome storage set failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove data from Chrome storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    if (!this.isAvailable()) {
      throw new Error('Chrome storage API not available');
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Chrome storage remove failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear all Chrome storage data
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.isAvailable()) {
      throw new Error('Chrome storage API not available');
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Chrome storage clear failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  // ===== SETTINGS MANAGEMENT =====

  /**
   * Get user settings with defaults
   * @returns {Promise<Object>}
   */
  async getSettings() {
    try {
      const result = await this.get(this.storageKeys.SETTINGS);
      const settings = result[this.storageKeys.SETTINGS];
      
      // Merge with defaults to ensure all properties exist
      return this.mergeWithDefaults(settings, this.defaultSettings);
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      return { ...this.defaultSettings };
    }
  }

  /**
   * Save user settings
   * @param {Object} settings - Settings object to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    // Validate settings structure
    this.validateSettings(settings);
    
    // Sanitize settings data
    const sanitizedSettings = this.sanitizeSettings(settings);
    
    await this.set({
      [this.storageKeys.SETTINGS]: sanitizedSettings
    });
  }

  /**
   * Update specific setting value
   * @param {string} path - Dot notation path (e.g., 'ui.theme')
   * @param {any} value - Value to set
   * @returns {Promise<void>}
   */
  async updateSetting(path, value) {
    const settings = await this.getSettings();
    this.setNestedProperty(settings, path, value);
    await this.saveSettings(settings);
  }

  // ===== AI SETTINGS MANAGEMENT =====

  /**
   * Get AI settings with defaults
   * @returns {Promise<Object>}
   */
  async getAISettings() {
    try {
      const result = await this.get(this.storageKeys.AI_SETTINGS);
      const aiSettings = result[this.storageKeys.AI_SETTINGS];
      
      if (!aiSettings) {
        return { ...this.defaultAISettings };
      }
      
      // Decrypt API keys if they exist
      const decryptedSettings = { ...aiSettings };
      if (decryptedSettings.geminiApiKey) {
        decryptedSettings.geminiApiKey = this.decrypt(decryptedSettings.geminiApiKey);
      }
      if (decryptedSettings.openaiApiKey) {
        decryptedSettings.openaiApiKey = this.decrypt(decryptedSettings.openaiApiKey);
      }
      
      return this.mergeWithDefaults(decryptedSettings, this.defaultAISettings);
    } catch (error) {
      console.warn('Failed to load AI settings, using defaults:', error);
      return { ...this.defaultAISettings };
    }
  }

  /**
   * Save AI settings with API key encryption
   * @param {Object} aiSettings - AI settings to save
   * @returns {Promise<void>}
   */
  async saveAISettings(aiSettings) {
    // Validate AI settings
    this.validateAISettings(aiSettings);
    
    // Encrypt API keys before storage
    const encryptedSettings = { ...aiSettings };
    if (encryptedSettings.geminiApiKey) {
      encryptedSettings.geminiApiKey = this.encrypt(encryptedSettings.geminiApiKey);
    }
    if (encryptedSettings.openaiApiKey) {
      encryptedSettings.openaiApiKey = this.encrypt(encryptedSettings.openaiApiKey);
    }
    
    await this.set({
      [this.storageKeys.AI_SETTINGS]: encryptedSettings
    });
  }

  // ===== LICENSE MANAGEMENT =====

  /**
   * Get license data
   * @returns {Promise<Object|null>}
   */
  async getLicenseData() {
    try {
      const result = await this.get(this.storageKeys.LICENSE);
      const licenseData = result[this.storageKeys.LICENSE];
      
      if (!licenseData) {
        return null;
      }
      
      // Decrypt sensitive license data
      const decryptedData = { ...licenseData };
      if (decryptedData.token) {
        decryptedData.token = this.decrypt(decryptedData.token);
      }
      
      return decryptedData;
    } catch (error) {
      console.error('Failed to load license data:', error);
      return null;
    }
  }

  /**
   * Save license data with encryption
   * @param {Object} licenseData - License data to save
   * @returns {Promise<void>}
   */
  async saveLicenseData(licenseData) {
    // Validate license data
    this.validateLicenseData(licenseData);
    
    // Encrypt sensitive data
    const encryptedData = { ...licenseData };
    if (encryptedData.token) {
      encryptedData.token = this.encrypt(encryptedData.token);
    }
    
    await this.set({
      [this.storageKeys.LICENSE]: encryptedData
    });
  }

  /**
   * Get license status
   * @returns {Promise<string>} - 'free', 'pro', 'expired', 'revoked'
   */
  async getLicenseStatus() {
    const licenseData = await this.getLicenseData();
    
    if (!licenseData) {
      return 'free';
    }
    
    // Check if license is expired
    if (licenseData.expiresAt) {
      const expiryDate = new Date(licenseData.expiresAt);
      const now = new Date();
      
      if (now > expiryDate) {
        // Check grace period
        if (licenseData.gracePeriodEnds) {
          const gracePeriodEnd = new Date(licenseData.gracePeriodEnds);
          if (now > gracePeriodEnd) {
            return 'expired';
          }
        } else {
          return 'expired';
        }
      }
    }
    
    return licenseData.status || 'free';
  }

  /**
   * Clear license data (for logout/reset)
   * @returns {Promise<void>}
   */
  async clearLicenseData() {
    await this.remove(this.storageKeys.LICENSE);
  }

  // ===== VALIDATION METHODS =====

  /**
   * Validate settings structure
   * @param {Object} settings - Settings to validate
   * @throws {Error} If validation fails
   */
  validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings must be an object');
    }
    
    // Validate UI settings
    if (settings.ui) {
      if (settings.ui.sidebarWidth && (typeof settings.ui.sidebarWidth !== 'number' || settings.ui.sidebarWidth < 200 || settings.ui.sidebarWidth > 600)) {
        throw new Error('Sidebar width must be a number between 200 and 600');
      }
      
      if (settings.ui.theme && !['light', 'dark'].includes(settings.ui.theme)) {
        throw new Error('Theme must be "light" or "dark"');
      }
    }
    
    // Validate template settings
    if (settings.templates) {
      if (settings.templates.maxSuggestions && (typeof settings.templates.maxSuggestions !== 'number' || settings.templates.maxSuggestions < 1 || settings.templates.maxSuggestions > 10)) {
        throw new Error('Max suggestions must be a number between 1 and 10');
      }
    }
  }

  /**
   * Validate AI settings structure
   * @param {Object} aiSettings - AI settings to validate
   * @throws {Error} If validation fails
   */
  validateAISettings(aiSettings) {
    if (!aiSettings || typeof aiSettings !== 'object') {
      throw new Error('AI settings must be an object');
    }
    
    if (aiSettings.provider && !['off', 'gemini', 'openai'].includes(aiSettings.provider)) {
      throw new Error('AI provider must be "off", "gemini", or "openai"');
    }
    
    if (aiSettings.geminiApiKey && typeof aiSettings.geminiApiKey !== 'string') {
      throw new Error('Gemini API key must be a string');
    }
    
    if (aiSettings.openaiApiKey && typeof aiSettings.openaiApiKey !== 'string') {
      throw new Error('OpenAI API key must be a string');
    }
  }

  /**
   * Validate license data structure
   * @param {Object} licenseData - License data to validate
   * @throws {Error} If validation fails
   */
  validateLicenseData(licenseData) {
    if (!licenseData || typeof licenseData !== 'object') {
      throw new Error('License data must be an object');
    }
    
    if (licenseData.status && !['free', 'pro', 'expired', 'revoked'].includes(licenseData.status)) {
      throw new Error('License status must be "free", "pro", "expired", or "revoked"');
    }
    
    if (licenseData.tier && !['free', 'pro'].includes(licenseData.tier)) {
      throw new Error('License tier must be "free" or "pro"');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Merge settings with defaults
   * @param {Object} settings - User settings
   * @param {Object} defaults - Default settings
   * @returns {Object} Merged settings
   */
  mergeWithDefaults(settings, defaults) {
    if (!settings) return { ...defaults };
    
    const merged = { ...defaults };
    
    for (const key in settings) {
      if (typeof settings[key] === 'object' && !Array.isArray(settings[key]) && settings[key] !== null) {
        merged[key] = this.mergeWithDefaults(settings[key], defaults[key] || {});
      } else {
        merged[key] = settings[key];
      }
    }
    
    return merged;
  }

  /**
   * Set nested property using dot notation
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot notation path
   * @param {any} value - Value to set
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Sanitize settings data
   * @param {Object} settings - Settings to sanitize
   * @returns {Object} Sanitized settings
   */
  sanitizeSettings(settings) {
    const sanitized = JSON.parse(JSON.stringify(settings));
    
    // Sanitize string values
    const sanitizeStrings = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeStrings(obj[key]);
        }
      }
    };
    
    sanitizeStrings(sanitized);
    return sanitized;
  }

  /**
   * Simple encryption for API keys (basic obfuscation)
   * Note: This is basic obfuscation, not cryptographically secure
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    if (!text) return '';
    
    // Simple XOR cipher with a key derived from extension ID
    const key = 'adreply_extension_key_2024';
    let encrypted = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Simple decryption for API keys
   * @param {string} encryptedText - Encrypted text to decrypt
   * @returns {string} Decrypted text
   */
  decrypt(encryptedText) {
    if (!encryptedText) return '';
    
    try {
      const key = 'adreply_extension_key_2024';
      const encrypted = atob(encryptedText); // Base64 decode
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return '';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChromeStorageManager;
} else if (typeof window !== 'undefined') {
  window.ChromeStorageManager = ChromeStorageManager;
}
// In service workers, the class is available globally without window