// Статичный фон (вода, песок, камни) кэшируется в offscreen-canvas и
// перерисовывается только при resize; лучи света рисуются каждый кадр.
import { rand, TAU } from './utils.js';

export class Background {
  constructor() {
    this.cache = document.createElement('canvas');
    this.w = 0;
    this.h = 0;
    this.rays = [];
  }

  render(w, h, sandY, dpr) {
    this.w = w;
    this.h = h;
    const c = this.cache;
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.paint(g, w, h, sandY);
    if (!this.rays.length) this.initRays();
  }

  blit(ctx, w, h) {
    ctx.drawImage(this.cache, 0, 0, w, h);
  }

  paint(g, w, h, sandY) {
    const water = g.createLinearGradient(0, 0, 0, h);
    water.addColorStop(0, '#2f9fc9');
    water.addColorStop(0.5, '#1c6f9b');
    water.addColorStop(1, '#0d3d5f');
    g.fillStyle = water;
    g.fillRect(0, 0, w, h);

    // валуны — за песком, чтобы кромка их прикрывала
    this.rock(g, w * 0.3, sandY + 6, 1);
    this.rock(g, w * 0.78, sandY + 8, 1.4);

    // песок с волнистой кромкой
    const sand = g.createLinearGradient(0, sandY, 0, h);
    sand.addColorStop(0, '#e3c07f');
    sand.addColorStop(1, '#bd9552');
    g.fillStyle = sand;
    g.beginPath();
    g.moveTo(0, sandY + 6);
    const dunes = 5;
    for (let i = 1; i <= dunes; i++) {
      const x = (w / dunes) * i;
      const y = sandY + (i % 2 === 0 ? 2 : 10);
      g.quadraticCurveTo(x - w / dunes / 2, sandY + (i % 2 === 0 ? 14 : -2), x, y);
    }
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();

    // камешки на песке
    g.fillStyle = 'rgba(120, 96, 60, 0.5)';
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      g.ellipse(rand(0, w), rand(sandY + 12, h - 4), rand(2, 5), rand(1.5, 3), 0, 0, TAU);
      g.fill();
    }
  }

  rock(g, x, y, s) {
    const tones = ['#5d7181', '#4a5d6e', '#69818f'];
    for (let i = 0; i < 3; i++) {
      g.fillStyle = tones[i];
      g.beginPath();
      g.ellipse(
        x + (i - 1) * 24 * s,
        y - 10 * s - (i === 1 ? 10 * s : 0),
        22 * s - i * 3,
        16 * s - i * 2,
        (i - 1) * 0.15,
        0, TAU,
      );
      g.fill();
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.08)';
    g.beginPath();
    g.ellipse(x, y - 22 * s, 24 * s, 7 * s, -0.1, 0, TAU);
    g.fill();
  }

  initRays() {
    this.rays = [];
    for (let i = 0; i < 4; i++) {
      this.rays.push({
        x: 0.12 + i * 0.24 + rand(-0.04, 0.04),
        wTop: rand(12, 26),
        spread: rand(40, 90),
        skew: rand(20, 70),
        alpha: rand(0.035, 0.06),
        freq: rand(0.05, 0.12),
        phase: rand(0, TAU),
      });
    }
  }

  drawRays(ctx, t, ms) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.rays) {
      const sway = Math.sin(t * r.freq * TAU + r.phase);
      const a = Math.max(0.012, r.alpha + 0.025 * sway * ms);
      const x = r.x * this.w + sway * this.w * 0.015 * ms;
      const g = ctx.createLinearGradient(0, 0, 0, this.h * 0.8);
      g.addColorStop(0, `rgba(255, 255, 240, ${a})`);
      g.addColorStop(1, 'rgba(255, 255, 240, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - r.wTop, -8);
      ctx.lineTo(x + r.wTop, -8);
      ctx.lineTo(x + r.wTop + r.spread, this.h * 0.8);
      ctx.lineTo(x - r.wTop - r.spread * 0.4 + r.skew, this.h * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
