# Quick Start - JWT Integration

## What Changed?

The AdReply extension now uses server-side JWT verification instead of local validation. This means:
- License tokens are verified with `https://teamhandso.me/api/verify`
- Tokens automatically rotate for enhanced security
- Device activations are tracked (2 devices for Pro, unlimited for Admin)
- Verification happens every 24 hours automatically

## Testing the Integration

### 1. Load the Extension
```bash
# In Chrome/Edge
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the "adreply" folder
```

### 2. Test License Activation

Open the browser console and run:

```javascript
// Activate a license
const result = await chrome.runtime.sendMessage({
  type: 'SET_LICENSE',
  token: 'YOUR_JWT_TOKEN_HERE'
});

console.log('Result:', result);
// Expected: { valid: true, entitlements: {...}, activationInfo: {...} }
```

### 3. Check License Status

```javascript
const status = await chrome.runtime.sendMessage({
  type: 'CHECK_LICENSE'
});

console.log('Status:', status);
// Shows: valid, entitlements, activation info
```

### 4. Test Feature Access

```javascript
const response = await chrome.runtime.sendMessage({
  type: 'checkFeatureAccess',
  feature: 'ai_integration'
});

console.log('Has AI access:', response.hasAccess);
```

### 5. Test Mode (No Activation)

```javascript
// Verify without creating activation
const result = await chrome.runtime.sendMessage({
  type: 'VERIFY_LICENSE',
  testMode: true
});

console.log('Test result:', result);
```

## Expected Behavior

### First Activation
```javascript
{
  valid: true,
  entitlements: {
    plan: "pro",
    maxActivations: 2
  },
  activationInfo: {
    currentActivations: 1,
    maxActivations: 2,
    isNewDevice: true
  }
}
```

### Activation Limit Reached
```javascript
{
  valid: false,
  error: "Device activation limit exceeded...",
  activationInfo: {
    currentActivations: 2,
    maxActivations: 2,
    isNewDevice: true
  }
}
```

### Invalid Token
```javascript
{
  valid: false,
  error: "Token signature is invalid or token has expired."
}
```

## Troubleshooting

### "Network error"
- Check internet connection
- Verify API endpoint is accessible: `https://teamhandso.me/api/verify`
- Check browser console for CORS errors

### "Invalid token format"
- Ensure token is complete JWT (3 parts separated by dots)
- Check for whitespace or line breaks
- Verify token wasn't truncated

### "Activation limit exceeded"
- User has reached maximum device activations
- Direct user to account dashboard to request unlock
- Or use test mode to verify without activating

### Extension Not Loading
- Check manifest.json is valid
- Verify all script files exist
- Check browser console for errors
- Ensure storage manager files are present

## API Endpoint Requirements

The server must implement:

**Endpoint:** `POST https://teamhandso.me/api/verify`

**Request:**
```json
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

**Response (Success):**
```json
{
  "isValid": true,
  "rotatedToken": "eyJhbGc...",
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

## Development Tips

### Generate Test Token
```javascript
// In license manager context
const testToken = licenseManager.generateTestToken({
  plan: 'pro',
  isAdmin: false
});
console.log(testToken);
```

### Clear License
```javascript
await chrome.runtime.sendMessage({
  type: 'CLEAR_LICENSE'
});
```

### Force Verification
```javascript
await chrome.runtime.sendMessage({
  type: 'VERIFY_LICENSE',
  testMode: false
});
```

### Check Template Limit
```javascript
const response = await chrome.runtime.sendMessage({
  type: 'getTemplateLimit'
});
console.log('Template limit:', response.limit);
```

## Message Types Reference

| Message Type | Purpose | Parameters |
|--------------|---------|------------|
| `SET_LICENSE` | Activate new license | `token` |
| `CHECK_LICENSE` | Get current status | none |
| `VERIFY_LICENSE` | Force verification | `testMode` (optional) |
| `CLEAR_LICENSE` | Remove license | none |
| `checkFeatureAccess` | Check feature | `feature` |
| `getLicenseStatus` | Get detailed status | none |
| `validateLicense` | Validate current | none |
| `upgradeLicense` | Upgrade to Pro | `token` |
| `getTemplateLimit` | Get template limit | none |
| `canAddTemplate` | Check if can add | none |

## Next Steps

1. ✅ Integration complete
2. ⏳ Test with real API endpoint
3. ⏳ Update UI to show activation info
4. ⏳ Add error messages for users
5. ⏳ Test token rotation flow
6. ⏳ Test activation limits
7. ⏳ Deploy to production

## Support

- **Specification:** `docs/browser-extension-jwt-integration.md`
- **Changes:** `JWT_CHANGES_SUMMARY.md`
- **Details:** `JWT_INTEGRATION_UPDATE.md`
- **Tests:** `TEST_UPDATES_NEEDED.md`
- **Complete:** `JWT_INTEGRATION_COMPLETE.md`
