# AdReply v2.0 - Affiliate Links Setup Guide

## Overview

The Affiliate Link System allows you to automatically inject monetization links into your advertising templates. Instead of manually adding links to each template, you configure them once and they're inserted automatically wherever you use the `{{link}}` placeholder.

## Understanding the Two Link Systems

AdReply v2.0 has two distinct link features:

### 1. Company URL (Existing Feature)
- **Purpose**: Your main business/promotional URL
- **Behavior**: Automatically appended to the END of ALL templates
- **Configuration**: Settings → Company URL
- **Example**: `https://mybusiness.com`

### 2. Affiliate Links (NEW in v2.0)
- **Purpose**: Monetization links, product links, special offers
- **Behavior**: Replaces `{{link}}` placeholder WITHIN template text
- **Configuration**: Settings → Affiliate Links
- **Example**: `https://amazon.com/ref/myid-123`

### How They Work Together

**Template:**
```
Check out this amazing product: {{link}}

It's perfect for your needs and comes with a satisfaction guarantee!

Contact me for more info: https://mybusiness.com
```

**Rendered Output:**
```
Check out this amazing product: https://amazon.com/ref/myid-123

It's perfect for your needs and comes with a satisfaction guarantee!

Contact me for more info: https://mybusiness.com
```


## Setting Up Affiliate Links

### Default Affiliate Link

This is your fallback link used when no category-specific link is configured.

**Setup Steps:**
1. Open AdReply side panel
2. Click "Settings" tab
3. Scroll to "Affiliate Links" section
4. Enter your default affiliate link
5. Click "Save"

**When to Use:**
- You have one main affiliate program
- Same link works for all categories
- Simple setup for beginners

**Example Use Cases:**
- Amazon Associates link
- Your main product page
- General referral link
- Booking/scheduling link

### Category-Specific Links

Override the default link for specific categories.

**Setup Steps:**
1. Go to Settings → Affiliate Links
2. Find "Category Overrides" section
3. Select a category from dropdown
4. Enter the specific link for that category
5. Click "Add Override"
6. Repeat for other categories

**When to Use:**
- Different products per category
- Multiple affiliate programs
- Category-specific offers
- Targeted landing pages

**Example:**
- **Real Estate Category**: `https://calendly.com/myname/property-consultation`
- **Home Services Category**: `https://mywebsite.com/free-quote`
- **Products Category**: `https://amazon.com/ref/myid-123`


## Using {{link}} in Templates

### Adding the Placeholder

When creating or editing templates:

**Option 1: During Template Creation**
```
I highly recommend this product: {{link}}

It's been a game-changer for my clients!
```

**Option 2: Edit Existing Templates**
1. Open template editor
2. Find where you want the link
3. Type `{{link}}` exactly (case-sensitive)
4. Save template

### Placeholder Rules

**Correct Usage:**
- `{{link}}` - Exactly like this
- Can appear anywhere in template
- Can use multiple times in one template
- Surrounded by text or on its own line

**Incorrect Usage:**
- `{link}` - Missing one set of braces
- `{{ link }}` - Extra spaces
- `{{Link}}` - Wrong capitalization
- `{{url}}` - Wrong keyword

### Template Examples

**Example 1: Product Recommendation**
```
🌟 Looking for the perfect gift?

I've found an amazing solution that my clients love: {{link}}

It's affordable, high-quality, and ships fast. Check it out!

Questions? Reach out: https://mybusiness.com
```

**Example 2: Service Booking**
```
Ready to transform your space?

Book a free consultation here: {{link}}

I'll assess your needs and provide a custom quote. No obligation!

Serving the Miami area since 2010.
https://mycontracting.com
```

**Example 3: Multiple Links**
```
Two resources I recommend:

1. Beginner's guide: {{link}}
2. Advanced training: {{link}}

Both have helped hundreds of my clients succeed!

Let's chat: https://mycoaching.com
```


## How Link Replacement Works

### Rendering Priority

When a template is rendered:

