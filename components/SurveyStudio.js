'use client';
import { useEffect, useMemo, useState } from 'react';
import SurveyChart, { buildChartSvg, svgToPng, slugify } from './SurveyChart';
import {
  QUESTION_TYPES,
  normalizeType,
  needsOptions,
  optionsOf,
  typeMeta,
  scaleConfig,
  answerText,
  defaultSettings,
} from '@/lib/surveyTypes';

// Admin data must always come from the server, never the browser cache.
const api = (url, opts = {}) => fetch(url, { cache: 'no-store', ...opts });

const blankQuestion = () => ({
  question_text: '',
  description: '',
  question_type: 'multiple_choice',
  options: ['Option 1', 'Option 2'],
  is_required: true,
  settings: {},
});

const typeLabel = (t) => typeMeta(t).label;

/* ------------------------------------------------------------------ */
/* Question fields — shared by the create form and the live editor    */
/* ------------------------------------------------------------------ */
function QuestionFields({ q, index, onChange, onRemove, onUp, onDown, saving, footer }) {
  const type = normalizeType(q.question_type);
  const settings = q.settings || {};

  function setType(next) {
    onChange({
      question_type: next,
      settings: defaultSettings(next),
      options: needsOptions(next) ? (q.options?.length ? q.options : ['Option 1', 'Option 2']) : [],
    });
  }

  function setOption(i, value) {
    const opts = [...(q.options || [])];
    opts[i] = value;
    onChange({ options: opts });
  }

  function removeOption(i) {
    onChange({ options: (q.options || []).filter((_, j) => j !== i) });
  }

  function addOption() {
    onChange({ options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] });
  }

  return (
    <div className="border rounded-xl p-4 mt-3 bg-cream/40">
      <div className="flex justify-between items-center gap-2">
        <p className="text-sm font-bold">Question {index + 1}</p>
        <div className="flex items-center gap-1.5">
          {onUp && (
            <button type="button" onClick={onUp} className="w-7 h-7 rounded-full border text-xs hover:bg-white" title="Move up">↑</button>
          )}
          {onDown && (
            <button type="button" onClick={onDown} className="w-7 h-7 rounded-full border text-xs hover:bg-white" title="Move down">↓</button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-600 px-2">Remove</button>
          )}
        </div>
      </div>

      <input
        className="border rounded-lg px-2.5 py-2 w-full mt-2 text-sm"
        placeholder="Question text — e.g. How long is cooked rice safe at room temperature?"
        value={q.question_text}
        onChange={(e) => onChange({ question_text: e.target.value })}
      />
      <input
        className="border rounded-lg px-2.5 py-1.5 w-full mt-2 text-xs"
        placeholder="Optional help text shown under the question"
        value={q.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <select className="border rounded-lg px-2 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.icon} {t.label} — {t.hint}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={q.is_required !== false}
            onChange={(e) => onChange({ is_required: e.target.checked })}
          />
          Mandatory
        </label>
      </div>

      {needsOptions(type) && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500 mb-1">Options</p>
          <div className="flex flex-col gap-1.5">
            {(q.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400 w-4 text-right">{i + 1}</span>
                <input
                  className="border rounded-lg px-2 py-1.5 text-sm flex-1"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
                <button type="button" onClick={() => removeOption(i)} className="text-stone-400 hover:text-red-600 text-sm px-1" title="Remove option">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="text-xs font-bold text-fresh mt-2">+ Add option</button>
        </div>
      )}

      {(type === 'multiple_choice' || type === 'dropdown') && (
        <label className="text-[11px] font-semibold block mt-3">Correct answer (used for auto-scoring — optional)
          <select
            className="border rounded-lg px-2 py-1.5 text-sm block mt-1 min-w-[200px]"
            value={q.correct_answer || ''}
            onChange={(e) => onChange({ correct_answer: e.target.value })}
          >
            <option value="">— not scored —</option>
            {optionsOf(q).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      )}

      {type === 'linear_scale' && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className="text-[11px] font-semibold">Lowest value
            <select
              className="border rounded-lg px-2 py-1.5 text-sm w-full mt-1"
              value={Number(settings.min ?? 1)}
              onChange={(e) => onChange({ settings: { ...settings, min: Number(e.target.value) } })}
            >
              {Array.from({ length: 11 }, (_, n) => n).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold">Highest value
            <select
              className="border rounded-lg px-2 py-1.5 text-sm w-full mt-1"
              value={Number(settings.max ?? 5)}
              onChange={(e) => onChange({ settings: { ...settings, max: Number(e.target.value) } })}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold">Lowest label
            <input
              className="border rounded-lg px-2 py-1.5 text-sm w-full mt-1"
              placeholder="e.g. Poor"
              value={settings.minLabel || ''}
              onChange={(e) => onChange({ settings: { ...settings, minLabel: e.target.value } })}
            />
          </label>
          <label className="text-[11px] font-semibold">Highest label
            <input
              className="border rounded-lg px-2 py-1.5 text-sm w-full mt-1"
              placeholder="e.g. Excellent"
              value={settings.maxLabel || ''}
              onChange={(e) => onChange({ settings: { ...settings, maxLabel: e.target.value } })}
            />
          </label>
        </div>
      )}

      {type === 'rating' && (
        <label className="text-[11px] font-semibold block mt-3">Number of stars
          <select
            className="border rounded-lg px-2 py-1.5 text-sm block mt-1"
            value={Number(settings.max ?? 5)}
            onChange={(e) => onChange({ settings: { ...settings, max: Number(e.target.value) } })}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}

      {footer && <div className="mt-3 flex items-center gap-2">{footer}</div>}
      {saving && <p className="text-[11px] text-stone-400 mt-2">Saving…</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */
export default function SurveyStudio() {
  const [surveys, setSurveys] = useState([]);
  const [tab, setTab] = useState('build');
  const [selected, setSelected] = useState('');
  const [flash, setFlash] = useState('');

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [creating, setCreating] = useState(false);

  // Edit questions
  const [edited, setEdited] = useState([]);
  const [meta, setMeta] = useState({ title: '', description: '' });
  const [qsLoading, setQsLoading] = useState(false);
  const [savingId, setSavingId] = useState('');

  // Responses
  const [resp, setResp] = useState({ items: [], total: 0, page: 1, limit: 25, questions: [] });
  const [respLoading, setRespLoading] = useState(false);

  // Analysis
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const current = surveys.find((s) => s.id === selected);

  async function loadSurveys(keepSelection = true, preferId) {
    const j = await api('/api/admin/surveys').then((r) => r.json()).catch(() => ({}));
    const items = j.items || [];
    setSurveys(items);
    if (preferId && items.some((s) => s.id === preferId)) {
      setSelected(preferId);
    } else if (!keepSelection || !items.find((s) => s.id === selected)) {
      setSelected(items[0]?.id || '');
    }
    return items;
  }

  useEffect(() => {
    // Deep links: /admin/surveys?tab=analysis&survey=<id>
    const p = new URLSearchParams(window.location.search);
    const t = p.get('tab');
    if (['build', 'questions', 'responses', 'analysis'].includes(t)) setTab(t);
    loadSurveys(false, p.get('survey') || undefined);
  }, []);

  useEffect(() => {
    if (!selected) return;
    if (tab === 'questions') loadQuestions(selected);
    if (tab === 'responses') loadResponses(selected, 1, false);
    if (tab === 'analysis') loadAnalytics(selected);
  }, [selected, tab]);

  /* ---------------- create ---------------- */
  function updateQuestion(i, patch) {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  async function createSurvey() {
    if (!title.trim()) { setFlash('Give the survey a title first.'); return; }
    setCreating(true);
    setFlash('');
    const payload = questions
      .filter((q) => q.question_text.trim())
      .map((q) => ({
        ...q,
        options: needsOptions(q.question_type) ? optionsOf(q) : [],
        settings: q.settings || {},
      }));
    const res = await api('/api/admin/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, questions: payload }),
    });
    const j = await res.json();
    setCreating(false);
    if (j.demo) { setFlash('Demo mode — connect Supabase to activate.'); return; }
    if (j.error) { setFlash('Error: ' + j.error); return; }
    setFlash('Survey created. Share link: ' + window.location.origin + '/surveys/' + j.id);
    setTitle(''); setDescription(''); setQuestions([blankQuestion()]);
    await loadSurveys(false);
    setSelected(j.id);
    setTab('questions');
  }

  /* ---------------- survey actions ---------------- */
  async function toggleActive(s) {
    await api('/api/admin/surveys', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    loadSurveys();
  }

  async function deleteSurvey(s) {
    if (!confirm(`Delete “${s.title}” plus its questions and ${s.responses ?? 0} responses?`)) return;
    await api('/api/admin/surveys?id=' + s.id, { method: 'DELETE' });
    loadSurveys(false);
    if (selected === s.id) setSelected('');
  }

  async function copyLink(id) {
    const link = window.location.origin + '/surveys/' + id;
    try {
      await navigator.clipboard.writeText(link);
      setFlash('Link copied: ' + link);
    } catch {
      setFlash('Share link: ' + link);
    }
  }

  async function downloadCSV(s) {
    const res = await api('/api/admin/export?survey_id=' + s.id);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = slugify(s.title) + '.csv';
    link.click();
  }

  function openTab(s, next) {
    setSelected(s.id);
    setTab(next);
    setFlash('');
  }

  /* ---------------- edit questions ---------------- */
  async function loadQuestions(id) {
    setQsLoading(true);
    const j = await api('/api/admin/questions?survey_id=' + id).then((r) => r.json()).catch(() => ({}));
    const items = (j.items || []).map((q) => ({
      ...q,
      description: q.description || '',
      settings: q.settings || {},
      options: Array.isArray(q.options) ? q.options : [],
    }));
    setEdited(items);
    setQsLoading(false);
    const s = surveys.find((x) => x.id === id);
    if (s) setMeta({ title: s.title || '', description: s.description || '' });
  }

  async function saveMeta() {
    if (!selected) return;
    await api('/api/admin/surveys', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected, title: meta.title, description: meta.description }),
    });
    await loadSurveys();
    setFlash('Survey details saved.');
  }

  function updateEdited(i, patch) {
    setEdited((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  async function saveQuestion(q) {
    if (!q.question_text?.trim()) { setFlash('A question needs text before saving.'); return; }
    setSavingId(q.id);
    const res = await api('/api/admin/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: needsOptions(q.question_type) ? optionsOf(q) : [],
        is_required: q.is_required !== false,
        correct_answer: q.correct_answer || '',
        settings: q.settings || {},
        description: q.description || '',
      }),
    });
    const j = await res.json();
    setSavingId('');
    setFlash(j.error ? 'Error: ' + j.error : 'Question saved.');
    if (!j.error) loadQuestions(selected);
  }

  async function addQuestion() {
    if (!selected) return;
    const res = await api('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: selected,
        question_text: 'Untitled question',
        question_type: 'multiple_choice',
        options: ['Option 1', 'Option 2'],
        is_required: true,
        settings: {},
      }),
    });
    const j = await res.json();
    if (j.error) { setFlash('Error: ' + j.error); return; }
    await loadQuestions(selected);
    setFlash('Question added — edit it below.');
  }

  async function removeQuestion(q) {
    if (!confirm('Delete this question? Existing answers stay in past submissions.')) return;
    await api('/api/admin/questions?id=' + q.id, { method: 'DELETE' });
    await loadQuestions(selected);
  }

  async function moveQuestion(i, dir) {
    const next = [...edited];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setEdited(next);
    await api('/api/admin/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((q) => q.id) }),
    });
  }

  /* ---------------- responses ---------------- */
  async function loadResponses(id, page = 1, append = false) {
    setRespLoading(true);
    const j = await api(`/api/admin/responses?survey_id=${id}&page=${page}&limit=25`)
      .then((r) => r.json())
      .catch(() => ({}));
    setRespLoading(false);
    if (j.error) { setFlash('Error: ' + j.error); return; }
    setResp((prev) => ({
      items: append ? [...prev.items, ...(j.items || [])] : j.items || [],
      total: j.total || 0,
      page: j.page || page,
      limit: j.limit || 25,
      questions: j.questions?.length ? j.questions : prev.questions,
    }));
  }

  async function deleteResponse(id) {
    if (!confirm('Delete this submission permanently?')) return;
    await api('/api/admin/responses?id=' + id, { method: 'DELETE' });
    loadResponses(selected, 1, false);
    loadSurveys();
  }

  /* ---------------- analysis ---------------- */
  async function loadAnalytics(id) {
    setAnalyticsLoading(true);
    const j = await api('/api/admin/analytics').then((r) => r.json()).catch(() => null);
    setAnalytics(j);
    setAnalyticsLoading(false);
  }

  const viewed = analytics?.surveys?.[selected];

  function chartFor(q, index) {
    if (q.dist) {
      const cfg = scaleConfig(q);
      const isScale = q.type === 'linear_scale' || q.type === 'rating';
      const data = Object.entries(q.dist).map(([name, value]) => {
        let label = name;
        if (isScale) {
          const n = Number(name);
          if (n === cfg.min && cfg.minLabel) label = `${name} — ${cfg.minLabel}`;
          else if (n === cfg.max && cfg.maxLabel) label = `${name} — ${cfg.maxLabel}`;
          else label = `${name}`;
        }
        return { name: label, value };
      });
      return {
        kind: isScale || q.type === 'checkbox' ? 'bar' : 'donut',
        title: q.text,
        note: `${q.total} answered • ${typeLabel(q.type)}${q.average !== null && q.average !== undefined ? ` • average ${q.average}` : ''}`,
        total: q.total,
        data,
        filename: `${slugify(current?.title)}-q${index + 1}-${slugify(q.text)}`,
      };
    }
    return null;
  }

  const analysisCards = useMemo(() => {
    if (!viewed) return [];
    return viewed.questions.map((q, i) => ({
      q,
      chart: chartFor(q, i),
      filename: `${slugify(current?.title)}-q${i + 1}-${slugify(q.text)}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewed, current?.title]);

  async function downloadAllCharts() {
    if (!viewed) return;
    setExporting(true);
    try {
      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const header = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="110" viewBox="0 0 760 110">
        <rect width="760" height="110" fill="#ffffff" />
        <text x="32" y="48" font-size="24" font-weight="800" font-family="Inter, Segoe UI, sans-serif" fill="#1c1917">${esc(current?.title || 'Survey report')}</text>
        <text x="32" y="74" font-size="13" font-family="Inter, Segoe UI, sans-serif" fill="#78716c">${viewed.total} responses • ${viewed.questions.length} questions • exported ${esc(new Date().toLocaleString())}</text>
        <text x="32" y="95" font-size="11" font-family="Inter, Segoe UI, sans-serif" fill="#a8a29e">FoodSense — food science, made simple.</text>
      </svg>`;

      const charts = [];
      if (viewed.timeline?.length) {
        charts.push(
          buildChartSvg(
            {
              title: 'Responses over time',
              note: `${viewed.total} responses`,
              kind: 'bar',
              total: viewed.total,
              data: viewed.timeline.map((t) => ({ name: t.date, value: t.count })),
            },
            false
          )
        );
      }
      for (const { chart } of analysisCards) {
        if (!chart) continue;
        charts.push(buildChartSvg({ ...chart, footer: new Date().toLocaleDateString() }, false));
      }

      const strips = [header, ...charts].map((m) => {
        const h = Number((m.match(/<svg[^>]*height="(\d+)"/) || [])[1] || 600);
        return { h, inner: m.slice(m.indexOf('>') + 1, m.lastIndexOf('</svg>')) };
      });
      const totalHeight = strips.reduce((s, p) => s + p.h, 0);
      let y = 0;
      let body = '';
      for (const p of strips) {
        body += `<g transform="translate(0 ${y})">${p.inner}</g>`;
        y += p.h;
      }
      const report = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="${totalHeight}" viewBox="0 0 760 ${totalHeight}"><rect width="760" height="${totalHeight}" fill="#ffffff" />${body}</svg>`;

      await svgToPng(report, `${slugify(current?.title)}-survey-report.png`);
      setFlash('Full report downloaded as one PNG image.');
    } catch (e) {
      setFlash('Could not export charts: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  /* ---------------- render ---------------- */
  const tabs = [
    { id: 'build', label: '➕ Build' },
    { id: 'questions', label: '✏️ Questions' },
    { id: 'responses', label: '📥 Responses' },
    { id: 'analysis', label: '📊 Analysis' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              tab === t.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-cream'
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab !== 'build' && surveys.length > 0 && (
          <select
            className="ml-auto border rounded-xl px-3 py-2 text-sm font-semibold bg-white max-w-xs"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title} ({s.responses ?? 0})</option>
            ))}
          </select>
        )}
      </div>

      {flash && (
        <div className="text-sm bg-white border rounded-xl px-4 py-2.5 break-all flex items-start gap-2">
          <span>{flash}</span>
          <button onClick={() => setFlash('')} className="ml-auto text-stone-400 text-xs">✕</button>
        </div>
      )}

      {/* ------------------------------- BUILD ------------------------------- */}
      {tab === 'build' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="font-display font-bold text-lg">Create a survey 📋</p>
            <p className="text-xs text-stone-500 mt-1">Every Google Forms style question type is supported.</p>

            <input
              className="border rounded-xl px-3 py-2.5 w-full mt-4"
              placeholder="Survey title e.g. Endline — Nov 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="text-sm font-semibold mt-3 block">
              Description (shown above the form)
              <textarea
                className="border rounded-xl px-3 py-2.5 w-full mt-1 font-normal leading-relaxed"
                rows={3}
                placeholder="Explain what this survey is for, who it's for, and how the answers are used."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {questions.map((q, i) => (
              <QuestionFields
                key={i}
                q={q}
                index={i}
                onChange={(patch) => updateQuestion(i, patch)}
                onRemove={questions.length > 1 ? () => setQuestions((qs) => qs.filter((_, j) => j !== i)) : null}
                onUp={i > 0 ? () => setQuestions((qs) => { const n = [...qs]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; return n; }) : null}
                onDown={i < questions.length - 1 ? () => setQuestions((qs) => { const n = [...qs]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; }) : null}
              />
            ))}

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setQuestions((q) => [...q, blankQuestion()])} className="px-4 py-2 rounded-full border text-sm font-bold">+ Add question</button>
              <button onClick={createSurvey} disabled={creating} className="px-4 py-2 rounded-full bg-fresh text-white text-sm font-bold disabled:opacity-60">
                {creating ? 'Creating…' : 'Create & activate'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="font-display font-bold">All surveys ({surveys.length})</p>
            <div className="flex flex-col gap-2 mt-3">
              {surveys.map((s) => (
                <div key={s.id} className="border rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.title}</p>
                      {s.description && <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">{s.description}</p>}
                      <p className="text-xs text-stone-500 mt-1">
                        {s.is_active ? '🟢 Active' : '⏸ Paused'} • {s.responses ?? 0} responses • /surveys/{s.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button onClick={() => openTab(s, 'questions')} className="text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">Edit form</button>
                    <button onClick={() => openTab(s, 'responses')} className="text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">Responses</button>
                    <button onClick={() => openTab(s, 'analysis')} className="text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">Analysis</button>
                    <button onClick={() => copyLink(s.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">Copy link</button>
                    <button onClick={() => toggleActive(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border hover:bg-cream">{s.is_active ? 'Pause' : 'Activate'}</button>
                    <button onClick={() => downloadCSV(s)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">⬇ CSV</button>
                    <button onClick={() => deleteSurvey(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
                  </div>
                </div>
              ))}
              {surveys.length === 0 && <p className="text-sm text-stone-500">No surveys yet — create your first one.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------- QUESTIONS ----------------------------- */}
      {tab === 'questions' && (
        <div className="bg-white rounded-2xl shadow-soft p-6">
          {!selected && <p className="text-sm text-stone-500">No survey selected.</p>}
          {selected && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display font-bold text-lg">Edit form ✏️</p>
                <div className="flex gap-2">
                  <button onClick={addQuestion} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">+ Add question</button>
                  <button onClick={() => loadQuestions(selected)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Reload</button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <label className="text-xs font-semibold">Survey title
                  <input className="border rounded-lg px-2.5 py-1.5 text-sm w-full mt-1" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                </label>
                <label className="text-xs font-semibold">Description
                  <textarea className="border rounded-lg px-2.5 py-1.5 text-sm w-full mt-1" rows={2} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
                </label>
              </div>
              <button onClick={saveMeta} className="text-xs font-bold px-3 py-1.5 rounded-full border mt-2">Save survey details</button>

              {qsLoading && <p className="text-sm text-stone-500 mt-4">Loading questions…</p>}

              {!qsLoading && edited.length === 0 && (
                <p className="text-sm text-stone-500 mt-4">No questions yet — use “+ Add question”.</p>
              )}

              {!qsLoading && edited.map((q, i) => (
                <QuestionFields
                  key={q.id}
                  q={q}
                  index={i}
                  saving={savingId === q.id}
                  onChange={(patch) => updateEdited(i, patch)}
                  onUp={i > 0 ? () => moveQuestion(i, -1) : null}
                  onDown={i < edited.length - 1 ? () => moveQuestion(i, 1) : null}
                  onRemove={() => removeQuestion(q)}
                  footer={
                    <>
                      <button onClick={() => saveQuestion(q)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">Save question</button>
                      {q.correct_answer ? <span className="text-[11px] text-stone-500">Correct answer: {q.correct_answer}</span> : null}
                    </>
                  }
                />
              ))}

              <div className="flex flex-wrap gap-2 mt-5 border-t pt-4">
                <a href={`/surveys/${selected}`} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-full border">Open public form ↗</a>
                <button onClick={() => copyLink(selected)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Copy share link</button>
                <button onClick={() => openTab(current || { id: selected }, 'responses')} className="text-xs font-bold px-3 py-1.5 rounded-full border">View responses</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ----------------------------- RESPONSES ----------------------------- */}
      {tab === 'responses' && (
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display font-bold text-lg">All submissions 📥</p>
              <p className="text-xs text-stone-500">
                {resp.total} total response{resp.total === 1 ? '' : 's'}
                {resp.total > 0 ? ` • showing ${resp.items.length} of ${resp.total}` : ''}
              </p>
            </div>
            {current && (
              <div className="flex gap-2">
                <button onClick={() => downloadCSV(current)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">⬇ Download CSV</button>
                <button onClick={() => loadResponses(selected, 1, false)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Refresh</button>
              </div>
            )}
          </div>

          {respLoading && <p className="text-sm text-stone-500 mt-4">Loading submissions…</p>}

          {!respLoading && resp.items.length === 0 && (
            <div className="text-center py-10">
              <p className="text-3xl">🗒️</p>
              <p className="text-sm text-stone-500 mt-2">No submissions yet. Share the form link to collect the first response.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            {resp.items.map((r, idx) => {
              const number = resp.total - ((resp.page - 1) * resp.limit + idx);
              return (
                <div key={r.id} className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cream text-stone-600">#{number}</span>
                    <span className="text-xs text-stone-500">{new Date(r.submitted_at).toLocaleString()}</span>
                    <button onClick={() => deleteResponse(r.id)} className="ml-auto text-[11px] font-semibold text-red-600">Delete</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 mt-2">
                    {(resp.questions || []).map((q) => {
                      const val = answerText(q, r.answers?.[q.id]);
                      return (
                        <div key={q.id} className="text-sm">
                          <p className="text-[11px] font-semibold text-stone-500">{q.question_text}</p>
                          <p className={val ? 'whitespace-pre-wrap break-words' : 'italic text-stone-400'}>
                            {val || '— skipped —'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {resp.items.length < resp.total && (
            <button
              onClick={() => loadResponses(selected, resp.page + 1, true)}
              disabled={respLoading}
              className="mt-4 w-full py-2.5 rounded-xl border text-sm font-bold hover:bg-cream disabled:opacity-60"
            >
              {respLoading ? 'Loading…' : `Load more (${resp.total - resp.items.length} remaining)`}
            </button>
          )}
        </div>
      )}

      {/* ------------------------------ ANALYSIS ------------------------------ */}
      {tab === 'analysis' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold text-lg">Survey analysis 📊</p>
                <p className="text-xs text-stone-500">Every chart can be downloaded as a high-resolution PNG.</p>
              </div>
              <button
                onClick={downloadAllCharts}
                disabled={exporting || !viewed?.total}
                className="text-xs font-bold px-3 py-2 rounded-full bg-stone-900 text-white disabled:opacity-50"
              >
                {exporting ? 'Exporting…' : '⬇ Download full report (PNG)'}
              </button>
            </div>

            {analyticsLoading && <p className="text-sm text-stone-500 mt-4">Calculating…</p>}

            {viewed && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="rounded-xl bg-cream/60 p-3">
                    <p className="text-[11px] font-semibold text-stone-500">Responses</p>
                    <p className="font-display text-2xl font-extrabold">{viewed.total}</p>
                  </div>
                  <div className="rounded-xl bg-cream/60 p-3">
                    <p className="text-[11px] font-semibold text-stone-500">Questions</p>
                    <p className="font-display text-2xl font-extrabold">{viewed.questions.length}</p>
                  </div>
                  <div className="rounded-xl bg-cream/60 p-3">
                    <p className="text-[11px] font-semibold text-stone-500">Status</p>
                    <p className="font-display text-lg font-extrabold">{viewed.is_active ? 'Active' : 'Paused'}</p>
                  </div>
                  <div className="rounded-xl bg-cream/60 p-3">
                    <p className="text-[11px] font-semibold text-stone-500">Latest response</p>
                    <p className="text-xs font-semibold mt-1.5">{viewed.latest ? new Date(viewed.latest).toLocaleString() : '—'}</p>
                  </div>
                </div>

                {viewed.total === 0 && (
                  <p className="text-sm text-stone-500 mt-4">No responses yet — charts will fill in as people submit.</p>
                )}

                {viewed.timeline?.length > 0 && (
                  <div className="mt-5">
                    <SurveyChart
                      title="Responses over time"
                      note={`${viewed.total} responses • last ${viewed.timeline.length} active days`}
                      kind="bar"
                      total={viewed.total}
                      data={viewed.timeline.map((t) => ({ name: t.date, value: t.count }))}
                      filename={`${slugify(current?.title)}-responses-over-time`}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {viewed && viewed.questions.map((q, i) => {
            const chart = chartFor(q, i);
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-soft p-5">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Q{i + 1}. {q.text}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {typeLabel(q.type)} • {q.total} answered
                      {q.average !== null && q.average !== undefined ? ` • average ${q.average}` : ''}
                    </p>
                  </div>
                  {q.pct !== null && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fresh-light text-fresh-dark">
                      {q.pct}% correct
                    </span>
                  )}
                </div>

                {chart ? (
                  <SurveyChart
                    title={chart.title}
                    note={chart.note}
                    data={chart.data}
                    kind={chart.kind}
                    total={chart.total}
                    filename={chart.filename}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-xs text-stone-500 mt-2">Free-text answers are listed below.</p>
                )}

                {q.type === 'number' && q.average !== null && (
                  <p className="text-sm mt-2">Average: <strong>{q.average}</strong> · min {q.min} · max {q.max}</p>
                )}

                {q.samples?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-stone-500 mb-1">All answers ({q.samples.length})</p>
                    <div className="max-h-64 overflow-y-auto border rounded-xl divide-y">
                      {q.samples.map((s, j) => (
                        <p key={j} className="text-sm px-3 py-2 whitespace-pre-wrap break-words">
                          <span className="text-[10px] text-stone-400 mr-2">{j + 1}.</span>
                          {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
