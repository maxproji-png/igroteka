// Тапыши · тапалка: лёгкие монетки (пул, один rAF), комбо, пружинки
export const S = { coins: 12000, energy: 330, max: 330, power: 1, price: 1800, regen: 1, combo: 0, mult: 1, last: 0, lvl: 7 };
export const COMBO_MS = 1000;
const $$ = s => Array.from(document.querySelectorAll(s));
export const fmt = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
export const fmtMult = m => '×' + String(m).replace('.', ',');
const H = { render: [], combo: [], threshold: [], end: [] };
export const on = (k, f) => { H[k].push(f); if (k === 'render') f(S); };

let shown = S.coins;
let hudDirty = false;
let bumpPending = false;
let lastComboN = -1, lastRemBucket = -1, comboTap = false;

const coinSel = { coins: null, energy: null, max: null, entimer: null, notfull: null, energyW: null, energyH: null, ups: null, coinTarget: null };
function cache() {
  if (coinSel.coins) return coinSel;
  coinSel.coins = $$('[data-b="coins"]');
  coinSel.energy = $$('[data-b="energy"]');
  coinSel.max = $$('[data-b="max"]');
  coinSel.entimer = $$('[data-b="entimer"]');
  coinSel.notfull = $$('[data-if="notfull"]');
  coinSel.energyW = $$('[data-w="energy"]');
  coinSel.energyH = $$('[data-h="energy"]');
  coinSel.ups = $$('.up');
  coinSel.coinTarget = document.querySelector('[data-coin-target]');
  return coinSel;
}
export function render() {
  const el = cache();
  const set = (nodes, v) => { for (let i = 0; i < nodes.length; i++) nodes[i].textContent = v; };
  set(el.coins, fmt(shown)); set(el.energy, fmt(S.energy)); set(el.max, fmt(S.max));
  const s = Math.ceil((S.max - S.energy) / S.regen);
  set(el.entimer, s < 60 ? s + '\u00a0с' : Math.ceil(s / 60) + '\u00a0мин');
  el.notfull.forEach(e => { e.classList.toggle('hide', S.energy >= S.max); });
  const w = (S.energy / S.max * 100) + '%';
  el.energyW.forEach(e => { e.style.width = w; });
  el.energyH.forEach(e => { e.style.height = w; });
  el.ups.forEach(b => { b.classList.toggle('ready', S.coins >= S.price); b.classList.toggle('short', S.coins < S.price); });
  H.render.forEach(f => f(S));
}
function requestHud() { hudDirty = true; }
setInterval(() => { if (S.energy < S.max && performance.now() - S.last > 600) { S.energy = Math.min(S.max, S.energy + S.regen); requestHud(); } }, 1000);

// пружинки
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.spring'); if (!b) return;
  b.classList.remove('boing'); b.classList.add('is-down');
  const up = () => { b.classList.remove('is-down'); b.classList.add('boing'); setTimeout(() => b.classList.remove('boing'), 450);
    removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
});

/* ---------- пул эффектов, один rAF ---------- */
const MAX_COINS = 7;
const coinPool = [], activeCoins = [];
let plusEl = null, plusUntil = 0, lastPlusAt = 0;
const sparkPool = [], activeSparks = [];
const MAX_SPARKS = 4;

function appEl() { return document.querySelector('.app'); }

function makeCoin() {
  const c = document.createElement('div');
  c.className = 'fcoin';
  c.innerHTML = '<i class="coin-dot"></i>';
  c.style.display = 'none';
  appEl().appendChild(c);
  return c;
}
function takeCoin() {
  if (coinPool.length) return coinPool.pop();
  if (activeCoins.length + coinPool.length >= MAX_COINS) return null;
  return makeCoin();
}
function makePlus() {
  const p = document.createElement('div');
  p.className = 'plus';
  p.innerHTML = '<b></b>';
  p.style.display = 'none';
  appEl().appendChild(p);
  return p;
}
function takeSpark() {
  if (sparkPool.length) return sparkPool.pop();
  if (activeSparks.length >= MAX_SPARKS) return null;
  const s = document.createElement('i');
  s.className = 'spark';
  s.style.display = 'none';
  appEl().appendChild(s);
  return s;
}

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

