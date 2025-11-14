# AdReply v2.0 - Onboarding Wizard Guide

## Overview

The AI Setup Wizard is your gateway to getting started with AdReply v2.0. Instead of manually creating categories, templates, and keywords, you simply describe your business and let AI generate a complete advertising system tailored to your needs.

## When You'll See the Wizard

### First-Time Installation
When you install AdReply v2.0 for the first time, the wizard automatically opens to guide you through setup.

### Upgrading from v1.x
If you're upgrading from AdReply v1.x, the wizard is **skipped automatically** to preserve your existing templates and settings. You can still access it later from Settings.

### Re-running the Wizard
You can re-run the wizard anytime from the Settings page by clicking the "Re-run AI Wizard" button. This is useful when:
- You want to pivot to a different business niche
- You need fresh template ideas
- You want to expand into new categories

## Step-by-Step Walkthrough

### Step 1: Welcome Screen
The wizard starts with a welcome message explaining what it will do:
- Generate 3-5 categories tailored to your business
- Create 50+ professionally crafted templates (400-600 characters each)
- Identify relevant keywords for automatic post matching
- Set up your promotional URL

**Action**: Click "Get Started" to begin


### Step 2: Describe Your Business
This is the most important step. The AI uses your description to generate everything.

**What to Include:**
- Your industry or niche (e.g., "real estate agent", "fitness coach", "handmade jewelry")
- Your target audience (e.g., "first-time homebuyers", "busy professionals")
- Your unique selling points (e.g., "eco-friendly products", "24/7 availability")
- Your service area (optional, e.g., "serving Miami area")

**Example Descriptions:**

*Good Example:*
```
I'm a real estate agent specializing in luxury waterfront properties 
in South Florida. I help high-net-worth clients find their dream homes 
and investment properties. I offer personalized service, market expertise, 
and exclusive access to off-market listings.
```

*Too Short:*
```
Real estate agent
```
(Not enough context for AI to generate relevant templates)

*Too Long:*
```
[500+ words of detailed business history]
```
(Keep it focused - 50-200 words is ideal)

**Character Limit**: 50-1000 characters
**Action**: Type your description and click "Next"


### Step 3: Company/Promotion URL
Enter the URL you want to promote in your templates.

**What to Enter:**
- Your website homepage
- A landing page for a specific offer
- Your booking/contact page
- Your social media profile

**Examples:**
- `https://www.myrealestate.com`
- `https://calendly.com/myname/consultation`
- `https://www.facebook.com/mybusiness`

**Note**: This URL will be automatically appended to all your templates. You can change it later in Settings.

