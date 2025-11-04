/**
 * Template Generator
 * Generates the remaining pre-built templates for all categories
 */

/**
 * Generate templates for remaining categories
 * @returns {Object} Object with category templates
 */
function generateRemainingTemplates() {
  return {
    technology: generateTechnologyTemplates(),
    education: generateEducationTemplates(),
    financial: generateFinancialTemplates(),
    legal: generateLegalTemplates(),
    'pet-services': generatePetServicesTemplates(),
    events: generateEventsTemplates(),
    photography: generatePhotographyTemplates(),
    crafts: generateCraftsTemplates(),
    construction: generateConstructionTemplates(),
    transportation: generateTransportationTemplates(),
    entertainment: generateEntertainmentTemplates(),
    retail: generateRetailTemplates(),
    professional: generateProfessionalTemplates(),
    healthcare: generateHealthcareTemplates(),
    custom: generateCustomTemplates()
  };
}

function generateTechnologyTemplates() {
  return [
    {
      id: 'tech_001',
      label: 'IT Support',
      category: 'technology',
      keywords: ['computer', 'it', 'support', 'tech', 'repair'],
      template: 'Tech troubles? Our IT experts solve computer problems fast! {url}',
      isPrebuilt: true
    },
    {
      id: 'tech_002',
      label: 'Web Design',
      category: 'technology',
      keywords: ['website', 'web', 'design', 'development'],
      template: 'Need a website? Professional web design that grows your business! {url}',
      isPrebuilt: true
    },
    {
      id: 'tech_003',
      label: 'Software Development',
      category: 'technology',
      keywords: ['software', 'app', 'development', 'programming'],
      template: 'Custom software solutions! We build apps that solve real problems! {url}',
      isPrebuilt: true
    },
    {
      id: 'tech_004',
      label: 'Cybersecurity',
      category: 'technology',
      keywords: ['security', 'cyber', 'protection', 'data'],
      template: 'Protect your business! Comprehensive cybersecurity solutions! {url}',
      isPrebuilt: true
    },
    {
      id: 'tech_005',
      label: 'Cloud Services',
      category: 'technology',
      keywords: ['cloud', 'backup', 'storage', 'server'],
      template: 'Move to the cloud! Secure, scalable cloud solutions for your business! {url}',
      isPrebuilt: true
    },
    // Add 15 more tech templates...
    {
      id: 'tech_020',
      label: 'Tech Training',
      category: 'technology',
      keywords: ['training', 'education', 'skills', 'certification'],
      template: 'Upgrade your skills! Professional tech training and certification programs! {url}',
      isPrebuilt: true
    }
  ];
}

function generateEducationTemplates() {
  return [
    {
      id: 'edu_001',
      label: 'Tutoring Services',
      category: 'education',
      keywords: ['tutoring', 'tutor', 'help', 'study'],
      template: 'Academic success! Personalized tutoring to help students excel! {url}',
      isPrebuilt: true
    },
    {
      id: 'edu_002',
      label: 'Online Courses',
      category: 'education',
      keywords: ['course', 'online', 'learning', 'education'],
      template: 'Learn from anywhere! Comprehensive online courses for skill development! {url}',
      isPrebuilt: true
    },
    // Add 18 more education templates...
    {
      id: 'edu_020',
      label: 'Career Coaching',
      category: 'education',
      keywords: ['career', 'coaching', 'job', 'professional'],
      template: 'Advance your career! Professional coaching for career success! {url}',
      isPrebuilt: true
    }
  ];
}

