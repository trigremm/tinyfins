import { rand, TAU } from '../utils.js';

export class Crab {
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.minX = minX;
    this.maxX = maxX;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.walking = true;
    this.timer = rand(2, 5);
    this.legPhase = 0;
  }

  update(dt, ms) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.walking = !this.walking;
      if (this.walking && Math.random() < 0.6) this.dir *= -1;
      this.timer = this.walking ? rand(2, 6) : rand(1, 3);
    }
    if (this.walking) {
      this.x += this.dir * 16 * ms * dt;
      this.legPhase += 9 * ms * dt;
      if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
      if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // ноги
    ctx.strokeStyle = '#b5432e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 3; i++) {
        const wig = this.walking ? Math.sin(this.legPhase + i * 1.3 + (s > 0 ? 0 : 1.6)) * 3 : 0;
        ctx.beginPath();
        ctx.moveTo(s * 8, 2 + i);
        ctx.lineTo(s * (14 + i * 3), 8 + wig);
        ctx.stroke();
      }
    }

    // клешни
    ctx.fillStyle = '#d9502f';
    ctx.beginPath();
    ctx.arc(-13, -4, 4.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, -4, 4.5, 0, TAU);
    ctx.fill();

    // тело
    const g = ctx.createRadialGradient(0, -4, 2, 0, -2, 13);
    g.addColorStop(0, '#f07850');
    g.addColorStop(1, '#c74a2b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 8.5, 0, 0, TAU);
    ctx.fill();

    // глаза на стебельках
    ctx.strokeStyle = '#a63b22';
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, -8);
      ctx.lineTo(s * 5, -13);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s * 5, -14.5, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(s * 5, -14.5, 1.1, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}
