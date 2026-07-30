import { rand, pick, TAU } from '../utils.js';

const GREENS = [
  ['#1e8a54', '#35b374'],
  ['#187347', '#2ba05f'],
  ['#27995f', '#4cc98a'],
];

export class Plant {
  constructor(x, baseY, scale = 1) {
    this.x = x;
    this.baseY = baseY;
    this.blades = [];
    const n = Math.round(rand(3, 6));
    for (let i = 0; i < n; i++) {
      this.blades.push({
        dx: rand(-16, 16) * scale,
        len: rand(60, 150) * scale,
        w: rand(7, 13) * scale,
        lean: rand(-22, 22),
        phase: rand(0, TAU),
        freq: rand(0.5, 0.9),
        colors: pick(GREENS),
      });
    }
  }

  draw(ctx, t, ms) {
    for (const b of this.blades) {
      const sway = Math.sin(t * b.freq + b.phase) * b.len * 0.1 * Math.max(0.25, ms);
      const x0 = this.x + b.dx;
      const tipX = x0 + b.lean + sway;
      const tipY = this.baseY - b.len;
      const g = ctx.createLinearGradient(0, this.baseY, 0, tipY);
      g.addColorStop(0, b.colors[0]);
      g.addColorStop(1, b.colors[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0 - b.w / 2, this.baseY);
      ctx.quadraticCurveTo(
        x0 - b.w / 2 + b.lean * 0.2 + sway * 0.35, this.baseY - b.len * 0.55,
        tipX, tipY,
      );
      ctx.quadraticCurveTo(
        x0 + b.w / 2 + b.lean * 0.2 + sway * 0.35, this.baseY - b.len * 0.5,
        x0 + b.w / 2, this.baseY,
      );
      ctx.closePath();
      ctx.fill();
    }
  }
}
