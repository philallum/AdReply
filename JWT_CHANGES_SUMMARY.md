# JWT Integration Changes Summary

## Files Modified

### 1. `adreply/scripts/license-manager.js`
**Major Rewrite** - Completely updated to match JWT specification

**Key Changes:**
- ✅ Changed API endpoint from `/api/license` to `/api/verify`
- ✅ Implemented server-side verification instead of local JWT validation
- ✅ Added device fingerprinting with `collectDeviceInfo()`
- ✅ Implemented token rotation (stores `rotatedToken` from server)
- ✅ Added periodic verification (every 24 hours)
- ✅ Changed JWT algorithm from RS256 to ES256
- ✅ Updated payload structure: `tier` → `plan`, added `ext`, `uid`, `purchaseDate`, `isAdmin`
- ✅ Added activation tracking and limit handling
- ✅ Removed local signature verification (server handles this)
- ✅ Added `verify()`, `setLicense()`, `clearLicense()` methods
- ✅ Updated `generateTestToken()` to match new JWT structure

**Removed:**
- ❌ `loadPublicKey()` - No longer needed (server validates)
- ❌ `validateJWTToken()` - Replaced with server verification
- ❌ `verifySignature()` - Server handles signature verification
- ❌ Grace period methods - Server handles expiration

**Added:**
- ✅ `initialize()` - Loads stored token and starts periodic verification
- ✅ `verify(testMode)` - Verifies with server and rotates token
- ✅ `setLicense(token)` - Sets and verifies new license
- ✅ `clearLicense()` - Clears license data
- ✅ `collectDeviceInfo()` - Collects device fingerprint data
- ✅ `startPeriodicVerification()` - Auto-verifies every 24 hours
- ✅ `needsVerification()` - Checks if verification is needed
- ✅ `isValid()` - Quick validity check
- ✅ `getEntitlements()` - Returns current entitlements
- ✅ `getActivationInfo()` - Returns activation information
- ✅ `getFeaturesByPlan(plan)` - Maps plan to features

### 2. `adreply/scripts/background-safe.js`
**Enhanced** - Added license manager integration

**Key Changes:**
- ✅ Added imports for storage manager and license manager
- ✅ Initialize managers on startup
- ✅ Added message handlers for license operations:
  - `CHECK_LICENSE` - Get current license status
  - `SET_LICENSE` - Activate new license token
  - `VERIFY_LICENSE` - Verify existing license
  - `CLEAR_LICENSE` - Remove license
  - `checkFeatureAccess` - Check feature availability
  - `getLicenseStatus` - Get detailed status
  - `validateLicense` - Validate current license
  - `upgradeLicense` - Upgrade to Pro
  - `getTemplateLimit` - Get template limit
  - `canAddTemplate` - Check if can add templates

## API Integration

### Request Format
```javascript
POST https://teamhandso.me/api/verify
Content-Type: application/json

{
  "licenseToken": "eyJhbGc...",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Linux x86_64",
    "language": "en-US",
    "timezone": "America/New_York",
    "screenResolution": "1920x1080"
  },
  "testMode": false
}
```

### Success Response
```javascript
{
  "isValid": true,
  "rotatedToken": "eyJhbGc...",  // New token to store
  "message": "License is valid and active.",
  "entitlements": {
    "plan": "pro",
    "maxActivations": 2
  },
  "activationInfo": {
    "currentActivations": 1,
    "maxActivations": 2,
    "isNewDevice": true
  }
}
```

### Failure Response
```javascript
{
  "isValid": false,
  "message": "Device activation limit exceeded...",
  "activationInfo": {
    "currentActivations": 2,
    "maxActivations": 2,
    "isNewDevice": true
  }
}
```

## JWT Token Structure

### Header
```json
{
  "alg": "ES256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "iss": "ExtensionPro by Team Handsome",
  "iat": 1699564800,
  "exp": 1731619200,
  "sub": "lic_abc123",
  "uid": "user_firebase_uid",
  "ext": "adreply",
  "plan": "pro",
  "purchaseDate": "2024-11-09T12:00:00.000Z",
  "isAdmin": false,
  "licenseType": "one-time",
  "deviceFingerprint": "act_device123"
}
```

## Storage Structure

### License Data Format
```javascript
{
  token: "eyJhbGc...",
  status: "pro",
  tier: "pro",
  plan: "pro",
  entitlements: {
    plan: "pro",
    maxActivations: 2
  },
  activationInfo: {
    currentActivations: 1,
    maxActivations: 2,
    isNewDevice: false
  },
  lastVerification: 1699564800000,
  features: [
    "unlimited_templates",
    "ai_integration",
    "ad_packs",
    "priority_support"
  ]
}
```

## Testing

### Test with Real Token
```javascript
// From browser console or popup
const result = await chrome.runtime.sendMessage({
  type: 'SET_LICENSE',
  token: 'YOUR_JWT_TOKEN_HERE'
});
console.log(result);
```

### Test Mode (Read-Only)
```javascript
const result = await chrome.runtime.sendMessage({
  type: 'VERIFY_LICENSE',
  testMode: true
});
console.log(result);
```

### Generate Test Token (Development)
```javascript
// In license manager context
const testToken = licenseManager.generateTestToken({
  plan: 'pro',
  isAdmin: false
});
console.log(testToken);
```

## Migration Path

1. **Existing Users**: On next startup, extension will attempt to verify stored token
2. **Invalid Tokens**: Will be cleared automatically, user prompted to re-enter
3. **New Users**: Will start with free tier, can activate Pro license anytime

## Next Steps

1. ✅ Test with real API endpoint at `https://teamhandso.me/api/verify`
2. ⏳ Update UI to show activation information
3. ⏳ Add unlock request flow for activation limits
4. ⏳ Implement offline grace period UI indicators
5. ⏳ Add error messages for activation limit scenarios
6. ⏳ Test token rotation flow
7. ⏳ Test device fingerprinting stability

## Breaking Changes

⚠️ **Token Format**: Old tokens using `tier` field will not work with new system
⚠️ **API Endpoint**: Changed from `/api/license` to `/api/verify`
⚠️ **Validation Method**: Changed from local to server-side validation

## Backward Compatibility

- Storage structure is compatible (uses same keys)
- Old tokens will fail verification and be cleared
- Users will need to re-enter license key if format changed
- Free tier users unaffected
