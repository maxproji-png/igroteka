// Тапыши · первый вход: общий код выбора персонажа (варианты A/B/C).
import { petStage } from '../pet/stage.js?v=tc11151810';
import { PETS, PET_ORDER, preloadEvo } from '../pet/evo.js?v=tc11151810';
import { getPlayerNick } from '../shared/nick.js?v=tc11151810';

export const V = 'tc11151810';

export const PICKS = PET_ORDER.map(id => {
  const p = PETS[id];
  const el = { raccoon: ['Лёд', 'ice'], capybara: ['Природа', 'nature'], dragon: ['Огонь', 'fire'], goose: ['Ветер', 'wind'] }[id];
  return {
    id,
    label: id === 'dragon' ? 'Дракончик' : p.label,
    el: el[0],
    elId: el[1]
  };
});

const EL_ICON = {
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v18M5.5 7.2 18.5 16.8M18.5 7.2 5.5 16.8M4 12h16"/></svg>',
  nature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20c8-1 11-8 11-16 0 0-9 1-11 12"/><path d="M5 20c2-5 6-7 11-8"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c4 0 6-3 6-6 0-4-3-7-3-7s0 3-2 4c0-5-3-8-3-8s-4 5-4 10c0 3.2 2 7 6 7z"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10h11a3 3 0 1 0-3-3"/><path d="M4 14h13a3 3 0 1 1-3 3"/><path d="M4 18h7"/></svg>'
};

export function inviteCopy() {
  const q = new URLSearchParams(location.search);
  const name = (q.get('inviter') || q.get('ref') || '').trim();
  const clan = (q.get('clan') || '').trim();
  const sp = q.get('startapp') || q.get('start_param') || '';
  if (name && clan) return name + ' зовёт тебя в клан «' + clan + '»';
  if (name) return name + ' зовёт тебя в Тапышей';
  if (clan) return 'Тебя зовут в клан «' + clan + '»';
  if (/^clan_/.test(sp)) return 'Тебя зовут в клан';
  if (/^(ref_|game_)/.test(sp)) return 'Тебя зовут в Тапышей';
  return '';
}

export function paintInvite(root) {
  const el = root.querySelector('.invite');
  if (!el) return;
  const t = inviteCopy();
  if (!t) { el.classList.remove('on'); el.hidden = true; el.textContent = ''; document.body.classList.remove('has-invite'); return; }
  el.innerHTML = '<span class="dot"></span><span>' + t + '</span>';
  el.hidden = false;
  el.classList.add('on');
  document.body.classList.add('has-invite');
}

export function elChip(elId, label) {
  return '<span class="el el-' + elId + '">' + (EL_ICON[elId] || '') + label + '</span>';
}

export function goHome(pet) {
  getPlayerNick(pet);
  const data = { fresh: true, pet: pet };
  try { sessionStorage.setItem('tapyshi.start', JSON.stringify(data)); } catch (e) {}
  const q = new URLSearchParams();
  q.set('fresh', '1');
  q.set('pet', pet);
  const root = (document.documentElement.dataset.root || '../').replace(/\/?$/, '/');
  location.href = root + 'index.html?' + q.toString();
}

export function choose(pet) {
  goHome(pet);
}

export async function mountPet(canvas, opts) {
  opts = opts || {};
  const st = await petStage({
    canvas,
    pet: opts.pet || 'raccoon',
    stage: 1,
    yaw: opts.yaw != null ? opts.yaw : .32,
    petInput: false,
    fit: opts.fit || 'app',
    padTop: opts.padTop != null ? opts.padTop : 8,
    padBottom: opts.padBottom != null ? opts.padBottom : 10
  });
  return st;
}

export function preloadBabies() {
  return Promise.all(PET_ORDER.map(id => preloadEvo(id, [1]).catch(() => null)));
}

export function bindPick(btn, getPet) {
  if (!btn) return;
  btn.addEventListener('click', () => choose(getPet()));
}

export function markReady() {
  document.body.classList.add('ready');
  window.__startReady = true;
}

function paintSpecies(root, p) {
  const nameEl = root.querySelector('[data-name]');
  const kindEl = root.querySelector('[data-kind]');
  const elWrap = root.querySelector('[data-el]');
  if (nameEl) nameEl.textContent = p.label;
  if (kindEl) { kindEl.textContent = ''; kindEl.hidden = true; }
  if (elWrap) elWrap.innerHTML = elChip(p.elId, p.el);
}

