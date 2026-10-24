'use client';
import { useState } from 'react';
import { normalizeType, optionsOf, scaleConfig, scaleValues, typeMeta, isAnswered } from '@/lib/surveyTypes';

export default function SurveyTaker({ surveyId, questions }) {
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);
  const [msg, setMsg] = useState('');

  const required = (q) => q.is_required !== false;
  const set = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;

  async function submit(e) {
    e.preventDefault();
    const gaps = questions.filter((q) => required(q) && !isAnswered(q, answers[q.id])).map((q) => q.id);
    setMissing(gaps);
    if (gaps.length) {
      setMsg(`Please answer ${gaps.length === 1 ? 'the highlighted question' : 'the ' + gaps.length + ' highlighted questions'} before submitting.`);
      document.getElementById('q-' + gaps[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8 text-center mt-6 anim-pop">
        <p className="text-4xl">✅</p>
        <p className="font-display font-bold text-xl mt-2">Thank you!</p>
        <p className="text-sm text-stone-500">Your response counts toward our impact goal.</p>
      </div>
    );
  }

  if (!questions?.length) {
    return <p className="text-sm text-stone-500 mt-6">This survey has no questions yet.</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white rounded-2xl shadow-soft p-6 mt-5 flex flex-col gap-5">
      <div className="flex items-center gap-3 -mb-1">
        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-fresh transition-all duration-300"
            style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-stone-500">{answeredCount}/{questions.length}</span>
      </div>

      {questions.map((q, i) => {
        const gap = missing.includes(q.id);
        const type = normalizeType(q.question_type);
        const meta = typeMeta(q.question_type);
        return (
          <div key={q.id} id={'q-' + q.id} className={gap ? 'rounded-xl bg-red-50 dark:bg-red-950/30 p-3 -m-3' : ''}>
            <p className="font-semibold">
              {i + 1}. {q.question_text}{' '}
              {required(q) ? (
                <span className="text-red-500 text-xs align-top">*</span>
              ) : (
                <span className="text-stone-400 text-xs font-normal align-top">(optional)</span>
              )}
            </p>
            {q.description && <p className="text-xs text-stone-500 mt-0.5">{q.description}</p>}

            {type === 'multiple_choice' && (
              <div className="flex flex-col gap-2 mt-2">
                {optionsOf(q).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-cream">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => set(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {type === 'checkbox' && (
              <div className="flex flex-col gap-2 mt-2">
                {optionsOf(q).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-cream">
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={(e) =>
                        setAnswers((a) => {
                          const cur = new Set(a[q.id] || []);
                          if (e.target.checked) cur.add(opt);
                          else cur.delete(opt);
                          return { ...a, [q.id]: [...cur] };
                        })
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {type === 'dropdown' && (
              <select
                className="w-full mt-2 border rounded-xl p-2.5 text-sm"
                value={answers[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
              >
                <option value="">Choose…</option>
                {optionsOf(q).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {type === 'linear_scale' && (
              <div className="mt-2">
                <div className="flex gap-1.5 flex-wrap">
                  {scaleValues(q).map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => set(q.id, n)}
                      className={`w-10 h-10 rounded-full border text-sm font-bold transition ${
                        Number(answers[q.id]) === n ? 'bg-fresh text-white border-fresh' : 'hover:bg-cream'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 mt-1 max-w-md">
                  <span>{scaleConfig(q).minLabel}</span>
                  <span>{scaleConfig(q).maxLabel}</span>
                </div>
              </div>
            )}

            {type === 'rating' && (
              <div className="flex gap-1 mt-2">
                {scaleValues(q).map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => set(q.id, n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    className={`text-2xl transition hover:scale-110 ${
                      Number(answers[q.id]) >= n ? 'text-amber-400' : 'text-stone-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                {answers[q.id] ? <span className="text-xs text-stone-500 self-center ml-2">{answers[q.id]} / {scaleConfig(q).max}</span> : null}
              </div>
            )}

            {type === 'paragraph' && (
              <textarea
                className="w-full mt-2 border rounded-xl p-3 text-sm"
                rows={4}
                placeholder="Type your answer…"
                value={answers[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}

            {type === 'short_answer' && (
              <input
                className="w-full mt-2 border rounded-xl p-2.5 text-sm"
                placeholder="Your answer"
                value={answers[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}

            {['date', 'time', 'number', 'email', 'phone', 'url'].includes(type) && (
              <input
                className="w-full mt-2 border rounded-xl p-2.5 text-sm"
                type={type === 'phone' ? 'tel' : type === 'url' ? 'url' : type}
                placeholder={meta.hint}
                value={answers[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}

            {gap && <p className="text-xs text-red-600 mt-1.5">This question is mandatory.</p>}
          </div>
        );
      })}

      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button disabled={saving} className="py-3 rounded-xl bg-fresh text-white font-bold disabled:opacity-70">
        {saving ? 'Submitting…' : 'Submit response'}
      </button>
      <p className="text-[11px] text-stone-400 text-center">Anonymous — we never collect names or emails unless a question asks for it.</p>
    </form>
  );
}
