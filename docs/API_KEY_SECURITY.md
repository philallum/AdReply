# API Key Security in AdReply v2.0

## Overview

AdReply v2.0 implements robust security measures to protect user API keys for AI providers (Gemini and OpenAI). This document describes the security architecture and best practices implemented in the system.

## Security Measures

### 1. Encryption at Rest

API keys are encrypted before being stored in Chrome's local storage using the Web Crypto API with AES-GCM encryption.

**Encryption Details:**
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Key Material**: Chrome extension ID (unique per installation)
- **Salt**: Fixed salt "adreply-v2-salt"
- **IV**: Random 12-byte initialization vector (generated per encryption)

**Implementation:**
```javascript
// Located in: adreply/scripts/encryption-utils.js
const encrypted = await encryptAPIKey(apiKey);
// Returns: { encrypted: Array, iv: Array }
```

### 2. Key Derivation

The encryption key is derived from the Chrome extension ID using PBKDF2:

```javascript
const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chrome.runtime.id),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
);

const key = await crypto.subtle.deriveKey(
    {
        name: 'PBKDF2',
        salt: encoder.encode('adreply-v2-salt'),
        iterations: 100000,
        hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
);
```

**Why Extension ID?**
- Unique per installation
- Consistent across sessions
- Not accessible to other extensions
- Automatically available in extension context

### 3. Memory Clearing

API keys are cleared from memory after use to prevent exposure:

```javascript
// After AI generation completes
if (this.aiClient.clearAPIKey) {
    this.aiClient.clearAPIKey();
}

// Implementation
clearAPIKey() {
    if (this.apiKey) {
        // Overwrite the API key in memory
        this.apiKey = '\0'.repeat(this.apiKey.length);
        this.apiKey = null;
    }
}
```

**Note**: JavaScript doesn't provide guaranteed memory clearing, but this is a best-effort approach.

### 4. No Logging Policy

API keys are never logged to the console or sent to any server except the AI provider's API endpoint.

**Code Review Checklist:**
- ❌ Never use `console.log(apiKey)`
- ❌ Never include API keys in error messages
- ❌ Never send API keys to analytics or telemetry
- ✅ Only send API keys to official AI provider endpoints

### 5. Secure Transmission

API keys are only transmitted over HTTPS to official AI provider endpoints:

**Gemini API:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

**OpenAI API:**
```
https://api.openai.com/v1/chat/completions
```

### 6. User Control

Users have full control over their API keys:

**Clear API Key:**
- Button in settings: "Clear API Key"
- Confirmation dialog before deletion
- Removes encrypted key from storage
- Updates UI to reflect status

**Re-run Wizard:**
- Users can update their API key anytime
- Previous key is overwritten with new encrypted key

## Storage Schema

API keys are stored in Chrome's local storage with the following structure:

```javascript
{
    settings: {
        aiProvider: "gemini" | "openai",
        aiKeyEncrypted: {
            encrypted: [/* Array of bytes */],
            iv: [/* 12-byte IV array */]
        },
        businessDescription: "...",
        companyUrl: "...",
        onboardingCompleted: true
    }
}
```

## Usage Flow

### 1. Initial Setup (Onboarding)

```
User enters API key
    ↓
encryptAPIKey(apiKey)
    ↓
Store encrypted data in chrome.storage.local
    ↓
Clear plaintext API key from memory
```

### 2. AI Generation

```
Retrieve encrypted key from storage
    ↓
decryptAPIKey(encryptedData)
    ↓
Create AI client with decrypted key
    ↓
Make API request
    ↓
Clear API key from AI client memory
    ↓
Return results
```

### 3. Clear API Key

```
User clicks "Clear API Key"
    ↓
Confirmation dialog
    ↓
Delete aiKeyEncrypted from storage
    ↓
Update UI status
```

## Testing

### Automated Tests

Run encryption tests:
```bash
node tests/test-encryption-manual.js
```

**Test Coverage:**
- ✅ Basic encryption
- ✅ Basic decryption
- ✅ Round-trip with various key formats
- ✅ Different IVs for same key (security)
- ✅ Error handling for invalid inputs
- ✅ Built-in round-trip test function

### Manual Testing

1. **Encryption Round-Trip:**
   - Open browser console in extension context
   - Run: `testEncryptionRoundTrip()`
   - Should return `true`

2. **API Key Storage:**
   - Enter API key in onboarding wizard
   - Check chrome.storage.local
   - Verify key is encrypted (not plaintext)

3. **Clear API Key:**
   - Click "Clear API Key" button
   - Verify key is removed from storage
   - Verify UI updates correctly

## Security Considerations

### Strengths

1. **Industry-Standard Encryption**: AES-GCM is widely used and vetted
2. **Random IVs**: Each encryption uses a unique IV
3. **Key Derivation**: PBKDF2 with 100,000 iterations
4. **No Network Exposure**: Keys only sent to official AI endpoints
5. **User Control**: Easy to clear/update keys

### Limitations

1. **Extension ID as Key Material**: If extension ID is compromised, keys could be decrypted
2. **JavaScript Memory**: Cannot guarantee complete memory clearing
3. **Local Storage**: Keys stored on disk (encrypted) could be accessed by malware with system access
4. **No Hardware Security**: Not using hardware security modules (HSMs)

### Threat Model

**Protected Against:**
- ✅ Casual inspection of storage
- ✅ Other extensions accessing data
- ✅ Network interception (HTTPS)
- ✅ Accidental logging

**Not Protected Against:**
- ❌ Malware with system-level access
- ❌ Physical access to unlocked computer
- ❌ Compromised extension code
- ❌ Browser vulnerabilities

## Best Practices for Developers

### DO:
- ✅ Use `encryptAPIKey()` before storing keys
- ✅ Use `decryptAPIKey()` when retrieving keys
- ✅ Call `clearAPIKey()` after use
- ✅ Use HTTPS for all API requests
- ✅ Validate API keys before encryption
- ✅ Handle encryption errors gracefully

### DON'T:
- ❌ Log API keys to console
- ❌ Store keys in plaintext
- ❌ Send keys to non-AI-provider servers
- ❌ Include keys in error messages
- ❌ Store keys in variables longer than necessary
- ❌ Transmit keys over HTTP

## Future Enhancements

Potential improvements for future versions:

1. **Hardware Security Module (HSM)**: Use browser's Web Authentication API
2. **Key Rotation**: Periodic re-encryption with new keys
3. **Biometric Protection**: Require fingerprint/face ID for key access
4. **Secure Enclave**: Use OS-level secure storage if available
5. **Key Expiration**: Automatic key expiration after period of inactivity
6. **Audit Logging**: Log key access attempts (without logging the key itself)

## References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)

## Support

For security concerns or questions:
- Review code: `adreply/scripts/encryption-utils.js`
- Run tests: `node tests/test-encryption-manual.js`
- Check implementation: `adreply/ui/modules/onboarding-wizard.js`
