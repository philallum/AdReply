# Browser Extension JWT Integration - Technical Specification

## Overview

This document provides complete technical specifications for integrating JWT-based license verification into a browser extension. The system uses ES256 (ECDSA with P-256 and SHA-256) asymmetric cryptography for secure token validation with device activation tracking.

---

## Table of Contents

1. [JWT Token Structure](#jwt-token-structure)
2. [API Endpoint Specification](#api-endpoint-specification)
3. [Device Fingerprinting](#device-fingerprinting)
4. [Token Rotation](#token-rotation)
5. [Error Handling](#error-handling)
6. [Implementation Examples](#implementation-examples)
7. [Security Considerations](#security-considerations)

---

## JWT Token Structure

### Token Format

The license token is a standard JWT with three parts separated by dots:
```
<header>.<payload>.<signature>
```

### Header

```json
{
  "alg": "ES256",
  "typ": "JWT"
}
```

### Payload Structure

```typescript
interface LicenseTokenPayload {
  // Standard JWT Claims
  iss: string;              // Issuer: "ExtensionPro by Team Handsome"
  iat: number;              // Issued At: Unix timestamp
  exp: number;              // Expiration: Unix timestamp (370 days from issue)
  
  // Custom Claims
  sub: string;              // Subject: Unique license ID (Firestore document ID)
  uid: string;              // User ID: Firebase Auth UID of license owner
  ext: string;              // Extension: Slug identifier for the extension
  plan: "pro" | "admin";    // Plan type
  purchaseDate: string;     // ISO 8601 date string of purchase
  isAdmin: boolean;         // Admin license flag (bypasses activation limits)
  licenseType?: "one-time" | "subscription";  // License type
  deviceFingerprint?: string;  // Activation ID for device tracking
}
```

### Example Decoded Token

```json
{
  "iss": "ExtensionPro by Team Handsome",
  "iat": 1699564800,
  "exp": 1731619200,
  "sub": "lic_abc123xyz789",
  "uid": "user_firebase_uid_123",
  "ext": "my-extension-slug",
  "plan": "pro",
  "purchaseDate": "2024-11-09T12:00:00.000Z",
  "isAdmin": false,
  "licenseType": "one-time",
  "deviceFingerprint": "act_device123"
}
```

---

## API Endpoint Specification

### Verification Endpoint

**URL:** `https://your-domain.com/api/verify`

**Method:** `POST`

**Content-Type:** `application/json`

### Request Schema

```typescript
interface VerifyRequest {
  licenseToken: string;      // Required: JWT token to verify
  deviceInfo?: DeviceInfo;   // Optional: Device characteristics
  testMode?: boolean;        // Optional: Read-only verification (no activation)
}

interface DeviceInfo {
  userAgent: string;         // Navigator.userAgent
  platform: string;          // Navigator.platform
  language: string;          // Navigator.language
  timezone: string;          // Intl.DateTimeFormat().resolvedOptions().timeZone
  screenResolution: string;  // Format: "1920x1080"
}
```

### Response Schema

#### Success Response (Valid License)

```typescript
interface VerifySuccessResponse {
  isValid: true;
  rotatedToken: string;      // New JWT token (store this for next verification)
  message: string;           // Human-readable success message
  entitlements: {
    plan: "pro" | "admin";
    maxActivations: number;  // Maximum allowed device activations
  };
  activationInfo: {
    currentActivations: number;  // Current active device count
    maxActivations: number;      // Maximum allowed activations
    isNewDevice: boolean;        // True if this is a new device activation
  } | null;  // null for admin licenses or test mode
}
```

#### Failure Response (Invalid License)

```typescript
interface VerifyFailureResponse {
  isValid: false;
  message: string;           // Human-readable error message
  activationInfo?: {         // Present if activation limit exceeded
    currentActivations: number;
    maxActivations: number;
    isNewDevice: boolean;
  };
  debug?: object;            // Only in development mode
}
```

### HTTP Status Codes

- `200 OK`: Request processed successfully (check `isValid` field)
- `400 Bad Request`: Invalid request format or missing required fields
- `500 Internal Server Error`: Server configuration or database error

### Example Request

```javascript
const response = await fetch('https://your-domain.com/api/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    licenseToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...',
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    },
    testMode: false  // Set to true for read-only verification
  })
});

const result = await response.json();
```

### Example Success Response

```json
{
  "isValid": true,
  "rotatedToken": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJFeHRlbnNpb25Qcm8gYnkgVGVhbSBIYW5kc29tZSIsImlhdCI6MTY5OTU2NDgwMCwiZXhwIjoxNzMxNjE5MjAwLCJzdWIiOiJsaWNfYWJjMTIzIiwidWlkIjoidXNlcl8xMjMiLCJleHQiOiJteS1leHQiLCJwbGFuIjoicHJvIiwicHVyY2hhc2VEYXRlIjoiMjAyNC0xMS0wOVQxMjowMDowMC4wMDBaIiwiaXNBZG1pbiI6ZmFsc2UsImxpY2Vuc2VUeXBlIjoib25lLXRpbWUiLCJkZXZpY2VGaW5nZXJwcmludCI6ImFjdF9kZXZpY2UxMjMifQ.signature",
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

### Example Failure Response (Activation Limit)

```json
{
  "isValid": false,
  "message": "Device activation limit exceeded. Please request an unlock in your account dashboard.",
  "activationInfo": {
    "currentActivations": 2,
    "maxActivations": 2,
    "isNewDevice": true
  }
}
```

### Example Failure Response (Invalid Token)

```json
{
  "isValid": false,
  "message": "Token signature is invalid or token has expired."
}
```

---

## Device Fingerprinting

### Purpose

Device fingerprinting prevents license sharing while allowing legitimate users to use their licenses on authorized devices. The system tracks device activations and enforces limits based on the license plan.

### Device Information Collection

Collect the following information from the browser:

```javascript
function collectDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`
  };
}
```

### Fingerprint Generation

The server generates a stable fingerprint using:

1. **Browser characteristics**: Name and major version only
2. **Operating system**: Extracted from user agent
3. **Platform**: Normalized platform identifier
4. **Language**: Primary language code only
5. **Timezone**: Full timezone identifier
6. **Screen resolution**: Categorized into ranges (4K, 1080p, 720p, mobile)

### Fingerprint Stability

The fingerprint is designed to be stable across:
- Browser minor version updates
- Zoom level changes
- Minor resolution adjustments

The fingerprint will change if:
- User switches to a different browser
- User switches to a different device
- User changes operating system

### Activation Limits

- **Pro Plan**: 2 device activations (default)
- **Admin Plan**: Unlimited activations
- **Custom Plans**: Configurable via `maxActivations` field

### Test Mode

Set `testMode: true` to perform read-only verification without creating device activations. Useful for:
- Testing token validity
- Checking activation status
- Debugging without consuming activation slots

---

## Token Rotation

### Why Token Rotation?

Token rotation provides:
1. **Enhanced security**: Limits exposure window if token is compromised
2. **Activation tracking**: Each verification updates the device's last-seen timestamp
3. **Revocation capability**: Old tokens become invalid after rotation

### Rotation Flow

1. Extension sends current token to `/api/verify`
2. Server validates token and device activation
3. Server generates new token with updated `iat` (issued at) timestamp
4. Server returns new token in `rotatedToken` field
5. Extension stores new token and uses it for next verification

### Implementation

```javascript
async function verifyAndRotateToken(currentToken) {
  const response = await fetch('https://your-domain.com/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenseToken: currentToken,
      deviceInfo: collectDeviceInfo()
    })
  });
  
  const result = await response.json();
  
  if (result.isValid) {
    // Store the new token for next verification
    await chrome.storage.local.set({ 
      licenseToken: result.rotatedToken 
    });
    return { valid: true, entitlements: result.entitlements };
  }
  
  return { valid: false, message: result.message };
}
```

### Rotation Frequency

Recommended verification intervals:
- **On extension startup**: Verify immediately
- **Periodic checks**: Every 24 hours during active use
- **Before premium features**: Verify before accessing paid functionality
- **After network reconnection**: Verify when coming back online

---

## Error Handling

### Client-Side Error Handling

```javascript
async function verifyLicense(token) {
  try {
    const response = await fetch('https://your-domain.com/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseToken: token,
        deviceInfo: collectDeviceInfo()
      })
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 400) {
        return { error: 'Invalid request format' };
      }
      if (response.status === 500) {
        return { error: 'Server error. Please try again later.' };
      }
      return { error: 'Unexpected error occurred' };
    }
    
    const result = await response.json();
    
    if (!result.isValid) {
      // Handle license validation failures
      if (result.activationInfo) {
        // Activation limit exceeded
        return {
          error: 'activation_limit',
          message: result.message,
          activationInfo: result.activationInfo
        };
      }
      
      // Other validation failures (expired, refunded, etc.)
      return {
        error: 'invalid_license',
        message: result.message
      };
    }
    
    // Success - store rotated token
    await chrome.storage.local.set({ 
      licenseToken: result.rotatedToken 
    });
    
    return {
      success: true,
      entitlements: result.entitlements,
      activationInfo: result.activationInfo
    };
    
  } catch (error) {
    // Handle network errors
    console.error('License verification failed:', error);
    return {
      error: 'network_error',
      message: 'Unable to verify license. Please check your internet connection.'
    };
  }
}
```

### Common Error Scenarios

| Error | Message | Action |
|-------|---------|--------|
| Invalid JWT format | "Invalid token format. A valid license token must be a JWT." | Prompt user to re-enter license key |
| Expired token | "Token signature is invalid or token has expired." | Prompt user to contact support |
| License not found | "License not found." | Prompt user to verify license key |
| License refunded | "License has been refunded." | Disable premium features |
| License disputed | "License is under dispute review." | Show dispute resolution message |
| Activation limit | "Device activation limit exceeded..." | Show unlock request UI |
| Network error | Connection timeout/failure | Retry with exponential backoff |
| Server error | 500 status code | Show maintenance message |

---

## Implementation Examples

### Complete Browser Extension Integration

```javascript
// background.js or service worker

const API_ENDPOINT = 'https://your-domain.com/api/verify';
const VERIFICATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

class LicenseManager {
  constructor() {
    this.token = null;
    this.entitlements = null;
    this.lastVerification = null;
  }
  
  async initialize() {
    // Load stored token
    const stored = await chrome.storage.local.get([
      'licenseToken',
      'entitlements',
      'lastVerification'
    ]);
    
    this.token = stored.licenseToken;
    this.entitlements = stored.entitlements;
    this.lastVerification = stored.lastVerification;
    
    // Verify on startup
    if (this.token) {
      await this.verify();
    }
    
    // Set up periodic verification
    this.startPeriodicVerification();
  }
  
  async setLicense(token) {
    this.token = token;
    await chrome.storage.local.set({ licenseToken: token });
    return await this.verify();
  }
  
  async verify(testMode = false) {
    if (!this.token) {
      return { valid: false, error: 'No license token' };
    }
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseToken: this.token,
          deviceInfo: this.collectDeviceInfo(),
          testMode
        })
      });
      
      const result = await response.json();
      
      if (result.isValid) {
        // Update stored token
        this.token = result.rotatedToken;
        this.entitlements = result.entitlements;
        this.lastVerification = Date.now();
        
        await chrome.storage.local.set({
          licenseToken: this.token,
          entitlements: this.entitlements,
          lastVerification: this.lastVerification
        });
        
        return {
          valid: true,
          entitlements: result.entitlements,
          activationInfo: result.activationInfo
        };
      } else {
        // License invalid - clear stored data
        if (!result.activationInfo) {
          // Only clear if not an activation issue
          await this.clearLicense();
        }
        
        return {
          valid: false,
          error: result.message,
          activationInfo: result.activationInfo
        };
      }
    } catch (error) {
      console.error('License verification failed:', error);
      return {
        valid: false,
        error: 'Network error',
        details: error.message
      };
    }
  }
  
  async clearLicense() {
    this.token = null;
    this.entitlements = null;
    this.lastVerification = null;
    await chrome.storage.local.remove([
      'licenseToken',
      'entitlements',
      'lastVerification'
    ]);
  }
  
  isValid() {
    return this.token && this.entitlements;
  }
  
  needsVerification() {
    if (!this.lastVerification) return true;
    return Date.now() - this.lastVerification > VERIFICATION_INTERVAL;
  }
  
  startPeriodicVerification() {
    setInterval(async () => {
      if (this.token && this.needsVerification()) {
        await this.verify();
      }
    }, VERIFICATION_INTERVAL);
  }
  
  collectDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }
  
  getEntitlements() {
    return this.entitlements;
  }
}

// Initialize license manager
const licenseManager = new LicenseManager();
licenseManager.initialize();

// Message handler for popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_LICENSE') {
    sendResponse({
      valid: licenseManager.isValid(),
      entitlements: licenseManager.getEntitlements()
    });
  }
  
  if (message.type === 'SET_LICENSE') {
    licenseManager.setLicense(message.token).then(sendResponse);
    return true; // Async response
  }
  
  if (message.type === 'VERIFY_LICENSE') {
    licenseManager.verify().then(sendResponse);
    return true; // Async response
  }
  
  if (message.type === 'CLEAR_LICENSE') {
    licenseManager.clearLicense().then(sendResponse);
    return true; // Async response
  }
});
```

### Popup UI Integration

```javascript
// popup.js

async function checkLicenseStatus() {
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_LICENSE'
  });
  
  if (response.valid) {
    showLicensedUI(response.entitlements);
  } else {
    showUnlicensedUI();
  }
}

async function activateLicense() {
  const token = document.getElementById('license-input').value.trim();
  
  if (!token) {
    showError('Please enter a license key');
    return;
  }
  
  showLoading('Verifying license...');
  
  const result = await chrome.runtime.sendMessage({
    type: 'SET_LICENSE',
    token: token
  });
  
  hideLoading();
  
  if (result.valid) {
    showSuccess('License activated successfully!');
    checkLicenseStatus();
  } else {
    if (result.activationInfo) {
      showError(`Activation limit reached (${result.activationInfo.currentActivations}/${result.activationInfo.maxActivations} devices). Please request an unlock.`);
    } else {
      showError(result.error || 'License verification failed');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkLicenseStatus();
  document.getElementById('activate-btn').addEventListener('click', activateLicense);
});
```

---

## Security Considerations

### Token Storage

**DO:**
- Store tokens in `chrome.storage.local` (encrypted by browser)
- Clear tokens when user logs out or deactivates
- Validate token format before sending to server

**DON'T:**
- Store tokens in `localStorage` (accessible to content scripts)
- Log full tokens to console
- Transmit tokens over unencrypted connections

### API Communication

**DO:**
- Always use HTTPS for API requests
- Implement request timeout (10-30 seconds)
- Retry failed requests with exponential backoff
- Validate API responses before processing

**DON'T:**
- Cache verification responses for extended periods
- Trust client-side validation alone
- Expose API endpoint in public documentation

### Device Fingerprinting Privacy

The system is designed with privacy in mind:
- IP addresses are hashed before storage
- Device info is normalized to prevent tracking
- No personally identifiable information is collected
- Fingerprints cannot be reverse-engineered to identify users

### Token Expiration

- Tokens expire after 370 days (just over 1 year)
- Expired tokens must be refreshed through user account
- Token rotation provides additional security layer
- Server-side validation is always authoritative

### Rate Limiting

Implement client-side rate limiting:
- Maximum 1 verification per minute during normal operation
- Maximum 5 verification attempts per hour on errors
- Exponential backoff on repeated failures

### Offline Handling

```javascript
async function verifyWithGracePeriod() {
  const lastVerification = await getLastVerification();
  const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  if (Date.now() - lastVerification < gracePeriod) {
    // Allow offline usage within grace period
    return { valid: true, offline: true };
  }
  
  // Require online verification
  return await verify();
}
```

---

## Testing

### Test Mode Verification

Use test mode to verify tokens without creating activations:

```javascript
const result = await fetch('https://your-domain.com/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licenseToken: token,
    deviceInfo: collectDeviceInfo(),
    testMode: true  // Read-only verification
  })
});
```

### Admin Test Tokens

Admin users can generate test tokens via:
- **Endpoint**: `POST /api/admin/generate-test-token`
- **Auth**: Requires Firebase Admin authentication
- **Response**: Returns test JWT with admin privileges

---

## Support and Troubleshooting

### Common Issues

**"Invalid token format"**
- Ensure token is complete JWT (3 parts separated by dots)
- Check for whitespace or line breaks in token
- Verify token wasn't truncated during copy/paste

**"Token signature is invalid"**
- Token may be expired (370 day lifetime)
- Token may have been revoked
- User should contact support for new token

**"Device activation limit exceeded"**
- User has reached maximum device activations
- Direct user to account dashboard to request unlock
- Unlock requests are reviewed by administrators

**Network errors**
- Check internet connectivity
- Verify API endpoint is accessible
- Implement retry logic with backoff

---

## Changelog

### Version 1.0 (Current)
- ES256 JWT implementation
- Device fingerprinting with activation tracking
- Token rotation on each verification
- Test mode for read-only verification
- Support for one-time and subscription licenses
- Admin license support with unlimited activations

---

## Additional Resources

- **JWT Standard**: [RFC 7519](https://tools.ietf.org/html/rfc7519)
- **ES256 Algorithm**: [RFC 7518 Section 3.4](https://tools.ietf.org/html/rfc7518#section-3.4)
- **Chrome Extension Storage**: [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## Contact

For technical support or questions about integration:
- Review the implementation examples in this document
- Check the error handling section for common issues
- Contact your system administrator for API endpoint details
