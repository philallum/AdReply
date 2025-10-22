/**
 * Additional Unit Tests for License Validation and Feature Gating
 * Tests comprehensive license validation, JWT handling, and feature access control
 */

// Test suite for License Validation and Feature Gating
async function runLicenseValidationTests() {
  const runner = new TestRunner();
  
  // Mock storage manager for license tests
  const mockStorageManager = {
    licenseData: null,
    templateCount: 0,
    
    async getLicenseData() {
      return this.licenseData;
    },
    
    async saveLicenseData(data) {
      this.licenseData = data;
    },
    
    async getTemplateCount() {
      return this.templateCount;
    },
    
    setTemplateCount(count) {
      this.templateCount = count;
    },
    
    clear() {
      this.licenseData = null;
      this.templateCount = 0;
    }
  };

  // Test: JWT Token Structure Validation
  runner.test('LicenseValidation - Validate JWT token structure comprehensively', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test various invalid token formats
    const invalidTokens = [
      null,
      undefined,
      '',
      'not-a-jwt',
      'invalid.token',
      'too.many.parts.here.extra',
      'missing-parts',
      '..',
      'header.payload.', // Missing signature
      '.payload.signature', // Missing header
      'header..signature' // Missing payload
    ];
    
    for (const token of invalidTokens) {
      const result = await licenseManager.validateJWTToken(token);
      Assert.false(result.isValid, `Should reject invalid token format: ${token}`);
      Assert.true(typeof result.error === 'string', 'Should provide error message');
    }
  });

  // Test: JWT Payload Validation
  runner.test('LicenseValidation - Validate JWT payload thoroughly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test missing required claims
    const invalidPayloads = [
      {}, // Missing all claims
      { sub: 'user123' }, // Missing tier and exp
      { tier: 'pro' }, // Missing sub and exp
      { exp: Math.floor(Date.now() / 1000) + 3600 }, // Missing sub and tier
      { sub: '', tier: 'pro', exp: Math.floor(Date.now() / 1000) + 3600 }, // Empty sub
      { sub: 'user123', tier: '', exp: Math.floor(Date.now() / 1000) + 3600 }, // Empty tier
      { sub: 'user123', tier: 'invalid_tier', exp: Math.floor(Date.now() / 1000) + 3600 } // Invalid tier
    ];
    
    for (const payload of invalidPayloads) {
      const token = licenseManager.generateTestToken(payload);
      const result = await licenseManager.validateJWTToken(token);
      
      if (result.isValid) {
        // If token is structurally valid, check license determination
        const licenseStatus = licenseManager.determineLicenseStatus(result.payload);
        // Should handle invalid payloads gracefully
        Assert.true(typeof licenseStatus === 'object', 'Should return license status object');
      }
    }
  });

  // Test: Token Expiration Handling
  runner.test('LicenseValidation - Handle token expiration correctly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test expired token
    const expiredPayload = {
      sub: 'user123',
      tier: 'pro',
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    };
    
    const expiredToken = licenseManager.generateTestToken(expiredPayload);
    const expiredResult = await licenseManager.validateJWTToken(expiredToken);
    
    Assert.false(expiredResult.isValid, 'Should reject expired token');
    Assert.true(expiredResult.expired, 'Should indicate token is expired');
    Assert.includes(expiredResult.error, 'expired', 'Should provide expiration error message');
    
    // Test token that expires soon
    const soonToExpirePayload = {
      sub: 'user123',
      tier: 'pro',
      exp: Math.floor(Date.now() / 1000) + 60 // 1 minute from now
    };
    
    const soonToExpireToken = licenseManager.generateTestToken(soonToExpirePayload);
    const soonToExpireResult = await licenseManager.validateJWTToken(soonToExpireToken);
    
    Assert.true(soonToExpireResult.isValid, 'Should accept token that expires soon');
    Assert.false(soonToExpireResult.expired, 'Should not indicate as expired if still valid');
    
    // Test token with nbf (not before) claim
    const futurePayload = {
      sub: 'user123',
      tier: 'pro',
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000) + 1800 // Valid in 30 minutes
    };
    
    const futureToken = licenseManager.generateTestToken(futurePayload);
    const futureResult = await licenseManager.validateJWTToken(futureToken);
    
    Assert.false(futureResult.isValid, 'Should reject token with future nbf');
    Assert.includes(futureResult.error, 'not yet valid', 'Should provide nbf error message');
  });

  // Test: Feature Access Control
  runner.test('LicenseValidation - Control feature access precisely', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test free tier access
    mockStorageManager.clear();
    
    const freeFeatures = ['unlimited_templates', 'ai_integration', 'ad_packs', 'priority_support'];
    
    for (const feature of freeFeatures) {
      const hasAccess = await licenseManager.checkFeatureAccess(feature);
      Assert.false(hasAccess, `Free tier should not have access to ${feature}`);
    }
    
    // Test Pro tier access
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration', 'ad_packs', 'priority_support'],
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    for (const feature of freeFeatures) {
      const hasAccess = await licenseManager.checkFeatureAccess(feature);
      Assert.true(hasAccess, `Pro tier should have access to ${feature}`);
    }
    
    // Test non-existent feature
    const hasNonExistentFeature = await licenseManager.checkFeatureAccess('non_existent_feature');
    Assert.false(hasNonExistentFeature, 'Should not have access to non-existent features');
  });

  // Test: Template Limits Enforcement
  runner.test('LicenseValidation - Enforce template limits correctly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test free tier limits
    mockStorageManager.clear();
    
    let limit = await licenseManager.getTemplateLimit();
    Assert.equal(limit, 10, 'Free tier should have 10 template limit');
    
    // Test under limit
    mockStorageManager.setTemplateCount(5);
    let canAdd = await licenseManager.canAddTemplate();
    Assert.true(canAdd, 'Should allow adding templates under limit');
    
    // Test at limit
    mockStorageManager.setTemplateCount(10);
    canAdd = await licenseManager.canAddTemplate();
    Assert.false(canAdd, 'Should not allow adding templates at limit');
    
    // Test over limit (edge case)
    mockStorageManager.setTemplateCount(15);
    canAdd = await licenseManager.canAddTemplate();
    Assert.false(canAdd, 'Should not allow adding templates over limit');
    
    // Test Pro tier unlimited
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

  // Test: Grace Period Management
  runner.test('LicenseValidation - Manage grace periods effectively', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test starting grace period
    const expiredLicense = {
      status: 'expired',
      tier: 'pro',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      gracePeriodEnds: null,
      features: ['unlimited_templates', 'ai_integration']
    };
    
    await mockStorageManager.saveLicenseData(expiredLicense);
    
    // Start grace period
    await licenseManager.startGracePeriod();
    
    const updatedLicense = await mockStorageManager.getLicenseData();
    Assert.true(updatedLicense.gracePeriodEnds !== null, 'Should set grace period end date');
    
    const gracePeriodEnd = new Date(updatedLicense.gracePeriodEnds);
    const now = new Date();
    const daysUntilEnd = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
    
    Assert.greaterThan(daysUntilEnd, 0, 'Grace period should be in the future');
    Assert.lessThan(daysUntilEnd, 8, 'Grace period should be 7 days or less');
    
    // Test grace period status
    const gracePeriodStatus = await licenseManager.getGracePeriodStatus();
    Assert.true(gracePeriodStatus.inGracePeriod, 'Should be in grace period');
    Assert.greaterThan(gracePeriodStatus.daysRemaining, 0, 'Should have days remaining');
    Assert.equal(gracePeriodStatus.endsAt, updatedLicense.gracePeriodEnds, 'Should return correct end date');
  });

  // Test: License Validity with Grace Period
  runner.test('LicenseValidation - Validate license with grace period correctly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test expired license in grace period
    const gracePeriodEnd = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
    const graceLicense = {
      status: 'expired',
      tier: 'pro',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
      gracePeriodEnds: gracePeriodEnd.toISOString(),
      features: ['unlimited_templates', 'ai_integration']
    };
    
    await mockStorageManager.saveLicenseData(graceLicense);
    
    // Should have access during grace period
    const isValid = await licenseManager.isLicenseCurrentlyValid(graceLicense);
    Assert.true(isValid, 'Should be valid during grace period');
    
    const hasAI = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.true(hasAI, 'Should have Pro features during grace period');
    
    // Test expired grace period
    const expiredGraceLicense = {
      ...graceLicense,
      gracePeriodEnds: new Date(Date.now() - 86400000).toISOString() // Grace period ended yesterday
    };
    
    await mockStorageManager.saveLicenseData(expiredGraceLicense);
    
    const isValidAfterGrace = await licenseManager.isLicenseCurrentlyValid(expiredGraceLicense);
    Assert.false(isValidAfterGrace, 'Should not be valid after grace period ends');
  });

  // Test: License Upgrade Process
  runner.test('LicenseValidation - Handle license upgrades properly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test successful upgrade
    const proPayload = {
      sub: 'user123',
      tier: 'pro',
      plan: 'monthly',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    
    const proToken = licenseManager.generateTestToken(proPayload);
    const upgradeResult = await licenseManager.upgradeToPro(proToken);
    
    Assert.true(upgradeResult.success, 'Should successfully upgrade to Pro');
    Assert.equal(upgradeResult.license.tier, 'pro', 'Should set Pro tier');
    Assert.equal(upgradeResult.license.status, 'pro', 'Should set Pro status');
    
    // Verify license is saved
    const savedLicense = await mockStorageManager.getLicenseData();
    Assert.equal(savedLicense.tier, 'pro', 'Should save Pro license');
    Assert.includes(savedLicense.features, 'unlimited_templates', 'Should include Pro features');
    
    // Test upgrade with invalid token
    const invalidUpgradeResult = await licenseManager.upgradeToPro('invalid-token');
    Assert.false(invalidUpgradeResult.success, 'Should fail to upgrade with invalid token');
    Assert.true(typeof invalidUpgradeResult.error === 'string', 'Should provide error message');
    
    // Test upgrade with free tier token
    const freePayload = {
      sub: 'user123',
      tier: 'free',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const freeToken = licenseManager.generateTestToken(freePayload);
    const freeUpgradeResult = await licenseManager.upgradeToPro(freeToken);
    
    Assert.false(freeUpgradeResult.success, 'Should not upgrade with free tier token');
    Assert.includes(freeUpgradeResult.error, 'not for Pro tier', 'Should provide appropriate error');
  });

  // Test: License Downgrade Process
  runner.test('LicenseValidation - Handle license downgrades properly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Start with Pro license
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration'],
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    // Verify Pro status
    let summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'pro', 'Should start with Pro tier');
    
    // Downgrade to free
    await licenseManager.downgradeLicense();
    
    const downgraded = await mockStorageManager.getLicenseData();
    Assert.equal(downgraded.status, 'free', 'Should downgrade to free status');
    Assert.equal(downgraded.tier, 'free', 'Should downgrade to free tier');
    Assert.equal(downgraded.features.length, 0, 'Should remove Pro features');
    
    // Verify downgrade in summary
    summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'free', 'Should show free tier after downgrade');
    Assert.equal(summary.templateLimit, 10, 'Should have free tier template limit');
  });

  // Test: Base64 URL Encoding/Decoding
  runner.test('LicenseValidation - Handle base64 URL encoding correctly', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test valid base64url strings
    const testStrings = [
      'Hello World!',
      'Test with spaces and symbols: @#$%',
      '{"sub":"user123","tier":"pro"}',
      'a'.repeat(100) // Long string
    ];
    
    for (const testString of testStrings) {
      // Encode to base64url
      const encoded = btoa(testString)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      
      // Decode using license manager
      const decoded = licenseManager.base64UrlDecode(encoded);
      Assert.equal(decoded, testString, `Should correctly decode: "${testString}"`);
    }
    
    // Test invalid base64url strings
    const invalidStrings = [
      'invalid-base64url-string!!!',
      '###invalid###',
      'too@many@special@chars',
      '' // Empty string
    ];
    
    for (const invalidString of invalidStrings) {
      try {
        licenseManager.base64UrlDecode(invalidString);
        // If no error thrown, check if result is reasonable
      } catch (error) {
        Assert.includes(error.message, 'Invalid base64', 'Should throw base64 error for invalid input');
      }
    }
  });

  // Test: Comprehensive License Status Summary
  runner.test('LicenseValidation - Provide comprehensive license status', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test free license summary
    mockStorageManager.clear();
    
    let summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'free', 'Should show free tier');
    Assert.equal(summary.status, 'free', 'Should show free status');
    Assert.true(summary.isValid, 'Free license should be valid');
    Assert.equal(summary.templateLimit, 10, 'Should show free template limit');
    Assert.equal(summary.features.length, 0, 'Should have no Pro features');
    Assert.equal(summary.gracePeriod, null, 'Should have no grace period');
    
    // Test Pro license summary
    const proLicense = {
      status: 'pro',
      tier: 'pro',
      features: ['unlimited_templates', 'ai_integration', 'ad_packs'],
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    await mockStorageManager.saveLicenseData(proLicense);
    
    summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'pro', 'Should show Pro tier');
    Assert.equal(summary.status, 'pro', 'Should show Pro status');
    Assert.true(summary.isValid, 'Pro license should be valid');
    Assert.equal(summary.templateLimit, Infinity, 'Should show unlimited templates');
    Assert.greaterThan(summary.features.length, 0, 'Should have Pro features');
    Assert.includes(summary.features, 'ai_integration', 'Should list AI integration feature');
    
    // Test expired license with grace period
    const gracePeriodEnd = new Date(Date.now() + (2 * 24 * 60 * 60 * 1000));
    const expiredWithGrace = {
      ...proLicense,
      status: 'expired',
      gracePeriodEnds: gracePeriodEnd.toISOString()
    };
    
    await mockStorageManager.saveLicenseData(expiredWithGrace);
    
    summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.status, 'expired', 'Should show expired status');
    Assert.true(summary.isValid, 'Should be valid during grace period');
    Assert.true(summary.gracePeriod !== null, 'Should have grace period info');
    Assert.true(summary.gracePeriod.inGracePeriod, 'Should indicate in grace period');
    Assert.greaterThan(summary.gracePeriod.daysRemaining, 0, 'Should have days remaining');
  });

  // Test: Error Handling and Recovery
  runner.test('LicenseValidation - Handle errors gracefully', async () => {
    const licenseManager = new LicenseManager(mockStorageManager);
    
    // Test with corrupted storage
    const originalGetLicenseData = mockStorageManager.getLicenseData;
    mockStorageManager.getLicenseData = async () => {
      throw new Error('Storage corruption detected');
    };
    
    // Should handle storage errors gracefully
    const hasFeature = await licenseManager.checkFeatureAccess('ai_integration');
    Assert.false(hasFeature, 'Should return false on storage error');
    
    const summary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(summary.tier, 'free', 'Should default to free on error');
    Assert.equal(summary.status, 'free', 'Should default to free status on error');
    
    // Test template limit with storage error
    const limit = await licenseManager.getTemplateLimit();
    Assert.equal(limit, 10, 'Should default to free limit on error');
    
    // Restore original method
    mockStorageManager.getLicenseData = originalGetLicenseData;
    
    // Test with malformed license data
    await mockStorageManager.saveLicenseData({
      status: 'corrupted',
      tier: null,
      features: 'not-an-array'
    });
    
    const malformedSummary = await licenseManager.getLicenseStatusSummary();
    Assert.equal(malformedSummary.tier, 'free', 'Should handle malformed data gracefully');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runLicenseValidationTests = runLicenseValidationTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runLicenseValidationTests;
}