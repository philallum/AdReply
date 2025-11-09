# Testing Checklist - JWT License Integration

## Pre-Testing Setup

1. ✅ Load extension in Chrome/Edge
2. ✅ Open Developer Tools (F12)
3. ✅ Check for any console errors
4. ✅ Open extension sidepanel

## Test 1: Free License Display

**Steps:**
1. Open sidepanel (no license activated)
2. Go to License tab
3. Go to Templates tab

**Expected Results:**
- License tab shows: "License Status: Free"
- License details: "Free license: 10 templates maximum, 1 category only"
- Templates tab header shows: "0/10 custom templates (1 category max) + 400 prebuilt"
- Text color is gray

**Status:** ⏳ Not tested

---

## Test 2: Pro License Activation

**Steps:**
1. Go to License tab
2. Enter a valid JWT token in the license key field
3. Click "Activate Pro License"
4. Wait for response

**Expected Results:**
- Success notification: "Pro license activated successfully! You now have unlimited templates and categories."
- License status updates to: "Pro (Active)"
- License details show:
  ```
  ✓ Unlimited custom templates
  ✓ Unlimited categories
  ✓ All premium features
  ✓ Device activations: 1/2
  ```
- Templates tab header updates to: "0 custom templates (unlimited) + 400 prebuilt"
- Text color changes to green

**Status:** ⏳ Not tested

---

## Test 3: Template Count Updates (Pro)

**Prerequisites:** Pro license activated

**Steps:**
1. Go to Templates tab
2. Click "Add Template"
3. Fill in template details
4. Save template
5. Check template count

**Expected Results:**
- After adding 1 template: "1 custom templates (unlimited) + 400 prebuilt"
- After adding 5 templates: "5 custom templates (unlimited) + 400 prebuilt"
- No limit warnings
- Can create unlimited categories

**Status:** ⏳ Not tested

---

## Test 4: Activation Limit Error

**Prerequisites:** Token already activated on 2 devices (max limit)

**Steps:**
1. Go to License tab
2. Enter the same JWT token
3. Click "Activate Pro License"

**Expected Results:**
- Error notification: "Activation limit reached (2/2 devices). Please request an unlock in your account dashboard."
- License status remains "Free"
- Template count remains limited

**Status:** ⏳ Not tested

---

## Test 5: Invalid Token Error

**Steps:**
1. Go to License tab
2. Enter an invalid token (e.g., "invalid-token-123")
3. Click "Activate Pro License"

**Expected Results:**
- Error notification with specific error message
- License status remains "Free"
- Template count remains limited

**Status:** ⏳ Not tested

---

## Test 6: Token Rotation

**Prerequisites:** Pro license activated

**Steps:**
1. Activate license
2. Wait 5 seconds
3. Check browser console
4. Look for verification messages

**Expected Results:**
- Console shows: "License verified successfully"
- Token is rotated in storage
- License remains active

**Status:** ⏳ Not tested

---

## Test 7: Periodic Verification

**Prerequisites:** Pro license activated

**Steps:**
1. Activate license
2. Keep extension open for 24+ hours
3. Check console for verification attempts

**Expected Results:**
- Verification happens automatically every 24 hours
- License remains active if server responds
- No user interruption

**Status:** ⏳ Not tested

---

## Test 8: Network Error Handling

**Prerequisites:** Disconnect from internet

**Steps:**
1. Disconnect internet
2. Try to activate license
3. Reconnect internet
4. Try again

**Expected Results:**
- With no internet: "License activation failed: Network error"
- With internet: Activation succeeds
- Graceful error handling

**Status:** ⏳ Not tested

---

## Test 9: License Persistence

**Prerequisites:** Pro license activated

**Steps:**
1. Activate Pro license
2. Close browser completely
3. Reopen browser
4. Open extension sidepanel

**Expected Results:**
- License status still shows "Pro (Active)"
- Template count still shows "unlimited"
- No need to re-activate

**Status:** ⏳ Not tested

---

## Test 10: Check License Button

**Prerequisites:** Pro license activated

**Steps:**
1. Go to License tab
2. Click "Check License Status"

**Expected Results:**
- License status refreshes
- Shows current activation info
- No errors in console

**Status:** ⏳ Not tested

---

## Test 11: Admin License

**Prerequisites:** Admin JWT token

**Steps:**
1. Enter admin license token
2. Activate license

**Expected Results:**
- License status shows "Admin (Active)"
- No activation limit shown
- Unlimited templates and categories
- All premium features enabled

**Status:** ⏳ Not tested

---

## Test 12: Expired Token

**Prerequisites:** Expired JWT token

**Steps:**
1. Enter expired token
2. Try to activate

**Expected Results:**
- Error: "Token signature is invalid or token has expired."
- License remains Free
- Clear error message

**Status:** ⏳ Not tested

---

## Console Checks

Open browser console and verify:

### On Extension Load
- ✅ "AdReply: Background script loaded"
- ✅ "AdReply: Managers initialized successfully"
- ✅ No errors

### On License Activation
- ✅ "License verification request sent"
- ✅ "License verified successfully" OR error message
- ✅ "Token rotated and stored"

### On Periodic Verification
- ✅ "Periodic license verification"
- ✅ "License still valid"

---

## API Endpoint Verification

### Check Request Format
```javascript
// In Network tab, verify POST to:
// https://teamhandso.me/api/verify

// Request body should include:
{
  "licenseToken": "eyJhbGc...",
  "deviceInfo": {
    "userAgent": "...",
    "platform": "...",
    "language": "...",
    "timezone": "...",
    "screenResolution": "..."
  },
  "testMode": false
}
```

### Check Response Format
```javascript
// Success response:
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

---

## Known Issues to Watch For

1. ⚠️ Template count not updating after activation
2. ⚠️ License status not persisting after browser restart
3. ⚠️ Activation limit not showing correctly
4. ⚠️ Network errors not handled gracefully
5. ⚠️ Token rotation not working
6. ⚠️ Periodic verification not triggering

---

## Success Criteria

All tests must pass:
- ✅ Free license displays correctly
- ✅ Pro license activates successfully
- ✅ Template count shows "unlimited" for Pro
- ✅ Activation limits enforced
- ✅ Error messages clear and helpful
- ✅ Token rotation works
- ✅ License persists across sessions
- ✅ Network errors handled gracefully

---

## Test Environment

- **Browser:** Chrome/Edge (latest)
- **OS:** Linux/Windows/Mac
- **API Endpoint:** https://teamhandso.me/api/verify
- **Extension Version:** 1.0.0

---

## Notes

- Test with real JWT tokens from teamhandso.me
- Test both Pro and Admin licenses
- Test activation limits thoroughly
- Monitor console for errors
- Check Network tab for API calls
- Verify token rotation in storage
