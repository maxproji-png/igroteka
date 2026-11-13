// Тапыши · «Улучшить» · общие кусочки интерфейса: шапка с балансом, досчёт числа, «−цена», тост, оверлей стадии.
import { S, fmt, STAGE_NAMES, petImg, PET_NAME } from './econ.js?v=up11140230';
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const COIN = '../common/coin.png?v=up11140230';
export const coinImg = cls => `<img class="${cls || 'coin'}" src="${COIN}" alt="">`;
export const $ = s => document.querySelector(s);

export function shell(app) {
  app.insertAdjacentHTML('afterbegin', `
  <header class="hdr"><a class="back" href="../../tapyshi-concept/" aria-label="Назад"><svg><use href="#u-back"/></svg></a>
    <h1>Улучшения</h1><div class="bal" id="bal"><img src="${COIN}" alt="" id="balIco"><span class="num" id="balNum">${fmt(S.coins)}</span></div></header>
  <div class="toast" id="toast"></div>
  <div class="evo" id="evo"><div class="bg"></div><div class="rays"></div><div class="lab">Новая стадия</div>
    <div class="pets"><img id="evoOld" alt=""><img id="evoNew" alt=""></div><h2 id="evoName"></h2><p id="evoTxt"></p>
    <button class="btn btn--primary btn--l" id="evoOk" type="button">Ура!</button></div>`);
  $('#evoOk').addEventListener('click', closeEvo);
  // предзагрузка картинок стадий — смена стадии без задержки
  for (let i = 1; i <= 6; i++) { const im = new Image(); im.src = petImg(i); }
}

// баланс плавно досчитывается к S.coins (текст ≤ 20 раз/с)
let shown = S.coins, raf = 0, lastW = 0;
export function syncBalance() {
  if (raf) return;
  const step = now => {
    const d = S.coins - shown; shown += d * (RM ? 1 : .18); if (Math.abs(S.coins - shown) < 1) shown = S.coins;
    if (now - lastW > 50 || shown === S.coins) { lastW = now; $('#balNum').textContent = fmt(shown); }
    raf = shown === S.coins ? 0 : requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  if (!RM) $('#balIco').animate([{ transform: 'scale(1)' }, { transform: 'scale(.82)', offset: .3 }, { transform: 'scale(1.08)', offset: .7 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
}

// «−1 000» от кнопки к балансу (один узел на покупку, WAAPI)
export function floatCost(fromEl, cost) {
  const app = $('.app'), ar = app.getBoundingClientRect(), r = fromEl.getBoundingClientRect(), b = $('#bal').getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'float'; f.textContent = '−' + fmt(cost); app.appendChild(f);
  const x0 = r.left + r.width / 2 - ar.left - 30, y0 = r.top - ar.top - 6, x1 = b.left - ar.left + 10, y1 = b.top - ar.top + 8;
  const a = f.animate(RM ? [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }] : [
    { opacity: 0, transform: `translate(${x0}px,${y0}px) scale(.7)` },
    { opacity: 1, transform: `translate(${x0}px,${y0 - 26}px) scale(1.1)`, offset: .25 },
    { opacity: 1, transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 20}px) scale(1)`, offset: .6 },
    { opacity: 0, transform: `translate(${x1}px,${y1}px) scale(.6)` }], { duration: 760, easing: 'cubic-bezier(.3,.7,.4,1)' });
  a.onfinish = () => f.remove();
}

let toastA = null;
export function toast(text) {
  const t = $('#toast'); t.textContent = text; if (toastA) toastA.cancel();
  toastA = t.animate([{ opacity: 0, transform: 'translate(-50%,20px)' }, { opacity: 1, transform: 'translate(-50%,0)', offset: .12 }, { opacity: 1, transform: 'translate(-50%,0)', offset: .85 }, { opacity: 0, transform: 'translate(-50%,8px)' }], { duration: 1900, easing: 'ease-out' });
}
export function shake(el) { if (!RM) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320 }); }
export function pop(el, k = 1.12) { if (!RM) el.animate([{ transform: 'scale(1)' }, { transform: `scale(${k})`, offset: .35 }, { transform: 'scale(.97)', offset: .7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' }); }
export function press(el) { if (!RM) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94) translateY(2px)', offset: .3 }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); }

// Момент новой стадии: старая модель тает, новая выпрыгивает, лучи медленно крутятся (transform/opacity)
let raysA = null;
export function showEvo(from, to, level) {
  const e = $('#evo');
  $('#evoOld').src = petImg(from); $('#evoNew').src = petImg(to);
  $('#evoName').textContent = `${PET_NAME} — «${STAGE_NAMES[to - 1]}»`;
  $('#evoTxt').textContent = `Уровень ${level}: Булочка выросла и получила новый облик.`;
  e.classList.add('on');
  e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' });
  if (RM) { $('#evoOld').style.opacity = 0; return; }
  $('#evoOld').animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(.92)', offset: .35 }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 900, fill: 'forwards', easing: 'ease-in' });
  $('#evoNew').animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 0, transform: 'scale(.6)', offset: .45 }, { opacity: 1, transform: 'scale(1.12)', offset: .75 }, { opacity: 1, transform: 'scale(1)' }], { duration: 1200, fill: 'forwards', easing: 'cubic-bezier(.34,1.56,.64,1)' });
  raysA = e.querySelector('.rays').animate([{ transform: 'rotate(0) scale(.6)', opacity: 0 }, { transform: 'rotate(40deg) scale(1)', opacity: 1, offset: .2 }, { transform: 'rotate(200deg) scale(1)', opacity: 1 }], { duration: 9000, fill: 'forwards' });
}
export function closeEvo() {
  const e = $('#evo');
  const a = e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
  a.onfinish = () => { e.classList.remove('on'); e.getAnimations().forEach(x => x.cancel()); if (raysA) raysA.cancel(); };
}
