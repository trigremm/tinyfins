// Мир аквариума: состояние сущностей, капы, диспетчер реакций на ввод.
import { CONFIG, SPECIES } from './config.js';
import { rand, randInt, clamp, dist2, sweep } from './utils.js';
import { Fish, STATE } from './entities/fish.js';
import { Bubble } from './entities/bubble.js';
import { Food } from './entities/food.js';
import { Plant } from './entities/plant.js';
import { Crab } from './entities/crab.js';
import { Ripple } from './entities/ripple.js';
import * as audio from './audio.js';
import { motionReduced } from './settings.js';

export class Aquarium {
  constructor(w, h) {
    this.fish = [];
    this.bubbles = [];
    this.food = [];
    this.ripples = [];
    this.plants = [];
    this.crab = null;
    this.emitters = [];
    this.ms = 1; // множитель движения (reduced motion)
    this.resize(w, h);
    this.populate();
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.sandY = h - Math.max(CONFIG.sandMin, h * CONFIG.sandRatio);
    this.decorate();
    for (const f of this.fish) {
      f.x = clamp(f.x, 10, w - 10);
      f.y = clamp(f.y, CONFIG.waterTop, this.sandY - 10);
    }
  }

  decorate() {
    const { w, h, sandY } = this;
    const py = h - (h - sandY) * 0.3; // основание растений чуть внутри песка
    this.plants = [
      new Plant(w * 0.07, py, rand(0.9, 1.2)),
      new Plant(w * 0.16, py, rand(0.6, 0.9)),
      new Plant(w * 0.9, py, rand(0.9, 1.3)),
    ];
    this.crab = new Crab(w * 0.5, h - (h - sandY) * 0.45, w * 0.1, w * 0.9);
    this.emitters = [
      { x: w * 0.12, y: py, t: rand(...CONFIG.bubbles.ambientDelay) },
      { x: w * 0.88, y: py, t: rand(...CONFIG.bubbles.ambientDelay) },
    ];
  }

  populate() {
    this.fish = [];
    for (let i = 0; i < CONFIG.initialFish; i++) {
      this.fish.push(new Fish(
        rand(this.w * 0.1, this.w * 0.9),
        rand(CONFIG.waterTop + 40, this.sandY - 40),
        randInt(0, SPECIES.length - 1),
      ));
    }
  }

  reset() {
    this.bubbles = [];
    this.food = [];
    this.ripples = [];
    this.decorate();
    this.populate();
  }

  update(dt, t) {
    this.ms = motionReduced() ? CONFIG.reducedMotionScale : 1;

    for (const e of this.emitters) {
      e.t -= dt * (this.ms < 1 ? 0.5 : 1);
      if (e.t <= 0) {
        e.t = rand(...CONFIG.bubbles.ambientDelay);
        this.addBubble(e.x + rand(-6, 6), e.y, rand(2, 4.5));
      }
    }

    for (const f of this.fish) f.update(dt, this);
    sweep(this.fish, (f) => f.gone(this.w));

    for (const b of this.bubbles) b.update(dt, t, this.ms, CONFIG.waterTop * 0.4);
    sweep(this.bubbles, (b) => b.dead);

    for (const fd of this.food) fd.update(dt, t, this.ms, this.sandY, CONFIG.food);
    sweep(this.food, (fd) => fd.dead);

    for (const r of this.ripples) r.update(dt);
    sweep(this.ripples, (r) => r.dead);

    this.crab.update(dt, this.ms);
  }

  draw(ctx, t) {
    for (const p of this.plants) p.draw(ctx, t, this.ms);
    this.crab.draw(ctx);
    for (const fd of this.food) fd.draw(ctx);
    for (const f of this.fish) f.draw(ctx, t);
    for (const b of this.bubbles) b.draw(ctx);
    for (const r of this.ripples) r.draw(ctx);
  }

  // --- запросы от рыб ---

