// Storage bridge for survey-question extras.
//
// Migration v9 adds `settings`, `description` and `display_order` columns.
// Until that migration is run, the same values are packed into the existing
// `options` jsonb as a trailing meta object, so every feature (help text,
// scale labels, ordering) still works on an un-migrated database.

export const META_KEY = '__foodsense';

export function packOptions(options, extras = {}) {
  const list = (Array.isArray(options) ? options : []).filter((o) => typeof o === 'string' && o.trim() !== '');
  const meta = {};
  if (extras.description) meta.d = String(extras.description);
  if (extras.settings && typeof extras.settings === 'object' && Object.keys(extras.settings).length) meta.s = extras.settings;
  if (Number.isFinite(Number(extras.display_order))) meta.o = Number(extras.display_order);
  if (Object.keys(meta).length) list.push({ [META_KEY]: meta });
  return list;
}

export function unpackQuestion(q) {
  if (!q) return q;
  const opts = Array.isArray(q.options) ? q.options : [];
  const metaEntry = opts.find((o) => o && typeof o === 'object' && o[META_KEY]);
  const meta = (metaEntry && metaEntry[META_KEY]) || {};
  const columnOrder = Number(q.display_order);
  return {
    ...q,
    options: opts.filter((o) => typeof o === 'string'),
    description: q.description || meta.d || '',
    settings: q.settings && Object.keys(q.settings).length ? q.settings : meta.s || {},
    display_order: Number.isFinite(columnOrder) && columnOrder > 0 ? columnOrder : Number.isFinite(Number(meta.o)) ? Number(meta.o) : 0,
  };
}

export function unpackQuestions(list) {
  return (list || [])
    .map(unpackQuestion)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}