function generateFinancialTemplates() {
  return [
    {
      id: 'fin_001',
      label: 'Insurance Services',
      category: 'financial',
      keywords: ['insurance', 'coverage', 'protection', 'policy'],
      template: 'Protect what matters! Comprehensive insurance coverage for peace of mind! {url}',
      isPrebuilt: true
    },
    {
      id: 'fin_002',
      label: 'Tax Preparation',
      category: 'financial',
      keywords: ['tax', 'taxes', 'preparation', 'refund'],
      template: 'Tax season made easy! Professional tax preparation for maximum refunds! {url}',
      isPrebuilt: true
    },
    // Add 18 more financial templates...
    {
      id: 'fin_020',
      label: 'Retirement Planning',
      category: 'financial',
      keywords: ['retirement', 'planning', 'future', 'savings'],
      template: 'Secure your future! Expert retirement planning for financial freedom! {url}',
      isPrebuilt: true
    }
  ];
}

function generateLegalTemplates() {
  return [
    {
      id: 'legal_001',
      label: 'Personal Injury',
      category: 'legal',
      keywords: ['injury', 'accident', 'lawyer', 'compensation'],
      template: 'Injured? Get the compensation you deserve with experienced legal help! {url}',
      isPrebuilt: true
    },
    {
      id: 'legal_002',
      label: 'Family Law',
      category: 'legal',
      keywords: ['family', 'divorce', 'custody', 'legal'],
      template: 'Family matters require compassionate legal guidance. We\'re here to help! {url}',
      isPrebuilt: true
    },
    // Add 18 more legal templates...
    {
      id: 'legal_020',
      label: 'Legal Consultation',
      category: 'legal',
      keywords: ['consultation', 'advice', 'legal', 'attorney'],
      template: 'Need legal advice? Free consultation to discuss your legal options! {url}',
      isPrebuilt: true
    }
  ];
}

function generatePetServicesTemplates() {
  return [
    {
      id: 'pet_001',
      label: 'Veterinary Care',
      category: 'pet-services',
      keywords: ['vet', 'veterinary', 'pet', 'health'],
      template: 'Adorable pet! Keep them healthy with our compassionate veterinary care! {url}',
      isPrebuilt: true
    },
    {
      id: 'pet_002',
      label: 'Pet Grooming',
      category: 'pet-services',
      keywords: ['grooming', 'pet', 'bath', 'trim'],
      template: 'Pamper your pet! Professional grooming to keep them looking and feeling great! {url}',
      isPrebuilt: true
    },
    // Add 18 more pet service templates...
    {
      id: 'pet_020',
      label: 'Pet Training',
      category: 'pet-services',
      keywords: ['training', 'obedience', 'behavior', 'dog'],
      template: 'Well-behaved pets are happy pets! Professional training for better behavior! {url}',
      isPrebuilt: true
    }
  ];
}

function generateEventsTemplates() {
  return [
    {
      id: 'event_001',
      label: 'Wedding Planning',
      category: 'events',
      keywords: ['wedding', 'planning', 'bride', 'ceremony'],
      template: 'Dream wedding! Let us plan your perfect day with attention to every detail! {url}',
      isPrebuilt: true
    },
    {
      id: 'event_002',
      label: 'Party Planning',
      category: 'events',
      keywords: ['party', 'celebration', 'birthday', 'event'],
      template: 'Celebrate in style! Unforgettable parties planned to perfection! {url}',
      isPrebuilt: true
    },
    // Add 18 more event templates...
    {
      id: 'event_020',
      label: 'Corporate Events',
      category: 'events',
      keywords: ['corporate', 'business', 'conference', 'meeting'],
      template: 'Professional events that impress! Corporate event planning and management! {url}',
      isPrebuilt: true
    }
  ];
}

function generatePhotographyTemplates() {
  return [
    {
      id: 'photo_001',
      label: 'Wedding Photography',
      category: 'photography',
      keywords: ['wedding', 'photography', 'photographer', 'photos'],
      template: 'Beautiful moments! Capture your special day with stunning wedding photography! {url}',
      isPrebuilt: true
    },
    {
      id: 'photo_002',
      label: 'Portrait Photography',
      category: 'photography',
      keywords: ['portrait', 'family', 'photos', 'session'],
      template: 'Picture perfect! Professional portraits that capture your family\'s personality! {url}',
      isPrebuilt: true
    },
    // Add 18 more photography templates...
    {
      id: 'photo_020',
      label: 'Commercial Photography',
      category: 'photography',
      keywords: ['commercial', 'business', 'product', 'marketing'],
      template: 'Professional imagery! Commercial photography that elevates your brand! {url}',
      isPrebuilt: true
    }
  ];
}

