# Browser Extension Implementation Guide
## Self-Service License Deactivation

This guide provides everything you need to implement the self-service license deactivation feature in your browser extension. This feature allows users to remove their license from a device directly through the extension, freeing up an activation slot for use on another device.

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoint Specification](#api-endpoint-specification)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [UI/UX Recommendations](#uiux-recommendations)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Best Practices](#best-practices)

---

## Overview

### What This Feature Does

- Allows users to remove their license from the current device
- Frees up an activation slot immediately
- Enables installation on a new device without admin intervention
- Replaces the old manual unlock request process

### User Flow

1. User clicks "Remove License" button in extension settings
2. Extension shows confirmation dialog explaining the action
3. User confirms the removal
4. Extension calls deactivation API with license token and device info
5. API marks the device's activation as inactive
6. Extension clears stored license token from local storage
7. Extension updates UI to show unlicensed state
8. User can now activate on a new device using their license token

---

## API Endpoint Specification

### Endpoint

```
POST https://teamhandso.me/api/deactivate
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

```typescript
{
  licenseToken: string;      // Required: JWT token from user's account
  deviceInfo?: {             // Optional but recommended for better matching
    userAgent: string;       // navigator.userAgent
    platform: string;        // navigator.platform
    language: string;        // navigator.language
    timezone: string;        // Intl.DateTimeFormat().resolvedOptions().timeZone
    screenResolution: string; // `${screen.width}x${screen.height}`
  };
}
```

### Success Response (200 OK)

```typescript
{
  success: true;
  message: string;           // "License removed from this device successfully"
  activationInfo: {
    deactivatedDeviceId: string;
    remainingActivations: number;
    maxActivations: number;
  };
}
```

### Error Response (200 OK with success: false)

```typescript
{
  success: false;
  message: string;           // Human-readable error message
  error?: string;            // Error code for programmatic handling
}
```

### Error Codes

| Error Code | Meaning | User Action |
|------------|---------|-------------|
| `INVALID_TOKEN` | JWT token is invalid or expired | Get new token from account dashboard |
| `LICENSE_NOT_FOUND` | License doesn't exist in database | Contact support |
| `ACTIVATION_NOT_FOUND` | No active license on this device | Already deactivated or wrong device |
| `DATABASE_ERROR` | Server database error | Try again later |
| `RATE_LIMIT_EXCEEDED` | Too many deactivation requests | Wait and try again |

---

## Implementation Steps

### Step 1: Add Remove License Button to Your Extension UI

Add a button in your extension's settings or license management area:

```html
<div class="license-section">
  <h3>License Management</h3>
  <div class="license-status">
    <span class="status-badge active">Active</span>
    <span class="plan-type">Pro Plan</span>
  </div>
  <button id="removeLicenseBtn" class="btn-danger">
    Remove License from This Device
  </button>
</div>
```

### Step 2: Implement Device Info Collection

Create a function to gather device information:

```javascript
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`
  };
}
```

### Step 3: Implement Deactivation Function

Create the core deactivation logic:

```javascript
async function deactivateLicense() {
  try {
    // Get stored license token
    const storage = await chrome.storage.local.get('licenseToken');
    const licenseToken = storage.licenseToken;
    
    if (!licenseToken) {
      throw new Error('No license token found');
    }
    
    // Call deactivation API
    const response = await fetch('https://teamhandso.me/api/deactivate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        licenseToken: licenseToken,
        deviceInfo: getDeviceInfo()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Clear stored license token
      await chrome.storage.local.remove('licenseToken');
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message, error: result.error };
    }
    
  } catch (error) {
    console.error('Deactivation error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
      error: 'NETWORK_ERROR'
    };
  }
}
```

### Step 4: Add Confirmation Dialog

Implement a confirmation dialog before deactivation:

```javascript
function showConfirmationDialog() {
  return new Promise((resolve) => {
    const confirmed = confirm(
      'Remove License from This Device?\n\n' +
      'This will remove your license from this device and free up an activation slot.\n\n' +
      'You can reactivate on this device or install on a different device using your ' +
      'license token from your account dashboard at teamhandso.me/account.\n\n' +
      'Are you sure you want to continue?'
    );
    resolve(confirmed);
  });
}
```

### Step 5: Wire Up Button Click Handler

Connect the button to the deactivation logic:

```javascript
document.getElementById('removeLicenseBtn').addEventListener('click', async () => {
  // Show confirmation
  const confirmed = await showConfirmationDialog();
  if (!confirmed) return;
  
  // Show loading state
  const button = document.getElementById('removeLicenseBtn');
  button.disabled = true;
  button.textContent = 'Removing...';
  
  // Perform deactivation
  const result = await deactivateLicense();
  
  if (result.success) {
    // Show success message
    alert('License removed successfully! You can now install on a new device.');
    
    // Update UI to unlicensed state
    updateUIToUnlicensedState();
  } else {
    // Show error message
    alert(`Failed to remove license: ${result.message}`);
    
    // Restore button state
    button.disabled = false;
    button.textContent = 'Remove License from This Device';
  }
});
```

### Step 6: Update UI State

Implement function to update UI after deactivation:

```javascript
function updateUIToUnlicensedState() {
  // Hide license management section
  document.querySelector('.license-section').style.display = 'none';
  
  // Show license prompt
  document.querySelector('.license-prompt').style.display = 'block';
  
  // Disable pro features
  disableProFeatures();
  
  // Update badge or icon
  chrome.action.setBadgeText({ text: '' });
}
```

---

## Code Examples

### Complete Implementation (Manifest V3)

**popup.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Extension Settings</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Licensed State -->
    <div id="licensedState" class="hidden">
      <div class="license-info">
        <h2>License Active</h2>
        <p class="plan-type">Pro Plan</p>
        <p class="activation-info">
          <span id="activationCount">1</span> of <span id="maxActivations">2</span> devices activated
        </p>
      </div>
      <button id="removeLicenseBtn" class="btn-danger">
        Remove License from This Device
      </button>
      <a href="https://teamhandso.me/account" target="_blank" class="link">
        View Account Dashboard
      </a>
    </div>
    
    <!-- Unlicensed State -->
    <div id="unlicensedState" class="hidden">
      <h2>No License Found</h2>
      <p>Enter your license token to activate pro features.</p>
      <button id="activateLicenseBtn" class="btn-primary">
        Activate License
      </button>
      <a href="https://teamhandso.me/extensions" target="_blank" class="link">
        Purchase License
      </a>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

**popup.js**
```javascript
// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkLicenseStatus();
  setupEventListeners();
});

// Check if license exists and is valid
async function checkLicenseStatus() {
  const { licenseToken } = await chrome.storage.local.get('licenseToken');
  
  if (licenseToken) {
    // Verify license is still valid
    const isValid = await verifyLicense(licenseToken);
    
    if (isValid) {
      showLicensedState();
    } else {
      showUnlicensedState();
    }
  } else {
    showUnlicensedState();
  }
}

// Verify license with server
async function verifyLicense(licenseToken) {
  try {
    const response = await fetch('https://teamhandso.me/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseToken: licenseToken,
        deviceInfo: getDeviceInfo(),
        testMode: true  // Don't create activation, just verify
      })
    });
    
    const result = await response.json();
    return result.isValid;
  } catch (error) {
    console.error('License verification failed:', error);
    return false;
  }
}

// Get device information
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`
  };
}

