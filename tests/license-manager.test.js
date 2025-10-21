/**
 * Unit Tests for License Manager
 * Tests JWT validation, license verification, and feature gating
 */

// Test suite for License Manager
async function runLicenseManagerTests() {
  const runner = new TestRunner();
  
  // Mock storage manager for license tests
  const mockStorageManager = {
    licenseData: null,
    
    async getLicenseData() {
      return this.licenseData;
    },
    
    async saveLicenseData(data) {
      this.licenseData = data;
    },
    
    async getTemplateCount() {
      return this.templateCount || 0;
    },
    
    setTemplateCount(count) {
      this.templateCount = count;
    },
    
    clear() {
      this.licenseData = null;
      this.templateCount = 0;
    }
  };

  // Test: JWT Token Validation
  runner.test('LicenseManager - Validate JWT token structure', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test invalid token formats
    const invalidTokens = [
      null,
      '',
      'invalid.token',
      'invalid.token.format.extra',
      'not-a-jwt-token'
    ];
    
    for (const token of invalidTokens) {
      const result = await licenseManager.validateJWTToken(token);
      Assert.false(result.isValid, `Should reject invalid token: ${token}`);
    }
  });

  // Test: JWT Token Parsing
  runner.test('LicenseManager - Parse valid JWT token', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Create a test token with valid structure
    const testPayload = {
      sub: 'test-user-123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000)
    };
    
    const testToken = licenseManager.generateTestToken(testPayload);
    const result = await licenseManager.validateJWTToken(testToken);
    
    Assert.true(result.isValid, 'Should validate test token');
    Assert.equal(result.payload.sub, testPayload.sub, 'Should parse subject');
    Assert.equal(result.payload.tier, testPayload.tier, 'Should parse tier');
    Assert.equal(result.payload.plan, testPayload.plan, 'Should parse plan');
  });

  // Test: Token Expiration Validation
  runner.test('LicenseManager - Validate token expiration', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Create expired token
    const expiredPayload = {
      sub: 'test-user-123',
      tier: 'pro',
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    };
    
    const expiredToken = licenseManager.generateTestToken(expiredPayload);
    const result = await licenseManager.validateJWTToken(expiredToken);
    
    Assert.false(result.isValid, 'Should reject expired token');
    Assert.true(result.expired, 'Should indicate token is expired');
    Assert.equal(result.error, 'Token expired', 'Should provide expiration error');
  });

  // Test: License Status Determination
  runner.test('LicenseManager - Determine license status from payload', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test Pro license
    const proPayload = {
      sub: 'test-user-123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const proStatus = licenseManager.determineLicenseStatus(proPayload);
    Assert.equal(proStatus.status, 'pro', 'Should determine Pro status');
    Assert.equal(proStatus.tier, 'pro', 'Should set Pro tier');
    Assert.includes(proStatus.features, 'unlimited_templates', 'Should include Pro features');
    Assert.includes(proStatus.features, 'ai_integration', 'Should include AI features');
    
    // Test free license (null payload)
    const freeStatus = licenseManager.determineLicenseStatus(null);
    Assert.equal(freeStatus.status, 'free', 'Should determine free status');
    Assert.equal(freeStatus.tier, 'free', 'Should set free tier');
    Assert.equal(freeStatus.features.length, 0, 'Should have no Pro features');
  });

  // Test: Feature Access Control
  runner.test('LicenseManager - Control feature access based on license', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test with no license (free tier)
    mockStorageManager.clear();
    
    let hasAI = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.false(hasAI, 'Free tier should not have AI access');
    
    let hasUnlimited = await licenseManager.checkFeatureAccess('unlimited_templates');
    Assert.false(hasUnlimited, 'Free tier should not have unlimited templates');
    
    // Test with Pro license
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration', 'ad_packs'],
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    hasAI = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.true(hasAI, 'Pro tier should have AI access');
    
    hasUnlimited = await licenseManager.checkFeatureAccess('unlimited_templates');
    Assert.true(hasUnlimited, 'Pro tier should have unlimited templates');
  });

  // Test: Template Limits
  runner.test('LicenseManager - Enforce template limits based on license', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test free tier limit
    mockStorageManager.clear();
    
    let limit = await licenseManager.getTemplateLimit();
    Assert.equal(limit, 10, 'Free tier should have 10 template limit');
    
    // Test with 5 templates - should allow more
    mockStorageManager.setTemplateCount(5);
    let canAdd = await licenseManager.canAddTemplate();
    Assert.true(canAdd, 'Should allow adding templates under limit');
    
    // Test with 10 templates - should not allow more
    mockStorageManager.setTemplateCount(10);
    canAdd = await licenseManager.canAddTemplate();
    Assert.false(canAdd, 'Should not allow adding templates at limit');
    
    // Test Pro tier - unlimited
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates'],
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    limit = await licenseManager.getTemplateLimit();
    Assert.equal(limit, Infinity, 'Pro tier should have unlimited templates');
    
    mockStorageManager.setTemplateCount(1000);
    canAdd = await licenseManager.canAddTemplate();
    Assert.true(canAdd, 'Pro tier should always allow adding templates');
  });

  // Test: License Upgrade
  runner.test('LicenseManager - Upgrade to Pro license', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Create valid Pro token
    const proPayload = {
      sub: 'test-user-123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    
    const proToken = licenseManager.generateTestToken(proPayload);
    
    // Upgrade to Pro
    const result = await licenseManager.upgradeToPro(proToken);
    
    Assert.true(result.success, 'Should successfully upgrade to Pro');
    Assert.equal(result.license.tier, 'pro', 'Should set Pro tier');
    Assert.equal(result.license.status, 'pro', 'Should set Pro status');
    
    // Verify license is saved
    const savedLicense = await mockStorageManager.getLicenseData();
    Assert.equal(savedLicense.tier, 'pro', 'Should save Pro license');
  });

  // Test: License Downgrade
  runner.test('LicenseManager - Downgrade to free license', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Start with Pro license
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration']
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    // Downgrade to free
    await licenseManager.downgradeLicense();
    
    const license = await mockStorageManager.getLicenseData();
    Assert.equal(license.status, 'free', 'Should downgrade to free status');
    Assert.equal(license.tier, 'free', 'Should downgrade to free tier');
    Assert.equal(license.features.length, 0, 'Should remove Pro features');
  });

  // Test: Grace Period Management
  runner.test('LicenseManager - Manage grace period for expired licenses', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Create expired license without grace period
    const expiredLicense = {
      status: 'expired',
      tier: 'pro',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      gracePeriodEnds: null
    };
    
    await mockStorageManager.saveLicenseData(expiredLicense);
    
    // Start grace period
    await licenseManager.startGracePeriod();
    
    const updatedLicense = await mockStorageManager.getLicenseData();
    Assert.true(updatedLicense.gracePeriodEnds !== null, 'Should set grace period end date');
    
    // Check grace period status
    const gracePeriod = await licenseManager.getGracePeriodStatus();
    Assert.true(gracePeriod.inGracePeriod, 'Should be in grace period');
    Assert.greaterThan(gracePeriod.daysRemaining, 0, 'Should have days remaining');
  });

  // Test: License Validity with Grace Period
  runner.test('LicenseManager - Validate license with grace period', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Create license in grace period
    const gracePeriodEnd = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
    const graceLicense = {
      status: 'expired',
      tier: 'pro',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
      gracePeriodEnds: gracePeriodEnd.toISOString(),
      features: ['unlimited_templates', 'ai_integration']
    };
    
    await mockStorageManager.saveLicenseData(graceLicense);
    
    // Should still have access during grace period
    const isValid = await licenseManager.isLicenseCurrentlyValid(graceLicense);
    Assert.true(isValid, 'Should be valid during grace period');
    
    const hasAI = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.true(hasAI, 'Should have Pro features during grace period');
  });

  // Test: License Status Summary
  runner.test('LicenseManager - Get comprehensive license status', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test free license summary
    mockStorageManager.clear();
    
    let summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'free', 'Should show free tier');
    Assert.equal(summary.status, 'free', 'Should show free status');
    Assert.true(summary.isValid, 'Free license should be valid');
    Assert.equal(summary.templateLimit, 10, 'Should show free template limit');
    
    // Test Pro license summary
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration'],
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'pro', 'Should show Pro tier');
    Assert.equal(summary.status, 'pro', 'Should show Pro status');
    Assert.true(summary.isValid, 'Pro license should be valid');
    Assert.equal(summary.templateLimit, Infinity, 'Should show unlimited templates');
    Assert.includes(summary.features, 'ai_integration', 'Should list Pro features');
  });

  // Test: Invalid License Handling
  runner.test('LicenseManager - Handle invalid license gracefully', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test with invalid token
    const invalidResult = await licenseManager.validateLicense('invalid-token');
    Assert.false(invalidResult.isValid, 'Should reject invalid token');
    Assert.equal(invalidResult.license.status, 'free', 'Should default to free license');
    
    // Test upgrade with invalid token
    const upgradeResult = await licenseManager.upgradeToPro('invalid-token');
    Assert.false(upgradeResult.success, 'Should fail to upgrade with invalid token');
    Assert.true(upgradeResult.error.length > 0, 'Should provide error message');
  });

  // Test: Base64 URL Decoding
  runner.test('LicenseManager - Decode base64 URL strings', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test valid base64url string
    const testString = 'Hello World!';
    const encoded = btoa(testString).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const decoded = licenseManager.base64UrlDecode(encoded);
    
    Assert.equal(decoded, testString, 'Should decode base64url correctly');
    
    // Test invalid base64url string
    try {
      licenseManager.base64UrlDecode('invalid-base64url-string!!!');
      Assert.true(false, 'Should throw error for invalid base64url');
    } catch (error) {
      Assert.true(error.message.includes('Invalid base64'), 'Should throw base64 error');
    }
  });

  // Test: Error Handling
  runner.test('LicenseManager - Handle errors gracefully', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Mock storage error
    const originalGetLicenseData = mockStorageManager.getLicenseData;
    mockStorageManager.getLicenseData = async () => {
      throw new Error('Storage error');
    };
    
    // Should handle storage errors gracefully
    const hasFeature = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.false(hasFeature, 'Should return false on storage error');
    
    const summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'free', 'Should default to free on error');
    
    // Restore original method
    mockStorageManager.getLicenseData = originalGetLicenseData;
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runLicenseManagerTests = runLicenseManagerTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runLicenseManagerTests;
}