# License Deactivation UI Preview

## Before Implementation (Old UI)

```
┌─────────────────────────────────────────────┐
│              License Tab                     │
├─────────────────────────────────────────────┤
│                                              │
│  License Status: Pro (Active)                │
│  ✓ Unlimited custom templates                │
│  ✓ Unlimited categories                      │
│  ✓ All premium features                      │
│  ✓ Device activations: 1/2                   │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ License Key                         │     │
│  │ [________________________]          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Activate Pro License]                      │
│  [Check License Status]                      │
│                                              │
│  [Upgrade to Pro]                            │
│                                              │
└─────────────────────────────────────────────┘
```

## After Implementation (New UI)

```
┌─────────────────────────────────────────────┐
│              License Tab                     │
├─────────────────────────────────────────────┤
│                                              │
│  License Status: Pro (Active)                │
│  ✓ Unlimited custom templates                │
│  ✓ Unlimited categories                      │
│  ✓ All premium features                      │
│  ✓ Device activations: 1/2                   │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ License Key                         │     │
│  │ [________________________]          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Activate Pro License]                      │
│  [Check License Status]                      │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  License Management                          │
│                                              │
│  Remove your license from this device to     │
│  free up an activation slot. You can         │
│  reactivate on this device or install on     │
│  a different device using your license       │
│  token.                                      │
│                                              │
│  [Remove License from This Device] ← RED     │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  [Upgrade to Pro]                            │
│                                              │
└─────────────────────────────────────────────┘
```

## Confirmation Dialog

```
┌─────────────────────────────────────────────┐
│  Remove License from This Device?           │
├─────────────────────────────────────────────┤
│                                              │
│  This will remove your license from this     │
│  device and free up an activation slot.      │
│                                              │
│  You can reactivate on this device or        │
│  install on a different device using your    │
│  license token from your account dashboard   │
│  at teamhandso.me/account.                   │
│                                              │
│  Are you sure you want to continue?          │
│                                              │
│         [Cancel]           [OK]              │
│                                              │
└─────────────────────────────────────────────┘
```

## During Deactivation (Loading State)

```
┌─────────────────────────────────────────────┐
│              License Tab                     │
├─────────────────────────────────────────────┤
│                                              │
│  License Status: Pro (Active)                │
│  ✓ Unlimited custom templates                │
│  ✓ Unlimited categories                      │
│  ✓ All premium features                      │
│  ✓ Device activations: 1/2                   │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ License Key                         │     │
│  │ [________________________]          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Activate Pro License]                      │
│  [Check License Status]                      │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  License Management                          │
│                                              │
│  Remove your license from this device to     │
│  free up an activation slot. You can         │
│  reactivate on this device or install on     │
│  a different device using your license       │
│  token.                                      │
│                                              │
│  [Removing...] ← DISABLED, GRAYED OUT        │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  [Upgrade to Pro]                            │
│                                              │
└─────────────────────────────────────────────┘
```

## After Successful Deactivation

```
┌─────────────────────────────────────────────┐
│              License Tab                     │
├─────────────────────────────────────────────┤
│                                              │
│  License Status: Free                        │
│  Free license: 10 templates maximum,         │
│  1 category only                             │
│                                              │
│  Pro Features                                │
│  • Unlimited templates & categories          │
│  • Advanced template features                │
│  • Template generation from niche            │
│    descriptions                              │
│  • Enhanced template matching                │
│  • Priority support                          │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ License Key                         │     │
│  │ [________________________]          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Activate Pro License]                      │
│  [Check License Status]                      │
│                                              │
│  [Upgrade to Pro]                            │
│                                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ✓ License removed successfully!            │
│    You can now install on a new device.     │
└─────────────────────────────────────────────┘
```

## Error State - Network Error

