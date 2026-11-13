// Вариант B · рисовалка частиц. Один и тот же код работает в Worker (OffscreenCanvas) и,
// как запасной путь, в главном потоке. Пул фиксированный, без аллокаций на тап,
// стирается только грязный прямоугольник прошлого кадра.
export function createRenderer(cv, dpr, sprites, rm) {
  const g = cv.getContext('2d');
  const MAX = 200, PLUS_MS = 760, COIN_MS = 640, GLINT_MS = 340, G = 1100;
  const P = []; for (let i = 0; i < MAX; i++) P.push({ on: false, k: 0, x: 0, y: 0, vx: 0, vy: 0, t0: 0, life: 0, rot: 0, vr: 0, img: null, w: 0, h: 0, ph: 0 });
  let cursor = 0, prev = null, running = false;
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(() => f(performance.now()), 16);
  function spawn() { for (let n = 0; n < MAX; n++) { const p = P[cursor]; cursor = (cursor + 1) % MAX; if (!p.on) { p.on = true; return p; } } return null; }
  // «+1» на каждый тап; тапы чаще 1 раз/70 мс склеиваются в «+2», «+3»…; искры при частых тапах — по 2
  const MERGE = 70; let lastPlus = -1e9, acc = 0, accT = 0, ax = 0, ay = 0, at = 1, accTxt = null;
  function flushPlus(now) {
    accT = 0; if (!acc) return; lastPlus = now;
    const img = sprites.plus[accTxt] || sprites.plus[at === 3 ? '3+2' : at === 2 ? '2+1,5' : '1+1']; acc = 0;
    const p = spawn(); if (p) { p.k = 0; p.img = img; p.w = 130; p.h = 70; p.x = ax + (Math.random() - .5) * 26; p.y = ay - 34; p.t0 = now; p.life = rm ? 600 : PLUS_MS; p.rot = (Math.random() - .5) * .17; }
    if (!running) { running = true; raf(draw); }
  }
  let lastGlint = -1e9;
  function tap({ x, y, tier, gain, seed }) {
    const now = performance.now(); let rnd = seed; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
    acc = Math.round((acc + gain) * 10) / 10; ax = x; ay = y; at = tier; accTxt = tier + '+' + String(acc).replace('.', ',');
    const fast = now - lastPlus < MERGE;
    if (!fast) { clearTimeout(accT); flushPlus(now); } else if (!accT) accT = setTimeout(() => flushPlus(performance.now()), MERGE - (now - lastPlus));
    let p;
    if (!rm) {
      if (now - lastGlint >= MERGE) { lastGlint = now; p = spawn(); if (p) { p.k = 2; p.img = sprites.glint; p.w = p.h = 56; p.x = x; p.y = y; p.t0 = now; p.life = GLINT_MS; p.rot = R() * 1.5; } }
      const n = fast ? 2 : tier > 1 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        p = spawn(); if (!p) break;
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * .55 + (R() - .5) * .3, sp = 300 + R() * 140;
        p.k = 1; p.img = sprites.coin; p.w = p.h = 24 * 1.24; p.x = x; p.y = y - 10; p.vx = Math.cos(a) * sp * .75; p.vy = Math.sin(a) * sp; p.t0 = now; p.life = COIN_MS; p.ph = R() * 6; p.vr = 14 + R() * 8;
      }
    }
    if (!running) { running = true; raf(draw); }
  }
  function draw(now) {
    now = performance.now();
    if (prev) g.clearRect(prev[0], prev[1], prev[2] - prev[0], prev[3] - prev[1]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, alive = 0;
    for (let i = 0; i < MAX; i++) {
      const p = P[i]; if (!p.on) continue;
      const t = (now - p.t0) / p.life;
      if (t >= 1) { p.on = false; continue; }
      if (t < 0) { alive++; continue; }
      alive++;
      let px = p.x, py = p.y, s = 1, sx = 1, a = 1, r = 0;
      if (p.k === 0) {
        if (rm) a = t < .2 ? t / .2 : 1 - (t - .2) / .8;
        else { const e = 1 - Math.pow(1 - t, 3); py = p.y + 10 - e * 94; s = t < .16 ? .5 + t / .16 * .64 : t < .55 ? 1.14 - (t - .16) / .39 * .14 : 1 - (t - .55) / .45 * .1;
          a = t < .16 ? t / .16 : t < .55 ? 1 : 1 - (t - .55) / .45; r = p.rot * (1 - t); }
      } else if (p.k === 1) {
        const ts = t * p.life / 1000; px = p.x + p.vx * ts; py = p.y + p.vy * ts + G * ts * ts / 2;
        s = t < .12 ? .4 + t / .12 * .6 : 1 - t * .35; sx = Math.cos(p.ph + ts * p.vr); sx = (sx < 0 ? -1 : 1) * (.25 + .75 * Math.abs(sx)); a = t > .65 ? 1 - (t - .65) / .35 : 1;
      } else {
        s = .2 + Math.sin(Math.min(1, t * 1.3) * Math.PI / 2) * .95; a = t < .3 ? t / .3 : 1 - (t - .3) / .7; r = p.rot + t * 1.1;
      }
      const m = Math.max(p.w, p.h) * s * .72 + 2;
      if (px - m < x0) x0 = px - m; if (py - m < y0) y0 = py - m; if (px + m > x1) x1 = px + m; if (py + m > y1) y1 = py + m;
      const c = Math.cos(r) * s * dpr, sn = Math.sin(r) * s * dpr;
      g.globalAlpha = a; g.setTransform(c * sx, sn * sx, -sn, c, px * dpr, py * dpr);
      g.drawImage(p.img, -p.w / 2, -p.h / 2, p.w, p.h);
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    prev = alive && x1 > x0 ? [Math.max(0, Math.floor(x0 * dpr)), Math.max(0, Math.floor(y0 * dpr)), Math.min(cv.width, Math.ceil(x1 * dpr)), Math.min(cv.height, Math.ceil(y1 * dpr))] : null;
    if (alive) raf(draw); else running = false;
  }
  return { tap, resize(w, h) { cv.width = w; cv.height = h; prev = null; } };
}
