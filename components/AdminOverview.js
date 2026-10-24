'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SurveyChart from '@/components/SurveyChart';
import { scaleConfig, typeMeta } from '@/lib/surveyTypes';

function chartFor(q, i, surveyTitle) {
  if (!q.dist) return null;
  const isScale = q.type === 'linear_scale' || q.type === 'rating';
  const cfg = scaleConfig(q);
  const data = Object.entries(q.dist).map(([name, value]) => {
    let label = name;
    if (isScale) {
      const n = Number(name);
      if (n === cfg.min && cfg.minLabel) label = `${name} — ${cfg.minLabel}`;
      else if (n === cfg.max && cfg.maxLabel) label = `${name} — ${cfg.maxLabel}`;
    }
    return { name: label, value };
  });
  return {
    kind: isScale || q.type === 'checkbox' ? 'bar' : 'donut',
    title: q.text,
    note: `${q.total} answered • ${typeMeta(q.type).label}`,
    total: q.total,
    data,
    filename: `${surveyTitle || 'survey'}-q${i + 1}`,
  };
}

export default function AdminOverview() {
  const [a, setA] = useState(null);
  const [goal, setGoal] = useState(400);
  const [viewSurvey, setViewSurvey] = useState('');

  async function load() {
    const [j, h] = await Promise.all([
      fetch('/api/admin/analytics', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/settings?key=homepage', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
    ]);
    if (j.demo) { setA({ demo: true }); return; }
    setA(j);
    if (h.value?.goal) setGoal(Number(h.value.goal));
    if (!viewSurvey && j.surveyList?.length) setViewSurvey(j.surveyList[0].id);
  }
  useEffect(() => { load(); }, []);

  if (!a) return <p className="text-sm text-stone-500">Loading analytics…</p>;
  if (a.demo) return <p className="text-sm text-stone-500">Demo mode — connect Supabase for live analytics.</p>;

  const viewed = a.surveys?.[viewSurvey];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Engagements</p>
          <p className="font-display text-4xl font-extrabold">{a.lives_reached}<span className="text-sm font-medium text-stone-400"> / {goal}</span></p>
          <p className="text-xs text-stone-400 mt-1">responses + downloads + views • goal in Admin → Homepage</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Survey responses</p>
          <p className="font-display text-4xl font-extrabold">{a.total_responses}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Poster downloads</p>
          <p className="font-display text-4xl font-extrabold">{a.downloads}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Video views</p>
          <p className="font-display text-4xl font-extrabold">{a.views ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-display font-bold">Survey results</p>
          <select className="border rounded-xl px-2 py-1.5 text-sm" value={viewSurvey} onChange={(e) => setViewSurvey(e.target.value)}>
            {a.surveyList.map((s) => <option key={s.id} value={s.id}>{s.title} ({a.surveys[s.id]?.total ?? 0})</option>)}
          </select>
          <Link href={`/admin/surveys?tab=analysis${viewSurvey ? `&survey=${viewSurvey}` : ''}`} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">
            Open full analysis →
          </Link>
        </div>

        {viewed && viewed.total === 0 && <p className="text-sm text-stone-500 mt-4">No responses yet.</p>}

        {viewed && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {viewed.questions.map((q, i) => {
              const chart = chartFor(q, i, viewed.title);
              return (
                <div key={q.id} className="border rounded-xl p-4">
                  <p className="text-sm font-semibold">{q.text}</p>
                  {q.pct !== null && (
                    <p className="text-sm mt-1">Correct: <strong className="text-fresh">{q.pct}%</strong> <span className="text-stone-400">(answer: {q.correct_answer})</span></p>
                  )}
                  {chart && <SurveyChart {...chart} className="mt-1" />}
                  {q.samples?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-stone-500 mb-1">All answers ({q.samples.length})</p>
                      <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                        {q.samples.map((s, j) => (
                          <p key={j} className="text-xs px-2.5 py-1.5 whitespace-pre-wrap break-words">{s}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {q.total === 0 && <p className="text-xs text-stone-400 mt-1">No responses yet.</p>}
                </div>
              );
            })}
            {viewed.questions.length === 0 && <p className="text-sm text-stone-500">No questions in this survey.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
