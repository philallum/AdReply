# License Deactivation Flow Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                  (sidepanel-modular.html)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           License Tab                               │    │
│  │                                                      │    │
│  │  [License Status: Pro (Active)]                     │    │
│  │  ✓ Unlimited templates                              │    │
│  │  ✓ Device activations: 1/2                          │    │
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────┐    │    │
│  │  │  Remove License Section                     │    │    │
│  │  │                                              │    │    │
│  │  │  "Remove your license from this device..."  │    │    │
│  │  │                                              │    │    │
│  │  │  [Remove License from This Device] ←─────┐  │    │    │
│  │  └────────────────────────────────────────────┘  │  │    │
│  └──────────────────────────────────────────────────┘  │    │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ User clicks button
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Confirmation Dialog                        │
│                                                              │
│  "Remove License from This Device?"                          │
│                                                              │
│  This will remove your license from this device and          │
│  free up an activation slot.                                 │
│                                                              │
│  You can reactivate on this device or install on a           │
│  different device using your license token.                  │
│                                                              │
│  Are you sure you want to continue?                          │
│                                                              │
│         [Cancel]              [OK] ←─────────────────┐       │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ User confirms
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Main Application Logic                          │
│            (sidepanel-modular.js)                            │
│                                                              │
│  async removeLicense() {                                     │
│    1. Show loading state                                     │
│    2. Call settingsManager.deactivateLicense()               │
│    3. Handle result                                          │
│    4. Update UI                                              │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Settings Manager                                │
│         (modules/settings-manager.js)                        │
│                                                              │
│  async deactivateLicense() {                                 │
│    1. Send message to background script                      │
│    2. Wait for response (5s timeout)                         │
│    3. Return result                                          │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ chrome.runtime.sendMessage
                                │ { type: 'DEACTIVATE_LICENSE' }
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Script                               │
│           (background-safe.js)                               │
│                                                              │
│  case 'DEACTIVATE_LICENSE':                                  │
│    const result = await licenseManager.deactivateLicense()   │
│    sendResponse(result)                                      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              License Manager                                 │
│           (license-manager.js)                               │
│                                                              │
│  async deactivateLicense() {                                 │
│    1. Check if token exists                                  │
│    2. Collect device info                                    │
│    3. Call API                                               │
│    4. Handle response                                        │
│    5. Clear storage on success                               │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ fetch()
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Server                                │
│              (teamhandso.me/api)                             │
│                                                              │
│  POST /api/deactivate                                        │
│  {                                                           │
│    licenseToken: "eyJhbGc...",                               │
│    deviceInfo: { ... }                                       │
│  }                                                           │
│                                                              │
│  ↓ Server validates token                                    │
│  ↓ Finds device activation                                   │
│  ↓ Marks as inactive                                         │
│  ↓ Returns result                                            │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    success: true,                                            │
│    message: "License removed...",                            │
│    activationInfo: { ... }                                   │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ Response flows back up
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              License Manager                                 │
│                                                              │
│  if (result.success) {                                       │
│    await this.clearLicense()  // Clear storage               │
│    return { success: true }                                  │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Chrome Storage                                  │
│                                                              │
│  Keys removed:                                               │
│  - adreply_license                                           │
│  - licenseToken                                              │
│  - entitlements                                              │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ Result returns to UI
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Main Application                                │
│                                                              │
│  if (result.success) {                                       │
│    await this.checkLicense()  // Refresh status              │
│    this.templateManager.setProLicense(false)                 │
│    this.updateTemplateCount()                                │
│    showNotification("License removed successfully!")         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Updated UI                                │
│                                                              │
│  [License Status: Free]                                      │
│  Free license: 10 templates maximum, 1 category only         │
│                                                              │
│  [Remove License Section] ← Hidden                           │
│                                                              │
│  ✓ Success notification shown                                │
│  ✓ Template limit: 10                                        │
│  ✓ Can reactivate or use on new device                       │
└─────────────────────────────────────────────────────────────┘
```

## Error Flow - Network Error

```
User clicks Remove → Confirmation → API Call
                                      │
                                      │ Network error
                                      ▼
                            ┌─────────────────────┐
                            │  Error Detected     │
                            │  (NETWORK_ERROR)    │
                            └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Offer Local        │
                            │  Removal Option     │
                            └─────────────────────┘
                                      │
                            ┌─────────┴─────────┐
                            │                   │
                    User Accepts        User Declines
                            │                   │
                            ▼                   ▼
                  ┌──────────────────┐  ┌──────────────┐
                  │ Clear Local Data │  │ Keep License │
                  │ Show Warning     │  │ Show Error   │
                  └──────────────────┘  └──────────────┘
```

## Error Flow - Already Deactivated

```
User clicks Remove → Confirmation → API Call
                                      │
                                      │ ACTIVATION_NOT_FOUND
                                      ▼
                            ┌─────────────────────┐
                            │  Already Deactivated│
                            │  on Server          │
                            └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Clear Local Data   │
                            │  Anyway             │
                            └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Show Info Message  │
                            │  "Already removed"  │
                            └─────────────────────┘
```

## Data Flow

### Request Data
```javascript
{
  licenseToken: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  deviceInfo: {
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)...",
    platform: "Linux x86_64",
    language: "en-US",
    timezone: "America/New_York",
    screenResolution: "1920x1080"
  }
}
```

### Response Data (Success)
```javascript
{
  success: true,
  message: "License removed from this device successfully",
  activationInfo: {
    deactivatedDeviceId: "device_abc123",
    remainingActivations: 1,
    maxActivations: 2
  }
}
```

### Response Data (Error)
```javascript
{
  success: false,
  message: "Activation not found for this device",
  error: "ACTIVATION_NOT_FOUND"
}
```

## State Transitions

```
┌──────────────┐
│  No License  │
│   (Free)     │
└──────┬───────┘
       │
       │ Activate License
       ▼
┌──────────────┐
│ Pro License  │
│   (Active)   │
└──────┬───────┘
       │
       │ Remove License
       ▼
┌──────────────┐
│  No License  │
│   (Free)     │
└──────┬───────┘
       │
       │ Reactivate
       ▼
┌──────────────┐
│ Pro License  │
│   (Active)   │
└──────────────┘
```

## Storage State Changes

### Before Deactivation
```javascript
chrome.storage.local = {
  adreply_license: {
    token: "encrypted_token",
    status: "pro",
    tier: "pro",
    plan: "pro",
    entitlements: { ... },
    activationInfo: { ... }
  },
  licenseToken: "eyJhbGc...",
  entitlements: { plan: "pro", features: [...] }
}
```

### After Deactivation
```javascript
chrome.storage.local = {
  // License keys removed
  // Other extension data preserved
}
```

## UI State Changes

### Before Deactivation
- License Status: "Pro (Active)" (green)
- Remove License Section: Visible
- Template Limit: Unlimited
- Template Count: "X custom templates (unlimited)"

### After Deactivation
- License Status: "Free" (gray)
- Remove License Section: Hidden
- Template Limit: 10
- Template Count: "X/10 custom templates"

## Message Flow

```
UI Layer          Settings Manager     Background Script    License Manager
   │                     │                     │                   │
   │  removeLicense()    │                     │                   │
   ├────────────────────>│                     │                   │
   │                     │  sendMessage()      │                   │
   │                     │  DEACTIVATE_LICENSE │                   │
   │                     ├────────────────────>│                   │
   │                     │                     │  deactivateLicense()
   │                     │                     ├──────────────────>│
   │                     │                     │                   │
   │                     │                     │  fetch(/api/deactivate)
   │                     │                     │                   ├──> API
   │                     │                     │                   │<── Response
   │                     │                     │                   │
   │                     │                     │  clearLicense()   │
   │                     │                     │                   ├──> Storage
   │                     │                     │                   │
   │                     │                     │<──────────────────┤
   │                     │<────────────────────┤  return result    │
   │<────────────────────┤  return result      │                   │
   │  updateUI()         │                     │                   │
   │                     │                     │                   │
```

## Timeline

```
0ms    User clicks "Remove License from This Device"
       │
10ms   Confirmation dialog appears
       │
       │ User confirms
       │
20ms   Button disabled, text changes to "Removing..."
       │
30ms   Message sent to background script
       │
50ms   Background script receives message
       │
60ms   License manager starts deactivation
       │
70ms   Device info collected
       │
80ms   API request sent
       │
       │ Network round-trip
       │
500ms  API response received
       │
510ms  Response validated
       │
520ms  Storage cleared
       │
530ms  Result sent back to UI
       │
540ms  UI receives result
       │
550ms  License status refreshed
       │
560ms  Template manager updated
       │
570ms  Template count updated
       │
580ms  Success notification shown
       │
590ms  Button restored
       │
600ms  UI fully updated
```
