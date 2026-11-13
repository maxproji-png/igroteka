// Вариант C · «Монетка-блик + счётчик-барабан»
// Только transform/opacity на фиксированных пулах DOM (WAAPI → композитор).
// У пальца: крупный «+1» и монетка, которая выпрыгивает, крутится и растворяется в блик.
// Баланс — барабан цифр (каждая цифра — колонка, двигается translateY), плюс блик по плашке.
// Поток монет к балансу — только на вехах комбо (25, 50, 75…): короткий «coin burst» из 8 монет.
import { startApp, RM, S, coinCanvas, glintCanvas, spriteURL } from '../common/core.js?v=tf11132128';
import { pool, play, arc, img } from '../common/fxkit.js?v=tf11132128';
import { plusFx } from '../common/plus.js?v=tf11132128';

const PLUS_MS = 720, POP_MS = 460, GLINT_MS = 300, BURST = 8, MILESTONE = 25;
startApp({ tag: '<b>C</b>монетка-блик · барабан · burst на 25/50/75', onReady, onTap });

let lastPop = -1e9, ctx, plus, pops, glints, burst, shine, odo, cols = [], shownDigits = '', rollT = 0, rollPending = false, shineT = 0;
function onReady(c) {
  ctx = c; const app = c.el.app;
  plus = plusFx(app, { life: PLUS_MS });
  const csrc = spriteURL(coinCanvas(64)), gsrc = spriteURL(glintCanvas(56));
  pops = pool(app, 8, () => { const i = img(csrc, 34); i.style.zIndex = 40; return i; });
  glints = pool(app, 8, () => { const i = img(gsrc, 52); i.style.zIndex = 39; return i; });
  burst = pool(app, BURST, () => { const i = img(csrc, 40); i.style.zIndex = 42; return i; });
  // барабан
  const num = c.el.balNum; num.textContent = '';
  odo = document.createElement('span'); odo.className = 'odo'; num.appendChild(odo);
  buildOdo(digits(S.coins));
  c.el.bal.style.overflow = 'hidden';
  shine = document.createElement('i');
  shine.style.cssText = 'position:absolute;top:-10px;bottom:-10px;left:0;width:46px;pointer-events:none;opacity:0;will-change:transform,opacity;' +
    'background:linear-gradient(90deg,transparent,rgb(var(--white-rgb) / .85),transparent);transform:translateX(-60px) skewX(-20deg)';
  c.el.bal.appendChild(shine);
}
const digits = n => String(Math.floor(n));
// колонка: 0..9 трижды подряд; стоим в среднем блоке, перекат вперёд через третий
function buildOdo(d) {
  odo.textContent = ''; cols = [];
  for (let i = 0; i < d.length; i++) {
    if (i && (d.length - i) % 3 === 0) { const sp = document.createElement('span'); sp.className = 'odo-sep'; odo.appendChild(sp); }
    const w = document.createElement('span'); w.className = 'odo-col';
    const strip = document.createElement('span'); strip.className = 'odo-strip';
    strip.textContent = '012345678901234567890123456789'.split('').join('\n');
    w.appendChild(strip); odo.appendChild(w);
    const v = +d[i]; strip.style.transform = `translateY(${-(10 + v) * 1.2}em)`;
    cols.push({ strip, v, anim: null });
  }
  shownDigits = d;
}
function roll() {
  rollT = 0; rollPending = false;
  const d = digits(S.coins); if (d === shownDigits) return;
  if (d.length !== shownDigits.length) { buildOdo(d); return; }   // новый разряд — редкость, перестраиваем
  for (let i = 0; i < d.length; i++) {
    const c = cols[i], v = +d[i]; if (v === c.v) continue;
    const to = 10 + v + (v < c.v ? 10 : 0);              // только вперёд
    if (c.anim) c.anim.cancel();
    c.anim = RM ? null : c.strip.animate([{ transform: `translateY(${-(10 + c.v) * 1.2}em)` }, { transform: `translateY(${-to * 1.2}em)` }], { duration: 160 + (d.length - 1 - i) * 30, easing: 'cubic-bezier(.3,1.35,.5,1)' });
    c.strip.style.transform = `translateY(${-(10 + v) * 1.2}em)`; // покой — в среднем блоке (визуально то же место)
    c.v = v;
  }
  shownDigits = d;
}
// барабан обновляется ≤ 12 раз/с — каждый перекат успевает читаться
function scheduleRoll() { if (!rollPending) { rollPending = true; rollT = setTimeout(roll, 80); } }

