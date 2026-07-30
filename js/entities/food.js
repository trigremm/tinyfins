import { rand, pick, TAU } from '../utils.js';

const COLORS = ['#c96f3b', '#b85c2e', '#d98a4a'];

export class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = rand(3, 4.5);
    this.vx = rand(-6, 6);
    this.phase = rand(0, TAU);
    this.color = pick(COLORS);
    this.rest = 0; // сколько секунд лежит на дне
    this.life = 1; // альфа при исчезании
    this.dead = false;
  }

  update(dt, t, ms, sandY, cfg) {
    if (this.y < sandY - this.r) {
      this.y += cfg.sink * ms * dt;
      this.x += (this.vx + Math.sin(t * 2 + this.phase) * 6) * ms * dt;
    } else {
      this.rest += dt;
      if (this.rest > cfg.life) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      }
    }
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