function tickEffects(now) {
  for (let i = activeCoins.length - 1; i >= 0; i--) {
    const c = activeCoins[i];
    const t = Math.min(1, (now - c.t0) / c.dur);
    const u = easeOut(t), inv = 1 - u;
    const x = inv * inv * c.sx + 2 * inv * u * c.mx + u * u * c.tx;
    const y = inv * inv * c.sy + 2 * inv * u * c.my + u * u * c.ty;
    const sc = t < .2 ? .35 + t / .2 * c.s0 : t > .82 ? c.s0 * (1 - (t - .82) / .18 * .45) : c.s0;
    const op = t < .08 ? t / .08 : t > .88 ? Math.max(0, 1 - (t - .88) / .12) : 1;
    c.el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scale(' + sc + ')';
    c.el.style.opacity = op;
    if (t >= 1) {
      c.el.style.display = 'none';
      coinPool.push(c.el);
      shown = Math.min(S.coins, shown + c.gain);
      bumpPending = true;
      hudDirty = true;
      activeCoins.splice(i, 1);
    }
  }
  if (!activeCoins.length && shown !== S.coins) { shown = S.coins; hudDirty = true; }

  for (let i = activeSparks.length - 1; i >= 0; i--) {
    const s = activeSparks[i];
    const t = Math.min(1, (now - s.t0) / s.dur);
    s.el.style.transform = 'translate(' + (s.x + s.dx * t) + 'px,' + (s.y + s.dy * t) + 'px) scale(' + (1 - t * .7) + ')';
    s.el.style.opacity = String(1 - t);
    if (t >= 1) {
      s.el.style.display = 'none';
      sparkPool.push(s.el);
      activeSparks.splice(i, 1);
    }
  }

  if (plusEl && plusUntil && now >= plusUntil) {
    plusEl.style.display = 'none';
    plusUntil = 0;
  }

  if (bumpPending) {
    bumpPending = false;
    const t = cache().coinTarget;
    if (t) { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }
  }
}

function tickCombo(now) {
  if (S.combo <= 0 && lastComboN < 0 && !comboTap) return;
  if (S.combo > 0) {
    const rem = window.__holdCombo ? window.__holdCombo : Math.max(0, 1 - (now - S.last) / COMBO_MS);
    if (rem <= 0) {
      const n = S.combo; S.combo = 0; S.mult = 1;
      lastComboN = -1; lastRemBucket = -1; comboTap = false;
      H.end.forEach(f => f(n));
      return;
    }
    const bucket = (rem * 10) | 0;
    if (comboTap || S.combo !== lastComboN || bucket !== lastRemBucket) {
      lastComboN = S.combo; lastRemBucket = bucket;
      const tap = comboTap; comboTap = false;
      H.combo.forEach(f => f({ n: S.combo, mult: S.mult, rem, active: true, tap }));
    }
  }
}

(function loop(now) {
  tickEffects(now);
  tickCombo(now);
  if (hudDirty) { hudDirty = false; render(); }
  requestAnimationFrame(loop);
})();

function targetXY(ar) {
  const el = cache().coinTarget;
  const icon = el && (el.querySelector('svg') || el);
  if (!icon) return { x: 48, y: 40 };
  const tr = icon.getBoundingClientRect();
  return { x: tr.left + tr.width / 2 - ar.left, y: tr.top + tr.height / 2 - ar.top };
}

