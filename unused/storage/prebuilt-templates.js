/**
 * Pre-built Template Database
 * Contains 400+ professional advertisement templates organized by business categories
 */

/**
 * Get all pre-built templates organized by categories
 * @returns {Object} Object with category IDs as keys and template arrays as values
 */
function getPrebuiltTemplates() {
  // Import additional templates if available
  let additionalTemplates = {};
  try {
    if (typeof window !== 'undefined' && window.TemplateGenerator) {
      additionalTemplates = window.TemplateGenerator.generateRemainingTemplates();
    } else if (typeof require !== 'undefined') {
      const generator = require('./template-generator');
      additionalTemplates = generator.generateRemainingTemplates();
    }
  } catch (error) {
    console.warn('Could not load additional templates:', error);
  }

  const baseTemplates = {
    automotive: [
      {
        id: 'auto_001',
        label: 'Car Service Offer',
        category: 'automotive',
        keywords: ['car', 'service', 'repair', 'maintenance', 'auto'],
        template: 'Nice ride! If you need reliable car service, we\'re here to help! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_002',
        label: 'Oil Change Special',
        category: 'automotive',
        keywords: ['oil', 'change', 'maintenance', 'service'],
        template: 'Great car! Don\'t forget regular oil changes keep it running smooth. We offer quick service! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_003',
        label: 'Tire Service',
        category: 'automotive',
        keywords: ['tire', 'tires', 'wheel', 'alignment'],
        template: 'Sweet wheels! When you need new tires or alignment, we\'ve got you covered! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_004',
        label: 'Brake Service',
        category: 'automotive',
        keywords: ['brake', 'brakes', 'safety', 'repair'],
        template: 'Safety first! If you need brake service or inspection, trust our certified techs! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_005',
        label: 'Engine Diagnostics',
        category: 'automotive',
        keywords: ['engine', 'diagnostic', 'check', 'light'],
        template: 'Engine troubles? Our diagnostic service will find the issue fast! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_006',
        label: 'Car Detailing',
        category: 'automotive',
        keywords: ['detail', 'wash', 'clean', 'shine'],
        template: 'Beautiful car! Keep it looking pristine with our professional detailing service! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_007',
        label: 'Transmission Service',
        category: 'automotive',
        keywords: ['transmission', 'gear', 'shift', 'fluid'],
        template: 'Transmission acting up? Don\'t wait - we specialize in transmission repair! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_008',
        label: 'AC Repair',
        category: 'automotive',
        keywords: ['ac', 'air', 'conditioning', 'cool', 'heat'],
        template: 'Stay cool! Our AC repair service will have you comfortable in no time! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_009',
        label: 'Battery Service',
        category: 'automotive',
        keywords: ['battery', 'dead', 'jump', 'start'],
        template: 'Battery problems? We offer quick battery testing and replacement! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_010',
        label: 'Roadside Assistance',
        category: 'automotive',
        keywords: ['roadside', 'tow', 'emergency', 'help'],
        template: 'Car trouble? Our 24/7 roadside assistance is just a call away! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_011',
        label: 'Pre-Purchase Inspection',
        category: 'automotive',
        keywords: ['inspection', 'buying', 'purchase', 'check'],
        template: 'Buying a car? Get a professional pre-purchase inspection for peace of mind! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_012',
        label: 'Suspension Repair',
        category: 'automotive',
        keywords: ['suspension', 'shock', 'strut', 'ride'],
        template: 'Rough ride? Our suspension experts will smooth things out! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_013',
        label: 'Exhaust Service',
        category: 'automotive',
        keywords: ['exhaust', 'muffler', 'pipe', 'noise'],
        template: 'Loud exhaust? We handle all exhaust system repairs and replacements! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_014',
        label: 'Windshield Repair',
        category: 'automotive',
        keywords: ['windshield', 'glass', 'crack', 'chip'],
        template: 'Cracked windshield? Don\'t let it spread - we offer quick glass repair! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_015',
        label: 'Fleet Service',
        category: 'automotive',
        keywords: ['fleet', 'business', 'commercial', 'truck'],
        template: 'Managing a fleet? We offer comprehensive commercial vehicle service! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_016',
        label: 'Classic Car Restoration',
        category: 'automotive',
        keywords: ['classic', 'restoration', 'vintage', 'antique'],
        template: 'Beautiful classic! We specialize in vintage car restoration and maintenance! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_017',
        label: 'Performance Upgrades',
        category: 'automotive',
        keywords: ['performance', 'upgrade', 'tuning', 'power'],
        template: 'Want more power? We offer professional performance upgrades and tuning! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_018',
        label: 'Motorcycle Service',
        category: 'automotive',
        keywords: ['motorcycle', 'bike', 'service', 'repair'],
        template: 'Nice bike! We also service motorcycles and ATVs - bring it in! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_019',
        label: 'Diesel Service',
        category: 'automotive',
        keywords: ['diesel', 'truck', 'heavy', 'duty'],
        template: 'Diesel troubles? Our certified diesel techs know these engines inside out! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_020',
        label: 'Hybrid Service',
        category: 'automotive',
        keywords: ['hybrid', 'electric', 'prius', 'eco'],
        template: 'Hybrid owner? We\'re certified to service all hybrid and electric vehicles! {url}',
        isPrebuilt: true
      }
    ],

    fitness: [
      {
        id: 'fit_001',
        label: 'Personal Training',
        category: 'fitness',
        keywords: ['fitness', 'workout', 'exercise', 'gym', 'training'],
        template: 'Great workout motivation! Ready to take your fitness to the next level? {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_002',
        label: 'Weight Loss Program',
        category: 'fitness',
        keywords: ['weight', 'loss', 'diet', 'lose', 'fat'],
        template: 'Inspiring transformation! Want to start your own weight loss journey? {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_003',
        label: 'Nutrition Coaching',
        category: 'fitness',
        keywords: ['nutrition', 'diet', 'healthy', 'eating', 'meal'],
        template: 'Healthy choices! Nutrition is key - let us help you fuel your body right! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_004',
        label: 'Yoga Classes',
        category: 'fitness',
        keywords: ['yoga', 'meditation', 'mindfulness', 'stretch'],
        template: 'Beautiful practice! Join our yoga community for mind-body wellness! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_005',
        label: 'CrossFit Training',
        category: 'fitness',
        keywords: ['crossfit', 'wod', 'functional', 'strength'],
        template: 'Beast mode! Ready for the ultimate fitness challenge? Try CrossFit! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_006',
        label: 'Marathon Training',
        category: 'fitness',
        keywords: ['running', 'marathon', 'race', 'endurance'],
        template: 'Amazing dedication! Training for a race? We have programs for all levels! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_007',
        label: 'Strength Training',
        category: 'fitness',
        keywords: ['strength', 'muscle', 'lifting', 'weights'],
        template: 'Impressive strength! Want to build more muscle? Our trainers can help! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_008',
        label: 'Group Fitness Classes',
        category: 'fitness',
        keywords: ['group', 'class', 'zumba', 'aerobics'],
        template: 'Love the energy! Join our fun group fitness classes - all levels welcome! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_009',
        label: 'Senior Fitness',
        category: 'fitness',
        keywords: ['senior', 'elderly', 'mature', 'gentle'],
        template: 'Age is just a number! Our senior fitness programs keep you active and healthy! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_010',
        label: 'Kids Fitness',
        category: 'fitness',
        keywords: ['kids', 'children', 'youth', 'sports'],
        template: 'Active kids are happy kids! Check out our youth fitness programs! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_011',
        label: 'Rehabilitation Fitness',
        category: 'fitness',
        keywords: ['rehab', 'injury', 'recovery', 'therapy'],
        template: 'Recovery is a journey! Our rehab fitness programs help you bounce back stronger! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_012',
        label: 'Pilates Classes',
        category: 'fitness',
        keywords: ['pilates', 'core', 'flexibility', 'posture'],
        template: 'Great form! Pilates builds core strength and flexibility - try a class! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_013',
        label: 'Boxing Training',
        category: 'fitness',
        keywords: ['boxing', 'martial', 'arts', 'cardio'],
        template: 'Knockout workout! Boxing is amazing cardio and stress relief! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_014',
        label: 'Swimming Lessons',
        category: 'fitness',
        keywords: ['swimming', 'pool', 'water', 'lessons'],
        template: 'Making a splash! Swimming is the perfect full-body workout! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_015',
        label: 'Outdoor Bootcamp',
        category: 'fitness',
        keywords: ['bootcamp', 'outdoor', 'fresh', 'air'],
        template: 'Love the outdoors! Our bootcamp combines fresh air with intense workouts! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_016',
        label: 'Wellness Coaching',
        category: 'fitness',
        keywords: ['wellness', 'lifestyle', 'health', 'balance'],
        template: 'Wellness is wealth! Let us help you create a balanced, healthy lifestyle! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_017',
        label: 'Sports Performance',
        category: 'fitness',
        keywords: ['sports', 'performance', 'athlete', 'training'],
        template: 'Athletic excellence! Take your sports performance to the next level! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_018',
        label: 'Dance Fitness',
        category: 'fitness',
        keywords: ['dance', 'zumba', 'rhythm', 'fun'],
        template: 'Dance like nobody\'s watching! Our dance fitness classes are pure joy! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_019',
        label: 'Flexibility Training',
        category: 'fitness',
        keywords: ['flexibility', 'stretching', 'mobility', 'range'],
        template: 'Flexibility is freedom! Improve your range of motion with our programs! {url}',
        isPrebuilt: true
      },
      {
        id: 'fit_020',
        label: 'Fitness Assessment',
        category: 'fitness',
        keywords: ['assessment', 'evaluation', 'fitness', 'test'],
        template: 'Know where you stand! Get a comprehensive fitness assessment to start right! {url}',
        isPrebuilt: true
      }
    ],

    food: [
      {
        id: 'food_001',
        label: 'Restaurant Recommendation',
        category: 'food',
        keywords: ['food', 'restaurant', 'dining', 'eat', 'meal'],
        template: 'Looks delicious! If you love great food, you\'ll love our restaurant! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_002',
        label: 'Catering Services',
        category: 'food',
        keywords: ['catering', 'event', 'party', 'wedding'],
        template: 'What a feast! Planning an event? Our catering makes every occasion special! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_003',
        label: 'Food Delivery',
        category: 'food',
        keywords: ['delivery', 'takeout', 'order', 'home'],
        template: 'Craving something good? We deliver fresh, hot meals right to your door! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_004',
        label: 'Pizza Special',
        category: 'food',
        keywords: ['pizza', 'slice', 'cheese', 'pepperoni'],
        template: 'Pizza perfection! Try our authentic recipes made with fresh ingredients! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_005',
        label: 'Bakery Fresh',
        category: 'food',
        keywords: ['bakery', 'bread', 'pastry', 'fresh'],
        template: 'Fresh from the oven! Our bakery creates daily delights you\'ll love! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_006',
        label: 'Coffee Shop',
        category: 'food',
        keywords: ['coffee', 'espresso', 'latte', 'cafe'],
        template: 'Perfect brew! Start your day right with our premium coffee blends! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_007',
        label: 'Healthy Options',
        category: 'food',
        keywords: ['healthy', 'organic', 'fresh', 'salad'],
        template: 'Eating clean! We offer delicious, healthy options that fuel your body! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_008',
        label: 'BBQ Specialties',
        category: 'food',
        keywords: ['bbq', 'barbecue', 'smoked', 'grill'],
        template: 'Smoky goodness! Our BBQ is slow-cooked to perfection - taste the difference! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_009',
        label: 'Seafood Fresh',
        category: 'food',
        keywords: ['seafood', 'fish', 'shrimp', 'ocean'],
        template: 'Ocean fresh! Our seafood is delivered daily for the ultimate freshness! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_010',
        label: 'Dessert Heaven',
        category: 'food',
        keywords: ['dessert', 'cake', 'sweet', 'chocolate'],
        template: 'Sweet tooth calling! Indulge in our heavenly desserts and treats! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_011',
        label: 'Meal Prep Service',
        category: 'food',
        keywords: ['meal', 'prep', 'weekly', 'healthy'],
        template: 'Meal prep made easy! Save time with our weekly healthy meal preparation! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_012',
        label: 'Food Truck',
        category: 'food',
        keywords: ['food', 'truck', 'mobile', 'street'],
        template: 'Street food at its finest! Follow us for the best mobile dining experience! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_013',
        label: 'Wine & Dine',
        category: 'food',
        keywords: ['wine', 'dining', 'fine', 'pairing'],
        template: 'Exquisite taste! Experience fine dining with perfect wine pairings! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_014',
        label: 'Breakfast Special',
        category: 'food',
        keywords: ['breakfast', 'brunch', 'morning', 'eggs'],
        template: 'Rise and dine! Start your day with our hearty breakfast specials! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_015',
        label: 'Vegan Options',
        category: 'food',
        keywords: ['vegan', 'plant', 'based', 'vegetarian'],
        template: 'Plant-powered delicious! Our vegan menu proves healthy can be tasty! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_016',
        label: 'International Cuisine',
        category: 'food',
        keywords: ['international', 'ethnic', 'authentic', 'culture'],
        template: 'Taste the world! Experience authentic international flavors at our restaurant! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_017',
        label: 'Happy Hour',
        category: 'food',
        keywords: ['happy', 'hour', 'drinks', 'appetizers'],
        template: 'Cheers to good times! Join us for happy hour specials and great company! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_018',
        label: 'Farm to Table',
        category: 'food',
        keywords: ['farm', 'table', 'local', 'fresh'],
        template: 'Farm fresh goodness! We source locally for the freshest, most flavorful meals! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_019',
        label: 'Cooking Classes',
        category: 'food',
        keywords: ['cooking', 'class', 'learn', 'chef'],
        template: 'Master the kitchen! Learn from professional chefs in our hands-on cooking classes! {url}',
        isPrebuilt: true
      },
      {
        id: 'food_020',
        label: 'Food Festival',
        category: 'food',
        keywords: ['festival', 'event', 'food', 'vendors'],
        template: 'Foodie paradise! Don\'t miss our upcoming food festival - flavors galore! {url}',
        isPrebuilt: true
      }
    ],

    'home-services': [
      {
        id: 'home_001',
        label: 'House Cleaning',
        category: 'home-services',
        keywords: ['cleaning', 'house', 'maid', 'service'],
        template: 'Beautiful home! Keep it spotless with our professional cleaning service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_002',
        label: 'Landscaping',
        category: 'home-services',
        keywords: ['landscaping', 'lawn', 'garden', 'yard'],
        template: 'Gorgeous yard! Let us help you create the perfect outdoor space! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_003',
        label: 'Plumbing Service',
        category: 'home-services',
        keywords: ['plumbing', 'leak', 'pipe', 'water'],
        template: 'Plumbing problems? Our licensed plumbers are available 24/7! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_004',
        label: 'Electrical Work',
        category: 'home-services',
        keywords: ['electrical', 'electrician', 'wiring', 'power'],
        template: 'Electrical issues? Trust our certified electricians for safe, reliable service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_005',
        label: 'HVAC Service',
        category: 'home-services',
        keywords: ['hvac', 'heating', 'cooling', 'air'],
        template: 'Stay comfortable year-round! Our HVAC experts keep your home perfect! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_006',
        label: 'Handyman Services',
        category: 'home-services',
        keywords: ['handyman', 'repair', 'fix', 'maintenance'],
        template: 'Need repairs? Our skilled handymen can fix almost anything! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_007',
        label: 'Painting Service',
        category: 'home-services',
        keywords: ['painting', 'paint', 'interior', 'exterior'],
        template: 'Fresh paint transforms everything! Professional painters for beautiful results! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_008',
        label: 'Roofing Service',
        category: 'home-services',
        keywords: ['roofing', 'roof', 'shingles', 'leak'],
        template: 'Roof troubles? Protect your investment with our expert roofing service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_009',
        label: 'Flooring Installation',
        category: 'home-services',
        keywords: ['flooring', 'carpet', 'hardwood', 'tile'],
        template: 'Beautiful floors! Transform your space with our professional flooring service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_010',
        label: 'Window Cleaning',
        category: 'home-services',
        keywords: ['window', 'cleaning', 'glass', 'clear'],
        template: 'Crystal clear views! Professional window cleaning for sparkling results! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_011',
        label: 'Pest Control',
        category: 'home-services',
        keywords: ['pest', 'control', 'exterminator', 'bugs'],
        template: 'Pest problems? Our safe, effective treatments protect your home! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_012',
        label: 'Gutter Cleaning',
        category: 'home-services',
        keywords: ['gutter', 'cleaning', 'maintenance', 'drain'],
        template: 'Protect your home! Regular gutter cleaning prevents costly damage! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_013',
        label: 'Pool Service',
        category: 'home-services',
        keywords: ['pool', 'cleaning', 'maintenance', 'chemical'],
        template: 'Pool paradise! Keep your pool crystal clear with our maintenance service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_014',
        label: 'Security Systems',
        category: 'home-services',
        keywords: ['security', 'alarm', 'camera', 'protection'],
        template: 'Peace of mind! Protect your family with our advanced security systems! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_015',
        label: 'Appliance Repair',
        category: 'home-services',
        keywords: ['appliance', 'repair', 'washer', 'dryer'],
        template: 'Appliance acting up? Our technicians repair all major brands! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_016',
        label: 'Carpet Cleaning',
        category: 'home-services',
        keywords: ['carpet', 'cleaning', 'steam', 'stain'],
        template: 'Fresh, clean carpets! Professional deep cleaning removes stains and odors! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_017',
        label: 'Tree Service',
        category: 'home-services',
        keywords: ['tree', 'removal', 'trimming', 'pruning'],
        template: 'Tree care experts! Safe removal, trimming, and maintenance for healthy trees! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_018',
        label: 'Garage Door Service',
        category: 'home-services',
        keywords: ['garage', 'door', 'opener', 'repair'],
        template: 'Garage door problems? Fast, reliable repair and installation service! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_019',
        label: 'Driveway Sealing',
        category: 'home-services',
        keywords: ['driveway', 'sealing', 'asphalt', 'concrete'],
        template: 'Protect your driveway! Professional sealing extends life and looks great! {url}',
        isPrebuilt: true
      },
      {
        id: 'home_020',
        label: 'Home Inspection',
        category: 'home-services',
        keywords: ['inspection', 'home', 'buyer', 'safety'],
        template: 'Know before you buy! Thorough home inspections for your peace of mind! {url}',
        isPrebuilt: true
      }
    ],

    beauty: [
      {
        id: 'beauty_001',
        label: 'Hair Salon',
        category: 'beauty',
        keywords: ['hair', 'salon', 'cut', 'style'],
        template: 'Gorgeous hair! Ready for a fresh new look? Book your appointment today! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_002',
        label: 'Nail Service',
        category: 'beauty',
        keywords: ['nails', 'manicure', 'pedicure', 'polish'],
        template: 'Beautiful nails! Treat yourself to our relaxing nail services! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_003',
        label: 'Spa Treatment',
        category: 'beauty',
        keywords: ['spa', 'massage', 'facial', 'relaxation'],
        template: 'Pure relaxation! Escape the stress with our luxurious spa treatments! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_004',
        label: 'Makeup Artist',
        category: 'beauty',
        keywords: ['makeup', 'artist', 'wedding', 'special'],
        template: 'Flawless beauty! Professional makeup for your special occasions! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_005',
        label: 'Skincare Treatment',
        category: 'beauty',
        keywords: ['skincare', 'facial', 'acne', 'anti-aging'],
        template: 'Radiant skin! Our skincare treatments reveal your natural glow! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_006',
        label: 'Eyebrow Service',
        category: 'beauty',
        keywords: ['eyebrow', 'threading', 'waxing', 'shape'],
        template: 'Perfect brows frame your face! Expert eyebrow shaping and styling! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_007',
        label: 'Eyelash Extensions',
        category: 'beauty',
        keywords: ['eyelash', 'extensions', 'lashes', 'volume'],
        template: 'Stunning lashes! Wake up beautiful with our eyelash extensions! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_008',
        label: 'Hair Color',
        category: 'beauty',
        keywords: ['hair', 'color', 'highlights', 'dye'],
        template: 'Color transformation! Express yourself with our expert hair coloring! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_009',
        label: 'Botox Treatment',
        category: 'beauty',
        keywords: ['botox', 'wrinkles', 'anti-aging', 'injection'],
        template: 'Turn back time! Safe, effective Botox treatments for a youthful look! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_010',
        label: 'Laser Hair Removal',
        category: 'beauty',
        keywords: ['laser', 'hair', 'removal', 'permanent'],
        template: 'Smooth skin forever! Permanent hair removal with advanced laser technology! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_011',
        label: 'Microblading',
        category: 'beauty',
        keywords: ['microblading', 'eyebrows', 'permanent', 'makeup'],
        template: 'Perfect brows every day! Microblading for natural-looking eyebrows! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_012',
        label: 'Body Contouring',
        category: 'beauty',
        keywords: ['body', 'contouring', 'sculpting', 'fat'],
        template: 'Shape your confidence! Non-invasive body contouring for amazing results! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_013',
        label: 'Teeth Whitening',
        category: 'beauty',
        keywords: ['teeth', 'whitening', 'smile', 'bright'],
        template: 'Brighten your smile! Professional teeth whitening for stunning results! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_014',
        label: 'Tanning Service',
        category: 'beauty',
        keywords: ['tanning', 'spray', 'tan', 'bronze'],
        template: 'Golden glow! Safe, natural-looking tans without the sun damage! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_015',
        label: 'Waxing Service',
        category: 'beauty',
        keywords: ['waxing', 'hair', 'removal', 'smooth'],
        template: 'Silky smooth skin! Professional waxing services for all areas! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_016',
        label: 'Bridal Beauty',
        category: 'beauty',
        keywords: ['bridal', 'wedding', 'bride', 'special'],
        template: 'Your special day! Complete bridal beauty packages for the perfect look! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_017',
        label: 'Men\'s Grooming',
        category: 'beauty',
        keywords: ['men', 'grooming', 'beard', 'haircut'],
        template: 'Sharp and sophisticated! Men\'s grooming services for the modern gentleman! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_018',
        label: 'Permanent Makeup',
        category: 'beauty',
        keywords: ['permanent', 'makeup', 'tattoo', 'cosmetic'],
        template: 'Wake up beautiful! Permanent makeup for effortless daily beauty! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_019',
        label: 'Wellness Spa',
        category: 'beauty',
        keywords: ['wellness', 'spa', 'holistic', 'health'],
        template: 'Total wellness! Holistic spa treatments for mind, body, and spirit! {url}',
        isPrebuilt: true
      },
      {
        id: 'beauty_020',
        label: 'Beauty Products',
        category: 'beauty',
        keywords: ['beauty', 'products', 'cosmetics', 'skincare'],
        template: 'Premium beauty! Professional-grade products for at-home beauty care! {url}',
        isPrebuilt: true
      }
    ],

    'real-estate': [
      {
        id: 'real_001',
        label: 'Home for Sale',
        category: 'real-estate',
        keywords: ['home', 'house', 'sale', 'buy'],
        template: 'Beautiful home! Looking to buy or sell? I can help you find the perfect match! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_002',
        label: 'First Time Buyer',
        category: 'real-estate',
        keywords: ['first', 'time', 'buyer', 'new'],
        template: 'First home dreams! I specialize in helping first-time buyers navigate the process! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_003',
        label: 'Investment Property',
        category: 'real-estate',
        keywords: ['investment', 'property', 'rental', 'income'],
        template: 'Smart investment! Let me help you find profitable rental properties! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_004',
        label: 'Market Analysis',
        category: 'real-estate',
        keywords: ['market', 'analysis', 'value', 'price'],
        template: 'Know your home\'s worth! Free market analysis to determine your property value! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_005',
        label: 'Luxury Homes',
        category: 'real-estate',
        keywords: ['luxury', 'high-end', 'premium', 'exclusive'],
        template: 'Luxury living! Exclusive access to the finest properties in the area! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_006',
        label: 'Commercial Real Estate',
        category: 'real-estate',
        keywords: ['commercial', 'business', 'office', 'retail'],
        template: 'Business opportunity! Commercial real estate solutions for your enterprise! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_007',
        label: 'Property Management',
        category: 'real-estate',
        keywords: ['property', 'management', 'rental', 'landlord'],
        template: 'Stress-free ownership! Full-service property management for landlords! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_008',
        label: 'Home Staging',
        category: 'real-estate',
        keywords: ['staging', 'sell', 'presentation', 'decor'],
        template: 'Sell faster! Professional home staging to showcase your property\'s potential! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_009',
        label: 'Relocation Services',
        category: 'real-estate',
        keywords: ['relocation', 'moving', 'transfer', 'new'],
        template: 'Moving made easy! Complete relocation services for a smooth transition! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_010',
        label: 'Foreclosure Help',
        category: 'real-estate',
        keywords: ['foreclosure', 'distressed', 'help', 'save'],
        template: 'Don\'t lose hope! We help homeowners avoid foreclosure and find solutions! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_011',
        label: 'New Construction',
        category: 'real-estate',
        keywords: ['new', 'construction', 'builder', 'custom'],
        template: 'Build your dream! New construction homes with the latest features! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_012',
        label: 'Condo Sales',
        category: 'real-estate',
        keywords: ['condo', 'condominium', 'apartment', 'unit'],
        template: 'Urban living! Beautiful condos in prime locations with great amenities! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_013',
        label: 'Land Sales',
        category: 'real-estate',
        keywords: ['land', 'lot', 'acreage', 'development'],
        template: 'Build your future! Prime land opportunities for development or investment! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_014',
        label: 'Mortgage Services',
        category: 'real-estate',
        keywords: ['mortgage', 'loan', 'financing', 'rate'],
        template: 'Financing made simple! Competitive mortgage rates and expert guidance! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_015',
        label: 'Home Inspection',
        category: 'real-estate',
        keywords: ['inspection', 'home', 'buyer', 'condition'],
        template: 'Buy with confidence! Thorough home inspections protect your investment! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_016',
        label: 'Real Estate Photography',
        category: 'real-estate',
        keywords: ['photography', 'listing', 'photos', 'marketing'],
        template: 'Picture perfect! Professional real estate photography that sells homes! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_017',
        label: 'Vacation Rentals',
        category: 'real-estate',
        keywords: ['vacation', 'rental', 'airbnb', 'short-term'],
        template: 'Vacation investment! Turn your property into a profitable vacation rental! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_018',
        label: 'Senior Housing',
        category: 'real-estate',
        keywords: ['senior', 'retirement', 'community', 'accessible'],
        template: 'Golden years living! Senior-friendly homes and retirement communities! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_019',
        label: 'Real Estate Investing',
        category: 'real-estate',
        keywords: ['investing', 'investor', 'portfolio', 'returns'],
        template: 'Build wealth through real estate! Investment strategies that generate returns! {url}',
        isPrebuilt: true
      },
      {
        id: 'real_020',
        label: 'Home Appraisal',
        category: 'real-estate',
        keywords: ['appraisal', 'value', 'assessment', 'worth'],
        template: 'Know your value! Professional home appraisals for accurate valuations! {url}',
        isPrebuilt: true
      }
    ]
  };

  // Merge base templates with additional generated templates
  return { ...baseTemplates, ...additionalTemplates };
}

/**
 * Get templates for a specific category
 * @param {string} categoryId - Category ID
 * @returns {Array} Array of templates for the category
 */
function getTemplatesByCategory(categoryId) {
  const allTemplates = getPrebuiltTemplates();
  return allTemplates[categoryId] || [];
}

/**
 * Get all templates as a flat array
 * @returns {Array} All pre-built templates
 */
function getAllPrebuiltTemplatesFlat() {
  const allTemplates = getPrebuiltTemplates();
  const flatArray = [];
  
  Object.values(allTemplates).forEach(categoryTemplates => {
    flatArray.push(...categoryTemplates);
  });
  
  return flatArray;
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPrebuiltTemplates,
    getTemplatesByCategory,
    getAllPrebuiltTemplatesFlat
  };
} else {
  window.PrebuiltTemplates = {
    getPrebuiltTemplates,
    getTemplatesByCategory,
    getAllPrebuiltTemplatesFlat
  };
}