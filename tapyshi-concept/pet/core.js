// Тапыши · tap-feel · общее ядро: состояние, комбо (вариант A), пружины, спрайты монет, один rAF-цикл.
// Цикл крутится только пока есть что анимировать; в покое — 0 кадров работы.
import { petStage } from './stage.js?v=tc11132310';
import { PETS, PET_ORDER, stageOf, firstLevelOf, stageName, LEVEL_MAX } from './evo.js?v=tc11132310';

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const S = { coins: 12000, energy: 330, max: 330, power: 1, combo: 0, mult: 1, last: 0, taps: 0 };
export const COMBO_MS = 1000;
export const fmt = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
export const fmtGain = g => '+' + String(g).replace('.', ',');
const css = getComputedStyle(document.documentElement);
export const T = k => css.getPropertyValue('--' + k).trim();   // токены читаем один раз
export const PAL = {
  violet: T('violet'), violetEdge: T('violet-edge'), green: T('green'), greenEdge: T('green-edge'),
  sun: T('sun'), sunEdge: T('sun-edge'), sunSoft: T('sun-soft'), white: T('white'), wordEdge: T('game-word-edge'), shade: T('shade')
};
export const tierOf = mult => mult >= 2 ? 3 : mult > 1 ? 2 : 1;

/* ---------------- один rAF ---------------- */
const tickers = new Set();
let rafId = 0, lastNow = 0;
function frame(now) {
  rafId = 0;
  const dt = Math.min(1 / 30, Math.max(0, (now - (lastNow || now)) / 1000)); lastNow = now;
  let alive = false;
  for (const t of tickers) if (t(now, dt)) alive = true;
  if (alive) rafId = requestAnimationFrame(frame); else lastNow = 0;
}
export function wake() { if (!rafId) rafId = requestAnimationFrame(frame); }
export function addTicker(fn) { tickers.add(fn); wake(); }