function onTap({ x, y, gain, tier, combo, now }) {
  scheduleRoll();
  if (!RM && now - shineT > 900) { shineT = now; shine.animate([{ opacity: 0, transform: 'translateX(-60px) skewX(-20deg)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: 'translateX(200px) skewX(-20deg)' }], { duration: 560, easing: 'ease-out' }); }
  plus.tap(x, y, gain, tier, now);
  if (RM) return;
  if (combo % MILESTONE === 0) coinBurst();
  // монетка выпрыгивает вбок-вверх, крутится и растворяется в блик (не чаще 1 раз/70 мс)
  if (now - lastPop < 70) return; lastPop = now;
  const side = (S.taps % 2 ? 1 : -1), dx = side * (38 + Math.random() * 22), dy = -(46 + Math.random() * 18);
  const ex = x + dx, ey = y + dy - 6;
  const c = pops.next();
  play(c, arc(x, y - 6, x + dx * .55, y + dy - 34, ex, ey, 6, (X, Y, t) => {
    const f = Math.cos(t * Math.PI * 2.5), s = t < .25 ? .3 + t / .25 * .8 : 1.1 - (t - .25) * .55;
    return { transform: `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) scale(${(s * (.3 + .7 * Math.abs(f))).toFixed(3)},${s.toFixed(3)})`, opacity: t < .1 ? t / .1 : t > .7 ? (1 - t) / .3 : 1 };
  }), { duration: POP_MS, easing: 'cubic-bezier(.25,.6,.4,1)' });
  const g = glints.next(), gr = Math.random() * 60;
  play(g, [{ opacity: 0, transform: `translate(${ex}px,${ey}px) rotate(${gr}deg) scale(.2)` },
    { opacity: 1, transform: `translate(${ex}px,${ey}px) rotate(${gr + 30}deg) scale(1)`, offset: .35 },
    { opacity: 0, transform: `translate(${ex}px,${ey}px) rotate(${gr + 70}deg) scale(1.2)` }], { duration: GLINT_MS, delay: POP_MS * .62, easing: 'ease-out' });
}

function coinBurst() {
  const h = ctx.head, t = ctx.balXY;
  for (let i = 0; i < BURST; i++) {
    const it = burst.next(), a = -Math.PI / 2 + (i - (BURST - 1) / 2) * .38;
    const sx = h.x + Math.cos(a) * 30, sy = h.y + 40 + Math.sin(a) * 20;
    const mx = sx + Math.cos(a) * 90, my = sy + Math.sin(a) * 70 - 40;
    play(it, arc(sx, sy, mx, my, t.x, t.y, 9, (X, Y, k) => {
      const f = Math.cos(k * Math.PI * 3 + i), s = k < .15 ? .3 + k / .15 * .8 : 1.1 - k * .45;
      return { transform: `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) scale(${(s * (.3 + .7 * Math.abs(f))).toFixed(3)},${s.toFixed(3)})`, opacity: k < .1 ? k / .1 : k > .92 ? (1 - k) / .08 : 1 };
    }), { duration: 720, delay: i * 45, easing: 'cubic-bezier(.45,.05,.55,1)' }).onfinish = i === BURST - 1 ? land : null;
  }
}
function land() {
  ctx.el.balIco.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.28)', offset: .35 }, { transform: 'scale(.96)', offset: .7 }, { transform: 'scale(1)' }], { duration: 440, easing: 'ease-out' });
  shine.animate([{ opacity: 0, transform: 'translateX(-60px) skewX(-20deg)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: 'translateX(200px) skewX(-20deg)' }], { duration: 520, easing: 'ease-out' });
}