function generateCraftsTemplates() {
  return [
    {
      id: 'craft_001',
      label: 'Handmade Jewelry',
      category: 'crafts',
      keywords: ['jewelry', 'handmade', 'custom', 'unique'],
      template: 'Beautiful craftsmanship! Unique handmade jewelry for every occasion! {url}',
      isPrebuilt: true
    },
    {
      id: 'craft_002',
      label: 'Custom Art',
      category: 'crafts',
      keywords: ['art', 'custom', 'painting', 'commission'],
      template: 'Artistic vision! Custom artwork and commissions for your space! {url}',
      isPrebuilt: true
    },
    // Add 18 more craft templates...
    {
      id: 'craft_020',
      label: 'Craft Workshops',
      category: 'crafts',
      keywords: ['workshop', 'class', 'learn', 'diy'],
      template: 'Learn to create! Fun craft workshops for all skill levels! {url}',
      isPrebuilt: true
    }
  ];
}

function generateConstructionTemplates() {
  return [
    {
      id: 'const_001',
      label: 'Home Renovation',
      category: 'construction',
      keywords: ['renovation', 'remodel', 'construction', 'home'],
      template: 'Transform your space! Professional home renovation and remodeling! {url}',
      isPrebuilt: true
    },
    {
      id: 'const_002',
      label: 'Kitchen Remodel',
      category: 'construction',
      keywords: ['kitchen', 'remodel', 'cabinets', 'countertops'],
      template: 'Dream kitchen! Complete kitchen remodeling for the heart of your home! {url}',
      isPrebuilt: true
    },
    // Add 18 more construction templates...
    {
      id: 'const_020',
      label: 'Commercial Construction',
      category: 'construction',
      keywords: ['commercial', 'building', 'contractor', 'business'],
      template: 'Build your business! Commercial construction and renovation services! {url}',
      isPrebuilt: true
    }
  ];
}

function generateTransportationTemplates() {
  return [
    {
      id: 'trans_001',
      label: 'Moving Services',
      category: 'transportation',
      keywords: ['moving', 'movers', 'relocation', 'transport'],
      template: 'Moving made easy! Professional movers for stress-free relocation! {url}',
      isPrebuilt: true
    },
    {
      id: 'trans_002',
      label: 'Delivery Service',
      category: 'transportation',
      keywords: ['delivery', 'courier', 'shipping', 'transport'],
      template: 'Fast delivery! Reliable courier and delivery services for your needs! {url}',
      isPrebuilt: true
    },
    // Add 18 more transportation templates...
    {
      id: 'trans_020',
      label: 'Logistics Solutions',
      category: 'transportation',
      keywords: ['logistics', 'freight', 'shipping', 'supply'],
      template: 'Streamline your supply chain! Complete logistics and freight solutions! {url}',
      isPrebuilt: true
    }
  ];
}

function generateEntertainmentTemplates() {
  return [
    {
      id: 'ent_001',
      label: 'DJ Services',
      category: 'entertainment',
      keywords: ['dj', 'music', 'party', 'wedding'],
      template: 'Great music! Professional DJ services for unforgettable events! {url}',
      isPrebuilt: true
    },
    {
      id: 'ent_002',
      label: 'Live Music',
      category: 'entertainment',
      keywords: ['band', 'live', 'music', 'performance'],
      template: 'Amazing performance! Live music that brings energy to any event! {url}',
      isPrebuilt: true
    },
    // Add 18 more entertainment templates...
    {
      id: 'ent_020',
      label: 'Event Entertainment',
      category: 'entertainment',
      keywords: ['entertainment', 'performer', 'show', 'event'],
      template: 'Unforgettable entertainment! Professional performers for any occasion! {url}',
      isPrebuilt: true
    }
  ];
}

