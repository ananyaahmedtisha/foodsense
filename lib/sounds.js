// Tiny WebAudio synth for game feedback — no audio assets needed.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('foodsense-sound') === 'off'; } catch {}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem('foodsense-sound', muted ? 'off' : 'on'); } catch {}
}

function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.06, when = 0, slideTo = null) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  tap() { tone(520, 0.07, 'sine', 0.05); },
  pop() { tone(420, 0.09, 'sine', 0.05, 0, 760); },
  good() { tone(660, 0.1, 'sine', 0.06); tone(880, 0.14, 'sine', 0.06, 0.09); },
  bad() { tone(200, 0.22, 'sawtooth', 0.045, 0, 140); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.11)); },
};
