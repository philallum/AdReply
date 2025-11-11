# Testing License Deactivation Feature

## Pre-Testing Setup

1. Load the extension in Chrome/Edge developer mode
2. Have a valid Pro license token ready
3. Open the extension side panel

## Test Cases

### Test 1: UI Visibility - Free License
**Steps:**
1. Open extension with no license (Free tier)
2. Navigate to License tab

**Expected:**
- ✅ "Remove License from This Device" section is hidden
- ✅ License status shows "Free"
- ✅ Only activation and upgrade buttons visible

---

### Test 2: License Activation
**Steps:**
1. Enter valid Pro license token
2. Click "Activate Pro License"

**Expected:**
- ✅ Success message appears
- ✅ License status changes to "Pro (Active)"
- ✅ "Remove License from This Device" section appears
- ✅ Template limit changes to unlimited

---

### Test 3: UI Visibility - Pro License
**Steps:**
1. With active Pro license
2. Navigate to License tab

**Expected:**
- ✅ "Remove License from This Device" section is visible
- ✅ Red button with text "Remove License from This Device"
- ✅ Explanatory text about deactivation
- ✅ Activation info displayed (if available)

---

### Test 4: Deactivation Confirmation Dialog
**Steps:**
1. Click "Remove License from This Device" button
2. Read confirmation dialog

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Dialog explains what will happen
- ✅ Mentions freeing up activation slot
- ✅ Mentions ability to reactivate
- ✅ Has Cancel and OK buttons

---

### Test 5: Cancel Deactivation
**Steps:**
1. Click "Remove License from This Device"
2. Click "Cancel" in confirmation dialog

**Expected:**
- ✅ Dialog closes
- ✅ No action taken
- ✅ License remains active
- ✅ UI unchanged

---

### Test 6: Successful Deactivation
**Steps:**
1. Click "Remove License from This Device"
2. Click "OK" in confirmation dialog
3. Wait for completion

**Expected:**
- ✅ Button shows "Removing..." and is disabled
- ✅ API call to `/api/deactivate` is made
- ✅ Success message appears
- ✅ License status changes to "Free"
- ✅ "Remove License from This Device" section is hidden
- ✅ Template limit changes to 10
- ✅ Button returns to normal state

---

### Test 7: Network Error Handling
**Steps:**
1. Disconnect internet
2. Click "Remove License from This Device"
3. Confirm in dialog

**Expected:**
- ✅ Error message appears about network issue
- ✅ Option to remove license locally is offered
- ✅ If local removal accepted:
  - License cleared locally
  - Warning message shown
  - UI updates to Free tier

---

### Test 8: Already Deactivated
**Steps:**
1. Deactivate license successfully
2. Manually restore license token to storage
3. Try to deactivate again

**Expected:**
- ✅ API returns "ACTIVATION_NOT_FOUND" error
- ✅ Local data is cleared anyway
- ✅ Info message: "License was already removed. Local data cleared."
- ✅ UI updates to Free tier

---

### Test 9: Invalid Token
**Steps:**
1. Manually set an invalid/expired token in storage
2. Try to deactivate

**Expected:**
- ✅ Error message about invalid token
- ✅ License remains in storage (not cleared)
- ✅ User can try again or contact support

---

### Test 10: Rate Limiting
**Steps:**
1. Deactivate and reactivate multiple times rapidly
2. Try to deactivate again

**Expected:**
- ✅ Error message about rate limiting
- ✅ Suggests waiting before trying again
- ✅ License remains active

---

### Test 11: Background Script Timeout
**Steps:**
1. Stop/disable background script (for testing)
2. Try to deactivate

**Expected:**
- ✅ Timeout error after 5 seconds
- ✅ Option to remove license locally is offered
- ✅ Warning about potential server-side issues

---

### Test 12: Reactivation After Deactivation
**Steps:**
1. Deactivate license successfully
2. Enter same license token
3. Click "Activate Pro License"

**Expected:**
- ✅ License activates successfully
- ✅ Activation slot is reused
- ✅ All Pro features restored
- ✅ "Remove License from This Device" section appears again

---

