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
  const [goal, setGoal] = useState(400);
  const [viewSurvey, setViewSurvey] = useState('');

  async function load() {
    const [j, h] = await Promise.all([
      fetch('/api/admin/analytics').then((r) => r.json()),
      fetch('/api/admin/settings?key=homepage').then((r) => r.json()).catch(() => ({})),
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
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Lives reached</p>
          <p className="font-display text-4xl font-extrabold">{a.lives_reached}<span className="text-sm font-medium text-stone-400"> / {goal}</span></p>
          <p className="text-xs text-stone-400 mt-1">survey responses + poster downloads • goal set in Admin → Homepage</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Survey responses</p>
          <p className="font-display text-4xl font-extrabold">{a.total_responses}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-sm text-stone-500">Poster downloads</p>
          <p className="font-display text-4xl font-extrabold">{a.downloads}</p>
        </div>
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
