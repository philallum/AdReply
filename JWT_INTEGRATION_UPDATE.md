# JWT Integration Update

## Summary

Updated the AdReply extension to correctly implement JWT-based license verification according to the `docs/browser-extension-jwt-integration.md` specification.

## Key Changes

### 1. License Manager (`adreply/scripts/license-manager.js`)

**Before:**
- Local JWT validation only (no server verification)
- Used RS256 algorithm
- Token structure used `tier` field instead of `plan`
- No device fingerprinting
- No token rotation
- Wrong API endpoint

**After:**
- Server-side verification via `https://teamhandso.me/api/verify`
- ES256 algorithm (as per spec)
- Correct JWT payload structure with `plan`, `ext`, `uid`, `purchaseDate`, `isAdmin`
- Device fingerprinting with browser characteristics
- Automatic token rotation on each verification
- Device activation tracking
- Periodic verification (every 24 hours)
- Proper error handling for activation limits

### 2. Background Script (`adreply/scripts/background-safe.js`)

**Added:**
- License manager initialization on startup
- Message handlers for all license operations:
  - `CHECK_LICENSE` - Get current license status
  - `SET_LICENSE` - Activate new license
  - `VERIFY_LICENSE` - Verify existing license
  - `CLEAR_LICENSE` - Remove license
  - `checkFeatureAccess` - Check feature availability
  - `getLicenseStatus` - Get detailed status
  - `validateLicense` - Validate current license
  - `upgradeLicense` - Upgrade to Pro
  - `getTemplateLimit` - Get template limit
  - `canAddTemplate` - Check if can add more templates

## New Features

### Device Fingerprinting
Collects stable device information:
- User agent (browser name and major version)
- Platform
- Language
- Timezone
- Screen resolution

### Token Rotation
- Every verification returns a new token
- Old tokens become invalid after rotation
- Enhances security and enables revocation

### Activation Tracking
- Pro licenses limited to 2 device activations (configurable)
- Admin licenses have unlimited activations
- Users can request device unlocks via dashboard

### Offline Grace Period
- Extension continues working for 24 hours after last successful verification
- Allows temporary offline usage

## API Integration

### Verification Request
```javascript
POST https://teamhandso.me/api/verify
Content-Type: application/json

{
  "licenseToken": "eyJhbGc...",
  "deviceInfo": {
    "userAgent": "...",
    "platform": "...",
    "language": "...",
    "timezone": "...",
    "screenResolution": "1920x1080"
  },
  "testMode": false
}
```

### Success Response
```javascript
{
  "isValid": true,
  "rotatedToken": "eyJhbGc...",  // Store this for next verification
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

### Failure Response (Activation Limit)
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

## Usage Example

### Activating a License
```javascript
// From popup or sidepanel
const result = await chrome.runtime.sendMessage({
  type: 'SET_LICENSE',
  token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...'
});

if (result.valid) {
  console.log('License activated!');
  console.log('Plan:', result.entitlements.plan);
  console.log('Activations:', result.activationInfo);
} else {
  console.error('Activation failed:', result.error);
  if (result.activationInfo) {
    console.log('Device limit reached:', result.activationInfo);
  }
}
```

### Checking Feature Access
```javascript
const response = await chrome.runtime.sendMessage({
  type: 'checkFeatureAccess',
  feature: 'ai_integration'
});

if (response.hasAccess) {
  // Enable AI features
} else {
  // Show upgrade prompt
}
```

## Testing

### Test Mode
Use test mode for read-only verification without consuming activation slots:

```javascript
const result = await chrome.runtime.sendMessage({
  type: 'VERIFY_LICENSE',
  testMode: true
});
```

### Generate Test Token
For development only:

```javascript
const testToken = licenseManager.generateTestToken({
  plan: 'pro',
  isAdmin: false
});
```

## Migration Notes

### Storage Structure Changes
The license data structure has been updated:

**Old:**
```javascript
{
  token: "...",
  status: "pro",
  tier: "pro",
  expiresAt: "...",
  gracePeriodEnds: "..."
}
```

**New:**
```javascript
{
  token: "...",
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
  features: ["unlimited_templates", "ai_integration", ...]
}
```

### Backward Compatibility
- Existing tokens will be verified on next startup
- Invalid/expired tokens will be cleared automatically
- Users will need to re-enter their license key if token format is incompatible

## Security Considerations

1. **Token Storage**: Tokens stored in `chrome.storage.local` (encrypted by browser)
2. **HTTPS Only**: All API calls use HTTPS
3. **No PII**: Device fingerprints don't contain personally identifiable information
4. **Server Authority**: All validation is server-authoritative
5. **Token Rotation**: Limits exposure window if token is compromised

## Next Steps

1. Test with real API endpoint at `https://teamhandso.me/api/verify`
2. Update UI to show activation information
3. Add unlock request flow for activation limits
4. Implement offline grace period UI indicators
5. Add analytics for license verification events
