// Seed starter content for FoodSense — run: node supabase/seed.js
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

async function main() {
  const env = loadEnv();
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const posts = [
    {
      title: 'Hostel Rice Storage: The 2-Hour Rule That Prevents Bacillus cereus',
      slug: 'hostel-rice-storage-2-hour-rule',
      category: 'Hostel Storage',
      excerpt: 'Cooked rice left on the counter breeds spores fast. Cool, cover, and refrigerate within 2 hours.',
      content: `Cooked rice looks harmless, but it is the #1 hostel risk for Bacillus cereus — spores survive boiling, then germinate at room temperature.\n\nTHE 2-HOUR RULE:\n1. Serve what you will eat. Within 1 hour, spread leftovers thin (tray/plate) to cool fast.\n2. Cover and refrigerate below 4C within 2 hours of cooking.\n3. Reheat ONCE until steaming hot throughout. Throw out rice kept out overnight — reheating will not destroy the toxin.\n\nHostel hack: no fridge? Cook only what you need, or share leftovers immediately instead of storing.`,
      reading_minutes: 5,
      published: true,
    },
    {
      title: 'Label Reading in 30 Seconds: Sugar, Sodium, and Serving Tricks',
      slug: 'label-reading-30-seconds',
      category: 'Label Reading',
      excerpt: 'Serving size is the trap. Multiply sugar and sodium before you decide.',
      content: `Packets lie by serving size. A "15g sugar" biscuit pack with 4 servings = 60g sugar — 15 spoons.\n\n30-SECOND SCAN:\n1. Serving size + servings per pack (multiply everything).\n2. Sugar: under 5g/100g is low, over 15g/100g is high.\n3. Sodium: under 120mg/100g is low, over 600mg/100g is high.\n4. Ingredients are listed by weight — if sugar/salt/palm oil is in the first 3, treat it as dessert, not food.\n\nBudget tip in Badda shops: compare per-100g, not per-pack price. The bigger pack is not always cheaper.`,
      reading_minutes: 4,
      published: true,
    },
    {
      title: 'Microbe Safety: Why You Should Never Defrost Meat on the Counter',
      slug: 'never-defrost-meat-counter',
      category: 'Microbe Safety',
      excerpt: 'Room-temperature thawing puts the surface in the danger zone (4-60C) for hours.',
      content: `Frozen meat thaws outside-in. On the counter, the surface sits at 25-35C for hours — the danger zone (4-60C) where Salmonella and Campylobacter double every 20 minutes — while the center is still icy.\n\nSAFE THAWING (pick one):\n1. Fridge (best): move to fridge the night before.\n2. Cold water: sealed bag in cold water, change water every 30 min, cook immediately.\n3. Microwave defrost: cook immediately after.\n\nNEVER: counter thawing, hot water thawing, or refreezing thawed raw meat. And never wash raw chicken — the spray spreads germs up to 1 metre. Cooking kills them; rinsing just relocates them.`,
      reading_minutes: 6,
      published: true,
    },
  ];

  for (const p of posts) {
    const { error } = await sb.from('posts').upsert(p, { onConflict: 'slug' });
    console.log('post ' + p.slug + ': ' + (error ? 'FAIL ' + error.message : 'OK'));
  }

  const media = [
    { title: 'Clean Hands, Safe Food', media_type: 'poster', file_url: '' },
    { title: 'Danger Zone 4-60C', media_type: 'poster', file_url: '' },
    { title: 'How Germs Double Every 20 Minutes', media_type: 'video', file_url: '' },
    { title: '5 Steps to Safe Leftovers', media_type: 'video', file_url: '' },
  ];
  for (const m of media) {
    const { error } = await sb.from('media_gallery').insert(m);
    console.log('media ' + m.title + ': ' + (error ? 'FAIL ' + error.message : 'OK'));
  }

  const team = [
    { name: 'Founder — FoodSense', role: 'Founder', bio: 'Microbiology student translating food science for campus life in Dhaka.', display_order: 1 },
    { name: 'Technical Lead', role: 'Technical Lead', bio: 'Builds the web platform and survey analytics.', display_order: 2 },
  ];
  for (const t of team) {
    const { error } = await sb.from('team_members').insert(t);
    console.log('team ' + t.name + ': ' + (error ? 'FAIL ' + error.message : 'OK'));
  }

  const { data: s1, error: e1 } = await sb.from('surveys').insert({ title: 'Food Safety Baseline — Aug 2026', is_active: true }).select().single();
  console.log('survey baseline: ' + (e1 ? 'FAIL ' + e1.message : 'OK ' + s1.id));
  if (s1) {
    const qs = [
      { survey_id: s1.id, question_text: 'How long is it safe to leave cooked rice at room temperature?', question_type: 'multiple_choice', options: ['30 minutes only', 'Up to 2 hours', '6-8 hours is fine', 'Overnight is fine'] },
      { survey_id: s1.id, question_text: 'Which practices do you currently follow? (tick all)', question_type: 'checkbox', options: ['Separate cutting boards', 'Reheat until steaming', 'Thaw meat in fridge', 'Check expiry dates'] },
      { survey_id: s1.id, question_text: 'What is your biggest food challenge in the hostel?', question_type: 'text', options: [] },
    ];
    const { error } = await sb.from('survey_questions').insert(qs);
    console.log('baseline questions: ' + (error ? 'FAIL ' + error.message : 'OK'));
  }

  const { data: s2, error: e2 } = await sb.from('surveys').insert({ title: 'Workshop Feedback — Merul Badda', is_active: true }).select().single();
  console.log('survey feedback: ' + (e2 ? 'FAIL ' + e2.message : 'OK ' + (s2 && s2.id)));
  if (s2) {
    const qs = [
      { survey_id: s2.id, question_text: 'What is the single most useful thing you learned today?', question_type: 'text', options: [] },
      { survey_id: s2.id, question_text: 'Will you change any food habit after this workshop?', question_type: 'multiple_choice', options: ['Yes — already started', 'Yes — plan to', 'Not sure', 'No'] },
    ];
    const { error } = await sb.from('survey_questions').insert(qs);
    console.log('feedback questions: ' + (error ? 'FAIL ' + error.message : 'OK'));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
