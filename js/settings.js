const KEY = 'tinyfins.settings.v1';

const defaults = {
  sound: true,
  reducedMotion: null, // null — следовать системной настройке
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    // приватный режим или запрет storage — работаем в памяти
  }
  return { ...defaults };
}

export const settings = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // некритично: настройки просто не переживут перезагрузку
  }
}

const media = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export function motionReduced() {
  if (settings.reducedMotion !== null) return settings.reducedMotion;
  return media ? media.matches : false;
}
