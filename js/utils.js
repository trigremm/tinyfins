export const TAU = Math.PI * 2;

export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function dist2(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Кратчайшая знаковая разница углов a−b в диапазоне [−PI, PI].
export function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// Удаление «мёртвых» элементов без аллокации нового массива (swap-remove).
export function sweep(arr, isDead) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (isDead(arr[i])) {
      arr[i] = arr[arr.length - 1];
      arr.pop();
    }
  }
}
