'use client';
import { useEffect, useState } from 'react';

export default function SurveyBuilder() {
  const [surveys, setSurveys] = useState([]);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ question_text: '', question_type: 'multiple_choice', options: ['Option 1', 'Option 2'] }]);
  const [result, setResult] = useState('');
  const [openQs, setOpenQs] = useState({});
  const [correctEdits, setCorrectEdits] = useState({});

  async function load() {
    const j = await fetch('/api/admin/surveys').then((r) => r.json());
    setSurveys(j.items || []);
  }
  useEffect(() => { load(); }, []);

  function addQ() { setQuestions((q) => [...q, { question_text: '', question_type: 'multiple_choice', options: ['Option 1', 'Option 2'] }]); }

  async function activate() {
    if (!title.trim()) { setResult('Give the survey a title first.'); return; }
    const res = await fetch('/api/admin/surveys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, questions }) });
    const j = await res.json();
    if (j.ok && !j.demo) {
      setResult('Live! Share: ' + window.location.origin + '/surveys/' + j.id);
      setTitle(''); setQuestions([{ question_text: '', question_type: 'multiple_choice', options: ['Option 1', 'Option 2'] }]);
      load();
    } else if (j.demo) setResult('Demo mode — connect Supabase to activate.');
    else setResult('Error: ' + j.error);
  }

  async function toggle(s) {
    await fetch('/api/admin/surveys', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, is_active: !s.is_active }) });
    load();
  }

  async function del(id) {
    if (!confirm('Delete survey + its questions + responses?')) return;
    await fetch('/api/admin/surveys?id=' + id, { method: 'DELETE' });
    load();
  }

  async function downloadCSV(s) {
    const res = await fetch('/api/admin/export?survey_id=' + s.id);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '.csv';
    link.click();
  }

  async function viewQuestions(s) {
    if (openQs[s.id]) { setOpenQs((o) => ({ ...o, [s.id]: null })); return; }
    const j = await fetch('/api/admin/questions?survey_id=' + s.id).then((r) => r.json());
    setOpenQs((o) => ({ ...o, [s.id]: j.items || [] }));
  }

  async function saveCorrect(q) {
    const v = correctEdits[q.id] ?? q.correct_answer ?? '';
    await fetch('/api/admin/questions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: q.id, correct_answer: v }) });
    const j = await fetch('/api/admin/questions?survey_id=' + q.survey_id).then((r) => r.json());
    setOpenQs((o) => ({ ...o, [q.survey_id]: j.items || [] }));
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold text-lg">Visual Survey Builder 📋</p>
        <input className="border rounded-xl px-3 py-2.5 w-full mt-3" placeholder="Survey title e.g. Endline — Nov 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
        {questions.map((q, i) => (
          <div key={i} className="border rounded-xl p-4 mt-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold">Question {i + 1}</p>
              <button onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} className="text-xs text-red-600">Remove</button>
            </div>
            <input className="border rounded-lg px-2 py-1.5 w-full mt-2 text-sm" placeholder="Type the prompt…" value={q.question_text}
              onChange={(e) => setQuestions((qs) => qs.map((x, j) => j === i ? { ...x, question_text: e.target.value } : x))} />
            <select className="border rounded-lg px-2 py-1.5 mt-2 text-sm" value={q.question_type}
              onChange={(e) => setQuestions((qs) => qs.map((x, j) => j === i ? { ...x, question_type: e.target.value } : x))}>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkboxes</option>
              <option value="text">Text</option>
            </select>
            {q.question_type !== 'text' && (
              <textarea className="border rounded-lg px-2 py-1.5 w-full mt-2 text-sm" rows={2} value={q.options.join('\n')}
                onChange={(e) => setQuestions((qs) => qs.map((x, j) => j === i ? { ...x, options: e.target.value.split('\n') } : x))}
                placeholder="One option per line" />
            )}
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button onClick={addQ} className="px-4 py-2 rounded-full border text-sm font-bold">+ Add New Question</button>
          <button onClick={activate} className="px-4 py-2 rounded-full bg-fresh text-white text-sm font-bold">Activate Survey</button>
        </div>
        {result && <p className="text-sm mt-3 break-all">{result}</p>}
      </div>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">All surveys ({surveys.length})</p>
        <div className="flex flex-col gap-2 mt-3">
          {surveys.map((s) => (
            <div key={s.id} className="border rounded-xl p-3">
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-stone-500">{s.is_active ? 'Active' : 'Paused'} • {s.responses ?? 0} responses</p>
              <p className="text-xs text-stone-400 break-all">/surveys/{s.id}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => toggle(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border">{s.is_active ? 'Pause' : 'Activate'}</button>
                <button onClick={() => viewQuestions(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Questions</button>
                <button onClick={() => downloadCSV(s)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">⬇ CSV ({s.responses ?? 0})</button>
                <button onClick={() => del(s.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
              </div>
              {openQs[s.id] && (
                <div className="mt-2 border-t pt-2 flex flex-col gap-2">
                  {openQs[s.id].map((q) => (
                    <div key={q.id} className="text-xs">
                      <p className="font-semibold">{q.question_text} <span className="font-normal text-stone-400">({q.question_type})</span></p>
                      {q.question_type === 'multiple_choice' ? (
                        <div className="flex gap-1.5 mt-1">
                          <select className="border rounded-lg px-1.5 py-1 flex-1"
                            value={correctEdits[q.id] ?? q.correct_answer ?? ''}
                            onChange={(e) => setCorrectEdits((c) => ({ ...c, [q.id]: e.target.value }))}>
                            <option value="">— correct answer —</option>
                            {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <button onClick={() => saveCorrect(q)} className="px-2.5 py-1 rounded-full bg-fresh text-white font-bold">Set</button>
                        </div>
                      ) : (
                        <p className="text-stone-400">Options: {(q.options || []).join(' / ') || 'free text'}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {surveys.length === 0 && <p className="text-sm text-stone-500">No surveys yet.</p>}
        </div>
      </div>
    </div>
  );
}
