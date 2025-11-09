# Test Updates Needed

## Overview

The license validation tests in `tests/license-validation.test.js` need to be updated to reflect the new JWT integration approach.

## Changes Required

### Old Approach (Local Validation)
Tests currently validate JWT tokens locally using:
- `validateJWTToken()` - No longer exists
- `verifySignature()` - No longer exists
- Local expiration checking
- Grace period management

### New Approach (Server Validation)
Tests should now validate using:
- `verify()` - Server-side verification
- `setLicense()` - Set and verify new license
- Mock API responses instead of JWT parsing
- Activation tracking

## Test Files to Update

### `tests/license-validation.test.js`
**Current Tests:**
1. ✅ JWT Token Structure Validation - **REMOVE** (server validates)
2. ✅ JWT Payload Validation - **REMOVE** (server validates)
3. ✅ Token Expiration Handling - **REMOVE** (server validates)
4. ⚠️ Feature Access Control - **UPDATE** (still relevant)
5. ⚠️ Template Limits Enforcement - **UPDATE** (still relevant)
6. ✅ Grace Period Management - **REMOVE** (server handles)
7. ✅ License Validity with Grace Period - **REMOVE** (server handles)
8. ⚠️ License Upgrade Process - **UPDATE** (different flow)

**New Tests Needed:**
1. Server verification with mock responses
2. Token rotation handling
3. Device fingerprinting
4. Activation limit handling
5. Offline grace period (24 hours)
6. Network error handling
7. Test mode verification

## Mock API Responses

### Success Response Mock
```javascript
const mockSuccessResponse = {
  isValid: true,
  rotatedToken: "eyJhbGc...",
  message: "License is valid and active.",
  entitlements: {
    plan: "pro",
    maxActivations: 2
  },
  activationInfo: {
    currentActivations: 1,
    maxActivations: 2,
    isNewDevice: false
  }
};
```

### Activation Limit Response Mock
```javascript
const mockActivationLimitResponse = {
  isValid: false,
  message: "Device activation limit exceeded...",
  activationInfo: {
    currentActivations: 2,
    maxActivations: 2,
    isNewDevice: true
  }
};
```

### Invalid Token Response Mock
```javascript
const mockInvalidResponse = {
  isValid: false,
  message: "Token signature is invalid or token has expired."
};
```

## Example Updated Test

```javascript
// Test: Server Verification with Valid Token
runner.test('LicenseValidation - Verify valid token with server', async () => {
  const licenseManager = new LicenseManager(mockStorageManager);
  
  // Mock fetch to return success response
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => mockSuccessResponse
    };
  };
  
  const result = await licenseManager.verify();
  
  Assert.true(result.valid, 'Should validate successfully');
  Assert.equal(result.entitlements.plan, 'pro', 'Should have pro plan');
  Assert.true(result.activationInfo !== null, 'Should have activation info');
});

// Test: Activation Limit Handling
runner.test('LicenseValidation - Handle activation limit', async () => {
  const licenseManager = new LicenseManager(mockStorageManager);
  
  // Mock fetch to return activation limit response
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => mockActivationLimitResponse
    };
  };
  
  const result = await licenseManager.verify();
  
  Assert.false(result.valid, 'Should fail validation');
  Assert.true(result.activationInfo !== null, 'Should have activation info');
  Assert.equal(result.activationInfo.currentActivations, 2, 'Should show 2 activations');
  Assert.equal(result.activationInfo.maxActivations, 2, 'Should show max 2 activations');
});

// Test: Token Rotation
runner.test('LicenseValidation - Rotate token on verification', async () => {
  const licenseManager = new LicenseManager(mockStorageManager);
  const originalToken = "original_token";
  const rotatedToken = "rotated_token";
  
  await licenseManager.setLicense(originalToken);
  
  // Mock fetch to return rotated token
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        ...mockSuccessResponse,
        rotatedToken: rotatedToken
      })
    };
  };
  
  await licenseManager.verify();
  
  const licenseData = await mockStorageManager.getLicenseData();
  Assert.equal(licenseData.token, rotatedToken, 'Should store rotated token');
});

// Test: Device Fingerprinting
runner.test('LicenseValidation - Collect device info', async () => {
  const licenseManager = new LicenseManager(mockStorageManager);
  
  const deviceInfo = licenseManager.collectDeviceInfo();
  
  Assert.true(typeof deviceInfo.userAgent === 'string', 'Should have userAgent');
  Assert.true(typeof deviceInfo.platform === 'string', 'Should have platform');
  Assert.true(typeof deviceInfo.language === 'string', 'Should have language');
  Assert.true(typeof deviceInfo.timezone === 'string', 'Should have timezone');
  Assert.true(typeof deviceInfo.screenResolution === 'string', 'Should have screenResolution');
});

// Test: Network Error Handling
runner.test('LicenseValidation - Handle network errors', async () => {
  const licenseManager = new LicenseManager(mockStorageManager);
  
  // Mock fetch to throw network error
  global.fetch = async () => {
    throw new Error('Network error');
  };
  
  const result = await licenseManager.verify();
  
  Assert.false(result.valid, 'Should fail on network error');
  Assert.true(result.error.includes('Network'), 'Should indicate network error');
});
```

## Priority

**High Priority:**
- Feature access control tests (still relevant)
- Template limits enforcement tests (still relevant)
- Server verification with mocked responses

**Medium Priority:**
- Token rotation tests
- Activation limit tests
- Network error handling

**Low Priority:**
- Device fingerprinting tests
- Test mode verification
- Offline grace period tests

## Notes

- Remove all tests that validate JWT structure locally
- Remove all tests that check signature verification
- Remove grace period tests (server handles expiration)
- Focus on integration with server API
- Mock `fetch()` for all server communication tests
- Test both success and failure scenarios
- Test activation limit edge cases

## When to Update

These tests should be updated:
1. ✅ After main JWT integration is complete (DONE)
2. ⏳ Before deploying to production
3. ⏳ When API endpoint is available for testing
4. ⏳ After confirming server responses match specification
