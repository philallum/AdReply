# License Deactivation Implementation

## Overview

This document describes the implementation of the self-service license deactivation feature in the AdReply browser extension, following the specification in `EXTENSION_IMPLEMENTATION_GUIDE.md`.

## Changes Made

### 1. License Manager (`adreply/scripts/license-manager.js`)

**Added `deactivateLicense()` method:**
- Calls the `POST https://teamhandso.me/api/deactivate` endpoint
- Sends license token and device information
- Handles success/error responses
- Clears local license data on successful deactivation
- Returns detailed result with activation info

**Device Information Collection:**
The existing `collectDeviceInfo()` method already collects:
- `userAgent`: Browser user agent string
- `platform`: Operating system platform
- `language`: Browser language
- `timezone`: User's timezone
- `screenResolution`: Screen dimensions

### 2. Background Script (`adreply/scripts/background-safe.js`)

**Added `DEACTIVATE_LICENSE` message handler:**
- Receives deactivation requests from UI
- Calls `licenseManager.deactivateLicense()`
- Returns result to UI
- Handles async response properly

### 3. Settings Manager (`adreply/ui/modules/settings-manager.js`)

**Added `deactivateLicense()` method:**
- Sends message to background script
- Handles timeout scenarios
- Returns structured result with success/error info
- Updates local license status

**Added `forceRemoveLicense()` method:**
- Provides fallback for local license removal
- Used when server is unreachable
- Clears all license-related storage keys

### 4. UI Manager (`adreply/ui/modules/ui-manager.js`)

**Updated `updateLicenseStatus()` method:**
- Shows/hides remove license section based on license status
- Displays activation information when available
- Updates UI to reflect licensed/unlicensed states

### 5. Main UI (`adreply/ui/sidepanel-modular.html`)

**Added Remove License Section:**
- New section in License tab (hidden by default)
- Shows only when Pro license is active
- Contains:
  - Explanatory text about deactivation
  - "Remove License from This Device" button (red/danger style)
  - Clear description of what happens

**Added CSS Styling:**
- Red button styling for remove action
- Disabled state styling
- Section layout and typography

### 6. Main Application (`adreply/ui/sidepanel-modular.js`)

**Added `removeLicense()` method:**
- Shows confirmation dialog before deactivation
- Handles loading states (button disabled, text changes)
- Calls `settingsManager.deactivateLicense()`
- Handles multiple scenarios:
  - **Success**: Updates UI, shows success message
  - **Already deactivated**: Clears local data, shows info message
  - **Server unreachable**: Offers local removal option
  - **Other errors**: Shows error message
- Updates template manager and count after deactivation
- Restores button state after completion

**Added event listener:**
- Wires up remove license button click handler

### 7. License Utils (`adreply/scripts/license-utils.js`)

**Added `deactivateLicense()` static method:**
- Utility function for deactivation
- Sends message to background script
- Returns promise with result
- Handles errors gracefully

## User Flow

1. **User has active Pro license**
   - License tab shows "License Status: Pro (Active)"
   - "Remove License from This Device" section is visible

2. **User clicks "Remove License from This Device"**
   - Confirmation dialog appears with clear explanation
   - User can cancel or confirm

3. **User confirms removal**
   - Button shows "Removing..." and is disabled
   - Extension calls deactivation API with license token and device info
   - API marks device activation as inactive

4. **Success scenario**
   - License token cleared from local storage
   - UI updates to show Free tier
   - Success message: "License removed successfully! You can now install on a new device."
   - Remove license section is hidden

5. **Error scenarios**

   **Already deactivated:**
   - Local data is cleared anyway
   - Info message: "License was already removed. Local data cleared."

   **Server unreachable:**
   - User is offered local removal option
   - If accepted: Local data cleared with warning message
   - Warning: "License removed locally. Contact support if you have issues activating on another device."

   **Other errors:**
   - Error message displayed
   - License remains active locally
   - User can try again or contact support

## API Integration

### Deactivation Endpoint

```
POST https://teamhandso.me/api/deactivate
Content-Type: application/json

{
  "licenseToken": "eyJhbGc...",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Linux x86_64",
    "language": "en-US",
    "timezone": "America/New_York",
    "screenResolution": "1920x1080"
  }
}
```

### Success Response

```json
{
  "success": true,
  "message": "License removed from this device successfully",
  "activationInfo": {
    "deactivatedDeviceId": "device_abc123",
    "remainingActivations": 1,
    "maxActivations": 2
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE"
}
```

## Error Handling

The implementation handles these error scenarios:

1. **INVALID_TOKEN**: Shows error, suggests getting new token
2. **ACTIVATION_NOT_FOUND**: Clears local data, shows info message
3. **NETWORK_ERROR**: Offers local removal option
4. **RATE_LIMIT_EXCEEDED**: Shows error, suggests waiting
5. **Background script timeout**: Offers local removal option

## Storage Keys Affected

When license is deactivated, these storage keys are cleared:
- `adreply_license`: Main license data object
- `licenseToken`: JWT token
- `entitlements`: License entitlements

## Testing Checklist

- [x] Remove license button appears when Pro license is active
- [x] Remove license button is hidden when no license
- [x] Confirmation dialog shows on button click
- [x] Cancel button works (no action taken)
- [x] Confirm button triggers deactivation
- [x] Loading state shows during API call
- [x] Success message appears on success
- [x] License token is cleared from storage
- [x] UI updates to Free tier state
- [x] Error messages show for failures
- [x] Network errors are handled gracefully
- [x] Already-deactivated scenario handled
- [x] Local removal option works when server unreachable

## Security Considerations

1. **Token Storage**: License tokens are stored in `chrome.storage.local` (not synced)
2. **Device Fingerprinting**: Device info helps server match activations accurately
3. **Confirmation Required**: User must confirm before deactivation
4. **Server Validation**: Server validates token and device before deactivation
5. **Graceful Degradation**: Local removal available if server unreachable

## Compatibility

- **Manifest Version**: V3
- **Chrome/Edge**: Fully compatible
- **Firefox**: Compatible (uses standard WebExtension APIs)
- **Storage API**: Uses `chrome.storage.local`
- **Messaging**: Uses `chrome.runtime.sendMessage`

## Future Enhancements

Potential improvements for future versions:

1. **Device Management UI**: Show list of activated devices
2. **Remote Deactivation**: Deactivate other devices from account dashboard
3. **Activation History**: Show activation/deactivation history
4. **Better Device Names**: Allow users to name their devices
5. **Automatic Cleanup**: Auto-deactivate inactive devices after X days

## Support

If users encounter issues:
- **Documentation**: https://teamhandso.me/docs
- **Support Email**: support@teamhandso.me
- **Account Dashboard**: https://teamhandso.me/account

## Related Files

- `docs/EXTENSION_IMPLEMENTATION_GUIDE.md` - Original specification
- `adreply/scripts/license-manager.js` - Core license logic
- `adreply/scripts/background-safe.js` - Background script handlers
- `adreply/ui/modules/settings-manager.js` - UI license management
- `adreply/ui/sidepanel-modular.js` - Main application logic
- `adreply/ui/sidepanel-modular.html` - UI structure
