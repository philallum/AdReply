# License Deactivation - Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] Review all modified files
- [ ] Check for console.log statements (remove or keep for debugging)
- [ ] Verify error messages are user-friendly
- [ ] Confirm no hardcoded test data
- [ ] Review security considerations

### Server-Side Requirements
- [ ] Verify `/api/deactivate` endpoint is implemented
- [ ] Test endpoint with valid license token
- [ ] Test endpoint with invalid token
- [ ] Test endpoint with already-deactivated device
- [ ] Verify device fingerprinting works correctly
- [ ] Test rate limiting
- [ ] Verify activation count updates correctly

### Testing
- [ ] Complete all 15 test cases in `TESTING_LICENSE_DEACTIVATION.md`
- [ ] Test on Chrome
- [ ] Test on Edge
- [ ] Test on Firefox (if supported)
- [ ] Test with real license tokens
- [ ] Test with multiple devices
- [ ] Test network error scenarios
- [ ] Test edge cases

### Documentation
- [ ] Update user documentation
- [ ] Update API documentation
- [ ] Update changelog
- [ ] Update version number
- [ ] Create release notes

## Deployment Steps

### 1. Version Update
- [ ] Update version in `manifest.json`
- [ ] Update version in documentation
- [ ] Tag release in git

### 2. Build
- [ ] Run any build scripts
- [ ] Verify all files are included
- [ ] Test built extension locally

### 3. Chrome Web Store
- [ ] Upload new version
- [ ] Update store description (if needed)
- [ ] Update screenshots (if needed)
- [ ] Submit for review

### 4. Edge Add-ons
- [ ] Upload new version
- [ ] Update store description (if needed)
- [ ] Submit for review

### 5. Firefox Add-ons (if applicable)
- [ ] Upload new version
- [ ] Update store description (if needed)
- [ ] Submit for review

## Post-Deployment

### Monitoring
- [ ] Monitor error logs
- [ ] Monitor API endpoint usage
- [ ] Monitor deactivation success rate
- [ ] Check for user feedback
- [ ] Monitor support tickets

### Verification
- [ ] Test deactivation in production
- [ ] Verify activation slots are freed
- [ ] Test reactivation after deactivation
- [ ] Verify storage cleanup
- [ ] Check analytics/metrics

### Communication
- [ ] Announce new feature to users
- [ ] Update help documentation
- [ ] Update FAQ
- [ ] Send email to Pro users (optional)
- [ ] Post on social media (optional)

## Rollback Plan

### If Issues Arise
1. [ ] Identify the issue
2. [ ] Determine severity
3. [ ] If critical:
   - [ ] Revert to previous version
   - [ ] Notify users
   - [ ] Fix issue
   - [ ] Re-deploy
4. [ ] If minor:
   - [ ] Document issue
   - [ ] Plan fix for next release
   - [ ] Provide workaround to users

### Rollback Steps
- [ ] Have previous version ready
- [ ] Know how to quickly revert
- [ ] Have communication plan ready
- [ ] Monitor after rollback

## Success Metrics

### Week 1
- [ ] Track deactivation attempts
- [ ] Track success rate
- [ ] Track error rate
- [ ] Monitor support tickets

### Month 1
- [ ] Analyze usage patterns
- [ ] Identify common issues
- [ ] Gather user feedback
- [ ] Plan improvements

## Known Issues

Document any known issues:
- [ ] Issue 1: _________________
- [ ] Issue 2: _________________
- [ ] Issue 3: _________________

## Support Preparation

### Support Team Training
- [ ] Train support team on new feature
- [ ] Provide troubleshooting guide
- [ ] Create FAQ for common issues
- [ ] Set up monitoring dashboard

### Common Issues & Solutions
- [ ] Document "Button doesn't appear" → Check license status
- [ ] Document "Deactivation fails" → Check network, try local removal
- [ ] Document "Can't activate on new device" → Check activation count
- [ ] Document "License still shows after removal" → Clear cache, restart

## Files to Review