/* ---------------- спрайты (рисуются один раз, кешируются) ---------------- */
const cache = new Map();
const SDPR = Math.min(3, devicePixelRatio || 1);
function mk(w, h, dpr) { const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr); const x = c.getContext('2d'); x.scale(dpr, dpr); return [c, x]; }
function paw(x, cx, cy, r) {
  x.beginPath(); x.ellipse(cx, cy + r * .28, r * .42, r * .34, 0, 0, 7); x.fill();
  [[-.46, -.12, .15], [-.17, -.42, .16], [.17, -.42, .16], [.46, -.12, .15]].forEach(([dx, dy, rr]) => {
    x.beginPath(); x.ellipse(cx + dx * r, cy + dy * r, rr * r, rr * r * 1.18, dx * .5, 0, 7); x.fill(); });
}
// Монета: толщина ребра, обод, рельефное кольцо, лапка-чекан, блик. Всё запечено в битмап.
export function coinCanvas(size = 64, dpr = SDPR) {
  const key = 'coin' + size + '@' + dpr; if (cache.has(key)) return cache.get(key);
  const pad = size * .12, W = size + pad * 2;
  const [c, x] = mk(W, W, dpr);
  const cx = W / 2, cy = W / 2 - size * .03, r = size / 2 * .94, th = size * .07;
  // мягкая тень (запечена)
  let g = x.createRadialGradient(cx, cy + r + th * .9, 0, cx, cy + r + th * .9, r * .9);
  g.addColorStop(0, `rgb(${PAL.shade.split(' ').join(',')},.20)`); g.addColorStop(1, `rgb(${PAL.shade.split(' ').join(',')},0)`);
  x.save(); x.translate(0, 0); x.scale(1, .32); x.fillStyle = g; x.beginPath(); x.arc(cx, (cy + r + th * .9) / .32, r * .9, 0, 7); x.fill(); x.restore();
  // ребро (толщина)
  g = x.createLinearGradient(cx - r, 0, cx + r, 0);
  g.addColorStop(0, PAL.wordEdge); g.addColorStop(.5, PAL.sunEdge); g.addColorStop(1, PAL.wordEdge);
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy + th, r, 0, 7); x.fill();
  // обод
  g = x.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#FFE9A3'); g.addColorStop(.45, PAL.sun); g.addColorStop(1, PAL.sunEdge);
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  // лицевая сторона
  const fr = r * .8;
  g = x.createRadialGradient(cx - fr * .35, cy - fr * .45, fr * .05, cx, cy, fr * 1.05);
  g.addColorStop(0, '#FFF4C9'); g.addColorStop(.35, '#FFD65C'); g.addColorStop(.8, PAL.sun); g.addColorStop(1, '#F2AE17');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, fr, 0, 7); x.fill();
  // фаска: тёмная сверху, светлая снизу — ощущение утопленного поля
  x.lineWidth = size * .028;
  x.strokeStyle = 'rgba(184,110,0,.45)'; x.beginPath(); x.arc(cx, cy, fr, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
  x.strokeStyle = 'rgba(255,248,214,.9)'; x.beginPath(); x.arc(cx, cy, fr, Math.PI * .05, Math.PI * .95); x.stroke();
  // чекан: лапка Булочки с рельефом
  x.fillStyle = 'rgba(255,250,225,.85)'; paw(x, cx + size * .012, cy + size * .018, fr * .62);
  x.fillStyle = PAL.sunEdge; paw(x, cx, cy, fr * .62);
  // блик-полумесяц
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
  g = x.createLinearGradient(cx - r, cy - r, cx, cy);
  g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.ellipse(cx - r * .28, cy - r * .5, r * .62, r * .3, -.6, 0, 7); x.fill(); x.restore();
  // искра
  star(x, cx - r * .5, cy - r * .52, size * .12, 'rgba(255,255,255,.95)');
  cache.set(key, c); return c;
}
function star(x, cx, cy, s, col) {
  x.fillStyle = col; x.beginPath();
  x.moveTo(cx, cy - s); x.quadraticCurveTo(cx, cy, cx + s, cy); x.quadraticCurveTo(cx, cy, cx, cy + s); x.quadraticCurveTo(cx, cy, cx - s, cy); x.quadraticCurveTo(cx, cy, cx, cy - s); x.fill();
}
// Блик-звёздочка: белое ядро + тёплое свечение (запечено)
export function glintCanvas(size = 56, dpr = SDPR) {
  const key = 'glint' + size + '@' + dpr; if (cache.has(key)) return cache.get(key);
  const [c, x] = mk(size, size, dpr); const m = size / 2;
  let g = x.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,246,210,.95)'); g.addColorStop(.25, 'rgba(255,194,51,.45)'); g.addColorStop(1, 'rgba(255,194,51,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  star(x, m, m, m * .95, 'rgba(255,255,255,.95)');
  x.save(); x.translate(m, m); x.rotate(Math.PI / 4); star(x, 0, 0, m * .45, 'rgba(255,255,255,.8)'); x.restore();
  cache.set(key, c); return c;
}
const urls = new Map();
export function spriteURL(c) { if (!urls.has(c)) urls.set(c, c.toDataURL('image/png')); return urls.get(c); }
// «+1» как битмап (для canvas-варианта)
export function plusCanvas(text, tier, dpr) {
  const key = 'plus' + text + tier + '@' + dpr; if (cache.has(key)) return cache.get(key);
  const W = 130, H = 70; const [c, x] = mk(W, H, dpr);
  const stroke = tier === 3 ? PAL.sunEdge : tier === 2 ? PAL.green : PAL.violet;
  const edge = tier === 3 ? PAL.wordEdge : tier === 2 ? PAL.greenEdge : PAL.violetEdge;
  x.font = '1000 46px Nunito, ui-rounded, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.lineWidth = 8; x.strokeStyle = edge; x.fillStyle = edge; x.strokeText(text, W / 2, H / 2 + 4); x.fillText(text, W / 2, H / 2 + 4);
  x.strokeStyle = stroke; x.strokeText(text, W / 2, H / 2); x.fillStyle = PAL.white; x.fillText(text, W / 2, H / 2);
  cache.set(key, c); return c;
}

