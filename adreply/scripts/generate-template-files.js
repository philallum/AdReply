/**
 * Script to generate remaining template JSON files
 * Run this to create all 20 category JSON files
 */

const fs = require('fs').promises;
const path = require('path');

// Category definitions with sample templates
const categoryDefinitions = {
  'beauty': {
    name: 'Beauty & Wellness',
    description: 'Salons, spas, cosmetics, and beauty services',
    sampleTemplates: [
      { keywords: ['beauty', 'salon', 'hair', 'style'], template: 'Gorgeous look! Transform your style at our professional salon! {url}' },
      { keywords: ['spa', 'massage', 'relax', 'wellness'], template: 'So relaxing! Treat yourself to our spa and wellness services! {url}' },
      { keywords: ['makeup', 'cosmetics', 'beauty', '-cheap'], template: 'Beautiful makeup! Get professional makeup services for any occasion! {url}' },
      { keywords: ['nails', 'manicure', 'pedicure'], template: 'Perfect nails! Our nail technicians create stunning manicures and pedicures! {url}' },
      { keywords: ['skincare', 'facial', 'treatment'], template: 'Glowing skin! Our skincare treatments will rejuvenate your complexion! {url}' }
    ]
  },
  'real-estate': {
    name: 'Real Estate',
    description: 'Property sales, rentals, and real estate management',
    sampleTemplates: [
      { keywords: ['house', 'home', 'sale', 'realtor'], template: 'Beautiful home! Looking to buy or sell? Our realtors can help! {url}' },
      { keywords: ['apartment', 'rental', 'lease', 'rent'], template: 'Great location! We have apartments and rentals available now! {url}' },
      { keywords: ['property', 'investment', 'real estate'], template: 'Smart investment! Explore profitable real estate opportunities with us! {url}' },
      { keywords: ['mortgage', 'loan', 'financing'], template: 'Ready to buy? We help secure the best mortgage rates and financing! {url}' },
      { keywords: ['commercial', 'office', 'business'], template: 'Perfect for business! Find commercial properties that fit your needs! {url}' }
    ]
  },
  'education': {
    name: 'Education & Training',
    description: 'Courses, tutoring, workshops, and educational services',
    sampleTemplates: [
      { keywords: ['education', 'learning', 'course', 'training'], template: 'Keep learning! Advance your skills with our professional courses! {url}' },
      { keywords: ['tutoring', 'tutor', 'help', 'study'], template: 'Academic success! Our tutors help students achieve their goals! {url}' },
      { keywords: ['workshop', 'seminar', 'class'], template: 'Great workshop! Join our hands-on classes and seminars! {url}' },
      { keywords: ['certification', 'professional', 'career'], template: 'Career advancement! Get certified with our professional training programs! {url}' },
      { keywords: ['online', 'elearning', 'remote'], template: 'Learn anywhere! Our online courses fit your busy schedule! {url}' }
    ]
  },
  'financial': {
    name: 'Financial Services',
    description: 'Insurance, loans, accounting, and financial consulting',
    sampleTemplates: [
      { keywords: ['financial', 'money', 'planning', 'advisor'], template: 'Smart financial planning! Our advisors help secure your future! {url}' },
      { keywords: ['insurance', 'coverage', 'protection'], template: 'Stay protected! Get comprehensive insurance coverage for peace of mind! {url}' },
      { keywords: ['accounting', 'taxes', 'bookkeeping'], template: 'Tax season ready! Our accounting services keep your finances organized! {url}' },
      { keywords: ['loan', 'credit', 'financing'], template: 'Need financing? We offer competitive loans and credit solutions! {url}' },
      { keywords: ['investment', 'retirement', 'savings'], template: 'Invest wisely! Build wealth with our investment and retirement planning! {url}' }
    ]
  },
  'legal': {
    name: 'Legal Services',
    description: 'Lawyers, legal consultants, and legal advice services',
    sampleTemplates: [
      { keywords: ['legal', 'lawyer', 'attorney', 'law'], template: 'Legal matters? Our experienced attorneys provide expert legal counsel! {url}' },
      { keywords: ['divorce', 'family', 'custody'], template: 'Family legal issues? We handle divorce and custody cases with care! {url}' },
      { keywords: ['business', 'contract', 'corporate'], template: 'Business legal needs? We provide comprehensive corporate legal services! {url}' },
      { keywords: ['personal', 'injury', 'accident'], template: 'Injured in an accident? Our personal injury lawyers fight for your rights! {url}' },
      { keywords: ['estate', 'will', 'planning'], template: 'Estate planning? Protect your legacy with our legal estate services! {url}' }
    ]
  },
  'pet-services': {
    name: 'Pet Services',
    description: 'Veterinary, grooming, pet sitting, and animal care',
    sampleTemplates: [
      { keywords: ['pet', 'dog', 'cat', 'animal'], template: 'Adorable pet! We provide loving care for all your furry friends! {url}' },
      { keywords: ['veterinary', 'vet', 'health', 'medical'], template: 'Pet health matters! Our veterinary team keeps your pets healthy and happy! {url}' },
      { keywords: ['grooming', 'bath', 'trim', 'clean'], template: 'Looking good! Professional pet grooming services for all breeds! {url}' },
      { keywords: ['sitting', 'boarding', 'care', 'watch'], template: 'Going away? Our pet sitting and boarding services provide loving care! {url}' },
      { keywords: ['training', 'obedience', 'behavior'], template: 'Well-behaved pet! Our training programs teach good manners and obedience! {url}' }
    ]
  },
  'events': {
    name: 'Event Planning',
    description: 'Weddings, parties, corporate events, and event management',
    sampleTemplates: [
      { keywords: ['wedding', 'bride', 'marriage', 'ceremony'], template: 'Beautiful wedding! We plan perfect weddings that create lasting memories! {url}' },
      { keywords: ['party', 'celebration', 'birthday'], template: 'Great party! Let us plan your next celebration with style and fun! {url}' },
      { keywords: ['corporate', 'business', 'conference'], template: 'Professional event! We organize corporate events that impress and inspire! {url}' },
      { keywords: ['catering', 'food', 'service'], template: 'Delicious spread! Our catering services make every event memorable! {url}' },
      { keywords: ['venue', 'location', 'space'], template: 'Perfect venue! Find the ideal location for your special event! {url}' }
    ]
  },
  'photography': {
    name: 'Photography',
    description: 'Portrait, event, commercial, and photography services',
    sampleTemplates: [
      { keywords: ['photography', 'photo', 'picture', 'camera'], template: 'Great shot! Capture your special moments with our photography services! {url}' },
      { keywords: ['wedding', 'bride', 'ceremony'], template: 'Beautiful wedding! We capture every precious moment of your special day! {url}' },
      { keywords: ['portrait', 'family', 'professional'], template: 'Perfect portrait! Professional photography for families and individuals! {url}' },
      { keywords: ['event', 'party', 'celebration'], template: 'Memorable event! We photograph parties and celebrations with artistic flair! {url}' },
      { keywords: ['commercial', 'business', 'product'], template: 'Professional images! Commercial photography that showcases your business! {url}' }
    ]
  },
  'crafts': {
    name: 'Crafts & Handmade',
    description: 'Etsy sellers, artisans, crafters, and handmade products',
    sampleTemplates: [
      { keywords: ['handmade', 'craft', 'artisan', 'custom'], template: 'Beautiful craftsmanship! Check out our handmade creations and custom pieces! {url}' },
      { keywords: ['etsy', 'shop', 'unique', 'original'], template: 'Unique finds! Discover one-of-a-kind handmade items in our shop! {url}' },
      { keywords: ['jewelry', 'accessories', 'handcrafted'], template: 'Stunning jewelry! Our handcrafted accessories are perfect for any style! {url}' },
      { keywords: ['art', 'painting', 'creative'], template: 'Artistic talent! Commission custom artwork and creative pieces! {url}' },
      { keywords: ['gift', 'personalized', 'special'], template: 'Perfect gift! Personalized handmade items for every special occasion! {url}' }
    ]
  },
  'construction': {
    name: 'Construction',
    description: 'Contractors, builders, renovations, and construction services',
    sampleTemplates: [
      { keywords: ['construction', 'building', 'contractor'], template: 'Solid construction! Our contractors deliver quality building projects on time! {url}' },
      { keywords: ['renovation', 'remodel', 'upgrade'], template: 'Amazing renovation! Transform your space with our remodeling expertise! {url}' },
      { keywords: ['kitchen', 'bathroom', 'remodel'], template: 'Beautiful remodel! We create stunning kitchen and bathroom renovations! {url}' },
      { keywords: ['addition', 'extension', 'expand'], template: 'More space! Add value with our home addition and extension services! {url}' },
      { keywords: ['commercial', 'industrial', 'project'], template: 'Big project! We handle commercial and industrial construction with expertise! {url}' }
    ]
  },
  'transportation': {
    name: 'Transportation',
    description: 'Moving, delivery, ride services, and transportation',
    sampleTemplates: [
      { keywords: ['moving', 'relocation', 'move'], template: 'Moving day! Our professional movers make relocation stress-free! {url}' },
      { keywords: ['delivery', 'shipping', 'transport'], template: 'Fast delivery! We provide reliable shipping and transport services! {url}' },
      { keywords: ['ride', 'taxi', 'uber', 'transport'], template: 'Need a ride? Our transportation services get you there safely! {url}' },
      { keywords: ['logistics', 'freight', 'cargo'], template: 'Logistics solutions! We handle freight and cargo transport efficiently! {url}' },
      { keywords: ['airport', 'shuttle', 'service'], template: 'Airport transfer! Reliable shuttle services for all your travel needs! {url}' }
    ]
  },
  'entertainment': {
    name: 'Entertainment',
    description: 'Musicians, DJs, performers, and entertainment services',
    sampleTemplates: [
      { keywords: ['music', 'band', 'musician', 'performance'], template: 'Great music! Book our talented musicians for your next event! {url}' },
      { keywords: ['dj', 'party', 'dance', 'music'], template: 'Party time! Our DJs keep the dance floor packed all night long! {url}' },
      { keywords: ['entertainment', 'performer', 'show'], template: 'Amazing show! Professional entertainers for unforgettable events! {url}' },
      { keywords: ['wedding', 'reception', 'celebration'], template: 'Perfect celebration! We provide entertainment that makes weddings magical! {url}' },
      { keywords: ['corporate', 'event', 'professional'], template: 'Corporate entertainment! Engaging performers for business events! {url}' }
    ]
  },
  'retail': {
    name: 'Retail & E-commerce',
    description: 'Online stores, boutiques, and retail businesses',
    sampleTemplates: [
      { keywords: ['shop', 'store', 'retail', 'buy'], template: 'Great finds! Discover amazing products at our retail store! {url}' },
      { keywords: ['online', 'ecommerce', 'website'], template: 'Shop online! Browse our complete selection on our e-commerce site! {url}' },
      { keywords: ['boutique', 'fashion', 'style'], template: 'Stylish choice! Find unique fashion at our trendy boutique! {url}' },
      { keywords: ['sale', 'discount', 'deal'], template: 'Amazing deals! Check out our current sales and special offers! {url}' },
      { keywords: ['gift', 'present', 'special'], template: 'Perfect gift! Find something special for everyone on your list! {url}' }
    ]
  },
  'professional': {
    name: 'Professional Services',
    description: 'Consulting, marketing, design, and professional services',
    sampleTemplates: [
      { keywords: ['consulting', 'consultant', 'advice', 'expert'], template: 'Expert guidance! Our consultants provide professional advice and solutions! {url}' },
      { keywords: ['marketing', 'advertising', 'promotion'], template: 'Smart marketing! Grow your business with our marketing expertise! {url}' },
      { keywords: ['design', 'graphic', 'creative'], template: 'Creative design! Professional graphic design that makes your brand shine! {url}' },
      { keywords: ['business', 'strategy', 'planning'], template: 'Strategic planning! Develop winning business strategies with our help! {url}' },
      { keywords: ['professional', 'service', 'expert'], template: 'Professional excellence! Expert services tailored to your business needs! {url}' }
    ]
  },
  'healthcare': {
    name: 'Healthcare',
    description: 'Medical, dental, therapy, and healthcare services',
    sampleTemplates: [
      { keywords: ['health', 'medical', 'doctor', 'care'], template: 'Your health matters! Our medical professionals provide compassionate care! {url}' },
      { keywords: ['dental', 'dentist', 'teeth', 'smile'], template: 'Beautiful smile! Keep your teeth healthy with our dental services! {url}' },
      { keywords: ['therapy', 'physical', 'rehabilitation'], template: 'Recovery support! Our therapy services help you heal and get stronger! {url}' },
      { keywords: ['mental', 'counseling', 'wellness'], template: 'Mental wellness! Professional counseling for emotional health and wellbeing! {url}' },
      { keywords: ['specialist', 'treatment', 'medical'], template: 'Specialized care! Our medical specialists provide expert treatment! {url}' }
    ]
  }
};

