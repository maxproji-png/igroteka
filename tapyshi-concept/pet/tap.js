// Тапыши v3 · тапалка: монеты, энергия, комбо, монетки в полёте, пружинки
export const S = { coins: 12000, energy: 330, max: 330, power: 1, price: 1800, regen: 1, combo: 0, mult: 1, last: 0, lvl: 7 };
export const COMBO_MS = 1000;
const $$ = s => Array.from(document.querySelectorAll(s));
export const fmt = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
export const fmtMult = m => '×' + String(m).replace('.', ',');
const H = { render: [], combo: [], threshold: [], end: [] };
export const on = (k, f) => { H[k].push(f); if (k === 'render') f(S); };
let shown = S.coins;
export function render() {
  const set = (k, v) => $$('[data-b="' + k + '"]').forEach(e => { e.textContent = v; });
  set('coins', fmt(shown)); set('energy', fmt(S.energy)); set('max', fmt(S.max));
  const s = Math.ceil((S.max - S.energy) / S.regen); set('entimer', s < 60 ? s + '\u00a0с' : Math.ceil(s / 60) + '\u00a0мин');
  $$('[data-if="notfull"]').forEach(e => e.classList.toggle('hide', S.energy >= S.max));
  $$('[data-w="energy"]').forEach(e => { e.style.width = (S.energy / S.max * 100) + '%'; });
  $$('[data-h="energy"]').forEach(e => { e.style.height = (S.energy / S.max * 100) + '%'; });
  $$('.up').forEach(b => { b.classList.toggle('ready', S.coins >= S.price); b.classList.toggle('short', S.coins < S.price); });
  H.render.forEach(f => f(S));
}
setInterval(() => { if (S.energy < S.max && performance.now() - S.last > 600) { S.energy = Math.min(S.max, S.energy + S.regen); render(); } }, 1000);

// пружинки
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.spring'); if (!b) return;
  b.classList.remove('boing'); b.classList.add('is-down');
  const up = () => { b.classList.remove('is-down'); void b.offsetWidth; b.classList.add('boing'); setTimeout(() => b.classList.remove('boing'), 450);
    removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
});

// комбо: тикер
(function tick() {
  const now = performance.now();
  if (S.combo > 0) {
    const rem = window.__holdCombo ? window.__holdCombo : Math.max(0, 1 - (now - S.last) / COMBO_MS);
    if (rem <= 0) { const n = S.combo; S.combo = 0; S.mult = 1; H.end.forEach(f => f(n)); }
    H.combo.forEach(f => f({ n: S.combo, mult: S.mult, rem, active: S.combo > 0 }));
  }
  requestAnimationFrame(tick);
})();

