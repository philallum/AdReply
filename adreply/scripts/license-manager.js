/**
 * License Manager for AdReply Extension
 * Handles JWT token validation, license verification, and feature gating
 */

class LicenseManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.publicKey = null;
    this.licenseServerUrl = 'https://teamhandso.me/api/license';
    this.gracePeriodDays = 7;
    
    // Feature definitions
    this.features = {
      unlimited_templates: { free: false, pro: true },
      ai_integration: { free: false, pro: true },
      ad_packs: { free: false, pro: true },
      priority_support: { free: false, pro: true }
    };
    
    // Template limits
    this.templateLimits = {
      free: 10,
      pro: Infinity
    };
    
    this.initialized = false;
  }

  /**
   * Initialize license manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadPublicKey();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      throw error;
    }
  }

  /**
   * Load public key for JWT verification
   * @returns {Promise<void>}
   */
  async loadPublicKey() {
    // In a real implementation, this would fetch the public key from a secure endpoint
    // For now, we'll use a hardcoded public key (this should be replaced with actual key)
    this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEjWT2btf02VoBtzS9ze4gRZDvHuuBXxxbgLzllS7dxdsYy
i0QhAzFuS0Ag4iKQsE9RF6Dn7fBmVVRtn8R9ipNiPSw36C0jKYEjMZxd+7u8Ux6C
WDgKXSAh1Dk6cXaLV4uvNeDp9Y7VYyoRPiGWWzJs5wMzx4YUtMxXn5FRnlJvNn6j
whB1L0eqsI1L6omyZGZ6s7nyt+TO90ovFoiNjFhh72MGvF/W9+2HVqnQBmpvvqaL
b1Iwi+5aPVo7l9AoHf8Lp7stfn5gQjjeh5NAcVuuQHxHnLn7cQHsUdPiQEpDNWTD
+QIDAQAB
-----END PUBLIC KEY-----`;
  }

  /**
   * Validate JWT token locally
   * @param {string} token - JWT token to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateJWTToken(token) {
    await this.initialize();
    
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        error: 'Invalid token format',
        payload: null
      };
    }

    try {
      // Parse JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          isValid: false,
          error: 'Invalid JWT format',
          payload: null
        };
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // Decode header and payload
      const header = JSON.parse(this.base64UrlDecode(headerB64));
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));
      
      // Verify signature (simplified - in production use crypto.subtle)
      const isSignatureValid = await this.verifySignature(
        `${headerB64}.${payloadB64}`,
        signatureB64
      );
      
      if (!isSignatureValid) {
        return {
          isValid: false,
          error: 'Invalid signature',
          payload: null
        };
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          isValid: false,
          error: 'Token expired',
          payload: payload,
          expired: true
        };
      }
      
      // Check not before
      if (payload.nbf && payload.nbf > now) {
        return {
          isValid: false,
          error: 'Token not yet valid',
          payload: payload
        };
      }
      
      // Validate required claims
      const requiredClaims = ['sub', 'tier', 'exp'];
      for (const claim of requiredClaims) {
        if (!payload[claim]) {
          return {
            isValid: false,
            error: `Missing required claim: ${claim}`,
            payload: payload
          };
        }
      }
      
      return {
        isValid: true,
        error: null,
        payload: payload
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Token parsing failed: ${error.message}`,
        payload: null
      };
    }
  }

  /**
   * Verify JWT signature (simplified implementation)
   * @param {string} data - Data to verify
   * @param {string} signature - Base64 URL encoded signature
   * @returns {Promise<boolean>}
   */
  async verifySignature(data, signature) {
    // In a real implementation, this would use crypto.subtle.verify
    // For now, we'll do a basic validation
    try {
      // Convert signature from base64url to base64
      const signatureBytes = this.base64UrlDecode(signature);
      
      // In production, use:
      // const key = await crypto.subtle.importKey(...)
      // const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
      
      // For now, just check if signature exists and has reasonable length
      return signatureBytes && signatureBytes.length > 100;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Determine license status from token payload
   * @param {Object} payload - JWT payload
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

    const now = new Date();
    const expiryDate = payload.exp ? new Date(payload.exp * 1000) : null;
    
    let status = 'free';
    let tier = payload.tier || 'free';
    
    if (tier === 'pro') {
      if (expiryDate && now > expiryDate) {
        status = 'expired';
      } else {
        status = 'pro';
      }
    }
    
    // Map features based on tier
    const features = [];
    for (const [feature, access] of Object.entries(this.features)) {
      if (access[tier]) {
        features.push(feature);
      }
    }
    
    return {
      status: status,
      tier: tier,
      plan: payload.plan || null,
      features: features,
      expiresAt: expiryDate ? expiryDate.toISOString() : null,
      userId: payload.sub || null
    };
  }

  /**
   * Validate current license
   * @param {string} token - JWT token to validate
   * @returns {Promise<Object>} License validation result
   */
  async validateLicense(token) {
    const validation = await this.validateJWTToken(token);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error,
        license: this.determineLicenseStatus(null)
      };
    }
    
    const licenseStatus = this.determineLicenseStatus(validation.payload);
    
    return {
      isValid: true,
      error: null,
      license: licenseStatus
    };
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature to check
   * @returns {Promise<boolean>}
   */
  async checkFeatureAccess(feature) {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData) {
        return this.features[feature]?.free || false;
      }
      
      // Check if license is still valid (including grace period)
      const isLicenseValid = await this.isLicenseCurrentlyValid(licenseData);
      
      if (!isLicenseValid) {
        return this.features[feature]?.free || false;
      }
      
      return licenseData.features.includes(feature);
    } catch (error) {
      console.error('Feature access check failed:', error);
      return false;
    }
  }

  /**
   * Check if license is currently valid (including grace period)
   * @param {Object} licenseData - License data
   * @returns {Promise<boolean>}
   */
  async isLicenseCurrentlyValid(licenseData) {
    if (!licenseData) return false;
    
    if (licenseData.status === 'revoked') return false;
    if (licenseData.status === 'free') return true;
    
    const now = new Date();
    
    // Check main expiration
    if (licenseData.expiresAt) {
      const expiryDate = new Date(licenseData.expiresAt);
      
      if (now > expiryDate) {
        // Check grace period
        if (licenseData.gracePeriodEnds) {
          const gracePeriodEnd = new Date(licenseData.gracePeriodEnds);
          return now <= gracePeriodEnd;
        }
        return false;
      }
    }
    
    return licenseData.status === 'pro';
  }

  /**
   * Get template limit for current license
   * @returns {Promise<number>}
   */
  async getTemplateLimit() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData) {
        return this.templateLimits.free;
      }
      
      const isValid = await this.isLicenseCurrentlyValid(licenseData);
      
      if (!isValid || licenseData.tier === 'free') {
        return this.templateLimits.free;
      }
      
      return this.templateLimits.pro;
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
      const validation = await this.validateLicense(token);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }
      
      if (validation.license.tier !== 'pro') {
        return {
          success: false,
          error: 'Token is not for Pro tier'
        };
      }
      
      // Save license data
      const licenseData = {
        token: token,
        status: validation.license.status,
        tier: validation.license.tier,
        plan: validation.license.plan,
        expiresAt: validation.license.expiresAt,
        lastValidatedAt: new Date().toISOString(),
        gracePeriodEnds: null,
        features: validation.license.features
      };
      
      await this.storageManager.saveLicenseData(licenseData);
      
      return {
        success: true,
        license: licenseData
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
    const freeLicenseData = {
      token: '',
      status: 'free',
      tier: 'free',
      plan: null,
      expiresAt: null,
      lastValidatedAt: new Date().toISOString(),
      gracePeriodEnds: null,
      features: []
    };
    
    await this.storageManager.saveLicenseData(freeLicenseData);
  }

  /**
   * Get grace period status
   * @returns {Promise<Object>} Grace period information
   */
  async getGracePeriodStatus() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData || !licenseData.gracePeriodEnds) {
        return {
          inGracePeriod: false,
          daysRemaining: 0,
          endsAt: null
        };
      }
      
      const now = new Date();
      const gracePeriodEnd = new Date(licenseData.gracePeriodEnds);
      const daysRemaining = Math.max(0, Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24)));
      
      return {
        inGracePeriod: now <= gracePeriodEnd,
        daysRemaining: daysRemaining,
        endsAt: licenseData.gracePeriodEnds
      };
      
    } catch (error) {
      console.error('Failed to get grace period status:', error);
      return {
        inGracePeriod: false,
        daysRemaining: 0,
        endsAt: null
      };
    }
  }

  /**
   * Start grace period for expired license
   * @returns {Promise<void>}
   */
  async startGracePeriod() {
    try {
      const licenseData = await this.storageManager.getLicenseData();
      
      if (!licenseData) return;
      
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.gracePeriodDays);
      
      licenseData.gracePeriodEnds = gracePeriodEnd.toISOString();
      licenseData.status = 'expired';
      
      await this.storageManager.saveLicenseData(licenseData);
      
    } catch (error) {
      console.error('Failed to start grace period:', error);
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
          gracePeriod: null
        };
      }
      
      const isValid = await this.isLicenseCurrentlyValid(licenseData);
      const gracePeriod = await this.getGracePeriodStatus();
      const templateLimit = await this.getTemplateLimit();
      
      return {
        tier: licenseData.tier,
        status: licenseData.status,
        isValid: isValid,
        features: licenseData.features,
        templateLimit: templateLimit,
        expiresAt: licenseData.expiresAt,
        gracePeriod: gracePeriod.inGracePeriod ? gracePeriod : null
      };
      
    } catch (error) {
      console.error('Failed to get license status summary:', error);
      return {
        tier: 'free',
        status: 'free',
        isValid: true,
        features: [],
        templateLimit: this.templateLimits.free,
        gracePeriod: null
      };
    }
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
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const defaultPayload = {
      sub: 'test-user-123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      iat: Math.floor(Date.now() / 1000),
      iss: 'teamhandso.me'
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
} else {
  window.LicenseManager = LicenseManager;
}