1. **Check for Category Override**: Does this category have a specific link?
2. **Use Default**: If no override, use the default affiliate link
3. **Remove Placeholder**: If no links configured, remove `{{link}}` gracefully

### Graceful Fallback

If you haven't configured any affiliate links:

**Template:**
```
Check out this product: {{link}}

It's amazing!
```

**Rendered (No Links Configured):**
```
Check out this product:

It's amazing!
```

The `{{link}}` line is removed entirely, preventing broken templates.

### Preview Before Using

Always preview templates to see how links will appear:

1. Open template in editor
2. Look for "Preview" section
3. See rendered output with actual links
4. Verify links are correct
5. Test links by clicking them


## Common Affiliate Programs

### Amazon Associates
**Link Format:** `https://amazon.com/dp/PRODUCT-ID?tag=YOUR-TAG-20`

**Setup:**
1. Join Amazon Associates program
2. Get your associate tag
3. Create product links in Amazon dashboard
4. Add to AdReply as default or category-specific

**Best For:** Product recommendations, reviews, gift guides

### ClickBank
**Link Format:** `https://VENDOR.PRODUCT.hop.clickbank.net/?tid=YOUR-ID`

**Setup:**
1. Sign up for ClickBank
2. Find products to promote
3. Generate hop links
4. Add to AdReply

**Best For:** Digital products, courses, software

### ShareASale
**Link Format:** `https://shareasale.com/r.cfm?b=BANNER&u=YOUR-ID&m=MERCHANT`

**Setup:**
1. Join ShareASale network
2. Apply to merchant programs
3. Generate affiliate links
4. Add to AdReply

**Best For:** Wide variety of products and services

### Your Own Products
**Link Format:** Any URL you control

**Examples:**
- `https://mystore.com/products/item-123`
- `https://gumroad.com/l/my-product`
- `https://calendly.com/myname/consultation`

**Best For:** Direct sales, bookings, consultations


## Best Practices

### Link Management

1. **Use URL Shorteners**: Make links cleaner and trackable
   - bit.ly
   - TinyURL
   - Your own domain redirect

2. **Track Performance**: Use UTM parameters
   ```
   https://mysite.com/product?utm_source=facebook&utm_medium=adreply&utm_campaign=spring2025
   ```

3. **Test Links Regularly**: Ensure they're not broken
   - Click links in preview
   - Check affiliate dashboard
   - Update expired links

4. **Organize by Category**: Use category overrides strategically
   - Different products per category
   - Different landing pages
   - Different tracking codes

### Disclosure Requirements

**Legal Requirement**: Disclose affiliate relationships

**How to Disclose:**
```
🌟 Full disclosure: This is an affiliate link, meaning I may earn 
a commission if you make a purchase. I only recommend products 
I genuinely believe in!

Check it out: {{link}}
```

**Or Shorter:**
```
Affiliate link: {{link}}
(I may earn a commission at no extra cost to you)
```

**Why It Matters:**
- FTC requires disclosure
- Builds trust with audience
- Protects you legally
- Shows transparency


### Template Writing Tips

**Do:**
- ✅ Provide value before the link
- ✅ Explain why you recommend it
- ✅ Be honest about pros and cons
- ✅ Include personal experience
- ✅ Make links contextual

**Don't:**
- ❌ Lead with the link
- ❌ Use clickbait
- ❌ Recommend products you haven't tried
- ❌ Spam links in every template
- ❌ Hide affiliate relationships

**Good Example:**
```
I've been using this tool for 6 months and it's saved me hours 
every week. The automation features are incredible, and customer 
support is top-notch.

If you're struggling with [problem], this might help: {{link}}

Happy to answer questions about my experience!
```

**Bad Example:**
```
CLICK HERE NOW: {{link}}

AMAZING PRODUCT! BUY TODAY!
```

### Conversion Optimization

**Increase Click-Through:**
1. **Create Urgency**: "Limited time offer"
2. **Show Value**: "Save 30% with this link"
3. **Reduce Risk**: "30-day money-back guarantee"
4. **Social Proof**: "Used by 10,000+ customers"
5. **Clear CTA**: "Click here to learn more"