const COIN = '<svg class="ic"><use href="#i-coin"/></svg>';
function bumpBalance() { $$('[data-coin-target]').forEach(b => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }); }
// монетки по дугам к балансу
export function coinBurst(x, y, count, gain) {
  const app = document.querySelector('.app'), ar = app.getBoundingClientRect();
  const tgtEl = document.querySelector('[data-coin-target] svg') || document.querySelector('[data-coin-target]');
  const tr = tgtEl.getBoundingClientRect(), tx = tr.left + tr.width / 2 - ar.left, ty = tr.top + tr.height / 2 - ar.top;
  const sx = x - ar.left, sy = y - ar.top; let landed = 0;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div'); c.className = 'fcoin'; c.innerHTML = COIN; app.appendChild(c);
    const a = -Math.PI / 2 + (i - (count - 1) / 2) * .55 + (Math.random() - .5) * .3, r = 60 + Math.random() * 40;
    const px = sx + Math.cos(a) * r, py = sy + Math.sin(a) * r - 20;
    const mx = (px + tx) / 2 + (Math.random() - .5) * 60, my = Math.min(py, ty) - 40;
    const s0 = .7 + Math.random() * .3;
    const anim = c.animate([
      { transform: `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(.3) rotateY(0deg)`, opacity: 0 },
      { transform: `translate(${px}px,${py}px) translate(-50%,-50%) scale(${s0 * 1.15}) rotateY(200deg)`, opacity: 1, offset: .3, easing: 'cubic-bezier(.3,0,.6,1)' },
      { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(${s0}) rotateY(420deg)`, opacity: 1, offset: .65, easing: 'cubic-bezier(.4,0,.8,.6)' },
      { transform: `translate(${tx}px,${ty}px) translate(-50%,-50%) scale(.5) rotateY(720deg)`, opacity: .9 }
    ], { duration: 820 + i * 70, easing: 'ease-out', fill: 'forwards', delay: i * 25 });
    anim.onfinish = () => { if (window.__freeze) return; c.remove(); landed++; bumpBalance(); shown = Math.min(S.coins, shown + gain / count); if (landed === count) shown = S.coins; render(); };
  }
  // «+N» в точке тапа
  const p = document.createElement('div'); p.className = 'plus' + (S.mult >= 2 ? ' x2' : S.mult > 1 ? ' x15' : '');
  p.style.left = sx + 'px'; p.style.top = sy + 'px'; p.innerHTML = '<b>+' + String(gain).replace('.', ',') + '</b>';
  app.appendChild(p); setTimeout(() => { if (!window.__freeze) p.remove(); }, 900);
  for (let i = 0; i < 8; i++) { const s = document.createElement('i'); s.className = 'spark'; const a = Math.PI * 2 * i / 8, d = 30 + Math.random() * 26;
    s.style.left = (sx - 5) + 'px'; s.style.top = (sy - 5) + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    if (i % 2) s.classList.add('alt'); app.appendChild(s); setTimeout(() => { if (!window.__freeze) s.remove(); }, 620); }
}
// вспышка на пороге множителя
export function thresholdFlash(mult) {
  const app = document.querySelector('.app');
  const f = document.createElement('div'); f.className = 'flash' + (mult >= 2 ? ' x2' : '');
  f.innerHTML = '<div class="burst"></div><div class="big">' + fmtMult(mult) + '!</div><div class="sub">' + (mult >= 2 ? 'Двойные монеты' : 'Монеты ×1,5') + '</div>';
  app.appendChild(f); setTimeout(() => { if (!window.__freeze) f.remove(); }, 1300);
}
// один тап
export function doTap(x, y) {
  if (S.energy < 1) return false;
  const now = performance.now();
  S.combo = (window.__holdCombo && S.combo > 0) || now - S.last < COMBO_MS ? S.combo + 1 : 1; S.last = now;
  const prev = S.mult; S.mult = S.combo >= 50 ? 2 : S.combo >= 20 ? 1.5 : 1;
  const gain = S.power * S.mult; S.energy -= 1; S.coins += gain;
  coinBurst(x, y, S.mult >= 2 ? 5 : S.mult > 1 ? 4 : 3, gain);
  if (S.mult > prev) { thresholdFlash(S.mult); H.threshold.forEach(f => f(S.mult)); }
  H.combo.forEach(f => f({ n: S.combo, mult: S.mult, rem: 1, active: true, tap: true }));
  $$('.tap-hint').forEach(h => h.classList.add('gone')); clearTimeout(window.__hintT);
  window.__hintT = setTimeout(() => $$('.tap-hint').forEach(h => h.classList.remove('gone')), 5000);
  render(); return true;
}
// цвет комбо по силе
export function comboColor(n) {
  const s = getComputedStyle(document.documentElement);
  const v = k => s.getPropertyValue(k).trim();
  return n >= 50 ? [v('--pink'), v('--pink-edge')]
    : n >= 20 ? [v('--violet'), v('--pink')]
    : n >= 10 ? [v('--violet'), v('--violet-edge')]
    : [v('--violet'), v('--violet-edge')];
}
render();
