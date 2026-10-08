// One-off converter: Bangla CSVs (Downloads) -> lib/calorieFoods.js
// Run: node supabase/convert_calories.js
const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = [];
  let cur = [''], inQ = false, field = '';
  // simple robust parser handling quoted commas
  const lines = [];
  let row = [];
  let val = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { val += '"'; i++; }
        else q = false;
      } else val += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(val); val = ''; }
    else if (c === '\n') { row.push(val); lines.push(row); row = []; val = ''; }
    else if (c === '\r') { /* skip */ }
    else val += c;
  }
  if (val !== '' || row.length) { row.push(val); lines.push(row); }
  return lines.filter((r) => r.length > 1 || r[0].trim() !== '');
}

const SRC = 'C:\\Users\\User\\Downloads\\bangladeshi_food_calorie_database.csv';
const OUT = path.join(__dirname, '..', 'lib', 'calorieFoods.js');

const lines = parseCSV(fs.readFileSync(SRC, 'utf8'));
const head = lines[0];
const foods = [];
const seen = new Set();
for (const r of lines.slice(1)) {
  const o = {};
  head.forEach((h, i) => { o[h.trim()] = (r[i] || '').trim(); });
  const key = o.food_name_en.trim().toLowerCase();
  if (seen.has(key)) continue; // one entry per food — portions handled by the calculator
  seen.add(key);
  foods.push({
    id: o.food_id,
    category: o.category,
    name: o.food_name_en,
    bn: o.search_terms.split('|').filter((s) => /[\u0980-\u09FF]/.test(s)).slice(0, 2),
    terms: o.search_terms.toLowerCase(),
    serving: o.serving_size,
    grams: Number(o.serving_grams) || 0,
    kcal: Number(o.calories_kcal) || 0,
    protein: Number(o.protein_g) || 0,
    carbs: Number(o.carbs_g) || 0,
    fat: Number(o.fat_g) || 0,
    fiber: Number(o.fiber_g) || 0,
    note: o.calorie_source_note,
    recipe: o.is_recipe_based === 'True',
  });
}

const cats = [...new Set(foods.map((f) => f.category))];
const js = `// Generated from bangladeshi_food_calorie_database.csv — ${foods.length} foods. Do not edit by hand.
export const calorieFoods = ${JSON.stringify(foods, null, 1)};
export const calorieCategories = ${JSON.stringify(cats)};
`;
fs.writeFileSync(OUT, js);
console.log(`wrote ${foods.length} foods, ${cats.length} categories: ${cats.join(', ')}`);