**Action**: Enter your URL and click "Next" (or skip if you don't have one yet)

### Step 4: Choose AI Provider
AdReply v2.0 supports two AI providers. Choose the one you prefer:

#### Option 1: Google Gemini (Recommended)
- **Pros**: Free tier available, fast responses, good quality
- **Cons**: Requires Google account and API key
- **Best For**: Most users, especially those new to AI APIs

#### Option 2: OpenAI
- **Pros**: High-quality outputs, well-known service
- **Cons**: Requires paid account (no free tier)
- **Best For**: Users who already have OpenAI API access

**Action**: Select your preferred provider and click "Next"


### Step 5: Enter API Key

#### Getting a Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with "AIza...")
5. Paste it into the wizard

**Gemini Free Tier**: 60 requests per minute (more than enough for onboarding)

#### Getting an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with "sk-...")
5. Paste it into the wizard

**OpenAI Pricing**: Pay-per-use (typically $0.01-0.03 per onboarding session)

#### Security Note
Your API key is encrypted using Web Crypto API before being stored locally. It's never sent to AdReply servers - only to your chosen AI provider. See [API Key Security Guide](API_KEY_SECURITY.md) for details.

**Action**: Paste your API key and click "Generate Setup"


### Step 6: Generation Progress
The wizard now sends your business description to the AI provider. This typically takes 10-30 seconds.

**What's Happening:**
1. Building a specialized prompt for your niche
2. Sending request to AI provider
3. Receiving generated categories and templates
4. Validating template quality (length, structure)
5. Preparing data for review

**Progress Indicators:**
- Spinning loader animation
- Status messages ("Generating categories...", "Creating templates...")

**If Something Goes Wrong:**
- **Network Error**: Check your internet connection and retry
- **Invalid API Key**: Verify you copied the key correctly
- **Rate Limit**: Wait a few minutes and try again
- **Generation Failed**: Click "Skip" to set up manually

### Step 7: Review Generated Content
The wizard displays everything the AI created for you.

**What You'll See:**
- **Categories**: 3-5 categories relevant to your business
- **Templates per Category**: 10 templates each (50+ total)
- **Character Counts**: Each template is 400-600 characters (Facebook-optimized)
- **Keywords**: Positive and negative keywords for each category

**Review Checklist:**
- ✅ Do the categories match your business?
- ✅ Are the templates professional and relevant?
- ✅ Do the keywords make sense?
- ✅ Are templates long enough (400+ characters)?

**Actions:**
- Click "Looks Good" to proceed
- Click "Regenerate" to try again with a different description
- Click "Skip" to set up manually


### Step 8: Merge or Replace (Existing Users Only)
If you already have templates in AdReply, you'll see this decision screen.

#### Option 1: Merge with Existing Data
- **What Happens**: New categories and templates are added alongside your existing ones
- **Your Data**: All your current templates, categories, and settings are preserved
- **Best For**: Expanding your template library, adding new niches
- **Result**: You'll have both old and new content

#### Option 2: Replace Existing Data
- **What Happens**: All existing templates and categories are deleted
- **Your Data**: Only the new AI-generated content remains
- **Best For**: Complete fresh start, pivoting to a new business
- **Warning**: This action cannot be undone (unless you have a backup)

**Recommendation**: Choose "Merge" unless you're certain you want to start over.

### Step 9: Completion
Success! Your AdReply setup is complete.

**What Was Created:**
- ✅ Categories saved to IndexedDB
- ✅ Templates saved to IndexedDB
- ✅ Keywords configured for matching
- ✅ Settings updated with your business info
- ✅ API key encrypted and stored securely

**Next Steps:**
1. Click "Open AdReply" to see your new templates
2. Navigate to a Facebook Group post
3. Click the AdReply icon to start using your templates
4. The system will automatically suggest relevant templates based on post content


## Re-running the Wizard

### When to Re-run
- You want to add templates for a new business niche
- You're pivoting your business focus
- You want fresh template ideas
- You're not satisfied with the initial generation

### How to Re-run
1. Open AdReply side panel
2. Click the "Settings" tab
3. Scroll to "AI Setup" section
4. Click "Re-run AI Wizard"
5. Follow the same steps as initial setup

### What Happens to Your Data
- **Keyword Learning Stats**: Always preserved (never deleted)
- **Usage History**: Always preserved
- **Templates & Categories**: Depends on your choice (Merge or Replace)
- **Settings**: Updated with new business description

## Manual Setup Option

If you prefer not to use AI, you can skip the wizard and set up manually:

1. Click "Skip AI Setup" on the welcome screen
2. Create categories manually in the Templates tab
3. Add templates one by one
4. Configure keywords for each template
5. Set up your promotional URL in Settings

**Note**: Manual setup gives you complete control but takes significantly longer (30-60 minutes vs. 2 minutes with AI).

## Troubleshooting

### "Invalid API Key" Error
- **Gemini**: Key should start with "AIza..."
- **OpenAI**: Key should start with "sk-..."
- Verify you copied the entire key without spaces
- Check that the key hasn't been revoked

### "Rate Limit Exceeded" Error
- **Gemini Free Tier**: Wait 1 minute and try again
- **OpenAI**: Check your account usage limits
- Try again during off-peak hours

### "Generation Failed" Error
- Check your internet connection
- Verify the AI provider's service status
- Try the other AI provider
- Use manual setup as fallback

### Templates Too Short
If generated templates are under 400 characters:
- Provide a more detailed business description
- Regenerate with emphasis on "detailed, conversational templates"
- Manually edit templates after generation

### Wrong Industry/Niche
If AI misunderstood your business:
- Rewrite your description more clearly
- Include specific industry keywords
- Mention your target audience explicitly
- Regenerate with the improved description

## Best Practices

### Writing Business Descriptions
1. **Be Specific**: "Wedding photographer" not just "photographer"
2. **Include Location**: "Serving Austin, Texas" helps with local relevance
3. **Mention Specialties**: "Specializing in newborn photography"
4. **Target Audience**: "For busy professionals" or "For first-time buyers"
5. **Unique Value**: "Same-day editing" or "Free consultation"

### Choosing AI Providers
- **Start with Gemini**: Free tier is generous and quality is excellent
- **Switch to OpenAI**: If you need different writing styles
- **Test Both**: Generate with each and compare results

### After Setup
1. Review all generated templates for accuracy
2. Edit any templates that don't match your voice
3. Add your own custom templates to supplement AI-generated ones
4. Monitor keyword performance in the analytics dashboard
5. Re-run wizard periodically to refresh content

## Privacy & Security

### What Data is Sent to AI Providers
- Your business description
- Your industry/niche information
- Request for template generation

### What is NOT Sent
- Your existing templates
- Your Facebook activity
- Your personal information
- Your license key
- Your usage statistics

### API Key Storage
- Encrypted using AES-GCM with 256-bit keys
- Stored locally in Chrome storage
- Never sent to AdReply servers
- Can be cleared anytime from Settings

See [API Key Security Guide](API_KEY_SECURITY.md) for complete security details.

## FAQ

**Q: Can I use the wizard multiple times?**
A: Yes! Re-run it anytime from Settings.

**Q: Will re-running delete my templates?**
A: Only if you choose "Replace". Choose "Merge" to keep existing templates.

**Q: Do I need to pay for AI?**
A: Gemini has a free tier. OpenAI requires payment.

**Q: Can I edit AI-generated templates?**
A: Absolutely! Edit them just like any other template.

**Q: What if I don't like the generated content?**
A: Regenerate with a better description, or use manual setup.

**Q: Is my API key safe?**
A: Yes, it's encrypted and stored locally. See security guide for details.

**Q: Can I switch AI providers later?**
A: Yes, change it in Settings and re-run the wizard.

**Q: How long does generation take?**
A: Typically 10-30 seconds depending on AI provider response time.

---

**Next Steps**: Once setup is complete, check out the [Keyword Learning Guide](KEYWORD_LEARNING_GUIDE.md) to understand how AdReply gets smarter with use.
