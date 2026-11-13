// Вариант B · «Canvas-частицы»
// «+1», блик и 3–4 мини-монетки-искры у пальца рисуются на ОДНОМ холсте (DPR ≤ 2).
// Холст отдан в Web Worker (OffscreenCanvas): кадры частиц не занимают главный поток вообще.
// Нет OffscreenCanvas — тот же рендерер в главном потоке. Холст — полоса вокруг енота, не весь экран.
// Баланс монет не принимает: число быстро досчитывается, плашка мягко вспыхивает (opacity готового слоя).
import { startApp, addTicker, RM, S, fmt, fmtGain, coinCanvas, glintCanvas, plusCanvas } from '../common/core.js?v=1';
import { createRenderer } from './particles.js?v=1';

const DPR = Math.min(2, devicePixelRatio || 1);
startApp({ tag: '<b>B</b>canvas-частицы · баланс вспыхивает', onReady, onTap });

let ctx, cv, OY = 0, send = null, glow, shown = S.coins, lastWrite = 0, glowA = null, icoA = null, seed = 7;
async function onReady(c) {
  ctx = c;
  cv = document.createElement('canvas'); c.el.app.appendChild(cv);
  const hit = c.st.hit(), ar = c.appRect, W = c.el.app.clientWidth;
  OY = Math.max(0, Math.floor(hit.y - ar.top - hit.ry - 170));
  const H = Math.ceil(Math.min(c.el.app.clientHeight, hit.y - ar.top + hit.ry + 60) - OY);
  cv.style.cssText = `position:absolute;left:0;top:${OY}px;width:${W}px;height:${H}px;z-index:40;pointer-events:none`;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  // битмапы «+N» заранее: одиночный тап и склейки до 4 тапов для каждого множителя
  const plus = {};
  [[1, 1], [1.5, 2], [2, 3]].forEach(([m, tier]) => { for (let k = 1; k <= 4; k++) { const t = fmtGain(Math.round(m * k * 10) / 10); plus[tier + t] = plusCanvas(t, tier, DPR); } });
  const src = { coin: coinCanvas(24, DPR), glint: glintCanvas(56, DPR), plus };
  const useWorker = 'transferControlToOffscreen' in cv && !/main/.test(location.search);
  if (useWorker) {
    try {
      const bm = async x => createImageBitmap(x);
      const keys = Object.keys(src.plus), bms = await Promise.all(keys.map(k => bm(src.plus[k])));
      const sprites = { coin: await bm(src.coin), glint: await bm(src.glint), plus: Object.fromEntries(keys.map((k, i) => [k, bms[i]])) };
      const off = cv.transferControlToOffscreen();
      const w = new Worker(new URL('./worker.js?v=1', import.meta.url), { type: 'module' });
      w.postMessage({ type: 'init', canvas: off, dpr: DPR, sprites, rm: RM }, [off, sprites.coin, sprites.glint, ...bms]);
      send = m => w.postMessage(m);
      window.__fxMode = 'worker';
    } catch (e) { send = null; }
  }
  if (!send) { const R = createRenderer(cv, DPR, src, RM); send = m => R.tap(m); window.__fxMode = 'main'; }
  glow = document.createElement('i');
  glow.style.cssText = 'position:absolute;inset:-16px -22px;z-index:-1;border-radius:40px;pointer-events:none;opacity:0;will-change:opacity;' +
    'background:radial-gradient(closest-side,color-mix(in srgb,var(--sun) 75%,transparent),color-mix(in srgb,var(--sun) 0%,transparent))';
  c.el.bal.prepend(glow);
}

function balTick(now, dt) {
  if (shown === S.coins) return false;
  shown += (S.coins - shown) * (RM ? 1 : 1 - Math.exp(-dt * 16)); if (S.coins - shown < .5) shown = S.coins;
  if (now - lastWrite >= 60 || shown === S.coins) { lastWrite = now; ctx.el.balNum.textContent = fmt(shown); }
  return true;
}
function flashBalance(big) {
  if (big || !glowA || glowA.currentTime == null || glowA.currentTime > 110)
    glowA = glow.animate([{ opacity: 0 }, { opacity: big ? 1 : .55, offset: .25 }, { opacity: 0 }], { duration: big ? 560 : 380, easing: 'ease-out' });
  if (!RM && (big || !icoA || icoA.currentTime == null || icoA.currentTime > 200))
    icoA = ctx.el.balIco.animate([{ transform: 'scale(1)' }, { transform: `scale(${big ? 1.22 : 1.09})`, offset: .35 }, { transform: 'scale(1)' }], { duration: big ? 420 : 280, easing: 'ease-out' });
}

function onTap({ x, y, tier, gain }) {
  addTicker(balTick);
  flashBalance(S.taps % 10 === 0);           // раз в 10 тапов — вспышка ярче
  if (send) send({ type: 'tap', x, y: y - OY, tier, gain, seed: (seed = (seed * 48271) % 2147483647) });
}
