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
        keywords: ['car','auto','vehicle','service','servicing','maintenance','mechanic','garage','workshop','checkup','inspection','tune','mot','booking','appointment','-diy','-home','-howto','-tutorial','-hack','-cheap','-free','-recall','-warranty-void','-insurance-claim','-for-sale','-detail-only','-paint','-shipping','-bodywork'],
        template: 'Keep it running right—reliable servicing and repairs from trusted techs. Book today! {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_002',
        label: 'Oil Change Special',
        category: 'automotive',
        keywords: ['oil','change','oil-change','service','maintenance','synthetic','filter','interval','engine','lube','quick','express','while-you-wait','booking','coupon','-diy','-howto','-home','-tutorial','-hack','-cheap','-free','-recalled','-warranty-void','-spill','-recycle-only','-for-sale','-bulk-oil','-used-oil','-giveaway'],
        template: 'Due an oil change? Fast, professional service with premium filters—drive smoother today. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_003',
        label: 'Tire Service',
        category: 'automotive',
        keywords: ['tire','tires','tyre','tyres','wheel','alignment','balance','rotation','puncture','flat','grip','winter','all-season','fitment','-spare-only','-rim-sale-only','-detailing','-paint','-wrap','-diy','-home','-tutorial','-hack','-cheap','-free','-for-sale','-swap-meet','-track-only','-show-only'],
        template: 'Need new tires, alignment, or a quick puncture fix? We\'ll keep you rolling safely. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_004',
        label: 'Brake Service',
        category: 'automotive',
        keywords: ['brake','brakes','pads','rotors','discs','calipers','squeal','grind','abs','inspection','fluid','bleed','safety','stop','-diy','-home','-tutorial','-hack','-cheap','-free','-track-only','-race-only','-for-sale','-parts-only','-bodywork','-detailing','-paint','-recall'],
        template: 'Squeaks or a soft pedal? Expert brake inspections, pads, rotors, and fluid service. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_005',
        label: 'Engine Diagnostics',
        category: 'automotive',
        keywords: ['engine','diagnostic','diagnostics','check','check-engine','obd','scan','fault','misfire','rough idle','power loss','light','code','smoke','-diy','-home','-scanner-sale','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-tuning-only','-race-only','-bodywork','-detailing','-paint'],
        template: 'Warning light on or power down? Full OBD diagnostics to find and fix the issue fast. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_006',
        label: 'Car Detailing',
        category: 'automotive',
        keywords: ['detail','detailing','valet','wash','clean','shine','polish','wax','ceramic','interior','exterior','vacuum','stain','odor','-diy','-home','-howto','-tutorial','-hack','-cheap','-free','-self-serve','-car-wash-token','-products-only','-for-sale','-wrap-only','-paint-correction-only','-bodywork'],
        template: 'Showroom clean inside and out—professional detailing, interior refresh, and ceramic options. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_007',
        label: 'Transmission Service',
        category: 'automotive',
        keywords: ['transmission','gearbox','gear','shift','slip','fluid','flush','clutch','automatic','manual','dct','cvt','diagnostic','rebuild','-diy','-home','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-parts-only','-race-only','-tuning-only','-detailing','-paint','-bodywork'],
        template: 'Hard shifts, slipping, or delayed engagement? Expert transmission diagnostics and service. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_008',
        label: 'AC Repair',
        category: 'automotive',
        keywords: ['ac','a/c','aircon','air conditioning','cool','heat','hvac','compressor','recharge','leak','odor','blower','climate','vent','-diy','-home','-can-recharge','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-parts-only','-detailing','-paint','-bodywork','-house-ac'],
        template: 'Warm air or bad smells? We test, leak-check, and recharge your car\'s A/C properly. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_009',
        label: 'Battery Service',
        category: 'automotive',
        keywords: ['battery','dead','no-start','jump','jumpstart','crank','charging','alternator','test','replace','cold-start','voltage','starter','-diy','-home','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-charger-sale','-power-bank','-detailing','-paint','-bodywork'],
        template: 'Click… nothing? Free testing, quality replacements, and proper installation while you wait. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_010',
        label: 'Roadside Assistance',
        category: 'automotive',
        keywords: ['roadside','assist','assistance','tow','towing','breakdown','emergency','lockout','flat','jumpstart','fuel delivery','winch','24/7','rescue','-info-only','-insurance-only','-membership-sale','-diy','-home','-tutorial','-hack','-cheap','-free','-for-sale','-bodywork','-detailing','-paint'],
        template: 'Stranded? 24/7 roadside help—tows, jumpstarts, lockouts, and flats handled fast. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_011',
        label: 'Pre-Purchase Inspection',
        category: 'automotive',
        keywords: ['prepurchase','pre-purchase','ppi','inspection','buying','purchase','used car','history','leak','frame','rust','test drive','report','-dealer-ad','-for-sale-post','-auction-only','-valuation-only','-price-only','-estimate-only','-diy','-home','-tutorial','-howto','-free','-cheap','-paint','-detailing'],
        template: 'Buying used? Get a thorough pre-purchase inspection and clear report before you commit. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_012',
        label: 'Suspension Repair',
        category: 'automotive',
        keywords: ['suspension','shock','strut','spring','bush','bushing','control arm','ball joint','ride','bounce','knock','alignment','handling','-diy','-home','-tutorial','-howto','-hack','-cheap','-free','-track-only','-race-only','-for-sale','-parts-only','-detailing','-paint','-bodywork'],
        template: 'Clunks, knocks, or a floaty ride? We repair shocks, struts, bushes, and alignment. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_013',
        label: 'Exhaust Service',
        category: 'automotive',
        keywords: ['exhaust','muffler','silencer','pipe','leak','cat','catalytic','resonator','back box','downpipe','noise','rattle','weld','-diy','-home','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-parts-only','-track-only','-race-only','-paint','-detailing','-bodywork'],
        template: 'Too loud or leaking? From mufflers to cats, we repair and replace exhaust systems. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_014',
        label: 'Windshield Repair',
        category: 'automotive',
        keywords: ['windshield','screen','windscreen','glass','chip','crack','stone chip','repair','replace','seal','wiper','visibility','safety','-phone-screen','-home-glass','-window-cleaning','-diy','-tutorial','-howto','-hack','-cheap','-free','-for-sale','-kit-only','-bodywork','-paint','-detailing'],
        template: 'Chip or crack spreading? Fast windshield repair and replacements with quality glass. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_015',
        label: 'Fleet Service',
        category: 'automotive',
        keywords: ['fleet','commercial','business','van','truck','uptime','pm','preventive','logbook','bulk','priority','invoice','onsite','-personal-only','-private-sale','-single-car','-hobby','-club','-show','-track','-race','-detailing-only','-paint','-bodywork','-parts-only','-diy','-free'],
        template: 'Keep your fleet on the road—priority servicing, invoicing, and preventative maintenance. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_016',
        label: 'Classic Car Restoration',
        category: 'automotive',
        keywords: ['classic','vintage','antique','restoration','resto','carb','carburetor','points','wiring','trim','fabrication','heritage','concours','-modern-only','-ev','-hybrid','-lease','-daily-only','-quick-flip','-diy','-home','-howto','-tutorial','-cheap','-free','-wrap-only','-detailing-only'],
        template: 'Own a classic? Thoughtful restoration, period-correct parts, and careful craftsmanship. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_017',
        label: 'Performance Upgrades',
        category: 'automotive',
        keywords: ['performance','upgrade','tuning','remap','intake','exhaust','suspension','coilover','brakes','dyno','power','handling','track setup','-ev-only','-hybrid-only','-stock-only','-lease','-warranty-only','-diy','-howto','-tutorial','-cheap','-free','-for-sale','-cosmetic-only','-detailing','-paint'],
        template: 'Chasing more power or sharper handling? Proven performance upgrades and pro setup. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_018',
        label: 'Motorcycle Service',
        category: 'automotive',
        keywords: ['motorcycle','bike','motorbike','service','repair','chain','sprocket','tyre','brake','fork','valve','diagnostic','inspection','-bicycle','-scooter-toy','-e-bike-only','-helmet-sale','-gear-sale','-diy','-home','-tutorial','-howto','-cheap','-free','-for-sale','-detailing','-paint'],
        template: 'From chain and brakes to full services—we keep your motorcycle road-ready. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_019',
        label: 'Diesel Service',
        category: 'automotive',
        keywords: ['diesel','tdi','hdi','dpf','regen','injector','pump','turbo','egr','smoke','power loss','diagnostic','truck','-petrol','-gasoline','-ev','-hybrid','-motorcycle','-generator-only','-ship','-tractor-only','-diy','-howto','-tutorial','-cheap','-free','-for-sale','-detailing','-paint'],
        template: 'DPF issues, injector problems, or turbo lag? Specialist diesel diagnostics and repair. {url}',
        isPrebuilt: true
      },
      {
        id: 'auto_020',
        label: 'Hybrid Service',
        category: 'automotive',
        keywords: ['hybrid','hev','phev','electric','battery pack','inverter','isolation','hv','coolant','service','inspection','certified','safety','-diesel-only','-petrol-only','-carburetor','-points','-classic-only','-generator-only','-solar','-e-bike','-diy','-howto','-tutorial','-cheap','-free','-for-sale','-detailing','-paint'],
        template: 'Certified hybrid care—high-voltage safety checks, battery and inverter servicing done right. {url}',
        isPrebuilt: true
      }
    ],

    fitness: [
  {
    id: 'fit_001',
    label: 'Personal Training',
    category: 'fitness',
    keywords: ['fitness','workout','exercise','training','coach','personal trainer','program','plan','form','technique','gym','strength','accountability','results','transform','-pills','-steroids','-cycle','-scam','-cheap','-free','-giveaway','-diet-fad','-mlm','-challenge-spam','-injury-advice-only','-diy','-howto','-tutorial'],
    template: 'Want faster results with fewer guesswork reps? 1-to-1 personal training tailored to you—let’s start strong. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_002',
    label: 'Weight Loss Program',
    category: 'fitness',
    keywords: ['weight','fat loss','weight loss','cut','calorie deficit','meal plan','accountability','check-in','progress','metrics','habit','nutrition','coach','-pills','-fat-burner','-detox','-tea','-waist-trainer','-steroids','-scam','-free','-cheap','-giveaway','-mlm','-miracle','-before-after-only','-diy','-howto'],
    template: 'Lose weight the right way—structured coaching, simple habits, and weekly check-ins that keep you on track. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_003',
    label: 'Nutrition Coaching',
    category: 'fitness',
    keywords: ['nutrition','diet','macros','protein','meal','plan','grocery','habit','coach','fuel','performance','healthy eating','recipes','-pills','-detox','-tea','-fad','-keto-only','-supp-only','-mlm','-cheap','-free','-giveaway','-scam','-miracle','-extreme','-diy','-howto','-tutorial'],
    template: 'Eat for your goals—practical nutrition coaching with easy meal plans and grocery guides. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_004',
    label: 'Yoga Classes',
    category: 'fitness',
    keywords: ['yoga','vinyasa','hatha','flow','stretch','mobility','mindfulness','breath','flexibility','balance','calm','studio','class','-acro-only','-circus','-spiritual-debate','-religion-argue','-free','-cheap','-giveaway','-diy','-howto','-tutorial','-equipment-sale','-injury-ask-only','-spam'],
    template: 'Find your flow—calming yoga classes that build strength, mobility, and headspace. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_005',
    label: 'CrossFit Training',
    category: 'fitness',
    keywords: ['crossfit','wod','metcon','functional','strength','olympic lifts','conditioning','community','box','coach','scalable','intensity','-injury-advice-only','-form-argument','-equipment-sale','-cheap','-free','-giveaway','-steroids','-cycle','-peds','-spam','-diy','-howto','-tutorial'],
    template: 'Ready to level up? Scalable CrossFit coaching—stronger lifts, better engine, supportive community. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_006',
    label: 'Marathon Training',
    category: 'fitness',
    keywords: ['running','runner','marathon','half marathon','10k','5k','plan','pace','long run','intervals','taper','race day','coach','-shoe-sale-only','-injury-diagnosis','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-miracle','-hack','-gimmick','-betting'],
    template: 'Training for a race? Personalized run plans, pacing strategy, and coach feedback to finish strong. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_007',
    label: 'Strength Training',
    category: 'fitness',
    keywords: ['strength','hypertrophy','muscle','compound','progressive overload','program','coach','deadlift','squat','bench','accessories','recovery','-steroids','-peds','-cycle','-cheap','-free','-giveaway','-equipment-sale','-injury-diagnosis','-diy','-howto','-tutorial','-spam','-challenge-spam'],
    template: 'Build real strength with smart programming and technique coaching—no fluff, just progress. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_008',
    label: 'Group Fitness Classes',
    category: 'fitness',
    keywords: ['group','class','bootcamp','zumba','circuit','hiit','community','fun','coach','schedule','beginner friendly','all levels','-online-argue','-equipment-sale','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-location-mismatch','-private-event-only'],
    template: 'Fitness is more fun together—high-energy group classes for all levels. Try a session this week. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_009',
    label: 'Senior Fitness',
    category: 'fitness',
    keywords: ['senior','older adult','balance','mobility','low impact','bone health','falls prevention','gentle','safe','coach','community','-high-intensity-only','-powerlifting-only','-crossfit-elite','-steroids','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-politics'],
    template: 'Stay active, steady, and strong—safe, low-impact fitness designed for older adults. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_010',
    label: 'Kids Fitness',
    category: 'fitness',
    keywords: ['kids','children','youth','sports','games','agility','fun','confidence','coach','after school','class','-adult-only','-nutrition-argue','-equipment-sale','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-politics','-controversy'],
    template: 'Active kids are confident kids—fun, coach-led classes that build skills and smiles. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_011',
    label: 'Rehabilitation Fitness',
    category: 'fitness',
    keywords: ['rehab','post injury','recovery','physio informed','mobility','stability','return to sport','low impact','progressions','coach','-diagnosis-only','-surgery-advice','-medical-claims','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-extreme','-challenge'],
    template: 'Coming back from injury? Gentle, coach-guided progressions to rebuild strength and confidence. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_012',
    label: 'Pilates Classes',
    category: 'fitness',
    keywords: ['pilates','core','stability','posture','mobility','control','mat','reformer','class','studio','coach','-equipment-sale','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-extreme-weightloss','-steroids','-peds'],
    template: 'Stronger core, better posture—Pilates classes that improve control and mobility. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_013',
    label: 'Boxing Training',
    category: 'fitness',
    keywords: ['boxing','pads','bag work','footwork','conditioning','coach','technique','sparring (optional)','fitness boxing','gloves','wraps','-street-fight','-violence','-weapons','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-mma-debate','-injury-diagnosis'],
    template: 'Hit pads, not plateaus—boxing workouts that sharpen technique and torch calories. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_014',
    label: 'Swimming Lessons',
    category: 'fitness',
    keywords: ['swimming','lessons','coach','stroke','breathing','confidence','lane','pool','beginner','improver','triathlon','-open-water-only','-equipment-sale','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-facility-closed','-politics'],
    template: 'Learn to swim or polish your stroke—patient coaching for beginners to triathletes. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_015',
    label: 'Outdoor Bootcamp',
    category: 'fitness',
    keywords: ['bootcamp','outdoor','park','fresh air','circuits','hiit','team vibe','coach','schedule','all levels','-weather-cancellation-argue','-permit-issue','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-equipment-sale','-politics'],
    template: 'Train hard in the fresh air—outdoor bootcamps that energize your body and headspace. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_016',
    label: 'Wellness Coaching',
    category: 'fitness',
    keywords: ['wellness','habits','sleep','stress','routine','movement','nutrition basics','mindset','coach','check-ins','-supp-only','-pills','-detox','-tea','-mlm','-scam','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial'],
    template: 'Simple habits, big wins—wellness coaching that fits your life and sticks. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_017',
    label: 'Sports Performance',
    category: 'fitness',
    keywords: ['sports','performance','speed','power','agility','strength','conditioning','testing','program','coach','athlete','-betting','-tickets','-merch','-cheap','-free','-giveaway','-spam','-steroids','-peds','-diy','-howto','-tutorial','-injury-diagnosis'],
    template: 'Train like an athlete—speed, power, and conditioning programs tailored to your sport. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_018',
    label: 'Dance Fitness',
    category: 'fitness',
    keywords: ['dance','zumba','rhythm','music','fun','cardio','group','class','beginner friendly','confidence','-auditions-only','-tickets','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-politics','-controversy','-equipment-sale'],
    template: 'Cardio that feels like a party—dance fitness classes for every level. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_019',
    label: 'Flexibility Training',
    category: 'fitness',
    keywords: ['flexibility','mobility','range of motion','stretch','hips','hamstrings','shoulders','posture','recovery','coach','routine','-contortion-only','-pain-diagnosis','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-equipment-sale','-extreme'],
    template: 'Move better, feel better—guided flexibility and mobility sessions built around you. {url}',
    isPrebuilt: true
  },
  {
    id: 'fit_020',
    label: 'Fitness Assessment',
    category: 'fitness',
    keywords: ['assessment','evaluation','testing','baseline','body comp','movement screen','goals','program start','coach','report','-medical-diagnosis','-cheap','-free','-giveaway','-spam','-diy','-howto','-tutorial','-argument','-equipment-sale','-politics'],
    template: 'Start with clarity—complete fitness assessment and a plan you can actually follow. {url}',
    isPrebuilt: true
  }
],