  nearestFood(x, y, r) {
    let best = null;
    let bd = r * r;
    for (const f of this.food) {
      if (f.dead) continue;
      const d = dist2(x, y, f.x, f.y);
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    return best;
  }

  eatFood(f, fish) {
    f.dead = true;
    for (let i = 0; i < 3; i++) {
      this.addBubble(fish.x + rand(-6, 6), fish.y + rand(-6, 6), rand(1.5, 3));
    }
    audio.gulp();
  }

  // --- добавление сущностей с капами ---

  addBubble(x, y, r, speed) {
    if (this.bubbles.length >= CONFIG.maxBubbles) this.bubbles.shift();
    this.bubbles.push(new Bubble(x, y, r, speed));
  }

  addRipple(x, y) {
    if (this.ripples.length >= CONFIG.maxRipples) this.ripples.shift();
    this.ripples.push(new Ripple(x, y));
  }

  addFood(x, y) {
    if (this.food.length >= CONFIG.maxFood) this.food.shift();
    this.food.push(new Food(x, y));
  }

  addFish(fish) {
    let active = 0;
    for (const f of this.fish) {
      if (f.state !== STATE.LEAVING) active++;
    }
    if (active >= CONFIG.maxFish) {
      // самая старая рыба красиво уплывает за край вместо исчезновения
      const oldest = this.fish.find((f) => f.state !== STATE.LEAVING);
      if (oldest) oldest.leave();
    }
    this.fish.push(fish);
  }

  // --- реакции на ввод: каждое действие даёт видимый + слышимый отклик ---

  react(a) {
    switch (a.type) {
      case 'tap': this.tap(a.x, a.y); break;
      case 'letter': this.letter(a.code); break;
      case 'digit': this.bubbleColumn(a.d); break;
      case 'feed': this.feed(); break;
      case 'current': this.current(a.dir); break;
      default: this.splash();
    }
  }

  tap(x, y) {
    this.addRipple(x, y);
    const n = randInt(3, 6);
    for (let i = 0; i < n; i++) {
      this.addBubble(x + rand(-14, 14), y + rand(-10, 10), rand(1.5, 4));
    }
    audio.blub();

    // ближайшая рыба в радиусе — шарахается
    let near = null;
    let bd = CONFIG.fish.dartRadius ** 2;
    for (const f of this.fish) {
      const d = dist2(x, y, f.x, f.y);
      if (d < bd) {
        bd = d;
        near = f;
      }
    }
    if (near) {
      if (!motionReduced()) near.dart(x, y);
      return;
    }

    const roll = Math.random();
    if (roll < 0.5) {
      this.addFood(x, Math.min(y, this.sandY - 20));
    } else if (roll < 0.8) {
      this.fishFromEdge(x, y);
    } else {
      for (let i = 0; i < 10; i++) {
        this.addBubble(x + rand(-24, 24), y + rand(-18, 18), rand(2, 6));
      }
      audio.pop();
    }
  }

  letter(code) {
    audio.chime(code);
    const f = new Fish(
      rand(this.w * 0.12, this.w * 0.88),
      rand(CONFIG.waterTop + 40, this.sandY - 40),
      code % SPECIES.length, // у каждой буквы всегда один и тот же вид
    );
    this.addFish(f);
    for (let i = 0; i < 4; i++) {
      this.addBubble(f.x + rand(-12, 12), f.y + rand(-10, 10), rand(1.5, 3.5));
    }
  }

  fishFromEdge(tx, ty) {
    const fromLeft = tx < this.w / 2;
    const x = fromLeft ? -40 : this.w + 40;
    const y = clamp(ty + rand(-60, 60), CONFIG.waterTop + 30, this.sandY - 30);
    const f = new Fish(x, y, randInt(0, SPECIES.length - 1), {
      theta: Math.atan2(ty - y, tx - x),
      entering: true,
    });
    this.addFish(f);
  }

  bubbleColumn(d) {
    const x = this.w * (0.08 + 0.84 * (d / 9));
    for (let i = 0; i < 9; i++) {
      this.addBubble(x + rand(-8, 8), this.sandY - 6 + i * 16, rand(2, 5));
    }
    audio.pop();
  }

  feed() {
    const n = randInt(3, 5);
    for (let i = 0; i < n; i++) {
      this.addFood(rand(this.w * 0.15, this.w * 0.85), rand(10, 60));
    }
    audio.sprinkle();
  }

  current(dir) {
    const v = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[dir] || [1, 0];
    for (const f of this.fish) f.nudge(v[0] * 90 * this.ms, v[1] * 60 * this.ms);
    audio.swoosh();
  }

  splash() {
    const x = rand(this.w * 0.2, this.w * 0.8);
    const y = rand(this.h * 0.2, this.h * 0.6);
    for (let i = 0; i < 6; i++) {
      this.addBubble(x + rand(-20, 20), y + rand(-14, 14), rand(2, 5));
    }
    audio.blub();
  }
}
