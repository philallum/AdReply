# License Deactivation - Quick Reference

## For Developers

### Key Files
```
adreply/scripts/license-manager.js       → deactivateLicense()
adreply/scripts/background-safe.js       → DEACTIVATE_LICENSE handler
adreply/ui/modules/settings-manager.js   → deactivateLicense()
adreply/ui/sidepanel-modular.js          → removeLicense()
adreply/ui/sidepanel-modular.html        → Remove license UI
```

### API Endpoint
```
POST https://teamhandso.me/api/deactivate
Body: { licenseToken, deviceInfo }
Response: { success, message, activationInfo }
```

### Message Flow
```
UI → Settings Manager → Background Script → License Manager → API
```

### Storage Keys Cleared
```
- adreply_license
- licenseToken
- entitlements
```

## For Testers

### Quick Test
1. Activate Pro license
2. Go to License tab
3. Click "Remove License from This Device"
4. Confirm dialog
5. Verify: License removed, UI shows Free tier

### Error Tests
- Network error → Offers local removal
- Already deactivated → Clears local data
- Invalid token → Shows error

## For Users

### How to Remove License
1. Open extension
2. Click License tab
3. Click red "Remove License from This Device" button
4. Confirm in dialog
5. Done! Can now activate on another device

### What Happens
- ✅ License removed from this device
- ✅ Activation slot freed up
- ✅ Can reactivate on same device later
- ✅ Can activate on different device

### If Something Goes Wrong
- Check internet connection
- Try again
- Contact support@teamhandso.me

## Code Snippets

### Call Deactivation
```javascript
const result = await settingsManager.deactivateLicense();
if (result.success) {
  // Success
} else {
  // Handle error
}
```

### Check License Status
```javascript
const status = await licenseManager.getLicenseStatusSummary();
console.log(status.tier); // 'free' or 'pro'
```

### Force Local Removal
```javascript
await settingsManager.forceRemoveLicense();
```

## Documentation

- **Full Implementation**: `docs/LICENSE_DEACTIVATION_IMPLEMENTATION.md`
- **Flow Diagrams**: `docs/LICENSE_DEACTIVATION_FLOW.md`
- **Test Plan**: `TESTING_LICENSE_DEACTIVATION.md`
- **Changes Summary**: `LICENSE_DEACTIVATION_CHANGES.md`
- **Original Spec**: `docs/EXTENSION_IMPLEMENTATION_GUIDE.md`

## Status

✅ Implementation Complete
⏳ Testing Required
⏳ API Verification Required

## Support

- Docs: https://teamhandso.me/docs
- Email: support@teamhandso.me
- Account: https://teamhandso.me/account