### Modified Files
- [ ] `adreply/scripts/license-manager.js`
- [ ] `adreply/scripts/background-safe.js`
- [ ] `adreply/scripts/license-utils.js`
- [ ] `adreply/ui/modules/settings-manager.js`
- [ ] `adreply/ui/modules/ui-manager.js`
- [ ] `adreply/ui/sidepanel-modular.js`
- [ ] `adreply/ui/sidepanel-modular.html`

### Documentation Files
- [ ] `docs/EXTENSION_IMPLEMENTATION_GUIDE.md` (original spec)
- [ ] `docs/LICENSE_DEACTIVATION_IMPLEMENTATION.md`
- [ ] `docs/LICENSE_DEACTIVATION_FLOW.md`
- [ ] `LICENSE_DEACTIVATION_CHANGES.md`
- [ ] `TESTING_LICENSE_DEACTIVATION.md`
- [ ] `IMPLEMENTATION_COMPLETE.md`
- [ ] `QUICK_REFERENCE.md`
- [ ] `UI_PREVIEW.md`
- [ ] `DEPLOYMENT_CHECKLIST.md` (this file)

## API Endpoint Verification

### Test Cases
```bash
# Test 1: Valid deactivation
curl -X POST https://teamhandso.me/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseToken": "VALID_TOKEN",
    "deviceInfo": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Linux x86_64",
      "language": "en-US",
      "timezone": "America/New_York",
      "screenResolution": "1920x1080"
    }
  }'

# Expected: { "success": true, "message": "...", "activationInfo": {...} }

# Test 2: Invalid token
curl -X POST https://teamhandso.me/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseToken": "INVALID_TOKEN",
    "deviceInfo": {...}
  }'

# Expected: { "success": false, "error": "INVALID_TOKEN", "message": "..." }

# Test 3: Already deactivated
curl -X POST https://teamhandso.me/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseToken": "ALREADY_DEACTIVATED_TOKEN",
    "deviceInfo": {...}
  }'

# Expected: { "success": false, "error": "ACTIVATION_NOT_FOUND", "message": "..." }
```

## Security Checklist

- [ ] License tokens are not logged
- [ ] Device info is sanitized
- [ ] API uses HTTPS
- [ ] Rate limiting is in place
- [ ] Token validation is secure
- [ ] No sensitive data in error messages
- [ ] Storage is properly cleared

## Performance Checklist

- [ ] Deactivation completes within 5 seconds
- [ ] UI remains responsive
- [ ] No memory leaks
- [ ] No excessive API calls
- [ ] Proper timeout handling

## Accessibility Checklist

- [ ] Button is keyboard accessible
- [ ] Dialog is keyboard accessible
- [ ] Screen reader support
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Error messages are announced

## Browser-Specific Testing

### Chrome
- [ ] Extension loads correctly
- [ ] Deactivation works
- [ ] Storage cleanup works
- [ ] No console errors

### Edge
- [ ] Extension loads correctly
- [ ] Deactivation works
- [ ] Storage cleanup works
- [ ] No console errors

### Firefox (if applicable)
- [ ] Extension loads correctly
- [ ] Deactivation works
- [ ] Storage cleanup works
- [ ] No console errors

## Final Sign-Off

- [ ] Code reviewed by: _______________
- [ ] Testing completed by: _______________
- [ ] Documentation reviewed by: _______________
- [ ] Security reviewed by: _______________
- [ ] Ready for deployment: _______________

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________

## Post-Deployment Verification

### Day 1
- [ ] Monitor error logs
- [ ] Check deactivation success rate
- [ ] Respond to support tickets
- [ ] Fix critical issues immediately

### Week 1
- [ ] Analyze usage metrics
- [ ] Review user feedback
- [ ] Document common issues
- [ ] Plan improvements

### Month 1
- [ ] Full feature review
- [ ] User satisfaction survey
- [ ] Performance analysis
- [ ] Plan next iteration

## Emergency Contacts

- **Developer**: _______________
- **Support Lead**: _______________
- **Product Manager**: _______________
- **DevOps**: _______________

## Notes

_Add any additional notes or considerations here_

---

**Status**: ⏳ PENDING DEPLOYMENT
**Last Updated**: November 11, 2025