function generateRetailTemplates() {
  return [
    {
      id: 'retail_001',
      label: 'Online Store',
      category: 'retail',
      keywords: ['shop', 'store', 'online', 'buy'],
      template: 'Love shopping? Check out our amazing selection and great prices! {url}',
      isPrebuilt: true
    },
    {
      id: 'retail_002',
      label: 'Fashion Boutique',
      category: 'retail',
      keywords: ['fashion', 'clothing', 'style', 'boutique'],
      template: 'Stylish choice! Discover unique fashion at our boutique! {url}',
      isPrebuilt: true
    },
    // Add 18 more retail templates...
    {
      id: 'retail_020',
      label: 'Gift Shop',
      category: 'retail',
      keywords: ['gifts', 'presents', 'unique', 'special'],
      template: 'Perfect gifts for everyone! Unique items for every special occasion! {url}',
      isPrebuilt: true
    }
  ];
}

function generateProfessionalTemplates() {
  return [
    {
      id: 'prof_001',
      label: 'Business Consulting',
      category: 'professional',
      keywords: ['consulting', 'business', 'strategy', 'growth'],
      template: 'Grow your business! Expert consulting to take your company to the next level! {url}',
      isPrebuilt: true
    },
    {
      id: 'prof_002',
      label: 'Marketing Services',
      category: 'professional',
      keywords: ['marketing', 'advertising', 'promotion', 'brand'],
      template: 'Boost your brand! Professional marketing services that get results! {url}',
      isPrebuilt: true
    },
    // Add 18 more professional templates...
    {
      id: 'prof_020',
      label: 'Project Management',
      category: 'professional',
      keywords: ['project', 'management', 'planning', 'execution'],
      template: 'Projects delivered on time! Expert project management for success! {url}',
      isPrebuilt: true
    }
  ];
}

function generateHealthcareTemplates() {
  return [
    {
      id: 'health_001',
      label: 'Medical Practice',
      category: 'healthcare',
      keywords: ['doctor', 'medical', 'health', 'care'],
      template: 'Your health matters! Compassionate medical care from experienced doctors! {url}',
      isPrebuilt: true
    },
    {
      id: 'health_002',
      label: 'Dental Care',
      category: 'healthcare',
      keywords: ['dental', 'dentist', 'teeth', 'smile'],
      template: 'Healthy smile! Comprehensive dental care for the whole family! {url}',
      isPrebuilt: true
    },
    // Add 18 more healthcare templates...
    {
      id: 'health_020',
      label: 'Mental Health',
      category: 'healthcare',
      keywords: ['therapy', 'counseling', 'mental', 'health'],
      template: 'Mental wellness matters! Professional counseling and therapy services! {url}',
      isPrebuilt: true
    }
  ];
}

function generateCustomTemplates() {
  return [
    {
      id: 'custom_001',
      label: 'General Business',
      category: 'custom',
      keywords: ['business', 'service', 'help', 'professional'],
      template: 'Great post! If you need professional services, we\'re here to help! {url}',
      isPrebuilt: true
    },
    {
      id: 'custom_002',
      label: 'Local Service',
      category: 'custom',
      keywords: ['local', 'community', 'neighborhood', 'area'],
      template: 'Love supporting local! We\'re proud to serve our community! {url}',
      isPrebuilt: true
    },
    // Add 18 more custom templates...
    {
      id: 'custom_020',
      label: 'Contact Us',
      category: 'custom',
      keywords: ['contact', 'call', 'message', 'reach'],
      template: 'Need help? Contact us anytime - we\'re here to assist you! {url}',
      isPrebuilt: true
    }
  ];
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateRemainingTemplates
  };
} else {
  window.TemplateGenerator = {
    generateRemainingTemplates
  };
}