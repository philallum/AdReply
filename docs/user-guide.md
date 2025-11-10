# AdReply User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Templates](#creating-templates)
3. [Using Comment Suggestions](#using-comment-suggestions)
4. [AI Features (Pro)](#ai-features-pro)
5. [License Management](#license-management)
6. [Import/Export](#importexport)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Troubleshooting](#troubleshooting)
9. [Privacy & Security](#privacy--security)

## Getting Started

### What is AdReply?
AdReply is a Chrome extension that helps small business owners, creators, and marketers advertise effectively within Facebook Groups. It provides contextually relevant advertisement-style comment suggestions based on viewed posts, enabling natural promotion without automation or spam.

### Installation
1. Download AdReply from the Chrome Web Store
2. Click "Add to Chrome" to install the extension
3. The AdReply sidebar will appear on Facebook group pages
4. Start creating your first advertisement template

### First Steps
1. **Navigate to a Facebook Group**: AdReply only works on Facebook group pages
2. **Open the Sidebar**: The AdReply panel appears as a fixed sidebar on the right side of your screen
3. **Create Your First Template**: Click "Add Template" to create your first advertisement template
4. **View Suggestions**: When you scroll through posts, AdReply will suggest relevant comments

## Creating Templates

### What are Templates?
Templates are pre-written advertisement comments that AdReply uses to generate suggestions. Each template contains:
- **Label**: A descriptive name for easy identification
- **Content**: The main advertisement text with optional placeholders
- **Keywords**: Words that help match templates to relevant posts
- **Categories**: Optional groupings for organization
- **Variants**: Alternative versions to prevent repetition

### Creating a New Template

1. **Click "Add Template"** in the Templates section
2. **Fill in the Template Form**:
   - **Template Label**: Give your template a descriptive name (e.g., "Garage | Exhaust offer")
   - **Template Content**: Write your advertisement text. Use `{site}` as a placeholder for your website URL
   - **Keywords**: Enter comma-separated keywords that relate to your service (e.g., "exhaust, garage, fit, performance")
   - **Categories**: Optional categories to organize your templates (e.g., "motorcycles, cars")
   - **Variants**: Optional alternative versions of your template (one per line)

3. **Click "Create Template"** to save

### Template Best Practices

#### Writing Effective Templates
- **Be Natural**: Write like you're genuinely helping, not just advertising
- **Be Specific**: Mention specific services or products you offer
- **Include Value**: Explain what benefit you provide
- **Use Placeholders**: Use `{site}` for your website URL

#### Good Template Examples
```
Great build! If you need custom exhaust work, we do same-day fitting — {site}.

Nice project! We specialize in performance upgrades like this. Check out our work at {site}.

Love the setup! If you ever need professional tuning, we're local and offer dyno services — {site}.
```

#### Keyword Strategy
- Use 10-15 relevant keywords per template
- Use 5-10 negative keywords for enhanced filtering per template (e.g. -motorcycle)
- Include both general terms (e.g., "car") and specific terms (e.g., "exhaust")
- Think about what words appear in posts you want to respond to
- Include synonyms and variations

### Template Limits
- **Free Users**: Up to 10 ad templates and one category
- **Pro Users**: Unlimited templates and categories

## Using Comment Suggestions

### How Suggestions Work
1. **Post Detection**: AdReply analyzes Facebook posts
2. **Keyword Matching**: Posts are matched against your advert template keywords
3. **Relevance Scoring**: Templates are ranked by relevance (0-100%)
4. **Top Suggestions**: The 3 most relevant templates are displayed

### Viewing Suggestions
- Suggestions appear in the "Comment Suggestions" section
- Each suggestion shows:
  - The suggested comment text
  - Relevance score (percentage match)
  - Template name
  - Ranking (1st, 2nd, 3rd)

### Using Suggestions
1. **Review Suggestions**: Check that the suggestion is appropriate for the post
2. **Click to Select**: Click on a suggestion to select it
3. **Copy or Insert**: Use the "Copy" button or click to insert into Facebook's comment box
4. **Edit if Needed**: Modify the comment before posting if necessary

### Anti-Spam Protection
AdReply includes built-in anti-spam features:
- **Template Rotation**: Prevents using the same template twice in a row in the same group
- **Variant Cycling**: Automatically cycles through template variants
- **Group Tracking**: Remembers what templates you've used in each group

## AI Features (Pro)

### Overview
Pro users get access to AI-powered features that enhance template creation and management:
- **Template Rephrasing**: Rewrite templates with different tones and styles
- **Template Generation**: Create new templates from business descriptions
- **Enhanced Matching**: Improved relevance scoring using AI

### Setting Up AI Features

1. **Upgrade to Pro**: Purchase a Pro license
2. **Navigate to AI Settings**: Click the "AI Settings" tab
3. **Choose Provider**: Select either Google Gemini or OpenAI
4. **Enter API Key**: Add your API key from your chosen provider
5. **Save Settings**: Your AI features are now active

### Getting API Keys

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into AdReply

#### OpenAI
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key and paste it into AdReply

### Using AI Rephrasing

1. **Select a Template**: Find the template you want to rephrase
2. **Click the AI Icon**: Click the purple AI rephrase button
3. **Add Context** (Optional): Provide additional context for better results
4. **Generate**: Click "Rephrase with AI"
5. **Review Results**: Check the rephrased version
6. **Apply or Regenerate**: Apply the new version or try again

### Batch Rephrasing
1. **Click "Batch Rephrase"**: Available in the templates section header
2. **Select Templates**: Choose which templates to rephrase
3. **Add Context**: Provide context that applies to all templates
4. **Start Process**: Begin batch rephrasing
5. **Review Results**: Check each rephrased template
6. **Apply Changes**: Choose which rephrased versions to keep

### AI Template Generation
1. **Click "Generate Templates"**: Available for Pro users
2. **Describe Your Business**: Provide details about your services
3. **Set Parameters**: Choose how many templates to generate
4. **Generate**: Let AI create templates for you
5. **Review and Edit**: Customize the generated templates
6. **Save**: Add the templates to your library

## License Management

### License Types

#### Free License
- Up to 10 templates
- Basic template matching
- Template rotation and anti-spam
- Local storage and privacy

#### Pro License
- Unlimited templates
- AI-powered rephrasing
- AI template generation
- Enhanced matching algorithms
- Ad Pack import/export
- Priority support

### Upgrading to Pro

1. **Purchase License**: Visit [teamhandso.me](https://teamhandso.me) to purchase
2. **Get License Key**: You'll receive a JWT license key
3. **Enter Key**: Go to the License tab and enter your key
4. **Validate**: Click "Validate" to activate Pro features

### License Validation
- **Automatic**: AdReply checks your license monthly
- **Manual**: You can manually validate anytime in the License tab
- **Grace Period**: 7-day grace period if validation fails
- **Offline**: Works offline with cached validation

## Import/Export

### Ad Packs
Ad Packs are JSON files containing pre-made templates for specific niches or industries.

### Importing Ad Packs (Pro Feature)

1. **Get Ad Pack**: Download an Ad Pack JSON file
2. **Click Import/Export**: Use the dropdown in the Templates section
3. **Select "Import Ad Pack"**: Choose the import option
4. **Upload File**: Select your Ad Pack JSON file
5. **Configure Options**:
   - Skip duplicates (recommended)
   - Validate templates
   - Preserve categories
6. **Import**: Click "Import Ad Pack"
7. **Review Results**: Check the import summary

### Exporting Templates

1. **Click Import/Export**: Use the dropdown in the Templates section
2. **Select "Export Templates"**: Choose the export option
3. **Choose Export Type**:
   - All templates
   - Selected templates
   - By category
4. **Add Metadata**: Provide title and description
5. **Export**: Download your Ad Pack file

### Backup and Restore

#### Creating Backups
1. **Click Import/Export** → **Create Backup**
2. **Automatic Naming**: Backups are named with date/time
3. **Download**: Save the backup file to your computer

#### Restoring Backups
1. **Click Import/Export** → **Restore Backup**
2. **Select File**: Choose your backup JSON file
3. **Confirm**: Restore will replace current templates
4. **Complete**: Your templates are restored

## Keyboard Shortcuts

### Navigation
- **Tab**: Navigate between interface elements
- **Arrow Keys**: Navigate between tabs and list items
- **Enter/Space**: Activate buttons and select items
- **Escape**: Close modals and dropdowns

### Tab Navigation
- **Left/Right Arrows**: Switch between tabs
- **Home**: Go to first tab
- **End**: Go to last tab

### Template Management
- **Ctrl+N**: Create new template (when focused on templates)
- **Delete**: Delete selected template (with confirmation)
- **F2**: Edit selected template

### Suggestions
- **Up/Down Arrows**: Navigate between suggestions
- **Enter**: Select suggestion
- **Ctrl+C**: Copy selected suggestion

### Accessibility
- **Alt+M**: Skip to main content
- **Alt+T**: Focus template search
- **Alt+S**: Focus suggestions area

## Troubleshooting

### Common Issues

#### AdReply Sidebar Not Showing
- **Check URL**: Make sure you're on a Facebook group page
- **Refresh Page**: Try refreshing the Facebook page
- **Check Extension**: Ensure AdReply is enabled in Chrome extensions
- **Clear Cache**: Clear browser cache and cookies

#### No Suggestions Appearing
- **Create Templates**: Make sure you have templates with relevant keywords
- **Check Keywords**: Ensure your template keywords match post content
- **Scroll Posts**: AdReply analyzes posts as you scroll through them
- **Wait**: Give AdReply a moment to analyze new posts

#### Templates Not Saving
- **Check Limits**: Free users are limited to 10 templates
- **Fill Required Fields**: Ensure label, content, and keywords are filled
- **Check Connection**: Ensure stable internet connection
- **Try Again**: Close and reopen the template form

#### AI Features Not Working
- **Check License**: Ensure you have an active Pro license
- **Verify API Key**: Check that your API key is correct and active
- **Check Quota**: Ensure you haven't exceeded API usage limits
- **Try Different Provider**: Switch between Gemini and OpenAI

#### License Validation Failing
- **Check Key**: Ensure license key is entered correctly
- **Check Internet**: Ensure stable internet connection
- **Try Manual Validation**: Use the manual validation button
- **Contact Support**: Reach out if issues persist

### Performance Issues

#### Slow Loading
- **Close Other Tabs**: Reduce browser memory usage
- **Disable Other Extensions**: Temporarily disable other extensions
- **Clear Storage**: Clear AdReply's local storage
- **Restart Browser**: Close and reopen Chrome

#### High Memory Usage
- **Limit Templates**: Reduce number of templates if very high
- **Clear History**: Clear template usage history
- **Restart Extension**: Disable and re-enable AdReply

### Getting Help

#### Self-Help Resources
1. **Check This Guide**: Review relevant sections above
2. **Check Console**: Open browser developer tools for error messages
3. **Try Incognito**: Test in incognito mode to rule out conflicts

#### Contact Support
- **Email**: support@teamhandso.me
- **Include Details**: Describe the issue, steps to reproduce, and browser version
- **Screenshots**: Include screenshots if helpful
- **Console Logs**: Include any error messages from browser console

## Privacy & Security

### Data Storage
- **Local Only**: All templates and settings stored locally in your browser
- **No Cloud Sync**: Data never leaves your device
- **No Tracking**: AdReply doesn't track your browsing or usage
- **Secure Storage**: Data encrypted in browser storage

### API Keys
- **Local Storage**: API keys stored securely in browser
- **No Transmission**: Keys never sent to AdReply servers
- **Direct Connection**: AI requests go directly to provider (Gemini/OpenAI)
- **User Control**: You can delete keys anytime

### License Validation
- **Minimal Data**: Only license key sent for validation
- **Secure Connection**: All validation uses HTTPS
- **No Personal Info**: No personal information transmitted
- **Cached Locally**: Validation cached to minimize requests

### Facebook Integration
- **Read Only**: AdReply only reads post content for analysis
- **No Automation**: Never automatically posts comments
- **Manual Control**: You control all comment posting
- **No Data Collection**: Post content not stored or transmitted

### Permissions
AdReply requests minimal Chrome permissions:
- **activeTab**: To access current Facebook tab
- **storage**: To save templates and settings locally
- **scripting**: To inject content scripts on Facebook
- **unlimitedStorage**: To store templates without limits

### Security Best Practices
1. **Keep Updated**: Always use the latest version of AdReply
2. **Secure API Keys**: Don't share your API keys with others
3. **Regular Backups**: Export your templates regularly
4. **Monitor Usage**: Check API usage if using AI features
5. **Report Issues**: Report any security concerns immediately

---

## Quick Reference

### Template Creation Checklist
- [ ] Descriptive label
- [ ] Natural, helpful content
- [ ] 5-10 relevant keywords
- [ ] Optional categories for organization
- [ ] Optional variants for variety

### Daily Usage Workflow
1. Navigate to Facebook group
2. Scroll through posts
3. Review AdReply suggestions
4. Select appropriate suggestion
5. Customize if needed
6. Post comment manually

### Pro Features Checklist
- [ ] Purchase Pro license
- [ ] Enter license key
- [ ] Set up AI provider
- [ ] Enter API key
- [ ] Test AI features

### Troubleshooting Steps
1. Check you're on Facebook group page
2. Verify extension is enabled
3. Refresh the page
4. Check template keywords
5. Contact support if needed

---

*Last updated: [Current Date]*
*Version: 1.0*