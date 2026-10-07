'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#16A34A', '#F59E0B', '#0D9488', '#A78BFA', '#F43F5E', '#64748B'];

function Donut({ dist }) {
  const data = Object.entries(dist || {}).map(([name, value]) => ({ name, value }));
  if (!data.length || data.every((d) => !d.value)) return <p className="text-xs text-stone-400">No answers yet.</p>;
  return (
    <PieChart width={200} height={150}>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}

export default function AdminOverview() {
  const [a, setA] = useState(null);
  const [cfg, setCfg] = useState({ baseline_survey_id: '', endline_survey_id: '' });
  const [viewSurvey, setViewSurvey] = useState('');
  const [saved, setSaved] = useState('');

  async function load() {
    const j = await fetch('/api/admin/analytics').then((r) => r.json());
    if (j.demo) { setA({ demo: true }); return; }
    setA(j);
    setCfg({ ...j.impact });
    if (!viewSurvey && j.surveyList?.length) setViewSurvey(j.impact.baseline_survey_id || j.surveyList[0].id);
  }
  useEffect(() => { load(); }, []);

  async function saveCfg() {
    setSaved('Saving…');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'impact', value: { ...cfg } }),
    });
    const j = await res.json();
    setSaved(j.ok ? 'Saved — numbers updated everywhere.' : 'Error: ' + j.error);
    load();
  }

  async function downloadCSV() {
    const res = await fetch('/api/admin/export');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'foodsense-responses.csv';
    link.click();
  }

  if (!a) return <p className="text-sm text-stone-500">Loading analytics…</p>;
  if (a.demo) return <p className="text-sm text-stone-500">Demo mode — connect Supabase for live analytics.</p>;

  const viewed = a.surveys?.[viewSurvey];
  const goal = 400;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Lives reached</p>
          <p className="font-display text-4xl font-extrabold">{a.lives_reached}<span className="text-sm font-medium text-stone-400"> / {goal}</span></p>
          <p className="text-xs text-stone-400 mt-1">survey responses + poster downloads</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Survey responses</p>
          <p className="font-display text-4xl font-extrabold">{a.total_responses}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Poster downloads</p>
          <p className="font-display text-4xl font-extrabold">{a.downloads}</p>
          <button onClick={downloadCSV} className="mt-3 px-4 py-2 rounded-full bg-fresh text-white text-sm font-bold">⬇ Responses CSV</button>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Improvement goal</p>
          <p className="font-display text-4xl font-extrabold">30<span className="text-lg">%+</span></p>
          <p className="text-xs text-stone-400 mt-1">correct answers, baseline → endline</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">Impact setup — counted automatically after this</p>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <label className="text-sm">Baseline survey
            <select className="block w-full border rounded-xl px-2 py-2 mt-1" value={cfg.baseline_survey_id} onChange={(e) => setCfg({ ...cfg, baseline_survey_id: e.target.value })}>
              <option value="">— pick —</option>
              {a.surveyList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
          <label className="text-sm">Endline survey
            <select className="block w-full border rounded-xl px-2 py-2 mt-1" value={cfg.endline_survey_id} onChange={(e) => setCfg({ ...cfg, endline_survey_id: e.target.value })}>
              <option value="">— pick —</option>
              {a.surveyList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-stone-400 mt-2">Matching multiple-choice questions (same text, with a correct answer set) are compared automatically. Set correct answers in Surveys → Questions.</p>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={saveCfg} className="px-4 py-2 rounded-full bg-stone-900 text-white text-sm font-bold">Save setup</button>
          {saved && <span className="text-sm">{saved}</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">Baseline → Endline improvement (automatic)</p>
        {a.comparison?.length ? (
          <div className="flex flex-col gap-3 mt-3">
            {a.comparison.map((c, i) => (
              <div key={i} className="border rounded-xl p-4">
                <p className="text-sm font-semibold">{c.question}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span>Baseline: <strong>{c.baseline_pct}%</strong> <span className="text-stone-400">(n={c.baseline_n})</span></span>
                  <span>Endline: <strong>{c.endline_pct}%</strong> <span className="text-stone-400">(n={c.endline_n})</span></span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full ${c.improvement >= 30 ? 'bg-fresh-light text-fresh-dark' : 'bg-amberwarm-light'}`}>
                    {c.improvement >= 0 ? '+' : ''}{c.improvement}% {c.improvement >= 30 ? '✓ goal met' : '… toward 30%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500 mt-2">Pick baseline + endline above (with correct answers set) and data will compare here automatically.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-3">
          <p className="font-display font-bold">Survey results</p>
          <select className="border rounded-xl px-2 py-1.5 text-sm" value={viewSurvey} onChange={(e) => setViewSurvey(e.target.value)}>
            {a.surveyList.map((s) => <option key={s.id} value={s.id}>{s.title} ({a.surveys[s.id]?.total ?? 0})</option>)}
          </select>
        </div>
        {viewed && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {viewed.questions.map((q) => (
              <div key={q.id} className="border rounded-xl p-4">
                <p className="text-sm font-semibold">{q.text}</p>
                {q.pct !== null && (
                  <p className="text-sm mt-1">Correct: <strong className="text-fresh">{q.pct}%</strong> <span className="text-stone-400">(answer: {q.correct_answer})</span></p>
                )}
                {q.dist && <Donut dist={q.dist} />}
                {q.samples && <ul className="text-xs text-stone-500 mt-2 list-disc ml-4">{q.samples.map((s, i) => <li key={i}>{s}</li>)}</ul>}
                {q.total === 0 && <p className="text-xs text-stone-400 mt-1">No responses yet.</p>}
              </div>
            ))}
            {viewed.questions.length === 0 && <p className="text-sm text-stone-500">No questions in this survey.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
