// Эволюции питомцев: 4 стихии × 6 стадий. Пороги уровня и загрузка GLB (с кешем).
import { webglOK } from './webgl.js';

export const PETS = {
  raccoon:  { id: 'raccoon',  label: 'Енот',     halo: [140, 200, 255],
    names: ['Снежок', 'Иней', 'Льдинка', 'Морозко', 'Вьюжка', 'Снежная Звёздочка'] },
  capybara: { id: 'capybara', label: 'Капибара', halo: [150, 210, 100],
    names: ['Росточек', 'Листик', 'Веточка', 'Бутончик', 'Цветик', 'Мандариновый Цвет'] },
  dragon:   { id: 'dragon',   label: 'Дракон',   halo: [255, 140, 50],
    names: ['Искорка', 'Уголёк', 'Огонёк', 'Пламенчик', 'Жарик', 'Солнечный Дракоша'] },
  goose:    { id: 'goose',    label: 'Гусь',     halo: [160, 190, 255],
    names: ['Ветерок', 'Облачко', 'Пёрышко', 'Бриз', 'Небесный', 'Облачный Ангел'] }
};
export const PET_ORDER = ['raccoon', 'capybara', 'dragon', 'goose'];

// Стадия по уровню питомца: 1–4, 5–9, 10–14, 15–19, 20–24, 25+.
export const STAGE_AT = [1, 5, 10, 15, 20, 25];
export const LEVEL_MIN = 1, LEVEL_MAX = 25;

export function stageOf(level) {
  const lv = Math.max(LEVEL_MIN, Math.floor(level) || 1);
  for (let i = STAGE_AT.length - 1; i >= 0; i--) if (lv >= STAGE_AT[i]) return i + 1;
  return 1;
}
export function firstLevelOf(stage) {
  return STAGE_AT[Math.max(0, Math.min(5, stage - 1))];
}
export function stageName(pet, stage) {
  const p = PETS[pet] || PETS.raccoon;
  return p.names[Math.max(0, Math.min(5, stage - 1))];
}
export function evoUrl(pet, stage) {
  const root = (document.documentElement.dataset.root || './').replace(/\/?$/, '/');
  return `${root}models/evo/${pet}/${pet}_stage_${stage}.glb`;
}

// Несжатые размеры GLB — для прогресса, когда Content-Length сжат (как в магазине BYTES).
export const EVO_BYTES = {
  'capybara:1': 73168, 'capybara:2': 136572, 'capybara:3': 194968, 'capybara:4': 311812, 'capybara:5': 540836, 'capybara:6': 775204,
  'dragon:1': 110336, 'dragon:2': 153752, 'dragon:3': 227768, 'dragon:4': 371936, 'dragon:5': 414236, 'dragon:6': 576384,
  'goose:1': 72312, 'goose:2': 137808, 'goose:3': 235416, 'goose:4': 279892, 'goose:5': 447260, 'goose:6': 592408,
  'raccoon:1': 96656, 'raccoon:2': 204004, 'raccoon:3': 268928, 'raccoon:4': 436032, 'raccoon:5': 611324, 'raccoon:6': 855332
};

const cache = new Map();
const inflight = new Map();
let loader = null, loaderP = null;
function getLoader() {
  if (!webglOK()) return Promise.reject(new Error('WebGL unavailable'));
  if (loader) return Promise.resolve(loader);
  if (loaderP) return loaderP;
  loaderP = import('../lib/addons/loaders/GLTFLoader.js?v=tc11132310')
    .then(m => { loader = new m.GLTFLoader(); return loader; })
    .catch(err => { loaderP = null; throw err; });
  return loaderP;
}

function notify(fn, v) { if (fn) try { fn(v); } catch (e) {} }

// Плавная оценка до cap, пока неизвестен total (не прыгает назад).
function estimateTo(fn, cap = .9, tau = 1200) {
  let t0 = performance.now(), id = 0, stop = false;
  const tick = now => {
    if (stop) return;
    notify(fn, Math.max(.02, cap * (1 - Math.exp(-(now - t0) / tau))));
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => { stop = true; if (id) cancelAnimationFrame(id); };
}

async function readGlb(url, key, onProgress) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const enc = (r.headers.get('content-encoding') || '').toLowerCase();
  const cl = +r.headers.get('content-length') || 0;
  const total = EVO_BYTES[key] || ((!enc || enc === 'identity') ? cl : 0);
  if (!r.body || !r.body.getReader || !total) {
    const stop = estimateTo(onProgress, .9, 1200);
    try { return await r.arrayBuffer(); }
    finally { stop(); notify(onProgress, .9); }
  }
  const rd = r.body.getReader(), parts = [];
  let got = 0;
  notify(onProgress, .01);
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    parts.push(value);
    got += value.byteLength;
    notify(onProgress, .9 * Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  notify(onProgress, .9);
  return out.buffer;
}


function prep(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || !m.emissive) continue;
      const em = m.emissive.r + m.emissive.g + m.emissive.b;
      if (em <= 0) continue;
      const ring = /ring/i.test(m.name || '') || /ring/i.test(o.name || '');
      // KHR_materials_emissive_strength может уже выставить intensity; иначе чуть усиливаем.
      if (!(m.emissiveIntensity > 1)) m.emissiveIntensity = ring ? 1.7 : 1.2;
      if (ring) m.toneMapped = false;
    }
  });
  return root;
}

export function loadEvo(pet, stage, onProgress) {
  const key = pet + ':' + stage;
  if (cache.has(key)) { notify(onProgress, .95); return Promise.resolve(cache.get(key)); }
  if (inflight.has(key)) {
    const rec = inflight.get(key);
    if (onProgress) rec.fns.add(onProgress);
    return rec.p.finally(() => { if (onProgress) rec.fns.delete(onProgress); });
  }
  const fns = new Set();
  if (onProgress) fns.add(onProgress);
  const fanout = v => { for (const f of fns) notify(f, v); };
  const path = evoUrl(pet, stage);
  const p = getLoader()
    .then(L => readGlb(path, key, fanout).then(buf => L.parseAsync(buf, path.replace(/[^/]+$/, ''))))
    .then(g => {
      fanout(.92);
      const root = prep(g.scene);
      cache.set(key, root);
      inflight.delete(key);
      fanout(.95);
      return root;
    })
    .catch(err => { inflight.delete(key); throw err; });
  inflight.set(key, { p, fns });
  return p;
}

// Стадии нужно передавать явно: без списка ничего не качаем (раньше по умолчанию
// уходили все 6 стадий ~1 МиБ). На главной — только текущая и следующая.
export function nearbyEvoStages(stage) {
  const n = Math.max(1, Math.min(6, stage | 0));
  return n < 6 ? [n, n + 1] : [n];
}
export function preloadEvo(pet, stages) {
  if (!webglOK() || !Array.isArray(stages) || !stages.length) return Promise.resolve([]);
  return Promise.all(stages.map(s => loadEvo(pet, s).catch(() => null)));
}

export function scheduleNearbyPreload(pet, stage) {
  const stages = nearbyEvoStages(stage);
  const run = () => preloadEvo(pet, stages);
  const kick = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 200);
  };
  if (document.readyState === 'complete') kick();
  else addEventListener('load', kick, { once: true });
}