async function generateTemplateFiles() {
  const dataDir = path.join(__dirname, '..', 'data', 'templates');
  
  // Ensure directory exists
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  for (const [categoryId, categoryInfo] of Object.entries(categoryDefinitions)) {
    const filePath = path.join(dataDir, `${categoryId}.json`);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      console.log(`Skipping ${categoryId}.json - already exists`);
      continue;
    } catch (error) {
      // File doesn't exist, create it
    }

    // Generate templates with proper IDs
    const templates = categoryInfo.sampleTemplates.map((template, index) => ({
      id: `${categoryId.replace('-', '_')}_${String(index + 1).padStart(3, '0')}`,
      label: `${categoryInfo.name} ${index + 1}`,
      keywords: template.keywords,
      template: template.template,
      isPrebuilt: true
    }));

    // Add more templates to reach ~15-20 per category
    while (templates.length < 15) {
      const baseTemplate = categoryInfo.sampleTemplates[templates.length % categoryInfo.sampleTemplates.length];
      const templateNum = templates.length + 1;
      
      templates.push({
        id: `${categoryId.replace('-', '_')}_${String(templateNum).padStart(3, '0')}`,
        label: `${categoryInfo.name} ${templateNum}`,
        keywords: baseTemplate.keywords,
        template: baseTemplate.template.replace('!', ` ${templateNum}!`),
        isPrebuilt: true
      });
    }

    const categoryData = {
      category: {
        id: categoryId,
        name: categoryInfo.name,
        description: categoryInfo.description
      },
      templates: templates
    };

    await fs.writeFile(filePath, JSON.stringify(categoryData, null, 2));
    console.log(`Created ${categoryId}.json with ${templates.length} templates`);
  }

  console.log('Template file generation complete!');
}

// Run the generator
if (require.main === module) {
  generateTemplateFiles().catch(console.error);
}

module.exports = { generateTemplateFiles, categoryDefinitions };