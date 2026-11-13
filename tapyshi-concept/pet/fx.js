// Вариант A · «Плавный досчёт»
// +1 у пальца (WAAPI), баланс досчитывается твином в rAF (текст ≤ 20 раз/с) с мягким пульсом иконки,
// одна красивая монета летит к балансу раз в 10 тапов; при посадке — блик по плашке.
import { startApp, addTicker, RM, S, fmt, coinCanvas, glintCanvas, spriteURL } from './core.js?v=tc11132310';
import { pool, play, arc, img } from './fxkit.js?v=tc11132310';
import { plusFx } from './plus.js?v=tc11132310';

const EVERY = 10;          // монета к балансу раз в N тапов
const PLUS_MS = 760, GLINT_MS = 340, FLY_MS = 680, MERGE_MS = 70;

startApp({ onReady, onTap, input: 'zone' });

let lastGlint = -1e9, ctx, plus, glints, coins, shine, shown = S.coins, lastWrite = 0, lastPulse = 0;
function onReady(c) {
  ctx = c; const app = c.el.app;
  plus = plusFx(app, { life: PLUS_MS });
  const gsrc = spriteURL(glintCanvas(56));
  glints = pool(app, 8, () => { const i = img(gsrc, 56); i.style.zIndex = 39; return i; });
  const csrc = spriteURL(coinCanvas(64));
  coins = pool(app, 3, () => { const i = img(csrc, 46); i.style.zIndex = 42; return i; });
  // блик по плашке баланса: один слой, двигается transform-ом
  c.el.bal.style.overflow = 'hidden';
  shine = document.createElement('i');
  shine.style.cssText = 'position:absolute;top:-10px;bottom:-10px;left:0;width:46px;pointer-events:none;opacity:0;will-change:transform,opacity;' +
    'background:linear-gradient(90deg,transparent,rgb(var(--white-rgb) / .85),transparent);transform:translateX(-60px) skewX(-20deg)';
  c.el.bal.appendChild(shine);
}

// баланс: экспоненциальный твин к цели, запись текста не чаще 50 мс
function balTick(now, dt) {
  const target = S.coins;
  if (shown === target) return false;
  const k = RM ? 1 : 1 - Math.exp(-dt * 9);
  shown += (target - shown) * k;
  if (target - shown < .5) shown = target;
  if (now - lastWrite >= 50 || shown === target) { lastWrite = now; ctx.el.balNum.textContent = fmt(shown); }
  return true;
}
function pulse(now, big) {
  if (RM || (!big && now - lastPulse < 280)) return; lastPulse = now;
  ctx.el.balIco.animate([{ transform: 'scale(1)' }, { transform: `scale(${big ? 1.24 : 1.1})`, offset: .35 }, { transform: 'scale(.97)', offset: .7 }, { transform: 'scale(1)' }],
    { duration: big ? 420 : 300, easing: 'ease-out' });
}

function onTap({ x, y, gain, tier, now }) {
  addTicker(balTick); pulse(now, false);
  // +1 у пальца: чуть выше точки касания, чтобы не прятался под пальцем
  plus.tap(x, y, gain, tier, now);
  if (RM) return;
  // мягкий блик в точке касания
  if (now - lastGlint >= MERGE_MS) { lastGlint = now; const g = glints.next(), gr = Math.random() * 90;
  play(g, [{ opacity: 0, transform: `translate(${x}px,${y}px) rotate(${gr}deg) scale(.2)` },
    { opacity: .95, transform: `translate(${x}px,${y}px) rotate(${gr + 25}deg) scale(.85)`, offset: .3 },
    { opacity: 0, transform: `translate(${x}px,${y}px) rotate(${gr + 60}deg) scale(1.15)` }], { duration: GLINT_MS, easing: 'ease-out' }); }
  // одна монета раз в EVERY тапов
  if (S.taps % EVERY === 0) flyCoin(x, y - 20);
}

function flyCoin(sx, sy) {
  const c = coins.next(), t = ctx.balXY;
  const mx = sx + (t.x - sx) * .25 + (sx < 195 ? 50 : -50), my = Math.min(sy, t.y) - 120;
  const frames = arc(sx, sy, mx, my, t.x, t.y, 10, (x, y, k) => {
    const s = k < .15 ? .4 + k / .15 * .7 : 1.1 - (k - .15) * .5;
    const flip = Math.cos(k * Math.PI * 3);                 // монета «крутится» — scaleX
    return { transform: `translate(${x}px,${y}px) scale(${(s * (.35 + .65 * Math.abs(flip))).toFixed(3)},${s.toFixed(3)})`, opacity: k < .08 ? k / .08 : k > .93 ? (1 - k) / .07 : 1 };
  });
  play(c, frames, { duration: FLY_MS, easing: 'cubic-bezier(.45,.05,.55,1)' }).onfinish = land;
}
function land() {
  const now = performance.now(); pulse(now, true);
  shine.animate([{ opacity: 0, transform: 'translateX(-60px) skewX(-20deg)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: 'translateX(200px) skewX(-20deg)' }], { duration: 520, easing: 'ease-out' });
}
