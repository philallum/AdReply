# AI Client Export Error - FIXED ✅

## The Error
```
Failed to initialize AI client: TypeError: Cannot read properties of undefined (reading 'create')
at OnboardingWizard.initializeAIClient (onboarding-wizard.js:305:38)
```

## Root Cause

The `ai-client.js` file was using **CommonJS** export syntax:
```javascript
// OLD (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIClient, AIError, GeminiProvider, OpenAIProvider };
}
```

But the onboarding wizard was trying to import it as an **ES6 module**:
```javascript
// ES6 import
const AIClientModule = await import('../../scripts/ai-client.js');
const AIClient = AIClientModule.default || AIClientModule.AIClient;
```

When using ES6 dynamic imports, CommonJS exports don't work properly in the browser, causing `AIClient` to be `undefined`.

## The Fix

Changed `ai-client.js` to use ES6 export syntax:
```javascript
// NEW (ES6)
export { AIClient, AIError, GeminiProvider, OpenAIProvider };
export default AIClient;
```

## Files Modified

- ✅ `adreply/scripts/ai-client.js` - Changed to ES6 exports

## How the AI Client Works

### Creating an AI Client Instance

```javascript
// Import the module
import AIClient from './scripts/ai-client.js';

// Create a client for Gemini
const geminiClient = AIClient.create('gemini', 'YOUR_API_KEY');

// Or create a client for OpenAI
const openaiClient = AIClient.create('openai', 'YOUR_API_KEY');

// Generate setup
const result = await geminiClient.generateSetup(businessDescription);
```

### Supported Providers

1. **Gemini** (`'gemini'`)
   - Google's Gemini AI model
   - API Key from: https://makersuite.google.com/app/apikey
   - Free tier available

2. **OpenAI** (`'openai'`)
   - OpenAI's GPT models
   - API Key from: https://platform.openai.com/api-keys
   - Paid service

## What to Do Now

### 1. Reload the Extension
```
1. Go to chrome://extensions/
2. Find AdReply
3. Click the reload button (🔄)
```

### 2. Test the AI Setup Wizard

1. **Open the wizard:**
   - AdReply → License tab → "Run AI Setup Wizard"

2. **Enter your business description:**
   - Type at least 50 characters (up to 1000)
   - Click "Next"

3. **Enter company URL:**
   - Optional but recommended
   - Click "Next"

4. **Select AI provider:**
   - Choose "Google Gemini" or "OpenAI"
   - Click "Next"

5. **Enter API key:**
   - Paste your valid API key
   - Click "Generate Setup"

6. **Wait for generation:**
   - Should take 10-30 seconds
   - Progress indicator will show
   - **Should NOT show the error anymore!**

### 3. Verify Success

**Console should show:**
```
✅ No errors about "Cannot read properties of undefined"
✅ "Generating setup..." messages
✅ "Setup generated successfully" (or similar)
```

**UI should show:**
- Generated categories (3-5)
- Generated templates (10 per category)
- Review screen with all content
- "Looks Good" and "Regenerate" buttons

## Testing with Different Providers

### Test with Gemini
```
Provider: gemini
API Key: AIza... (your Gemini key)
Expected: Should generate templates successfully
```

### Test with OpenAI
```
Provider: openai
API Key: sk-... (your OpenAI key)
Expected: Should generate templates successfully
```

## Common Issues After Fix

### "Invalid API Key" Error
**Cause:** API key is incorrect or expired
**Solution:** 
- Verify you copied the entire key
- Check key hasn't been revoked
- Try generating a new key

### "Rate Limit Exceeded" Error
**Cause:** Too many requests to AI provider
**Solution:**
- **Gemini**: Wait 1 minute (free tier: 60 requests/minute)
- **OpenAI**: Check your account usage limits

### "Network Error"
**Cause:** No internet connection or firewall blocking
**Solution:**
- Check internet connection
- Verify firewall allows requests to:
  - `https://generativelanguage.googleapis.com/*` (Gemini)
  - `https://api.openai.com/*` (OpenAI)

### Templates Too Short
**Cause:** AI didn't follow length requirements
**Solution:**
- The system validates templates (400-600 characters)
- Invalid templates are automatically filtered out
- If all templates are invalid, you'll see an error
- Try regenerating with a more detailed business description

## Security Notes

### API Key Handling
- ✅ Keys are encrypted before storage (AES-GCM 256-bit)
- ✅ Keys are cleared from memory after use
- ✅ Keys are never logged to console
- ✅ Keys are only sent to official AI provider endpoints

### What Gets Sent to AI Providers
- Your business description
- Request for template generation
- **Nothing else** (no personal data, no existing templates)

### What Doesn't Get Sent
- ❌ Your existing templates
- ❌ Your Facebook activity
- ❌ Your license key
- ❌ Your usage statistics

## Verification Commands

Run these in the browser console to verify the fix:

```javascript
// 1. Test dynamic import
const module = await import(chrome.runtime.getURL('scripts/ai-client.js'));
console.log('AIClient:', module.default);
console.log('Has create method:', typeof module.default.create === 'function');

// 2. Test creating a client (with dummy key)
try {
  const client = module.default.create('gemini', 'test-key');
  console.log('Client created:', !!client);
} catch (error) {
  console.log('Expected error (invalid key):', error.message);
}

// 3. Check supported providers
console.log('Supported providers:', module.default.getSupportedProviders());
```

**Expected output:**
```
AIClient: class AIClient { ... }
Has create method: true
Client created: true
Supported providers: [{ id: 'gemini', ... }, { id: 'openai', ... }]
```

## Related Files

These files work together for AI generation:
- ✅ `scripts/ai-client.js` - AI provider interface (FIXED)
- ✅ `ui/modules/onboarding-wizard.js` - Wizard UI logic
- ✅ `ui/onboarding.html` - Wizard HTML
- ✅ `scripts/encryption-utils.js` - API key encryption

## Why This Happened

The `ai-client.js` was originally written with CommonJS syntax (probably for Node.js compatibility), but Chrome extensions running in the browser need ES6 module syntax for dynamic imports to work properly.

**CommonJS** works in Node.js but not in browser dynamic imports
**ES6 Modules** work in both Node.js (with type: "module") and browsers

Since this is a Chrome extension, we need ES6 module syntax.

---

**Status**: ✅ AI Client Export Fixed - OpenAI Should Work Now!
**Date**: November 14, 2025
**Impact**: AI Setup Wizard can now properly initialize and use both Gemini and OpenAI providers
