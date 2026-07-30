// Точка входа: canvas + dpr, главный цикл, связка модулей, заставка.
import { settings } from './settings.js';
import * as audio from './audio.js';
import { Background } from './background.js';
import { Aquarium } from './aquarium.js';
import { initInput } from './input.js';
import { initPanel } from './panel.js';

const canvas = document.getElementById('tank');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const AUTOSTART = params.has('autostart');

let w = 0;
let h = 0;
const background = new Background();
let aquarium = null;

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  // вся логика в CSS-пикселях: координаты pointer не требуют пересчёта
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!aquarium) aquarium = new Aquarium(w, h);
  else aquarium.resize(w, h);
  background.render(w, h, aquarium.sandY, dpr);
}

resize();
window.addEventListener('resize', resize);

const panel = initPanel({ aquarium });
const input = initInput({
  canvas,
  onAction: (a) => aquarium.react(a),
  onParentRequest: () => panel.open(),
  isPanelOpen: panel.isOpen,
  closePanel: panel.close,
});

audio.setMuted(!settings.sound);

// Заставка: первый жест включает звук и полный экран (одним тапом
// выполняются оба требования браузера к «пользовательскому жесту»).
const splash = document.getElementById('splash');

function start() {
  audio.unlock();
  document.documentElement.requestFullscreen().catch(() => {});
  splash.classList.add('hidden');
}

splash.addEventListener('pointerdown', start, { once: true });
window.addEventListener('keydown', () => {
  if (!splash.classList.contains('hidden')) start();
}, { once: true });

if (AUTOSTART) splash.classList.add('hidden');

// Главный цикл.
let last = performance.now();
let fps = 60;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); // clamp: сон вкладки не телепортирует рыб
  last = now;
  const t = now / 1000;

  aquarium.update(dt, t);
  input.tick();

  background.blit(ctx, w, h);
  background.drawRays(ctx, t, aquarium.ms);
  aquarium.draw(ctx, t);

  if (DEBUG) {
    if (dt > 0) fps = fps * 0.95 + (1 / dt) * 0.05;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(8, 8, 250, 26);
    ctx.fillStyle = '#9fe8ff';
    ctx.font = '13px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `FPS ${fps.toFixed(0)}  fish ${aquarium.fish.length}  bub ${aquarium.bubbles.length}  food ${aquarium.food.length}`,
      16, 21,
    );
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
