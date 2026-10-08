// Seeds 100 Red/Green cards + 24 Budget Bite cards.
// Run: node supabase/seed_games100.js
// Replaces the 12 starter cards (all were demo seeds, nothing admin-made is touched otherwise).
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

// [prompt, verdict red|green, explanation]
const REDFLAG = [
  ['Cooling leftover rice within 1 hour and refrigerating', 'green', 'Correct. Bacillus cereus spores survive cooking. Fast cooling plus a fridge under 4C stops toxin production.'],
  ['Leaving cooked rice on the counter overnight, then frying it', 'red', 'Frying does not destroy B. cereus toxin formed overnight. Overnight counter rice belongs in the bin.'],
  ['Storing leftover dal in a covered bowl in the fridge', 'green', 'Covered and cold keeps dal safe for 2-3 days. Reheat only what you will eat.'],
  ['Reheating the same curry three times over two days', 'red', 'Every warm-cool cycle grows bacteria. Reheat once until steaming, then finish or discard.'],
  ['Keeping the fridge at or below 4C', 'green', 'Cold slows germ growth sharply. Above 4C, leftovers spoil fast.'],
  ['Putting a big deep pot of hot curry straight into the fridge', 'red', 'A big hot mass warms the whole fridge and cools slowly. Divide into shallow containers first.'],
  ['Eating reheated rice only when steaming hot throughout', 'green', '70C plus throughout kills most bacteria. Stir, cover, and eat right away.'],
  ['Smelling leftovers to decide if they are safe', 'red', 'Spoilage germs smell, but dangerous toxins do not. Judge by time and temperature, not smell.'],
  ['Finishing opened canned beans within 2 days from the fridge', 'green', 'Move to a clean covered container after opening and use quickly.'],
  ['Storing raw meat on the shelf above cooked food', 'red', 'Raw juices drip down and contaminate. Raw meat always goes on the bottom shelf.'],
  ['Defrosting chicken on the kitchen counter for 4 hours', 'red', 'The surface sits in the danger zone (4-60C) for hours. Thaw in the fridge, cold water, or microwave.'],
  ['Cooking chicken until juices run clear with no pink', 'green', 'Clear juices mean the core passed 75C, killing Salmonella and Campylobacter.'],
  ['Washing raw chicken under the tap before cooking', 'red', 'Washing sprays germs up to 1 metre. Cooking kills them; rinsing just spreads them.'],
  ['Marinating meat in the fridge instead of the counter', 'green', 'Counter marinating breeds bacteria. Fridge marinating keeps flavour safe.'],
  ['Refreezing fully thawed raw fish', 'red', 'Bacteria multiplied during thawing. Cook it first — cooked food may be refrozen.'],
  ['Buying fish with clear eyes and a fresh sea smell', 'green', 'Fresh signs. Sour or ammonia smell and sunken eyes mean old fish.'],
  ['Cutting salad on the board just used for raw meat', 'red', 'Classic cross-contamination. Wash the board or keep separate boards.'],
  ['Serving cooked kebabs on the plate that held them raw', 'red', 'Cooked meat picks up raw juices. Always switch to a clean plate.'],
  ['Resting cooked meat a few minutes before cutting', 'green', 'Juices settle back in. Safer handling and tastier meat.'],
  ['Eating pink burgers made from minced meat', 'red', 'Grinding spreads surface germs through the whole patty. Mince must be cooked through.'],
  ['Thawing fish in cold water inside a sealed bag', 'green', 'Fast and safe. Change the water every 30 minutes and cook at once.'],
  ['Cooking frozen fish directly without thawing', 'green', 'Perfectly fine if cooked through — it just takes about 50 percent longer.'],
  ['Leaving grilled meat out at a picnic for 5 hours', 'red', 'Heat speeds spoilage. Outdoors the 2-hour rule shrinks toward 1 hour.'],
  ['Storing eggs in the fridge door rack', 'red', 'The door is the warmest, shakiest spot. Keep eggs on a middle shelf in their carton.'],
  ['Boiling eggs 8-10 minutes until the yolk is firm', 'green', 'Firm yolk means Salmonella is dead. Runny yolk from unknown eggs is a gamble.'],
  ['Eating cracked eggs bought from the shop', 'red', 'Cracks let germs straight in. Leave cracked eggs at the shop.'],
  ['Keeping boiled eggs refrigerated up to a week', 'green', 'Shell on, covered, and cold keeps them safe for about 7 days.'],
  ['Tasting raw cake batter containing egg', 'red', 'Raw egg can carry Salmonella. Wait for the baked cake.'],
  ['Frying an egg until white and yolk are both set', 'green', 'Set whites and yolk mean safe. Sunny-side-up from unknown eggs is riskier.'],
  ['Boiling loose unpackaged milk before drinking', 'green', 'Boiling kills TB and brucellosis germs that raw milk can carry.'],
  ['Drinking raw milk fresh from the farm', 'red', 'Fresh does not mean safe. Raw milk can carry tuberculosis and brucellosis — always boil.'],
  ['Keeping yogurt (doi) refrigerated', 'green', 'Cold keeps cultures safe. Room-temperature doi over-sours and spoils.'],
  ['Eating milk sweets left out for 2 days', 'red', 'Milk sweets spoil fast in heat. Refrigerate and eat within 24 hours.'],
  ['Checking expiry dates on milk packs', 'green', 'Dates matter most for dairy. Respect them strictly.'],
  ['Freezing extra milk for later', 'green', 'Milk freezes fine. Thaw in the fridge, shake, and boil after thawing.'],
  ['Washing fruit under running clean water', 'green', 'Removes dirt, pesticide residue, and surface germs.'],
  ['Soaking leafy shak in salt water, then rinsing', 'green', 'Salt water loosens worms and soil. Always rinse with clean water after.'],
  ['Eating cut fruit from a dusty roadside cart', 'red', 'Cut surfaces plus flies plus heat equal diarrhoea risk. Buy whole fruit and cut at home.'],
  ['Peeling bananas and oranges before eating', 'green', 'The peel protects the inside. Your hands only touch the skin.'],
  ['Washing grapes and berries just before eating', 'green', 'Washing early traps moisture and grows mold. Wash at eating time.'],
  ['Using the same knife for raw meat and fruit', 'red', 'Cross-contamination again. Wash the knife between jobs.'],
  ['Eating cut melon left out all day', 'red', 'Cut melon grows Salmonella fast at room temperature. Refrigerate it.'],
  ['Scrubbing potatoes and carrots under water', 'green', 'Soil hides germs. Scrub firm vegetables before peeling.'],
  ['Drinking sugarcane juice from a visibly dirty press', 'red', 'Dirty rollers and unknown ice water spell risk. Check hygiene before buying.'],
  ['Storing vegetables unwashed in the fridge', 'green', 'Moisture rots them early. Wash right before cooking or eating.'],
  ['Washing hands 20 seconds with soap before cooking', 'green', 'The single most effective food safety habit there is.'],
  ['Rinsing hands with water only after the toilet', 'red', 'Water alone does not remove germs. Soap plus 20 seconds does.'],
  ['Drying hands on a clean towel or tissue', 'green', 'Wet hands spread germs. A damp shared cloth spreads even more.'],
  ['Using one sponge for dishes, table, and floor', 'red', 'A sponge is a germ hotel. Keep a separate kitchen sponge and replace it often.'],
  ['Microwaving the kitchen sponge for 1 minute', 'green', 'Heat kills most sponge germs. Still replace the sponge monthly.'],
  ['Wiping counters with a hot soapy cloth daily', 'green', 'Removes the food films that germs feed on.'],
  ['Letting pets walk on the kitchen counter', 'red', 'Paws carry litterbox and street germs straight onto food surfaces.'],
  ['Covering cooked food instead of leaving bowls open', 'green', 'Flies carry germs from drains and bins. Covers block them.'],
  ['Taking kitchen trash out daily in hot weather', 'green', 'Rotting waste breeds flies and smell. Empty it often.'],
  ['Sneezing or coughing over open food', 'red', 'Droplets seed food with germs. Turn away, cover up, wash hands.'],
  ['Drinking boiled or filtered water', 'green', 'Boiling kills cholera and typhoid germs. The cheapest health insurance.'],
  ['Accepting ice in drinks made from unknown water', 'red', 'Freezing keeps germs alive, it does not kill them. Skip unless the ice is from safe water.'],
  ['Eating piping-hot freshly fried snacks', 'green', 'Fresh heat kills germs. Eat fast food fast — heat fades quickly.'],
  ['Eating lukewarm buffet food sitting for hours', 'red', 'Lukewarm is the danger zone. Choose stalls where food steams.'],
  ['Eating fuchka from a busy hygienic vendor, right away', 'green', 'High turnover and fresh frying lower the risk. Watch hand and plate hygiene.'],
  ['Drinking from a shared glass without washing it', 'red', 'Saliva swaps germs. Rinse the glass or use your own cup.'],
  ['Using bottled water with the seal intact', 'green', 'An unbroken seal means a safe source. Always check the seal.'],
  ['Refilling the same plastic bottle for weeks', 'red', 'Scratches breed germs. Wash daily and replace the bottle often.'],
  ['Washing raw salad with safe drinking water', 'green', 'Rinse water must itself be safe, or you add germs instead of removing them.'],
  ['Storing drinking water in a covered clean container', 'green', 'Cover plus a clean cup prevents recontamination all day.'],
  ['Checking expiry dates before buying', 'green', 'The simplest safety habit. Make it automatic.'],
  ['Buying heavily dented cans at a deep discount', 'red', 'Dents can break seals. Botulism risk hides in low-acid cans.'],
  ['Using bulging or leaking cans', 'red', 'Gas means bacterial growth. Never taste — discard the can.'],
  ['Treating use-by dates as a hard safety limit', 'green', 'Use-by means safety, best-before means quality. Respect use-by strictly.'],
  ['Smelling canned tuna to check if it is safe', 'red', 'Botulinum toxin has no smell. Judge cans by dates and condition, never smell.'],
  ['Moving opened can contents to a clean container', 'green', 'Opened metal plus air spoils fast. Refrigerate in glass or food-grade plastic.'],
  ['Buying expired baby food because it is cheaper', 'red', 'Babies are the most vulnerable. Never use expired infant food.'],
  ['Comparing sodium per 100g on labels', 'green', 'Per-100g numbers beat per-pack tricks every time.'],
  ['Bringing soup and stew to a rolling boil when reheating', 'green', 'A full boil means safe all the way through.'],
  ['Warming baby food to lukewarm only', 'red', 'Lukewarm does not kill germs. Heat it steaming, then cool to serving temperature.'],
  ['Stirring food while reheating', 'green', 'Evens out the heat and kills cold spots where germs survive.'],
  ['Using a food thermometer for thick meat pieces', 'green', 'The only sure way to confirm a 75C core. Colour alone lies.'],
  ['Eating a microwaved meal that still has cold spots', 'red', 'Cold spots mean surviving germs. Rest, stir, and heat again.'],
  ['Preheating the oven fully before baking chicken', 'green', 'Full heat from the start cooks meat evenly and safely.'],
  ['Serving cooked food within 2 hours', 'green', 'The 2-hour rule again — hot food cools straight into the danger zone.'],
  ['Picking frozen items last while shopping', 'green', 'Keeps the cold chain unbroken on the way home.'],
  ['Leaving grocery bags in a hot car for hours', 'red', 'Heat-thawed food grows germs fast. Hurry home and refrigerate.'],
  ['Storing potatoes and onions cool, dark, and apart', 'green', 'Light sprouts potatoes; onion moisture rots potatoes. Separate baskets.'],
  ['Keeping bananas with other fruit to ripen them', 'green', 'Bananas release ethylene that ripens neighbours. A useful trick.'],
  ['Storing bread in the fridge', 'red', 'Fridges stale bread faster. Keep sealed at room temperature, freeze for long storage.'],
  ['Freezing bread for later toast', 'green', 'The freezer pauses staling. Toast slices straight from frozen.'],
  ['Keeping spices dry and tightly sealed', 'green', 'Moisture cakes and molds spices. Dry spoon every time.'],
  ['Storing opened flour in a sealed jar', 'green', 'Keeps weevils and dampness out for months.'],
  ['Putting the whole hot rice-cooker pot in the fridge', 'red', 'It warms the fridge and cools slowly. Portion rice out first.'],
  ['Labelling leftovers with the date', 'green', 'Memory lies, dates do not. Eat the oldest first.'],
  ['Believing alcohol with street food makes it safe', 'red', 'Drinking alcohol does not disinfect food in your stomach. Heat and hygiene do.'],
  ['Believing very spicy food kills all germs', 'red', 'Chili does not sterilize anything. Only proper heat does.'],
  ['Believing freezing kills all bacteria', 'red', 'Freezing only pauses germs. They wake up on thawing.'],
  ['Believing tasty-looking food is always safe', 'red', 'Dangerous toxins are tasteless. Time-temperature rules decide, not taste.'],
  ['Believing natural or organic food cannot make you sick', 'red', 'Germs ignore labels. Organic food needs the same hygiene.'],
  ['Believing plastic cutting boards are always safer than wood', 'red', 'Both are safe washed and dried. Deep grooves need replacing on either.'],
  ['Drying washed greens before storing them', 'green', 'Less trapped moisture means less rot and longer crunch.'],
  ['Giving honey to babies under 1 year', 'red', 'Honey can carry infant botulism spores. No honey before age one.'],
  ['Keeping cooked leftovers a full week in the fridge', 'red', 'Most cooked food lasts 3-4 days refrigerated. When in doubt, throw it out.'],
  ['Feeding pets raw chicken scraps', 'red', 'Same Salmonella risk — and pets spread it around the house.'],
];

