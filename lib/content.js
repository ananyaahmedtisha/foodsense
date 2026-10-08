import { createServerSupabase } from './supabaseServer';
import { categories as fallbackCats, flagCards, noodleUpgrades } from './demoData';

// Dynamic categories (scope: article | poster | video | all)
export async function getCategories(scope) {
  try {
    const sb = createServerSupabase();
    if (!sb) return fallbackCats;
    let q = sb.from('categories').select('*').order('display_order');
    const { data, error } = await q;
    if (error || !data) return fallbackCats;
    const filtered = scope ? data.filter((c) => c.scope === scope || c.scope === 'all') : data;
    return filtered.length ? filtered.map((c) => c.name) : fallbackCats;
  } catch {
    return fallbackCats;
  }
}

// Editable game cards. Falls back to built-in demo content.
export async function getGameCards(gameKey) {
  try {
    const sb = createServerSupabase();
    if (!sb) throw new Error('no db');
    const { data, error } = await sb
      .from('game_cards')
      .select('*')
      .eq('game_key', gameKey)
      .eq('is_active', true)
      .order('display_order');
    if (error || !data || !data.length) throw new Error('empty');
    return data;
  } catch {
    if (gameKey === 'redflag') {
      return flagCards.map((c) => ({
        id: c.id, game_key: 'redflag', prompt: c.habit,
        verdict: c.verdict, explanation: c.explain, meta: {}, _demo: true,
      }));
    }
    // fuel game fallback: flatten upgrades
    const out = [];
    for (const s of noodleUpgrades.staples) {
      for (const u of noodleUpgrades.upgrades[s.id] || []) {
        out.push({
          id: `${s.id}-${u.title}`, game_key: 'fuel',
          prompt: s.name, verdict: null,
          explanation: `${u.title}: ${u.detail}`,
          meta: { staple: s.id, title: u.title }, _demo: true,
        });
      }
    }
    return out;
  }
}

// Daily rotation so Red Flag feels fresh without admin work.
export function rotateDaily(cards) {
  if (!cards || cards.length < 2) return cards;
  const now = new Date();
  const day = Math.floor(now.getTime() / 86400000);
  const shift = day % cards.length;
  return [...cards.slice(shift), ...cards.slice(0, shift)];
}

export async function getContactInfo() {
  const fallback = {
    email: 'hello@foodsense.example', phone: '',
    address: 'Merul Badda, Dhaka', hours: 'Sat-Thu, 10am-6pm',
    facebook: '', instagram: '',
    about: 'Questions, workshop invites, or poster requests — we reply within 2 days.',
  };
  try {
    const sb = createServerSupabase();
    if (!sb) return fallback;
    const { data } = await sb.from('site_settings').select('value').eq('key', 'contact').single();
    return { ...fallback, ...(data?.value || {}) };
  } catch {
    return fallback;
  }
}

export async function getHomepage() {
  const fallback = {
    title_a: 'Food science,',
    title_b: 'minus the jargon.',
    description: 'FoodSense turns microbiology into 2-minute habits for hostel life: storage, labels, and cheap nutritious meals.',
    goal: 400,
    period: 'Aug–Nov 2026',
  };
  try {
    const sb = createServerSupabase();
    if (!sb) return fallback;
    const { data } = await sb.from('site_settings').select('value').eq('key', 'homepage').single();
    return { ...fallback, ...(data?.value || {}) };
  } catch {
    return fallback;
  }
}

export async function getAbout() {
  const fallback = {
    intro: 'FoodSense is a Millennium Fellowship-style social impact project: translating academic microbiology into everyday advice for students living away from home.',
    mission: 'Reduce risky food-handling habits and improve everyday nutrition awareness — without jargon, without login walls. Aligned to SDG 3 (Health), SDG 4 (Education), SDG 12 (Responsible Consumption).',
    team_title: 'Contributors',
  };
  try {
    const sb = createServerSupabase();
    if (!sb) return fallback;
    const { data } = await sb.from('site_settings').select('value').eq('key', 'about').single();
    return { ...fallback, ...(data?.value || {}) };
  } catch {
    return fallback;
  }
}
