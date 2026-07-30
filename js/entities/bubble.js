import { rand, TAU } from '../utils.js';

export class Bubble {
  constructor(x, y, r, speed) {
    this.x = x;
    this.y = y;
    this.r = r ?? rand(2, 6);
    this.speed = speed ?? rand(28, 55);
    this.phase = rand(0, TAU);
    this.wobble = rand(0.5, 1.4); // Гц горизонтального покачивания
    this.dead = false;
  }

  update(dt, t, ms, topY) {
    this.y -= this.speed * ms * dt;
    this.x += Math.sin(t * this.wobble * TAU + this.phase) * 12 * ms * dt;
    this.r += 0.8 * dt; // лёгкий рост при подъёме
    if (this.y < topY + this.r) this.dead = true;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x - this.r * 0.35, this.y - this.r * 0.35, this.r * 0.25, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }
}
