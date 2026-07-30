// Рыбы: параметрическая отрисовка видов на bezier-путях + поведение
// (блуждание, погоня за кормом, рывок от тапа, уход за кадр).
import { rand, clamp, lerp, angleDiff, dist2, TAU } from '../utils.js';
import { SPECIES, CONFIG } from '../config.js';

const F = CONFIG.fish;

export const STATE = { WANDER: 0, SEEK: 1, DART: 2, LEAVING: 3 };

export class Fish {
  constructor(x, y, speciesIndex, opts = {}) {
    this.sp = SPECIES[((speciesIndex % SPECIES.length) + SPECIES.length) % SPECIES.length];
    this.len = rand(this.sp.size[0], this.sp.size[1]);
    this.cruise = rand(this.sp.speed[0], this.sp.speed[1]);
    this.speed = this.cruise;
    this.x = x;
    this.y = y;
    this.theta = opts.theta ?? (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.3, 0.3);
    this.thetaTarget = this.theta;
    this.retarget = rand(...F.retarget);
    this.state = STATE.WANDER;
    this.entering = opts.entering || false; // заплывает из-за кадра
    this.tailPhase = rand(0, TAU);
    this.bobPhase = rand(0, TAU);
    this.bobFreq = rand(...F.bobFreq);
    this.pushX = 0;
    this.pushY = 0;
    this.happy = 0; // радостное виляние после еды
    this.age = 0;
  }

  update(dt, world) {
    this.age += dt;
    const { w, sandY, ms } = world;
    const topY = CONFIG.waterTop;

    if (this.happy > 0) this.happy -= dt;

    if (this.state === STATE.DART) {
      this.speed = this.cruise + (this.speed - this.cruise) * Math.exp(-F.dartDecay * dt);
      if (this.speed - this.cruise < 8) this.state = STATE.WANDER;
    } else if (this.state === STATE.LEAVING) {
      this.thetaTarget = this.x < w / 2 ? Math.PI : 0;
      this.speed = lerp(this.speed, this.cruise * 1.4, 1 - Math.exp(-2 * dt));
    } else {
      const food = world.nearestFood(this.x, this.y, F.senseRadius);
      if (food) {
        this.state = STATE.SEEK;
        this.thetaTarget = Math.atan2(food.y - this.y, food.x - this.x);
        this.speed = lerp(this.speed, this.cruise * 1.6, 1 - Math.exp(-3 * dt));
        const eatR = F.eatRadius + this.len * 0.18;
        if (dist2(this.x, this.y, food.x, food.y) < eatR * eatR) {
          world.eatFood(food, this);
          this.happy = 0.7;
          this.state = STATE.WANDER;
          this.retarget = 0;
        }
      } else {
        this.state = STATE.WANDER;
        this.speed = lerp(this.speed, this.cruise, 1 - Math.exp(-1.5 * dt));
        this.retarget -= dt;
        if (this.retarget <= 0) {
          this.retarget = rand(...F.retarget);
          // курсы в основном горизонтальные, изредка разворот
          const ahead = Math.cos(this.theta) >= 0 ? 0 : Math.PI;
          const dir = Math.random() < 0.72 ? ahead : Math.PI - ahead;
          this.thetaTarget = dir + rand(-0.5, 0.5);
        }
      }
    }

    // мягкое отталкивание от стен (уплывающим и заплывающим можно за край)
    if (this.state !== STATE.LEAVING && !this.entering) {
      const m = F.wallMargin;
      let ax = 0;
      let ay = 0;
      if (this.x < m) ax += (m - this.x) / m;
      if (this.x > w - m) ax -= (this.x - (w - m)) / m;
      if (this.y < topY + m) ay += (topY + m - this.y) / m;
      if (this.y > sandY - m * 0.6) ay -= (this.y - (sandY - m * 0.6)) / (m * 0.6);
      if (ax !== 0 || ay !== 0) {
        const wallAngle = Math.atan2(ay, ax);
        const wgt = clamp(Math.hypot(ax, ay), 0, 1);
        this.thetaTarget += angleDiff(wallAngle, this.thetaTarget) * wgt;
      }
    }

    const tr = this.state === STATE.SEEK ? F.seekTurnRate
      : this.state === STATE.DART ? F.turnRate * 2 : F.turnRate;
    this.theta += clamp(angleDiff(this.thetaTarget, this.theta), -tr * dt, tr * dt);

    const spd = this.speed * ms;
    this.x += Math.cos(this.theta) * spd * dt + this.pushX * dt;
    this.y += Math.sin(this.theta) * spd * dt + this.pushY * dt;
    const k = Math.exp(-2.5 * dt);
    this.pushX *= k;
    this.pushY *= k;

    if (this.entering) {
      if (this.x > 20 && this.x < w - 20) this.entering = false;
    } else if (this.state !== STATE.LEAVING) {
      this.x = clamp(this.x, 10, w - 10);
    }
    this.y = clamp(this.y, topY, sandY - 8);

    const wag = this.happy > 0 ? 2.2 : 1;
    this.tailPhase += (5 + 6 * (this.speed / this.cruise)) * wag * Math.max(ms, 0.35) * dt;
  }

  dart(fromX, fromY) {
    this.state = STATE.DART;
    this.theta = Math.atan2(this.y - fromY, this.x - fromX);
    this.thetaTarget = this.theta;
    this.speed = this.cruise * F.dartBoost;
  }

  leave() {
    this.state = STATE.LEAVING;
  }

  gone(w) {
    return this.state === STATE.LEAVING
      && (this.x < -this.len * 2 || this.x > w + this.len * 2);
  }