// Deactivate license
async function deactivateLicense() {
  try {
    const { licenseToken } = await chrome.storage.local.get('licenseToken');
    
    if (!licenseToken) {
      throw new Error('No license token found');
    }
    
    const response = await fetch('https://teamhandso.me/api/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseToken: licenseToken,
        deviceInfo: getDeviceInfo()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      await chrome.storage.local.remove('licenseToken');
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message };
    }
    
  } catch (error) {
    console.error('Deactivation error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.'
    };
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('removeLicenseBtn')?.addEventListener('click', handleRemoveLicense);
  document.getElementById('activateLicenseBtn')?.addEventListener('click', handleActivateLicense);
}

// Handle remove license button click
async function handleRemoveLicense() {
  const confirmed = confirm(
    'Remove License from This Device?\n\n' +
    'This will free up an activation slot. You can reactivate on this ' +
    'device or install on a different device using your license token.\n\n' +
    'Continue?'
  );
  
  if (!confirmed) return;
  
  const button = document.getElementById('removeLicenseBtn');
  button.disabled = true;
  button.textContent = 'Removing...';
  
  const result = await deactivateLicense();
  
  if (result.success) {
    alert('License removed successfully!');
    showUnlicensedState();
  } else {
    alert(`Failed to remove license: ${result.message}`);
    button.disabled = false;
    button.textContent = 'Remove License from This Device';
  }
}

