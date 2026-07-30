// Синтез звуков через Web Audio: без файлов, ленивый запуск по первому жесту.
import { rand } from './utils.js';

let ctx = null;
let master = null;
let muted = false;
let noiseBuf = null;

// Ограничитель: не даём звукам сыпаться чаще, чем приятно уху.
const RATE = 10;       // стартов в секунду
const MAX_VOICES = 12; // одновременных голосов
let tokens = RATE;
let lastRefill = 0;
let voices = 0;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch {
      return;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 8;
    master.connect(comp);
    comp.connect(ctx.destination);
    lastRefill = ctx.currentTime;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.02);
}

function ready() {
  if (!ctx || muted) return false;
  const now = ctx.currentTime;
  tokens = Math.min(RATE, tokens + (now - lastRefill) * RATE);
  lastRefill = now;
  if (tokens < 1 || voices >= MAX_VOICES) return false;
  tokens -= 1;
  return true;
}

function countVoice(node) {
  voices += 1;
  node.addEventListener('ended', () => {
    voices = Math.max(0, voices - 1);
  });
}

function envGain(t0, peak, decay, attack = 0.005) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  g.connect(master);
  return g;
}

function getNoise() {
  if (!noiseBuf) {
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// «Буль» — основной отклик на тап.
export function blub() {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(rand(130, 170), t0);
  o.frequency.exponentialRampToValueAtTime(rand(350, 450), t0 + 0.08);
  o.connect(envGain(t0, 0.22, 0.25));
  o.start(t0);
  o.stop(t0 + 0.3);
  countVoice(o);
}

// Лопнувший пузырёк.
export function pop() {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = getNoise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = rand(800, 2000);
  bp.Q.value = 10;
  src.connect(bp);
  bp.connect(envGain(t0, 0.25, 0.09));
  src.start(t0);
  src.stop(t0 + 0.12);
  countVoice(src);
}

// Нота пентатоники: любое «молочение» клавиш звучит музыкально.
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21].map((s) => 523.25 * 2 ** (s / 12));

export function chime(n) {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const f = PENTA[Math.abs(n) % PENTA.length];
  const g = envGain(t0, 0.14, 0.6);
  for (const [mult, amp] of [[1, 1], [2, 0.35]]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * mult;
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og);
    og.connect(g);
    o.start(t0);
    o.stop(t0 + 0.65);
    if (mult === 1) countVoice(o);
  }
}

// «Кормёжка»: несколько нисходящих блипов.
export function sprinkle() {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const t = t0 + i * 0.045;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(rand(1500, 1900) - i * 220, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.14);
    if (i === 0) countVoice(o);
  }
}

// «Течение» от стрелок.
export function swoosh() {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = getNoise();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2000, t0);
  lp.frequency.exponentialRampToValueAtTime(300, t0 + 0.3);
  src.connect(lp);
  lp.connect(envGain(t0, 0.08, 0.3, 0.03));
  src.start(t0);
  src.stop(t0 + 0.35);
  countVoice(src);
}

// Рыба съела корм.
export function gulp() {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(320, t0);
  o.frequency.exponentialRampToValueAtTime(120, t0 + 0.09);
  o.connect(envGain(t0, 0.12, 0.12));
  o.start(t0);
  o.stop(t0 + 0.15);
  countVoice(o);
}
