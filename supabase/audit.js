// Full Supabase audit — run: node supabase/audit.js (read-only, no data changed)
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
  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const ok = (name, cond, extra = '') => console.log((cond ? 'OK   ' : 'FAIL ') + name + (extra ? ' — ' + extra : ''));

  // 1) Tables exist + counts (service role)
  for (const t of ['posts', 'media_gallery', 'team_members', 'surveys', 'survey_questions', 'survey_responses', 'categories', 'game_cards', 'site_settings', 'contact_messages', 'calorie_foods', 'food_requests']) {
    const { count, error } = await svc.from(t).select('*', { count: 'exact', head: true });
    ok('table ' + t, !error, error ? error.message : 'rows=' + count);
  }

  // 2) New columns from migrations
  const { data: q1 } = await svc.from('survey_questions').select('correct_answer').limit(1);
  ok('migration v3 (correct_answer)', q1 !== null);
  const { data: m1, error: m1e } = await svc.from('media_gallery').select('category').limit(1);
  ok('migration v2 (media.category)', !m1e, m1e?.message);
  const { data: t1, error: t1e } = await svc.from('team_members').select('linkedin,github,facebook,instagram').limit(1);
  ok('migration v5 (socials)', !t1e, t1e?.message);

  // 3) RPC counter (migration v4)
  const { data: rpc, error: rpcE } = await anon.rpc('response_count');
  ok('migration v4 (response_count rpc)', !rpcE, rpcE ? rpcE.message : 'count=' + rpc);

  // 4) Public reads as the website does them
  const checks = [
    ['posts published', () => anon.from('posts').select('id').eq('published', true).limit(1)],
    ['media', () => anon.from('media_gallery').select('id').limit(1)],
    ['team', () => anon.from('team_members').select('id').limit(1)],
    ['categories', () => anon.from('categories').select('id').limit(1)],
    ['game_cards active', () => anon.from('game_cards').select('id').eq('is_active', true).limit(1)],
    ['surveys active', () => anon.from('surveys').select('id').eq('is_active', true).limit(1)],
    ['questions', () => anon.from('survey_questions').select('id').limit(1)],
    ['settings', () => anon.from('site_settings').select('key').limit(1)],
    ['calorie_foods', () => anon.from('calorie_foods').select('id').limit(1)],
  ];
  for (const [name, fn] of checks) {
    const { data, error } = await fn();
    ok('anon read ' + name, !error, error ? error.message : `rows=${data?.length ?? 0}`);
  }

  // 5) Storage buckets
  const { data: buckets, error: bE } = await svc.storage.listBuckets();
  ok('buckets', !bE, bE ? bE.message : (buckets || []).map((b) => `${b.name}${b.public ? '(public)' : '(PRIVATE!)'}`).join(', '));

  // NOTE: anon INSERTs (survey submit, contact, food request) are not tested here
  // to avoid writing junk rows — each was verified individually during build.
}

main().catch((e) => { console.error(e); process.exit(1); });
