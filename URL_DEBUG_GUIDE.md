# URL Debug Guide for AdReply Templates

## Issue: Template URLs not appearing in generated suggestions

### Quick Debug Steps:

1. **Check Template Creation**:
   - When creating your Etsy Sellers template, make sure you fill in the "Website URL" field
   - The URL should be something like: `https://myetsyshop.etsy.com`

2. **Check Template Content**:
   - Your template content should include `{url}` placeholder, like:
     ```
     Beautiful handmade work! Check out my Etsy shop: {url}
     ```
   - OR if you don't include `{url}`, the system will automatically append the URL

3. **Use Debug Tools**:
   - Click the "Debug Templates & URLs" button in the Adverts tab
   - Check the browser console (F12) for debug output
   - Look for lines like:
     ```
     AdReply: Template URL: https://myetsyshop.etsy.com
     AdReply: Final suggestion: Beautiful work! Check out my Etsy shop: https://myetsyshop.etsy.com
     ```

4. **Test in Console**:
   - Open browser console (F12)
   - Run: `debugTemplateMatching()` to see all templates and their URLs
   - Run: `testEtsySuggestions()` to test Etsy-specific matching

### Common Issues:

1. **Empty URL Field**: Make sure you actually entered a URL when creating the template
2. **Missing Placeholder**: If your template doesn't have `{url}` or `{site}`, the URL should be auto-appended
3. **Template Not Matching**: Check if your keywords match the post content

### Expected Behavior:

- Template with `{url}`: "Great work! Check out {url}" → "Great work! Check out https://myetsyshop.etsy.com"
- Template without placeholder: "Great work!" → "Great work! https://myetsyshop.etsy.com"

### Debug Output to Look For:

```
AdReply: Processing template: Etsy Shop Promotion
AdReply: Template URL: https://myetsyshop.etsy.com
AdReply: URL to use: https://myetsyshop.etsy.com
AdReply: Original suggestion: Beautiful handmade work! Check out my shop {url}
AdReply: After {url} replacement: Beautiful handmade work! Check out my shop https://myetsyshop.etsy.com
AdReply: Final suggestion: Beautiful handmade work! Check out my shop https://myetsyshop.etsy.com
```

If you don't see the URL in the debug output, the template URL wasn't saved properly.