export function plusURL(text, tier) { return spriteURL(plusCanvas(text, tier, SDPR)); }

/* ---------------- разметка HUD ---------------- */
const HUD = `
  <div class="pet-wrap" id="petWrap"><canvas class="scene"></canvas></div>
  <div class="hud">
    <div class="top">
      <div class="pill card bal" id="bal"><span class="cico" id="balIco"></span><span class="num" id="balNum"></span></div>
      <div class="enw"><div class="pill card"><svg class="ic"><use href="#i-bolt"/></svg><span class="num" id="enNum"></span><span class="bar"><i id="enBar"></i></span></div>
      <a class="fr-chip card pe" href="games/?friends=1"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7.2" cy="6.4" r="3.1" fill="currentColor"/><path d="M1.8 16.6c.5-3.4 2.8-5.1 5.4-5.1s4.9 1.7 5.4 5.1z" fill="currentColor"/><circle cx="14.2" cy="7" r="2.5" fill="currentColor" opacity=".95"/><path d="M12.2 16.6c.3-2.2 1.5-3.7 3.5-4.2 2 .7 3.3 2.3 3.6 4.2z" fill="currentColor" opacity=".95"/></svg>Друзья<b>3</b></a></div>
    </div>
    <div class="side">
      <button class="rb card pe" aria-label="Задания"><svg class="ic"><use href="#i-tasks"/></svg><span class="dot n">2</span></button>
      <button class="rb card pe" aria-label="Награда"><svg class="ic"><use href="#i-gift"/></svg><span class="dot"></span></button>
    </div>
    <div class="combo" id="combo"><div class="lab">комбо</div><div class="row"><svg class="flame"><use href="#i-flame"/></svg><span class="n" id="cn">0</span><span class="mult" id="cm">×1,5</span></div><div class="timer"><i id="ct"></i></div></div>
    <div class="tap-hint" id="hint"><svg class="ic"><use href="#i-tap"/></svg>Тапай!</div>
    <div class="demo pe" id="demo">
      <span class="demo-lab">демо</span>
      <div class="demo-row">
        <button type="button" id="stgPrev" aria-label="Предыдущая стадия">◀</button>
        <span id="stgLab">стадия 2/6</span>
        <button type="button" id="stgNext" aria-label="Следующая стадия">▶</button>
      </div>
      <div class="demo-pets" id="demoPets"></div>
    </div>
    <div class="bottom">
      <div class="lvl card pe" id="lvlPlate"><span class="st"><svg><use href="#i-star"/></svg><b id="lvlN">7</b></span><span class="lvl-txt"><span id="lvlName">Иней</span> <small id="lvlLab">ур. 7</small></span></div>
      <button class="up pe" id="btnUp" type="button"><svg class="ic"><use href="#i-up"/></svg>Улучшить</button>
    </div>
  </div>
  <div class="evo-flash" id="evoFlash"></div>
  <div class="flash" id="flash"><div class="glow"></div><div class="big">×1,5!</div><div class="sub">Монеты ×1,5</div></div>
  <div class="flash x2" id="flash2"><div class="glow"></div><div class="big">×2!</div><div class="sub">Двойные монеты</div></div>`;