### Test 13: Storage Cleanup
**Steps:**
1. Activate Pro license
2. Check chrome.storage.local for license data
3. Deactivate license
4. Check storage again

**Expected:**
- ✅ Before: `adreply_license`, `licenseToken`, `entitlements` exist
- ✅ After: All license keys are removed
- ✅ No orphaned license data remains

---

### Test 14: Template Limit Update
**Steps:**
1. With Pro license, create 15 templates
2. Deactivate license
3. Try to create new template

**Expected:**
- ✅ Template count shows "10/10" (Free limit)
- ✅ Cannot create new templates
- ✅ Existing templates remain accessible
- ✅ Warning about template limit

---

### Test 15: Multiple Devices
**Steps:**
1. Activate license on Device A
2. Activate same license on Device B
3. Deactivate on Device A
4. Verify on Device B

**Expected:**
- ✅ Device A: License removed, Free tier
- ✅ Device B: License still active
- ✅ Activation count decreases by 1
- ✅ Can reactivate on Device A or new device

---

## Browser Console Checks

During testing, monitor console for:
- ✅ No JavaScript errors
- ✅ Proper API calls logged
- ✅ Success/error messages logged
- ✅ Storage operations logged

## Network Tab Checks

Monitor network requests:
- ✅ POST to `https://teamhandso.me/api/deactivate`
- ✅ Request includes `licenseToken` and `deviceInfo`
- ✅ Response is properly handled
- ✅ No unnecessary retries

## Edge Cases

### Edge Case 1: Rapid Clicks
**Steps:**
1. Click "Remove License from This Device" multiple times rapidly

**Expected:**
- ✅ Button disabled after first click
- ✅ Only one API call made
- ✅ No duplicate deactivations

### Edge Case 2: Tab Close During Deactivation
**Steps:**
1. Start deactivation
2. Close extension tab immediately

**Expected:**
- ✅ Deactivation completes in background
- ✅ Storage is cleaned up
- ✅ No corrupted state

### Edge Case 3: Browser Restart
**Steps:**
1. Deactivate license
2. Restart browser
3. Open extension

**Expected:**
- ✅ License remains deactivated
- ✅ Free tier is active
- ✅ No license data in storage

---

## Regression Testing

Verify existing features still work:
- ✅ License activation
- ✅ License verification
- ✅ Template creation
- ✅ Template matching
- ✅ Comment suggestions
- ✅ Backup/restore
- ✅ All other features

---

## Performance Testing

- ✅ Deactivation completes within 5 seconds
- ✅ UI remains responsive during deactivation
- ✅ No memory leaks
- ✅ No excessive API calls

---

## Accessibility Testing

- ✅ Button is keyboard accessible
- ✅ Confirmation dialog is keyboard accessible
- ✅ Screen reader announces button purpose
- ✅ Error messages are announced

---

## Security Testing

- ✅ License token not exposed in console
- ✅ Device info properly sanitized
- ✅ No sensitive data in error messages
- ✅ Storage keys properly cleared

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________ Version: ___________
Extension Version: ___________

Test 1: [ ] Pass [ ] Fail - Notes: ___________
Test 2: [ ] Pass [ ] Fail - Notes: ___________
Test 3: [ ] Pass [ ] Fail - Notes: ___________
...

Overall Result: [ ] All Pass [ ] Some Failures
Issues Found: ___________
```

---

## Known Limitations

1. **Server Dependency**: Requires server to be online for proper deactivation
2. **Local Removal**: Local removal doesn't free server-side activation slot
3. **No Device List**: Cannot see list of activated devices in extension
4. **No Remote Deactivation**: Cannot deactivate other devices from extension

---

## Support Scenarios

If users report issues:

1. **"Button doesn't appear"**
   - Verify license is actually active
   - Check storage for license data
   - Try refreshing license status

2. **"Deactivation fails"**
   - Check network connectivity
   - Verify server is online
   - Try local removal option
   - Contact support if persistent

3. **"Can't activate on new device"**
   - Verify deactivation completed
   - Check activation count on server
   - May need manual unlock from support

---

## Automated Testing (Future)

Consider adding:
- Unit tests for deactivation logic
- Integration tests for API calls
- E2E tests for full user flow
- Mock server for offline testing