export function coinBurst(x, y, count, gain) {
  const app = appEl(); if (!app) return;
  const ar = app.getBoundingClientRect();
  const tgt = targetXY(ar);
  const sx = x - ar.left, sy = y - ar.top;
  const n = Math.max(1, count);
  const per = gain / n;
  let spawned = 0;
  for (let i = 0; i < n; i++) {
    const el = takeCoin();
    if (!el) break;
    const ang = -Math.PI / 2 + (i - (n - 1) / 2) * .5 + (Math.random() - .5) * .35;
    const rad = 48 + Math.random() * 28;
    const mx = sx + Math.cos(ang) * rad;
    const my = sy + Math.sin(ang) * rad - 18;
    el.style.display = 'block';
    el.style.opacity = '0';
    el.style.transform = 'translate(' + sx + 'px,' + sy + 'px) translate(-50%,-50%) scale(.3)';
    activeCoins.push({
      el, sx, sy, mx, my, tx: tgt.x, ty: tgt.y,
      t0: performance.now() + i * 18, dur: 500 + Math.random() * 80,
      s0: .7 + Math.random() * .2, gain: per
    });
    spawned++;
  }
  // если пул занят — сразу зачисляем остаток, без новых нод
  if (spawned < n) { shown = Math.min(S.coins, shown + per * (n - spawned)); hudDirty = true; }

  // «+N» — один узел, не чаще чем раз в 90 мс
  const now = performance.now();
  if (now - lastPlusAt >= 90) {
    lastPlusAt = now;
    if (!plusEl) plusEl = makePlus();
    const b = plusEl.querySelector('b');
    b.textContent = '+' + String(gain).replace('.', ',');
    plusEl.className = 'plus' + (S.mult >= 2 ? ' x2' : S.mult > 1 ? ' x15' : '');
    plusEl.style.display = 'block';
    plusEl.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
    plusEl.classList.remove('go'); void plusEl.offsetWidth; plusEl.classList.add('go');
    plusUntil = now + 620;
  }

  // искорки только если не в серии: максимум 4 на весь экран
  if (activeCoins.length <= 4 && activeSparks.length < 2) {
    const k = 3;
    for (let i = 0; i < k; i++) {
      const el = takeSpark(); if (!el) break;
      const a = Math.PI * 2 * i / k + Math.random() * .4, d = 22 + Math.random() * 18;
      el.className = 'spark' + (i % 2 ? ' alt' : '');
      el.style.display = 'block';
      el.style.opacity = '1';
      el.style.transform = 'translate(' + sx + 'px,' + sy + 'px) scale(1)';
      activeSparks.push({ el, x: sx, y: sy, dx: Math.cos(a) * d, dy: Math.sin(a) * d, t0: now, dur: 380 });
    }
  }
}

export function thresholdFlash(mult) {
  const app = appEl();
  const old = app.querySelector('.flash'); if (old) old.remove();
  const f = document.createElement('div'); f.className = 'flash' + (mult >= 2 ? ' x2' : '');
  f.innerHTML = '<div class="big">' + fmtMult(mult) + '!</div><div class="sub">' + (mult >= 2 ? 'Двойные монеты' : 'Монеты ×1,5') + '</div>';
  app.appendChild(f); setTimeout(() => { if (!window.__freeze) f.remove(); }, 1100);
}

export function doTap(x, y) {
  if (S.energy < 1) return false;
  const now = performance.now();
  S.combo = (window.__holdCombo && S.combo > 0) || now - S.last < COMBO_MS ? S.combo + 1 : 1; S.last = now;
  const prev = S.mult; S.mult = S.combo >= 50 ? 2 : S.combo >= 20 ? 1.5 : 1;
  const gain = S.power * S.mult; S.energy -= 1; S.coins += gain;
  // при частых тапах выпускаем меньше монет — пул и так держит потолок
  const want = S.mult >= 2 ? 2 : 2;
  coinBurst(x, y, want, gain);
  if (S.mult > prev) { thresholdFlash(S.mult); H.threshold.forEach(f => f(S.mult)); }
  comboTap = true;
  const hint = document.querySelector('.tap-hint');
  if (hint) { hint.classList.add('gone'); clearTimeout(window.__hintT);
    window.__hintT = setTimeout(() => hint.classList.remove('gone'), 5000); }
  requestHud();
  return true;
}

export function comboColor(n) {
  const s = getComputedStyle(document.documentElement);
  const v = k => s.getPropertyValue(k).trim();
  return n >= 50 ? [v('--pink'), v('--pink-edge')]
    : n >= 20 ? [v('--violet'), v('--pink')]
    : n >= 10 ? [v('--violet'), v('--violet-edge')]
    : [v('--violet'), v('--violet-edge')];
}
render();
