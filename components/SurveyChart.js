'use client';
import { useEffect, useMemo, useState } from 'react';

// Self-contained SVG chart with a one-click PNG export.
// The SVG is built as markup (not DOM-captured) so exports are crisp at 2x
// and always use light colours, no matter which theme the admin is in.

const PALETTE = ['#16A34A', '#0D9488', '#F59E0B', '#8B5CF6', '#F43F5E', '#3B82F6', '#84CC16', '#EC4899', '#64748B', '#14B8A6'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clampText = (s, n) => {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
};

function palette(dark) {
  return {
    bg: dark ? '#1c1917' : '#ffffff',
    title: dark ? '#f5f5f4' : '#1c1917',
    muted: dark ? '#a8a29e' : '#78716c',
    track: dark ? '#292524' : '#f5f5f4',
    rule: dark ? '#44403c' : '#e7e5e4',
  };
}

function donutPath(cx, cy, rOuter, rInner, start, end) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = p(rOuter, start);
  const [x2, y2] = p(rOuter, end);
  const [x3, y3] = p(rInner, end);
  const [x4, y4] = p(rInner, start);
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

export function buildChartSvg({ title, note, data, kind = 'donut', total, footer }, dark = false) {
  const c = palette(dark);
  const rows = (data || []).filter((d) => Number(d.value) > 0);
  const sum = Number.isFinite(Number(total)) ? Number(total) : (data || []).reduce((s, d) => s + Number(d.value || 0), 0);

  const W = 760;
  const px = 32;
  const titleLines = wrap(title, 52);

  if (kind === 'donut') {
    const legendCount = Math.max(rows.length, 1);
    const H = Math.max(300, 132 + legendCount * 30 + 46);
    const cx = 210;
    const cy = 118 + Math.max(0, (legendCount - 1) * 15) + 90;
    const rOuter = 104;
    const rInner = 62;
    const cyFinal = Math.max(cy, 210);
    const height = Math.max(H, cyFinal + rOuter + 74);

    let angles = -Math.PI / 2;
    const slices = rows.map((d, i) => {
      const frac = sum > 0 ? Number(d.value) / sum : 0;
      const start = angles;
      const end = start + frac * Math.PI * 2;
      angles = end;
      return { ...d, start, end, color: d.color || PALETTE[i % PALETTE.length], frac };
    });

    const single = slices.length === 1 && Math.abs(slices[0].frac - 1) < 0.0001;

    const paths = single
      ? `<circle cx="${cx}" cy="${cyFinal}" r="${(rOuter + rInner) / 2}" fill="none" stroke="${slices[0].color}" stroke-width="${rOuter - rInner}" />`
      : slices
          .filter((s) => s.frac > 0)
          .map((s) => `<path d="${donutPath(cx, cyFinal, rOuter, rInner, s.start, s.end)}" fill="${s.color}" />`)
          .join('');

    const legend = (rows.length ? slices : [])
      .map((d, i) => {
        const y = 170 + i * 30;
        const pct = sum > 0 ? Math.round((Number(d.value) / sum) * 100) : 0;
        const label = clampText(d.name, 30);
        return `
          <rect x="${px + 348}" y="${y - 10}" width="12" height="12" rx="3" fill="${d.color}" />
          <text x="${px + 368}" y="${y}" font-size="13" fill="${c.title}">${esc(label)}</text>
          <text x="${W - px}" y="${y}" font-size="13" font-weight="600" text-anchor="end" fill="${c.title}">${d.value} · ${pct}%</text>`;
      })
      .join('');

    const empty = !rows.length
      ? `<text x="${W / 2}" y="${cyFinal}" text-anchor="middle" font-size="15" fill="${c.muted}">No answers yet</text>`
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(title)}">
      <rect width="${W}" height="${height}" fill="${c.bg}" />
      ${titleLines.map((l, i) => `<text x="${px}" y="${44 + i * 24}" font-size="19" font-weight="700" font-family="Inter, Segoe UI, sans-serif" fill="${c.title}">${esc(l)}</text>`).join('')}
      ${note ? `<text x="${px}" y="${44 + titleLines.length * 24}" font-size="12.5" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">${esc(note)}</text>` : ''}
      ${paths}
      ${empty}
      ${rows.length ? `<text x="${cx}" y="${cyFinal - 6}" text-anchor="middle" font-size="26" font-weight="800" font-family="Inter, Segoe UI, sans-serif" fill="${c.title}">${sum}</text>
      <text x="${cx}" y="${cyFinal + 15}" text-anchor="middle" font-size="11" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">responses</text>` : ''}
      ${legend}
      <line x1="${px}" y1="${height - 34}" x2="${W - px}" y2="${height - 34}" stroke="${c.rule}" />
      <text x="${px}" y="${height - 14}" font-size="11" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">FoodSense · survey analysis</text>
      <text x="${W - px}" y="${height - 14}" font-size="11" text-anchor="end" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">${esc(footer || new Date().toLocaleDateString())}</text>
    </svg>`;
  }

  // Horizontal bar chart (scales, ratings, number averages)
  const H = Math.max(220, 130 + Math.max(rows.length, 1) * 44 + 44);
  const labelW = 250;
  const barX = px + labelW;
  const barW = W - barX - px - 56;
  const max = Math.max(1, ...rows.map((d) => Number(d.value) || 0));

  const bars = rows
    .map((d, i) => {
      const y = 136 + i * 44;
      const w = Math.max(4, (Number(d.value) / max) * barW);
      const color = d.color || PALETTE[i % PALETTE.length];
      return `
        <text x="${px}" y="${y + 14}" font-size="13" fill="${c.title}" font-family="Inter, Segoe UI, sans-serif">${esc(clampText(d.name, 32))}</text>
        <rect x="${barX}" y="${y + 2}" width="${barW}" height="16" rx="8" fill="${c.track}" />
        <rect x="${barX}" y="${y + 2}" width="${w}" height="16" rx="8" fill="${color}" />
        <text x="${W - px}" y="${y + 15}" font-size="13" font-weight="600" text-anchor="end" fill="${c.title}" font-family="Inter, Segoe UI, sans-serif">${d.value}</text>`;
    })
    .join('');

  const empty = !rows.length
    ? `<text x="${W / 2}" y="200" text-anchor="middle" font-size="15" fill="${c.muted}">No answers yet</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
    <rect width="${W}" height="${H}" fill="${c.bg}" />
    ${titleLines.map((l, i) => `<text x="${px}" y="${44 + i * 24}" font-size="19" font-weight="700" font-family="Inter, Segoe UI, sans-serif" fill="${c.title}">${esc(l)}</text>`).join('')}
    ${note ? `<text x="${px}" y="${44 + titleLines.length * 24}" font-size="12.5" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">${esc(note)}</text>` : ''}
    ${bars}
    ${empty}
    <line x1="${px}" y1="${H - 34}" x2="${W - px}" y2="${H - 34}" stroke="${c.rule}" />
    <text x="${px}" y="${H - 14}" font-size="11" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">FoodSense · survey analysis</text>
    <text x="${W - px}" y="${H - 14}" font-size="11" text-anchor="end" fill="${c.muted}" font-family="Inter, Segoe UI, sans-serif">${esc(footer || new Date().toLocaleDateString())}</text>
  </svg>`;
}

function wrap(text, size) {
  const words = String(text || 'Untitled question').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > size) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function svgToPng(svgMarkup, filename) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return reject(new Error('Could not export PNG'));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = filename.endsWith('.png') ? filename : filename + '.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        resolve(true);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not render chart'));
    };
    img.src = url;
  });
}

export function slugify(s) {
  return String(s || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'chart';
}

export default function SurveyChart({ title, note, data, kind = 'donut', total, filename, className = '' }) {
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const markup = useMemo(
    () => buildChartSvg({ title, note, data, kind, total, footer: new Date().toLocaleDateString() }, dark),
    [title, note, data, kind, total, dark]
  );

  async function download() {
    setSaving(true);
    try {
      const light = buildChartSvg({ title, note, data, kind, total, footer: new Date().toLocaleDateString() }, false);
      await svgToPng(light, `${slugify(filename || title)}.png`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="w-full overflow-hidden rounded-xl" dangerouslySetInnerHTML={{ __html: markup }} />
      <button
        type="button"
        onClick={download}
        disabled={saving}
        className="absolute top-2 right-2 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-white/90 hover:bg-fresh hover:text-white transition disabled:opacity-60"
        title="Download this chart as a PNG image"
      >
        {saving ? '…' : '⬇ PNG'}
      </button>
    </div>
  );
}
