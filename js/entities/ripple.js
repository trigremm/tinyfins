import { TAU } from '../utils.js';

const LIFE = 0.6;

export class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age > LIFE) this.dead = true;
  }

  draw(ctx) {
    const p = Math.min(1, this.age / LIFE);
    const r = 8 + p * 55;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, TAU);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - p)})`;
    ctx.lineWidth = 3 * (1 - p) + 0.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.55, 0, TAU);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - p)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