/* ---------------- запуск ---------------- */
export async function startApp({ tag, onTap, onComboEnd, onReady, input = 'pet' }) {
  const app = document.querySelector('.app');
  app.insertAdjacentHTML('afterbegin', HUD);
  if (tag) app.insertAdjacentHTML('beforeend', `<div class="vtag">${tag}</div>`);
  const $ = id => document.getElementById(id);
  const el = { app, bal: $('bal'), balIco: $('balIco'), balNum: $('balNum'), enNum: $('enNum'), enBar: $('enBar'), combo: $('combo'), cn: $('cn'), cm: $('cm'), ct: $('ct'), hint: $('hint'), wrap: $('petWrap'), flash: $('flash'), flash2: $('flash2'), evoFlash: $('evoFlash'), lvlPlate: $('lvlPlate'), lvlN: $('lvlN'), lvlName: $('lvlName'), lvlLab: $('lvlLab'), stgLab: $('stgLab'), btnUp: $('btnUp'), demo: $('demo'), demoPets: $('demoPets') };
  const ico = new Image(); ico.alt = ''; ico.src = spriteURL(coinCanvas(40)); el.balIco.appendChild(ico);
  el.balNum.textContent = fmt(S.coins);

  // защита от зума/выделения/меню
  addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  addEventListener('contextmenu', e => e.preventDefault());

  let appRect = app.getBoundingClientRect();
  const canvas = app.querySelector('canvas.scene');
  const st = await petStage({ canvas, onTap: e => tap(e.clientX, e.clientY), petInput: input !== 'zone', pet: 'raccoon', stage: stageOf(7) });
  if (input === 'zone') bindZone();

  // Мультитач: зона тапа на всю игровую середину (между верхними плашками и нижней панелью).
  // Каждое новое касание = отдельный тап, даже если несколько пальцев легли в одном кадре.
  // Сенсор — touchstart по e.changedTouches (надёжно на iOS); pointerdown — только для мыши/пера,
  // чтобы одно касание не посчиталось дважды. Счёт без троттлинга; троттлятся только эффекты.
  function bindZone() {
    const z = document.createElement('div'); z.className = 'tapzone'; app.appendChild(z);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const pending = new Map(); // id -> {x,y,t,onPet,dead}
    let rotating = false, rotId = null, lastX = 0, lastT = 0, vel = 0;
    const onPet = (x, y) => {
      const h = st.hit(); if (!h) return false;
      const dx = (x - h.x) / h.rx, dy = (y - h.y) / h.ry;
      return dx * dx + dy * dy <= 1.15; // чуть шире хитбокса, чтобы было проще крутить
    };
    const TAP_PX = 8, HOLD_MS = 180;
    function startRot(id, x, now) {
      rotating = true; rotId = id; lastX = x; lastT = now; vel = 0;
      pending.forEach(p => { p.dead = true; });
    }
    function moveRot(x, now) {
      const dx = x - lastX, dt = now - lastT;
      st.spinBy(dx);
      if (dt > 0) vel = vel * .6 + (dx / dt) * .4;
      lastX = x; lastT = now;
    }
    function endRot() {
      rotating = false; rotId = null;
      st.spinEnd(vel, () => layout());
      vel = 0;
    }

    z.addEventListener('touchstart', e => {
      e.preventDefault();
      const now = performance.now();
      const ts = e.changedTouches;
      for (let i = 0; i < ts.length; i++) {
        const tch = ts[i];
        pending.set(tch.identifier, { x: tch.clientX, y: tch.clientY, t: now, onPet: onPet(tch.clientX, tch.clientY), dead: false });
      }
    }, { passive: false });

    z.addEventListener('touchmove', e => {
      e.preventDefault();
      const now = performance.now();
      const ts = e.changedTouches;
      for (let i = 0; i < ts.length; i++) {
        const tch = ts[i], id = tch.identifier, x = tch.clientX, y = tch.clientY;
        if (rotating && id === rotId) { moveRot(x, now); continue; }
        if (rotating) continue;
        const p = pending.get(id); if (!p) continue;
        const dist = Math.hypot(x - p.x, y - p.y), dt = now - p.t;
        if (p.onPet && (dist > TAP_PX || (dt > HOLD_MS && dist > 2))) {
          startRot(id, p.x, p.t);
          moveRot(x, now);
        }
      }
    }, { passive: false });

    const endTouch = e => {
      e.preventDefault();
      const ts = e.changedTouches;
      for (let i = 0; i < ts.length; i++) {
        const tch = ts[i], id = tch.identifier, p = pending.get(id);
        if (rotating && id === rotId) endRot();
        else if (p && !p.dead) tap(tch.clientX, tch.clientY);
        pending.delete(id);
      }
    };
    z.addEventListener('touchend', endTouch, { passive: false });
    z.addEventListener('touchcancel', endTouch, { passive: false });

    // Мышь / перо: тот же жест, без удвоения с touch.
    let mouse = null;
    z.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' && hasTouch) return;
      mouse = { x: e.clientX, y: e.clientY, t: performance.now(), onPet: onPet(e.clientX, e.clientY), dead: false, id: e.pointerId };
      try { z.setPointerCapture(e.pointerId); } catch (err) {}
    });
    z.addEventListener('pointermove', e => {
      if (!mouse || e.pointerId !== mouse.id) return;
      const now = performance.now();
      if (rotating && rotId === mouse.id) { moveRot(e.clientX, now); return; }
      const dist = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y), dt = now - mouse.t;
      if (mouse.onPet && (dist > TAP_PX || (dt > HOLD_MS && dist > 2))) {
        startRot(mouse.id, mouse.x, mouse.t);
        mouse.dead = true;
        moveRot(e.clientX, now);
      }
    });
    const endPtr = e => {
      if (!mouse || e.pointerId !== mouse.id) return;
      if (rotating && rotId === mouse.id) endRot();
      else if (!mouse.dead) tap(e.clientX, e.clientY);
      mouse = null;
    };
    z.addEventListener('pointerup', endPtr);
    z.addEventListener('pointercancel', endPtr);
  }

  // геометрия, считается на старте/resize — не на тап
  let head = { x: 0, y: 0 }, feet = { x: 0, y: 0 }, balXY = { x: 40, y: 37 };
  function layout() {
    appRect = app.getBoundingClientRect();
    const h = st.headTop(); head = { x: h.x - appRect.left, y: Math.max(h.y - 6, 205) - appRect.top };
    const f = st.toScreen(0, 0, 0); feet = { x: f.x - appRect.left, y: f.y - appRect.top };
    el.wrap.style.transformOrigin = feet.x + 'px ' + feet.y + 'px';
    const hp = st.toScreen(.62, .55, .2); el.hint.style.left = Math.max(70, Math.min(appRect.width - 66, hp.x - appRect.left)) + 'px'; el.hint.style.top = (hp.y - appRect.top) + 'px';
    const r = el.balIco.getBoundingClientRect(); balXY = { x: r.left + r.width / 2 - appRect.left, y: r.top + r.height / 2 - appRect.top };
    placeCombo();
  }

  /* --- комбо над головой: всё на WAAPI, без rAF --- */
  let comboShown = false, comboScale = .6, lastN = -1, lastTier = 0, lastHot = false, comboEndT = 0, kickA = null, timerA = null;
  function placeCombo() { el.combo.style.transform = `translate(${head.x}px,${head.y}px) translate(-50%,-100%) scale(${comboScale})`; }
  function endCombo() {
    if (window.__holdCombo) { comboEndT = setTimeout(endCombo, COMBO_MS); return; }
    const n = S.combo; S.combo = 0; S.mult = 1; lastN = -1;
    comboShown = false; el.combo.classList.add('out'); el.combo.classList.remove('on'); comboScale = .6; placeCombo();
    st.setHappy(false); onComboEnd && onComboEnd(n);
  }
  const KICK = [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.2) rotate(-4deg)', offset: .3 }, { transform: 'scale(.97) rotate(1deg)', offset: .62 }, { transform: 'scale(1) rotate(0)' }];
  const TIMER = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
  function comboOnTap() {
    if (!comboShown) { comboShown = true; el.combo.classList.remove('out'); el.combo.classList.add('on'); st.setHappy(true); }
    if (S.combo !== lastN) { el.cn.textContent = S.combo; lastN = S.combo; }
    const tier = tierOf(S.mult);
    if (tier !== lastTier) { el.combo.classList.toggle('t2', tier === 2); el.combo.classList.toggle('t3', tier === 3); el.combo.classList.toggle('m', tier > 1); el.cm.textContent = tier === 3 ? '×2' : '×1,5'; lastTier = tier; }
    const hot = S.combo >= 10; if (hot !== lastHot) { el.combo.classList.toggle('hot', hot); lastHot = hot; }
    // размер растёт ступенями (запись стиля раз в 5 тапов, не на каждый)
    const sc = 1 + Math.floor(Math.min(S.combo, 60) / 5) * .03;
    if (sc !== comboScale) { comboScale = sc; placeCombo(); }
    // кик: перезапуск только когда прошлый почти отыграл — без рывков при 30 тапах/с
    if (!RM && (!kickA || kickA.currentTime == null || kickA.currentTime > 120)) kickA = el.cn.animate(KICK, { duration: 220, easing: 'ease-out' });
    if (timerA) timerA.cancel();
    timerA = el.ct.animate(TIMER, { duration: COMBO_MS, easing: 'linear', fill: 'forwards' });
    clearTimeout(comboEndT); comboEndT = setTimeout(endCombo, COMBO_MS);
  }

  /* --- вспышка порога: два готовых слоя, текст не меняется --- */
  function thresholdFlash(mult) {
    const f = mult >= 2 ? el.flash2 : el.flash;
    f.animate([{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 950, easing: 'ease-out' });
    if (!RM) f.querySelector('.big').animate([{ transform: 'scale(.3) rotate(-10deg)' }, { transform: 'scale(1.12) rotate(3deg)', offset: .3 }, { transform: 'scale(1)', offset: .5 }, { transform: 'translateY(-26px) scale(1.04)' }], { duration: 950, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  /* --- сжатие енота: короткая пружинистая WAAPI-анимация, только transform --- */
  let sqA = null, hitC = st.hit();
  function squash(x) {
    if (RM || (sqA && sqA.currentTime != null && sqA.currentTime < 150)) return;
    const tl = Math.max(-1, Math.min(1, (x - (hitC.x - appRect.left)) / hitC.rx)) * 1.4;
    sqA = el.wrap.animate([
      { transform: 'rotate(0deg) scale(1,1)' },
      { transform: `rotate(${tl.toFixed(2)}deg) scale(1.036,.955)`, offset: .22 },
      { transform: `rotate(${(-tl * .4).toFixed(2)}deg) scale(.99,1.014)`, offset: .52 },
      { transform: 'rotate(0deg) scale(1.003,.997)', offset: .78 },
      { transform: 'rotate(0deg) scale(1,1)' }], { duration: 300, easing: 'linear' });
  }

  /* --- энергия: текст не чаще 10 раз/с, полоска — transform --- */
  let enT = 0, enShown = -1;
  function energyWrite() { enT = 0; if (S.energy === enShown) return; enShown = S.energy; el.enNum.textContent = fmt(S.energy); el.enBar.style.transform = 'scaleX(' + (S.energy / S.max).toFixed(3) + ')'; }
  const energyDirty = () => { if (!enT) enT = setTimeout(energyWrite, 100); };
  energyWrite();
  setInterval(() => { if (S.energy < S.max && performance.now() - S.last > 600) { S.energy = Math.min(S.max, S.energy + 1); energyDirty(); } }, 1000);

  /* --- хаптика --- */
  let hapT = 0;
  function haptic(now) {
    if (now - hapT < 70) return; hapT = now;
    try { const W = window.WebApp; if (W && W.HapticFeedback && W.HapticFeedback.impactOccurred) W.HapticFeedback.impactOccurred('soft'); else if (navigator.vibrate) navigator.vibrate(6); } catch (e) {}
  }

  let hintT = 0, hintGone = false;
  function tap(cx, cy) {
    if (S.energy < 1) return;
    const now = performance.now();
    S.combo = (window.__holdCombo && S.combo > 0) || now - S.last < COMBO_MS ? S.combo + 1 : 1; S.last = now;
    const prev = S.mult; S.mult = S.combo >= 50 ? 2 : S.combo >= 20 ? 1.5 : 1;
    const gain = S.power * S.mult; S.energy -= 1; S.coins += gain; S.taps++;
    window.__taps = (window.__taps || 0) + 1; window.__tapCount = window.__taps;
    const x = cx - appRect.left, y = cy - appRect.top;
    squash(x);
    haptic(now);
    comboOnTap();
    if (S.mult > prev) thresholdFlash(S.mult);
    if (!hintGone) { hintGone = true; el.hint.classList.add('gone'); }
    clearTimeout(hintT); hintT = setTimeout(() => { hintGone = false; el.hint.classList.remove('gone'); }, 5000);
    energyDirty();
    onTap({ x, y, gain, mult: S.mult, tier: tierOf(S.mult), combo: S.combo, now });
  }


  /* --- эволюции: уровень, стадия, демо-переключатель --- */
  const E = { pet: 'raccoon', level: 7 };
  function paintPlate() {
    const stg = stageOf(E.level);
    el.lvlN.textContent = E.level;
    el.lvlName.textContent = stageName(E.pet, stg);
    el.lvlLab.textContent = 'ур. ' + E.level;
    el.lvlPlate.classList.toggle('long', stageName(E.pet, stg).length > 12);
    el.stgLab.textContent = 'стадия ' + stg + '/6';
    el.demoPets.querySelectorAll('[data-pet]').forEach(b => b.classList.toggle('on', b.dataset.pet === E.pet));
  }
  function playEvolve() {
    if (RM) return;
    el.evoFlash.animate([{ opacity: 0 }, { opacity: .85, offset: .18 }, { opacity: 0 }], { duration: 480, easing: 'ease-out' });
    el.wrap.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.07)', offset: .32 },
      { transform: 'scale(.985)', offset: .64 },
      { transform: 'scale(1)' }
    ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  async function applyEvo({ pet = E.pet, level = E.level, evolve = false } = {}) {
    const nextPet = PETS[pet] ? pet : 'raccoon';
    const nextLv = Math.max(1, Math.min(LEVEL_MAX, level | 0));
    const prevSt = stageOf(E.level);
    const nextSt = stageOf(nextLv);
    const petChanged = nextPet !== E.pet;
    const stChanged = nextSt !== prevSt || petChanged;
    E.pet = nextPet; E.level = nextLv;
    if (stChanged) {
      await st.show(E.pet, nextSt);
      layout();
      if (evolve && nextSt > prevSt && !petChanged) playEvolve();
      if (petChanged) st.preload(E.pet);
    }
    paintPlate();
  }
  PET_ORDER.forEach(id => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.pet = id; b.textContent = PETS[id].label;
    b.addEventListener('click', () => applyEvo({ pet: id }));
    el.demoPets.appendChild(b);
  });
  $('stgPrev').addEventListener('click', () => {
    const s = Math.max(1, stageOf(E.level) - 1);
    applyEvo({ level: firstLevelOf(s) });
  });
  $('stgNext').addEventListener('click', () => {
    const s = Math.min(6, stageOf(E.level) + 1);
    applyEvo({ level: firstLevelOf(s), evolve: s > stageOf(E.level) });
  });
  el.btnUp.addEventListener('click', () => {
    if (E.level >= LEVEL_MAX) return;
    applyEvo({ level: E.level + 1, evolve: stageOf(E.level + 1) > stageOf(E.level) });
  });
  // Плашка уровня тоже листает уровень в демо (по кругу с 30 на 1 — без вспышки эволюции).
  el.lvlPlate.style.cursor = 'pointer';
  el.lvlPlate.title = 'Демо: следующий уровень';
  el.lvlPlate.addEventListener('click', () => {
    const n = E.level >= LEVEL_MAX ? 1 : E.level + 1;
    applyEvo({ level: n, evolve: n > E.level && stageOf(n) > stageOf(E.level) });
  });
  paintPlate();
  window.__evo = {
    get pet() { return E.pet; }, get level() { return E.level; }, get stage() { return stageOf(E.level); },
    set: opts => applyEvo(opts)
  };

  layout();
  addEventListener('resize', () => { hitC = st.hit(); layout(); });

  window.__S = S;
  const ctx = { el, st, S, get balXY() { return balXY; }, get head() { return head; }, get appRect() { return appRect; }, tap };
  window.__petCenter = () => { const h = st.hit(); return { x: h.x, y: h.y }; };
  window.__measure = () => st.measure();
  window.__yaw = () => st.yaw;
  st.onSpinSettle = () => layout();
  onReady && onReady(ctx);
  document.documentElement.dataset.ready = '1';
  return ctx;
}