// Handle activate license button click
function handleActivateLicense() {
  chrome.tabs.create({ url: 'https://teamhandso.me/account' });
}

// Show licensed state UI
function showLicensedState() {
  document.getElementById('licensedState').classList.remove('hidden');
  document.getElementById('unlicensedState').classList.add('hidden');
}

// Show unlicensed state UI
function showUnlicensedState() {
  document.getElementById('licensedState').classList.add('hidden');
  document.getElementById('unlicensedState').classList.remove('hidden');
}
```

**popup.css**
```css
body {
  width: 350px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
}

.hidden {
  display: none !important;
}

h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.license-info {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.plan-type {
  color: #0066cc;
  font-weight: 600;
  margin: 8px 0;
}

.activation-info {
  color: #666;
  font-size: 14px;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 8px;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover {
  background: #0052a3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  display: block;
  text-align: center;
  color: #0066cc;
  text-decoration: none;
  font-size: 14px;
  margin-top: 8px;
}

.link:hover {
  text-decoration: underline;
}
```

---

## UI/UX Recommendations

### Button Placement

- Place the "Remove License" button in a settings or license management section
- Don't make it too prominent (avoid accidental clicks)
- Use a warning color (red) to indicate it's a destructive action

### Button Label

Recommended labels:
- ✅ "Remove License from This Device"
- ✅ "Deactivate on This Device"
- ❌ "Delete License" (too scary)
- ❌ "Remove" (too vague)

### Confirmation Dialog

Always show a confirmation dialog that:
- Explains what will happen
- Mentions that the slot will be freed
- Tells users they can reactivate
- Provides a link to the account dashboard
- Has clear "Confirm" and "Cancel" buttons

### Loading States

Show loading state during API call:
- Disable button
- Change text to "Removing..."
- Show spinner if possible

### Success Message

After successful deactivation:
- Show clear success message
- Update UI to unlicensed state
- Optionally provide link to account dashboard
- Don't automatically close the popup

### Error Messages

For errors:
- Show user-friendly error message
- Provide actionable next steps
- Include support contact for persistent issues
- Log technical details to console

---

## Error Handling

### Network Errors

```javascript
try {
  const response = await fetch('https://teamhandso.me/api/deactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseToken, deviceInfo }),
    signal: AbortSignal.timeout(10000)  // 10 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  // Handle result...
  
} catch (error) {
  if (error.name === 'AbortError') {
    showError('Request timed out. Please try again.');
  } else if (error.message.includes('fetch')) {
    showError('Network error. Please check your connection.');
  } else {
    showError('An unexpected error occurred. Please try again.');
  }
  console.error('Deactivation error:', error);
}
```

### API Error Responses

```javascript
const result = await response.json();

if (!result.success) {
  switch (result.error) {
    case 'INVALID_TOKEN':
      showError('Your license token is invalid or expired. Please get a new token from your account dashboard.');
      break;
    case 'ACTIVATION_NOT_FOUND':
      showError('No active license found on this device. It may have already been removed.');
      // Clear local storage anyway
      await chrome.storage.local.remove('licenseToken');
      showUnlicensedState();
      break;
    case 'RATE_LIMIT_EXCEEDED':
      showError('Too many requests. Please wait a few minutes and try again.');
      break;
    default:
      showError(result.message || 'Failed to remove license. Please try again.');
  }
}
```

### Graceful Degradation

```javascript
// If deactivation fails, still allow user to clear local token
async function forceRemoveLicense() {
  const confirmed = confirm(
    'Unable to contact server. Remove license locally?\n\n' +
    'This will clear the license from this device, but may not free up ' +
    'the activation slot on the server. You may need to contact support.'
  );
  
  if (confirmed) {
    await chrome.storage.local.remove('licenseToken');
    showUnlicensedState();
    alert('License removed locally. If you have issues activating on another device, please contact support.');
  }
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Button appears when license is active
- [ ] Button is hidden when no license
- [ ] Confirmation dialog shows on click
- [ ] Cancel button works (no action taken)
- [ ] Confirm button triggers deactivation
- [ ] Loading state shows during API call
- [ ] Success message appears on success
- [ ] License token is cleared from storage
- [ ] UI updates to unlicensed state
- [ ] Error messages show for failures
- [ ] Network errors are handled gracefully
- [ ] Can reactivate after deactivation

### Test Scenarios

1. **Happy Path**: Deactivate and reactivate successfully
2. **Network Failure**: Test with network disabled
3. **Invalid Token**: Test with expired or invalid token
4. **Already Deactivated**: Test deactivating twice
5. **Rate Limiting**: Test multiple rapid deactivations
6. **Different Device**: Deactivate on one device, activate on another

---

## Best Practices

### 1. Store License Token Securely

```javascript
// ✅ Good: Use chrome.storage.local (not synced)
await chrome.storage.local.set({ licenseToken: token });

// ❌ Bad: Use chrome.storage.sync (syncs across devices)
await chrome.storage.sync.set({ licenseToken: token });

// ❌ Bad: Store in localStorage (accessible to content scripts)
localStorage.setItem('licenseToken', token);
```

### 2. Validate Before Deactivation

```javascript
// Check if license exists before showing remove button
const { licenseToken } = await chrome.storage.local.get('licenseToken');
if (licenseToken) {
  document.getElementById('removeLicenseBtn').style.display = 'block';
}
```

### 3. Provide Clear User Guidance

```javascript
// Add tooltip to button
button.title = 'Free up an activation slot by removing the license from this device';

// Add help text
const helpText = document.createElement('p');
helpText.textContent = 'You can reactivate on this device or install on a new device using your license token.';
helpText.className = 'help-text';
```

### 4. Log for Debugging

```javascript
// Log deactivation attempts for debugging
console.log('[License] Deactivation initiated');
console.log('[License] Device info:', getDeviceInfo());

// Log results
if (result.success) {
  console.log('[License] Deactivation successful:', result.activationInfo);
} else {
  console.error('[License] Deactivation failed:', result.message, result.error);
}
```

### 5. Handle Edge Cases

```javascript
// Handle case where user has no internet
if (!navigator.onLine) {
  showError('No internet connection. Please connect and try again.');
  return;
}

// Handle case where storage is full
try {
  await chrome.storage.local.set({ licenseToken: token });
} catch (error) {
  if (error.message.includes('QUOTA_BYTES')) {
    showError('Storage quota exceeded. Please clear some data and try again.');
  }
}
```

### 6. Provide Support Contact

```javascript
// Add support link for persistent issues
const supportLink = document.createElement('a');
supportLink.href = 'https://teamhandso.me/contact';
supportLink.textContent = 'Contact Support';
supportLink.target = '_blank';
```

---

## Support

If you have questions or need help implementing this feature:

- **Documentation**: https://teamhandso.me/docs
- **Support Email**: support@teamhandso.me
- **Account Dashboard**: https://teamhandso.me/account

---

## Changelog

### Version 1.0 (Current)
- Initial release of self-service deactivation feature
- Replaces manual unlock request system
- Immediate activation slot freeing
