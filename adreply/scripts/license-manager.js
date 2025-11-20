/**
 * License Manager for AdReply Extension
 * Handles JWT token validation, license verification, and feature gating
 * Implements JWT integration as per browser-extension-jwt-integration.md specification
 */

class LicenseManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.apiEndpoint = 'https://teamhandso.me/api/verify';
    this.verificationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.gracePeriodDays = 7;
    
    // Feature definitions
    this.features = {
      unlimited_templates: { free: false, pro: true, admin: true },
      ai_integration: { free: false, pro: true, admin: true },
      ad_packs: { free: false, pro: true, admin: true },
      priority_support: { free: false, pro: true, admin: true }
    };
    
    // Template limits
    this.templateLimits = {
      free: 10,
      pro: Infinity,
      admin: Infinity
    };
    
    this.initialized = false;
    this.token = null;
    this.entitlements = null;
    this.lastVerification = null;
  }

  /**
   * Initialize license manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load stored token and entitlements
      const stored = await this.storageManager.getLicenseData();
      
      if (stored) {
        this.token = stored.token;
        this.entitlements = stored.entitlements;
        this.lastVerification = stored.lastVerification;
      }
      
      this.initialized = true;
      
      // Verify on startup if we have a token
      if (this.token) {
        await this.verify();
      }
      
      // Set up periodic verification
      this.startPeriodicVerification();
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      this.initialized = true; // Continue with free tier
    }
  }

  /**
   * Start periodic license verification
   */
  startPeriodicVerification() {
    setInterval(async () => {
      if (this.token && this.needsVerification()) {
        await this.verify();
      }
    }, this.verificationInterval);
  }

  /**
   * Check if license needs verification
   * @returns {boolean}
   */
  needsVerification() {
    if (!this.lastVerification) return true;
    return Date.now() - this.lastVerification > this.verificationInterval;
  }

  /**
   * Collect device information for fingerprinting
   * @returns {Object} Device info
   */
  collectDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  /**
   * Verify license with server (implements JWT token rotation)
   * @param {boolean} testMode - If true, performs read-only verification without activation
   * @returns {Promise<Object>} Verification result
   */
  async verify(testMode = false) {
    if (!this.token) {
      return { 
        valid: false, 
        error: 'No license token',
        license: this.determineLicenseStatus(null)
      };
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseToken: this.token,
          deviceInfo: this.collectDeviceInfo(),
          testMode
        })
      });

      if (!response.ok) {
        // Handle HTTP errors
        if (response.status === 400) {
          return { valid: false, error: 'Invalid request format' };
        }
        if (response.status === 500) {
          return { valid: false, error: 'Server error. Please try again later.' };
        }
        return { valid: false, error: 'Unexpected error occurred' };
      }

      const result = await response.json();

      if (result.isValid) {
        // Update stored token with rotated token
        this.token = result.rotatedToken;
        this.entitlements = result.entitlements;
        this.lastVerification = Date.now();

        // Save to storage
        await this.storageManager.saveLicenseData({
          token: this.token,
          entitlements: this.entitlements,
          lastVerification: this.lastVerification,
          status: 'pro',
          tier: result.entitlements.plan,
          plan: result.entitlements.plan,
          features: this.getFeaturesByPlan(result.entitlements.plan),
          activationInfo: result.activationInfo
        });

        return {
          valid: true,
          entitlements: result.entitlements,
          activationInfo: result.activationInfo,
          license: this.determineLicenseStatus({ plan: result.entitlements.plan })
        };
      } else {
        // License invalid - clear stored data if not an activation issue
        if (!result.activationInfo) {
          await this.clearLicense();
        }

        return {
          valid: false,
          error: result.message,
          activationInfo: result.activationInfo,
          license: this.determineLicenseStatus(null)
        };
      }
    } catch (error) {
      console.error('License verification failed:', error);
      return {
        valid: false,
        error: 'Network error',
        details: error.message,
        license: this.determineLicenseStatus(null)
      };
    }
  }

  /**
   * Set new license token and verify it
   * @param {string} token - JWT license token
   * @returns {Promise<Object>} Verification result
   */
  async setLicense(token) {
    this.token = token;
    return await this.verify();
  }

  /**
   * Clear license data
   * @returns {Promise<void>}
   */
  async clearLicense() {
    this.token = null;
    this.entitlements = null;
    this.lastVerification = null;
    
    await this.storageManager.saveLicenseData({
      token: '',
      status: 'free',
      tier: 'free',
      plan: null,
      expiresAt: null,
      lastVerification: null,
      features: [],
      entitlements: null,
      activationInfo: null
    });
  }

  /**
   * Get features by plan
   * @param {string} plan - Plan type (pro or admin)
   * @returns {Array<string>} List of available features
   */
  getFeaturesByPlan(plan) {
    const features = [];
    for (const [feature, access] of Object.entries(this.features)) {
      if (access[plan]) {
        features.push(feature);
      }
    }
    return features;
  }

  /**
   * Determine license status from payload
   * @param {Object} payload - License payload (can be JWT payload or entitlements)
   * @returns {Object} License status information
   */
  determineLicenseStatus(payload) {
    if (!payload) {
      return {
        status: 'free',
        tier: 'free',
        plan: null,
        features: [],
        expiresAt: null
      };
    }

    const plan = payload.plan || 'free';
    const features = this.getFeaturesByPlan(plan);
    
    return {
      status: plan === 'free' ? 'free' : 'pro',
      tier: plan,
      plan: plan,
      features: features,
      expiresAt: null, // Server handles expiration
      userId: payload.sub || null
    };
  }

  /**
   * Validate current license (alias for verify)
   * @returns {Promise<Object>} License validation result
   */
  async validateLicense() {
    return await this.verify();
  }

  /**
   * Check if license is currently valid
   * @returns {boolean}
   */
  isValid() {
    return this.token && this.entitlements;
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature to check
   * @returns {Promise<boolean>}
   */
  async checkFeatureAccess(feature) {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData || !licenseData.features) {
        return this.features[feature]?.free || false;
      }
      
      // Check if we need to verify license
      if (this.needsVerification()) {
        await this.verify();
      }
      
      return licenseData.features.includes(feature);
    } catch (error) {
      console.error('Feature access check failed:', error);
      return false;
    }
  }

  /**
   * Check if license is currently valid
   * @param {Object} licenseData - License data (optional, will fetch if not provided)
   * @returns {Promise<boolean>}
   */
  async isLicenseCurrentlyValid(licenseData = null) {
    if (!licenseData) {
      licenseData = await this.storageManager.getLicenseData();
    }
    
    if (!licenseData) return false;
    if (licenseData.status === 'free') return true;
    
    // For pro/admin licenses, check if we have valid entitlements
    return licenseData.status === 'pro' && licenseData.entitlements !== null;
  }

  /**
   * Get template limit for current license
   * @returns {Promise<number>}
   */
  async getTemplateLimit() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData || licenseData.tier === 'free') {
        return this.templateLimits.free;
      }
      
      const isValid = await this.isLicenseCurrentlyValid(licenseData);
      
      if (!isValid) {
        return this.templateLimits.free;
      }
      
      return this.templateLimits[licenseData.tier] || this.templateLimits.free;
    } catch (error) {
      console.error('Failed to get template limit:', error);
      return this.templateLimits.free;
    }
  }

  /**
   * Check if user can add more templates
   * @returns {Promise<boolean>}
   */
  async canAddTemplate() {
    try {
      const [currentCount, limit] = await Promise.all([
        this.storageManager.getTemplateCount(),
        this.getTemplateLimit()
      ]);
      
      return currentCount < limit;
    } catch (error) {
      console.error('Failed to check template capacity:', error);
      return false;
    }
  }

  /**
   * Upgrade to Pro license
   * @param {string} token - New Pro license token
   * @returns {Promise<Object>} Upgrade result
   */
  async upgradeToPro(token) {
    try {
      const result = await this.setLicense(token);
      
      if (!result.valid) {
        return {
          success: false,
          error: result.error,
          activationInfo: result.activationInfo
        };
      }
      
      return {
        success: true,
        license: result.license,
        entitlements: result.entitlements,
        activationInfo: result.activationInfo
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Downgrade license to free tier
   * @returns {Promise<void>}
   */
  async downgradeLicense() {
    await this.clearLicense();
  }

  /**
   * Deactivate license on current device
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateLicense() {
    if (!this.token) {
      return {
        success: false,
        error: 'No license token found'
      };
    }

    try {
      const response = await fetch('https://teamhandso.me/api/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseToken: this.token,
          deviceInfo: this.collectDeviceInfo()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Clear stored license token
        await this.clearLicense();
        
        return {
          success: true,
          message: result.message,
          activationInfo: result.activationInfo
        };
      } else {
        return {
          success: false,
          error: result.message || 'Deactivation failed',
          errorCode: result.error
        };
      }
    } catch (error) {
      console.error('License deactivation failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        errorCode: 'NETWORK_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Get activation info
   * @returns {Promise<Object>} Activation information
   */
  async getActivationInfo() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData || !licenseData.activationInfo) {
        return null;
      }
      
      return licenseData.activationInfo;
      
    } catch (error) {
      console.error('Failed to get activation info:', error);
      return null;
    }
  }

  /**
   * Get current license status summary
   * @returns {Promise<Object>} License status summary
   */
  async getLicenseStatusSummary() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData) {
        return {
          tier: 'free',
          status: 'free',
          isValid: true,
          features: [],
          templateLimit: this.templateLimits.free,
          activationInfo: null,
          entitlements: null
        };
      }
      
      const isValid = await this.isLicenseCurrentlyValid(licenseData);
      const templateLimit = await this.getTemplateLimit();
      
      return {
        tier: licenseData.tier || 'free',
        status: licenseData.status || 'free',
        isValid: isValid,
        features: licenseData.features || [],
        templateLimit: templateLimit,
        activationInfo: licenseData.activationInfo || null,
        entitlements: licenseData.entitlements || null
      };
      
    } catch (error) {
      console.error('Failed to get license status summary:', error);
      return {
        tier: 'free',
        status: 'free',
        isValid: true,
        features: [],
        templateLimit: this.templateLimits.free,
        activationInfo: null,
        entitlements: null
      };
    }
  }

  /**
   * Get entitlements
   * @returns {Object|null} Current entitlements
   */
  getEntitlements() {
    return this.entitlements;
  }

  // Utility methods

  /**
   * Base64 URL decode
   * @param {string} str - Base64 URL encoded string
   * @returns {string} Decoded string
   */
  base64UrlDecode(str) {
    // Convert base64url to base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (str.length % 4) {
      str += '=';
    }
    
    try {
      return atob(str);
    } catch (error) {
      throw new Error('Invalid base64 encoding');
    }
  }

  /**
   * Generate a test JWT token (for development/testing only)
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateTestToken(payload = {}) {
    const header = {
      alg: 'ES256',
      typ: 'JWT'
    };
    
    const defaultPayload = {
      iss: 'ExtensionPro by Team Handsome',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (370 * 24 * 60 * 60), // 370 days
      sub: 'lic_test123',
      uid: 'user_test123',
      ext: 'adreply',
      plan: 'pro',
      purchaseDate: new Date().toISOString(),
      isAdmin: false,
      licenseType: 'one-time'
    };
    
    const finalPayload = { ...defaultPayload, ...payload };
    
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(finalPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signature = btoa('fake-signature-for-testing').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    return `${headerB64}.${payloadB64}.${signature}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicenseManager;
} else if (typeof window !== 'undefined') {
  window.LicenseManager = LicenseManager;
}
// In service workers, the class is available globally without window