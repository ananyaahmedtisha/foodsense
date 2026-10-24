// Shared survey question catalogue — used by the admin builder, public form and analytics.
// 'text' is treated as a legacy alias of 'paragraph' so older surveys keep working.

export const QUESTION_TYPES = [
  { value: 'short_answer', label: 'Short answer', hint: 'One line of text', icon: '✏️' },
  { value: 'paragraph', label: 'Paragraph', hint: 'Long-form answer', icon: '📝' },
  { value: 'multiple_choice', label: 'Multiple choice', hint: 'Pick one option', icon: '🔘', needsOptions: true },
  { value: 'checkbox', label: 'Checkboxes', hint: 'Pick any number', icon: '☑️', needsOptions: true },
  { value: 'dropdown', label: 'Dropdown', hint: 'Pick one from a menu', icon: '🔽', needsOptions: true },
  { value: 'linear_scale', label: 'Linear scale', hint: 'Rate on a number line', icon: '📏' },
  { value: 'rating', label: 'Star rating', hint: '1–5 stars', icon: '⭐' },
  { value: 'date', label: 'Date', hint: 'Calendar picker', icon: '📅' },
  { value: 'time', label: 'Time', hint: 'Clock picker', icon: '⏰' },
  { value: 'number', label: 'Number', hint: 'Numeric answer', icon: '🔢' },
  { value: 'email', label: 'Email', hint: 'name@example.com', icon: '✉️' },
  { value: 'phone', label: 'Phone', hint: 'Mobile number', icon: '📞' },
  { value: 'url', label: 'Website link', hint: 'https://…', icon: '🔗' },
];

const BY_VALUE = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t]));

export function normalizeType(type) {
  if (type === 'text') return 'paragraph';
  return BY_VALUE[type] ? type : 'short_answer';
}

export function typeMeta(type) {
  return BY_VALUE[normalizeType(type)] || BY_VALUE.short_answer;
}

export function needsOptions(type) {
  return !!typeMeta(type).needsOptions;
}

export function isChoiceType(type) {
  const t = normalizeType(type);
  return t === 'multiple_choice' || t === 'checkbox' || t === 'dropdown';
}

export function defaultSettings(type) {
  const t = normalizeType(type);
  if (t === 'linear_scale') return { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' };
  if (t === 'rating') return { max: 5 };
  return {};
}

export function scaleConfig(q) {
  const s = (q && q.settings) || {};
  const min = Number.isFinite(Number(s.min)) ? Number(s.min) : 1;
  const max = Number.isFinite(Number(s.max)) ? Number(s.max) : Number(q?.question_type === 'rating' ? 5 : 5);
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    minLabel: s.minLabel || '',
    maxLabel: s.maxLabel || '',
  };
}

export function scaleValues(q) {
  const { min, max } = scaleConfig(q);
  const out = [];
  for (let n = min; n <= max; n += 1) out.push(n);
  return out;
}

export function optionsOf(q) {
  const opts = Array.isArray(q?.options) ? q.options : [];
  return opts.map((o) => (typeof o === 'string' ? o : '')).filter((o) => o.trim() !== '');
}

export function allowsOther(q) {
  return !!(q?.settings && q.settings.allowOther);
}

// Human-readable answer (CSV, admin tables, exports).
export function answerText(q, value) {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.join('; ');
  const type = normalizeType(q?.question_type);
  if (type === 'linear_scale') {
    const cfg = scaleConfig(q);
    const v = String(value);
    if (cfg.min === Number(value) && cfg.minLabel) return `${v} — ${cfg.minLabel}`;
    if (cfg.max === Number(value) && cfg.maxLabel) return `${v} — ${cfg.maxLabel}`;
    return v;
  }
  if (type === 'rating') return `${value} star${Number(value) === 1 ? '' : 's'}`;
  return String(value);
}

export function isAnswered(q, value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  return String(value).trim() !== '';
}
