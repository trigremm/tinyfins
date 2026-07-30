// Ввод: Pointer Events (multi-touch) + клавиатура, защита от случайных
// жестов браузера, детектор «родительских» действий (угол 2 с / слово parent).
import * as audio from './audio.js';

const HOLD_MS = 2000;
const RING_AT = 0.35;  // доля удержания, после которой видно кольцо
const MOVE_TOL = 10;   // px сдвига, отменяющего удержание
const CORNER = 70;     // размер угловой зоны, px

export function initInput({ canvas, onAction, onParentRequest, isPanelOpen, closePanel }) {
  let hold = null; // {id, x, y, t0}
  let buf = '';    // последние буквы для слова "parent"
  const ring = document.getElementById('hold-ring');

  function cancelHold() {
    hold = null;
    ring.classList.add('hidden');
  }

  function inCorner(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (x < CORNER || x > w - CORNER) && (y < CORNER || y > h - CORNER);
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.unlock();
    if (isPanelOpen()) return;
    if (hold) {
      // второй палец — точно не родитель, а ладошка
      cancelHold();
    } else if (inCorner(e.clientX, e.clientY)) {
      hold = { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now() };
    }
    onAction({ type: 'tap', x: e.clientX, y: e.clientY });
  });

  window.addEventListener('pointermove', (e) => {
    if (hold && e.pointerId === hold.id
      && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > MOVE_TOL) {
      cancelHold();
    }
  });

  for (const ev of ['pointerup', 'pointercancel']) {
    window.addEventListener(ev, (e) => {
      if (hold && e.pointerId === hold.id) cancelHold();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (isPanelOpen()) {
      // панель открыта: клавиатура работает как обычно (Tab, Enter…)
      if (e.key === 'Escape') closePanel();
      return;
    }
    e.preventDefault();
    audio.unlock();

    if (/^[a-z]$/i.test(e.key)) {
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf === 'parent') {
        buf = '';
        onParentRequest();
        return;
      }
    }

    const k = e.key;
    if (k === ' ' || k === 'Enter') onAction({ type: 'feed' });
    else if (k.startsWith('Arrow')) onAction({ type: 'current', dir: k });
    else if (/^[0-9]$/.test(k)) onAction({ type: 'digit', d: Number(k) });
    else if (k.length === 1 && /\p{L}/u.test(k)) {
      onAction({ type: 'letter', code: k.toLowerCase().codePointAt(0) });
    } else onAction({ type: 'other' });
  });

  // Защита от случайных жестов браузера.
  for (const ev of ['contextmenu', 'selectstart', 'dragstart']) {
    window.addEventListener(ev, (e) => e.preventDefault());
  }
  const insidePanel = (e) => e.target instanceof Element && e.target.closest('#panel');
  window.addEventListener('wheel', (e) => {
    if (!insidePanel(e)) e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (!insidePanel(e)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('dblclick', (e) => e.preventDefault());

  // Вызывается из главного цикла: прогресс удержания угла.
  function tick() {
    if (!hold) return;
    const p = (performance.now() - hold.t0) / HOLD_MS;
    if (p >= RING_AT) {
      ring.classList.remove('hidden');
      ring.style.left = `${hold.x}px`;
      ring.style.top = `${hold.y}px`;
      ring.style.setProperty('--p', Math.min(1, (p - RING_AT) / (1 - RING_AT)));
    }
    if (p >= 1) {
      cancelHold();
      onParentRequest();
    }
  }

  return { tick };
}
