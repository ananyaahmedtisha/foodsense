'use client';
import { useState } from 'react';

export default function SurveyTaker({ surveyId, questions }) {
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);
  const [msg, setMsg] = useState('');

  const required = (q) => q.is_required !== false;

  function answered(q) {
    const v = answers[q.id];
    if (Array.isArray(v)) return v.length > 0;
    if (q.question_type === 'checkbox') return Array.isArray(v) && v.length > 0;
    return v !== undefined && String(v).trim() !== '';
  }

  async function submit(e) {
    e.preventDefault();
    const gaps = questions.filter((q) => required(q) && !answered(q)).map((q) => q.id);
    setMissing(gaps);
    if (gaps.length) {
      setMsg('Please answer the highlighted questions before submitting.');      document.getElementById('q-' + gaps[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey_id: surveyId, answers }),
      });
    } catch {}
    setSaving(false);
    setDone(true);
  }

  if (done) {
    return <div className="bg-white rounded-2xl shadow-soft p-8 text-center mt-6">✅ <p className="font-display font-bold text-xl mt-2">Thank you!</p><p className="text-sm text-stone-500">Your response counts toward our impact goal.</p></div>;
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white rounded-2xl shadow-soft p-6 mt-5 flex flex-col gap-5">
      {questions.map((q, i) => {
        const gap = missing.includes(q.id);
        return (
          <div key={q.id} id={'q-' + q.id} className={gap ? 'rounded-xl bg-red-50 dark:bg-red-950/30 p-3 -m-3' : ''}>
            <p className="font-semibold">
              {i + 1}. {q.question_text}{' '}
              {required(q)
                ? <span className="text-red-500 text-xs align-top">*</span>
                : <span className="text-stone-400 text-xs font-normal align-top">(optional)</span>}
            </p>
            {q.question_type === 'multiple_choice' && (
              <div className="flex flex-col gap-2 mt-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-cream">
                    <input type="radio" name={q.id} required={required(q)} onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} /> {opt}
                  </label>
                ))}
              </div>
            )}
            {q.question_type === 'checkbox' && (
              <div className="flex flex-col gap-2 mt-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-cream">
                    <input type="checkbox" onChange={(e) => setAnswers((a) => {
                      const cur = new Set(a[q.id] || []);
                      e.target.checked ? cur.add(opt) : cur.delete(opt);
                      return { ...a, [q.id]: [...cur] };
                    })} /> {opt}
                  </label>
                ))}
              </div>
            )}
            {q.question_type === 'text' && (
              <textarea className="w-full mt-2 border rounded-xl p-3 text-sm" rows={3} placeholder="Type your answer…"
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
            )}
            {gap && <p className="text-xs text-red-600 mt-1.5">This question is mandatory.</p>}
          </div>
        );
      })}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button disabled={saving} className="py-3 rounded-xl bg-fresh text-white font-bold">{saving ? 'Submitting…' : 'Submit response'}</button>
    </form>
  );
}
