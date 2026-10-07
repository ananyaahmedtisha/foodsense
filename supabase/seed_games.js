// Seed editable game cards from built-in content — run: node supabase/seed_games.js
// Requires supabase/migration_v2.sql to be applied first. Skips if cards exist.
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, '..', '.env.local');
  fs.readFileSync(p, 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
  return env;
}

const redflag = [
  { prompt: 'Defrosting chicken on the kitchen counter for 4 hours', verdict: 'red', explanation: 'The surface sits in the danger zone (4-60C). Bacteria like Salmonella can double every 20 minutes. Thaw in the fridge, cold water (changed every 30 min), or microwave instead.' },
  { prompt: 'Washing raw chicken under the tap before cooking', verdict: 'red', explanation: 'Washing sprays Campylobacter/Salmonella up to 1 metre (aerosols). Cooking kills germs — rinsing just spreads them. Pat dry and cook directly.' },
  { prompt: 'Cooling leftover rice within 1 hour and refrigerating', verdict: 'green', explanation: 'Correct. Bacillus cereus spores survive cooking. Fast cooling + refrigeration under 4C stops toxin production.' },
  { prompt: 'Using the same cutting board for raw meat and salad without washing', verdict: 'red', explanation: 'Classic cross-contamination. Wash with hot soapy water or use separate boards (one raw, one ready-to-eat).' },
  { prompt: 'Reheating leftovers until steaming hot throughout', verdict: 'green', explanation: 'Correct. 70C+ throughout kills most vegetative bacteria. Stir, cover, and reheat only once.' },
  { prompt: 'Tasting expired canned food that looks and smells fine', verdict: 'red', explanation: 'Clostridium botulinum toxin is invisible and odorless. Respect expiry on low-acid cans; discard bulging/leaking cans.' },
];

const fuel = [
  { prompt: 'Instant Noodles', title: 'Gut helper', cost: '+৳15', emoji: '🥬', explanation: 'Gut helper: add 1 handful shredded cabbage + squeeze of lime. Fibre feeds good gut bacteria; sourness lets you use only half the seasoning (less sodium).' },
  { prompt: 'Instant Noodles', title: 'Protein boost', cost: '+৳20', emoji: '💪', explanation: 'Protein boost: crack in 1 egg in the last 2 minutes + 3-4 pre-soaked soybean chunks. Lifts protein from ~6g to ~16g.' },
  { prompt: 'Instant Noodles', title: 'Low-sodium hack', cost: '৳0', emoji: '🧂', explanation: 'Low-sodium hack: use half the seasoning packet + garlic, chili, and mustard oil from the hostel kitchen. Same taste, ~40% less sodium.' },
  { prompt: 'Leftover Rice', title: 'Gut helper', cost: '+৳10', emoji: '🥒', explanation: 'Gut helper: mix in raw onion + cucumber + a spoon of tok doi (yogurt). Adds probiotics and fibre for almost nothing.' },
  { prompt: 'Leftover Rice', title: 'Protein boost', cost: '+৳20', emoji: '🥚', explanation: 'Protein boost: top with 1 boiled egg or half cup masoor dal. Dal-rice is a complete amino acid combo.' },
  { prompt: 'White Bread / Pao', title: 'Protein boost', cost: '+৳20', emoji: '🥜', explanation: 'Protein boost: 1 tbsp peanut butter or 1 boiled egg on top. Stays full through morning classes.' },
];

async function main() {
  const env = loadEnv();
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: existing, error: e0 } = await sb.from('game_cards').select('id', { count: 'exact', head: false }).limit(1);
  if (e0) {
    console.error('game_cards table missing — run supabase/migration_v2.sql first: ' + e0.message);
    process.exit(1);
  }
  if (existing && existing.length) {
    console.log('game_cards already has content — skipping (manage in Admin → Games).');
    return;
  }

  const rows = [
    ...redflag.map((c, i) => ({ game_key: 'redflag', prompt: c.prompt, verdict: c.verdict, explanation: c.explanation, meta: {}, display_order: i })),
    ...fuel.map((c, i) => ({ game_key: 'fuel', prompt: c.prompt, verdict: null, explanation: `${c.title}: ${c.explanation}`, meta: { title: c.title, cost: c.cost, emoji: c.emoji }, display_order: i })),
  ];
  const { error } = await sb.from('game_cards').insert(rows);
  console.log(error ? 'FAIL ' + error.message : `OK seeded ${rows.length} game cards`);
}

main().catch((e) => { console.error(e); process.exit(1); });
