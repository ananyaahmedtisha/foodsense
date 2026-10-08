// Seeds calorie_foods from the Bangla CSV — run: node supabase/seed_calories.js
// Requires migration_v6. Safe to re-run (upserts by food_id).
const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = [];
  let row = [], val = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; }
      else val += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(val); val = ''; }
    else if (c === '\n') { row.push(val); lines.push(row); row = []; val = ''; }
    else if (c !== '\r') val += c;
  }
  if (val !== '' || row.length) { row.push(val); lines.push(row); }
  return lines.filter((r) => r.length > 1 || r[0].trim() !== '');
}

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, '..', '.env.local');
  fs.readFileSync(p, 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const lines = parseCSV(fs.readFileSync('C:\\Users\\User\\Downloads\\bangladeshi_food_calorie_database.csv', 'utf8'));
  const head = lines[0];
  const seen = new Set();
  const rows = [];
  for (const r of lines.slice(1)) {
    const o = {};
    head.forEach((h, i) => { o[h.trim()] = (r[i] || '').trim(); });
    const key = o.food_name_en.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      food_id: o.food_id,
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

  const { error } = await sb.from('calorie_foods').upsert(rows, { onConflict: 'food_id' });
  if (error) { console.error('FAIL — run migration_v6 first: ' + error.message); process.exit(1); }
  console.log(`OK upserted ${rows.length} foods`);
}

main().catch((e) => { console.error(e); process.exit(1); });