// [stapleId, stapleName, upgradeTitle, cost, emoji, detail]
const FUEL = [
  ['noodles', 'Instant Noodles', 'Gut helper', '+৳15', '🥬', 'Add 1 handful shredded cabbage plus a squeeze of lime. Fibre feeds good gut bacteria, and sourness lets you use only half the seasoning for less sodium.'],
  ['noodles', 'Instant Noodles', 'Protein boost', '+৳20', '💪', 'Crack in 1 egg in the last 2 minutes plus 3-4 pre-soaked soybean chunks. Lifts protein from about 6g to about 16g.'],
  ['noodles', 'Instant Noodles', 'Low-sodium hack', '৳0', '🧂', 'Use half the seasoning packet plus garlic, chili, and mustard oil from the hostel kitchen. Same taste, about 40 percent less sodium.'],
  ['noodles', 'Instant Noodles', 'Energy mix', '+৳10', '🥜', 'Toss in a spoon of roasted peanuts and a drizzle of mustard oil. Healthy fats keep you going till lunch.'],
  ['noodles', 'Instant Noodles', 'Veggie load', '+৳10', '🍆', 'Add chopped begun or lau in the last 3 minutes until soft. Cheap, filling, fibre-rich.'],
  ['noodles', 'Instant Noodles', 'Soup style', '৳0', '🍲', 'Add an extra cup of water with half the seasoning. More broth, half the salt per bite, same comfort.'],
  ['rice', 'Leftover Rice', 'Gut helper', '+৳10', '🥒', 'Mix in raw onion plus cucumber plus a spoon of tok doi. Adds probiotics and fibre for almost nothing.'],
  ['rice', 'Leftover Rice', 'Protein boost', '+৳20', '🥚', 'Top with 1 boiled egg or half a cup of masoor dal. Dal plus rice is a complete amino acid combo.'],
  ['rice', 'Leftover Rice', 'Micronutrient boost', '+৳10', '🥬', 'Stir pre-cooked shak with garlic into the rice. Iron plus folate for busy study days.'],
  ['rice', 'Leftover Rice', 'Lunchbox fry', '+৳15', '🍳', 'Toss day-old rice with leftover sobji and 1 teaspoon of oil. A new meal with zero waste.'],
  ['rice', 'Leftover Rice', 'Lemon rice', '+৳5', '🍋', 'Add a lime wedge, green chili, and a pinch of salt. Vitamin C helps your body absorb iron from dal.'],
  ['rice', 'Leftover Rice', 'Dal boost', '+৳15', '🥣', 'Pour half a cup of cooked masoor dal over rice. Complete protein for the price of a biscuit.'],
  ['bread', 'White Bread / Pao', 'Protein boost', '+৳20', '🥜', 'Spread 1 tablespoon of peanut butter or add 1 boiled egg on top. Stays full through morning classes.'],
  ['bread', 'White Bread / Pao', 'Banana toast', '+৳10', '🍌', 'Add sliced kola with a pinch of salt instead of jam. Potassium plus fibre, half the sugar.'],
  ['bread', 'White Bread / Pao', 'Egg toast', '+৳15', '🍞', 'Dip in beaten egg with chili and fry both sides. French-toast style protein.'],
  ['bread', 'White Bread / Pao', 'Cool sandwich', '৳0', '🥒', 'Add sliced cucumber with mustard oil and salt. Cool, crunchy, hydrating.'],
  ['chira', 'Chira / Flattened Rice', 'Doi-chira', '+৳20', '🥣', 'Soak chira in tok doi with banana and a pinch of salt. Probiotics plus energy, a classic breakfast.'],
  ['chira', 'Chira / Flattened Rice', 'Crunchy snack', '+৳10', '🥜', 'Dry-roast chira with peanuts and chili. Crunchy hostel snack with no oil needed.'],
  ['chira', 'Chira / Flattened Rice', 'Milk chira', '+৳25', '🥛', 'Warm milk plus chira plus banana. A full breakfast cheaper than the bakery.'],
  ['chira', 'Chira / Flattened Rice', 'Lemon chira', '৳0', '🍋', 'Soaked chira with lime, salt, and onion. Light, sour, refreshing.'],
  ['potato', 'Potato / Alu', 'Bhorta classic', '+৳5', '🥔', 'Mash boiled potato with onion, chili, and mustard oil. Complete comfort meal with rice.'],
  ['potato', 'Potato / Alu', 'Skin-on wedges', '+৳10', '🍟', 'Roast wedges with the skin in a little oil. Most of the fibre lives in the skin.'],
  ['potato', 'Potato / Alu', 'Egg-alu curry', '+৳20', '🍛', 'One egg plus two potatoes as curry. Feeds two people for the price of one singara.'],
  ['potato', 'Potato / Alu', 'Potato soup', '৳0', '🍲', 'Boil and mash with water, salt, and chili. Warm, filling, almost free.'],
];

async function main() {
  const env = loadEnv();
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Replace starter/demo cards with the full set.
  const { error: delErr } = await sb.from('game_cards').delete().in('game_key', ['redflag', 'fuel']);
  if (delErr) {
    console.error('Cannot reset game_cards — run migration_v2 first: ' + delErr.message);
    process.exit(1);
  }

  const rows = [
    ...REDFLAG.map(([prompt, verdict, explanation], i) => ({ game_key: 'redflag', prompt, verdict, explanation, meta: {}, display_order: i, is_active: true })),
    ...FUEL.map(([stapleId, staple, title, cost, emoji, explanation], i) => ({
      game_key: 'fuel', prompt: staple, verdict: null, explanation: `${title}: ${explanation}`,
      meta: { title, cost, emoji, stapleId }, display_order: i, is_active: true,
    })),
  ];
  const { error } = await sb.from('game_cards').insert(rows);
  if (error) { console.error('FAIL ' + error.message); process.exit(1); }
  console.log(`OK seeded ${REDFLAG.length} red/green + ${FUEL.length} budget cards`);
}

main().catch((e) => { console.error(e); process.exit(1); });