  nudge(dx, dy) {
    this.pushX += dx;
    this.pushY += dy;
  }

  draw(ctx, t) {
    const sp = this.sp;
    const L = this.len;
    const hh = L * sp.height * 0.5;
    const facingLeft = Math.cos(this.theta) < 0;
    const pitch = clamp(
      Math.atan2(Math.sin(this.theta), Math.abs(Math.cos(this.theta))),
      -F.pitchLimit, F.pitchLimit,
    );
    const bob = Math.sin(t * this.bobFreq + this.bobPhase) * F.bobAmp;
    const scale = this.age < 0.35 ? 0.4 + 0.6 * (this.age / 0.35) : 1;
    const wag = Math.sin(this.tailPhase);

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    if (facingLeft) ctx.scale(-1, 1);
    ctx.rotate(pitch);
    if (scale !== 1) ctx.scale(scale, scale);
    if (this.happy > 0) ctx.rotate(Math.sin(t * 30) * 0.06);

    drawTail(ctx, sp, L, wag);
    drawDorsal(ctx, sp, L, hh, wag);
    drawBody(ctx, sp, L, hh);
    drawPattern(ctx, sp, L, hh);
    drawPectoral(ctx, sp, L, hh, this.tailPhase);
    drawEye(ctx, L, hh);
    ctx.restore();
  }
}

// --- отрисовка в локальной системе: рыба смотрит вправо, центр в (0,0) ---

function bodyPath(ctx, L, hh) {
  ctx.beginPath();
  ctx.moveTo(L * 0.5, 0);
  ctx.bezierCurveTo(L * 0.25, -hh * 1.15, -L * 0.2, -hh * 1.1, -L * 0.42, -hh * 0.28);
  ctx.lineTo(-L * 0.42, hh * 0.28);
  ctx.bezierCurveTo(-L * 0.2, hh * 1.1, L * 0.25, hh * 1.15, L * 0.5, 0);
  ctx.closePath();
}

function drawBody(ctx, sp, L, hh) {
  const g = ctx.createLinearGradient(0, -hh, 0, hh);
  g.addColorStop(0, sp.top);
  g.addColorStop(0.55, sp.top);
  g.addColorStop(1, sp.belly);
  bodyPath(ctx, L, hh);
  ctx.fillStyle = g;
  ctx.fill();
}

function drawTail(ctx, sp, L, wag) {
  const TL = L * sp.tail * 0.55;
  const base = -L * 0.4;
  const off = wag * TL * 0.3;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = sp.tailColor || sp.fin;
  ctx.beginPath();
  ctx.moveTo(base, 0);
  ctx.quadraticCurveTo(base - TL * 0.5, -TL * 0.28 + off * 0.4, base - TL, -TL * 0.5 + off);
  ctx.quadraticCurveTo(base - TL * 0.45, off * 0.5, base - TL, TL * 0.5 + off);
  ctx.quadraticCurveTo(base - TL * 0.5, TL * 0.28 + off * 0.4, base, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDorsal(ctx, sp, L, hh, wag) {
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = sp.fin;
  ctx.beginPath();
  ctx.moveTo(L * 0.1, -hh * 0.75);
  ctx.quadraticCurveTo(-L * 0.08, -hh * 1.7 + wag * 1.5, -L * 0.3, -hh * 0.6);
  ctx.quadraticCurveTo(-L * 0.1, -hh * 0.9, L * 0.1, -hh * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPectoral(ctx, sp, L, hh, phase) {
  const flap = Math.sin(phase * 1.3) * 0.35;
  ctx.save();
  ctx.translate(L * 0.12, hh * 0.28);
  ctx.rotate(0.5 + flap);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = sp.fin;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.16, L * 0.05, -L * 0.22, L * 0.16);
  ctx.quadraticCurveTo(-L * 0.08, L * 0.1, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPattern(ctx, sp, L, hh) {
  if (sp.pattern === 'none') return;
  ctx.save();
  bodyPath(ctx, L, hh);
  ctx.clip();
  if (sp.pattern === 'clown-bands') {
    ctx.fillStyle = sp.band;
    for (const bx of [0.24, -0.08]) {
      ctx.beginPath();
      ctx.ellipse(L * bx, 0, L * 0.06, hh * 1.3, 0, 0, TAU);
      ctx.fill();
    }
  } else if (sp.pattern === 'bands') {
    ctx.fillStyle = sp.band;
    ctx.globalAlpha = 0.65;
    for (const bx of [0.18, -0.12]) {
      ctx.fillRect(L * bx - L * 0.045, -hh * 1.3, L * 0.09, hh * 2.6);
    }
  } else if (sp.pattern === 'neon-stripe') {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = sp.stripe;
    ctx.fillRect(-L * 0.45, hh * 0.05, L * 0.55, hh * 0.5);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#b3f3ff';
    ctx.fillRect(-L * 0.45, -hh * 0.25, L * 0.9, hh * 0.28);
  } else if (sp.pattern === 'spot') {
    ctx.fillStyle = sp.spot;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(-L * 0.02, -hh * 0.1, L * 0.22, hh * 0.55, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawEye(ctx, L, hh) {
  const ex = L * 0.3;
  const ey = -hh * 0.18;
  const r = Math.max(2.2, L * 0.055);
  ctx.beginPath();
  ctx.arc(ex, ey, r, 0, TAU);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex + r * 0.25, ey, r * 0.55, 0, TAU);
  ctx.fillStyle = '#1b2733';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex + r * 0.05, ey - r * 0.3, r * 0.2, 0, TAU);
  ctx.fillStyle = '#fff';
  ctx.fill();
}
