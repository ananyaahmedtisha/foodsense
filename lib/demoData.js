// Fallback demo content so the site runs instantly without Supabase.
// Once Supabase env vars are set, server components fetch live data instead.

export const demoPosts = [
  {
    id: '1', title: 'Hostel Rice Storage: The 2-Hour Rule That Prevents Bacillus cereus',
    slug: 'hostel-rice-storage-2-hour-rule',
    category: 'Hostel Storage', reading_minutes: 5,
    excerpt: 'Cooked rice left on the counter breeds spores fast. Cool, cover, and refrigerate within 2 hours.',
    cover_image_url: '', published: true,
    content: 'Cooked rice is a classic risk for Bacillus cereus... (demo excerpt). Cool rice within 1 hour, store covered, reheat once steaming hot.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2', title: 'Label Reading in 30 Seconds: Sugar, Sodium, and Serving Tricks',
    slug: 'label-reading-30-seconds',
    category: 'Label Reading', reading_minutes: 4,
    excerpt: 'Serving size is the trap. Multiply sugar and sodium before you decide.',
    cover_image_url: '', published: true,
    content: 'Demo content: check serving size, %DV, and ingredient order.',
    created_at: new Date().toISOString(),
  },
  {
    id: '3', title: 'Microbe Safety: Why You Should Never Defrost Meat on the Counter',
    slug: 'never-defrost-meat-counter',
    category: 'Microbe Safety', reading_minutes: 6,
    excerpt: 'Room-temperature thawing puts the surface in the danger zone (4–60°C) for hours.',
    cover_image_url: '', published: true,
    content: 'Demo content: thaw in fridge, cold water, or microwave — never the counter.',
    created_at: new Date().toISOString(),
  },
];

export const demoGallery = [
  { id: 'g1', title: 'Clean Hands, Safe Food', media_type: 'poster', file_url: '', download_count: 42 },
  { id: 'g2', title: 'Danger Zone 4–60°C', media_type: 'poster', file_url: '', download_count: 35 },
  { id: 'g3', title: 'How Germs Double Every 20 Minutes', media_type: 'video', file_url: '', download_count: 18 },
  { id: 'g4', title: '5 Steps to Safe Leftovers', media_type: 'video', file_url: '', download_count: 21 },
];

export const demoTeam = [
  { id: 't1', name: 'Founder — FoodSense', role: 'Founder', bio: 'Microbiology student translating food science for campus life in Dhaka.', image_url: '', display_order: 1 },
  { id: 't2', name: 'Technical Lead', role: 'Technical Lead', bio: 'Builds the web platform and survey analytics.', image_url: '', display_order: 2 },
];

export const demoSurveys = [
  { id: 's1', title: 'Food Safety Baseline — Aug 2026', is_active: true, created_at: new Date().toISOString() },
  { id: 's2', title: 'Workshop Feedback — Merul Badda', is_active: true, created_at: new Date().toISOString() },
];

export const flagCards = [
  { id: 1, habit: 'Defrosting chicken on the kitchen counter for 4 hours', verdict: 'red', explain: 'The surface sits in the danger zone (4–60°C). Bacteria like Salmonella can double every 20 minutes. Thaw in the fridge, cold water (changed every 30 min), or microwave instead.' },
  { id: 2, habit: 'Washing raw chicken under the tap before cooking', verdict: 'red', explain: 'Washing sprays Campylobacter/Salmonella up to 1 metre (aerosols). Cooking kills germs — rinsing just spreads them. Pat dry and cook directly.' },
  { id: 3, habit: 'Cooling leftover rice within 1 hour and refrigerating', verdict: 'green', explain: 'Correct. Bacillus cereus spores survive cooking. Fast cooling + refrigeration under 4°C stops toxin production.' },
  { id: 4, habit: 'Using the same cutting board for raw meat and salad without washing', verdict: 'red', explain: 'Classic cross-contamination. Wash with hot soapy water or use separate boards (one raw, one ready-to-eat).' },
  { id: 5, habit: 'Reheating leftovers until steaming hot throughout', verdict: 'green', explain: 'Correct. 70°C+ throughout kills most vegetative bacteria. Stir, cover, and reheat only once.' },
  { id: 6, habit: 'Tasting expired canned food that looks and smells fine', verdict: 'red', explain: 'Clostridium botulinum toxin is invisible and odorless. Respect expiry on low-acid cans; discard bulging/leaking cans.' },
];

export const noodleUpgrades = {
  staples: [
    { id: 'noodles', name: 'Instant Noodles (৳25–35)', base: 'High sodium, low protein/fibre.' },
    { id: 'rice', name: 'Leftover Rice', base: 'Plain carbs, needs protein + greens.' },
    { id: 'bread', name: 'White Bread / Pao', base: 'Fast carbs, low satiety.' },
  ],
  upgrades: {
    noodles: [
      { title: 'Gut Health +৳15', detail: 'Add 1 handful shredded cabbage + squeeze of lime. Fibre feeds good gut bacteria; sourness lets you use only half the seasoning (less sodium).' },
      { title: 'Protein +৳20', detail: 'Crack in 1 egg in the last 2 minutes + 3–4 pieces of soybean chunks (pre-soaked). Lifts protein from ~6g to ~16g.' },
      { title: 'Low Sodium Hack', detail: 'Use ½ seasoning packet + garlic, chili, and mustard oil from the hostel kitchen. Same taste, ~40% less sodium.' },
    ],
    rice: [
      { title: 'Gut Health +৳10', detail: 'Mix in raw onion + cucumber + a spoon of tok doi (yogurt). Adds probiotics and fibre for almost nothing.' },
      { title: 'Protein +৳20', detail: 'Top with 1 boiled egg or ½ cup masoor dal. Dal-rice is a complete amino acid combo.' },
      { title: 'Micronutrient Boost', detail: 'Add a handful of shak (leafy greens) fried with garlic. Iron + folate for busy study days.' },
    ],
    bread: [
      { title: 'Gut Health +৳10', detail: 'Add sliced banana or cucumber instead of jam. Fibre + potassium, half the sugar.' },
      { title: 'Protein +৳20', detail: 'Peanut butter (1 tbsp) or 1 boiled egg on top. Stays full through morning classes.' },
      { title: 'Smart Swap', detail: 'Choose brown atta bread when possible; same price in most Badda shops, 2x fibre.' },
    ],
  },
};

export const categories = ['Hostel Storage', 'Label Reading', 'Microbe Safety', 'Nutrition'];
