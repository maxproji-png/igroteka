// Тапыши · tap-feel · общее ядро: состояние, комбо (вариант A), пружины, спрайты монет, один rAF-цикл.
// Цикл крутится только пока есть что анимировать; в покое — 0 кадров работы.
import { petStage } from './stage.js';
import { PETS, PET_ORDER, stageOf, firstLevelOf, stageName, LEVEL_MAX } from './evo.js';
import { getPlayerNick } from '../shared/nick.js';

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const S = { coins: 12000, energy: 330, max: 330, power: 1, combo: 0, mult: 1, last: 0, taps: 0 };
export function readStart() {
  const q = new URLSearchParams(location.search);
  const fresh = q.get('fresh') === '1' || q.get('start') === '1';
  if (!fresh) return { fresh: false, pet: 'raccoon' };
  let pet = q.get('pet') || '';
  try {
    const raw = sessionStorage.getItem('tapyshi.start');
    const s = raw ? JSON.parse(raw) : null;
    if (s && s.fresh && !PETS[pet] && PETS[s.pet]) pet = s.pet;
  } catch (e) {}
  if (!PETS[pet]) pet = 'raccoon';
  return { fresh: true, pet };
}
export const START = readStart();
if (START.fresh) { S.coins = 0; S.energy = 300; S.max = 300; }
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
export function coinSrc(cssPx = 48) {
  const dpr = Math.min(3, Math.max(1, Math.round(SDPR || (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 2))));
  let base = 48;
  if (cssPx <= 20) base = 16;
  else if (cssPx <= 32) base = 24;
  else if (cssPx <= 64) base = 48;
  else base = 96;
  return new URL('../shared/coin/png/coin-' + base + '@' + dpr + 'x.png', import.meta.url).href;
}
export function coinCanvas(size = 64, dpr = SDPR) {
  /* оставлено для совместимости: летающие монеты и HUD берут PNG через coinSrc */
  return { _src: coinSrc(size) };
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
  <div class="pet-wrap" id="petWrap"><canvas class="scene"></canvas><span class="pet-load" id="petLoad" aria-live="polite" aria-label="Загружаем"><i class="pet-load-sh"></i><i class="pet-load-r"></i><b>Загружаем<span class="pet-load-pc"></span></b><i class="pet-load-bar"><i></i></i></span></div>
  <div class="hud">
    <div class="top">
      <div class="pill card bal" id="bal"><span class="cico" id="balIco"></span><span class="num" id="balNum"></span></div>
      <div class="enw"><div class="pill card"><svg class="ic"><use href="#i-bolt"/></svg><span class="num" id="enNum"></span><span class="bar"><i id="enBar"></i></span></div></div>
    </div>
    <div class="side">
      <button class="rb card pe" type="button" id="btnTasks" aria-label="Задания"><svg class="ic"><use href="#i-tasks"/></svg><span class="dot n">2</span></button>
      <button class="rb card pe" type="button" id="btnReward" aria-label="Награда"><svg class="ic"><use href="#i-gift"/></svg><span class="dot"></span></button>
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
      <div class="lvl card pe" id="lvlPlate"><span class="st"><svg><use href="#i-star"/></svg><b id="lvlN">7</b></span><span class="lvl-txt"><span id="playerNick" class="pnick" hidden></span><span class="species"><span id="lvlName">Иней</span> <small id="lvlLab">ур. 7</small></span></span></div>
      <button class="up pe" id="btnUp" type="button"><svg class="ic"><use href="#i-up"/></svg>Улучшить</button>
    </div>
  </div>
  <div class="evo-flash" id="evoFlash"></div>
  <div class="flash" id="flash"><div class="glow"></div><div class="big">×1,5!</div><div class="sub">Монеты ×1,5</div></div>
  <div class="flash x2" id="flash2"><div class="glow"></div><div class="big">×2!</div><div class="sub">Двойные монеты</div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;


/* ---------------- загрузка питомца (стиль магазина: «Загружаем», %, полоска только растёт) ---------------- */
const LOAD_DELAY = 250, LOAD_MIN = 400, LOAD_FADE = 280;
function bindPetLoader(el) {
  const box = el.petLoad, hint = el.hint, wrap = el.wrap;
  let shownAt = 0, done = false, lastPc = -1;
  const log = [];
  const stamp = (ev, extra) => {
    const rec = Object.assign({ t: Math.round(performance.now()), ev, pc: lastPc, loader: !!(box && box.classList.contains('on') && !box.classList.contains('out')), hint: !!(hint && hint.classList.contains('in') && !hint.classList.contains('gone')) }, extra || {});
    log.push(rec);
    window.__petLoad = { pc: Math.max(0, lastPc), shown: rec.loader, ready: ev === 'ready' || (window.__petLoad && window.__petLoad.ready), log };
  };
  const progress = p => {
    const pc = Math.max(0, Math.min(100, Math.floor((+p || 0) * 100)));
    if (pc < lastPc) return;
    lastPc = pc;
    if (!box) return;
    box.classList.add('has-pc');
    box.style.setProperty('--pc', pc + '%');
    const t = box.querySelector('.pet-load-pc');
    if (t) t.textContent = pc + '%';
    box.dataset.pc = String(pc);
    stamp('progress');
  };
  const showTimer = setTimeout(() => {
    if (done || !box) return;
    box.classList.add('on');
    shownAt = performance.now();
    stamp('loader-on');
  }, LOAD_DELAY);
  stamp('init');
  async function finish() {
    clearTimeout(showTimer);
    done = true;
    progress(1);
    if (!shownAt) {
      if (box) box.classList.remove('on');
      reveal();
      return;
    }
    const wait = Math.max(0, LOAD_MIN - (performance.now() - shownAt));
    if (wait) await new Promise(r => setTimeout(r, wait));
    if (box) {
      box.classList.add('out');
      stamp('loader-fade');
      await new Promise(r => setTimeout(r, LOAD_FADE));
      box.classList.remove('on');
    }
    reveal();
  }
  function reveal() {
    if (wrap) wrap.classList.add('is-ready');
    if (hint) { hint.classList.add('in'); hint.removeAttribute('aria-hidden'); }
    document.documentElement.dataset.pet = 'ready';
    stamp('ready');
  }
  document.documentElement.dataset.pet = 'loading';
  if (hint) hint.setAttribute('aria-hidden', 'true');
  window.__petLoad = { pc: 0, shown: false, ready: false, log };
  return { progress, finish, log };
}

/* ---------------- запуск ---------------- */
export async function startApp({ tag, onTap, onComboEnd, onReady, input = 'pet' }) {
  const app = document.querySelector('.app');
  app.insertAdjacentHTML('afterbegin', HUD);
  if (tag) app.insertAdjacentHTML('beforeend', `<div class="vtag">${tag}</div>`);
  const $ = id => document.getElementById(id);
  const el = { app, bal: $('bal'), balIco: $('balIco'), balNum: $('balNum'), enNum: $('enNum'), enBar: $('enBar'), combo: $('combo'), cn: $('cn'), cm: $('cm'), ct: $('ct'), hint: $('hint'), wrap: $('petWrap'), flash: $('flash'), flash2: $('flash2'), evoFlash: $('evoFlash'), lvlPlate: $('lvlPlate'), lvlN: $('lvlN'), lvlName: $('lvlName'), lvlLab: $('lvlLab'), stgLab: $('stgLab'), btnUp: $('btnUp'), btnTasks: $('btnTasks'), btnReward: $('btnReward'), demo: $('demo'), demoPets: $('demoPets'), playerNick: $('playerNick'), toast: $('toast'), petLoad: $('petLoad') };
  const ico = new Image(); ico.alt = ''; ico.src = coinSrc(24); el.balIco.appendChild(ico);
  el.balNum.textContent = fmt(S.coins);

  // защита от зума/выделения/меню
  addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  addEventListener('contextmenu', e => e.preventDefault());

  let appRect = app.getBoundingClientRect();
  const canvas = app.querySelector('canvas.scene');
  if (START.fresh) document.body.classList.add('is-fresh');
  const loadUi = bindPetLoader(el);
  let st;
  try {
    st = await petStage({ canvas, onTap: e => tap(e.clientX, e.clientY), petInput: input !== 'zone', pet: START.pet, stage: START.fresh ? 1 : stageOf(7), onProgress: p => loadUi.progress(p) });
  } catch (e) {
    console.warn('Сцена питомца не поднялась', e);
    try { await loadUi.finish(); } catch (err) {}
    throw e;
  }
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
    const hp = st.toScreen(.62, .55, .2);
    const hw = Math.max(el.hint.offsetWidth || 0, 118);
    const hx = hp.x - appRect.left, hy = hp.y - appRect.top;
    const bot = el.btnUp || el.lvlPlate || app.querySelector('.bottom');
    const botTop = bot ? bot.getBoundingClientRect().top - appRect.top : (appRect.height || 844) - 160;
    el.hint.style.left = Math.max(hw / 2 + 10, Math.min(appRect.width - hw / 2 - 10, hx)) + 'px';
    el.hint.style.top = Math.max(72, Math.min(botTop - 48, hy)) + 'px';
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


  /* --- тост и шторки заданий / ежедневной награды --- */
  let toastA = null;
  function toast(text) {
    if (!el.toast) return;
    el.toast.textContent = text;
    if (toastA) toastA.cancel();
    toastA = el.toast.animate(
      [{ opacity: 0, transform: 'translate(-50%,20px)' }, { opacity: 1, transform: 'translate(-50%,0)', offset: .12 }, { opacity: 1, transform: 'translate(-50%,0)', offset: .85 }, { opacity: 0, transform: 'translate(-50%,8px)' }],
      { duration: 1900, easing: 'ease-out' }
    );
  }
  function closeSheet() {
    document.body.classList.remove('has-sheet', 'is-sheet');
    document.querySelectorAll('.home-sheet, .home-sheet-bg').forEach(n => {
      n.classList.remove('on');
      setTimeout(() => n.remove(), 420);
    });
  }
  function openSheet(title, bodyHtml) {
    closeSheet();
    const bg = document.createElement('div');
    bg.className = 'sheet-bg home-sheet-bg';
    bg.addEventListener('click', closeSheet);
    const sh = document.createElement('div');
    sh.className = 'sheet home-sheet';
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-label', title);
    sh.innerHTML = '<div class="grab"></div><button type="button" class="home-x" data-close aria-label="Закрыть">×</button><h2>' + title + '</h2>' + bodyHtml;
    document.body.appendChild(bg);
    document.body.appendChild(sh);
    document.body.classList.add('has-sheet');
    requestAnimationFrame(() => { bg.classList.add('on'); sh.classList.add('on'); });
    sh.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
    sh.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => {
      const name = b.getAttribute('data-claim') || 'Награда';
      b.disabled = true; b.textContent = 'Получено';
      const row = b.closest('.trow, .day');
      if (row) row.classList.add('done');
      toast(name + ' получена');
      if (el.btnReward) { const d = el.btnReward.querySelector('.dot'); if (d && !d.classList.contains('n')) d.remove(); }
      if (el.btnTasks && name.indexOf('монет') !== -1) {
        const badge = el.btnTasks.querySelector('.dot.n');
        if (badge) { const n = Math.max(0, (+badge.textContent || 1) - 1); badge.textContent = n; if (!n) badge.remove(); }
      }
    }));
  }
  const TASKS_HTML = `
    <p class="sheet-sub">Выполняй и забирай монеты</p>
    <div class="trow ready" data-task="games">
      <div class="tinfo"><b>Зайди в игры</b><span>Открой вкладку «Игры»</span></div>
      <button type="button" class="btn btn--success btn--s" data-claim="Награда 50 монет">+50</button>
    </div>
    <div class="trow">
      <div class="tinfo"><b>Сделай 20 тапов</b><span>12 из 20</span></div>
      <div class="tbar"><i style="width:60%"></i></div>
    </div>`;
  const REWARD_HTML = `
    <p class="sheet-sub">Заходи каждый день — награда растёт</p>
    <div class="days">
      ${[1,2,3,4,5,6,7].map(d => {
        const st = d < 3 ? 'done' : d === 3 ? 'ready' : '';
        const lab = d === 7 ? '×2' : '+' + (d * 20);
        const btn = d === 3 ? '<button type="button" class="btn btn--success btn--s" data-claim="Ежедневная награда">Забрать</button>' : '';
        return '<div class="day ' + st + '"><span class="dn">день ' + d + '</span><b>' + lab + '</b>' + btn + '</div>';
      }).join('')}
    </div>`;
  if (el.btnTasks) el.btnTasks.addEventListener('click', () => openSheet('Задания', TASKS_HTML));
  if (el.btnReward) el.btnReward.addEventListener('click', () => openSheet('Награда', REWARD_HTML));

  /* --- эволюции: уровень, стадия, демо-переключатель --- */
  const E = { pet: START.pet, level: START.fresh ? 1 : 7 };
  const SPECIES = { raccoon: 'Енот', capybara: 'Капибара', dragon: 'Дракончик', goose: 'Гусь' };
  function plateName(stg) {
    if (START.fresh) return SPECIES[E.pet] || PETS[E.pet].label;
    return stageName(E.pet, stg);
  }
  function paintPlate() {
    const stg = stageOf(E.level);
    const nm = plateName(stg);
    el.lvlN.textContent = E.level;
    el.lvlName.textContent = nm;
    el.lvlLab.textContent = 'ур. ' + E.level;
    if (START.fresh && el.playerNick) {
      el.playerNick.hidden = false;
      el.playerNick.textContent = getPlayerNick(START.pet);
    }
    el.lvlPlate.classList.toggle('long', !START.fresh && nm.length > 12);
    el.lvlPlate.classList.toggle('has-nick', START.fresh);
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
  if (START.fresh) {
    el.demo.hidden = true;
    el.btnUp.hidden = true;
  } else {
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
      if (E.level >= LEVEL_MAX) { toast('Уже максимальный уровень'); return; }
      const next = E.level + 1;
      applyEvo({ level: next, evolve: stageOf(next) > stageOf(E.level) });
      toast('Уровень ' + next);
    });
    // Плашка уровня тоже листает уровень в демо (по кругу с 30 на 1 — без вспышки эволюции).
    el.lvlPlate.style.cursor = 'pointer';
    el.lvlPlate.title = 'Демо: следующий уровень';
    el.lvlPlate.addEventListener('click', () => {
      const n = E.level >= LEVEL_MAX ? 1 : E.level + 1;
      applyEvo({ level: n, evolve: n > E.level && stageOf(n) > stageOf(E.level) });
    });
  }
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
  await loadUi.finish();
  layout();
  onReady && onReady(ctx);
  document.documentElement.dataset.ready = '1';
  return ctx;
}