food: [
  {
    id: 'food_001',
    label: 'Restaurant Recommendation',
    category: 'food',
    keywords: ['restaurant','dining','foodie','menu','chef','table','reservation','local','fresh','specials','family friendly','date night','-recipe-only','-home-cooking','-diet-argue','-cheap','-free','-giveaway','-spam','-delivery-app-only','-closed','-sold-out','-job-post'],
    template: 'Love great food? Book a table and taste our chef’s favourites—fresh, local, and generous. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_002',
    label: 'Catering Services',
    category: 'food',
    keywords: ['catering','event','party','wedding','corporate','buffet','canapés','platter','menu','chef','delivery','setup','-recipe-only','-home-potluck','-cheap','-free','-giveaway','-spam','-equipment-sale','-venue-hire-only','-job-post','-diet-argument'],
    template: 'Planning an event? Seamless catering—menus, delivery, and setup handled end-to-end. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_003',
    label: 'Food Delivery',
    category: 'food',
    keywords: ['delivery','takeout','order','online','tonight','app','driver','hot','fresh','family deal','combo','-recipe-only','-home-cooking','-meal-prep-guide','-cheap','-free','-giveaway','-spam','-closed','-pickup-only-argue','-diet-argue'],
    template: 'Dinner sorted—fresh, hot delivery with easy online ordering and fast drop-off. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_004',
    label: 'Pizza Special',
    category: 'food',
    keywords: ['pizza','slice','pepperoni','margherita','stone baked','wood fired','cheese','toppings','deal','2 for 1','-recipe-only','-home-oven','-cheap','-free','-giveaway','-spam','-diet-argue','-gluten-free-argue','-closed','-equipment-sale'],
    template: 'Craving pizza? Hand-stretched bases, big toppings, and hot deals tonight. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_005',
    label: 'Bakery Fresh',
    category: 'food',
    keywords: ['bakery','bread','pastry','croissant','cake','fresh','morning','artisan','butter','sourdough','-recipe-only','-home-bake','-cheap','-free','-giveaway','-spam','-gluten-argument','-equipment-sale','-job-post','-closed'],
    template: 'From the oven to you—fresh breads and pastries baked each morning. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_006',
    label: 'Coffee Shop',
    category: 'food',
    keywords: ['coffee','espresso','latte','cappuccino','beans','roast','barista','cafe','pastry','wifi','workspace','-home-brew-only','-equipment-sale','-cheap','-free','-giveaway','-spam','-diet-argue','-closed','-job-post'],
    template: 'Need a pick-me-up? Specialty coffee, friendly baristas, and a cosy spot to unwind. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_007',
    label: 'Healthy Options',
    category: 'food',
    keywords: ['healthy','salad','bowls','lean','protein','whole foods','fresh','macro friendly','gluten free options','veggie','-recipe-only','-diet-war','-keto-only','-vegan-argument','-cheap','-free','-giveaway','-spam','-closed','-supplement-sale','-fad'],
    template: 'Clean, tasty, satisfying—healthy menu options that actually fill you up. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_008',
    label: 'BBQ Specialties',
    category: 'food',
    keywords: ['bbq','barbecue','smoked','brisket','ribs','pulled pork','pit','sauce','smoker','grill','-recipe-only','-home-smoker','-vegan-argument','-cheap','-free','-giveaway','-spam','-closed','-equipment-sale','-diet-war'],
    template: 'Low ’n slow done right—smoked meats, bold sauces, and proper portions. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_009',
    label: 'Seafood Fresh',
    category: 'food',
    keywords: ['seafood','fish','shrimp','prawn','oyster','grill','pan seared','market fresh','ocean','daily catch','-recipe-only','-home-fishing','-sustainability-argue','-cheap','-free','-giveaway','-spam','-closed','-equipment-sale','-diet-war'],
    template: 'Daily catch, expertly cooked—fresh seafood with bright, seasonal sides. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_010',
    label: 'Dessert Heaven',
    category: 'food',
    keywords: ['dessert','cake','pudding','brownie','cheesecake','sweet','treat','indulgent','bake','pastry','-recipe-only','-home-bake','-sugar-argument','-cheap','-free','-giveaway','-spam','-closed','-diet-war','-equipment-sale'],
    template: 'Got a sweet tooth? Indulgent desserts baked fresh—treat yourself tonight. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_011',
    label: 'Meal Prep Service',
    category: 'food',
    keywords: ['meal prep','prep','weekly','macro','healthy','ready meals','order','delivery','portion','menu','-recipe-guide-only','-home-cook-only','-cheap','-free','-giveaway','-spam','-diet-war','-closed','-equipment-sale','-job-post'],
    template: 'Healthy eating made easy—fresh meal prep by the week with clear macros. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_012',
    label: 'Food Truck',
    category: 'food',
    keywords: ['food truck','street food','mobile','pop up','festival','location','menu','specials','events','-recipe-only','-permit-argue','-cheap','-free','-giveaway','-spam','-closed','-equipment-sale','-job-post','-diet-war'],
    template: 'Street eats done right—follow the truck for today’s location and specials. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_013',
    label: 'Wine & Dine',
    category: 'food',
    keywords: ['wine','pairing','cellar','sommelier','dinner','tasting menu','course','reserve','date night','-retail-only','-home-cellar','-cheap','-free','-giveaway','-spam','-closed','-diet-war','-age-argue','-policy-argue'],
    template: 'Make it a night—thoughtful wine pairings and a chef’s tasting menu to match. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_014',
    label: 'Breakfast Special',
    category: 'food',
    keywords: ['breakfast','brunch','morning','eggs','pancakes','coffee','pastry','family','weekend','specials','-recipe-only','-home-cook','-cheap','-free','-giveaway','-spam','-closed','-diet-war','-equipment-sale','-job-post'],
    template: 'Start strong—hearty breakfasts, great coffee, and weekend brunch specials. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_015',
    label: 'Vegan Options',
    category: 'food',
    keywords: ['vegan','plant based','dairy free','meat free','veg','bowls','salad','protein','menu','-recipe-only','-diet-war','-keto-argue','-cheap','-free','-giveaway','-spam','-closed','-equipment-sale','-politics'],
    template: 'Plant-based and flavour-packed—proper vegan dishes with satisfying portions. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_016',
    label: 'International Cuisine',
    category: 'food',
    keywords: ['international','world','authentic','flavours','spices','regional','chef','menu','specials','-recipe-only','-culture-argue','-cheap','-free','-giveaway','-spam','-closed','-equipment-sale','-job-post','-diet-war'],
    template: 'Taste the world—authentic flavours and regional specials from our chef’s travels. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_017',
    label: 'Happy Hour',
    category: 'food',
    keywords: ['happy hour','drinks','cocktails','beer','wine','nibbles','after work','deal','bar','-age-argue','-policy-argue','-cheap','-free','-giveaway','-spam','-closed','-aa-discussion','-politics','-health-argue'],
    template: 'After-work plans? Happy hour drinks and bites—bring the crew. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_018',
    label: 'Farm to Table',
    category: 'food',
    keywords: ['farm to table','local','seasonal','producers','fresh','traceable','menu','chef','-recipe-only','-sourcing-argue-only','-cheap','-free','-giveaway','-spam','-closed','-politics','-diet-war','-equipment-sale'],
    template: 'Local farms, seasonal menus—fresh ingredients cooked with care. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_019',
    label: 'Cooking Classes',
    category: 'food',
    keywords: ['cooking class','learn','chef','hands on','kitchen','technique','menu','date night','team','-free-youtube','-recipe-only','-cheap','-giveaway','-spam','-equipment-sale','-venue-hire-only','-job-post','-closed'],
    template: 'Sharpen your skills—hands-on cooking classes led by our chefs. {url}',
    isPrebuilt: true
  },
  {
    id: 'food_020',
    label: 'Food Festival',
    category: 'food',
    keywords: ['festival','event','food stalls','vendors','street food','music','tickets','weekend','schedule','-recipe-only','-organiser-only','-cheap','-free','-giveaway-spam','-closed','-equipment-sale','-job-post','-politics'],
    template: 'See you at the festival—great food stalls, live vibes, and plenty to try. {url}',
    isPrebuilt: true
  }
],


    'home-services': [
  {
    id: 'home_001',
    label: 'House Cleaning',
    category: 'home-services',
    keywords: ['cleaning','house','home','maid','housekeeper','deep clean','spring clean','weekly','biweekly','move-out','sanitise','sparkling','kitchen','bathroom','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-only','-vacuum-sale','-listing-only','-rent-only','-airbnb-host-tips','-job-seeking','-looking-for-staff'],
    template: 'Make “spotless” the default—reliable weekly, biweekly, and deep clean services that shine. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_002',
    label: 'Landscaping',
    category: 'home-services',
    keywords: ['landscaping','landscape','lawn care','mowing','hedge','trim','mulch','planting','design','patio','sod','turf','irrigation','garden','-diy','-howto','-tutorial','-hack','-seed-only','-equipment-sale','-cheap','-free','-giveaway','-community-garden-only','-permits-argue','-job-seeking','-staffing'],
    template: 'Curb appeal, sorted—professional landscaping, lawn care, planting, and patio projects done right. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_003',
    label: 'Plumbing Service',
    category: 'home-services',
    keywords: ['plumbing','plumber','leak','pipe','burst','drain','clog','toilet','faucet','tap','water heater','boiler','emergency','24/7','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-parts-only','-tool-sale','-insurance-only','-landlord-advice','-job-post','-hiring'],
    template: 'Leaks, clogs, or no hot water? Licensed plumbers on call for fast, clean fixes—day or night. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_004',
    label: 'Electrical Work',
    category: 'home-services',
    keywords: ['electrical','electrician','wiring','rewire','breaker','fuse','lighting','outlet','socket','panel','inspection','smoke alarm','ev charger','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-parts-only','-tool-sale','-advice-only','-permit-argue','-job-post','-hiring'],
    template: 'Safe, certified electrical work—repairs, lighting, panels, and EV chargers installed properly. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_005',
    label: 'HVAC Service',
    category: 'home-services',
    keywords: ['hvac','heating','cooling','air conditioning','furnace','ac','boiler','heat pump','filter','tune-up','maintenance','thermostat','duct','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-parts-only','-tool-sale','-landlord-policy','-warranty-argue','-job-post'],
    template: 'Stay comfy year-round—expert HVAC repairs, tune-ups, and installs that save energy. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_006',
    label: 'Handyman Services',
    category: 'home-services',
    keywords: ['handyman','repairs','fix','maintenance','odd jobs','assembly','mounting','caulk','patch','trim','carpentry','fixtures','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-tool-sale','-materials-only','-advice-only','-job-post','-hiring','-quote-only-thread'],
    template: 'Your “fix-it” list, finished—reliable handyman help for repairs, installs, and assembly. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_007',
    label: 'Painting Service',
    category: 'home-services',
    keywords: ['painting','painter','interior','exterior','prep','prime','roller','spray','trim','ceiling','feature wall','colour match','finish','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-paint-sale','-materials-only','-advice-only','-job-post','-hiring'],
    template: 'Fresh paint, flawless finish—professional interior and exterior painting with meticulous prep. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_008',
    label: 'Roofing Service',
    category: 'home-services',
    keywords: ['roofing','roof','leak','shingles','tile','metal','flashing','repair','replace','storm damage','inspection','gutter','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-materials-only','-ladder-sale','-insurance-only','-permit-argue','-job-post'],
    template: 'Stop leaks and stress—expert roof repairs and replacements with clean job sites and clear quotes. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_009',
    label: 'Flooring Installation',
    category: 'home-services',
    keywords: ['flooring','install','hardwood','laminate','vinyl','tile','carpet','underlay','subfloor','level','refinish','baseboard','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-materials-only','-tool-sale','-advice-only','-job-post','-hiring'],
    template: 'From design to done—hardwood, tile, or vinyl floors installed with precision and care. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_010',
    label: 'Window Cleaning',
    category: 'home-services',
    keywords: ['window cleaning','windows','glass','streak-free','pure water','squeegee','frames','screens','conservatory','skylight','shine','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-equipment-sale','-product-only','-advice-only','-job-post','-hiring'],
    template: 'Crystal-clear views—streak-free window cleaning for frames, panes, and skylights. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_011',
    label: 'Pest Control',
    category: 'home-services',
    keywords: ['pest control','exterminator','insects','ants','wasp','bee removal','rodent','mice','rats','termites','bedbugs','treatment','safe','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-trap-sale','-poison-sale','-advice-only','-job-post','-hiring'],
    template: 'Pests don’t stand a chance—safe, targeted treatments for insects and rodents, guaranteed. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_012',
    label: 'Gutter Cleaning',
    category: 'home-services',
    keywords: ['gutter','gutters','cleaning','downspout','drainage','clog','overflow','ladder','guard','soffit','fascia','rain','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-equipment-sale','-advice-only','-materials-only','-job-post','-hiring'],
    template: 'Prevent costly water damage—professional gutter cleaning and downspout flush-through. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_013',
    label: 'Pool Service',
    category: 'home-services',
    keywords: ['pool','pool cleaning','chemical balance','chlorine','filter','pump','vacuum','opening','closing','weekly service','algae','clarity','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-chemical-sale','-equipment-sale','-advice-only','-job-post','-hiring'],
    template: 'Blue, balanced, and ready—weekly pool cleaning, chemical checks, and equipment care. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_014',
    label: 'Security Systems',
    category: 'home-services',
    keywords: ['security','alarm','cctv','camera','smart','doorbell','monitoring','sensor','install','setup','app','alerts','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-camera-sale','-equipment-only','-privacy-argue','-job-post','-hiring'],
    template: 'Protect what matters—smart alarms and cameras installed, configured, and monitored right. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_015',
    label: 'Appliance Repair',
    category: 'home-services',
    keywords: ['appliance','repair','washer','dryer','fridge','freezer','oven','range','dishwasher','microwave','diagnostic','parts','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-parts-only','-tool-sale','-warranty-argue','-job-post','-hiring'],
    template: 'Washer won’t spin or oven won’t heat? Fast appliance diagnostics and reliable repairs. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_016',
    label: 'Carpet Cleaning',
    category: 'home-services',
    keywords: ['carpet cleaning','steam clean','hot water extraction','stain','odor','pet','upholstery','rug','high-traffic','dry time','fresh','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-machine-rental','-chemical-sale','-advice-only','-job-post','-hiring'],
    template: 'Deep clean without the soak—professional carpet and upholstery cleaning that lifts stains and odors. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_017',
    label: 'Tree Service',
    category: 'home-services',
    keywords: ['tree','arborist','removal','trimming','pruning','stump','storm damage','cabling','hedge','lot clearing','permit','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-chainsaw-sale','-equipment-only','-advice-only','-job-post','-hiring'],
    template: 'Safe tree work from certified pros—removals, pruning, and storm damage handled cleanly. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_018',
    label: 'Garage Door Service',
    category: 'home-services',
    keywords: ['garage door','spring','opener','track','roller','sensor','panel','remote','install','repair','tune','quiet','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-opener-sale','-parts-only','-advice-only','-job-post','-hiring'],
    template: 'Stuck, squeaky, or unsafe? We repair springs, openers, and tracks—fast and tidy. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_019',
    label: 'Driveway Sealing',
    category: 'home-services',
    keywords: ['driveway','sealing','sealcoat','asphalt','tarmac','concrete','crack fill','protect','resurface','cure','jetspray','edges','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-bucket-sale','-material-only','-advice-only','-job-post','-hiring'],
    template: 'Protect and refresh—professional driveway sealing that boosts curb appeal and longevity. {url}',
    isPrebuilt: true
  },
  {
    id: 'home_020',
    label: 'Home Inspection',
    category: 'home-services',
    keywords: ['home inspection','buyer','seller','report','foundation','roof','electric','plumbing','hvac','moisture','thermal','licensed','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-opinion-only','-valuation-only','-job-post','-hiring','-argument-thread'],
    template: 'Know before you commit—comprehensive home inspections with clear, photo-rich reports. {url}',
    isPrebuilt: true
  }
],