```
┌─────────────────────────────────────────────┐
│              License Tab                     │
├─────────────────────────────────────────────┤
│                                              │
│  License Status: Pro (Active)                │
│  ✓ Unlimited custom templates                │
│  ✓ Unlimited categories                      │
│  ✓ All premium features                      │
│  ✓ Device activations: 1/2                   │
│                                              │
│  [Remove License from This Device]           │
│                                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Unable to contact server. Remove license   │
│  locally?                                    │
├─────────────────────────────────────────────┤
│                                              │
│  This will clear the license from this       │
│  device, but may not free up the activation  │
│  slot on the server. You may need to         │
│  contact support.                            │
│                                              │
│  Continue with local removal?                │
│                                              │
│         [Cancel]           [OK]              │
│                                              │
└─────────────────────────────────────────────┘
```

## Mobile View (Responsive)

```
┌──────────────────────┐
│    License Tab       │
├──────────────────────┤
│                      │
│  License Status:     │
│  Pro (Active)        │
│                      │
│  ✓ Unlimited         │
│    templates         │
│  ✓ Unlimited         │
│    categories        │
│  ✓ All premium       │
│    features          │
│  ✓ Activations: 1/2  │
│                      │
│  License Key         │
│  [______________]    │
│                      │
│  [Activate Pro]      │
│  [Check Status]      │
│                      │
│  ──────────────      │
│                      │
│  License Management  │
│                      │
│  Remove your license │
│  from this device to │
│  free up an          │
│  activation slot.    │
│                      │
│  [Remove License]    │
│  ← RED, FULL WIDTH   │
│                      │
│  ──────────────      │
│                      │
│  [Upgrade to Pro]    │
│                      │
└──────────────────────┘
```

## Color Scheme

### Remove License Button
- **Background**: `#dc3545` (Red)
- **Hover**: `#c82333` (Darker Red)
- **Disabled**: `#dc3545` with 60% opacity
- **Text**: White

### License Status
- **Pro (Active)**: `#28a745` (Green)
- **Free**: `#6c757d` (Gray)

### Section Divider
- **Border**: `#dee2e6` (Light Gray)

### Explanatory Text
- **Color**: `#6c757d` (Gray)
- **Font Size**: 12px
- **Line Height**: 1.5

## Accessibility

✅ **Keyboard Navigation**
- Tab to button
- Enter/Space to activate
- Tab through dialog

✅ **Screen Reader**
- Button announces: "Remove License from This Device, button"
- Dialog announces: "Remove License from This Device? Dialog"
- Status announces: "License Status: Pro, Active"

✅ **Color Contrast**
- Red button: 4.5:1 contrast ratio
- Text: 4.5:1 contrast ratio
- Meets WCAG AA standards

## Animation

### Button States
```
Normal → Hover → Active → Disabled
  ↓       ↓        ↓         ↓
Red    Darker   Pressed   Grayed
       Red      Red       Out
```

### Notification Toast
```
Slide in from right → Display 3s → Slide out to right
```

### Section Visibility
```
Hidden (display: none) ↔ Visible (display: block)
Instant transition, no animation
```

## Responsive Breakpoints

### Desktop (> 768px)
- Full width layout
- Button: 100% width
- Text: 12px

### Tablet (481px - 768px)
- Compact layout
- Button: 100% width
- Text: 12px

### Mobile (< 480px)
- Stacked layout
- Button: 100% width
- Text: 11px
- Reduced padding

## Browser Compatibility

✅ Chrome 88+
✅ Edge 88+
✅ Firefox 78+
✅ Safari 14+ (if WebExtension support)

## CSS Classes

```css
#removeLicenseSection     → Container
#removeLicenseBtn         → Button
.license-status.valid     → Pro status
.license-status.invalid   → Free status
```

## HTML Structure

```html
<div id="removeLicenseSection" style="display: none;">
  <h4>License Management</h4>
  <p>Remove your license from this device...</p>
  <button id="removeLicenseBtn">
    Remove License from This Device
  </button>
</div>
```