async function waitLayout() {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function bindRelayout(st, host) {
  const refit = () => st.relayout();
  addEventListener('resize', refit);
  requestAnimationFrame(refit);
  setTimeout(refit, 80);
  setTimeout(refit, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  if (host && window.ResizeObserver) new ResizeObserver(refit).observe(host);
  return refit;
}

/* ---------- вариант A: карусель ---------- */
export async function initA(root) {
  paintInvite(root);
  const view = root.querySelector('.view');
  const canvas = view.querySelector('canvas.scene');
  const dots = root.querySelector('.dots');
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  let i = 0;
  const qPet = new URLSearchParams(location.search).get('pet');
  if (PETS[qPet]) i = Math.max(0, PICKS.findIndex(p => p.id === qPet));

  PICKS.forEach((p, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', p.label);
    if (n === i) b.classList.add('on');
    b.addEventListener('click', () => go(n - i));
    dots.appendChild(b);
  });

  function paint() {
    paintSpecies(root, PICKS[i]);
    [...dots.children].forEach((b, n) => b.classList.toggle('on', n === i));
    prev.disabled = false;
    next.disabled = false;
  }

  // Сначала собираем шапку/подвал (вид, точки, стихия), потом ставим сцену —
  // иначе первый кадр сажает питомца ниже, а после свайпа place() поднимает его.
  paint();
  view.classList.add('loading');
  await waitLayout();
  const st = await mountPet(canvas, { pet: PICKS[i].id, fit: 'app' });
  st.relayout();
  bindRelayout(st, view);
  view.classList.remove('loading');
  preloadBabies();

  async function go(dir) {
    i = (i + dir + PICKS.length) % PICKS.length;
    paint();
    await st.show(PICKS[i].id, 1);
    st.relayout();
  }
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  bindPick(root.querySelector('[data-pick]'), () => PICKS[i].id);

  let x0 = 0, y0 = 0, t0 = 0;
  view.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); }, { passive: true });
  view.addEventListener('pointerup', e => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (Date.now() - t0 > 800) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });
  addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  window.__startStage = st;
  markReady();
  return st;
}

/* ---------- вариант B: превью + сетка ---------- */
export async function initB(root) {
  paintInvite(root);
  const preview = root.querySelector('.preview');
  const canvas = preview.querySelector('canvas.scene');
  const grid = root.querySelector('.grid');
  let i = 0;
  const qPet = new URLSearchParams(location.search).get('pet');
  if (PETS[qPet]) i = Math.max(0, PICKS.findIndex(p => p.id === qPet));

  PICKS.forEach((p, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card spring' + (n === i ? ' on' : '');
    b.dataset.id = p.id;
    b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
    b.innerHTML = '<span class="pic"><img src="../../games/shared/pets/' + p.id + '_happy.webp" alt=""></span><b>' + p.label + '</b><small>' + p.el + '</small>';
    b.addEventListener('click', () => select(n));
    grid.appendChild(b);
  });

  function paint() {
    paintSpecies(root, PICKS[i]);
    grid.querySelectorAll('.card').forEach((b, n) => {
      b.classList.toggle('on', n === i);
      b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
    });
  }
  paint();
  preview.classList.add('loading');
  await waitLayout();
  const st = await mountPet(canvas, { pet: PICKS[i].id, fit: 'host', padTop: 4, padBottom: 18 });
  preview.classList.remove('loading');
  preloadBabies();
  bindRelayout(st, preview);

  async function select(n) {
    if (n === i) return;
    i = n;
    paint();
    preview.classList.add('loading');
    await st.show(PICKS[i].id, 1);
    preview.classList.remove('loading');
  }
  bindPick(root.querySelector('[data-pick]'), () => PICKS[i].id);
  markReady();
  return st;
}

/* ---------- вариант C: все на площадке ---------- */
const YAWS = [-.38, -.14, .14, .38];

export async function initC(root) {
  paintInvite(root);
  const stage = root.querySelector('.stage');
  const line = root.querySelector('.line');
  const pick = root.querySelector('[data-pick]');
  const hint = root.querySelector('.hint-c');
  pick.disabled = true;
  let i = -1;
  const qPet = new URLSearchParams(location.search).get('pet');
  const stages = [];

  PICKS.forEach((p, n) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.id = p.id;
    slot.setAttribute('aria-label', p.label);
    const cv = document.createElement('canvas');
    cv.className = 'scene';
    slot.appendChild(cv);
    slot.addEventListener('click', () => select(n));
    line.appendChild(slot);
  });

  const slots = [...line.querySelectorAll('.slot')];
  await waitLayout();
  for (let n = 0; n < PICKS.length; n++) {
    const st = await mountPet(slots[n].querySelector('canvas.scene'), {
      pet: PICKS[n].id, yaw: YAWS[n], fit: 'host', padTop: 4, padBottom: 18
    });
    stages.push(st);
  }

  function relayoutAll() {
    stages.forEach(s => s.relayout());
  }
  requestAnimationFrame(relayoutAll);
  setTimeout(relayoutAll, 80);
  setTimeout(relayoutAll, 400);
  addEventListener('resize', relayoutAll);

  function paint() {
    const on = i >= 0;
    document.body.classList.toggle('is-on', on);
    stage.classList.toggle('picked', on);
    slots.forEach((s, n) => s.classList.toggle('on', n === i));
    if (!on) {
      hint.hidden = false;
      pick.disabled = true;
      return;
    }
    hint.hidden = true;
    paintSpecies(root, PICKS[i]);
    pick.disabled = false;
  }
  function select(n) {
    if (n === i) return;
    i = n;
    paint();
    const after = () => { relayoutAll(); };
    slots[n].addEventListener('transitionend', after, { once: true });
    setTimeout(after, 480);
    requestAnimationFrame(() => requestAnimationFrame(relayoutAll));
  }
  paint();
  if (PETS[qPet]) select(Math.max(0, PICKS.findIndex(p => p.id === qPet)));
  bindPick(pick, () => PICKS[i].id);
  markReady();
  return stages;
}

const boot = { a: initA, b: initB, c: initC };
const v = document.body.dataset.var;
if (boot[v]) {
  const app = document.querySelector('.app');
  boot[v](app).catch(err => { console.error(err); window.__startReady = true; });
}