beauty: [
  {
    id: 'beauty_001',
    label: 'Hair Salon',
    category: 'beauty',
    keywords: ['hair','salon','stylist','cut','trim','restyle','blowout','treatment','keratin','olaplex','appointment','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring','-home-kit'],
    template: 'New hair, new mood—precision cuts, treatments, and blowouts by stylists who listen. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_002',
    label: 'Nail Service',
    category: 'beauty',
    keywords: ['nails','manicure','pedicure','gel','acrylic','builder','shape','file','polish','nail art','spa','-diy','-press-on-only','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Hands and feet, flawlessly finished—manicures, pedicures, and nail art you’ll love. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_003',
    label: 'Spa Treatment',
    category: 'beauty',
    keywords: ['spa','massage','facial','relax','aromatherapy','hot stone','hydra','glow','pamper','gift voucher','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-medical-claims','-job-post','-hiring'],
    template: 'Switch off and recharge—massages and facials tailored to relax, reset, and revive. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_004',
    label: 'Makeup Artist',
    category: 'beauty',
    keywords: ['makeup','mua','artist','wedding','bridal','event','prom','photoshoot','soft glam','airbrush','trial','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Camera-ready confidence—professional makeup for weddings, events, and shoots. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_005',
    label: 'Skincare Treatment',
    category: 'beauty',
    keywords: ['skincare','facial','peel','microderm','extractions','hydration','brighten','acne care','anti-age','spf','consult','-medical-claims','-cure','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Glowing, clearer skin—targeted facials and plans tailored to your skin goals. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_006',
    label: 'Eyebrow Service',
    category: 'beauty',
    keywords: ['eyebrow','brows','threading','waxing','shape','tint','lamination','arch','mapping','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-home-kit','-product-sale-only','-job-post','-hiring'],
    template: 'Brows that frame your face—expert shaping, tinting, and lamination. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_007',
    label: 'Eyelash Extensions',
    category: 'beauty',
    keywords: ['eyelash','lashes','extensions','classic','hybrid','volume','fill','retention','patch test','aftercare','-diy','-cluster-only','-strip-lash','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Wake up ready—classic to volume lash extensions with gentle application and great retention. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_008',
    label: 'Hair Color',
    category: 'beauty',
    keywords: ['hair color','colour','highlights','balayage','toner','roots','lift','gloss','corrective','consult','-diy','-box-dye','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Colour with confidence—balayage, highlights, and glossing tailored to your tone. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_009',
    label: 'Botox Treatment',
    category: 'beauty',
    keywords: ['botox','anti-wrinkle','lines','forehead','crow’s feet','consultation','nurse','clinician','clinic','-illegal','-at-home','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-unlicensed','-claims','-job-post','-hiring'],
    template: 'Subtle, refreshed results—clinician-led anti-wrinkle treatments with a careful touch. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_010',
    label: 'Laser Hair Removal',
    category: 'beauty',
    keywords: ['laser hair removal','laser','hair','permanent reduction','course','patch test','consult','area','smooth','clinic','-at-home-device','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-claims','-job-post','-hiring'],
    template: 'Smoother for longer—clinically delivered laser hair reduction with patch testing and plans. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_011',
    label: 'Microblading',
    category: 'beauty',
    keywords: ['microblading','brows','semi-permanent','hair strokes','mapping','numbing','aftercare','touch-up','healing','-tattoo-argument','-at-home','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-unlicensed','-job-post','-hiring'],
    template: 'Wake up with brows—natural-looking microblading with mapping, aftercare, and touch-ups. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_012',
    label: 'Body Contouring',
    category: 'beauty',
    keywords: ['body contouring','sculpt','cavitation','rf','firm','toning','consult','course','areas','non-invasive','-medical-claims','-weight-loss-guarantee','-surgery','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-job-post','-hiring'],
    template: 'Smoother lines, non-invasive—body contouring sessions tailored to your goals. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_013',
    label: 'Teeth Whitening',
    category: 'beauty',
    keywords: ['teeth whitening','smile','shade','tray','led','enamel-safe','session','clinic','-dental-claims','-medical-claims','-home-kit-only','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-job-post','-hiring'],
    template: 'Brighter smile, fast—gentle whitening sessions with enamel-safe products. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_014',
    label: 'Tanning Service',
    category: 'beauty',
    keywords: ['tanning','spray tan','bronze','airbrush','shade','prep','aftercare','streak-free','event','-sunbed-argument','-health-argue','-at-home','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Golden, even glow—custom spray tans with skin prep and aftercare tips included. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_015',
    label: 'Waxing Service',
    category: 'beauty',
    keywords: ['waxing','hair removal','brows','lip','underarm','bikini','hollywood','leg','back','sensitive','aftercare','-at-home','-sugar-only-argument','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Smooth results, fast—professional waxing with quality waxes and expert technique. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_016',
    label: 'Bridal Beauty',
    category: 'beauty',
    keywords: ['bridal','wedding','bride','trial','makeup','hair','schedule','party','packages','on-location','-dress-sale','-venue-argue','-planner-only','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-job-post','-hiring'],
    template: 'Your look, perfected—bridal hair and makeup with trials and on-location options. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_017',
    label: 'Men\'s Grooming',
    category: 'beauty',
    keywords: ['men','grooming','barber','beard','trim','fade','hot towel','shave','style','product','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-home-kit','-product-sale-only','-job-post','-hiring'],
    template: 'Sharp, clean, confident—barbering and beard grooming with classic hot towel finishes. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_018',
    label: 'Permanent Makeup',
    category: 'beauty',
    keywords: ['permanent makeup','pmu','brows','eyeliner','lip blush','mapping','numbing','touch-up','aftercare','-unlicensed','-at-home','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-claims','-job-post','-hiring'],
    template: 'Wake up ready—PMU brows, liner, and lip blush with careful mapping and aftercare. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_019',
    label: 'Wellness Spa',
    category: 'beauty',
    keywords: ['wellness','spa','holistic','relax','detox','sauna','steam','salt room','aroma','mind-body','packages','-medical-claims','-cure','-diy','-howto','-tutorial','-hack','-cheap','-free','-giveaway','-product-sale-only','-job-post','-hiring'],
    template: 'Space to breathe—wellness spa packages that restore balance and calm. {url}',
    isPrebuilt: true
  },
  {
    id: 'beauty_020',
    label: 'Beauty Products',
    category: 'beauty',
    keywords: ['beauty products','cosmetics','skincare','haircare','professional','retail','set','bundle','recommend','-mlm','-resale-only','-dropship','-cheap','-free','-giveaway','-spam','-fake','-counterfeit','-recall','-job-post','-hiring'],
    template: 'Pro-picked products that perform—shop our curated skincare and haircare in-studio or online. {url}',
    isPrebuilt: true
  }
],

'real-estate': [
  {
    id: 'real_001',
    label: 'Home for Sale',
    category: 'real-estate',
    keywords: ['home','house','for sale','listing','open house','viewing','tour','neighbourhood','garden','garage','move-in ready','-rent-only','-wanted-to-rent','-roommate','-swap','-trade','-fsbo-argue','-price-argument','-politics','-spam','-job-post','-hiring','-scam'],
    template: 'Looking to buy or sell? Book a viewing and get expert help from offer to keys. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_002',
    label: 'First Time Buyer',
    category: 'real-estate',
    keywords: ['first time buyer','ftb','starter home','deposit','mortgage advice','help to buy','viewing','offer','solicitor','completion','-investor-only','-cash-only-argue','-rent-only','-room-wanted','-price-argue','-politics','-scam','-job-post','-hiring','-spam'],
    template: 'First place, made simple—clear steps, smart search, and guidance all the way home. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_003',
    label: 'Investment Property',
    category: 'real-estate',
    keywords: ['investment','rental','yield','roi','cash flow','buy to let','portfolio','tenant','lease','management','-owner-occupier-only','-room-wanted','-rent-only','-politics','-price-argue','-scam','-job-post','-hiring','-spam','-short-let-only'],
    template: 'Build your portfolio—sourcing, analysis, and management options for solid rental returns. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_004',
    label: 'Market Analysis',
    category: 'real-estate',
    keywords: ['market analysis','valuation','cma','comparables','price','days on market','trend','area','report','-opinion-only-argue','-politics','-rant','-spam','-scam','-job-post','-hiring','-mortgage-only','-solicitor-only','-insurance-only'],
    template: 'What’s your home worth? Get a clear, data-led valuation and market strategy. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_005',
    label: 'Luxury Homes',
    category: 'real-estate',
    keywords: ['luxury','premium','high end','exclusive','gated','pool','chef kitchen','view','suite','smart home','architect','-rent-only','-price-argue','-politics','-scam','-job-post','-hiring','-spam','-roomshare','-budget-only','-auction-only'],
    template: 'Elevate your lifestyle—curated access to luxury listings and private viewings. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_006',
    label: 'Commercial Real Estate',
    category: 'real-estate',
    keywords: ['commercial','office','retail','industrial','warehouse','unit','lease','fit-out','traffic','footfall','zoning','-residential-only','-room-wanted','-rent-a-room','-politics','-scam','-job-post','-hiring','-spam','-price-argue'],
    template: 'Right space, real results—offices, retail, and industrial units with smart lease terms. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_007',
    label: 'Property Management',
    category: 'real-estate',
    keywords: ['property management','tenant','rent collection','maintenance','inspection','compliance','eviction','voids','portfolio','-owner-occupier-only','-airbnb-only','-politics','-scam','-job-post','-hiring','-spam','-rent-seeking','-room-wanted','-advice-only'],
    template: 'Hands-off, hassle-free—professional management that protects income and property. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_008',
    label: 'Home Staging',
    category: 'real-estate',
    keywords: ['staging','presentation','declutter','style','photography','showing','buyer appeal','faster sale','-rent-only','-price-argue','-politics','-scam','-job-post','-hiring','-spam','-diy-only','-howto','-tutorial'],
    template: 'Stage to sell—professional styling and photos that help your listing stand out. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_009',
    label: 'Relocation Services',
    category: 'real-estate',
    keywords: ['relocation','move','transfer','corporate','temporary housing','neighbourhood tour','schools','settling in','-local-only-argue','-politics','-scam','-job-post','-hiring','-spam','-visa-only','-immigration-argue','-price-argue'],
    template: 'New city, no stress—home search, area tours, and smooth move-in support. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_010',
    label: 'Foreclosure Help',
    category: 'real-estate',
    keywords: ['foreclosure','distressed','short sale','late payments','options','hardship','assistance','sell fast','timeline','-investor-spam','-politics','-scam','-job-post','-hiring','-spam','-loan-only','-advice-argument','-price-argue'],
    template: 'Behind on payments? Explore respectful options before foreclosure—confidential chat. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_011',
    label: 'New Construction',
    category: 'real-estate',
    keywords: ['new construction','builder','spec','custom','warranty','upgrade','lot','phase','development','-renovation-only','-rent-only','-price-argue','-politics','-scam','-job-post','-hiring','-spam','-diy-only'],
    template: 'Build new with confidence—tour developments, compare builders, and secure incentives. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_012',
    label: 'Condo Sales',
    category: 'real-estate',
    keywords: ['condo','condominium','apartment','unit','hoa','amenities','elevator','parking','downtown','view','-house-only','-rent-only','-roomshare','-price-argue','-politics','-scam','-job-post','-hiring','-spam'],
    template: 'City living, simplified—condos with great amenities and walkable locations. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_013',
    label: 'Land Sales',
    category: 'real-estate',
    keywords: ['land','acreage','lot','parcel','zoning','utilities','septic','survey','build','rural','-rent-only','-house-only','-price-argue','-politics','-scam','-job-post','-hiring','-spam','-camp-only'],
    template: 'Start from the ground up—lots and acreage with clear zoning and utility info. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_014',
    label: 'Mortgage Services',
    category: 'real-estate',
    keywords: ['mortgage','loan','pre-approval','rate','fixed','variable','offset','broker','closing costs','-cash-buyer-only','-politics','-scam','-job-post','-hiring','-spam','-crypto-only','-argument','-rent-only'],
    template: 'Smarter financing—compare rates, get pre-approved, and shop with confidence. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_015',
    label: 'Home Inspection',
    category: 'real-estate',
    keywords: ['home inspection','survey','report','foundation','roof','electrical','plumbing','hvac','moisture','thermal','-valuation-only','-opinion-argue','-politics','-scam','-job-post','-hiring','-spam','-diy-only','-howto'],
    template: 'Buy with eyes open—independent inspections and photo-rich reports before you commit. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_016',
    label: 'Real Estate Photography',
    category: 'real-estate',
    keywords: ['photography','photos','wide angle','twilight','drone','floor plan','virtual tour','staging','editing','-phone-only','-free-exposure','-politics','-scam','-job-post','-hiring','-spam','-diy-only','-howto'],
    template: 'Make every click count—pro photos, floor plans, and aerials that sell the story. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_017',
    label: 'Vacation Rentals',
    category: 'real-estate',
    keywords: ['vacation rental','short let','airbnb','holiday home','management','cleaning','turnover','calendar','pricing','-long-term-only','-roomshare','-politics','-scam','-job-post','-hiring','-spam','-party-only','-complaints-thread'],
    template: 'Host without the hassle—setup, pricing, and full management for your short-term rental. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_018',
    label: 'Senior Housing',
    category: 'real-estate',
    keywords: ['senior','retirement','55+','accessible','single level','community','care nearby','quiet','amenities','-student-only','-roomshare','-politics','-scam','-job-post','-hiring','-spam','-price-argue','-rent-only'],
    template: 'Right-size with comfort—senior-friendly homes and communities with thoughtful amenities. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_019',
    label: 'Real Estate Investing',
    category: 'real-estate',
    keywords: ['investing','investor','portfolio','roi','cap rate','cash flow','value add','flip','refi','-get-rich-quick','-scam','-politics','-job-post','-hiring','-spam','-betting','-crypto-only','-argument'],
    template: 'Buy smart, hold smarter—deal sourcing and analysis to grow a resilient portfolio. {url}',
    isPrebuilt: true
  },
  {
    id: 'real_020',
    label: 'Home Appraisal',
    category: 'real-estate',
    keywords: ['appraisal','valuation','value','market','comparables','report','refinance','sale','neutral','-estate-agent-only','-politics','-scam','-job-post','-hiring','-spam','-opinion-only','-argument','-rent-only'],
    template: 'Independent valuations you can trust—clear reports for sale, refinance, or estate needs. {url}',
    isPrebuilt: true
  }
],
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