**Example:**
```
🎯 Special offer for my community!

Get 20% off your first order with this link: {{link}}

This product has a 4.8-star rating from 5,000+ reviews and 
comes with a 60-day guarantee. I've personally used it for 
3 months and love it.

Offer expires this Friday!
```


## Troubleshooting

### "{{link}} Not Being Replaced"
**Possible Causes:**
- Typo in placeholder (check spelling and braces)
- No affiliate link configured
- Wrong category selected

**Solutions:**
1. Verify placeholder is exactly `{{link}}`
2. Check Settings → Affiliate Links
3. Ensure default link is set
4. Check category override if applicable
5. Preview template to see rendered output

### "Wrong Link Appearing"
**Cause:** Category override taking precedence over default

**Solution:**
1. Check Settings → Affiliate Links → Category Overrides
2. Remove override if not needed
3. Or update override to correct link

### "Link Validation Failed"
**Possible Causes:**
- Invalid URL format
- Missing http:// or https://
- Special characters in URL

**Solutions:**
1. Ensure URL starts with `https://` or `http://`
2. Test URL in browser first
3. Remove special characters if possible
4. Use URL shortener if needed

### "Placeholder Removed from Template"
**Cause:** No affiliate links configured (this is intentional)

**Solution:**
- Configure default affiliate link in Settings
- Or remove `{{link}}` from template if not needed


### "Can't Save Affiliate Link"
**Possible Causes:**
- Storage quota exceeded
- Invalid URL format
- Browser permissions issue

**Solutions:**
1. Free up storage space
2. Verify URL format
3. Check browser console for errors
4. Try shorter URL or use URL shortener

## Advanced Strategies

### Dynamic Link Rotation
Create multiple templates with different affiliate links:
- Template A: Product 1 link
- Template B: Product 2 link
- Template C: Product 3 link

Rotate through templates to test which products convert best.

### Seasonal Links
Update affiliate links seasonally:
- **Spring**: Gardening products
- **Summer**: Travel deals
- **Fall**: Back-to-school items
- **Winter**: Holiday gifts

Set reminders to update links quarterly.

### A/B Testing
Test different link placements:
- Beginning of template
- Middle of template
- End of template

Track which placement gets more clicks.

### Multi-Tier Funnels
Use different links for different stages:
- **Awareness**: Free resource link
- **Consideration**: Product comparison link
- **Decision**: Direct purchase link

Match template content to funnel stage.


## Privacy & Security

### Link Storage
- Stored locally in chrome.storage.local
- Never sent to AdReply servers
- Included in backup files
- Can be cleared anytime

### Link Privacy
- Links are visible in your templates
- Anyone can see them when you post
- Use URL shorteners for cleaner appearance
- Track clicks through affiliate dashboard

### Data Collection
- AdReply doesn't track your affiliate links
- AdReply doesn't track clicks or conversions
- All tracking happens through your affiliate program
- No data shared with third parties

## FAQ

**Q: Can I use multiple affiliate programs?**
A: Yes, use category overrides for different programs per category.

**Q: Do I need to disclose affiliate links?**
A: Yes, FTC requires disclosure. Include it in your templates.

**Q: Can I change links after templates are created?**
A: Yes, update in Settings and all templates will use the new link.

**Q: What if I don't have affiliate links?**
A: Don't use `{{link}}` placeholder. Use company URL feature instead.

**Q: Can I track which templates generate sales?**
A: Use different links per template with UTM parameters.

**Q: Will this work with any affiliate program?**
A: Yes, any URL works - affiliate links, product pages, booking links, etc.

**Q: Can I use shortened URLs?**
A: Yes, bit.ly, TinyURL, or custom domains all work.

**Q: How many category overrides can I have?**
A: Unlimited - one per category.

**Q: Can I remove affiliate links later?**
A: Yes, delete from Settings or remove `{{link}}` from templates.

**Q: Do affiliate links expire?**
A: Depends on your affiliate program. Check and update regularly.

---

**Next Steps**: Learn how to upgrade from v1.x in the [Migration Guide](MIGRATION_GUIDE.md).
