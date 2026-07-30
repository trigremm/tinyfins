// Панель родителя: DOM поверх живого аквариума.
import { settings, save, motionReduced } from './settings.js';
import * as audio from './audio.js';

export function initPanel({ aquarium }) {
  const panel = document.getElementById('panel');
  const btnSound = document.getElementById('btn-sound');
  const btnMotion = document.getElementById('btn-motion');
  const btnFs = document.getElementById('btn-fullscreen');
  const btnReset = document.getElementById('btn-reset');
  const btnClose = document.getElementById('panel-close');

  function refresh() {
    btnSound.textContent = `Звук: ${settings.sound ? 'вкл' : 'выкл'}`;
    btnMotion.textContent = `Меньше движения: ${motionReduced() ? 'вкл' : 'выкл'}`;
    btnFs.textContent = document.fullscreenElement ? 'Выйти из полного экрана' : 'Полный экран';
  }

  function open() {
    refresh();
    panel.classList.remove('hidden');
    btnClose.focus();
  }

  function close() {
    panel.classList.add('hidden');
  }

  function isOpen() {
    return !panel.classList.contains('hidden');
  }

  btnSound.addEventListener('click', () => {
    settings.sound = !settings.sound;
    save();
    audio.setMuted(!settings.sound);
    refresh();
  });

  btnMotion.addEventListener('click', () => {
    // явный выбор родителя перекрывает системную настройку
    settings.reducedMotion = !motionReduced();
    save();
    refresh();
  });

  btnFs.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', refresh);

  btnReset.addEventListener('click', () => {
    aquarium.reset();
    close();
  });

  btnClose.addEventListener('click', close);
  panel.addEventListener('pointerdown', (e) => {
    if (e.target === panel) close(); // тап по затемнению закрывает панель
  });

  return { open, close, isOpen };
}
