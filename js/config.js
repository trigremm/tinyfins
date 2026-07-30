// Все настройки аквариума в одном месте — подкручивать здесь.
export const CONFIG = {
  initialFish: 8,
  maxFish: 18,
  maxBubbles: 120,
  maxFood: 15,
  maxRipples: 10,

  waterTop: 26,       // верхняя граница плавания, px
  sandRatio: 0.11,    // доля высоты экрана под песок
  sandMin: 36,

  fish: {
    senseRadius: 400, // радиус, в котором рыба видит корм
    eatRadius: 12,
    dartRadius: 90,   // тап ближе этого — рыба шарахается
    dartBoost: 3.5,
    dartDecay: 2.8,   // скорость затухания рывка, 1/с
    turnRate: 2.0,    // рад/с в спокойном плавании
    seekTurnRate: 4.5,
    wallMargin: 60,
    pitchLimit: 0.61, // ~35°: рыбы не плавают вертикально
    retarget: [2, 5], // сек между сменами направления
    bobAmp: 3.2,
    bobFreq: [0.9, 1.6],
  },

  bubbles: {
    ambientDelay: [1, 3], // сек между пузырьками фоновых эмиттеров
  },

  food: {
    sink: 26,         // скорость погружения, px/с
    life: 12,         // сек на дне до исчезновения
  },

  reducedMotionScale: 0.35,
};

// Виды рыб: size — длина в px, height — доля длины, speed — px/с,
// tail — длина хвоста как доля тела.
export const SPECIES = [
  { name: 'goldfish', size: [40, 56], height: 0.62, speed: [26, 42], tail: 0.85,
    top: '#ff8c2e', belly: '#ffd9a0', fin: '#ffb25e', pattern: 'none' },
  { name: 'neon', size: [22, 30], height: 0.42, speed: [46, 66], tail: 0.55,
    top: '#3ec6f0', belly: '#e8fbff', fin: '#9fe8ff', pattern: 'neon-stripe', stripe: '#ff4d6d' },
  { name: 'angelfish', size: [42, 58], height: 1.1, speed: [22, 34], tail: 0.5,
    top: '#cfd8dc', belly: '#f5f7f8', fin: '#b0bec5', pattern: 'bands', band: '#37474f' },
  { name: 'clownfish', size: [30, 44], height: 0.6, speed: [32, 50], tail: 0.6,
    top: '#ff7a1a', belly: '#ffb066', fin: '#ff8c33', pattern: 'clown-bands', band: '#fff8f0' },
  { name: 'guppy', size: [20, 28], height: 0.5, speed: [36, 56], tail: 1.15, tailColor: '#ffd54f',
    top: '#7c4dff', belly: '#d1c4ff', fin: '#b388ff', pattern: 'none' },
  { name: 'tang', size: [34, 48], height: 0.72, speed: [30, 48], tail: 0.6, tailColor: '#ffd600',
    top: '#2962ff', belly: '#82b1ff', fin: '#448aff', pattern: 'spot', spot: '#0d2a66' },
];
